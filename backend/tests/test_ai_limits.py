from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import gemini
from app.ai.gemini import (
    AiConfigError,
    AiLimitError,
    AiSettings,
    generate_json,
    load_settings,
    reserve_call,
    start_of_google_day,
)
from app.db import Base
from app.enums import AiCallKind
from app.models import AiCall, User

AHORA = datetime(2026, 10, 8, 20, 0, tzinfo=timezone.utc)
AJUSTES = AiSettings(api_key="k", model="m", daily_limit=5, rpm_limit=2)


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(User(id=1, email="a@a", password_hash="x", name="t"))
        session.commit()
        yield session


def llamar(db, ahora=AHORA, ajustes=AJUSTES):
    return reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=ahora)


def test_la_llamada_queda_registrada_antes_de_hacerse(db):
    llamar(db)
    filas = db.query(AiCall).all()
    assert len(filas) == 1
    assert filas[0].succeeded is None  # todavía no se hizo


def test_tope_por_minuto_no_deja_llamar(db):
    llamar(db)
    llamar(db)
    with pytest.raises(AiLimitError) as error:
        llamar(db)
    assert error.value.scope == "minute"
    assert db.query(AiCall).count() == 2  # la rechazada no se registra


def test_pasado_el_minuto_se_puede_volver_a_llamar(db):
    llamar(db)
    llamar(db)
    llamar(db, ahora=AHORA + timedelta(seconds=61))
    assert db.query(AiCall).count() == 3


def test_tope_diario(db):
    for minuto in range(5):
        llamar(db, ahora=AHORA + timedelta(minutes=minuto * 2))
    with pytest.raises(AiLimitError) as error:
        llamar(db, ahora=AHORA + timedelta(minutes=12))
    assert error.value.scope == "day"


def test_el_dia_se_reinicia_a_medianoche_del_pacifico():
    # 2026-10-08 20:00 UTC = 13:00 en el Pacífico (PDT, UTC-7): el día empezó a las 07:00 UTC.
    assert start_of_google_day(AHORA) == datetime(2026, 10, 8, 7, 0, tzinfo=timezone.utc)
    antes = AHORA.replace(hour=6, minute=0)  # 23:00 del día anterior en el Pacífico
    assert start_of_google_day(antes) == datetime(2026, 10, 7, 7, 0, tzinfo=timezone.utc)


def test_los_topes_cuentan_las_llamadas_de_todos_los_usuarios(db):
    db.add(User(id=2, email="b@b", password_hash="x", name="t2"))
    db.commit()
    reserve_call(db, 2, AiCallKind.GENERATE, AJUSTES, now=AHORA)
    reserve_call(db, 2, AiCallKind.GENERATE, AJUSTES, now=AHORA)
    with pytest.raises(AiLimitError):
        llamar(db)


def test_sin_configuracion_no_se_llama(monkeypatch):
    for nombre in ("GEMINI_API_KEY", "GEMINI_MODEL", "GEMINI_DAILY_LIMIT", "GEMINI_RPM_LIMIT"):
        monkeypatch.delenv(nombre, raising=False)
    with pytest.raises(AiConfigError):
        load_settings()


@pytest.mark.parametrize("valor", ["", "abc", "0", "-3"])
def test_topes_invalidos_se_rechazan(monkeypatch, valor):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("GEMINI_MODEL", "m")
    monkeypatch.setenv("GEMINI_RPM_LIMIT", "12")
    monkeypatch.setenv("GEMINI_DAILY_LIMIT", valor)
    with pytest.raises(AiConfigError):
        load_settings()


class ClienteFalso:
    def __init__(self, texto=None, error=None):
        self.llamadas = 0
        self._texto, self._error = texto, error
        self.interactions = self

    def create(self, **kwargs):
        self.llamadas += 1
        if self._error:
            raise self._error
        return type("R", (), {"output_text": self._texto})()


def entorno(monkeypatch, rpm="12", dia="400"):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setenv("GEMINI_MODEL", "m")
    monkeypatch.setenv("GEMINI_RPM_LIMIT", rpm)
    monkeypatch.setenv("GEMINI_DAILY_LIMIT", dia)


def test_generate_json_devuelve_el_texto_y_marca_la_llamada(db, monkeypatch):
    entorno(monkeypatch)
    cliente = ClienteFalso(texto='{"ok": true}')
    monkeypatch.setattr(gemini, "get_client", lambda api_key: cliente)

    assert generate_json(db, 1, AiCallKind.GENERATE, "hola", {}) == '{"ok": true}'
    assert db.query(AiCall).one().succeeded is True


def test_si_gemini_falla_la_llamada_queda_contada_como_fallida(db, monkeypatch):
    entorno(monkeypatch)
    cliente = ClienteFalso(error=RuntimeError("boom"))
    monkeypatch.setattr(gemini, "get_client", lambda api_key: cliente)

    with pytest.raises(RuntimeError):
        generate_json(db, 1, AiCallKind.GENERATE, "hola", {})
    assert db.query(AiCall).one().succeeded is False


def test_con_el_tope_alcanzado_no_se_toca_a_gemini(db, monkeypatch):
    entorno(monkeypatch, rpm="1")
    cliente = ClienteFalso(texto="{}")
    monkeypatch.setattr(gemini, "get_client", lambda api_key: cliente)

    generate_json(db, 1, AiCallKind.GENERATE, "a", {})
    with pytest.raises(AiLimitError):
        generate_json(db, 1, AiCallKind.GENERATE, "b", {})
    assert cliente.llamadas == 1


def test_el_modelo_de_ai_calls_no_borra_en_cascada():
    fk = next(iter(Base.metadata.tables["ai_calls"].c.user_id.foreign_keys))
    assert fk.ondelete == "RESTRICT"

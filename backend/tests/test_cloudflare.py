"""Cloudflare Workers AI como proveedor de generación (decisión 139). Nunca se llama de verdad."""

import json
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.ai import cloudflare, generate
from app.ai.cloudflare import CloudflareError, CloudflareSettings, response_text
from app.ai.gemini import (
    AiConfigError,
    AiLimitError,
    AiSettings,
    generate_json,
    load_provider,
    reserve_call,
)
from app.ai.routine import RoutineProposal
from app.ai.schema import strict_schema
from app.db import Base
from app.enums import AiCallKind
from app.models import AiCall, User
from tests.test_proposals import (  # noqa: F401  (fixtures y ayudantes compartidos)
    ELECCION,
    api,
    con_perfil,
    entorno,
    rutina,
    usar_gemini,
)

MODELO = "@cf/openai/gpt-oss-120b"


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


@pytest.fixture
def con_cloudflare(monkeypatch):
    for nombre, valor in {
        "AI_PROVIDER": "cloudflare",
        "CLOUDFLARE_ACCOUNT_ID": "cuenta",
        "CLOUDFLARE_API_TOKEN": "token",
        "CLOUDFLARE_MODEL": MODELO,
        "CLOUDFLARE_DAILY_LIMIT": "7",
        "CLOUDFLARE_RPM_LIMIT": "2",
    }.items():
        monkeypatch.setenv(nombre, valor)


def respuesta_openai(texto, finish="stop"):
    return {
        "success": True,
        "result": {
            "choices": [{"finish_reason": finish, "message": {"content": texto}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "neurons": 1.0},
        },
    }


class PostFalso:
    def __init__(self, *respuestas):
        self.respuestas = list(respuestas)
        self.pedidos = []

    def __call__(self, url, token, body, timeout):
        self.pedidos.append({"url": url, "token": token, "body": body, "timeout": timeout})
        respuesta = self.respuestas.pop(0)
        if isinstance(respuesta, Exception):
            raise respuesta
        return respuesta


# --- el proveedor ---


def test_sin_proveedor_no_se_llama(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    with pytest.raises(AiConfigError):
        load_provider()


def test_un_proveedor_desconocido_se_rechaza(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    with pytest.raises(AiConfigError):
        load_provider()


def test_sin_configuracion_de_cloudflare_no_se_llama_ni_se_registra(db, monkeypatch, con_cloudflare):
    monkeypatch.delenv("CLOUDFLARE_DAILY_LIMIT")
    post = PostFalso()
    monkeypatch.setattr(cloudflare, "post_json", post)
    with pytest.raises(AiConfigError):
        generate_json(db, 1, AiCallKind.GENERATE, "hola", {})
    assert post.pedidos == []
    assert db.query(AiCall).count() == 0


# --- el cliente ---


def test_cloudflare_devuelve_el_texto_y_marca_la_llamada(db, monkeypatch, con_cloudflare):
    post = PostFalso(respuesta_openai('{"ok": true}'))
    monkeypatch.setattr(cloudflare, "post_json", post)

    texto = generate_json(db, 1, AiCallKind.GENERATE, "hola", RoutineProposal.model_json_schema())

    assert texto == '{"ok": true}'
    llamada = db.query(AiCall).one()
    assert llamada.succeeded is True and llamada.model == MODELO
    pedido = post.pedidos[0]
    assert pedido["url"].endswith(f"/accounts/cuenta/ai/run/{MODELO}")
    assert pedido["token"] == "token"
    assert pedido["body"]["max_tokens"] == cloudflare.MAX_OUTPUT_TOKENS
    esquema = pedido["body"]["response_format"]["json_schema"]
    assert "$ref" not in json.dumps(esquema)


def test_si_cloudflare_falla_la_llamada_queda_contada_como_fallida(db, monkeypatch, con_cloudflare):
    monkeypatch.setattr(cloudflare, "post_json", PostFalso(CloudflareError("HTTP 429: cuota")))
    with pytest.raises(CloudflareError):
        generate_json(db, 1, AiCallKind.GENERATE, "hola", {})
    assert db.query(AiCall).one().succeeded is False


def test_el_corte_de_tiempo_no_pasa_del_maximo(db, monkeypatch, con_cloudflare):
    post = PostFalso(respuesta_openai("{}"), respuesta_openai("{}"))
    monkeypatch.setattr(cloudflare, "post_json", post)
    generate_json(db, 1, AiCallKind.GENERATE, "hola", {}, timeout_seconds=90)
    generate_json(db, 1, AiCallKind.GENERATE, "hola", {}, timeout_seconds=999)
    assert [p["timeout"] for p in post.pedidos] == [90, cloudflare.REQUEST_TIMEOUT_SECONDS]


def test_los_formatos_de_respuesta():
    assert response_text(respuesta_openai("hola")) == "hola"
    assert response_text({"success": True, "result": {"response": {"a": 1}}}) == '{"a": 1}'
    with pytest.raises(CloudflareError):
        response_text({"success": False, "errors": [{"message": "x"}]})
    with pytest.raises(CloudflareError):
        response_text(respuesta_openai(""))


def test_el_esquema_estricto_pide_todos_los_campos():
    esquema = strict_schema(RoutineProposal.model_json_schema())
    ejercicio = esquema["properties"]["days"]["items"]["properties"]["exercises"]["items"]
    assert "rest_seconds" in ejercicio["required"]
    assert set(ejercicio["required"]) == set(ejercicio["properties"])
    assert {"type": "null"} in ejercicio["properties"]["rest_seconds"]["anyOf"]


# --- los topes y el día ---


def test_el_dia_de_cloudflare_empieza_a_las_0_utc(db):
    ajustes = CloudflareSettings(account_id="c", api_token="t", model=MODELO, daily_limit=1, rpm_limit=5)
    # 23:30 UTC del 12: la llamada de las 00:10 del 13 ya es de otro día.
    reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=datetime(2026, 11, 12, 23, 30, tzinfo=timezone.utc))
    with pytest.raises(AiLimitError) as error:
        reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=datetime(2026, 11, 12, 23, 50, tzinfo=timezone.utc))
    assert error.value.reset_at == datetime(2026, 11, 13, 0, 0, tzinfo=timezone.utc)
    reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=datetime(2026, 11, 13, 0, 10, tzinfo=timezone.utc))


def test_el_tope_diario_de_gemini_dice_la_medianoche_del_pacifico(db):
    ajustes = AiSettings(api_key="k", model="m", daily_limit=1, rpm_limit=5)
    ahora = datetime(2026, 11, 12, 20, 0, tzinfo=timezone.utc)  # 12:00 en el Pacífico (PST, UTC-8)
    reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=ahora)
    with pytest.raises(AiLimitError) as error:
        reserve_call(db, 1, AiCallKind.GENERATE, ajustes, now=ahora)
    assert error.value.reset_at == datetime(2026, 11, 13, 8, 0, tzinfo=timezone.utc)


def test_el_tope_diario_manda_la_hora_de_reinicio(api, monkeypatch, con_cloudflare):
    monkeypatch.setenv("CLOUDFLARE_DAILY_LIMIT", "1")
    con_perfil(api)
    with api.session() as s:
        s.add(AiCall(user_id=None, kind=AiCallKind.GENERATE, model=MODELO))
        s.commit()

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 429
    assert respuesta.headers["X-Error-Code"] == "tope_dia"
    reinicio = datetime.fromisoformat(respuesta.headers["X-Reset-At"])
    assert reinicio.hour == 0 and reinicio.minute == 0 and reinicio.utcoffset().total_seconds() == 0


# --- el flujo completo con Cloudflare ---


def test_generar_con_cloudflare_guarda_la_propuesta(api, monkeypatch, con_cloudflare):
    con_perfil(api)
    post = PostFalso(respuesta_openai(json.dumps(rutina())))
    monkeypatch.setattr(cloudflare, "post_json", post)

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert len(post.pedidos) == 1
    with api.session() as s:
        assert s.scalars(select(AiCall.model)).one() == MODELO


class Reloj:
    """Reemplaza `time` en generate.py: cada lectura avanza lo que diga la lista."""

    def __init__(self, *lecturas):
        self.lecturas = list(lecturas)

    def monotonic(self):
        return self.lecturas.pop(0)


def test_sin_tiempo_para_otra_llamada_no_se_reintenta(api, entorno, monkeypatch):
    con_perfil(api)
    mala = {"days": []}  # no pasa Pydantic: pediría un reintento
    falso = usar_gemini(monkeypatch, mala, rutina())
    # Empieza en 0 y la primera respuesta llega a los 150 s: no entra otra de 150 antes de los 280.
    monkeypatch.setattr(generate, "time", Reloj(0.0, 150.0))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 502
    assert respuesta.headers["X-Error-Code"] == "reglas"
    assert falso.llamadas == 1


def test_con_tiempo_se_reintenta_con_el_tiempo_que_queda(api, monkeypatch, con_cloudflare):
    con_perfil(api)
    post = PostFalso(respuesta_openai('{"days": []}'), respuesta_openai(json.dumps(rutina())))
    monkeypatch.setattr(cloudflare, "post_json", post)
    monkeypatch.setattr(generate, "time", Reloj(0.0, 100.0))

    respuesta = api.post("/proposals/generate", json=ELECCION)

    assert respuesta.status_code == 201
    assert [p["timeout"] for p in post.pedidos] == [cloudflare.REQUEST_TIMEOUT_SECONDS, 180.0]

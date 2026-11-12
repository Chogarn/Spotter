import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registra las tablas)
from app.db import Base, get_db
from app.main import app

PERFIL = {
    "name": "Bruno",
    "age": 30,
    "weight_kg": "80.5",
    "height_cm": 178,
    "sex": None,
    "limitations": None,
    "accept_legal_notice": True, "accept_health_consent": True,
}


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)

    def override_get_db():
        with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_sin_perfil_devuelve_404(client):
    assert client.get("/profile").status_code == 404


def test_guardar_y_leer_el_perfil(client):
    response = client.put("/profile", json=PERFIL)
    assert response.status_code == 200

    guardado = client.get("/profile").json()
    assert guardado["name"] == "Bruno"
    assert "goal" not in guardado and "level" not in guardado and "equipment" not in guardado
    assert guardado["legal_notice_accepted"] is True


def test_guardar_de_nuevo_actualiza_sin_crear_otro(client):
    client.put("/profile", json=PERFIL)
    response = client.put("/profile", json={**PERFIL, "age": 31})

    assert response.status_code == 200
    assert response.json()["age"] == 31
    assert client.get("/profile").json()["age"] == 31


@pytest.mark.parametrize(
    "cambio",
    [
        {"age": 5},
        {"weight_kg": "500"},
        {"height_cm": 20},
        {"sex": "robot"},
        {"name": ""},
        {"accept_legal_notice": False},
    ],
)
def test_valores_invalidos_devuelven_422(client, cambio):
    assert client.put("/profile", json={**PERFIL, **cambio}).status_code == 422


def test_faltan_campos_obligatorios_devuelve_422(client):
    sin_edad = {k: v for k, v in PERFIL.items() if k != "age"}
    assert client.put("/profile", json=sin_edad).status_code == 422


# --- fecha de nacimiento: la edad se calcula ---------------------------------------------


def _fecha(anios_atras: int, dias_extra: int = 0):
    from datetime import date, timedelta

    hoy = date.today()
    try:
        base = hoy.replace(year=hoy.year - anios_atras)
    except ValueError:  # 29 de febrero
        base = hoy.replace(year=hoy.year - anios_atras, day=28)
    return base - timedelta(days=dias_extra)


def _con_fecha(fecha):
    sin_edad = {k: v for k, v in PERFIL.items() if k != "age"}
    return {**sin_edad, "birth_date": fecha.isoformat()}


def test_la_edad_se_calcula_desde_la_fecha(client):
    # Cumplió 30 hace una semana.
    response = client.put("/profile", json=_con_fecha(_fecha(30, dias_extra=7)))

    assert response.status_code == 200
    assert response.json()["age"] == 30
    leido = client.get("/profile").json()
    assert leido["age"] == 30
    assert leido["birth_date"] == _fecha(30, dias_extra=7).isoformat()


def test_la_edad_no_sube_hasta_el_cumpleanos(client):
    # Cumple 31 dentro de una semana: todavía tiene 30.
    from datetime import timedelta

    fecha = _fecha(31) + timedelta(days=7)
    client.put("/profile", json=_con_fecha(fecha))

    assert client.get("/profile").json()["age"] == 30


@pytest.mark.parametrize("anios", [5, 13, 17, 101, 120])
def test_la_fecha_fuera_de_rango_devuelve_422(client, anios):
    assert client.put("/profile", json=_con_fecha(_fecha(anios))).status_code == 422


def test_una_fecha_futura_devuelve_422(client):
    from datetime import date, timedelta

    futura = date.today() + timedelta(days=30)
    assert client.put("/profile", json=_con_fecha(futura)).status_code == 422


def test_guardar_solo_con_edad_no_borra_la_fecha(client):
    # Un perfil con fecha, que después guarda otro dato sin mandarla, la conserva.
    client.put("/profile", json=_con_fecha(_fecha(30, dias_extra=7)))
    client.put("/profile", json={**PERFIL, "name": "Bruno B", "age": 30})

    leido = client.get("/profile").json()
    assert leido["name"] == "Bruno B"
    assert leido["birth_date"] == _fecha(30, dias_extra=7).isoformat()


# --- aviso legal versionado y consentimiento de salud ------------------------------------


def test_crear_el_perfil_sin_consentimiento_de_salud_da_422(client):
    sin = {**PERFIL, "accept_health_consent": False}
    assert client.put("/profile", json=sin).status_code == 422
    assert client.get("/profile").status_code == 404


def test_crear_el_perfil_guarda_la_version_y_el_consentimiento(client):
    from app.legal import LEGAL_VERSION

    leido = client.put("/profile", json=PERFIL).json()
    assert leido["legal_notice_accepted"] is True
    assert leido["legal_notice_version"] == LEGAL_VERSION
    assert leido["legal_notice_accepted_at"] is not None
    assert leido["health_consent"] is True
    assert leido["health_consent_at"] is not None


def test_editar_sin_la_casilla_no_retira_el_consentimiento(client):
    client.put("/profile", json=PERFIL)
    leido = client.put("/profile", json={**PERFIL, "name": "Otro", "accept_health_consent": False}).json()
    assert leido["health_consent"] is True


def test_retirar_y_volver_a_dar_el_consentimiento(client):
    client.put("/profile", json=PERFIL)
    retirado = client.delete("/profile/consent/health").json()
    assert retirado["health_consent"] is False
    assert retirado["legal_notice_accepted"] is True  # el aviso sigue aceptado

    vuelto = client.post(
        "/profile/consent", json={"accept_legal_notice": True, "accept_health_consent": True}
    ).json()
    assert vuelto["health_consent"] is True


def test_una_version_vieja_del_aviso_no_cuenta_como_aceptada(client, monkeypatch):
    client.put("/profile", json=PERFIL)
    import app.routers.profile as rutas

    monkeypatch.setattr(rutas, "LEGAL_VERSION", "2.0")
    assert client.get("/profile").json()["legal_notice_accepted"] is False

    leido = client.post("/profile/consent", json={"accept_legal_notice": True}).json()
    assert leido["legal_notice_accepted"] is True
    assert leido["legal_notice_version"] == "2.0"


def test_aceptar_sin_perfil_da_404(client):
    assert client.post("/profile/consent", json={"accept_legal_notice": True}).status_code == 404
    assert client.delete("/profile/consent/health").status_code == 404

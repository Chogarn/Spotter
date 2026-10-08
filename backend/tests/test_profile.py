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
    "level": "principiante",
    "goal": "masa",
    "equipment": "gimnasio",
    "limitations": None,
    "accept_legal_notice": True,
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
    assert guardado["goal"] == "masa"
    assert guardado["legal_notice_accepted"] is True


def test_guardar_de_nuevo_actualiza_sin_crear_otro(client):
    client.put("/profile", json=PERFIL)
    response = client.put("/profile", json={**PERFIL, "age": 31, "goal": "fuerza"})

    assert response.status_code == 200
    assert response.json()["age"] == 31
    assert client.get("/profile").json()["goal"] == "fuerza"


@pytest.mark.parametrize(
    "cambio",
    [
        {"age": 5},
        {"weight_kg": "500"},
        {"height_cm": 20},
        {"goal": "volar"},
        {"level": "dios"},
        {"sex": "robot"},
        {"name": ""},
        {"accept_legal_notice": False},
    ],
)
def test_valores_invalidos_devuelven_422(client, cambio):
    assert client.put("/profile", json={**PERFIL, **cambio}).status_code == 422


def test_faltan_campos_obligatorios_devuelve_422(client):
    sin_nivel = {k: v for k, v in PERFIL.items() if k != "level"}
    assert client.put("/profile", json=sin_nivel).status_code == 422

"""Autenticación: registro, login, logout, sesión y aislamiento entre usuarios."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base, get_db
from app.deps import get_current_user
from app.enums import Goal, Level
from app.main import app
from app.models import Routine, User
from app.security import COOKIE_NAME

SECRETO = "secreto-de-prueba-con-mas-de-32-bytes-de-largo"
ANA = {"email": "ana@example.com", "password": "una-clave-larga", "name": "Ana"}
BETO = {"email": "beto@example.com", "password": "otra-clave-larga", "name": "Beto"}


@pytest.fixture
def cliente(monkeypatch):
    """Cliente con sesión real: sin el usuario inyectado de los demás tests."""
    monkeypatch.setenv("JWT_SECRET", SECRETO)
    app.dependency_overrides.pop(get_current_user, None)
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)

    def override_get_db():
        with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    client.session = Session
    yield client
    app.dependency_overrides.pop(get_db, None)


def registrar(cliente, datos=ANA):
    respuesta = cliente.post("/auth/register", json=datos)
    assert respuesta.status_code == 201, respuesta.text
    return respuesta


# --- registro ---


def test_registrar_crea_la_cuenta_e_inicia_la_sesion(cliente):
    respuesta = registrar(cliente)

    assert respuesta.json()["email"] == "ana@example.com"
    assert respuesta.json()["name"] == "Ana"
    assert "password" not in respuesta.json() and "password_hash" not in respuesta.json()
    assert cliente.get("/auth/me").json()["email"] == "ana@example.com"


def test_la_contrasena_se_guarda_con_hash_y_no_en_texto(cliente):
    registrar(cliente)

    with cliente.session() as db:
        guardado = db.scalar(select(User)).password_hash
    assert guardado != ANA["password"]
    assert guardado.startswith("$argon2")
    assert ANA["password"] not in guardado


def test_la_cookie_de_sesion_es_httponly(cliente):
    respuesta = registrar(cliente)

    cabecera = respuesta.headers["set-cookie"].lower()
    assert COOKIE_NAME in cabecera
    assert "httponly" in cabecera
    assert "samesite=lax" in cabecera


def test_el_email_se_normaliza_y_no_se_repite(cliente):
    registrar(cliente, {**ANA, "email": "  ANA@Example.com "})

    repetido = cliente.post("/auth/register", json={**ANA, "email": "ana@example.COM"})

    assert repetido.status_code == 409
    with cliente.session() as db:
        assert [u.email for u in db.scalars(select(User))] == ["ana@example.com"]


@pytest.mark.parametrize(
    "cambio",
    [
        {"password": "corta"},
        {"password": "x" * 129},
        {"email": "no-es-un-email"},
        {"email": ""},
        {"name": ""},
        {"name": "   "},
    ],
)
def test_datos_invalidos_dan_422_y_no_crean_nada(cliente, cambio):
    assert cliente.post("/auth/register", json={**ANA, **cambio}).status_code == 422
    with cliente.session() as db:
        assert db.scalar(select(User)) is None


# --- login y logout ---


def test_iniciar_sesion(cliente):
    registrar(cliente)
    cliente.post("/auth/logout")
    assert cliente.get("/auth/me").status_code == 401

    respuesta = cliente.post("/auth/login", json={"email": "ANA@example.com", "password": ANA["password"]})

    assert respuesta.status_code == 200
    assert cliente.get("/auth/me").json()["name"] == "Ana"


def test_contrasena_o_email_incorrectos_dan_el_mismo_401(cliente):
    registrar(cliente)
    cliente.post("/auth/logout")

    mala = cliente.post("/auth/login", json={"email": ANA["email"], "password": "incorrecta-123"})
    desconocido = cliente.post("/auth/login", json={"email": "nadie@example.com", "password": "lo-que-sea-123"})

    assert mala.status_code == desconocido.status_code == 401
    assert mala.json() == desconocido.json()
    assert cliente.get("/auth/me").status_code == 401


def test_la_cuenta_sin_contrasena_real_no_puede_entrar(cliente):
    with cliente.session() as db:
        db.add(User(email="dev@spotter.local", password_hash="sin-login", name="Dev"))
        db.commit()

    respuesta = cliente.post("/auth/login", json={"email": "dev@spotter.local", "password": "sin-login"})

    assert respuesta.status_code == 401


def test_cerrar_sesion_borra_la_cookie(cliente):
    registrar(cliente)
    assert cliente.get("/auth/me").status_code == 200

    assert cliente.post("/auth/logout").status_code == 204

    assert cliente.get("/auth/me").status_code == 401


# --- la sesión ---


def test_sin_sesion_los_endpoints_protegidos_dan_401(cliente):
    pedidos = [
        ("get", "/profile"),
        ("put", "/profile"),
        ("get", "/routines"),
        ("get", "/routines/1"),
        ("get", "/weeks/active"),
        ("get", "/weeks/1"),
        ("post", "/weeks/1/close"),
        ("get", "/proposals/pending"),
        ("post", "/proposals/generate"),
        ("get", "/auth/me"),
    ]
    for metodo, ruta in pedidos:
        assert getattr(cliente, metodo)(ruta).status_code == 401, (metodo, ruta)


def test_la_salud_de_la_api_sigue_siendo_publica(cliente):
    assert cliente.get("/health").status_code == 200


def test_un_token_alterado_o_de_otra_firma_no_sirve(cliente):
    registrar(cliente)
    falso = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(days=1)}, "otra-clave-tambien-larga-de-mas-de-32-bytes", algorithm="HS256")
    cliente.cookies.set(COOKIE_NAME, falso)

    assert cliente.get("/auth/me").status_code == 401


def test_un_token_vencido_no_sirve(cliente):
    registrar(cliente)
    vencido = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(seconds=5)}, SECRETO, algorithm="HS256"
    )
    cliente.cookies.set(COOKIE_NAME, vencido)

    assert cliente.get("/auth/me").status_code == 401


def test_un_token_de_un_usuario_que_ya_no_existe_no_sirve(cliente):
    registrar(cliente)
    with cliente.session() as db:
        db.delete(db.scalar(select(User)))
        db.commit()

    assert cliente.get("/auth/me").status_code == 401


def test_sin_jwt_secret_no_hay_sesion(cliente, monkeypatch):
    monkeypatch.delenv("JWT_SECRET")

    assert cliente.post("/auth/register", json=ANA).status_code == 503
    with cliente.session() as db:
        assert db.scalar(select(User)) is None  # no quedó una cuenta a medias


# --- aislamiento entre usuarios ---


def test_un_usuario_no_ve_ni_toca_los_datos_de_otro(cliente):
    registrar(cliente, ANA)
    with cliente.session() as db:
        ana = db.scalar(select(User))
        ruta = Routine(user_id=ana.id, name="Rutina de Ana", goal=Goal.MASA, level=Level.INTERMEDIO)
        db.add(ruta)
        db.commit()
        ruta_id = ruta.id
    assert cliente.get(f"/routines/{ruta_id}").status_code == 200

    beto = TestClient(app)
    assert beto.post("/auth/register", json=BETO).status_code == 201

    assert beto.get("/routines").json() == []
    assert beto.get(f"/routines/{ruta_id}").status_code == 404
    assert beto.patch(f"/routines/{ruta_id}", json={"name": "robada"}).status_code == 404
    assert cliente.get(f"/routines/{ruta_id}").json()["name"] == "Rutina de Ana"


def test_cada_usuario_tiene_su_propio_perfil(cliente):
    registrar(cliente, ANA)
    perfil = {
        "name": "Ana", "age": 30, "weight_kg": "60", "height_cm": 165, "sex": None,
        "limitations": None, "accept_legal_notice": True,
    }
    assert cliente.put("/profile", json=perfil).status_code == 200

    beto = TestClient(app)
    beto.post("/auth/register", json=BETO)

    assert beto.get("/profile").status_code == 404
    assert cliente.get("/profile").status_code == 200

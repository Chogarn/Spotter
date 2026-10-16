"""Cambiar la contraseña con la sesión iniciada (decisión 80)."""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.models import User
from app.security import COOKIE_NAME
from tests.test_auth import ANA, SECRETO, cliente, registrar  # noqa: F401  (fixture y ayudante)

NUEVA = "una-clave-nueva-larga"


def cambiar(cliente, actual=ANA["password"], nueva=NUEVA):
    return cliente.put("/auth/password", json={"current_password": actual, "new_password": nueva})


def sesion_vieja(user_id: int, segundos: int = 120) -> str:
    """Una sesión de verdad (bien firmada) emitida hace un rato."""
    ahora = datetime.now(timezone.utc)
    claims = {
        "sub": str(user_id),
        "iat": ahora - timedelta(seconds=segundos),
        "exp": ahora + timedelta(days=7),
    }
    return jwt.encode(claims, SECRETO, algorithm="HS256")


def test_cambiar_la_contrasena_deja_entrar_con_la_nueva_y_no_con_la_vieja(cliente):
    registrar(cliente)

    assert cambiar(cliente).status_code == 204

    otro = TestClient(app)
    assert otro.post("/auth/login", json={"email": ANA["email"], "password": NUEVA}).status_code == 200
    assert (
        otro.post("/auth/login", json={"email": ANA["email"], "password": ANA["password"]}).status_code
        == 401
    )


def test_la_contrasena_nueva_se_guarda_con_hash(cliente):
    registrar(cliente)
    cambiar(cliente)

    with cliente.session() as db:
        guardado = db.scalar(select(User)).password_hash
    assert guardado != NUEVA and NUEVA not in guardado


def test_con_la_actual_mal_responde_400_y_no_cambia_nada(cliente):
    registrar(cliente)

    respuesta = cambiar(cliente, actual="no-es-esta-clave")

    assert respuesta.status_code == 400  # un 401 cerraría la sesión en pantalla
    assert "actual" in respuesta.json()["detail"]
    otro = TestClient(app)
    assert otro.post("/auth/login", json={"email": ANA["email"], "password": ANA["password"]}).status_code == 200


def test_la_nueva_tiene_que_ser_distinta_de_la_actual(cliente):
    registrar(cliente)
    assert cambiar(cliente, nueva=ANA["password"]).status_code == 400


def test_la_nueva_sigue_las_reglas_del_registro(cliente):
    registrar(cliente)
    assert cambiar(cliente, nueva="corta").status_code == 422
    assert cambiar(cliente, nueva="x" * 129).status_code == 422


def test_sin_sesion_no_se_puede_cambiar(cliente):
    assert cambiar(cliente).status_code == 401


def test_esta_sesion_sigue_abierta_despues_de_cambiar(cliente):
    registrar(cliente)

    cambiar(cliente)

    assert cliente.get("/auth/me").status_code == 200  # recibió una cookie nueva


def test_las_sesiones_de_otros_aparatos_se_cierran(cliente):
    registrar(cliente)
    with cliente.session() as db:
        user_id = db.scalar(select(User)).id
    otro_aparato = TestClient(app)
    otro_aparato.cookies.set(COOKIE_NAME, sesion_vieja(user_id))
    assert otro_aparato.get("/auth/me").status_code == 200  # antes del cambio, vale

    cambiar(cliente)

    assert otro_aparato.get("/auth/me").status_code == 401
    assert cliente.get("/auth/me").status_code == 200


def test_una_sesion_iniciada_despues_del_cambio_vale(cliente):
    registrar(cliente)
    cambiar(cliente)

    otro = TestClient(app)
    otro.post("/auth/login", json={"email": ANA["email"], "password": NUEVA})

    assert otro.get("/auth/me").status_code == 200


def test_sin_cambios_de_contrasena_las_sesiones_viejas_valen(cliente):
    registrar(cliente)
    with cliente.session() as db:
        user_id = db.scalar(select(User)).id
    viejo = TestClient(app)
    viejo.cookies.set(COOKIE_NAME, sesion_vieja(user_id, segundos=3600))

    assert viejo.get("/auth/me").status_code == 200

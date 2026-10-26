"""Recordarme: la sesión larga (30 días, cookie guardada) o corta (12 horas, cookie de sesión)."""

import jwt
from fastapi.testclient import TestClient

from app.main import app
from app.security import COOKIE_NAME
from tests.test_auth import ANA, SECRETO, cliente, registrar  # noqa: F401  (fixture y ayudante)

DIA = 24 * 3600


def entrar(**extra):
    """Un navegador nuevo que inicia sesión; devuelve la respuesta y su cookie."""
    navegador = TestClient(app)
    respuesta = navegador.post(
        "/auth/login", json={"email": ANA["email"], "password": ANA["password"], **extra}
    )
    return respuesta, navegador


def duracion(navegador) -> int:
    claims = jwt.decode(navegador.cookies.get(COOKIE_NAME), SECRETO, algorithms=["HS256"])
    return int(claims["exp"]) - int(claims["iat"])


def cookie_de(respuesta) -> str:
    return respuesta.headers["set-cookie"].lower()


def test_recordarme_da_una_sesion_de_30_dias_con_la_cookie_guardada(cliente):
    registrar(cliente)

    respuesta, navegador = entrar(remember=True)

    assert respuesta.status_code == 200
    assert duracion(navegador) == 30 * DIA
    assert f"max-age={30 * DIA}" in cookie_de(respuesta)


def test_sin_recordarme_la_sesion_es_de_12_horas_y_la_cookie_no_se_guarda(cliente):
    registrar(cliente)

    respuesta, navegador = entrar(remember=False)

    assert respuesta.status_code == 200
    assert duracion(navegador) == 12 * 3600
    assert "max-age" not in cookie_de(respuesta) and "expires" not in cookie_de(respuesta)
    assert navegador.get("/auth/me").status_code == 200  # sirve mientras el navegador siga abierto


def test_quien_no_manda_el_campo_queda_recordado(cliente):
    registrar(cliente)

    respuesta, navegador = entrar()

    assert duracion(navegador) == 30 * DIA
    assert "max-age" in cookie_de(respuesta)


NUEVA = {"current_password": ANA["password"], "new_password": "una-clave-nueva-larga"}


def test_cambiar_la_contrasena_no_alarga_una_sesion_corta(cliente):
    registrar(cliente)
    _, navegador = entrar(remember=False)

    respuesta = navegador.put("/auth/password", json=NUEVA)

    assert respuesta.status_code == 204
    assert duracion(navegador) == 12 * 3600 and "max-age" not in cookie_de(respuesta)


def test_cambiar_la_contrasena_conserva_una_sesion_larga(cliente):
    registrar(cliente)
    _, navegador = entrar(remember=True)

    respuesta = navegador.put("/auth/password", json=NUEVA)

    assert respuesta.status_code == 204
    assert duracion(navegador) == 30 * DIA and "max-age" in cookie_de(respuesta)

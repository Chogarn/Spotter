"""Límite de intentos del login y largo mínimo de JWT_SECRET."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import func, select

from app import login_limit
from app.models import LoginAttempt
from app.security import SessionConfigError, jwt_secret
from tests.test_auth import ANA, SECRETO, cliente, registrar  # noqa: F401  (fixture y ayudante)


def intentar(cliente, email=ANA["email"], password="incorrecta-123"):
    return cliente.post("/auth/login", json={"email": email, "password": password})


def cantidad(cliente) -> int:
    with cliente.session() as db:
        return db.scalar(select(func.count()).select_from(LoginAttempt))


def test_el_sexto_intento_fallido_del_mismo_correo_se_bloquea(cliente):
    registrar(cliente)
    cliente.post("/auth/logout")

    for _ in range(login_limit.MAX_PER_EMAIL):
        assert intentar(cliente).status_code == 401

    bloqueado = intentar(cliente)
    assert bloqueado.status_code == 429
    # Aunque ahora la contraseña sea la correcta: mientras dure el bloqueo no entra.
    assert intentar(cliente, password=ANA["password"]).status_code == 429


def test_un_correo_que_no_existe_tambien_se_bloquea(cliente):
    """Si no, el 429 delataría qué cuentas existen."""
    for _ in range(login_limit.MAX_PER_EMAIL):
        assert intentar(cliente, email="nadie@example.com").status_code == 401

    assert intentar(cliente, email="nadie@example.com").status_code == 429


def test_un_login_correcto_borra_los_fallos_del_correo(cliente):
    registrar(cliente)
    cliente.post("/auth/logout")
    for _ in range(login_limit.MAX_PER_EMAIL - 1):
        intentar(cliente)

    assert intentar(cliente, password=ANA["password"]).status_code == 200
    assert cantidad(cliente) == 0


def test_el_tope_por_ip_frena_aunque_cambie_el_correo(cliente, monkeypatch):
    monkeypatch.setattr(login_limit, "MAX_PER_IP", 3)
    for numero in range(3):
        assert intentar(cliente, email=f"nadie{numero}@example.com").status_code == 401

    assert intentar(cliente, email="otro@example.com").status_code == 429


def test_los_fallos_viejos_ya_no_cuentan(cliente):
    registrar(cliente)
    cliente.post("/auth/logout")
    hace_rato = datetime.now(timezone.utc) - login_limit.WINDOW - timedelta(minutes=1)
    with cliente.session() as db:
        db.add_all(
            LoginAttempt(email=ANA["email"], ip="testclient", created_at=hace_rato)
            for _ in range(login_limit.MAX_PER_EMAIL)
        )
        db.commit()

    assert intentar(cliente, password=ANA["password"]).status_code == 200


def test_anotar_un_fallo_borra_los_que_ya_no_cuentan(cliente):
    hace_rato = datetime.now(timezone.utc) - login_limit.WINDOW - timedelta(minutes=1)
    with cliente.session() as db:
        db.add(LoginAttempt(email="viejo@example.com", ip="x", created_at=hace_rato))
        db.commit()

    intentar(cliente, email="nadie@example.com")

    with cliente.session() as db:
        correos = set(db.scalars(select(LoginAttempt.email)))
    assert correos == {"nadie@example.com"}


# --- largo mínimo de JWT_SECRET ---


def test_un_secreto_corto_no_sirve(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "x" * 31)
    with pytest.raises(SessionConfigError):
        jwt_secret()


def test_un_secreto_de_32_caracteres_sirve(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "x" * 32)
    assert jwt_secret() == "x" * 32


def test_con_secreto_corto_no_hay_sesion(cliente, monkeypatch):
    registrar(cliente)
    cliente.post("/auth/logout")
    monkeypatch.setenv("JWT_SECRET", SECRETO[:20])

    assert intentar(cliente, password=ANA["password"]).status_code == 503


# --- limpieza de registros vencidos y /docs en producción ---


def test_pedir_un_registro_borra_los_pedidos_vencidos_de_otros(cliente):
    from app.models import PendingRegistration

    ayer = datetime.now(timezone.utc) - timedelta(days=1)
    with cliente.session() as db:
        db.add(
            PendingRegistration(
                email="viejo@example.com", name="Viejo", password_hash="x",
                token_hash="a" * 64, expires_at=ayer,
            )
        )
        db.commit()

    assert cliente.post("/auth/register", json=ANA).status_code == 202

    with cliente.session() as db:
        assert set(db.scalars(select(PendingRegistration.email))) == {ANA["email"]}


def test_en_produccion_no_se_publica_el_mapa_de_la_api():
    import subprocess
    import sys

    codigo = (
        "from app.main import app; "
        "print(app.docs_url, app.redoc_url, app.openapi_url)"
    )
    for entorno, esperado in (("production", "None None None"), ("", "/docs /redoc /openapi.json")):
        salida = subprocess.run(
            [sys.executable, "-c", codigo],
            env={**__import__("os").environ, "APP_ENV": entorno},
            capture_output=True, text=True, check=True,
        )
        assert salida.stdout.strip() == esperado

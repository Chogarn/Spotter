"""Verificar el correo para crear la cuenta y recuperar la contraseña (decisión 81)."""

import hashlib
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app import mailer
from app.main import app
from app.models import EmailLog, PasswordReset, PendingRegistration, User
from app.security import COOKIE_NAME
from tests.test_change_password import sesion_vieja
from tests.test_auth import (  # noqa: F401  (fixture y ayudantes)
    ANA,
    BETO,
    OUTBOX,
    cliente,
    registrar,
    token_del_ultimo_correo,
)

NUEVA = "una-clave-nueva-larga"


@pytest.fixture(autouse=True)
def sin_espera_entre_correos(request, monkeypatch):
    """Casi todos los tests piden varios correos seguidos a la misma dirección: se les quita la
    espera de un minuto. Solo el test de la espera la deja puesta."""
    if "un_correo_por_minuto" not in request.node.name:
        monkeypatch.setattr(mailer, "COOLDOWN", timedelta(0))


def sin_espera(monkeypatch):
    """Para pedir varios correos seguidos a la misma dirección sin esperar el minuto."""
    monkeypatch.setattr(mailer, "COOLDOWN", timedelta(0))


def pedir(cliente, datos=ANA):
    return cliente.post("/auth/register", json=datos)


# --- registro pendiente y verificación ---


def test_registrarse_no_crea_el_usuario_ni_inicia_sesion(cliente):
    respuesta = pedir(cliente)

    assert respuesta.status_code == 202
    assert "set-cookie" not in respuesta.headers
    assert cliente.get("/auth/me").status_code == 401
    with cliente.session() as db:
        assert db.scalar(select(User)) is None
        assert db.scalar(select(PendingRegistration)).email == ANA["email"]


def test_manda_un_correo_con_el_enlace_al_correo_indicado(cliente):
    pedir(cliente)

    assert len(OUTBOX) == 1
    para, asunto, cuerpo = OUTBOX[0]
    assert para == ANA["email"]
    assert "Confirmá" in asunto
    assert "http://localhost:3001/verificar?token=" in cuerpo


def test_la_base_guarda_el_hash_del_codigo_y_no_el_codigo(cliente):
    pedir(cliente)
    codigo = token_del_ultimo_correo()

    with cliente.session() as db:
        pendiente = db.scalar(select(PendingRegistration))
    assert pendiente.token_hash == hashlib.sha256(codigo.encode()).hexdigest()
    assert codigo not in pendiente.token_hash
    assert ANA["password"] not in pendiente.password_hash and pendiente.password_hash.startswith("$argon2")


def test_tocar_el_enlace_crea_la_cuenta_verificada_e_inicia_la_sesion(cliente):
    pedir(cliente)

    respuesta = cliente.post("/auth/verify", json={"token": token_del_ultimo_correo()})

    assert respuesta.status_code == 200
    assert respuesta.json()["email"] == ANA["email"]
    assert cliente.get("/auth/me").status_code == 200
    with cliente.session() as db:
        usuario = db.scalar(select(User))
        assert usuario.email_verified_at is not None
        assert db.scalar(select(PendingRegistration)) is None


def test_el_enlace_sirve_una_sola_vez(cliente):
    pedir(cliente)
    codigo = token_del_ultimo_correo()
    assert cliente.post("/auth/verify", json={"token": codigo}).status_code == 200

    assert TestClient(app).post("/auth/verify", json={"token": codigo}).status_code == 400


def test_un_enlace_vencido_o_inventado_no_sirve(cliente):
    pedir(cliente)
    with cliente.session() as db:
        db.scalar(select(PendingRegistration)).expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

    assert cliente.post("/auth/verify", json={"token": token_del_ultimo_correo()}).status_code == 400
    assert cliente.post("/auth/verify", json={"token": "x" * 43}).status_code == 400
    assert cliente.post("/auth/verify", json={"token": "corto"}).status_code == 422


def test_volver_a_registrarse_reemplaza_el_pedido_anterior(cliente, monkeypatch):
    sin_espera(monkeypatch)
    pedir(cliente)
    viejo = token_del_ultimo_correo()

    pedir(cliente, {**ANA, "name": "Ana Nueva"})

    assert cliente.post("/auth/verify", json={"token": viejo}).status_code == 400
    assert cliente.post("/auth/verify", json={"token": token_del_ultimo_correo()}).json()["name"] == "Ana Nueva"


def test_no_se_puede_registrar_un_correo_que_ya_tiene_cuenta(cliente):
    registrar(cliente)
    assert pedir(TestClient(app)).status_code == 409


def test_reenviar_el_enlace_deja_valido_solo_el_nuevo(cliente, monkeypatch):
    sin_espera(monkeypatch)
    pedir(cliente)
    viejo = token_del_ultimo_correo()

    respuesta = cliente.post("/auth/resend-verification", json={"email": ANA["email"]})

    assert respuesta.status_code == 202 and len(OUTBOX) == 2
    assert cliente.post("/auth/verify", json={"token": viejo}).status_code == 400
    assert cliente.post("/auth/verify", json={"token": token_del_ultimo_correo()}).status_code == 200


def test_reenviar_responde_igual_para_un_correo_desconocido(cliente):
    pedir(cliente)
    conocido = cliente.post("/auth/resend-verification", json={"email": ANA["email"]})
    desconocido = cliente.post("/auth/resend-verification", json={"email": "nadie@example.com"})

    assert conocido.status_code == desconocido.status_code == 202
    assert conocido.json() == desconocido.json()


# --- sin configuración y topes ---


def test_sin_configurar_el_envio_no_se_crea_nada(cliente, monkeypatch):
    monkeypatch.delenv("SMTP_HOST")

    assert pedir(cliente).status_code == 503
    assert cliente.post("/auth/forgot-password", json={"email": ANA["email"]}).status_code == 503
    assert OUTBOX == []
    with cliente.session() as db:
        assert db.scalar(select(PendingRegistration)) is None


def test_un_correo_por_minuto_a_la_misma_direccion(cliente):
    assert pedir(cliente).status_code == 202

    segundo = pedir(cliente)

    assert segundo.status_code == 429
    assert len(OUTBOX) == 1


def test_el_tope_diario_corta_los_correos(cliente, monkeypatch):
    monkeypatch.setenv("EMAIL_DAILY_LIMIT", "1")
    assert pedir(cliente).status_code == 202

    otro = pedir(TestClient(app), BETO)

    assert otro.status_code == 429
    assert len(OUTBOX) == 1
    with cliente.session() as db:
        assert len(list(db.scalars(select(EmailLog)))) == 1


def test_sin_tope_diario_configurado_no_se_envia(cliente, monkeypatch):
    monkeypatch.delenv("EMAIL_DAILY_LIMIT")
    assert pedir(cliente).status_code == 503


# --- recuperar la contraseña ---


def olvide(cliente, email=ANA["email"]):
    return cliente.post("/auth/forgot-password", json={"email": email})


def test_olvide_manda_el_enlace_al_correo_verificado(cliente):
    registrar(cliente)
    OUTBOX.clear()

    respuesta = olvide(TestClient(app))

    assert respuesta.status_code == 202
    assert len(OUTBOX) == 1 and OUTBOX[0][0] == ANA["email"]
    assert "http://localhost:3001/restablecer?token=" in OUTBOX[0][2]


def test_olvide_responde_igual_exista_o_no_la_cuenta(cliente, monkeypatch):
    sin_espera(monkeypatch)
    registrar(cliente)
    OUTBOX.clear()
    existe = olvide(TestClient(app))
    no_existe = olvide(TestClient(app), "nadie@example.com")

    assert existe.status_code == no_existe.status_code == 202
    assert existe.json() == no_existe.json()
    assert [c[0] for c in OUTBOX] == [ANA["email"]]  # al desconocido no se le manda nada


def test_a_un_correo_sin_verificar_no_se_le_manda_el_enlace(cliente):
    registrar(cliente)
    with cliente.session() as db:
        db.scalar(select(User)).email_verified_at = None
        db.commit()
    OUTBOX.clear()

    assert olvide(TestClient(app)).status_code == 202
    assert OUTBOX == []


def restablecer(cliente, codigo, nueva=NUEVA):
    return cliente.post("/auth/reset-password", json={"token": codigo, "new_password": nueva})


def test_el_enlace_permite_elegir_una_contrasena_nueva(cliente):
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))

    respuesta = restablecer(TestClient(app), token_del_ultimo_correo())

    assert respuesta.status_code == 204
    otro = TestClient(app)
    assert otro.post("/auth/login", json={"email": ANA["email"], "password": NUEVA}).status_code == 200
    assert otro.post("/auth/login", json={"email": ANA["email"], "password": ANA["password"]}).status_code == 401


def test_restablecer_no_inicia_sesion_y_cierra_las_abiertas(cliente):
    registrar(cliente)
    with cliente.session() as db:
        usuario_id = db.scalar(select(User)).id
    # Una sesión de hace un rato (si no, nace en el mismo segundo del cambio y todavía vale).
    cliente.cookies.set(COOKIE_NAME, sesion_vieja(usuario_id))
    assert cliente.get("/auth/me").status_code == 200
    OUTBOX.clear()
    olvide(TestClient(app))
    anonimo = TestClient(app)

    restablecer(anonimo, token_del_ultimo_correo())

    assert anonimo.get("/auth/me").status_code == 401  # no quedó con sesión
    assert cliente.get("/auth/me").status_code == 401  # y la sesión vieja se cerró


def test_el_enlace_de_recuperacion_sirve_una_sola_vez(cliente):
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))
    codigo = token_del_ultimo_correo()
    assert restablecer(TestClient(app), codigo).status_code == 204

    assert restablecer(TestClient(app), codigo, "otra-clave-larga-2").status_code == 400


def test_el_enlace_de_recuperacion_vence_a_la_hora(cliente):
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))
    with cliente.session() as db:
        db.scalar(select(PasswordReset)).expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

    assert restablecer(TestClient(app), token_del_ultimo_correo()).status_code == 400


def test_pedir_otro_enlace_anula_el_anterior(cliente, monkeypatch):
    sin_espera(monkeypatch)
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))
    primero = token_del_ultimo_correo()
    olvide(TestClient(app))

    assert restablecer(TestClient(app), primero).status_code == 400
    assert restablecer(TestClient(app), token_del_ultimo_correo()).status_code == 204


def test_la_contrasena_nueva_sigue_las_reglas_y_un_codigo_inventado_no_sirve(cliente):
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))
    codigo = token_del_ultimo_correo()

    assert restablecer(TestClient(app), codigo, "corta").status_code == 422
    assert restablecer(TestClient(app), "y" * 43).status_code == 400
    assert restablecer(TestClient(app), codigo).status_code == 204  # el intento fallido no lo gastó


def test_la_base_guarda_el_hash_del_codigo_de_recuperacion(cliente):
    registrar(cliente)
    OUTBOX.clear()
    olvide(TestClient(app))
    codigo = token_del_ultimo_correo()

    with cliente.session() as db:
        guardado = db.scalar(select(PasswordReset)).token_hash
    assert guardado == hashlib.sha256(codigo.encode()).hexdigest() and codigo != guardado

"""Cambiar el correo con la sesión iniciada: el enlace va al correo nuevo."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.main import app
from app.models import EmailChange, EmailLog, User
from app.security import COOKIE_NAME
from tests.test_auth import (  # noqa: F401  (fixture y ayudantes)
    ANA,
    BETO,
    OUTBOX,
    cliente,
    registrar,
    token_del_ultimo_correo,
)
from tests.test_change_password import sesion_vieja

NUEVO = "ana.nueva@example.com"


def pedir(cliente, nuevo=NUEVO, password=ANA["password"]):
    return cliente.post("/auth/change-email", json={"new_email": nuevo, "password": password})


def confirmar(cliente, token=None):
    return cliente.post(
        "/auth/confirm-email-change", json={"token": token or token_del_ultimo_correo()}
    )


def correo_de_ana(cliente) -> str:
    with cliente.session() as db:
        return db.scalar(select(User.email).where(User.name == "Ana"))


def test_pedir_el_cambio_manda_el_enlace_al_correo_nuevo_y_no_cambia_nada_todavia(cliente):
    registrar(cliente)

    respuesta = pedir(cliente)

    assert respuesta.status_code == 202
    assert OUTBOX[-1][0] == NUEVO
    assert "/confirmar-correo?token=" in OUTBOX[-1][2]
    assert correo_de_ana(cliente) == ANA["email"]
    assert cliente.get("/auth/me").status_code == 200


def test_confirmar_cambia_el_correo_y_se_entra_con_el_nuevo(cliente):
    registrar(cliente)
    pedir(cliente)

    assert confirmar(cliente).status_code == 204

    assert correo_de_ana(cliente) == NUEVO
    otro = TestClient(app)
    login = otro.post("/auth/login", json={"email": NUEVO, "password": ANA["password"]})
    assert login.status_code == 200
    viejo = otro.post("/auth/login", json={"email": ANA["email"], "password": ANA["password"]})
    assert viejo.status_code == 401


def test_confirmar_cierra_las_sesiones_abiertas(cliente):
    registrar(cliente)
    with cliente.session() as db:
        ana_id = db.scalar(select(User.id))
    pedir(cliente)
    confirmar(cliente)

    otro = TestClient(app)
    otro.cookies.set(COOKIE_NAME, sesion_vieja(ana_id))
    assert otro.get("/auth/me").status_code == 401


def test_con_la_contrasena_mal_responde_400_y_no_manda_nada(cliente):
    registrar(cliente)
    enviados = len(OUTBOX)

    respuesta = pedir(cliente, password="incorrecta-123")

    assert respuesta.status_code == 400  # un 401 cerraría la sesión en pantalla
    assert len(OUTBOX) == enviados
    assert cliente.get("/auth/me").status_code == 200


def test_el_correo_nuevo_no_puede_ser_el_actual_ni_uno_ya_registrado(cliente):
    registrar(cliente, BETO)
    registrar(cliente, ANA)
    with cliente.session() as db:  # el tope de 1 correo por minuto por dirección no es lo que se prueba
        db.execute(delete(EmailLog))
        db.commit()

    assert pedir(cliente, nuevo=ANA["email"]).status_code == 400
    assert pedir(cliente, nuevo=BETO["email"]).status_code == 409


def test_el_correo_nuevo_se_normaliza_y_tiene_que_ser_valido(cliente):
    registrar(cliente)

    assert pedir(cliente, nuevo="no-es-un-correo").status_code == 422
    assert pedir(cliente, nuevo="  ANA.Nueva@Example.com ").status_code == 202
    confirmar(cliente)

    assert correo_de_ana(cliente) == NUEVO


def test_un_pedido_nuevo_anula_el_anterior(cliente):
    registrar(cliente)
    pedir(cliente)
    primero = token_del_ultimo_correo()
    with cliente.session() as db:
        db.execute(delete(EmailLog))
        db.commit()
    pedir(cliente, nuevo="otra@example.com")

    assert confirmar(cliente, primero).status_code == 400
    assert confirmar(cliente).status_code == 204
    assert correo_de_ana(cliente) == "otra@example.com"


def test_el_enlace_sirve_una_sola_vez(cliente):
    registrar(cliente)
    pedir(cliente)
    token = token_del_ultimo_correo()

    assert confirmar(cliente, token).status_code == 204
    assert confirmar(cliente, token).status_code == 400


def test_un_enlace_vencido_o_inventado_da_400(cliente):
    registrar(cliente)
    pedir(cliente)
    with cliente.session() as db:
        cambio = db.scalar(select(EmailChange))
        cambio.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()

    assert confirmar(cliente).status_code == 400
    assert confirmar(cliente, "x" * 40).status_code == 400
    assert correo_de_ana(cliente) == ANA["email"]


def test_si_otro_registra_ese_correo_antes_de_confirmar_da_409(cliente):
    registrar(cliente)
    pedir(cliente)
    token = token_del_ultimo_correo()
    with cliente.session() as db:
        db.add(User(email=NUEVO, password_hash="x", name="Otro"))
        db.commit()

    assert confirmar(cliente, token).status_code == 409
    assert correo_de_ana(cliente) == ANA["email"]


def test_sin_sesion_no_se_puede_pedir_el_cambio(cliente):
    assert pedir(cliente).status_code == 401

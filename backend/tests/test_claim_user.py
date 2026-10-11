"""El script que convierte el usuario de desarrollo en una cuenta real."""

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.db import Base
from app.deps import DEV_USER_EMAIL
from app.models import AiCall, Profile, User
from app.scripts.claim_user import ClaimError, claim_dev_user
from app.security import verify_password

DATOS = {"email": "bruno@example.com", "name": "Bruno", "password": "una-clave-larga-123"}


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with sessionmaker(engine, expire_on_commit=False)() as session:
        session.add(User(email=DEV_USER_EMAIL, password_hash="sin-login", name="Usuario de desarrollo"))
        session.commit()
        yield session


def test_reclamar_cambia_email_nombre_y_contrasena_sin_cambiar_el_id(db):
    id_antes = db.scalar(select(User.id))

    user = claim_dev_user(db, **DATOS)
    db.commit()

    assert user.id == id_antes
    assert user.email == "bruno@example.com"
    assert user.name == "Bruno"
    assert user.password_hash.startswith("$argon2")
    assert verify_password(DATOS["password"], user.password_hash)
    assert not verify_password("otra-clave-cualquiera", user.password_hash)


def test_lo_que_colgaba_del_usuario_sigue_ahi(db):
    user = db.scalar(select(User))
    db.add(Profile(user_id=user.id, age=30, weight_kg=70, height_cm=170, legal_notice_accepted_at=None))
    db.commit()

    claim_dev_user(db, **DATOS)
    db.commit()

    assert db.get(Profile, user.id).age == 30


def test_el_email_se_normaliza(db):
    user = claim_dev_user(db, email="  Bruno@Example.COM ", name="Bruno", password="una-clave-larga-123")

    assert user.email == "bruno@example.com"


def test_no_se_puede_reclamar_dos_veces(db):
    claim_dev_user(db, **DATOS)
    db.commit()

    with pytest.raises(ClaimError, match="ya fue reclamado"):
        claim_dev_user(db, **{**DATOS, "email": "otro@example.com"})


def test_si_el_email_ya_lo_usa_otra_cuenta_no_cambia_nada(db):
    db.add(User(email="bruno@example.com", password_hash="x", name="Otro"))
    db.commit()

    with pytest.raises(ClaimError, match="ya lo usa otra cuenta"):
        claim_dev_user(db, **DATOS)

    dev = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
    assert dev is not None and dev.password_hash == "sin-login"


def test_sin_usuario_de_desarrollo_no_hay_nada_que_reclamar(db):
    db.delete(db.scalar(select(User)))
    db.commit()

    with pytest.raises(ClaimError, match="No existe"):
        claim_dev_user(db, **DATOS)


@pytest.mark.parametrize(
    "cambio",
    [{"password": "corta"}, {"email": "no-es-email"}, {"name": "  "}],
)
def test_datos_invalidos_no_cambian_nada(db, cambio):
    with pytest.raises(ValidationError):
        claim_dev_user(db, **{**DATOS, **cambio})

    dev = db.scalar(select(User))
    assert dev.email == DEV_USER_EMAIL and dev.password_hash == "sin-login"
    assert db.scalar(select(AiCall)) is None

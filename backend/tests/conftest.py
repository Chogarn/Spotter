"""Configuración compartida de los tests.

Casi todos los tests prueban otra cosa (semanas, propuestas, reglas) y no el login: en lugar de
iniciar sesión, reciben un usuario de prueba inyectado en `get_current_user`. Los tests de
`test_auth.py` quitan esa inyección y usan el flujo real.
"""

import pytest
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import DEV_USER_EMAIL, get_current_user
from app.main import app
from app.models import User


def _usuario_de_prueba(db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
    if user is None:
        user = User(email=DEV_USER_EMAIL, password_hash="sin-login", name="Usuario de prueba")
        db.add(user)
        db.commit()
    return user


@pytest.fixture(autouse=True)
def usuario_inyectado():
    app.dependency_overrides[get_current_user] = _usuario_de_prueba
    yield
    app.dependency_overrides.pop(get_current_user, None)

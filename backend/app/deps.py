"""Dependencias compartidas de la API."""

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

DEV_USER_EMAIL = "dev@spotter.local"


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Devuelve el usuario de desarrollo (se crea la primera vez).

    Todavía no hay login: en la semana 3 se reemplaza SOLO esta función por la que
    lee el JWT, y el resto de los endpoints no cambia.
    """
    user = db.scalar(select(User).where(User.email == DEV_USER_EMAIL))
    if user is None:
        user = User(
            email=DEV_USER_EMAIL,
            password_hash="sin-login",
            name="Usuario de desarrollo",
        )
        db.add(user)
        db.commit()
    return user

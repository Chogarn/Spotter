"""Dependencias compartidas de la API."""

from datetime import timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import COOKIE_NAME, SessionConfigError, read_session

# Solo lo usan los tests: el usuario que inyectan en lugar de iniciar sesión.
DEV_USER_EMAIL = "dev@spotter.local"


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """El usuario de la sesión (cookie httpOnly con el JWT). 401 si no hay sesión válida."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Iniciá sesión para continuar")
    try:
        session = read_session(token)
    except SessionConfigError:
        raise HTTPException(status_code=503, detail="La sesión no está configurada") from None
    user = db.get(User, session[0]) if session is not None else None
    if user is None:
        raise HTTPException(status_code=401, detail="Tu sesión venció: iniciá sesión de nuevo")
    if user.password_changed_at is not None:
        # Una sesión de antes del último cambio de contraseña ya no vale (decisión 80).
        changed = user.password_changed_at
        if changed.tzinfo is None:  # SQLite de los tests guarda la fecha sin zona
            changed = changed.replace(tzinfo=timezone.utc)
        if session[1] < int(changed.timestamp()):
            raise HTTPException(
                status_code=401, detail="Tu contraseña cambió: iniciá sesión de nuevo"
            )
    return user

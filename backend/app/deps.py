"""Dependencias compartidas de la API."""

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import COOKIE_NAME, SessionConfigError, read_token

# Solo lo usan los tests: el usuario que inyectan en lugar de iniciar sesión.
DEV_USER_EMAIL = "dev@spotter.local"


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """El usuario de la sesión (cookie httpOnly con el JWT). 401 si no hay sesión válida."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Iniciá sesión para continuar")
    try:
        user_id = read_token(token)
    except SessionConfigError:
        raise HTTPException(status_code=503, detail="La sesión no está configurada") from None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(status_code=401, detail="Tu sesión venció: iniciá sesión de nuevo")
    return user

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ChangePasswordIn, LoginIn, RegisterIn, UserOut
from app.security import (
    COOKIE_NAME,
    SESSION_DAYS,
    SessionConfigError,
    burn_time,
    cookie_secure,
    create_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

BAD_LOGIN = "Email o contraseña incorrectos"


def start_session(response: Response, user: User) -> None:
    try:
        token = create_token(user.id)
    except SessionConfigError:
        raise HTTPException(status_code=503, detail="La sesión no está configurada") from None
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,  # el JavaScript de la página no puede leerla
        samesite="lax",
        secure=cookie_secure(),
        path="/",
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, response: Response, db: Session = Depends(get_db)) -> User:
    """Crea la cuenta e inicia la sesión."""
    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Ese email ya está registrado")
    user = User(email=data.email, password_hash=hash_password(data.password), name=data.name)
    db.add(user)
    db.flush()
    start_session(response, user)  # si la sesión no está configurada, no se crea la cuenta
    db.commit()
    return user


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == data.email))
    if user is None:
        burn_time()
        raise HTTPException(status_code=401, detail=BAD_LOGIN)
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail=BAD_LOGIN)
    start_session(response, user)
    return user


@router.put("/password", status_code=204)
def change_password(
    data: ChangePasswordIn,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Cambia la contraseña (decisión 80). Pide la actual; la nueva sigue las reglas del registro.

    Cierra las sesiones de los demás aparatos (`password_changed_at`) y deja abierta esta con una
    cookie nueva. Responde 400 y no 401 si la actual está mal: un 401 cerraría la sesión en pantalla.
    """
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")
    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=400, detail="La contraseña nueva tiene que ser distinta de la actual"
        )
    user.password_hash = hash_password(data.new_password)
    # Un segundo de margen hacia atrás no hace falta: la cookie nueva se emite en este mismo segundo
    # o después, y solo valen las emitidas desde ese segundo.
    user.password_changed_at = datetime.now(timezone.utc)
    start_session(response, user)
    db.commit()


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user

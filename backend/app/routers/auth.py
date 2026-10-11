from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginIn, RegisterIn, UserOut
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


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user

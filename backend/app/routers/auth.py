import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import mailer

from app.db import get_db
from app.deps import get_current_user
from app.models import PasswordReset, PendingRegistration, User
from app.schemas import (
    ChangePasswordIn,
    EmailIn,
    LoginIn,
    MessageOut,
    RegisterIn,
    ResetPasswordIn,
    TokenIn,
    UserOut,
)
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
VERIFY_HOURS = 24
RESET_MINUTES = 60
SENT = "Si el correo corresponde, te mandamos un enlace. Mirá también en la carpeta de spam."
BAD_LINK = "El enlace no es válido o venció"


def new_token() -> tuple[str, str]:
    """(el código para el enlace, su hash para guardar). La base nunca guarda el código."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def aware(moment: datetime) -> datetime:
    """SQLite (los tests) devuelve las fechas sin zona; en PostgreSQL ya vienen con ella."""
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def require_mail() -> None:
    if not mailer.is_configured():
        raise HTTPException(status_code=503, detail="El envío de correos no está configurado")


def queue_mail(
    background: BackgroundTasks, db: Session, kind: str, to: str, subject: str, body: str
) -> str | None:
    """Anota el correo y lo manda en segundo plano. Devuelve por qué no se pudo ("cooldown" o
    "daily"), o None si quedó en cola."""
    why = mailer.reserve(db, kind, to)
    if why is None:
        background.add_task(mailer.deliver, to, subject, body)
    return why


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


@router.post("/register", response_model=MessageOut, status_code=202)
def register(
    data: RegisterIn, background: BackgroundTasks, db: Session = Depends(get_db)
) -> MessageOut:
    """Pide crear la cuenta (decisión 81): el usuario NO se crea hasta que verifica el correo.

    Guarda un registro pendiente con el hash de la contraseña y manda el enlace de verificación.
    Volver a registrarse con el mismo correo reemplaza el pedido anterior.
    """
    require_mail()
    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Ese email ya está registrado")
    raw, hashed = new_token()
    subject, body = mailer.verification_text(f"{mailer.app_url()}/verificar?token={raw}")
    why = queue_mail(background, db, "verify", data.email, subject, body)
    if why == "cooldown":
        raise HTTPException(status_code=429, detail="Esperá un minuto antes de pedir otro correo")
    if why == "daily":
        raise HTTPException(
            status_code=429, detail="Se llegó al tope de correos de hoy: probá de nuevo mañana"
        )
    db.execute(delete(PendingRegistration).where(PendingRegistration.email == data.email))
    db.add(
        PendingRegistration(
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
            token_hash=hashed,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=VERIFY_HOURS),
        )
    )
    db.commit()
    return MessageOut(message="Te mandamos un enlace para confirmar tu correo. Mirá también en spam.")


@router.post("/verify", response_model=UserOut)
def verify(data: TokenIn, response: Response, db: Session = Depends(get_db)) -> User:
    """Confirma el correo: recién ahora se crea la cuenta, y la sesión queda iniciada."""
    pending = db.scalar(
        select(PendingRegistration).where(PendingRegistration.token_hash == hash_token(data.token))
    )
    if pending is None or aware(pending.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail=BAD_LINK)
    if db.scalar(select(User).where(User.email == pending.email)) is not None:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=409, detail="Ese email ya está registrado")
    user = User(
        email=pending.email,
        password_hash=pending.password_hash,
        name=pending.name,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.delete(pending)
    db.flush()
    start_session(response, user)
    db.commit()
    return user


@router.post("/resend-verification", response_model=MessageOut, status_code=202)
def resend_verification(
    data: EmailIn, background: BackgroundTasks, db: Session = Depends(get_db)
) -> MessageOut:
    """Reenvía el enlace de verificación. Responde siempre lo mismo: no dice si el correo existe."""
    require_mail()
    pending = db.scalar(select(PendingRegistration).where(PendingRegistration.email == data.email))
    if pending is not None:
        raw, hashed = new_token()
        subject, body = mailer.verification_text(f"{mailer.app_url()}/verificar?token={raw}")
        if queue_mail(background, db, "verify", data.email, subject, body) is None:
            pending.token_hash = hashed
            pending.expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFY_HOURS)
        db.commit()
    return MessageOut(message=SENT)


@router.post("/forgot-password", response_model=MessageOut, status_code=202)
def forgot_password(
    data: EmailIn, background: BackgroundTasks, db: Session = Depends(get_db)
) -> MessageOut:
    """Manda el enlace para elegir una contraseña nueva a un correo verificado (decisión 81).

    Responde siempre lo mismo, exista o no la cuenta, y los topes también callan: así no se puede
    averiguar qué correos están registrados.
    """
    require_mail()
    user = db.scalar(select(User).where(User.email == data.email))
    if user is not None and user.email_verified_at is not None:
        raw, hashed = new_token()
        subject, body = mailer.reset_text(f"{mailer.app_url()}/restablecer?token={raw}")
        if queue_mail(background, db, "reset", user.email, subject, body) is None:
            # Un enlace nuevo anula los anteriores sin usar.
            db.execute(
                delete(PasswordReset).where(
                    PasswordReset.user_id == user.id, PasswordReset.used_at.is_(None)
                )
            )
            db.add(
                PasswordReset(
                    user_id=user.id,
                    token_hash=hashed,
                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_MINUTES),
                )
            )
        db.commit()
    return MessageOut(message=SENT)


@router.post("/reset-password", status_code=204)
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)) -> None:
    """Fija la contraseña nueva con el código del correo. Sirve una sola vez, vence a la hora y
    cierra todas las sesiones abiertas (`password_changed_at`). No inicia sesión."""
    reset = db.scalar(select(PasswordReset).where(PasswordReset.token_hash == hash_token(data.token)))
    now = datetime.now(timezone.utc)
    if reset is None or reset.used_at is not None or aware(reset.expires_at) < now:
        raise HTTPException(status_code=400, detail=BAD_LINK)
    user = db.get(User, reset.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail=BAD_LINK)
    user.password_hash = hash_password(data.new_password)
    user.password_changed_at = now
    reset.used_at = now
    db.commit()


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

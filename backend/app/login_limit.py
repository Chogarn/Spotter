"""Límite de intentos del login: frena a quien prueba contraseñas una tras otra.

- Se anota cada intento FALLIDO en `login_attempts` (correo y dirección IP) y los topes salen de
  contar esas filas de los últimos 15 minutos, como `mailer` con `email_log`.
- Tope por correo (5) y por IP (20). El del correo cuenta también los correos que no existen, así el
  bloqueo no delata qué cuentas hay.
- Los números son una elección de diseño, sin fuente.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Request
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import LoginAttempt

WINDOW = timedelta(minutes=15)
MAX_PER_EMAIL = 5
MAX_PER_IP = 20


def client_ip(request: Request) -> str:
    """La dirección de quien llama. Sin proxy delante es la real; si el despliegue pone uno hay que
    leerla de su encabezado (hoy no se hace: un encabezado que manda el cliente se puede inventar)."""
    return request.client.host if request.client else "desconocida"


def too_many_failures(db: Session, email: str, ip: str) -> bool:
    since = datetime.now(timezone.utc) - WINDOW
    by_email = db.scalar(
        select(func.count())
        .select_from(LoginAttempt)
        .where(LoginAttempt.email == email, LoginAttempt.created_at > since)
    )
    by_ip = db.scalar(
        select(func.count())
        .select_from(LoginAttempt)
        .where(LoginAttempt.ip == ip, LoginAttempt.created_at > since)
    )
    return (by_email or 0) >= MAX_PER_EMAIL or (by_ip or 0) >= MAX_PER_IP


def record_failure(db: Session, email: str, ip: str) -> None:
    """Anota el fallo y, de paso, borra los que ya no cuentan (así la tabla no crece)."""
    db.execute(
        delete(LoginAttempt).where(LoginAttempt.created_at < datetime.now(timezone.utc) - WINDOW)
    )
    db.add(LoginAttempt(email=email, ip=ip))
    db.commit()


def clear_failures(db: Session, email: str) -> None:
    db.execute(delete(LoginAttempt).where(LoginAttempt.email == email))
    db.commit()

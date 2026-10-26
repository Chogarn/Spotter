"""Envío de correos (decisión 81): verificar el correo y recuperar la contraseña.

- Usa SMTP estándar, así sirve con Gmail, Resend, Brevo o Mailpit (el de desarrollo) cambiando solo
  las variables de entorno. Sin valores por defecto: si falta algo, NO se envía (como con Gemini).
- Cada correo se anota en `email_log` ANTES de enviarse y los topes salen de contar esas filas:
  uno diario en total (`EMAIL_DAILY_LIMIT`) y una espera de un minuto por dirección.
- El envío corre en segundo plano (`BackgroundTasks`): la respuesta tarda lo mismo exista o no la
  cuenta, para no revelar quién está registrado.
"""

import logging
import os
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import EmailLog

log = logging.getLogger("spotter.mailer")

COOLDOWN = timedelta(seconds=60)  # entre un correo y otro a la misma dirección
WINDOW = timedelta(hours=24)  # el tope diario cuenta las últimas 24 horas
TIMEOUT_SECONDS = 15


class MailNotConfigured(Exception):
    """Falta alguna variable del envío de correos: no se manda nada."""


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def daily_limit() -> int:
    try:
        return int(_env("EMAIL_DAILY_LIMIT"))
    except ValueError:
        return 0


def is_configured() -> bool:
    """Hay servidor, remitente, dirección de la app y tope diario (todo obligatorio)."""
    return bool(
        _env("SMTP_HOST") and _env("SMTP_PORT") and _env("SMTP_FROM") and _env("APP_URL") and daily_limit() > 0
    )


def app_url() -> str:
    return _env("APP_URL").rstrip("/")


def deliver(to: str, subject: str, body: str) -> None:
    """Manda un correo de texto por SMTP. Si falla lo anota en el log y sigue: no rompe la respuesta."""
    try:
        message = EmailMessage()
        message["From"] = _env("SMTP_FROM")
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        host, port = _env("SMTP_HOST"), int(_env("SMTP_PORT"))
        security = (_env("SMTP_SECURITY") or "starttls").lower()  # starttls, ssl o none
        user, password = _env("SMTP_USER"), os.environ.get("SMTP_PASSWORD", "")
        context = ssl.create_default_context()
        if security == "ssl":
            server: smtplib.SMTP = smtplib.SMTP_SSL(host, port, timeout=TIMEOUT_SECONDS, context=context)
        else:
            server = smtplib.SMTP(host, port, timeout=TIMEOUT_SECONDS)
        with server:
            if security == "starttls":
                server.starttls(context=context)
            if user:
                server.login(user, password)
            server.send_message(message)
    except Exception:  # noqa: BLE001 - un correo que falla no puede tirar la API
        log.exception("No se pudo enviar el correo")


def reserve(db: Session, kind: str, to: str) -> str | None:
    """Anota el correo ANTES de enviarlo. Devuelve None si se puede, o por qué no:
    "cooldown" (otro a la misma dirección hace menos de un minuto) o "daily" (se llegó al tope)."""
    now = datetime.now(timezone.utc)
    recent = db.scalar(
        select(func.count())
        .select_from(EmailLog)
        .where(EmailLog.to_email == to, EmailLog.created_at > now - COOLDOWN)
    )
    if recent:
        return "cooldown"
    today = db.scalar(
        select(func.count()).select_from(EmailLog).where(EmailLog.created_at > now - WINDOW)
    )
    if (today or 0) >= daily_limit():
        return "daily"
    db.add(EmailLog(kind=kind, to_email=to))
    db.flush()
    return None


def verification_text(link: str) -> tuple[str, str]:
    return (
        "Confirmá tu correo en Spotter",
        "Hola. Para terminar de crear tu cuenta de Spotter, confirmá tu correo con este enlace:\n\n"
        f"{link}\n\n"
        "El enlace vale 24 horas. Si no fuiste vos, ignorá este correo: no se crea ninguna cuenta.\n",
    )


def change_email_text(link: str) -> tuple[str, str]:
    return (
        "Confirmá tu correo nuevo en Spotter",
        "Hola. Pediste usar este correo en tu cuenta de Spotter. Confirmalo con este enlace:\n\n"
        f"{link}\n\n"
        "El enlace vale 24 horas. Al confirmarlo se cierran tus sesiones y entrás con este correo. "
        "Si no fuiste vos, ignorá este correo: tu cuenta sigue igual.\n",
    )


def reset_text(link: str) -> tuple[str, str]:
    return (
        "Cambiá tu contraseña de Spotter",
        "Hola. Pediste cambiar tu contraseña de Spotter. Elegí una nueva con este enlace:\n\n"
        f"{link}\n\n"
        "El enlace vale 1 hora y sirve una sola vez. Si no fuiste vos, ignorá este correo: tu "
        "contraseña sigue igual.\n",
    )

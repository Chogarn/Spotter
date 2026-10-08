"""Llamadas a Gemini con los topes del plan gratuito.

Regla dura del proyecto: la IA nunca debe generar costo. Por eso:
- Los topes (por minuto y por día) se aplican ANTES de llamar a Gemini.
- Cada llamada escribe una fila en `ai_calls` ANTES de enviarse, y esa tabla no se borra.
- Si falta algún dato de configuración, no se llama (no hay valores por defecto).
"""

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.schema import gemini_schema
from app.enums import AiCallKind
from app.models import AiCall

# Cuánto espera la app a Gemini antes de cortar (las llamadas tardan de 20 a 90 segundos).
REQUEST_TIMEOUT_MS = 120_000

# Google reinicia la cuota diaria a medianoche, hora del Pacífico.
GOOGLE_TZ = ZoneInfo("America/Los_Angeles")


class AiConfigError(Exception):
    """Falta o es inválida la configuración de Gemini en el entorno."""


class AiLimitError(Exception):
    """Se alcanzó el tope por minuto o por día. No se llamó a Gemini."""

    def __init__(self, scope: str, limit: int):
        self.scope = scope  # "minute" o "day"
        self.limit = limit
        super().__init__(f"Tope de llamadas a la IA alcanzado ({scope}: {limit})")


@dataclass(frozen=True)
class AiSettings:
    api_key: str
    model: str
    daily_limit: int
    rpm_limit: int


def load_settings() -> AiSettings:
    def required(name: str) -> str:
        value = os.environ.get(name, "").strip()
        if not value:
            raise AiConfigError(f"Falta la variable de entorno {name}")
        return value

    def positive_int(name: str) -> int:
        raw = required(name)
        try:
            value = int(raw)
        except ValueError:
            raise AiConfigError(f"{name} debe ser un número entero") from None
        if value <= 0:
            raise AiConfigError(f"{name} debe ser mayor que 0")
        return value

    return AiSettings(
        api_key=required("GEMINI_API_KEY"),
        model=required("GEMINI_MODEL"),
        daily_limit=positive_int("GEMINI_DAILY_LIMIT"),
        rpm_limit=positive_int("GEMINI_RPM_LIMIT"),
    )


def start_of_google_day(now: datetime) -> datetime:
    """Medianoche del Pacífico más reciente, en UTC."""
    local = now.astimezone(GOOGLE_TZ)
    midnight = local.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.astimezone(timezone.utc)


def _count_since(db: Session, since: datetime) -> int:
    # Se cuentan las llamadas de TODOS los usuarios: el límite de Google es por proyecto.
    return (
        db.scalar(select(func.count()).select_from(AiCall).where(AiCall.created_at >= since))
        or 0
    )


def reserve_call(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    settings: AiSettings,
    now: datetime | None = None,
) -> AiCall:
    """Revisa los topes y deja registrada la llamada ANTES de hacerla."""
    now = now or datetime.now(timezone.utc)
    if _count_since(db, now - timedelta(seconds=60)) >= settings.rpm_limit:
        raise AiLimitError("minute", settings.rpm_limit)
    if _count_since(db, start_of_google_day(now)) >= settings.daily_limit:
        raise AiLimitError("day", settings.daily_limit)

    call = AiCall(user_id=user_id, kind=kind, model=settings.model, created_at=now)
    db.add(call)
    db.commit()
    return call


def get_client(api_key: str) -> Any:
    """Cliente de Gemini. Aparte para poder reemplazarlo en los tests."""
    from google import genai
    from google.genai import types

    return genai.Client(
        api_key=api_key, http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS)
    )


def generate_json(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    prompt: str,
    json_schema: dict[str, Any],
) -> str:
    """Pide a Gemini una respuesta en JSON y devuelve el texto sin validar.

    Quien llama valida el JSON con Pydantic. Cada intento es una llamada y cuenta en los topes.
    """
    settings = load_settings()
    call = reserve_call(db, user_id, kind, settings)
    try:
        client = get_client(settings.api_key)
        interaction = client.interactions.create(
            model=settings.model,
            input=prompt,
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": gemini_schema(json_schema),
            },
        )
        text = interaction.output_text
    except Exception:
        call.succeeded = False
        db.commit()
        raise
    call.succeeded = True
    db.commit()
    return text

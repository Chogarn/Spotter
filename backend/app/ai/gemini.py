"""Llamadas a la IA con los topes del plan gratuito: Gemini o Cloudflare Workers AI.

El proveedor de "Generar rutina" se elige por entorno con `AI_PROVIDER` (`gemini` o `cloudflare`,
decisión 139): las condiciones de Gemini no permiten el plan gratis para usuarios del EEE, Suiza o el
Reino Unido. Los embeddings siguen en Gemini, pero solo se calculan a mano con `index_catalog`.

Regla dura del proyecto: la IA nunca debe generar costo. Por eso:
- Los topes (por minuto y por día) se aplican ANTES de llamar a la IA.
- Cada llamada escribe una fila en `ai_calls` ANTES de enviarse, y esa tabla no se borra.
- Si falta algún dato de configuración, no se llama (no hay valores por defecto).

Los embeddings (RAG, decisión 58) siguen las mismas reglas, pero con topes propios: Google limita
cada modelo por separado, así que cada uno se cuenta contra su propio tope.
"""

import math
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.schema import gemini_schema
from app.enums import AiCallKind
from app.models import EMBEDDING_DIM, AiCall

# Cuánto espera la app a Gemini antes de cortar (las llamadas tardan de 20 a 90 segundos).
REQUEST_TIMEOUT_MS = 120_000

# Google reinicia la cuota diaria a medianoche, hora del Pacífico; Cloudflare, a las 00:00 UTC.
GOOGLE_TZ = ZoneInfo("America/Los_Angeles")
UTC_TZ = ZoneInfo("UTC")

PROVIDERS = ("gemini", "cloudflare")


class AiConfigError(Exception):
    """Falta o es inválida la configuración de Gemini en el entorno."""


class AiLimitError(Exception):
    """Se alcanzó el tope por minuto o por día. No se llamó a Gemini."""

    def __init__(self, scope: str, limit: int, reset_at: datetime | None = None):
        self.scope = scope  # "minute" o "day"
        self.limit = limit
        self.reset_at = reset_at  # en el tope diario: cuándo empieza el día siguiente del proveedor
        super().__init__(f"Tope de llamadas a la IA alcanzado ({scope}: {limit})")


@dataclass(frozen=True)
class AiSettings:
    api_key: str
    model: str
    daily_limit: int
    rpm_limit: int
    day_tz: ZoneInfo = GOOGLE_TZ  # dónde empieza el día de la cuota


@dataclass(frozen=True)
class EmbeddingSettings:
    """Lo mismo que AiSettings, para el modelo de embeddings (con sus propios topes)."""

    api_key: str
    model: str
    daily_limit: int
    rpm_limit: int
    day_tz: ZoneInfo = GOOGLE_TZ


def _required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise AiConfigError(f"Falta la variable de entorno {name}")
    return value


def _positive_int(name: str) -> int:
    raw = _required(name)
    try:
        value = int(raw)
    except ValueError:
        raise AiConfigError(f"{name} debe ser un número entero") from None
    if value <= 0:
        raise AiConfigError(f"{name} debe ser mayor que 0")
    return value


def load_provider() -> str:
    """El proveedor de generación. Sin valor por defecto: si falta o es otro, no se llama."""
    provider = _required("AI_PROVIDER").lower()
    if provider not in PROVIDERS:
        raise AiConfigError(f"AI_PROVIDER debe ser uno de: {', '.join(PROVIDERS)}")
    return provider


def load_settings() -> AiSettings:
    return AiSettings(
        api_key=_required("GEMINI_API_KEY"),
        model=_required("GEMINI_MODEL"),
        daily_limit=_positive_int("GEMINI_DAILY_LIMIT"),
        rpm_limit=_positive_int("GEMINI_RPM_LIMIT"),
    )


def load_embedding_settings() -> EmbeddingSettings:
    return EmbeddingSettings(
        api_key=_required("GEMINI_API_KEY"),
        model=_required("GEMINI_EMBEDDING_MODEL"),
        daily_limit=_positive_int("GEMINI_EMBEDDING_DAILY_LIMIT"),
        rpm_limit=_positive_int("GEMINI_EMBEDDING_RPM_LIMIT"),
    )


def start_of_day(now: datetime, tz: ZoneInfo) -> datetime:
    """La medianoche más reciente en `tz`, en UTC."""
    local = now.astimezone(tz)
    midnight = local.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.astimezone(timezone.utc)


def start_of_google_day(now: datetime) -> datetime:
    """Medianoche del Pacífico más reciente, en UTC."""
    return start_of_day(now, GOOGLE_TZ)


def _count_since(db: Session, since: datetime, model: str) -> int:
    # Se cuentan las llamadas de TODOS los usuarios (el límite de Google es por proyecto) y del
    # mismo modelo (cada modelo tiene su propio límite).
    return (
        db.scalar(
            select(func.count())
            .select_from(AiCall)
            .where(AiCall.created_at >= since, AiCall.model == model)
        )
        or 0
    )


def reserve_calls(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    settings: Any,  # AiSettings, EmbeddingSettings o CloudflareSettings: model, topes y day_tz
    units: int = 1,
    now: datetime | None = None,
) -> list[AiCall]:
    """Revisa los topes y deja registradas `units` llamadas ANTES de hacerlas.

    Una fila de `ai_calls` es una unidad de cuota. En generación, un pedido es una unidad; en
    embeddings, Google cuenta cada texto del lote como un pedido, así que un lote de N textos
    reserva N unidades. Si no entran todas, no se reserva ninguna.
    """
    now = now or datetime.now(timezone.utc)
    last_minute = _count_since(db, now - timedelta(seconds=60), settings.model)
    if last_minute + units > settings.rpm_limit:
        raise AiLimitError("minute", settings.rpm_limit)
    day_start = start_of_day(now, settings.day_tz)
    today = _count_since(db, day_start, settings.model)
    if today + units > settings.daily_limit:
        # El día siguiente empieza 24 h después en UTC; en el Pacífico, a la medianoche local
        # (un cambio de horario puede hacer ese día de 23 o 25 horas).
        next_local = (day_start.astimezone(settings.day_tz) + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        raise AiLimitError("day", settings.daily_limit, next_local.astimezone(timezone.utc))

    calls = [
        AiCall(user_id=user_id, kind=kind, model=settings.model, created_at=now)
        for _ in range(units)
    ]
    db.add_all(calls)
    db.commit()
    return calls


def reserve_call(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    settings: Any,
    now: datetime | None = None,
) -> AiCall:
    """Una sola unidad: revisa los topes y deja registrada la llamada ANTES de hacerla."""
    return reserve_calls(db, user_id, kind, settings, units=1, now=now)[0]


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
    timeout_seconds: float | None = None,
) -> str:
    """Pide a la IA del entorno (`AI_PROVIDER`) una respuesta en JSON y devuelve el texto sin validar.

    Quien llama valida el JSON con Pydantic. Cada intento es una llamada y cuenta en los topes.
    `timeout_seconds` lo usa Cloudflare (el reintento tiene menos tiempo); Gemini corta a los 120 s.
    """
    if load_provider() == "cloudflare":
        from app.ai import cloudflare  # aparte: cloudflare.py usa reserve_call de este módulo

        return cloudflare.generate_json(db, user_id, kind, prompt, json_schema, timeout_seconds)
    return _gemini_generate_json(db, user_id, kind, prompt, json_schema)


def _gemini_generate_json(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    prompt: str,
    json_schema: dict[str, Any],
) -> str:
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


# Cuántos textos van en cada pedido de embeddings. Google admite hasta 100 y cuenta CADA TEXTO como
# un pedido de la cuota (verificado el 2026-10-14: un lote de 50 gastó 50 del límite por minuto).
EMBED_BATCH_SIZE = 50


def _normalize(vector: list[float]) -> list[float]:
    """Largo 1. Con menos de 3072 dimensiones, gemini-embedding-001 no los devuelve normalizados."""
    norm = math.sqrt(sum(x * x for x in vector))
    if norm == 0:
        raise ValueError("el embedding vino en cero")
    return [x / norm for x in vector]


def embed_texts(
    db: Session,
    user_id: int,
    texts: list[str],
    task_type: str,
) -> list[list[float]]:
    """Convierte textos en vectores de EMBEDDING_DIM dimensiones, normalizados.

    `task_type`: "RETRIEVAL_DOCUMENT" para los ejercicios y "RETRIEVAL_QUERY" para la consulta.
    Cada pedido lleva hasta EMBED_BATCH_SIZE textos y cuenta un lugar de los topes por texto.
    """
    if not texts:
        return []
    settings = load_embedding_settings()
    client = get_client(settings.api_key)
    vectors: list[list[float]] = []
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[start : start + EMBED_BATCH_SIZE]
        calls = reserve_calls(db, user_id, AiCallKind.EMBED, settings, units=len(batch))
        try:
            result = client.models.embed_content(
                model=settings.model,
                contents=batch,
                config={"task_type": task_type, "output_dimensionality": EMBEDDING_DIM},
            )
            batch_vectors = [list(e.values) for e in result.embeddings]
            if len(batch_vectors) != len(batch) or any(
                len(v) != EMBEDDING_DIM for v in batch_vectors
            ):
                raise ValueError("Gemini devolvió embeddings de otro tamaño al pedido")
            batch_vectors = [_normalize(v) for v in batch_vectors]
        except Exception:
            for call in calls:
                call.succeeded = False
            db.commit()
            raise
        for call in calls:
            call.succeeded = True
        db.commit()
        vectors += batch_vectors
    return vectors

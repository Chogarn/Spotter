"""Generación con Cloudflare Workers AI (decisión 139), con los mismos topes que Gemini.

Por qué Cloudflare: las condiciones de Gemini solo permiten servicios pagos al ofrecer la app a
usuarios del EEE, Suiza o el Reino Unido. Workers AI tiene un plan gratis sin tarjeta que por
diseño no puede cobrar: al acabarse la cuota diaria (10.000 neuronas, se reinicia a las 00:00 UTC)
los pedidos fallan con un error. Probado el 2026-11-12 con el prompt real: `gpt-oss-120b` armó
rutinas que pasan las reglas, con unas 1.000 a 1.200 neuronas y unos 2 minutos por llamada.

Igual que en Gemini: el tope se revisa y la fila de `ai_calls` se escribe ANTES de llamar, y sin
configuración no se llama (no hay valores por defecto).
"""

import json
import logging
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.ai.gemini import UTC_TZ, _positive_int, _required, reserve_call
from app.ai.schema import strict_schema
from app.enums import AiCallKind

logger = logging.getLogger(__name__)

API_URL = "https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"

# Una llamada tardó de 74 a 129 s en la prueba. Por debajo de los 300 s de una función de Vercel.
REQUEST_TIMEOUT_SECONDS = 200

# Algunos modelos traen 256 por defecto y cortarían la semana. gpt-oss-120b razona antes de
# contestar y ese razonamiento también cuenta: con 8.000 se cortó a mitad del JSON.
MAX_OUTPUT_TOKENS = 16000

# Cuánto razona gpt-oss antes de contestar. Con el valor por defecto (medio) una rutina llegó a
# 13.500 tokens de salida y pasó los 200 s. Probado el 2026-11-12: Cloudflare acepta
# `reasoning_effort` (no `reasoning.effort`) y con "low" el razonamiento casi desaparece. Pensar
# menos puede equivocarse más: las reglas del código lo atajan y piden de nuevo.
REASONING_EFFORT = "low"


@dataclass(frozen=True)
class CloudflareSettings:
    account_id: str
    api_token: str
    model: str
    daily_limit: int
    rpm_limit: int
    day_tz: ZoneInfo = UTC_TZ


class CloudflareError(Exception):
    """Cloudflare respondió con error o no respondió. El texto lleva el código HTTP si lo hubo."""


def load_cloudflare_settings() -> CloudflareSettings:
    return CloudflareSettings(
        account_id=_required("CLOUDFLARE_ACCOUNT_ID"),
        api_token=_required("CLOUDFLARE_API_TOKEN"),
        model=_required("CLOUDFLARE_MODEL"),
        daily_limit=_positive_int("CLOUDFLARE_DAILY_LIMIT"),
        rpm_limit=_positive_int("CLOUDFLARE_RPM_LIMIT"),
    )


def post_json(url: str, token: str, body: dict[str, Any], timeout: float) -> dict[str, Any]:
    """El pedido HTTP. Aparte para poder reemplazarlo en los tests (nunca llaman de verdad)."""
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise CloudflareError(f"HTTP {error.code}: {detail}") from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise CloudflareError(f"sin respuesta: {error!r}") from error


def response_text(raw: dict[str, Any]) -> str:
    """El texto de la respuesta. gpt-oss devuelve el formato de OpenAI (`choices`); otros modelos
    de Workers AI, `response` (texto u objeto ya armado)."""
    if not raw.get("success", False):
        raise CloudflareError(f"Cloudflare respondió con error: {str(raw.get('errors'))[:500]}")
    result = raw.get("result") or {}
    choices = result.get("choices") or []
    if choices:
        choice = choices[0]
        if choice.get("finish_reason") == "length":
            # El JSON viene cortado: Pydantic lo va a rechazar y se pide de nuevo si queda tiempo.
            logger.warning("Cloudflare cortó la respuesta en el tope de %s tokens", MAX_OUTPUT_TOKENS)
        text = (choice.get("message") or {}).get("content")
    else:
        text = result.get("response")
    if isinstance(text, (dict, list)):
        text = json.dumps(text, ensure_ascii=False)
    if not text:
        raise CloudflareError("Cloudflare respondió sin texto")
    return text


def generate_json(
    db: Session,
    user_id: int,
    kind: AiCallKind,
    prompt: str,
    json_schema: dict[str, Any],
    timeout_seconds: float | None = None,
) -> str:
    """Pide a Cloudflare una respuesta en JSON y devuelve el texto sin validar."""
    settings = load_cloudflare_settings()
    call = reserve_call(db, user_id, kind, settings)
    body = {
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_schema", "json_schema": strict_schema(json_schema)},
        "max_tokens": MAX_OUTPUT_TOKENS,
        "reasoning_effort": REASONING_EFFORT,
    }
    timeout = min(timeout_seconds or REQUEST_TIMEOUT_SECONDS, REQUEST_TIMEOUT_SECONDS)
    try:
        raw = post_json(
            API_URL.format(account=settings.account_id, model=settings.model),
            settings.api_token,
            body,
            timeout,
        )
        text = response_text(raw)
    except Exception:
        call.succeeded = False
        db.commit()
        raise
    call.succeeded = True
    db.commit()
    return text

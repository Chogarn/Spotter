"""Prueba Cloudflare Workers AI con el prompt real de "Generar rutina" (cambio de IA por la cláusula
del EEE de Gemini; ver `reports/IA gratis para usuarios de la UE.md`).

Es una prueba de desarrollo, aparte de la app: no toca la base, no guarda propuestas, no escribe en
`ai_calls` (decisión del usuario, 2026-11-12) y no usa embeddings. Cloudflare en su plan gratis no
puede cobrar: al acabarse la cuota diaria (10.000 neuronas, se reinicia a las 00:00 UTC) los
pedidos fallan con un error.

Arma el prompt con las mismas funciones que la app, lo manda a cada modelo una sola vez (sin
reintento, para medir cuántas pasan al primer intento) y le pasa a la respuesta las mismas pruebas
que la app: Pydantic (`RoutineProposal`), `canonicalize` y `validate_routine`.

Necesita en el `.env`: CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (permiso de Workers AI).

Uso:

    docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.probar_cloudflare --dry-run
    ... python -m app.scripts.probar_cloudflare                       # los 6 pedidos
    ... python -m app.scripts.probar_cloudflare --model @cf/openai/gpt-oss-120b --case masa
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.ai.catalog import CatalogExercise, canonicalize, load_catalog
from app.ai.prompt import build_prompt
from app.ai.retrieve import PER_GROUP, allowed
from app.ai.routine import RoutineProposal
from app.ai.rules import validate_routine
from app.ai.schema import strict_schema
from app.enums import Goal, Level, Muscle, RoutineSplit
from app.models import Profile

API = "https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
TIMEOUT_SECONDS = 300  # con 13.000 tokens de salida, gpt-oss-120b pasó los 180 s
# El valor por defecto de algunos modelos es 256: cortaría la semana. En la ronda 1 (2026-11-12),
# 8.000 no alcanzó a gpt-oss-120b porque el razonamiento también cuenta como salida.
MAX_OUTPUT_TOKENS = 16000

# Ronda 2: llama-4-scout salió (Cloudflare cortó por tiempo, 408, en los dos casos).
MODELS = (
    "@cf/openai/gpt-oss-120b",
    "@cf/qwen/qwen3-30b-a3b-fp8",
)

# Cómo pedir menos razonamiento. Cloudflare no documenta un parámetro; se usa la convención de cada
# fabricante en el texto: gpt-oss lee "Reasoning: low" en el mensaje de sistema (formato "harmony" de
# OpenAI) y Qwen3 apaga el razonamiento con "/no_think" al final del mensaje del usuario.
SYSTEM_MESSAGE = {"@cf/openai/gpt-oss-120b": "Reasoning: low"}
USER_SUFFIX = {"@cf/qwen/qwen3-30b-a3b-fp8": "\n\n/no_think"}

# Neuronas por millón de tokens (entrada, salida), de la página oficial de precios, 2026-11-12:
# https://developers.cloudflare.com/workers-ai/platform/pricing/
NEURONS_PER_M = {
    "@cf/openai/gpt-oss-120b": (31818, 68182),
    "@cf/meta/llama-4-scout-17b-16e-instruct": (24545, 77273),
    "@cf/qwen/qwen3-30b-a3b-fp8": (4625, 30475),
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": (26668, 204805),
    "@cf/openai/gpt-oss-20b": (18182, 27273),
    "@cf/mistralai/mistral-small-3.1-24b-instruct": (31876, 50488),
}
DAILY_NEURONS = 10_000


@dataclass(frozen=True)
class Case:
    key: str
    goal: Goal
    level: Level
    days: int
    split: RoutineSplit


CASES = (
    Case("masa", Goal.MASA, Level.INTERMEDIO, 4, RoutineSplit.UPPER_LOWER),
    Case("grasa", Goal.PERDER_GRASA, Level.PRINCIPIANTE, 3, RoutineSplit.FULL_BODY),
)


def fake_profile() -> Profile:
    """Perfil de prueba en memoria: nunca se guarda."""
    return Profile(
        user_id=0,
        age=30,
        birth_date=date(1996, 5, 1),
        weight_kg=Decimal("78"),
        height_cm=176,
        sex="masculino",
        limitations=None,
    )


def candidates(goal: Goal, level: Level) -> list[CatalogExercise]:
    """Lo permitido por nivel y objetivo, recortado a PER_GROUP por grupo como hace el RAG.

    Sin vectores no hay orden por parecido: se toma el orden del catálogo. El tamaño del prompt
    queda igual que el de la app (hasta PER_GROUP por músculo principal).
    """
    taken: dict[Muscle, int] = {}
    chosen = []
    for exercise in load_catalog():
        if not allowed(exercise, goal, level):
            continue
        if taken.get(exercise.primary_muscle, 0) < PER_GROUP:
            chosen.append(exercise)
            taken[exercise.primary_muscle] = taken.get(exercise.primary_muscle, 0) + 1
    order = {m: i for i, m in enumerate(Muscle)}
    chosen.sort(key=lambda e: order[e.primary_muscle])
    return chosen


def call(account: str, token: str, model: str, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
    messages = []
    if model in SYSTEM_MESSAGE:
        messages.append({"role": "system", "content": SYSTEM_MESSAGE[model]})
    messages.append({"role": "user", "content": prompt + USER_SUFFIX.get(model, "")})
    body = {
        "messages": messages,
        "response_format": {"type": "json_schema", "json_schema": schema},
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    request = urllib.request.Request(
        API.format(account=account, model=model),
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        return {"success": False, "http_status": error.code, "errors": detail[:2000]}
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        # Ronda 2: un corte por tiempo del lado nuestro tiraba abajo todo el script.
        return {"success": False, "http_status": "sin respuesta", "errors": repr(error)[:2000]}


def extract(raw: dict[str, Any]) -> tuple[str | None, dict[str, Any]]:
    """El texto de la respuesta y el uso de tokens. La forma cambia según el modelo."""
    result = raw.get("result") or {}
    usage = result.get("usage") or {}
    text: Any = result.get("response")
    if text is None and result.get("choices"):
        text = (result["choices"][0].get("message") or {}).get("content")
    if text is None and result.get("output"):  # formato "responses" de OpenAI
        for item in result["output"]:
            for part in item.get("content") or []:
                if part.get("type") in ("output_text", "text"):
                    text = part.get("text")
    if isinstance(text, (dict, list)):
        text = json.dumps(text, ensure_ascii=False)
    return text, usage


@dataclass
class Outcome:
    model: str
    case: str
    seconds: float = 0.0
    input_tokens: int | None = None
    output_tokens: int | None = None
    json_ok: bool = False
    rules_ok: bool = False
    errors: list[str] = field(default_factory=list)
    soft: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def neurons(self) -> float | None:
        prices = NEURONS_PER_M.get(self.model)
        if not prices or self.input_tokens is None or self.output_tokens is None:
            return None
        return (self.input_tokens * prices[0] + self.output_tokens * prices[1]) / 1_000_000


def run_one(account: str, token: str, model: str, case: Case, prompt: str, out_dir: Path) -> Outcome:
    outcome = Outcome(model=model, case=case.key)
    start = time.monotonic()
    raw = call(account, token, model, prompt, strict_schema(RoutineProposal.model_json_schema()))
    outcome.seconds = time.monotonic() - start

    safe = model.replace("@cf/", "").replace("/", "_")
    (out_dir / f"{case.key}__{safe}.json").write_text(
        json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if not raw.get("success", False):
        outcome.errors.append(f"Cloudflare: {raw.get('http_status', '')} {raw.get('errors')}")
        return outcome

    text, usage = extract(raw)
    outcome.input_tokens = usage.get("prompt_tokens") or usage.get("input_tokens")
    outcome.output_tokens = usage.get("completion_tokens") or usage.get("output_tokens")
    choices = (raw.get("result") or {}).get("choices") or [{}]
    if choices[0].get("finish_reason") == "length":
        outcome.errors.append(f"Se cortó por el tope de {MAX_OUTPUT_TOKENS} tokens de salida.")
    if not text:
        outcome.errors.append("La respuesta vino sin texto (ver el JSON guardado).")
        return outcome

    try:
        routine = RoutineProposal.model_validate_json(text)
    except ValidationError as error:
        outcome.errors += [
            f"JSON: {'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in error.errors()[:8]
        ]
        return outcome
    outcome.json_ok = True

    routine = canonicalize(routine)
    result = validate_routine(
        routine, case.goal, case.level, case.days, catalog_extra_names=(), split=case.split
    )
    outcome.rules_ok = result.ok and not result.soft_issues
    outcome.errors += [f"{i.rule}: {i.message}" for i in result.errors]
    outcome.soft += [f"{i.rule}: {i.message}" for i in result.soft_issues]
    outcome.warnings += [f"{i.rule}: {i.message}" for i in result.warnings]
    return outcome


def report(outcomes: list[Outcome], prompts: dict[str, str], path: Path) -> str:
    lines = [
        f"# Prueba de Cloudflare Workers AI ({datetime.now():%Y-%m-%d %H:%M})",
        "",
        "Una llamada por caso y modelo, sin reintento. Prompt real de la app con un perfil de prueba.",
        "",
        "| Caso | Modelo | Segundos | Tokens entrada | Tokens salida | Neuronas | Llamadas/día | JSON | Reglas |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for o in outcomes:
        n = o.neurons
        per_day = f"{DAILY_NEURONS / n:.0f}" if n else "?"
        lines.append(
            f"| {o.case} | `{o.model}` | {o.seconds:.0f} | {o.input_tokens or '?'} | "
            f"{o.output_tokens or '?'} | {f'{n:.0f}' if n else '?'} | {per_day} | "
            f"{'sí' if o.json_ok else 'no'} | {'pasa' if o.rules_ok else ('avisos' if o.json_ok and not o.errors else 'no')} |"
        )
    lines.append("")
    for o in outcomes:
        lines.append(f"## {o.case} · `{o.model}`")
        for title, items in (("Errores", o.errors), ("A corregir (reintento)", o.soft), ("Avisos", o.warnings)):
            if items:
                lines.append(f"**{title}:**")
                lines += [f"- {item}" for item in items]
        if not (o.errors or o.soft or o.warnings):
            lines.append("Sin problemas.")
        lines.append("")
    lines.append("## Tamaño de los prompts (caracteres)")
    lines += [f"- {key}: {len(text)}" for key, text in prompts.items()]
    text = "\n".join(lines) + "\n"
    path.write_text(text, encoding="utf-8")
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="arma los prompts y no llama")
    parser.add_argument("--model", action="append", help="modelo a probar (se puede repetir)")
    parser.add_argument("--case", action="append", choices=[c.key for c in CASES])
    parser.add_argument("--out", default="/app/cloudflare_prueba", help="carpeta de resultados")
    args = parser.parse_args()

    models = tuple(args.model) if args.model else MODELS
    cases = [c for c in CASES if not args.case or c.key in args.case]
    profile = fake_profile()
    prompts = {
        c.key: build_prompt(profile, c.goal, c.level, None, c.days, candidates(c.goal, c.level), None, c.split)
        for c in cases
    }

    estimate = 0.0
    for model in models:
        prices = NEURONS_PER_M.get(model, (0, 0))
        for key, text in prompts.items():
            # Estimación gruesa: unos 4 caracteres por token de entrada y 4.000 de salida.
            estimate += (len(text) / 4 * prices[0] + 4000 * prices[1]) / 1_000_000
    print(f"Modelos: {', '.join(models)}")
    print(f"Casos: {', '.join(c.key for c in cases)} ({len(models) * len(cases)} pedidos)")
    for key, text in prompts.items():
        print(f"Prompt {key}: {len(text)} caracteres (~{len(text) // 4} tokens)")
    print(f"Neuronas estimadas: ~{estimate:.0f} de {DAILY_NEURONS} por día")
    if args.dry_run:
        return 0

    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not account or not token:
        print("Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN en el .env (y recrear el contenedor).")
        return 1

    out_dir = Path(args.out) / datetime.now().strftime("%Y%m%d-%H%M%S")
    out_dir.mkdir(parents=True, exist_ok=True)
    outcomes = []
    for case in cases:
        for model in models:
            print(f"→ {case.key} · {model} ...", flush=True)
            outcome = run_one(account, token, model, case, prompts[case.key], out_dir)
            print(f"  {outcome.seconds:.0f} s · JSON {'sí' if outcome.json_ok else 'no'} · "
                  f"{len(outcome.errors)} errores, {len(outcome.soft)} a corregir", flush=True)
            outcomes.append(outcome)
    print()
    print(report(outcomes, prompts, out_dir / "informe.md"))
    print(f"Respuestas e informe en {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

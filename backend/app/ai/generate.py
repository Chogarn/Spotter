"""Genera una propuesta de rutina: prompt, llamada a la IA, validación y un reintento.

Sin FastAPI: el endpoint solo traduce las excepciones de acá a códigos HTTP.
"""

import logging
import threading
import time
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.gemini import AiConfigError, AiLimitError, generate_json
from app.ai.catalog import canonicalize
from app.ai.history import PreviousWeek, build_previous_week, weight_jump_warnings
from app.ai.plan_writer import active_week
from app.ai.prompt import build_prompt
from app.ai.retrieve import retrieve_candidates
from app.ai.routine import RoutineProposal
from app.ai.rules import Issue, validate_routine
from app.enums import AiCallKind, Goal, Level, ProposalKind, ProposalStatus, RoutineSplit
from app.models import AiCall, PlanProposal, User

MAX_ATTEMPTS = 2  # la primera llamada y un reintento; cada intento cuenta en los topes

# Decisión 139: una función de Vercel corta a los 300 s y una llamada a Cloudflare tarda hasta unos
# 130. El reintento se hace solo si queda tiempo para otra llamada parecida a la primera, y con el
# tiempo que queda como corte.
TOTAL_BUDGET_SECONDS = 280

# Los únicos avisos "blandos" que gastan un reintento: la estructura elegida no se respeta o faltan los
# pesos. Los demás (reparto, volumen, duración) se aceptan con su aviso.
RETRY_RULES = {"Split", "Peso"}


# Una sola generación a la vez por persona. Cada una gasta cuota de la IA y la que termina última
# pisaría a la otra. El cliente corta a los 120 s: pasado ese margen, una fila "en curso" que quedó
# sin cerrar (la app se cayó) deja de bloquear sola.
IN_PROGRESS_SECONDS = 150
_running: set[int] = set()
_running_lock = threading.Lock()


class GenerationInProgress(Exception):
    """Ya hay una generación en curso para este usuario."""


def _in_progress_in_db(db: Session, user_id: int) -> bool:
    """¿Hay una llamada de generación sin terminar de este usuario? (otra pestaña, otro proceso)."""
    since = datetime.now(timezone.utc) - timedelta(seconds=IN_PROGRESS_SECONDS)
    count = db.scalar(
        select(func.count())
        .select_from(AiCall)
        .where(
            AiCall.user_id == user_id,
            AiCall.kind.in_((AiCallKind.GENERATE, AiCallKind.WEEK_CLOSE)),
            AiCall.succeeded.is_(None),
            AiCall.created_at >= since,
        )
    )
    return bool(count)


class ProfileMissing(Exception):
    """Todavía no cargó el perfil."""


class ActiveWeekExists(Exception):
    """Ya tiene una semana activa: no se genera la primera rutina de nuevo."""


logger = logging.getLogger(__name__)


class AiUpstreamError(Exception):
    """La IA falló o no respondió a tiempo."""

    @property
    def overloaded(self) -> bool:
        """El proveedor dijo que está saturado (503) o que se pasó de pedidos o de cuota (429)."""
        text = str(self).lower()
        return any(s in text for s in ("503", "429", "high demand", "unavailable", "overloaded"))


class GenerationFailed(Exception):
    """Después de los intentos, la IA no devolvió una rutina válida."""

    def __init__(self, problems: list[str]):
        self.problems = problems
        super().__init__("; ".join(problems))


def _pydantic_problems(error: ValidationError) -> list[str]:
    return [
        f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in error.errors()[:10]
    ]


def _correction(problems: list[str]) -> str:
    lista = "\n".join(f"- {p}" for p in problems)
    return (
        "\n\n# Corrección\nLa respuesta anterior tenía estos problemas. Armá la rutina de nuevo "
        f"corrigiéndolos y respetando todo lo anterior:\n{lista}\n"
    )


def generate_proposal(
    db: Session,
    user: User,
    goal: Goal,
    level: Level,
    routine_id: int | None = None,
    days: int | None = None,
    minutes: int | None = None,
    split: RoutineSplit | None = None,
) -> PlanProposal:
    """Genera una propuesta, de a una por persona (`GenerationInProgress` si ya hay otra)."""
    with _running_lock:
        if user.id in _running:
            raise GenerationInProgress
        _running.add(user.id)
    try:
        if _in_progress_in_db(db, user.id):
            raise GenerationInProgress
        return _generate_proposal(db, user, goal, level, routine_id, days, minutes, split)
    finally:
        with _running_lock:
            _running.discard(user.id)


def _generate_proposal(
    db: Session,
    user: User,
    goal: Goal,
    level: Level,
    routine_id: int | None = None,
    days: int | None = None,
    minutes: int | None = None,
    split: RoutineSplit | None = None,
) -> PlanProposal:
    if user.profile is None:
        raise ProfileMissing
    if active_week(db, user.id) is not None:
        raise ActiveWeekExists

    profile = user.profile
    # Continuar una rutina: la IA lee lo planificado frente a lo real de su última semana cerrada.
    previous = build_previous_week(db, routine_id) if routine_id is not None else None
    kind = ProposalKind.WEEK_CLOSE if previous is not None else ProposalKind.GENERATE
    call_kind = AiCallKind.WEEK_CLOSE if previous is not None else AiCallKind.GENERATE
    # RAG (decisión 58): 1 embedding de la consulta y los ejercicios más adecuados de cada grupo.
    # Si no se puede, devuelve todo lo permitido por nivel y objetivo: no se cae la generación.
    candidates = retrieve_candidates(
        db, user.id, goal, level, keep_names=previous.exercise_names if previous else ()
    )
    base_prompt = build_prompt(
        profile, goal, level, previous.text if previous else None, days, candidates.exercises,
        minutes, split,
    )
    prompt = base_prompt
    problems: list[str] = []
    started = time.monotonic()
    timeout: float | None = None
    # Una rutina válida pero con el split mal: se guarda por si el reintento no se puede hacer o falla.
    fallback = None

    def accept(routine: RoutineProposal, result) -> PlanProposal:
        if previous is not None:
            result.warnings += [
                Issue(rule, message) for rule, message in weight_jump_warnings(routine, previous)
            ]
        return _save(db, user, routine, result, goal, level, routine_id, kind, days, minutes, split)

    for attempt in range(MAX_ATTEMPTS):
        try:
            text = generate_json(
                db, user.id, call_kind, prompt, RoutineProposal.model_json_schema(), timeout
            )
        except Exception as error:
            if fallback is not None:
                # El reintento falló (tope, corte de tiempo, la IA): ya hay una rutina usable con su aviso.
                logger.warning(
                    "El reintento falló (%s); se usa la rutina anterior con sus avisos", type(error).__name__
                )
                break
            if isinstance(error, (AiConfigError, AiLimitError)):
                raise
            logger.error("La IA falló en el intento %s: %s: %s", attempt + 1, type(error).__name__, error)
            raise AiUpstreamError(str(error)) from error

        try:
            routine = RoutineProposal.model_validate_json(text)
        except ValidationError as error:
            problems = _pydantic_problems(error)
        else:
            # Decisión 58: los ejercicios salen del catálogo y sus etiquetas las pone el catálogo.
            # Al continuar, los de la semana anterior se pueden mantener aunque sean viejos.
            routine = canonicalize(routine)
            result = validate_routine(
                routine, goal, level, days,
                catalog_extra_names=previous.exercise_names if previous else (),
                minutes=minutes,
                split=split,
            )
            # Decisión 139: el reparto, el volumen y la duración desparejos ya no piden otra rutina:
            # se aceptan con su aviso. Gastan un reintento los errores, el JSON inválido, un split que
            # no respeta lo que la persona eligió (decisión 91) y los pesos que faltan (2026-11-13),
            # y esos dos últimos solo si queda un intento.
            retry_problems = [i for i in result.soft_issues if i.rule in RETRY_RULES]
            if result.ok and (not retry_problems or attempt + 1 >= MAX_ATTEMPTS):
                return accept(routine, result)
            if result.ok:
                fallback = (routine, result)
                problems = [f"{i.rule}: {i.message}" for i in retry_problems]
            else:
                problems = [f"{i.rule}: {i.message}" for i in result.errors]
            # Para saber qué devolvió la IA cuando la rutina no pasa las reglas (la rechazada no se
            # guarda en ningún lado). Solo los nombres de los ejercicios, no datos de la persona.
            logger.warning(
                "Rutina rechazada en el intento %s: %s | ejercicios: %s",
                attempt + 1,
                " | ".join(problems[:5]),
                [e.name for d in routine.days for e in d.exercises],
            )

        if attempt + 1 < MAX_ATTEMPTS:
            elapsed = time.monotonic() - started
            remaining = TOTAL_BUDGET_SECONDS - elapsed
            if remaining < elapsed:
                # No entra otra llamada como la primera antes del corte de Vercel.
                logger.warning("Sin reintento: la primera llamada tardó %.0f s", elapsed)
                break
            timeout = remaining
            # Para saber por qué falla el primer intento (con Cloudflare pasó en las dos pruebas
            # del 2026-11-12 y no quedó registrado).
            logger.warning(
                "Reintento tras %.0f s por: %s", elapsed, " | ".join(problems[:5]) or "sin detalle"
            )
            prompt = base_prompt + _correction(problems)

    if fallback is not None:
        # No se pudo (o no se logró) mejorar el split: se muestra la rutina con el aviso y la persona decide.
        return accept(*fallback)
    raise GenerationFailed(problems)


def _save(
    db: Session, user: User, routine: RoutineProposal, result, goal: Goal, level: Level,
    routine_id: int | None,
    kind: ProposalKind = ProposalKind.GENERATE,
    days: int | None = None,
    minutes: int | None = None,
    split: RoutineSplit | None = None,
) -> PlanProposal:
    # Queda una sola propuesta pendiente: las anteriores se descartan al llegar la nueva.
    now = datetime.now(timezone.utc)
    for old in db.scalars(
        select(PlanProposal).where(
            PlanProposal.user_id == user.id,
            PlanProposal.kind.in_((ProposalKind.GENERATE, ProposalKind.WEEK_CLOSE)),
            PlanProposal.status == ProposalStatus.PENDING,
        )
    ):
        old.status = ProposalStatus.DISCARDED
        old.resolved_at = now

    proposal = PlanProposal(
        user_id=user.id,
        kind=kind,
        proposed_changes={
            "routine": routine.model_dump(mode="json"),
            "goal": goal.value,
            "level": level.value,
            # Vacío: la rutina se crea recién al aceptar. Con id: es la semana siguiente de esa rutina.
            "routine_id": routine_id,
            # Los días que eligió el usuario: se guardan en la rutina al aceptar (decisión 52).
            "days": days,
            # Dato histórico; la decisión 90 apagó la elección de minutos. Se guarda null en propuestas nuevas.
            "minutes": minutes,
            "split": split.value if split is not None else None,
            "warnings": [{"rule": w.rule, "message": w.message} for w in result.warnings],
        },
    )
    db.add(proposal)
    db.commit()
    return proposal

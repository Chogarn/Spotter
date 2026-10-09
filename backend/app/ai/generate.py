"""Genera una propuesta de rutina: prompt, llamada a Gemini, validación y un reintento.

Sin FastAPI: el endpoint solo traduce las excepciones de acá a códigos HTTP.
"""

from datetime import datetime, timezone

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.gemini import AiConfigError, AiLimitError, generate_json
from app.ai.history import PreviousWeek, build_previous_week, weight_jump_warnings
from app.ai.plan_writer import active_week
from app.ai.prompt import build_prompt
from app.ai.routine import RoutineProposal
from app.ai.rules import Issue, validate_routine
from app.enums import AiCallKind, Goal, Level, ProposalKind, ProposalStatus
from app.models import PlanProposal, User

MAX_ATTEMPTS = 2  # la primera llamada y un reintento; cada intento cuenta en los topes


class ProfileMissing(Exception):
    """Todavía no cargó el perfil."""


class ActiveWeekExists(Exception):
    """Ya tiene una semana activa: no se genera la primera rutina de nuevo."""


class AiUpstreamError(Exception):
    """Gemini falló o no respondió a tiempo."""


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
    db: Session, user: User, goal: Goal, level: Level, routine_id: int | None = None
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
    base_prompt = build_prompt(profile, goal, level, previous.text if previous else None)
    prompt = base_prompt
    problems: list[str] = []

    for attempt in range(MAX_ATTEMPTS):
        try:
            text = generate_json(
                db, user.id, call_kind, prompt, RoutineProposal.model_json_schema()
            )
        except (AiConfigError, AiLimitError):
            raise
        except Exception as error:
            raise AiUpstreamError(str(error)) from error

        try:
            routine = RoutineProposal.model_validate_json(text)
        except ValidationError as error:
            problems = _pydantic_problems(error)
        else:
            result = validate_routine(routine, goal, level)
            if result.ok:
                if previous is not None:
                    result.warnings += [
                        Issue(rule, message) for rule, message in weight_jump_warnings(routine, previous)
                    ]
                return _save(db, user, routine, result, goal, level, routine_id, kind)
            problems = [f"{i.rule}: {i.message}" for i in result.errors]

        if attempt + 1 < MAX_ATTEMPTS:
            prompt = base_prompt + _correction(problems)

    raise GenerationFailed(problems)


def _save(
    db: Session, user: User, routine: RoutineProposal, result, goal: Goal, level: Level,
    routine_id: int | None,
    kind: ProposalKind = ProposalKind.GENERATE,
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
            "warnings": [{"rule": w.rule, "message": w.message} for w in result.warnings],
        },
    )
    db.add(proposal)
    db.commit()
    return proposal

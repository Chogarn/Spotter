"""Genera una propuesta de rutina: prompt, llamada a Gemini, validación y un reintento.

Sin FastAPI: el endpoint solo traduce las excepciones de acá a códigos HTTP.
"""

from datetime import datetime, timezone

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.gemini import AiConfigError, AiLimitError, generate_json
from app.ai.plan_writer import active_week
from app.ai.prompt import build_prompt
from app.ai.routine import RoutineProposal
from app.ai.rules import validate_routine
from app.enums import AiCallKind, ProposalKind, ProposalStatus
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


def generate_proposal(db: Session, user: User) -> PlanProposal:
    if user.profile is None:
        raise ProfileMissing
    if active_week(db, user.id) is not None:
        raise ActiveWeekExists

    profile = user.profile
    base_prompt = build_prompt(profile)
    prompt = base_prompt
    problems: list[str] = []

    for attempt in range(MAX_ATTEMPTS):
        try:
            text = generate_json(
                db, user.id, AiCallKind.GENERATE, prompt, RoutineProposal.model_json_schema()
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
            result = validate_routine(routine, profile.goal, profile.level)
            if result.ok:
                return _save(db, user, routine, result)
            problems = [f"{i.rule}: {i.message}" for i in result.errors]

        if attempt + 1 < MAX_ATTEMPTS:
            prompt = base_prompt + _correction(problems)

    raise GenerationFailed(problems)


def _save(db: Session, user: User, routine: RoutineProposal, result) -> PlanProposal:
    # Queda una sola propuesta pendiente: las anteriores se descartan al llegar la nueva.
    now = datetime.now(timezone.utc)
    for old in db.scalars(
        select(PlanProposal).where(
            PlanProposal.user_id == user.id,
            PlanProposal.kind == ProposalKind.GENERATE,
            PlanProposal.status == ProposalStatus.PENDING,
        )
    ):
        old.status = ProposalStatus.DISCARDED
        old.resolved_at = now

    proposal = PlanProposal(
        user_id=user.id,
        kind=ProposalKind.GENERATE,
        proposed_changes={
            "routine": routine.model_dump(mode="json"),
            "warnings": [{"rule": w.rule, "message": w.message} for w in result.warnings],
        },
    )
    db.add(proposal)
    db.commit()
    return proposal

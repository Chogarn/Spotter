from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai.gemini import AiConfigError, AiLimitError
from app.ai.generate import (
    ActiveWeekExists,
    AiUpstreamError,
    GenerationFailed,
    ProfileMissing,
    generate_proposal,
)
from app.ai.plan_writer import active_week, write_plan
from app.ai.routine import RoutineProposal
from app.ai.rules import estimate_day_minutes
from app.db import get_db
from app.deps import get_current_user
from app.enums import Goal, Level, ProposalStatus
from app.models import PlanProposal, Routine, User
from app.routines import create_routine
from app.schemas import GenerateIn, ProposalOut, WarningOut

router = APIRouter(prefix="/proposals", tags=["proposals"])


def to_out(proposal: PlanProposal) -> ProposalOut:
    changes = proposal.proposed_changes
    routine = RoutineProposal.model_validate(changes["routine"])
    return ProposalOut(
        id=proposal.id,
        kind=proposal.kind.value,
        status=proposal.status.value,
        created_at=proposal.created_at,
        routine=routine,
        day_minutes=[round(estimate_day_minutes(day)) for day in routine.days],
        warnings=[WarningOut(**w) for w in changes.get("warnings", [])],
    )


def get_own_proposal(db: Session, user: User, proposal_id: int) -> PlanProposal:
    proposal = db.get(PlanProposal, proposal_id)
    if proposal is None or proposal.user_id != user.id:
        raise HTTPException(status_code=404, detail="No existe esa propuesta")
    return proposal


def require_pending(proposal: PlanProposal) -> None:
    if proposal.status != ProposalStatus.PENDING:
        raise HTTPException(status_code=409, detail="Esa propuesta ya fue resuelta")


@router.post("/generate", response_model=ProposalOut, status_code=201)
def generate(
    data: GenerateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """Pide a la IA una semana: de una rutina existente o de una nueva. Solo guarda una propuesta."""
    goal, level = data.goal, data.level
    if data.routine_id is not None:
        routine = db.get(Routine, data.routine_id)
        if routine is None or routine.user_id != user.id:
            raise HTTPException(status_code=404, detail="No existe esa rutina")
        goal, level = routine.goal, routine.level  # el nivel queda fijo mientras sigue la rutina
    try:
        return to_out(generate_proposal(db, user, goal, level, data.routine_id))
    except ProfileMissing:
        raise HTTPException(status_code=409, detail="Completá tu perfil primero") from None
    except ActiveWeekExists:
        raise HTTPException(status_code=409, detail="Ya tenés una semana activa") from None
    except AiConfigError:
        raise HTTPException(status_code=503, detail="La IA no está configurada") from None
    except AiLimitError as error:
        if error.scope == "minute":
            raise HTTPException(
                status_code=429,
                detail="Llegaste al tope de llamadas por minuto. Probá de nuevo en un minuto.",
                headers={"Retry-After": "60"},
            ) from None
        raise HTTPException(
            status_code=429, detail="Llegaste al tope diario de la IA. Probá mañana."
        ) from None
    except AiUpstreamError:
        raise HTTPException(
            status_code=502,
            detail="La IA no respondió (puede haber tardado demasiado). Probá de nuevo.",
        ) from None
    except GenerationFailed:
        raise HTTPException(
            status_code=502,
            detail="La IA no pudo armar una rutina válida. Probá de nuevo.",
        ) from None


@router.get("/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalOut:
    return to_out(get_own_proposal(db, user, proposal_id))


@router.post("/{proposal_id}/accept", response_model=ProposalOut)
def accept(
    proposal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalOut:
    """Recién acá la propuesta pasa a ser el plan de la semana."""
    proposal = get_own_proposal(db, user, proposal_id)
    require_pending(proposal)
    if active_week(db, user.id) is not None:
        raise HTTPException(status_code=409, detail="Ya tenés una semana activa")

    routine = RoutineProposal.model_validate(proposal.proposed_changes["routine"])
    changes = proposal.proposed_changes
    if changes.get("routine_id") is not None:
        plan_routine = db.get(Routine, changes["routine_id"])
        if plan_routine is None or plan_routine.user_id != user.id:
            raise HTTPException(status_code=409, detail="La rutina de esta propuesta ya no existe")
    else:
        # Recién acá nace la rutina nueva: si el usuario descarta la propuesta, no queda nada.
        plan_routine = create_routine(
            db, user.id, Goal(changes["goal"]), Level(changes["level"])
        )
    week = write_plan(db, user.id, routine, plan_routine)
    proposal.week_plan_id = week.id
    proposal.status = ProposalStatus.ACCEPTED
    proposal.resolved_at = datetime.now(timezone.utc)
    db.commit()  # una sola transacción: o se crea todo el plan o nada
    return to_out(proposal)


@router.post("/{proposal_id}/discard", response_model=ProposalOut)
def discard(
    proposal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalOut:
    proposal = get_own_proposal(db, user, proposal_id)
    require_pending(proposal)
    proposal.status = ProposalStatus.DISCARDED
    proposal.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return to_out(proposal)

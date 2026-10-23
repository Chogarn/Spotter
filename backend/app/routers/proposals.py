from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.gemini import AiConfigError, AiLimitError
from app.ai.generate import (
    ActiveWeekExists,
    AiUpstreamError,
    GenerationFailed,
    GenerationInProgress,
    ProfileMissing,
    generate_proposal,
)
from app.ai.catalog import find
from app.ai.changes import compare
from app.ai.history import last_closed_week
from app.ai.plan_writer import active_week, write_plan
from app.ai.routine import RoutineProposal
from app.ai.rules import allowed_days, estimate_day_minutes, validate_routine
from app.ai.splits import compatible_splits, default_split
from app.ai.swap import SwapError, alternatives, swap
from app.db import get_db
from app.deps import get_current_user
from app.enums import Goal, Level, ProposalKind, ProposalStatus, RoutineSplit
from app.models import PlanProposal, Routine, User
from app.routines import create_routine
from app.routers.weeks import routine_weeks
from app.schemas import (
    AlternativeOut,
    ExerciseChangeOut,
    GenerateIn,
    ProposalChangesOut,
    ProposalOut,
    SetShapeOut,
    SwapIn,
    WarningOut,
)

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
        split=RoutineSplit(changes["split"]) if changes.get("split") else None,
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
    else:
        if goal is None or level is None:
            raise HTTPException(status_code=422, detail="Falta el objetivo y el nivel")
    permitidos = allowed_days(level)  # R12 para principiantes, R11 para el resto
    if data.days not in permitidos:
        raise HTTPException(
            status_code=422,
            detail=f"Con nivel {level.value} se entrena de {permitidos[0]} a {permitidos[-1]} días por semana",
        )
    split = data.split or (routine.split_type if data.routine_id is not None else None) or default_split(data.days, level, goal)
    compatible = compatible_splits(data.days, level, goal)
    if split not in compatible:
        labels = {
            RoutineSplit.FULL_BODY: "Cuerpo completo",
            RoutineSplit.UPPER_LOWER: "Torso y pierna",
            RoutineSplit.PPL: "Empuje, tirón y piernas",
        }
        raise HTTPException(
            status_code=422,
            detail="Split incompatible con los días o el nivel. Opciones: "
            + ", ".join(labels[s] for s in compatible),
        )
    try:
        return to_out(
            # `minutes` se acepta por compatibilidad con clientes viejos, pero la decisión 90 lo apagó:
            # R18 es referencia, no objetivo ni límite.
            generate_proposal(db, user, goal, level, data.routine_id, data.days, None, split)
        )
    except ProfileMissing:
        raise HTTPException(status_code=409, detail="Completá tu perfil primero") from None
    except ActiveWeekExists:
        raise HTTPException(status_code=409, detail="Ya tenés una semana activa") from None
    except GenerationInProgress:
        raise HTTPException(
            status_code=409,
            detail="Ya se está generando una rutina. Esperá a que termine para pedir otra.",
        ) from None
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
    except GenerationFailed as error:
        # Mostrar algunos motivos concretos evita que un rechazo por reglas parezca una caída
        # de Gemini. La respuesta de la IA ya se recibió; se agotaron los intentos de corrección.
        motivos = " ".join(error.problems[:3])
        if len(error.problems) > 3:
            motivos += f" (y {len(error.problems) - 3} problemas más)"
        raise HTTPException(
            status_code=502,
            detail=(
                "Gemini respondió, pero la rutina no pasó las reglas después de varios intentos. "
                f"Motivos: {motivos or 'la propuesta no cumplió la validación.'}"
            ),
        ) from None


# /pending va antes que /{proposal_id}, si no "pending" se tomaría como un id.
@router.get("/pending", response_model=ProposalOut)
def get_pending(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalOut:
    """La propuesta de rutina que quedó pendiente (hay una sola), para volver a verla."""
    proposal = db.scalar(
        select(PlanProposal)
        .where(
            PlanProposal.user_id == user.id,
            PlanProposal.kind.in_((ProposalKind.GENERATE, ProposalKind.WEEK_CLOSE)),
            PlanProposal.status == ProposalStatus.PENDING,
        )
        .order_by(PlanProposal.id.desc())
    )
    if proposal is None:
        raise HTTPException(status_code=404, detail="No tenés una propuesta pendiente")
    return to_out(proposal)


@router.get("/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalOut:
    return to_out(get_own_proposal(db, user, proposal_id))


@router.get("/{proposal_id}/changes", response_model=ProposalChangesOut)
def get_changes(
    proposal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ProposalChangesOut:
    """Antes y después (#49): lo planificado en la semana anterior de la rutina frente a lo que
    propone la IA. La primera rutina no tiene semana anterior (`has_base` falso)."""
    proposal = get_own_proposal(db, user, proposal_id)
    routine_id = proposal.proposed_changes.get("routine_id")
    base = last_closed_week(db, routine_id) if routine_id is not None else None
    if base is None:
        return ProposalChangesOut(has_base=False)
    changes = compare(base, RoutineProposal.model_validate(proposal.proposed_changes["routine"]))
    number = [w.id for w in routine_weeks(db, routine_id)].index(base.id) + 1
    return ProposalChangesOut(
        has_base=True,
        base_week_number=number,
        exercises=[
            ExerciseChangeOut(
                name=c.name,
                day_index=c.day_index,
                status=c.status,
                sets_before=[SetShapeOut(**vars(s)) for s in c.sets_before],
                sets_after=[SetShapeOut(**vars(s)) for s in c.sets_after],
                load=c.load,
                sets_changed=c.sets_changed,
                rest_before=c.rest_before,
                rest_after=c.rest_after,
                rest_changed=c.rest_changed,
            )
            for c in changes.exercises
        ],
        removed=changes.removed,
    )


@router.get("/{proposal_id}/alternatives", response_model=list[AlternativeOut])
def get_alternatives(
    proposal_id: int,
    name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AlternativeOut]:
    """Los ejercicios del catálogo por los que se puede cambiar `name` (decisión 65)."""
    proposal = get_own_proposal(db, user, proposal_id)
    require_pending(proposal)
    changes = proposal.proposed_changes
    routine = RoutineProposal.model_validate(changes["routine"])
    try:
        options = alternatives(routine, name, Goal(changes["goal"]), Level(changes["level"]))
    except SwapError as error:
        raise HTTPException(status_code=error.status, detail=str(error)) from None
    return [
        AlternativeOut(
            id=c.id,
            name=c.name,
            description=c.description,
            equipment=c.equipment.value,
            level=c.level.value,
            mechanic=c.mechanic.value,
        )
        for c in options
    ]


@router.post("/{proposal_id}/swap", response_model=ProposalOut)
def swap_exercise(
    proposal_id: int,
    data: SwapIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """Cambia un ejercicio de la propuesta por otro del catálogo, en todos los días donde está.

    Sin IA. Solo en la propuesta pendiente: la semana ya aceptada no cambia (decisión 45).
    """
    proposal = get_own_proposal(db, user, proposal_id)
    require_pending(proposal)
    changes = proposal.proposed_changes
    goal, level = Goal(changes["goal"]), Level(changes["level"])
    routine = RoutineProposal.model_validate(changes["routine"])
    try:
        new_routine = swap(routine, data.from_name, data.to_id, goal, level)
    except SwapError as error:
        raise HTTPException(status_code=error.status, detail=str(error)) from None

    # Se vuelven a comprobar las reglas con la rutina nueva. Los ejercicios que ya venían de la
    # semana anterior (fuera del catálogo) se permiten, igual que al generar.
    legacy = [e.name for d in new_routine.days for e in d.exercises if find(e.name) is None]
    result = validate_routine(
        new_routine, goal, level, changes.get("days"), catalog_extra_names=legacy,
        minutes=None,
        split=RoutineSplit(changes["split"]) if changes.get("split") else None,
    )
    if result.errors:
        raise HTTPException(
            status_code=422,
            detail="Con ese cambio la rutina rompe una regla: "
            + "; ".join(f"{e.rule}: {e.message}" for e in result.errors),
        )

    # Los avisos de saltos de peso (R9) siguen valiendo salvo el del ejercicio que se fue.
    kept = [
        w
        for w in changes.get("warnings", [])
        if w["rule"] == "R9" and not w["message"].startswith(f"{data.from_name}:")
    ]
    proposal.proposed_changes = {
        **changes,
        "routine": new_routine.model_dump(mode="json"),
        "warnings": kept + [{"rule": w.rule, "message": w.message} for w in result.warnings],
    }
    db.commit()
    return to_out(proposal)


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
            db, user.id, Goal(changes["goal"]), Level(changes["level"]), changes.get("days"),
            changes.get("minutes"), RoutineSplit(changes["split"]) if changes.get("split") else None,
        )
    # Al continuar con otra cantidad de días, la rutina se queda con la nueva (decisión 52).
    if changes.get("days") is not None:
        plan_routine.days_per_week = changes["days"]
    if changes.get("split") is not None:
        plan_routine.split_type = RoutineSplit(changes["split"])
    week = write_plan(db, user.id, routine, plan_routine)
    proposal.week_plan_id = week.id
    proposal.status = ProposalStatus.ACCEPTED
    proposal.resolved_at = datetime.now(timezone.utc)
    db.commit()  # una sola transacción: o se crea todo el plan o nada
    out = to_out(proposal)
    # Qué quedó creado, para la pantalla de "aceptado": la semana, su número y la rutina.
    out.week_id = week.id
    out.week_number = [w.id for w in routine_weeks(db, plan_routine.id)].index(week.id) + 1
    out.routine_id = plan_routine.id
    out.routine_name = plan_routine.name
    return out


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

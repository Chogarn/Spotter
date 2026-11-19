"""Qué semanas y rutinas tienen algo registrado, y cuáles tienen una propuesta sin resolver.

Lo comparten "Eliminar rutina" (decisión 149) y "Eliminar semana" (decisión 150): solo se elimina lo
que no tiene nada registrado.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums import ProposalStatus
from app.models import (
    ExerciseCompletion,
    PlanDay,
    PlanProposal,
    SetEntry,
    User,
    WeekPlan,
    WorkoutSession,
)


def weeks_with_records(db: Session, user: User) -> dict[int, int]:
    """Las semanas del usuario que tienen algo registrado, como {id de la semana: id de su rutina}.

    Hay algo registrado si hay una serie hecha, un ejercicio marcado, o un día empezado, completado
    o con entrada en calor. Son tres consultas para todas las semanas juntas, no una por semana.
    """
    base = (
        select(WeekPlan.id, WeekPlan.routine_id)
        .join(PlanDay, PlanDay.week_plan_id == WeekPlan.id)
        .join(WorkoutSession, WorkoutSession.plan_day_id == PlanDay.id)
        .where(WeekPlan.user_id == user.id)
    )
    queries = [
        base.join(SetEntry, SetEntry.session_id == WorkoutSession.id),
        base.join(ExerciseCompletion, ExerciseCompletion.session_id == WorkoutSession.id),
        base.where(
            WorkoutSession.started_at.is_not(None)
            | WorkoutSession.finished_at.is_not(None)
            | WorkoutSession.warmup_minutes.is_not(None)
        ),
    ]
    found: dict[int, int] = {}
    for query in queries:
        found.update({week_id: routine_id for week_id, routine_id in db.execute(query.distinct())})
    return found


def routines_with_records(db: Session, user: User) -> set[int]:
    """Las rutinas del usuario que tienen algo registrado en alguna de sus semanas."""
    return set(weeks_with_records(db, user).values())


def routines_with_pending_proposal(db: Session, user: User) -> set[int]:
    """Rutinas que tienen una propuesta de semana nueva sin resolver (se lee del JSON de la propuesta)."""
    proposals = db.scalars(
        select(PlanProposal).where(
            PlanProposal.user_id == user.id, PlanProposal.status == ProposalStatus.PENDING
        )
    )
    ids = {p.proposed_changes.get("routine_id") for p in proposals}
    return {i for i in ids if i is not None}

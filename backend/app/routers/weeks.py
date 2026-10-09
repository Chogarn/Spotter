from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.plan_writer import active_week
from app.ai.rules import estimate_day_minutes
from app.db import get_db
from app.deps import get_current_user
from app.models import PlanDay, User, WeekPlan
from app.schemas import (
    DayDetailOut,
    DayExerciseOut,
    DaySetOut,
    WeekDayItemOut,
    WeekDetailOut,
    WeekOut,
    WeekSummaryOut,
)

router = APIRouter(prefix="/weeks", tags=["weeks"])


def user_weeks(db: Session, user: User) -> list[WeekPlan]:
    """Las semanas del usuario en orden de activación (la más vieja primero)."""
    return list(
        db.scalars(
            select(WeekPlan)
            .where(WeekPlan.user_id == user.id)
            .order_by(WeekPlan.week_start, WeekPlan.id)
        )
    )


def get_own_week(db: Session, user: User, week_id: int) -> tuple[WeekPlan, int]:
    """La semana y su número. 404 si no existe o es de otro usuario."""
    for number, week in enumerate(user_weeks(db, user), start=1):
        if week.id == week_id:
            return week, number
    raise HTTPException(status_code=404, detail="No existe esa semana")


def day_minutes(day: PlanDay) -> int:
    """Duración estimada del día con la misma fórmula (R34) que usa la vista previa."""
    # La fórmula solo lee estos campos: se le pasa un objeto con esa forma.
    shape = SimpleNamespace(
        mobility_notes=day.mobility_notes,
        exercises=[
            SimpleNamespace(kind=e.exercise.kind, rest_seconds=e.rest_seconds, sets=e.sets)
            for e in day.exercises
        ],
    )
    return round(estimate_day_minutes(shape))


@router.get("", response_model=list[WeekSummaryOut])
def list_weeks(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[WeekSummaryOut]:
    """Mis rutinas: todas las semanas, de la más nueva a la más vieja."""
    summaries = [
        WeekSummaryOut(
            id=week.id,
            number=number,
            status=week.status.value,
            week_start=week.week_start,
            closed_at=week.closed_at,
            day_count=len(week.days),
        )
        for number, week in enumerate(user_weeks(db, user), start=1)
    ]
    return summaries[::-1]


# /active va antes que /{week_id}, si no "active" se tomaría como un id.
@router.get("/active", response_model=WeekOut)
def get_active_week(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> WeekOut:
    """La semana activa del usuario, con los títulos de sus días."""
    week = active_week(db, user.id)
    if week is None:
        raise HTTPException(status_code=404, detail="No tenés una semana activa")
    return WeekOut(
        id=week.id,
        week_start=week.week_start,
        days=[{"day_index": d.day_index, "title": d.title} for d in week.days],
    )


@router.get("/{week_id}", response_model=WeekDetailOut)
def get_week(
    week_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> WeekDetailOut:
    week, number = get_own_week(db, user, week_id)
    return WeekDetailOut(
        id=week.id,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        days=[
            WeekDayItemOut(
                day_index=d.day_index,
                title=d.title,
                exercise_count=len(d.exercises),
                minutes=day_minutes(d),
            )
            for d in week.days
        ],
    )


@router.get("/{week_id}/days/{day_index}", response_model=DayDetailOut)
def get_day(
    week_id: int,
    day_index: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayDetailOut:
    week, number = get_own_week(db, user, week_id)
    day = next((d for d in week.days if d.day_index == day_index), None)
    if day is None:
        raise HTTPException(status_code=404, detail="No existe ese día")
    return DayDetailOut(
        week_id=week.id,
        week_number=number,
        week_status=week.status.value,
        day_index=day.day_index,
        title=day.title,
        mobility_notes=day.mobility_notes,
        minutes=day_minutes(day),
        exercises=[
            DayExerciseOut(
                name=e.exercise.name,
                kind=e.exercise.kind.value,
                rest_seconds=e.rest_seconds,
                execution_notes=e.execution_notes,
                reason=e.reason,
                sets=[
                    DaySetOut(
                        set_number=s.set_number,
                        reps=s.reps,
                        duration_minutes=s.duration_minutes,
                        duration_seconds=s.duration_seconds,
                        target_weight_kg=(
                            None if s.target_weight_kg is None else float(s.target_weight_kg)
                        ),
                    )
                    for s in e.sets
                ],
            )
            for e in day.exercises
        ],
    )

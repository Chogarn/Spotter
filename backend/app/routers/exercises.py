from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import get_current_user
from app.enums import ExerciseKind
from app.models import (
    Exercise,
    PlanDay,
    PlanExercise,
    PlanSet,
    SetEntry,
    User,
    WeekPlan,
    WorkoutSession,
)
from app.routers.routines import best_of_week
from app.schemas import ExerciseOptionOut, ExerciseTimelineOut, TimelinePointOut

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseOptionOut])
def list_exercises(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ExerciseOptionOut]:
    """Los ejercicios que aparecieron en alguna semana de la persona (en cualquier rutina), con
    en cuántas semanas, para elegir cuál graficar."""
    # Una sola consulta (antes, una por semana, día y ejercicio).
    rows = db.execute(
        select(Exercise, func.count(distinct(PlanDay.week_plan_id)))
        .join(PlanExercise, PlanExercise.exercise_id == Exercise.id)
        .join(PlanDay, PlanDay.id == PlanExercise.plan_day_id)
        .join(WeekPlan, WeekPlan.id == PlanDay.week_plan_id)
        .where(WeekPlan.user_id == user.id)
        .group_by(Exercise.id)
    ).all()
    options = [
        ExerciseOptionOut(
            id=exercise.id, name=exercise.name, kind=exercise.kind.value, weeks_count=weeks_count
        )
        for exercise, weeks_count in rows
    ]
    return sorted(options, key=lambda o: o.name.lower())


@router.get("/{exercise_id}/history", response_model=ExerciseTimelineOut)
def exercise_timeline(
    exercise_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExerciseTimelineOut:
    """La evolución de un ejercicio por fecha, acumulando todas las rutinas de la persona.

    Un punto por semana en que el ejercicio estuvo planificado, con lo mejor realizado. Las
    semanas sin registros llevan valor vacío (no se inventa). No depende de la rutina elegida.
    """
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="No existe ese ejercicio")

    # Pocas consultas grandes en vez de una por día, ejercicio y serie: con la base lejos (Neon en
    # Frankfurt) cada consulta cuesta un viaje y cientos de ellas tardaban segundos.
    # Todas las semanas de la persona, de la más vieja a la más nueva, sin importar la rutina.
    weeks = list(
        db.scalars(
            select(WeekPlan)
            .where(WeekPlan.user_id == user.id)
            .options(selectinload(WeekPlan.routine))
            .order_by(WeekPlan.week_start, WeekPlan.id)
        )
    )
    # El número de cada semana dentro de su rutina, en el mismo orden que routine_weeks.
    number: dict[int, int] = {}
    per_routine: dict[int, int] = {}
    for week in weeks:
        per_routine[week.routine_id] = per_routine.get(week.routine_id, 0) + 1
        number[week.id] = per_routine[week.routine_id]

    # Las semanas en que el ejercicio estuvo planificado.
    appears = set(
        db.scalars(
            select(PlanDay.week_plan_id)
            .join(PlanExercise, PlanExercise.plan_day_id == PlanDay.id)
            .join(WeekPlan, WeekPlan.id == PlanDay.week_plan_id)
            .where(WeekPlan.user_id == user.id, PlanExercise.exercise_id == exercise_id)
        )
    )
    # Lo realizado en sus series planificadas, en una sesión de ese mismo día (como day_entries):
    # una entrada por serie (la última, si hubiera dos).
    rows = db.execute(
        select(SetEntry, PlanDay.week_plan_id)
        .join(PlanSet, PlanSet.id == SetEntry.plan_set_id)
        .join(PlanExercise, PlanExercise.id == PlanSet.plan_exercise_id)
        .join(PlanDay, PlanDay.id == PlanExercise.plan_day_id)
        .join(WorkoutSession, WorkoutSession.id == SetEntry.session_id)
        .join(WeekPlan, WeekPlan.id == PlanDay.week_plan_id)
        .where(
            WeekPlan.user_id == user.id,
            PlanExercise.exercise_id == exercise_id,
            WorkoutSession.plan_day_id == PlanDay.id,
        )
        .order_by(SetEntry.id)
    ).all()
    by_set: dict[int, tuple[SetEntry, int]] = {}
    for entry, week_id in rows:
        by_set[entry.plan_set_id] = (entry, week_id)
    entries_of: dict[int, list[SetEntry]] = {}
    for entry, week_id in by_set.values():
        entries_of.setdefault(week_id, []).append(entry)

    raw: list[tuple[WeekPlan, int, list]] = [
        (week, number[week.id], entries_of.get(week.id, [])) for week in weeks if week.id in appears
    ]
    if not raw:
        raise HTTPException(status_code=404, detail="Ese ejercicio no figura en tus semanas")

    # Un ejercicio de fuerza se mide en kilos si alguna vez se registró con peso; si no, en reps.
    by_weight = exercise.kind == ExerciseKind.STRENGTH and any(
        e.weight_kg is not None for _, _, entries in raw for e in entries
    )
    unit = {ExerciseKind.CARDIO: "min", ExerciseKind.ISOMETRIC: "s"}.get(
        exercise.kind, "kg" if by_weight else "reps"
    )
    points = [
        TimelinePointOut(
            week_id=week.id,
            number=number,
            status=week.status.value,
            week_start=week.week_start if isinstance(week.week_start, date) else None,
            routine_id=week.routine_id,
            routine_name=week.routine.name,
            goal=week.routine.goal.value,
            value=best_of_week(exercise.kind, entries, by_weight),
        )
        for week, number, entries in raw
    ]
    values = [p.value for p in points if p.value is not None]
    return ExerciseTimelineOut(
        exercise_id=exercise.id,
        name=exercise.name,
        kind=exercise.kind.value,
        unit=unit,
        points=points,
        record=max(values) if values else None,
        first_value=values[0] if values else None,
        last_value=values[-1] if values else None,
        weeks_with_data=len(values),
        routines_count=len({p.routine_id for p in points}),
    )

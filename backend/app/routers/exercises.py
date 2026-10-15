from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.enums import ExerciseKind
from app.models import Exercise, User, WeekPlan
from app.routers.routines import best_of_week
from app.routers.weeks import day_entries, routine_weeks
from app.schemas import ExerciseOptionOut, ExerciseTimelineOut, TimelinePointOut

router = APIRouter(prefix="/exercises", tags=["exercises"])


def user_weeks(db: Session, user: User) -> list[WeekPlan]:
    """Todas las semanas de la persona, de la más vieja a la más nueva, sin importar la rutina."""
    return list(
        db.scalars(
            select(WeekPlan)
            .where(WeekPlan.user_id == user.id)
            .order_by(WeekPlan.week_start, WeekPlan.id)
        )
    )


@router.get("", response_model=list[ExerciseOptionOut])
def list_exercises(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ExerciseOptionOut]:
    """Los ejercicios que aparecieron en alguna semana de la persona (en cualquier rutina), con
    en cuántas semanas, para elegir cuál graficar."""
    found: dict[int, tuple[Exercise, set[int]]] = {}
    for week in user_weeks(db, user):
        for day in week.days:
            for plan_exercise in day.exercises:
                exercise, weeks = found.setdefault(
                    plan_exercise.exercise_id, (plan_exercise.exercise, set())
                )
                weeks.add(week.id)
    options = [
        ExerciseOptionOut(
            id=exercise.id, name=exercise.name, kind=exercise.kind.value, weeks_count=len(weeks)
        )
        for exercise, weeks in found.values()
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

    raw: list[tuple[WeekPlan, int, list]] = []
    number_cache: dict[int, list[int]] = {}
    for week in user_weeks(db, user):
        entries = []
        appears = False
        for day in week.days:
            planned = [e for e in day.exercises if e.exercise_id == exercise_id]
            if not planned:
                continue
            appears = True
            done = day_entries(db, day)
            entries += [done[s.id] for e in planned for s in e.sets if s.id in done]
        if not appears:
            continue
        ids = number_cache.setdefault(
            week.routine_id, [w.id for w in routine_weeks(db, week.routine_id)]
        )
        raw.append((week, ids.index(week.id) + 1, entries))
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

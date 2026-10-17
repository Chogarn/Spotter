from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.enums import ExerciseKind, PlanStatus
from app.models import Exercise, Routine, SetEntry, User
from app.routers.weeks import day_entries, week_day_states
from app.schemas import (
    ExerciseHistoryOut,
    ExerciseWeekPointOut,
    RoutineDetailOut,
    RoutineExerciseOut,
    RoutineRenameIn,
    RoutineSummaryOut,
    WeekSummaryOut,
)

router = APIRouter(prefix="/routines", tags=["routines"])


def routine_summary(db: Session, user: User, routine: Routine) -> RoutineSummaryOut:
    weeks = routine.weeks  # de la más vieja a la más nueva
    return RoutineSummaryOut(
        id=routine.id,
        name=routine.name,
        goal=routine.goal,
        level=routine.level,
        week_count=len(weeks),
        has_active_week=any(w.status == PlanStatus.ACTIVE for w in weeks),
        days_per_week=routine.days_per_week,
        session_minutes=routine.session_minutes,
        last_week_day_states=week_day_states(db, user, weeks[-1]) if weeks else [],
    )


def get_own_routine(db: Session, user: User, routine_id: int) -> Routine:
    routine = db.get(Routine, routine_id)
    if routine is None or routine.user_id != user.id:
        raise HTTPException(status_code=404, detail="No existe esa rutina")
    return routine


@router.get("", response_model=list[RoutineSummaryOut])
def list_routines(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[RoutineSummaryOut]:
    """Mis rutinas: de la más nueva a la más vieja."""
    routines = db.scalars(
        select(Routine)
        .where(Routine.user_id == user.id)
        .order_by(Routine.created_at.desc(), Routine.id.desc())
    )
    return [routine_summary(db, user, r) for r in routines]


@router.get("/{routine_id}", response_model=RoutineDetailOut)
def get_routine(
    routine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> RoutineDetailOut:
    """Una rutina con su lista de semanas, de la más nueva a la más vieja."""
    routine = get_own_routine(db, user, routine_id)
    weeks = [
        WeekSummaryOut(
            id=week.id,
            number=number,
            status=week.status.value,
            week_start=week.week_start,
            closed_at=week.closed_at,
            day_count=len(week.days),
            day_states=week_day_states(db, user, week),
        )
        for number, week in enumerate(routine.weeks, start=1)
    ]
    return RoutineDetailOut(
        id=routine.id,
        name=routine.name,
        goal=routine.goal,
        level=routine.level,
        days_per_week=routine.days_per_week,
        session_minutes=routine.session_minutes,
        weeks=weeks[::-1],
    )


@router.get("/{routine_id}/exercises", response_model=list[RoutineExerciseOut])
def list_routine_exercises(
    routine_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[RoutineExerciseOut]:
    """Los ejercicios que aparecen en las semanas de la rutina, en el orden en que aparecieron."""
    routine = get_own_routine(db, user, routine_id)
    seen: dict[int, Exercise] = {}
    for week in routine.weeks:
        for day in week.days:
            for plan_exercise in day.exercises:
                seen.setdefault(plan_exercise.exercise_id, plan_exercise.exercise)
    return [RoutineExerciseOut(id=e.id, name=e.name, kind=e.kind.value) for e in seen.values()]


def best_of_week(kind: ExerciseKind, entries: list[SetEntry], by_weight: bool) -> float | None:
    """Lo mejor realizado en la semana: mayor peso (o repeticiones, si no lleva peso), mayor
    tiempo en un isométrico, o minutos totales de cardio. Vacío si no se registró nada."""
    if not entries:
        return None
    if kind == ExerciseKind.CARDIO:
        return float(sum(e.duration_minutes or 0 for e in entries))
    if kind == ExerciseKind.ISOMETRIC:
        return float(max(e.duration_seconds or 0 for e in entries))
    if by_weight:
        weights = [e.weight_kg for e in entries if e.weight_kg is not None]
        return float(max(weights)) if weights else None
    return float(max(e.reps or 0 for e in entries))


@router.get("/{routine_id}/exercises/{exercise_id}/history", response_model=ExerciseHistoryOut)
def exercise_history(
    routine_id: int,
    exercise_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExerciseHistoryOut:
    """Evolución de un ejercicio en las semanas de la rutina (#62): un punto por semana con lo
    mejor realizado. Las semanas sin registros quedan vacías (no se inventa un valor)."""
    routine = get_own_routine(db, user, routine_id)
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="No existe ese ejercicio")

    # Lo realizado de ese ejercicio en cada semana (si aparece en varios días, todo junto).
    per_week: list[tuple] = []
    appears = False
    for number, week in enumerate(routine.weeks, start=1):
        entries: list[SetEntry] = []
        for day in week.days:
            plan_exercises = [e for e in day.exercises if e.exercise_id == exercise_id]
            if not plan_exercises:
                continue
            appears = True
            done = day_entries(db, day)
            entries += [done[s.id] for e in plan_exercises for s in e.sets if s.id in done]
        per_week.append((week, number, entries))
    if not appears:
        raise HTTPException(status_code=404, detail="Ese ejercicio no está en la rutina")

    # Un ejercicio de fuerza se mide en kilos si alguna vez se registró con peso; si no, en reps.
    by_weight = exercise.kind == ExerciseKind.STRENGTH and any(
        e.weight_kg is not None for _, _, entries in per_week for e in entries
    )
    unit = {ExerciseKind.CARDIO: "min", ExerciseKind.ISOMETRIC: "s"}.get(
        exercise.kind, "kg" if by_weight else "reps"
    )
    points = [
        ExerciseWeekPointOut(
            week_id=week.id,
            number=number,
            status=week.status.value,
            value=best_of_week(exercise.kind, entries, by_weight),
        )
        for week, number, entries in per_week
    ]
    values = [p.value for p in points if p.value is not None]
    return ExerciseHistoryOut(
        exercise_id=exercise.id,
        name=exercise.name,
        kind=exercise.kind.value,
        unit=unit,
        weeks=points,
        record=max(values) if values else None,
    )


@router.patch("/{routine_id}", response_model=RoutineSummaryOut)
def rename_routine(
    routine_id: int,
    data: RoutineRenameIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoutineSummaryOut:
    routine = get_own_routine(db, user, routine_id)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="El nombre no puede estar vacío")
    routine.name = name
    db.commit()
    return routine_summary(db, user, routine)

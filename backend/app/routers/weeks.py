from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ai.plan_writer import active_week
from app.ai.rules import estimate_day_minutes
from app.db import get_db
from app.deps import get_current_user
from app.enums import ExerciseKind, PlanStatus
from app.models import (
    ExerciseCompletion,
    PlanDay,
    PlanExercise,
    PlanSet,
    SetEntry,
    User,
    WeekPlan,
    WorkoutSession,
)
from app.schemas import (
    CloseWeekIn,
    DayDetailOut,
    DayExerciseOut,
    DaySetOut,
    DayStatusOut,
    RealSetOut,
    SetEntryIn,
    WeekDayItemOut,
    WeekDetailOut,
    WeekOut,
    WeekSummaryOut,
)

router = APIRouter(prefix="/weeks", tags=["weeks"])


def routine_weeks(db: Session, routine_id: int) -> list[WeekPlan]:
    """Las semanas de una rutina en orden de activación (la más vieja primero)."""
    return list(
        db.scalars(
            select(WeekPlan)
            .where(WeekPlan.routine_id == routine_id)
            .order_by(WeekPlan.week_start, WeekPlan.id)
        )
    )


def get_own_week(db: Session, user: User, week_id: int) -> tuple[WeekPlan, int]:
    """La semana y su número dentro de la rutina. 404 si no existe o es de otro usuario."""
    week = db.get(WeekPlan, week_id)
    if week is None or week.user_id != user.id:
        raise HTTPException(status_code=404, detail="No existe esa semana")
    number = [w.id for w in routine_weeks(db, week.routine_id)].index(week.id) + 1
    return week, number


def find_day(week: WeekPlan, day_index: int) -> PlanDay:
    day = next((d for d in week.days if d.day_index == day_index), None)
    if day is None:
        raise HTTPException(status_code=404, detail="No existe ese día")
    return day


def find_exercise(day: PlanDay, plan_exercise_id: int) -> PlanExercise:
    exercise = next((e for e in day.exercises if e.id == plan_exercise_id), None)
    if exercise is None:
        raise HTTPException(status_code=404, detail="No existe ese ejercicio")
    return exercise


def require_active(week: WeekPlan) -> None:
    """Solo se registra lo realizado en la semana activa; las cerradas son de lectura."""
    if week.status != PlanStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="Esa semana está cerrada")


def day_session(db: Session, user: User, day: PlanDay) -> WorkoutSession | None:
    """La sesión de entrenamiento del día, si ya se registró algo."""
    return db.scalar(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user.id, WorkoutSession.plan_day_id == day.id)
        .order_by(WorkoutSession.id)
    )


def open_session(db: Session, user: User, day: PlanDay) -> WorkoutSession:
    """La sesión del día para registrar: se crea sola la primera vez. 409 si el día está completado."""
    session = day_session(db, user, day)
    if session is None:
        session = WorkoutSession(user_id=user.id, plan_day_id=day.id)
        db.add(session)
        db.flush()
    elif session.finished_at is not None:
        raise HTTPException(
            status_code=409, detail="El día está completado: reabrilo para corregir"
        )
    return session


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


def day_entries(db: Session, day: PlanDay) -> dict[int, SetEntry]:
    """Lo realizado en el día, por serie planificada (plan_set_id)."""
    entries = db.scalars(
        select(SetEntry)
        .join(WorkoutSession, SetEntry.session_id == WorkoutSession.id)
        .where(WorkoutSession.plan_day_id == day.id, SetEntry.plan_set_id.is_not(None))
    )
    return {e.plan_set_id: e for e in entries}


def completed_ids(db: Session, day: PlanDay) -> set[int]:
    """Ids de los ejercicios planificados del día que el usuario cerró con "Marcar como hecho"."""
    return set(
        db.scalars(
            select(ExerciseCompletion.plan_exercise_id)
            .join(WorkoutSession, ExerciseCompletion.session_id == WorkoutSession.id)
            .where(WorkoutSession.plan_day_id == day.id)
        )
    )


def require_unlocked(db: Session, day: PlanDay, plan_exercise: PlanExercise) -> None:
    """Un ejercicio cerrado no se toca (ni sus series) hasta reabrirlo."""
    if plan_exercise.id in completed_ids(db, day):
        raise HTTPException(
            status_code=409, detail="El ejercicio está hecho: reabrilo para corregir"
        )


def day_state(entries: dict[int, SetEntry], session: WorkoutSession | None) -> str:
    if session is not None and session.finished_at is not None:
        return "completed"
    return "partial" if entries else "pending"


def set_out(plan_set: PlanSet, entry: SetEntry | None) -> DaySetOut:
    return DaySetOut(
        id=plan_set.id,
        set_number=plan_set.set_number,
        reps=plan_set.reps,
        duration_minutes=plan_set.duration_minutes,
        duration_seconds=plan_set.duration_seconds,
        target_weight_kg=(
            None if plan_set.target_weight_kg is None else float(plan_set.target_weight_kg)
        ),
        real=(
            None
            if entry is None
            else RealSetOut(
                reps=entry.reps,
                duration_minutes=entry.duration_minutes,
                duration_seconds=entry.duration_seconds,
                weight_kg=None if entry.weight_kg is None else float(entry.weight_kg),
            )
        ),
    )


def exercise_out(
    exercise: PlanExercise, entries: dict[int, SetEntry], completed: bool
) -> DayExerciseOut:
    return DayExerciseOut(
        id=exercise.id,
        completed=completed,
        name=exercise.exercise.name,
        kind=exercise.exercise.kind.value,
        rest_seconds=exercise.rest_seconds,
        execution_notes=exercise.execution_notes,
        reason=exercise.reason,
        sets=[set_out(s, entries.get(s.id)) for s in exercise.sets],
    )


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
        routine_id=week.routine_id,
        routine_name=week.routine.name,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        closing_note=week.closing_note,
        days=[
            WeekDayItemOut(
                day_index=d.day_index,
                title=d.title,
                exercise_count=len(d.exercises),
                minutes=day_minutes(d),
                state=day_state(day_entries(db, d), day_session(db, user, d)),
            )
            for d in week.days
        ],
    )


@router.post("/{week_id}/close", response_model=WeekSummaryOut)
def close_week(
    week_id: int,
    data: CloseWeekIn | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeekSummaryOut:
    """Cerrar semana (sin IA). Los días sin hacer no se tocan: cuentan como no hechos.

    Puede llevar un comentario del usuario (opcional) que la IA lee al armar la semana siguiente.
    """
    week, number = get_own_week(db, user, week_id)
    require_active(week)
    note = (data.note or "").strip() if data else ""
    week.closing_note = note or None
    week.status = PlanStatus.CLOSED
    week.closed_at = datetime.now(timezone.utc)
    db.commit()
    return WeekSummaryOut(
        id=week.id,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        closed_at=week.closed_at,
        day_count=len(week.days),
    )


@router.get("/{week_id}/days/{day_index}", response_model=DayDetailOut)
def get_day(
    week_id: int,
    day_index: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayDetailOut:
    week, number = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    entries = day_entries(db, day)
    session = day_session(db, user, day)
    done = completed_ids(db, day)
    return DayDetailOut(
        week_id=week.id,
        week_number=number,
        week_status=week.status.value,
        day_index=day.day_index,
        title=day.title,
        mobility_notes=day.mobility_notes,
        minutes=day_minutes(day),
        finished_at=None if session is None else session.finished_at,
        exercises=[exercise_out(e, entries, e.id in done) for e in day.exercises],
    )


def check_measure(kind: ExerciseKind, data: SetEntryIn) -> None:
    """Cada tipo de ejercicio se mide en una sola cosa: repeticiones, segundos o minutos."""
    expected = {
        ExerciseKind.STRENGTH: "reps",
        ExerciseKind.ISOMETRIC: "duration_seconds",
        ExerciseKind.CARDIO: "duration_minutes",
    }[kind]
    given = {
        name
        for name in ("reps", "duration_seconds", "duration_minutes", "weight_kg")
        if getattr(data, name) is not None
    }
    allowed = {expected} | ({"weight_kg"} if kind == ExerciseKind.STRENGTH else set())
    if expected not in given:
        raise HTTPException(status_code=422, detail=f"Falta el valor de {expected}")
    if given - allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Este ejercicio no admite: {', '.join(sorted(given - allowed))}",
        )


def new_entry(session: WorkoutSession, plan_exercise: PlanExercise, plan_set: PlanSet) -> SetEntry:
    return SetEntry(
        session_id=session.id,
        plan_exercise_id=plan_exercise.id,
        plan_set_id=plan_set.id,
        exercise_id=plan_exercise.exercise_id,
        set_number=plan_set.set_number,
    )


def copy_plan(entry: SetEntry, plan_set: PlanSet) -> None:
    """Lo realizado igual a lo planificado: "la hice como estaba"."""
    entry.reps = plan_set.reps
    entry.duration_minutes = plan_set.duration_minutes
    entry.duration_seconds = plan_set.duration_seconds
    entry.weight_kg = plan_set.target_weight_kg


def find_set(day: PlanDay, plan_set_id: int) -> tuple[PlanExercise, PlanSet]:
    found = next(
        ((e, s) for e in day.exercises for s in e.sets if s.id == plan_set_id), None
    )
    if found is None:
        raise HTTPException(status_code=404, detail="No existe esa serie")
    return found


@router.put("/{week_id}/days/{day_index}/sets/{plan_set_id}", response_model=DaySetOut)
def save_set(
    week_id: int,
    day_index: int,
    plan_set_id: int,
    data: SetEntryIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DaySetOut:
    """Guarda lo realizado en una serie. El plan no se toca."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise, plan_set = find_set(day, plan_set_id)
    require_active(week)
    require_unlocked(db, day, plan_exercise)
    check_measure(plan_exercise.exercise.kind, data)

    session = open_session(db, user, day)
    entry = db.scalar(
        select(SetEntry).where(
            SetEntry.session_id == session.id, SetEntry.plan_set_id == plan_set.id
        )
    )
    if entry is None:
        entry = new_entry(session, plan_exercise, plan_set)
        db.add(entry)
    entry.reps = data.reps
    entry.duration_minutes = data.duration_minutes
    entry.duration_seconds = data.duration_seconds
    entry.weight_kg = None if data.weight_kg is None else Decimal(str(data.weight_kg))
    db.commit()
    return set_out(plan_set, entry)


@router.post("/{week_id}/days/{day_index}/sets/{plan_set_id}/done", response_model=DaySetOut)
def mark_set_done(
    week_id: int,
    day_index: int,
    plan_set_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DaySetOut:
    """Marca una serie como hecha: copia lo planificado. Si ya tenía algo (editado), lo respeta."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise, plan_set = find_set(day, plan_set_id)
    require_active(week)
    require_unlocked(db, day, plan_exercise)
    session = open_session(db, user, day)

    entry = db.scalar(
        select(SetEntry).where(
            SetEntry.session_id == session.id, SetEntry.plan_set_id == plan_set.id
        )
    )
    if entry is None:
        entry = new_entry(session, plan_exercise, plan_set)
        copy_plan(entry, plan_set)
        db.add(entry)
        db.commit()
    return set_out(plan_set, entry)


@router.delete("/{week_id}/days/{day_index}/sets/{plan_set_id}/done", response_model=DaySetOut)
def undo_set_done(
    week_id: int,
    day_index: int,
    plan_set_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DaySetOut:
    """Desmarca una serie: borra lo registrado de esa serie (el plan no se toca)."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise, plan_set = find_set(day, plan_set_id)
    require_active(week)
    require_unlocked(db, day, plan_exercise)

    session = day_session(db, user, day)
    if session is not None:  # sin sesión no hay nada registrado que borrar
        if session.finished_at is not None:
            raise HTTPException(
                status_code=409, detail="El día está completado: reabrilo para corregir"
            )
        db.execute(
            delete(SetEntry).where(
                SetEntry.session_id == session.id, SetEntry.plan_set_id == plan_set.id
            )
        )
        db.commit()
    return set_out(plan_set, None)


@router.post(
    "/{week_id}/days/{day_index}/exercises/{plan_exercise_id}/done",
    response_model=DayExerciseOut,
)
def mark_exercise_done(
    week_id: int,
    day_index: int,
    plan_exercise_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayExerciseOut:
    """Marca el ejercicio como hecho y lo cierra (queda bloqueado hasta reabrirlo).

    Cada serie sin registrar copia lo planificado; las que el usuario ya marcó o editó se
    respetan. Así un ejercicio hecho siempre tiene todas sus series reales.
    """
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise = find_exercise(day, plan_exercise_id)
    require_active(week)
    session = open_session(db, user, day)

    entries = day_entries(db, day)
    for plan_set in plan_exercise.sets:
        if plan_set.id in entries:
            continue
        entry = new_entry(session, plan_exercise, plan_set)
        copy_plan(entry, plan_set)
        db.add(entry)
    if plan_exercise.id not in completed_ids(db, day):
        db.add(ExerciseCompletion(session_id=session.id, plan_exercise_id=plan_exercise.id))
    db.commit()
    return exercise_out(plan_exercise, day_entries(db, day), True)


@router.delete(
    "/{week_id}/days/{day_index}/exercises/{plan_exercise_id}/done",
    response_model=DayExerciseOut,
)
def undo_exercise_done(
    week_id: int,
    day_index: int,
    plan_exercise_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayExerciseOut:
    """Deshacer: borra lo registrado de ese ejercicio y su cierre (el plan no se toca)."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise = find_exercise(day, plan_exercise_id)
    require_active(week)

    session = day_session(db, user, day)
    if session is not None:  # sin sesión no hay nada registrado que borrar
        if session.finished_at is not None:
            raise HTTPException(
                status_code=409, detail="El día está completado: reabrilo para corregir"
            )
        db.execute(
            delete(SetEntry).where(
                SetEntry.session_id == session.id,
                SetEntry.plan_set_id.in_([s.id for s in plan_exercise.sets]),
            )
        )
        db.execute(
            delete(ExerciseCompletion).where(
                ExerciseCompletion.session_id == session.id,
                ExerciseCompletion.plan_exercise_id == plan_exercise.id,
            )
        )
        db.commit()
    return exercise_out(plan_exercise, day_entries(db, day), False)


@router.post(
    "/{week_id}/days/{day_index}/exercises/{plan_exercise_id}/reopen",
    response_model=DayExerciseOut,
)
def reopen_exercise(
    week_id: int,
    day_index: int,
    plan_exercise_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayExerciseOut:
    """Reabre un ejercicio hecho para corregirlo: quita el cierre y conserva lo registrado."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise = find_exercise(day, plan_exercise_id)
    require_active(week)

    session = day_session(db, user, day)
    if session is not None:
        if session.finished_at is not None:
            raise HTTPException(
                status_code=409, detail="El día está completado: reabrilo para corregir"
            )
        db.execute(
            delete(ExerciseCompletion).where(
                ExerciseCompletion.session_id == session.id,
                ExerciseCompletion.plan_exercise_id == plan_exercise.id,
            )
        )
        db.commit()
    return exercise_out(plan_exercise, day_entries(db, day), False)


@router.post("/{week_id}/days/{day_index}/complete", response_model=DayStatusOut)
def complete_day(
    week_id: int,
    day_index: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayStatusOut:
    """Día completado: cierra la sesión. Los ejercicios sin registrar quedan como no hechos."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    require_active(week)
    session = day_session(db, user, day)
    if session is None:
        session = WorkoutSession(user_id=user.id, plan_day_id=day.id)
        db.add(session)
    if session.finished_at is None:
        session.finished_at = datetime.now(timezone.utc)
    db.commit()
    return DayStatusOut(finished_at=session.finished_at)


@router.post("/{week_id}/days/{day_index}/reopen", response_model=DayStatusOut)
def reopen_day(
    week_id: int,
    day_index: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayStatusOut:
    """Reabre un día completado para corregirlo."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    require_active(week)
    session = day_session(db, user, day)
    if session is not None and session.finished_at is not None:
        session.finished_at = None
        db.commit()
    return DayStatusOut(finished_at=None)

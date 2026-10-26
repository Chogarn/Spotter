from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ai.history import signal
from app.ai.plan_writer import active_week
from app.ai.rules import BIG_GROUPS, COMPLEMENT, estimate_day_minutes
from app.db import get_db
from app.deps import get_current_user
from app.enums import ExerciseKind, LoadFeel, PainLevel, PlanStatus, ProposalKind, ProposalStatus
from app.measurements import record
from app.models import (
    ExerciseCompletion,
    PlanDay,
    PlanExercise,
    PlanProposal,
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
    ExerciseFeelIn,
    ExerciseResultOut,
    MuscleSetsOut,
    PlannedValuesOut,
    RealSetOut,
    ResultSetOut,
    SetEntryIn,
    WeekDayItemOut,
    WeekDetailOut,
    WeekMusclesOut,
    WeekOut,
    WeekSummaryDetailOut,
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


def measured_minutes(session: WorkoutSession | None) -> int | None:
    """Lo que tardó el día (decisión 82): de "Empezar día" a "Día completado". Nulo si falta alguno."""
    if session is None or session.started_at is None or session.finished_at is None:
        return None
    seconds = (session.finished_at - session.started_at).total_seconds()
    return max(0, round(seconds / 60)) if seconds >= 0 else None


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


def day_completions(db: Session, day: PlanDay) -> dict[int, ExerciseCompletion]:
    """Los ejercicios del día que el usuario cerró con "Marcar como hecho", por id planificado,
    con lo que marcó de carga y dolor."""
    rows = db.scalars(
        select(ExerciseCompletion)
        .join(WorkoutSession, ExerciseCompletion.session_id == WorkoutSession.id)
        .where(WorkoutSession.plan_day_id == day.id)
    )
    return {c.plan_exercise_id: c for c in rows}


def completed_ids(db: Session, day: PlanDay) -> set[int]:
    """Ids de los ejercicios planificados del día que el usuario cerró con "Marcar como hecho"."""
    return set(day_completions(db, day))


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


def week_day_states(db: Session, user: User, week: WeekPlan) -> list[str]:
    """El estado de cada día de la semana, en orden (lo que muestran los discos)."""
    return [day_state(day_entries(db, d), day_session(db, user, d)) for d in week.days]


LOAD_ORDER = [LoadFeel.LIGHT, LoadFeel.GOOD, LoadFeel.HEAVY, LoadFeel.VERY_HEAVY]
PAIN_ORDER = [PainLevel.MILD, PainLevel.MODERATE, PainLevel.STRONG]


def _stronger(order: list, a, b):
    """El más fuerte de dos marcas (alguna puede faltar)."""
    if a is None or b is None:
        return a if b is None else b
    return a if order.index(a) >= order.index(b) else b


def strongest_feel(
    current: tuple[LoadFeel | None, PainLevel | None] | None, completion: ExerciseCompletion
) -> tuple[LoadFeel | None, PainLevel | None]:
    """Un ejercicio repetido en la semana se resume con su marca más fuerte."""
    load, pain = current or (None, None)
    return (
        _stronger(LOAD_ORDER, load, completion.load_feel),
        _stronger(PAIN_ORDER, pain, completion.pain),
    )


def _value(member) -> str | None:
    return None if member is None else member.value


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
        real=None if entry is None else real_out(entry),
    )


def real_out(entry: SetEntry) -> RealSetOut:
    return RealSetOut(
        reps=entry.reps,
        duration_minutes=entry.duration_minutes,
        duration_seconds=entry.duration_seconds,
        weight_kg=None if entry.weight_kg is None else float(entry.weight_kg),
    )


def previous_week(db: Session, week: WeekPlan) -> WeekPlan | None:
    """La última semana cerrada de la rutina activada antes que esta (para "Semana pasada")."""
    weeks = routine_weeks(db, week.routine_id)
    before = weeks[: [w.id for w in weeks].index(week.id)]
    return next((w for w in reversed(before) if w.status == PlanStatus.CLOSED), None)


def previous_by_exercise(db: Session, week: WeekPlan) -> dict[int, list[RealSetOut | None]]:
    """Lo realizado en la semana anterior, por ejercicio (no por día: si la IA lo movió de día,
    igual se encuentra). Si el ejercicio se repetía en la semana, vale la primera vez."""
    previous = previous_week(db, week)
    if previous is None:
        return {}
    result: dict[int, list[RealSetOut | None]] = {}
    for day in previous.days:
        entries = day_entries(db, day)
        for exercise in day.exercises:
            if exercise.exercise_id not in result:
                result[exercise.exercise_id] = [
                    real_out(entries[s.id]) if s.id in entries else None for s in exercise.sets
                ]
    return result


def previous_for(
    db: Session, week: WeekPlan, exercise: PlanExercise
) -> list[RealSetOut | None] | None:
    """"Semana pasada" de un solo ejercicio: va también en la respuesta de marcarlo o reabrirlo,
    para que la pantalla no la pierda al reemplazar el ejercicio."""
    return previous_by_exercise(db, week).get(exercise.exercise_id)


def exercise_out(
    exercise: PlanExercise,
    entries: dict[int, SetEntry],
    completion: ExerciseCompletion | None,
    previous: list[RealSetOut | None] | None = None,
) -> DayExerciseOut:
    return DayExerciseOut(
        id=exercise.id,
        completed=completion is not None,
        load_feel=None if completion is None else completion.load_feel,
        pain=None if completion is None else completion.pain,
        name=exercise.exercise.name,
        kind=exercise.exercise.kind.value,
        rest_seconds=exercise.rest_seconds,
        execution_notes=exercise.execution_notes,
        reason=exercise.reason,
        sets=[set_out(s, entries.get(s.id)) for s in exercise.sets],
        previous=previous,
    )


# R3: series semanales mínimas por grupo grande.
MIN_WEEKLY_SETS = 10


def done_sets_by_muscle(db: Session, week: WeekPlan) -> dict:
    """Series hechas en la semana por grupo grande y por complemento (bíceps, tríceps, gemelos,
    core, aductores, antebrazo y tibial), con el músculo como principal (las indirectas no suman, como en el reparto de la
    decisión 90). Una serie cuenta si tiene lo realizado."""
    counts = {muscle: 0 for muscle in BIG_GROUPS + COMPLEMENT}
    for day in week.days:
        entries = day_entries(db, day)
        for exercise in day.exercises:
            muscle = exercise.exercise.primary_muscle
            if muscle in counts:
                counts[muscle] += sum(1 for s in exercise.sets if s.id in entries)
    return counts


# /active y /muscles van antes que /{week_id}, si no se tomarían como un id.
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
        in_progress_day=next(
            (
                d.day_index
                for d in week.days
                if (s := day_session(db, user, d)) is not None
                and s.started_at is not None
                and s.finished_at is None
            ),
            None,
        ),
    )


@router.get("/muscles", response_model=WeekMusclesOut)
def get_latest_week_muscles(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> WeekMusclesOut:
    """Series hechas por grupo muscular en la última semana (la activa o, si no hay, la última
    cerrada), junto a las de la semana cerrada anterior de su rutina. Para el radar."""
    week = active_week(db, user.id) or db.scalar(
        select(WeekPlan)
        .where(WeekPlan.user_id == user.id, WeekPlan.status == PlanStatus.CLOSED)
        .order_by(WeekPlan.week_start.desc(), WeekPlan.id.desc())
    )
    if week is None:
        raise HTTPException(status_code=404, detail="Todavía no tenés semanas")
    _, number = get_own_week(db, user, week.id)
    current = done_sets_by_muscle(db, week)
    before = previous_week(db, week)
    previous = None if before is None else done_sets_by_muscle(db, before)
    return WeekMusclesOut(
        week_id=week.id,
        number=number,
        routine_name=week.routine.name,
        status=week.status.value,
        minimum=MIN_WEEKLY_SETS,
        has_previous=previous is not None,
        muscles=[
            MuscleSetsOut(
                muscle=muscle.value,
                sets=current[muscle],
                previous_sets=None if previous is None else previous[muscle],
            )
            for muscle in BIG_GROUPS
        ],
        others=[
            MuscleSetsOut(
                muscle=muscle.value,
                sets=current[muscle],
                previous_sets=None if previous is None else previous[muscle],
            )
            for muscle in COMPLEMENT
        ],
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


@router.get("/{week_id}/summary", response_model=WeekSummaryDetailOut)
def get_week_summary(
    week_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> WeekSummaryDetailOut:
    """Resumen de la semana para Progreso (#28): cuánto se entrenó, cómo le fue en cada
    ejercicio y qué dijo la IA. Vale también para la semana en curso (lo registrado hasta ahora)."""
    week, number = get_own_week(db, user, week_id)
    sets_done = sets_planned = cardio = 0
    kg = Decimal(0)
    # Un ejercicio repetido en la semana junta sus series y tiene una sola señal.
    pairs_by_exercise: dict[int, list[tuple[PlanSet, SetEntry | None]]] = {}
    names: dict[int, PlanExercise] = {}
    feel_by_exercise: dict[int, tuple[LoadFeel | None, PainLevel | None]] = {}
    for day in week.days:
        entries = day_entries(db, day)
        completions = day_completions(db, day)
        for exercise in day.exercises:
            completion = completions.get(exercise.id)
            if completion is not None:
                feel_by_exercise[exercise.exercise_id] = strongest_feel(
                    feel_by_exercise.get(exercise.exercise_id), completion
                )
            names.setdefault(exercise.exercise_id, exercise)
            pairs = pairs_by_exercise.setdefault(exercise.exercise_id, [])
            for plan_set in exercise.sets:
                entry = entries.get(plan_set.id)
                pairs.append((plan_set, entry))
                sets_planned += 1
                if entry is None:
                    continue
                sets_done += 1
                if entry.reps is not None and entry.weight_kg is not None:
                    kg += entry.reps * entry.weight_kg
                cardio += entry.duration_minutes or 0
    states = week_day_states(db, user, week)
    durations = [measured_minutes(day_session(db, user, day)) for day in week.days]
    measured = [m for m in durations if m is not None]
    weeks = routine_weeks(db, week.routine_id)
    following = weeks[number] if number < len(weeks) else None  # `number` empieza en 1
    return WeekSummaryDetailOut(
        week_id=week.id,
        routine_id=week.routine_id,
        routine_name=week.routine.name,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        closed_at=week.closed_at,
        day_states=states,
        days_completed=states.count("completed"),
        sets_done=sets_done,
        sets_planned=sets_planned,
        kg_moved=float(kg),
        cardio_minutes=cardio,
        duration_minutes=sum(measured) if measured else None,
        day_durations=durations,
        exercises=[
            ExerciseResultOut(
                name=names[exercise_id].exercise.name,
                kind=names[exercise_id].exercise.kind.value,
                signal=signal(pairs),
                load_feel=_value(feel_by_exercise.get(exercise_id, (None, None))[0]),
                pain=_value(feel_by_exercise.get(exercise_id, (None, None))[1]),
                sets=[
                    ResultSetOut(
                        planned=PlannedValuesOut(
                            reps=plan_set.reps,
                            duration_minutes=plan_set.duration_minutes,
                            duration_seconds=plan_set.duration_seconds,
                            weight_kg=float(plan_set.target_weight_kg)
                            if plan_set.target_weight_kg is not None
                            else None,
                        ),
                        real=RealSetOut(
                            reps=entry.reps,
                            duration_minutes=entry.duration_minutes,
                            duration_seconds=entry.duration_seconds,
                            weight_kg=float(entry.weight_kg) if entry.weight_kg is not None else None,
                        )
                        if entry is not None
                        else None,
                    )
                    for plan_set, entry in pairs
                ],
            )
            for exercise_id, pairs in pairs_by_exercise.items()
        ],
        ai_summary=following.ai_summary if following else None,
        closing_note=week.closing_note,
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
    # Peso (y grasa corporal) opcionales del día del cierre (decisión 87).
    if data is not None and data.weight_kg is not None:
        record(db, user, data.weight_kg, data.body_fat_pct, week_plan_id=week.id)
    db.commit()
    return WeekSummaryOut(
        id=week.id,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        closed_at=week.closed_at,
        day_count=len(week.days),
        day_states=week_day_states(db, user, week),
    )


@router.post("/{week_id}/reopen", response_model=WeekSummaryOut)
def reopen_week(
    week_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WeekSummaryOut:
    """Reabrir una semana cerrada (decisión 66): vuelve a estar en curso, sin IA y sin borrar nada.

    Solo la última semana de su rutina y solo si no hay otra en curso ni una propuesta sin
    revisar (que se armó con lo que decía esta semana al cerrarla y quedaría desactualizada).
    El comentario de cierre se borra: al volver a cerrarla se escribe uno nuevo.
    """
    week, number = get_own_week(db, user, week_id)
    if week.status != PlanStatus.CLOSED:
        raise HTTPException(status_code=409, detail="Esa semana ya está en curso")
    if routine_weeks(db, week.routine_id)[-1].id != week.id:
        raise HTTPException(
            status_code=409, detail="Solo se puede reabrir la última semana de la rutina"
        )
    if active_week(db, user.id) is not None:
        raise HTTPException(
            status_code=409, detail="Ya tenés una semana en curso: cerrala antes de reabrir otra"
        )
    pending = db.scalar(
        select(PlanProposal.id).where(
            PlanProposal.user_id == user.id,
            PlanProposal.kind.in_((ProposalKind.GENERATE, ProposalKind.WEEK_CLOSE)),
            PlanProposal.status == ProposalStatus.PENDING,
        )
    )
    if pending is not None:
        raise HTTPException(
            status_code=409,
            detail="Tenés una propuesta sin revisar: aceptala o descartala antes de reabrir esta semana",
        )
    week.status = PlanStatus.ACTIVE
    week.closed_at = None
    week.closing_note = None
    db.commit()
    return WeekSummaryOut(
        id=week.id,
        number=number,
        status=week.status.value,
        week_start=week.week_start,
        closed_at=week.closed_at,
        day_count=len(week.days),
        day_states=week_day_states(db, user, week),
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
    done = day_completions(db, day)
    previous = previous_by_exercise(db, week)
    return DayDetailOut(
        week_id=week.id,
        week_number=number,
        week_status=week.status.value,
        day_index=day.day_index,
        title=day.title,
        mobility_notes=day.mobility_notes,
        minutes=day_minutes(day),
        finished_at=None if session is None else session.finished_at,
        started_at=None if session is None else session.started_at,
        exercises=[
            exercise_out(e, entries, done.get(e.id), previous.get(e.exercise_id))
            for e in day.exercises
        ],
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
    return exercise_out(
        plan_exercise,
        day_entries(db, day),
        day_completions(db, day).get(plan_exercise.id),
        previous_for(db, week, plan_exercise),
    )


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
    return exercise_out(
        plan_exercise, day_entries(db, day), None, previous_for(db, week, plan_exercise)
    )


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
    return exercise_out(
        plan_exercise, day_entries(db, day), None, previous_for(db, week, plan_exercise)
    )


@router.put(
    "/{week_id}/days/{day_index}/exercises/{plan_exercise_id}/feel",
    response_model=DayExerciseOut,
)
def save_exercise_feel(
    week_id: int,
    day_index: int,
    plan_exercise_id: int,
    data: ExerciseFeelIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayExerciseOut:
    """Marca opcional de cómo se sintió la carga y si hubo dolor (decisión 74).

    Solo con el ejercicio hecho y el día sin completar. Cada campo es independiente: el que no
    viene se deja como está y el que viene en `null` se borra.
    """
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    plan_exercise = find_exercise(day, plan_exercise_id)
    require_active(week)
    session = day_session(db, user, day)
    if session is not None and session.finished_at is not None:
        raise HTTPException(
            status_code=409, detail="El día está completado: reabrilo para corregir"
        )
    completion = day_completions(db, day).get(plan_exercise.id)
    if completion is None:
        raise HTTPException(
            status_code=409, detail="Marcá el ejercicio como hecho antes de contar cómo te fue"
        )
    if "load_feel" in data.model_fields_set:
        completion.load_feel = data.load_feel
    if "pain" in data.model_fields_set:
        completion.pain = data.pain
    db.commit()
    return exercise_out(
        plan_exercise, day_entries(db, day), completion, previous_for(db, week, plan_exercise)
    )


@router.post("/{week_id}/days/{day_index}/start", response_model=DayStatusOut)
def start_day(
    week_id: int,
    day_index: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayStatusOut:
    """Empezar día (decisión 82): marca la hora de inicio para el contador del modo entrenar. Si ya
    estaba empezado no la cambia; un día completado hay que reabrirlo."""
    week, _ = get_own_week(db, user, week_id)
    day = find_day(week, day_index)
    require_active(week)
    session = open_session(db, user, day)
    if session.started_at is None:
        session.started_at = datetime.now(timezone.utc)
    db.commit()
    return DayStatusOut(finished_at=None, started_at=session.started_at)


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
    return DayStatusOut(finished_at=session.finished_at, started_at=session.started_at)


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
        session.started_at = None  # el contador vuelve a empezar al retomar (decisión 82)
        db.commit()
    return DayStatusOut(finished_at=None)

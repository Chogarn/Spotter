import calendar as cal
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.ai.history import signal
from app.models import PlanDay, PlanExercise, PlanSet, SetEntry, User, WorkoutSession
from app.ai.rules import BIG_GROUPS, COMPLEMENT
from app.routers.weeks import MIN_WEEKLY_SETS, day_entries, measured_minutes, routine_weeks
from app.schemas import (
    ExerciseResultOut,
    MuscleSetsOut,
    PlannedValuesOut,
    RealSetOut,
    ResultSetOut,
    PeriodBucketOut,
    PeriodMusclesOut,
    PeriodExerciseOut,
    PeriodSessionOut,
    PeriodSummaryOut,
)

router = APIRouter(prefix="/progress", tags=["progress"])

MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def _local_date(moment: datetime, tz: int) -> date:
    """El día del calendario de la persona: el instante guardado más su diferencia horaria."""
    return (moment + timedelta(minutes=tz)).date()


def _range(period: str, anchor: date) -> tuple[date, date]:
    """Desde y hasta (ambos incluidos) del día, mes o año que contiene la fecha."""
    if period == "day":
        return anchor, anchor
    if period == "month":
        return anchor.replace(day=1), anchor.replace(day=cal.monthrange(anchor.year, anchor.month)[1])
    return date(anchor.year, 1, 1), date(anchor.year, 12, 31)


@router.get("/period", response_model=PeriodSummaryOut)
def get_period_summary(
    period: Literal["day", "month", "year"],
    on: date = Query(alias="date", description="Cualquier fecha dentro del día, mes o año pedido"),
    # Minutos que hay que sumar a UTC para tener la hora de la persona (Argentina: -180).
    tz: int = Query(default=0, ge=-840, le=840),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PeriodSummaryOut:
    """Resumen de un día, un mes o un año, juntando todas las rutinas (sin IA). Cuenta los días con
    "Día completado" (`finished_at`), como el calendario; un día reabierto no cuenta. Para el mes
    devuelve una barra por día y para el año una por mes. La semana tiene su propio resumen
    (`GET /weeks/{id}/summary`)."""
    start, end = _range(period, on)
    finished = db.scalars(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user.id, WorkoutSession.finished_at.is_not(None))
        .order_by(WorkoutSession.finished_at, WorkoutSession.id)
    )
    number_cache: dict[int, dict[int, int]] = {}
    all_days: set[date] = set()
    days: set[date] = set()
    sets_done = sets_planned = cardio = 0
    kg = Decimal(0)
    durations: list[int] = []
    sessions: list[PeriodSessionOut] = []
    # Por ejercicio: series hechas y la mejor marca (peso o, si no hay, repeticiones/duración).
    exercises: dict[int, dict] = {}
    # Por barra (día del mes o mes del año): días entrenados, series y kilos.
    buckets: dict[date, dict] = {}
    # Solo el día: las series de cada ejercicio, planificadas y realizadas, para la señal.
    pairs_by_exercise: dict[int, list[tuple[PlanSet, SetEntry | None]]] = {}
    plan_exercises: dict[int, PlanExercise] = {}

    for session in finished:
        if session.plan_day_id is None:
            continue
        day = db.get(PlanDay, session.plan_day_id)
        if day is None:
            continue
        local = _local_date(session.finished_at, tz)
        all_days.add(local)
        if not start <= local <= end:
            continue
        days.add(local)
        week = day.week_plan
        if week.routine_id not in number_cache:
            number_cache[week.routine_id] = {
                w.id: i + 1 for i, w in enumerate(routine_weeks(db, week.routine_id))
            }
        minutes = measured_minutes(session)
        if minutes is not None:
            durations.append(minutes)
        sessions.append(
            PeriodSessionOut(
                local_date=local,
                title=day.title,
                routine_name=week.routine.name,
                week_id=week.id,
                week_number=number_cache[week.routine_id][week.id],
                day_index=day.day_index,
                duration_minutes=minutes,
            )
        )
        key = local if period == "month" else local.replace(day=1)
        bucket = buckets.setdefault(key, {"days": set(), "sets": 0, "kg": Decimal(0)})
        bucket["days"].add(local)

        entries = day_entries(db, day)
        for plan_exercise in day.exercises:
            plan_exercises.setdefault(plan_exercise.exercise_id, plan_exercise)
            for plan_set in plan_exercise.sets:
                sets_planned += 1
                entry = entries.get(plan_set.id)
                if period == "day":
                    pairs_by_exercise.setdefault(plan_exercise.exercise_id, []).append((plan_set, entry))
                if entry is None:
                    continue
                sets_done += 1
                bucket["sets"] += 1
                cardio += entry.duration_minutes or 0
                moved = (
                    entry.reps * entry.weight_kg
                    if entry.reps is not None and entry.weight_kg is not None
                    else Decimal(0)
                )
                kg += moved
                bucket["kg"] += moved
                item = exercises.setdefault(
                    plan_exercise.exercise_id,
                    {"name": plan_exercise.exercise.name, "kind": plan_exercise.exercise.kind.value, "sets": 0, "weight": None},
                )
                item["sets"] += 1
                if entry.weight_kg is not None and (item["weight"] is None or entry.weight_kg > item["weight"]):
                    item["weight"] = entry.weight_kg

    out_buckets: list[PeriodBucketOut] = []
    if period == "month":
        for n in range(1, end.day + 1):
            d = start.replace(day=n)
            b = buckets.get(d)
            out_buckets.append(
                PeriodBucketOut(
                    label=str(n),
                    start=d,
                    days_trained=len(b["days"]) if b else 0,
                    sets_done=b["sets"] if b else 0,
                    kg_moved=float(b["kg"]) if b else 0.0,
                )
            )
    elif period == "year":
        for n in range(1, 13):
            d = date(start.year, n, 1)
            b = buckets.get(d)
            out_buckets.append(
                PeriodBucketOut(
                    label=MONTHS[n - 1],
                    start=d,
                    days_trained=len(b["days"]) if b else 0,
                    sets_done=b["sets"] if b else 0,
                    kg_moved=float(b["kg"]) if b else 0.0,
                )
            )

    return PeriodSummaryOut(
        period=period,
        start=start,
        end=end,
        first_date=min(all_days) if all_days else None,
        days_trained=len(days),
        sets_done=sets_done,
        sets_planned=sets_planned,
        kg_moved=float(kg),
        cardio_minutes=cardio,
        duration_minutes=sum(durations) if durations else None,
        buckets=out_buckets,
        sessions=sessions,
        exercises=[
            PeriodExerciseOut(
                name=e["name"],
                kind=e["kind"],
                sets_done=e["sets"],
                best_weight_kg=float(e["weight"]) if e["weight"] is not None else None,
            )
            for e in sorted(exercises.values(), key=lambda e: (-e["sets"], e["name"]))
        ],
        results=[
            ExerciseResultOut(
                name=plan_exercises[exercise_id].exercise.name,
                kind=plan_exercises[exercise_id].exercise.kind.value,
                signal=signal(pairs),
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
    )


@router.get("/muscles", response_model=PeriodMusclesOut)
def get_period_muscles(
    period: Literal["day", "month", "year"],
    on: date = Query(alias="date", description="Cualquier fecha dentro del día, mes o año pedido"),
    tz: int = Query(default=0, ge=-840, le=840),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PeriodMusclesOut:
    """Series hechas por grupo grande (con el músculo como principal, como el radar de la semana)
    en un día, un mes o un año, junto a las del período anterior. Cuenta solo los días con "Día
    completado". El mínimo de R3 (10 por semana) se escala a los días del período que ya pasaron;
    en el día no hay mínimo."""
    start, end = _range(period, on)
    before_start, before_end = _range(period, start - timedelta(days=1))
    current = {muscle: 0 for muscle in BIG_GROUPS + COMPLEMENT}
    previous = {muscle: 0 for muscle in BIG_GROUPS + COMPLEMENT}
    all_days: set[date] = set()
    finished = db.scalars(
        select(WorkoutSession).where(
            WorkoutSession.user_id == user.id, WorkoutSession.finished_at.is_not(None)
        )
    )
    for session in finished:
        day = db.get(PlanDay, session.plan_day_id) if session.plan_day_id is not None else None
        if day is None:
            continue
        local = _local_date(session.finished_at, tz)
        all_days.add(local)
        counts = current if start <= local <= end else previous if before_start <= local <= before_end else None
        if counts is None:
            continue
        entries = day_entries(db, day)
        for plan_exercise in day.exercises:
            muscle = plan_exercise.exercise.primary_muscle
            if muscle in counts:
                counts[muscle] += sum(1 for s in plan_exercise.sets if s.id in entries)

    minimum = None
    if period != "day":
        today = _local_date(datetime.now(timezone.utc), tz)
        elapsed = max(0, (min(end, today) - start).days + 1)
        minimum = round(MIN_WEEKLY_SETS * elapsed / 7)
    return PeriodMusclesOut(
        period=period,
        start=start,
        end=end,
        first_date=min(all_days) if all_days else None,
        minimum=minimum,
        muscles=[
            MuscleSetsOut(muscle=m.value, sets=current[m], previous_sets=previous[m]) for m in BIG_GROUPS
        ],
        others=[
            MuscleSetsOut(muscle=m.value, sets=current[m], previous_sets=previous[m]) for m in COMPLEMENT
        ],
    )

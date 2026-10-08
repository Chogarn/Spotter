"""Escribe en el plan una rutina que el usuario aceptó.

Es el único lugar donde la propuesta de la IA pasa a ser un plan real (`week_plans`,
`plan_days`, `plan_exercises`, `plan_sets`). Lo llama el endpoint de aceptar.
"""

import re
import unicodedata
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.routine import RoutineProposal
from app.enums import PlanOrigin, PlanStatus
from app.models import Exercise, PlanDay, PlanExercise, PlanSet, WeekPlan


def normalize_name(name: str) -> str:
    """Minúsculas, sin tildes y sin espacios de más: "Press  Banca" y "press banca" coinciden."""
    without_accents = "".join(
        c for c in unicodedata.normalize("NFKD", name) if not unicodedata.combining(c)
    )
    return re.sub(r"\s+", " ", without_accents).strip().lower()


def active_week(db: Session, user_id: int) -> WeekPlan | None:
    return db.scalar(
        select(WeekPlan).where(
            WeekPlan.user_id == user_id, WeekPlan.status == PlanStatus.ACTIVE
        )
    )


def write_plan(db: Session, user_id: int, routine: RoutineProposal) -> WeekPlan:
    """Crea la semana activa. No hace commit: lo hace quien llama, junto con la propuesta."""
    week = WeekPlan(
        user_id=user_id,
        week_start=date.today(),
        status=PlanStatus.ACTIVE,
        origin=PlanOrigin.GENERATED,
    )
    db.add(week)

    exercises: dict[str, Exercise] = {}  # evita duplicar un ejercicio repetido en la semana
    for day_index, day in enumerate(routine.days, start=1):
        plan_day = PlanDay(
            day_index=day_index, title=day.title, mobility_notes=day.mobility_notes
        )
        week.days.append(plan_day)
        for position, item in enumerate(day.exercises, start=1):
            key = normalize_name(item.name)
            exercise = exercises.get(key) or db.scalar(
                select(Exercise).where(Exercise.name_normalized == key)
            )
            if exercise is None:
                exercise = Exercise(
                    name=item.name.strip(),
                    name_normalized=key,
                    kind=item.kind,
                    region=item.region,
                    direction=item.direction,
                    primary_muscle=item.primary_muscle,
                    secondary_muscles=[m.value for m in item.secondary_muscles],
                    mechanic=item.mechanic,
                    equipment=item.equipment,
                    level=item.level,
                )
                db.add(exercise)
            # Si el ejercicio ya existía, se conservan sus etiquetas: el primero que se guardó manda.
            exercises[key] = exercise

            plan_exercise = PlanExercise(
                exercise=exercise,
                position=position,
                execution_notes=item.execution_notes,
                rest_seconds=item.rest_seconds,
                reason=item.reason,
            )
            plan_day.exercises.append(plan_exercise)
            for set_number, serie in enumerate(item.sets, start=1):
                plan_exercise.sets.append(
                    PlanSet(
                        set_number=set_number,
                        reps=serie.reps,
                        duration_minutes=serie.duration_minutes,
                        duration_seconds=serie.duration_seconds,
                        target_weight_kg=(
                            None
                            if serie.target_weight_kg is None
                            else Decimal(str(serie.target_weight_kg))
                        ),
                    )
                )
    db.flush()
    return week

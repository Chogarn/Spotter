"""Lo planificado frente a lo real de la semana anterior, listo para la IA.

Las señales las calcula el CÓDIGO (no Gemini), para que no cuente mal:
- `superó`: más de la mitad de las series registradas pasó lo planificado y ninguna quedó corta.
- `no llegó`: más de la mitad de las series registradas quedó por debajo de lo planificado.
- `cumplió`: el resto.
- `sin registrar`: no hay nada cargado en el ejercicio (información, no un error).

Qué hacer con cada señal (R9, R10, R28) se lo explica el prompt; el código solo informa y avisa.
"""

import re
import unicodedata
from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.routine import RoutineProposal
from app.enums import ExerciseKind, PlanStatus
from app.models import PlanDay, PlanExercise, PlanSet, SetEntry, WeekPlan, WorkoutSession

# R9 y R28: la subida de carga va de 2 % a 10 %; por encima se avisa.
MAX_LOAD_JUMP = Decimal("1.10")

KIND_LABEL = {
    ExerciseKind.STRENGTH: "fuerza",
    ExerciseKind.ISOMETRIC: "isométrico",
    ExerciseKind.CARDIO: "cardio",
}


def normalize(name: str) -> str:
    plain = "".join(c for c in unicodedata.normalize("NFKD", name) if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", plain).strip().lower()


def _clean(text: str) -> str:
    """El nombre viene de una respuesta anterior de la IA: no puede cerrar bloques ni inventar etiquetas."""
    return re.sub(r"[<>]", "", text).strip()


@dataclass
class PreviousWeek:
    text: str  # el bloque que se pega en el prompt
    has_data: bool  # alguna serie con algo registrado
    # Mayor peso realmente levantado por ejercicio (nombre normalizado), para avisar saltos.
    last_weights: dict[str, Decimal] = field(default_factory=dict)


def last_closed_week(db: Session, routine_id: int) -> WeekPlan | None:
    return db.scalar(
        select(WeekPlan)
        .where(WeekPlan.routine_id == routine_id, WeekPlan.status == PlanStatus.CLOSED)
        .order_by(WeekPlan.week_start.desc(), WeekPlan.id.desc())
    )


def _measure(plan_or_entry) -> tuple[int | None, str]:
    """El valor de la serie y su unidad: repeticiones, segundos o minutos."""
    if plan_or_entry.reps is not None:
        return plan_or_entry.reps, "reps"
    if plan_or_entry.duration_seconds is not None:
        return plan_or_entry.duration_seconds, "s"
    return plan_or_entry.duration_minutes, "min"


def _kg(value: Decimal | None) -> str:
    return "" if value is None else f" · {float(value):g} kg"


def signal(pairs: list[tuple[PlanSet, SetEntry | None]]) -> str:
    registered = [(p, e) for p, e in pairs if e is not None]
    if not registered:
        return "sin registrar"
    under = over = 0
    for plan, entry in registered:
        planned, _ = _measure(plan)
        real, _ = _measure(entry)
        if planned is None or real is None:
            continue
        under += real < planned
        over += real > planned
    total = len(registered)
    if under * 2 > total:
        return "no llegó"
    if over * 2 > total and under == 0:
        return "superó"
    return "cumplió"


def build_previous_week(db: Session, routine_id: int) -> PreviousWeek | None:
    week = last_closed_week(db, routine_id)
    if week is None:
        return None

    entries = {
        e.plan_set_id: e
        for e in db.scalars(
            select(SetEntry)
            .join(WorkoutSession, SetEntry.session_id == WorkoutSession.id)
            .join(PlanDay, WorkoutSession.plan_day_id == PlanDay.id)
            .where(PlanDay.week_plan_id == week.id, SetEntry.plan_set_id.is_not(None))
        )
    }
    sessions = {
        s.plan_day_id: s
        for s in db.scalars(
            select(WorkoutSession)
            .join(PlanDay, WorkoutSession.plan_day_id == PlanDay.id)
            .where(PlanDay.week_plan_id == week.id)
        )
    }

    lines: list[str] = []
    has_data = False
    last_weights: dict[str, Decimal] = {}
    for day in week.days:
        day_has_entries = any(
            s.id in entries for exercise in day.exercises for s in exercise.sets
        )
        session = sessions.get(day.id)
        if session is not None and session.finished_at is not None:
            state = "completado"
        elif day_has_entries:
            state = "a medias"
        else:
            state = "no hecho (nada registrado)"
        lines.append(f"Día {day.day_index} · {_clean(day.title)} — {state}")
        for exercise in day.exercises:
            lines += _exercise_lines(exercise, entries, last_weights)
            has_data = has_data or any(s.id in entries for s in exercise.sets)

    closed = f" (cerrada el {week.closed_at:%d/%m})" if week.closed_at else ""
    header = f"Semana anterior de esta rutina{closed}:"
    if not has_data:
        lines.append(
            "No se registró nada en esta semana: proponé repetir la misma semana y avisalo en `notices`."
        )
    return PreviousWeek("\n".join([header, *lines]), has_data, last_weights)


def _exercise_lines(
    exercise: PlanExercise, entries: dict[int, SetEntry], last_weights: dict[str, Decimal]
) -> list[str]:
    pairs = [(s, entries.get(s.id)) for s in exercise.sets]
    name = _clean(exercise.exercise.name)
    kind = KIND_LABEL[exercise.exercise.kind]
    lines = [f"- {name} [{kind}] — señal: {signal(pairs)}"]
    for plan, entry in pairs:
        planned, unit = _measure(plan)
        text = f"  Serie {plan.set_number}: plan {planned} {unit}{_kg(plan.target_weight_kg)}"
        if entry is None:
            text += " → sin registrar"
        else:
            real, real_unit = _measure(entry)
            text += f" → real {real} {real_unit}{_kg(entry.weight_kg)}"
            if entry.effort is not None:
                text += f" · esfuerzo {entry.effort}/10"
            if entry.weight_kg is not None:
                key = normalize(exercise.exercise.name)
                last_weights[key] = max(last_weights.get(key, Decimal(0)), entry.weight_kg)
        lines.append(text)
    return lines


def weight_jump_warnings(routine: RoutineProposal, previous: PreviousWeek) -> list[tuple[str, str]]:
    """R9 y R28: avisa (no rechaza) si un peso propuesto sube más de 10 % sobre el último realizado."""
    warnings: list[tuple[str, str]] = []
    seen: set[str] = set()
    for day in routine.days:
        for exercise in day.exercises:
            key = normalize(exercise.name)
            last = previous.last_weights.get(key)
            if last is None or last <= 0 or key in seen:
                continue
            proposed = max(
                (Decimal(str(s.target_weight_kg)) for s in exercise.sets if s.target_weight_kg is not None),
                default=None,
            )
            if proposed is not None and proposed > last * MAX_LOAD_JUMP:
                seen.add(key)
                warnings.append((
                    "R9",
                    f"{exercise.name}: sube de {float(last):g} a {float(proposed):g} kg (más de 10 %); "
                    "la progresión sugerida es de 2 % a 10 %.",
                ))
    return warnings

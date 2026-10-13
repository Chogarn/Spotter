"""Antes y después de una propuesta de semana nueva (#49).

Compara lo **planificado** en la semana anterior de la rutina (la misma que leyó la IA) con lo que
propone la IA, ejercicio por ejercicio y sin importar el día (por nombre normalizado). Si un
ejercicio aparece en varios días, vale la primera vez. Se calcula al pedirlo; no se guarda.
"""

from dataclasses import dataclass, field
from decimal import Decimal

from app.ai.plan_writer import normalize_name
from app.ai.routine import ExerciseProposal, RoutineProposal
from app.models import PlanExercise, WeekPlan


@dataclass
class SetShape:
    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    target_weight_kg: float | None


@dataclass
class ExerciseChange:
    name: str
    day_index: int  # el primer día de la propuesta donde aparece
    status: str  # "nuevo", "cambia" o "igual"
    sets_before: list[SetShape] = field(default_factory=list)
    sets_after: list[SetShape] = field(default_factory=list)
    load: str | None = None  # "sube", "baja" o vacío si la carga no cambia (o no lleva peso)
    sets_changed: bool = False  # cambió la cantidad de series o sus repeticiones o tiempos
    rest_before: int | None = None
    rest_after: int | None = None

    @property
    def rest_changed(self) -> bool:
        return self.status != "nuevo" and self.rest_before != self.rest_after


@dataclass
class ProposalChanges:
    base_week_id: int
    exercises: list[ExerciseChange]
    removed: list[str]  # los que estaban en la semana anterior y no están en la propuesta


def _plan_shape(exercise: PlanExercise) -> list[SetShape]:
    return [
        SetShape(
            s.reps,
            s.duration_minutes,
            s.duration_seconds,
            None if s.target_weight_kg is None else float(s.target_weight_kg),
        )
        for s in exercise.sets
    ]


def _proposal_shape(exercise: ExerciseProposal) -> list[SetShape]:
    return [
        SetShape(s.reps, s.duration_minutes, s.duration_seconds, s.target_weight_kg)
        for s in exercise.sets
    ]


def _max_weight(sets: list[SetShape]) -> Decimal | None:
    weights = [Decimal(str(s.target_weight_kg)) for s in sets if s.target_weight_kg is not None]
    return max(weights) if weights else None


def _measures(sets: list[SetShape]) -> list[tuple]:
    """Series y repeticiones (o tiempos), sin el peso: lo que cambia la "forma" del ejercicio."""
    return [(s.reps, s.duration_minutes, s.duration_seconds) for s in sets]


def compare(base: WeekPlan, routine: RoutineProposal) -> ProposalChanges:
    before: dict[str, PlanExercise] = {}
    order_before: list[str] = []
    for day in base.days:
        for exercise in day.exercises:
            key = normalize_name(exercise.exercise.name)
            if key not in before:
                before[key] = exercise
                order_before.append(key)

    changes: list[ExerciseChange] = []
    seen: set[str] = set()
    for day_index, day in enumerate(routine.days, start=1):
        for proposed in day.exercises:
            key = normalize_name(proposed.name)
            if key in seen:
                continue
            seen.add(key)
            after = _proposal_shape(proposed)
            previous = before.get(key)
            if previous is None:
                changes.append(
                    ExerciseChange(proposed.name, day_index, "nuevo", sets_after=after, rest_after=proposed.rest_seconds)
                )
                continue
            prior = _plan_shape(previous)
            w_before, w_after = _max_weight(prior), _max_weight(after)
            load = None
            if w_before is not None and w_after is not None and w_before != w_after:
                load = "sube" if w_after > w_before else "baja"
            change = ExerciseChange(
                proposed.name,
                day_index,
                "igual",
                sets_before=prior,
                sets_after=after,
                load=load,
                sets_changed=_measures(prior) != _measures(after),
                rest_before=previous.rest_seconds,
                rest_after=proposed.rest_seconds,
            )
            if load or change.sets_changed or change.rest_changed:
                change.status = "cambia"
            changes.append(change)

    removed = [before[k].exercise.name for k in order_before if k not in seen]
    return ProposalChanges(base_week_id=base.id, exercises=changes, removed=removed)

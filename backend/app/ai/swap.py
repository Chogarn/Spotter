"""Cambiar un ejercicio de una propuesta por otro del catálogo (decisión 65).

Sin IA y sin llamadas a Gemini: la lista de alternativas sale del catálogo y el cambio es
mecánico. Se aplica a **todas** las apariciones del ejercicio en la semana, y las series y
repeticiones se copian del ejercicio reemplazado (el peso queda en blanco: se ajusta al entrenar).
"""

from app.ai.catalog import CatalogExercise, find, load_catalog
from app.ai.plan_writer import normalize_name
from app.ai.retrieve import LEVEL_ORDER, allowed
from app.ai.routine import ExerciseProposal, RoutineProposal
from app.enums import Goal, Level


class SwapError(Exception):
    """No se puede hacer el cambio. `status` es el código HTTP que corresponde."""

    def __init__(self, message: str, status: int = 400):
        self.status = status
        super().__init__(message)


def _in_routine(routine: RoutineProposal, name: str) -> ExerciseProposal | None:
    key = normalize_name(name)
    for day in routine.days:
        for item in day.exercises:
            if normalize_name(item.name) == key:
                return item
    return None


def alternatives(
    routine: RoutineProposal, name: str, goal: Goal, level: Level
) -> list[CatalogExercise]:
    """Ejercicios del catálogo que pueden reemplazar a `name`.

    Mismo músculo principal y mismo tipo (fuerza, cardio o isométrico), del nivel de la persona o
    menor, y que no estén ya en la semana (así no se repite uno sin querer).
    """
    source = _in_routine(routine, name)
    if source is None:
        raise SwapError("Ese ejercicio no está en la propuesta", status=404)

    already = {
        found.id
        for day in routine.days
        for item in day.exercises
        if (found := find(item.name)) is not None
    }
    options = [
        c
        for c in load_catalog()
        if c.primary_muscle == source.primary_muscle
        and c.kind == source.kind
        and c.id not in already
        and allowed(c, goal, level)
    ]
    return sorted(options, key=lambda c: (LEVEL_ORDER[c.level], c.name))


def _replace(item: ExerciseProposal, target: CatalogExercise, old_name: str) -> ExerciseProposal:
    data = item.model_dump()
    data.update(
        name=target.name,
        region=target.region,
        direction=target.direction,
        primary_muscle=target.primary_muscle,
        secondary_muscles=list(target.secondary_muscles),
        mechanic=target.mechanic,
        equipment=target.equipment,
        level=target.level,
        # Las indicaciones y el motivo eran del ejercicio anterior: no valen para el nuevo.
        execution_notes=None,
        reason=f"Lo elegiste vos en lugar de {old_name}.",
    )
    # Mismas series y repeticiones; el peso del ejercicio nuevo no se conoce.
    data["sets"] = [{**s, "target_weight_kg": None} for s in data["sets"]]
    return ExerciseProposal.model_validate(data)


def swap(
    routine: RoutineProposal, from_name: str, to_id: str, goal: Goal, level: Level
) -> RoutineProposal:
    """Devuelve la rutina con `from_name` reemplazado en todos los días donde aparece."""
    options = {c.id: c for c in alternatives(routine, from_name, goal, level)}
    target = options.get(to_id)
    if target is None:
        raise SwapError("Ese ejercicio no es una alternativa válida para el cambio")

    key = normalize_name(from_name)
    days = []
    for day in routine.days:
        exercises = [
            _replace(item, target, item.name) if normalize_name(item.name) == key else item
            for item in day.exercises
        ]
        days.append(day.model_copy(update={"exercises": exercises}))
    return routine.model_copy(update={"days": days})

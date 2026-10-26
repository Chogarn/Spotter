"""El catálogo de ejercicios de la IA (decisión 58): carga y búsqueda por nombre.

Los datos viven en `exercises.json`, un archivo que el usuario puede leer y corregir. Acá solo se
lee y se valida; los vectores (RAG) se arman a partir de `embedding_text`.
"""

import hashlib
import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

from app.ai.plan_writer import normalize_name
from app.ai.routine import RoutineProposal
from app.enums import (
    ExerciseDirection,
    ExerciseEquipment,
    ExerciseKind,
    ExerciseMechanic,
    ExerciseRegion,
    Level,
    Muscle,
)

CATALOG_FILE = Path(__file__).parent / "exercises.json"

MUSCLE_TEXT = {
    Muscle.CHEST: "pecho",
    Muscle.BACK: "espalda",
    Muscle.SHOULDERS: "hombros",
    Muscle.BICEPS: "bíceps",
    Muscle.TRICEPS: "tríceps",
    Muscle.QUADRICEPS: "cuádriceps",
    Muscle.HAMSTRINGS: "isquios",
    Muscle.GLUTES: "glúteos",
    Muscle.CALVES: "gemelos",
    Muscle.CORE: "core",
    Muscle.FULL_BODY: "cuerpo completo",
}

EQUIPMENT_TEXT = {
    ExerciseEquipment.BARBELL: "barra",
    ExerciseEquipment.DUMBBELL: "mancuernas",
    ExerciseEquipment.MACHINE: "máquina",
    ExerciseEquipment.CABLE: "polea",
    ExerciseEquipment.BODYWEIGHT: "peso corporal",
    ExerciseEquipment.BAND: "banda elástica",
    ExerciseEquipment.KETTLEBELL: "kettlebell",
    ExerciseEquipment.OTHER: "otro",
}

KIND_TEXT = {
    ExerciseKind.STRENGTH: "fuerza",
    ExerciseKind.CARDIO: "cardio",
    ExerciseKind.ISOMETRIC: "isométrico",
}


class CatalogExercise(BaseModel):
    """Un ejercicio del catálogo. Las etiquetas son las cerradas de R13."""

    id: str
    name: str
    kind: ExerciseKind
    region: ExerciseRegion
    direction: ExerciseDirection
    primary_muscle: Muscle
    secondary_muscles: list[Muscle] = Field(default_factory=list)
    mechanic: ExerciseMechanic
    equipment: ExerciseEquipment
    level: Level
    description: str
    how_to: str = ""
    aliases: list[str] = Field(default_factory=list)


@lru_cache
def load_catalog() -> tuple[CatalogExercise, ...]:
    raw = json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
    return tuple(CatalogExercise.model_validate(e) for e in raw["exercises"])


@lru_cache
def _by_name() -> dict[str, CatalogExercise]:
    """Nombre y alias normalizados (sin tildes ni mayúsculas) -> ejercicio."""
    index: dict[str, CatalogExercise] = {}
    for exercise in load_catalog():
        for text in (exercise.name, *exercise.aliases):
            index.setdefault(normalize_name(text), exercise)
    return index


def find(name: str) -> CatalogExercise | None:
    """Busca por nombre o alias, sin importar mayúsculas ni tildes. None si no está."""
    return _by_name().get(normalize_name(name))


def how_to_text(exercise: CatalogExercise, ai_note: str | None) -> str | None:
    """El "Cómo hacerlo" que se guarda: el del catálogo, fijo para cada ejercicio.

    Lo que la IA escriba solo se conserva en el cardio, donde indica la intensidad de la semana.
    """
    if exercise.kind != ExerciseKind.CARDIO or not ai_note:
        return exercise.how_to or None
    return f"{exercise.how_to} {ai_note.strip()}".strip()


def canonicalize(routine: RoutineProposal) -> RoutineProposal:
    """Pone nombre y etiquetas del catálogo a cada ejercicio que está en él.

    La IA elige el ejercicio; las etiquetas (R13) las pone el catálogo, así el volumen por músculo
    y el equilibrio se calculan con datos revisados y no con lo que la IA escribió. No toca los
    ejercicios que no están en el catálogo ni los que traen otro `kind`: las series se miden según
    el tipo y eso lo rechaza `rules.py`.
    """
    days = []
    for day in routine.days:
        exercises = []
        for item in day.exercises:
            found = find(item.name)
            if found is not None and found.kind == item.kind:
                item = item.model_copy(
                    update={
                        "name": found.name,
                        "region": found.region,
                        "direction": found.direction,
                        "primary_muscle": found.primary_muscle,
                        "secondary_muscles": list(found.secondary_muscles),
                        "mechanic": found.mechanic,
                        "equipment": found.equipment,
                        "level": found.level,
                        "execution_notes": how_to_text(found, item.execution_notes),
                    }
                )
            exercises.append(item)
        days.append(day.model_copy(update={"exercises": exercises}))
    return routine.model_copy(update={"days": days})


def embedding_text(exercise: CatalogExercise) -> str:
    """El texto que se convierte en vector. El nivel no va: se filtra por código."""
    parts = [f"{exercise.name}."]
    if exercise.aliases:
        parts.append("También se le dice: " + ", ".join(exercise.aliases) + ".")
    parts.append(exercise.description)
    parts.append(f"Músculo principal: {MUSCLE_TEXT[exercise.primary_muscle]}.")
    if exercise.secondary_muscles:
        parts.append(
            "Músculos secundarios: "
            + ", ".join(MUSCLE_TEXT[m] for m in exercise.secondary_muscles)
            + "."
        )
    parts.append(
        f"Tipo: {KIND_TEXT[exercise.kind]}. Equipamiento: {EQUIPMENT_TEXT[exercise.equipment]}."
    )
    return " ".join(parts)


def text_hash(exercise: CatalogExercise) -> str:
    """Cambia si cambia el texto embebido: así se sabe qué ejercicios hay que reindexar."""
    return hashlib.sha256(embedding_text(exercise).encode("utf-8")).hexdigest()

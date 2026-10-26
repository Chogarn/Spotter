"""Arma el prompt de "Generar rutina".

Las reglas viven en `prompts/generar_rutina.md`, un archivo de texto que el usuario puede leer y
corregir. Acá solo se completa con los datos del perfil.
"""

import re
from collections.abc import Sequence
from functools import lru_cache
from pathlib import Path

from app.ai.catalog import MUSCLE_TEXT, CatalogExercise, load_catalog
from app.ai.splits import default_split, split_prompt
from app.enums import Goal, Level, Muscle, RoutineSplit
from app.models import Profile

PROMPT_FILE = Path(__file__).parent / "prompts" / "generar_rutina.md"

GOAL_TEXT = {
    "masa": "masa (ganar masa muscular)",
    "fuerza": "fuerza (ganar fuerza)",
    "perder_grasa": "perder_grasa (más cardio y menos fuerza)",
    "mantenerme_activo": "mantenerme_activo (mantener la condición física general: rutinas equilibradas y progresión suave)",
}


@lru_cache
def _template() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


def _as_data(text: str) -> str:
    """El texto del usuario no puede cerrar el bloque de datos ni inventar etiquetas."""
    return re.sub(r"[<>]", "", text).strip()


def profile_block(profile: Profile, goal: Goal, level: Level) -> str:
    # No se envía nombre ni email a Gemini: no hacen falta para armar la rutina.
    lines = [
        f"- Edad: {profile.current_age} años",
        f"- Peso: {profile.weight_kg:g} kg",
        f"- Altura: {profile.height_cm} cm",
    ]
    if profile.sex:
        lines.append(f"- Sexo: {profile.sex}")
    lines += [
        f"- Nivel: {level.value}",
        f"- Objetivo: {GOAL_TEXT[goal.value]}",
        "- Equipamiento: gimnasio (gimnasio completo)",
    ]
    limitations = _as_data(profile.limitations or "")
    lines.append(
        "- Lesiones o limitaciones: "
        + (f"<datos_usuario>{limitations}</datos_usuario>" if limitations else "ninguna indicada")
    )
    return "\n".join(lines)


FIRST_WEEK = "Es la primera semana de esta rutina: no hay semana anterior. Armala desde cero."


def days_text(days: int | None) -> str:
    """Decisión 52: los días los elige el usuario; Gemini no los decide."""
    if days is None:
        return "**No se recibió la cantidad de días elegida por la persona. No inventes una: indicá que falta ese dato.**"
    return (
        f"**La persona eligió entrenar {days} días por semana: armá exactamente {days} días.** "
        "No agregues ni quites días."
    )


def minutes_text(minutes: int | None) -> str:
    """Decisión 90: el tiempo no se elige; R18 es referencia y R34 calcula la duración estimada."""
    return (
        "La persona no elige minutos por sesión. La referencia de R18 es orientativa, no un límite ni "
        "una duración que haya que alcanzar. Estimá cada día con R34 e informá esa duración. Si el "
        "volumen no entra en la referencia, aplicá el orden de R35 indicado abajo."
    )


def volume_text(minutes: int | None) -> str:
    """R35 vigente: no sumar días; alargar y avisar; recortar solo como último recurso."""
    return (
        "Si el volumen que pide el objetivo no entra en la referencia R18, no sumes días: la persona ya los eligió. "
        "Primero alargá la sesión y avisalo en `notices`. Solo como último recurso recortá series de menor prioridad: "
        "accesorios y músculos chicos (bíceps, tríceps, gemelos, core, aductores, antebrazo y tibial). Avisá qué recortaste y que el volumen "
        "quedó por debajo de lo recomendado."
    )


def catalog_block(candidates: Sequence[CatalogExercise]) -> str:
    """La lista de ejercicios que se le ofrece a la IA, agrupada por músculo principal."""
    by_muscle: dict[Muscle, list[CatalogExercise]] = {}
    for exercise in candidates:
        by_muscle.setdefault(exercise.primary_muscle, []).append(exercise)
    lines: list[str] = []
    for muscle in Muscle:  # orden fijo: el del enum
        group = by_muscle.get(muscle)
        if not group:
            continue
        lines.append(f"## {MUSCLE_TEXT[muscle].capitalize()} (primary_muscle: {muscle.value})")
        for e in group:
            secondary = ",".join(m.value for m in e.secondary_muscles) or "-"
            lines.append(
                f"- {e.name} | kind={e.kind.value} region={e.region.value} "
                f"direction={e.direction.value} secondary_muscles=[{secondary}] "
                f"mechanic={e.mechanic.value} equipment={e.equipment.value} "
                f"level={e.level.value} | {e.description}"
            )
    return "\n".join(lines)


def build_prompt(
    profile: Profile,
    goal: Goal,
    level: Level,
    previous: str | None = None,
    days: int | None = None,
    candidates: Sequence[CatalogExercise] | None = None,
    minutes: int | None = None,
    split: RoutineSplit | None = None,
) -> str:
    """`candidates`: los ejercicios que recuperó `retrieve.py`. Sin ellos, va el catálogo entero."""
    text = _template().replace("{{PERFIL}}", profile_block(profile, goal, level))
    text = text.replace("{{DIAS}}", days_text(days))
    selected_split = split or (
        default_split(days, level, goal) if days is not None else RoutineSplit.FULL_BODY
    )
    text = text.replace("{{SPLIT}}", split_prompt(selected_split, days or 3))
    text = text.replace("{{TIEMPO}}", minutes_text(minutes))
    text = text.replace("{{VOLUMEN_NO_ENTRA}}", volume_text(minutes))
    text = text.replace(
        "{{CATALOGO}}", catalog_block(load_catalog() if candidates is None else candidates)
    )
    return text.replace("{{SEMANA_ANTERIOR}}", previous or FIRST_WEEK)

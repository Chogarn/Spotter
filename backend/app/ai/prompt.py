"""Arma el prompt de "Generar rutina".

Las reglas viven en `prompts/generar_rutina.md`, un archivo de texto que el usuario puede leer y
corregir. Acá solo se completa con los datos del perfil.
"""

import re
from collections.abc import Sequence
from functools import lru_cache
from pathlib import Path

from app.ai.catalog import MUSCLE_TEXT, CatalogExercise, load_catalog
from app.ai.rules import CHOSEN_TOLERANCE_MINUTES, MINUTES_PER_EXERCISE, exercise_count_hint
from app.enums import Goal, Level, Muscle
from app.models import Profile

PROMPT_FILE = Path(__file__).parent / "prompts" / "generar_rutina.md"

GOAL_TEXT = {
    "masa": "masa (ganar masa muscular)",
    "fuerza": "fuerza (ganar fuerza)",
    "perder_grasa": "perder_grasa (más cardio y menos fuerza)",
    "condicion_general": "condicion_general (mejorar la condición física general)",
    "mantenerme_activo": "mantenerme_activo (rutinas simples y progresión suave)",
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
    """Decisión 52: los días los elige el usuario. Sin el dato (pruebas viejas), decide la IA."""
    if days is None:
        return "**Vos decidís cuántos días** entrena la persona, entre **2 y 6**, según su objetivo y su nivel."
    return (
        f"**La persona eligió entrenar {days} días por semana: armá exactamente {days} días.** "
        "No agregues ni quites días."
    )


def minutes_text(minutes: int | None) -> str:
    """Decisión 82: el tiempo de la sesión lo elige el usuario y manda sobre el volumen semanal.
    Sin el dato (pruebas viejas), decide la IA con la referencia de R18."""
    if minutes is None:
        return (
            "**Vos decidís la duración** de cada sesión. La referencia según el perfil es una guía y no un "
            "tope: principiante, mantenerme_activo y condicion_general cerca de **60 minutos**; intermedio con "
            "masa o fuerza, **60 a 90**; perder_grasa, **60 minutos de fuerza, más el cardio**. Los días tienen "
            "que durar parecido entre sí."
        )
    return (
        f"**La persona eligió sesiones de {minutes} minutos: cada día tiene que durar {minutes} minutos, "
        f"con un margen de {CHOSEN_TOLERANCE_MINUTES} minutos por arriba y por abajo (entre "
        f"{minutes - CHOSEN_TOLERANCE_MINUTES} y {minutes + CHOSEN_TOLERANCE_MINUTES}), contando todo: "
        "series, descansos, cambios de ejercicio, cardio y movilidad. Todos los días tienen que quedar "
        "parecidos entre sí: ni uno corto ni uno largo.** "
        f"Para eso, un día de solo fuerza necesita unos {exercise_count_hint(minutes)} ejercicios de 3 series "
        f"(cada uno dura entre {MINUTES_PER_EXERCISE[0]} y {MINUTES_PER_EXERCISE[1]} minutos con el descanso y el "
        "cambio de máquina); si el día lleva movilidad o cardio, restá los ejercicios que ocupen ese tiempo. "
        "Ese tiempo manda sobre el volumen semanal: no pases del tiempo para que entren más series."
    )


def volume_text(minutes: int | None) -> str:
    """Qué hacer si el volumen semanal no entra: sin tiempo elegido, la regla de antes (alargar y
    avisar); con tiempo elegido, recortar (decisión 82)."""
    if minutes is None:
        return (
            "Si el volumen que pide el objetivo no entra en la duración de referencia, resolvelo **en este "
            "orden**:\n\n**No sumes días**: la cantidad la eligió la persona.\n\n1. Dejá la sesión **más larga "
            "que la referencia** y **avisalo en `notices`**.\n2. **Solo como último recurso**, recortá series de "
            "**menor prioridad** y avisalo en `notices`. Menor prioridad son los ejercicios accesorios "
            "(monoarticulares) y los músculos chicos (bíceps, tríceps, gemelos y core). Los multiarticulares "
            "principales no se recortan primero."
        )
    return (
        "Si el volumen que pide el objetivo no entra en el tiempo elegido, resolvelo **así**:\n\n**No sumes días "
        "y no alargues la sesión**: la cantidad de días y el tiempo los eligió la persona.\n\n1. Recortá series "
        "de **menor prioridad**: primero los ejercicios accesorios (monoarticulares) y los músculos chicos "
        "(bíceps, tríceps, gemelos y core). Los multiarticulares principales no se recortan primero.\n2. "
        "**Avisalo en `notices`**: decí qué recortaste y que el volumen semanal quedó por debajo de lo "
        "recomendado por el tiempo elegido."
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
) -> str:
    """`candidates`: los ejercicios que recuperó `retrieve.py`. Sin ellos, va el catálogo entero."""
    text = _template().replace("{{PERFIL}}", profile_block(profile, goal, level))
    text = text.replace("{{DIAS}}", days_text(days))
    text = text.replace("{{TIEMPO}}", minutes_text(minutes))
    text = text.replace("{{VOLUMEN_NO_ENTRA}}", volume_text(minutes))
    text = text.replace(
        "{{CATALOGO}}", catalog_block(load_catalog() if candidates is None else candidates)
    )
    return text.replace("{{SEMANA_ANTERIOR}}", previous or FIRST_WEEK)

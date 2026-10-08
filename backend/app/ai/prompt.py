"""Arma el prompt de "Generar rutina" (camino A).

Las reglas viven en `prompts/generar_rutina.md`, un archivo de texto que el usuario puede leer y
corregir. Acá solo se completa con los datos del perfil.
"""

import re
from functools import lru_cache
from pathlib import Path

from app.models import Profile

PROMPT_FILE = Path(__file__).parent / "prompts" / "generar_rutina.md"

GOAL_TEXT = {
    "masa": "masa (ganar masa muscular)",
    "fuerza": "fuerza (ganar fuerza)",
    "perder_grasa": "perder_grasa (más cardio y menos fuerza)",
    "condicion_general": "condicion_general (mejorar la condición física general)",
    "mantenerme_activo": "mantenerme_activo (rutinas simples y progresión suave)",
}
EQUIPMENT_TEXT = {
    "gimnasio": "gimnasio (gimnasio completo)",
    "mancuernas": "mancuernas (mancuernas, sin máquinas)",
    "casa": "casa (en casa, sin equipamiento de gimnasio)",
}


@lru_cache
def _template() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


def _as_data(text: str) -> str:
    """El texto del usuario no puede cerrar el bloque de datos ni inventar etiquetas."""
    return re.sub(r"[<>]", "", text).strip()


def profile_block(profile: Profile) -> str:
    # No se envía nombre ni email a Gemini: no hacen falta para armar la rutina.
    lines = [
        f"- Edad: {profile.age} años",
        f"- Peso: {profile.weight_kg:g} kg",
        f"- Altura: {profile.height_cm} cm",
    ]
    if profile.sex:
        lines.append(f"- Sexo: {profile.sex}")
    lines += [
        f"- Nivel: {profile.level.value}",
        f"- Objetivo: {GOAL_TEXT[profile.goal.value]}",
        f"- Equipamiento: {EQUIPMENT_TEXT[profile.equipment.value]}",
    ]
    limitations = _as_data(profile.limitations or "")
    lines.append(
        "- Lesiones o limitaciones: "
        + (f"<datos_usuario>{limitations}</datos_usuario>" if limitations else "ninguna indicada")
    )
    return "\n".join(lines)


def build_prompt(profile: Profile) -> str:
    return _template().replace("{{PERFIL}}", profile_block(profile))

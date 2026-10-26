"""Estructuras semanales disponibles, compatibles con las reglas de reparto de Spotter."""

from app.enums import Goal, Level, RoutineSplit


def compatible_splits(days: int, level: Level, goal: Goal) -> tuple[RoutineSplit, ...]:
    """Devuelve solo splits que pueden respetar R12 y el reparto de la decisión 90."""
    if level == Level.PRINCIPIANTE:
        return (RoutineSplit.FULL_BODY,) if days in (2, 3) else ()

    options = [RoutineSplit.FULL_BODY]
    # Torso/pierna en 3 días dejaría las piernas en un solo día, contra la decisión 90.
    # En 2 días de masa, tampoco entra el mínimo semanal de R3 bajo el tope de 9 series por grupo/día.
    if days in (2, 4, 5, 6) and not (days == 2 and goal == Goal.MASA):
        options.append(RoutineSplit.UPPER_LOWER)
    # El PPL clásico de 3 días concentra cada grupo grande en un día. Solo PPL x2 (6 días)
    # satisface la frecuencia mínima de grupos grandes que fijó la decisión 90.
    if days == 6:
        options.append(RoutineSplit.PPL)
    return tuple(options)


def default_split(days: int, level: Level, goal: Goal) -> RoutineSplit:
    """Compatibilidad para clientes viejos y rutinas que todavía no guardan un split."""
    choices = compatible_splits(days, level, goal)
    preferred = {
        2: RoutineSplit.FULL_BODY,
        3: RoutineSplit.FULL_BODY,
        4: RoutineSplit.UPPER_LOWER,
        5: RoutineSplit.UPPER_LOWER,
        6: RoutineSplit.PPL,
    }.get(days, RoutineSplit.FULL_BODY)
    return preferred if preferred in choices else choices[0]


def split_prompt(split: RoutineSplit, days: int) -> str:
    if split == RoutineSplit.FULL_BODY:
        return (
            "**Estructura elegida: cuerpo completo.** Cada día de fuerza trabaja directamente los seis "
            "grupos grandes (pecho, espalda, hombros, cuádriceps, isquios y glúteos). Repartí sus series "
            "parejo y respetá los topes de la sección de reparto."
        )
    if split == RoutineSplit.UPPER_LOWER:
        pattern = ["torso", "pierna"] * ((days + 1) // 2)
        schedule = " · ".join(f"Día {i + 1}: {focus}" for i, focus in enumerate(pattern[:days]))
        return (
            "**Estructura elegida: torso y pierna.** Alterná los focos en este orden: "
            f"{schedule}. En torso, los grupos grandes permitidos son pecho, espalda y hombros; en pierna, "
            "cuádriceps, isquios y glúteos. No pongas un grupo grande como músculo principal en el tipo "
            "opuesto. Bíceps, tríceps, gemelos, core, aductores, antebrazo y tibial siguen siendo complemento."
        )
    pattern = ["empuje", "tirón", "piernas"] * 2
    schedule = " · ".join(f"Día {i + 1}: {focus}" for i, focus in enumerate(pattern[:days]))
    return (
        "**Estructura elegida: empuje, tirón y piernas (PPL, dos vueltas).** Seguí este orden: "
        f"{schedule}. Empuje trabaja pecho y hombros; tirón, espalda; piernas, cuádriceps, isquios y "
        "glúteos. Los músculos chicos siguen siendo complemento."
    )

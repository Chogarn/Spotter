"""Estructuras semanales disponibles, compatibles con las reglas de reparto de Spotter."""

from app.enums import Goal, Level, RoutineSplit


def compatible_splits(days: int, level: Level, goal: Goal) -> tuple[RoutineSplit, ...]:
    """Devuelve solo splits que pueden respetar el reparto de la decisión 90. Desde la decisión
    126 se entrena de 3 a 6 días, con cualquier nivel."""
    if days not in (3, 4, 5, 6):
        return ()
    if level == Level.PRINCIPIANTE:
        return (RoutineSplit.FULL_BODY,)

    options = [RoutineSplit.FULL_BODY]
    # Torso/pierna en 3 días dejaría las piernas en un solo día, contra la decisión 90.
    if days in (4, 5, 6):
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
        3: RoutineSplit.FULL_BODY,
        4: RoutineSplit.UPPER_LOWER,
        5: RoutineSplit.UPPER_LOWER,
        6: RoutineSplit.PPL,
    }.get(days, RoutineSplit.FULL_BODY)
    if not choices:
        return RoutineSplit.FULL_BODY
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
            "cuádriceps, isquios y glúteos. Cada día de torso trabaja directamente los tres grupos: al menos "
            "un ejercicio con pecho, uno con espalda y uno con hombros como músculo principal. Cada día de "
            "pierna, los tres de pierna (cuádriceps, isquios y glúteos). No pongas un grupo grande como "
            "músculo principal en el tipo opuesto. Bíceps, tríceps, gemelos, core, aductores, antebrazo y tibial siguen siendo complemento."
        )
    pattern = ["empuje", "tirón", "piernas"] * 2
    schedule = " · ".join(f"Día {i + 1}: {focus}" for i, focus in enumerate(pattern[:days]))
    return (
        "**Estructura elegida: empuje, tirón y piernas (PPL, dos vueltas).** Seguí este orden: "
        f"{schedule}. Empuje trabaja pecho y hombros; tirón, espalda (y puede sumar el deltoides "
        "posterior con ejercicios de hombros de tirón, como el face pull o los pájaros; nunca un press "
        "ni una elevación de hombros); piernas, cuádriceps, isquios y glúteos. Los músculos chicos "
        "siguen siendo complemento."
    )

"""Reglas de entrenamiento que comprueba el CÓDIGO sobre lo que devolvió Gemini.

Fuente de cada regla: docs/criterios-entrenamiento.md (R1 a R35, aprobadas por el usuario).
Dos niveles:
- error: la rutina se rechaza (R1, R11, R12, R17). Son las que el proyecto fijó como "el código valida".
- aviso: se muestra al usuario pero no se rechaza (volumen por objetivo, R4, R18, R34).

R3 (10 a 20 series semanales para masa) aplica solo a los 6 grupos grandes (decisión del usuario);
bíceps, tríceps, gemelos y core trabajan por las series indirectas (R5). Solo avisa.
"""

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field

from app.ai.catalog import MUSCLE_TEXT, find
from app.ai.plan_writer import normalize_name
from app.ai.routine import DayProposal, RoutineProposal
from app.enums import ExerciseKind, Goal, Level, Muscle

# Los isométricos (plancha) cuentan como fuerza: suman días de fuerza y series por músculo.
STRENGTH_KINDS = (ExerciseKind.STRENGTH, ExerciseKind.ISOMETRIC)

# Los 6 grupos grandes (R1, R20, R24, R25).
BIG_GROUPS = (
    Muscle.CHEST,
    Muscle.BACK,
    Muscle.SHOULDERS,
    Muscle.QUADRICEPS,
    Muscle.HAMSTRINGS,
    Muscle.GLUTES,
)

# R34: estimación de la duración de una sesión.
SECONDS_PER_REP = 3
TRANSITION_MINUTES = 3.5  # cambio entre ejercicios, con espera de máquina (decisión 82: 3 a 4 min)
MOBILITY_MINUTES = 7.5  # 5 a 10 minutos en los días que la tienen
# Elección de diseño (R18 no define "se aleja mucho"): margen de aviso, en minutos.
DURATION_TOLERANCE_MINUTES = 15
# Decisión 89: con el tiempo que eligió la persona, cada día tiene que quedar a menos de 10 minutos,
# por arriba y por abajo. Si no, se le pide a la IA que lo rehaga (y si no llega, se avisa).
CHOSEN_TOLERANCE_MINUTES = 10
# Decisión 90: el reparto de las series entre los días (valores elegidos por el usuario el
# 2026-10-23; no salen de las fuentes: son reglas de diseño, no están entre R1 y R36). Se cuentan
# solo las series directas (con el músculo como principal).
COMPLEMENT = (Muscle.BICEPS, Muscle.TRICEPS, Muscle.CALVES, Muscle.CORE)
MIN_DAYS_PER_BIG_GROUP = 2  # con 3 o más días de fuerza
MAX_SPREAD_PER_MUSCLE = 3  # entre los días en que se trabaja un mismo músculo
MAX_SETS_PER_MUSCLE_DAY = 9  # 3 ejercicios de 3 series
MAX_SPREAD_BETWEEN_DAYS = 4  # series de grupos grandes del día con más y del día con menos
MAX_COMPLEMENT_SETS_PER_DAY = 6
# Cuánto dura un ejercicio de fuerza típico (3 series de unas 10 repeticiones con 90 a 120 s de
# descanso y el cambio de máquina), para decirle a la IA cuántos necesita.
MINUTES_PER_EXERCISE = (8, 9)


@dataclass(frozen=True)
class Issue:
    rule: str
    message: str


@dataclass
class ValidationResult:
    errors: list[Issue] = field(default_factory=list)
    warnings: list[Issue] = field(default_factory=list)
    # Lo que se le pide arreglar a la IA mientras queden intentos, dicho para ella (los días que se
    # desvían del tiempo elegido, decisión 89, y el reparto de las series, decisión 90). No rechaza
    # la rutina: en el último intento se acepta con los avisos.
    soft_issues: list[Issue] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def strength_days(routine: RoutineProposal) -> int:
    return sum(
        any(e.kind in STRENGTH_KINDS for e in day.exercises) for day in routine.days
    )


def cardio_minutes(routine: RoutineProposal) -> int:
    return sum(
        s.duration_minutes or 0
        for day in routine.days
        for e in day.exercises
        if e.kind == ExerciseKind.CARDIO
        for s in e.sets
    )


def weekly_sets_by_muscle(routine: RoutineProposal) -> dict[Muscle, float]:
    """Series por semana de cada músculo: directas = 1, indirectas = 0,5 (R5)."""
    totals: dict[Muscle, float] = defaultdict(float)
    for day in routine.days:
        for e in day.exercises:
            if e.kind not in STRENGTH_KINDS:
                continue
            totals[e.primary_muscle] += len(e.sets)
            for muscle in set(e.secondary_muscles) - {e.primary_muscle}:
                totals[muscle] += 0.5 * len(e.sets)
    return totals


def direct_sets_by_day(routine: RoutineProposal) -> list[dict[Muscle, int]]:
    """Las series directas (músculo principal) de cada día de fuerza, por músculo. Los días que
    no tienen fuerza (solo cardio) no se cuentan."""
    days: list[dict[Muscle, int]] = []
    for day in routine.days:
        counts: dict[Muscle, int] = defaultdict(int)
        has_strength = False
        for e in day.exercises:
            if e.kind in STRENGTH_KINDS:
                has_strength = True
                counts[e.primary_muscle] += len(e.sets)
        if has_strength:
            days.append(counts)
    return days


def _day_label(routine: RoutineProposal) -> list[int]:
    """El número de día (Día 1, 2...) de cada día de fuerza, en el mismo orden que `direct_sets_by_day`."""
    return [
        number
        for number, day in enumerate(routine.days, start=1)
        if any(e.kind in STRENGTH_KINDS for e in day.exercises)
    ]


def distribution_issues(routine: RoutineProposal) -> list[str]:
    """Decisión 90: las series de cada grupo grande tienen que repartirse parejo entre los días, y los
    músculos chicos no completan un día. Devuelve los problemas, dichos para la IA y para el usuario."""
    per_day = direct_sets_by_day(routine)
    labels = _day_label(routine)
    issues: list[str] = []

    for muscle in BIG_GROUPS:
        name = MUSCLE_TEXT[muscle].capitalize()
        by_day = [(labels[i], d.get(muscle, 0)) for i, d in enumerate(per_day)]
        worked = [(n, s) for n, s in by_day if s > 0]
        if not worked:
            continue  # que falte el grupo ya lo avisa R1
        over = [(n, s) for n, s in worked if s > MAX_SETS_PER_MUSCLE_DAY]
        if over:
            n, s = max(over, key=lambda x: x[1])
            issues.append(
                f"{name} tiene {s} series el Día {n}: el máximo es {MAX_SETS_PER_MUSCLE_DAY} por día "
                "(3 ejercicios de 3 series). Pasá series a otro día."
            )
        if len(per_day) >= 3 and len(worked) < MIN_DAYS_PER_BIG_GROUP:
            issues.append(
                f"{name} se trabaja un solo día (Día {worked[0][0]}): con {len(per_day)} días de fuerza va "
                f"en al menos {MIN_DAYS_PER_BIG_GROUP} días, con las series repartidas."
            )
        elif len(worked) >= 2:
            top = max(worked, key=lambda x: x[1])
            low = min(worked, key=lambda x: x[1])
            if top[1] - low[1] > MAX_SPREAD_PER_MUSCLE:
                issues.append(
                    f"{name} tiene {top[1]} series el Día {top[0]} y {low[1]} el Día {low[0]}: repartilas "
                    f"parejas entre los días en que lo trabajás (diferencia máxima {MAX_SPREAD_PER_MUSCLE})."
                )

    big_per_day = [(labels[i], sum(d.get(m, 0) for m in BIG_GROUPS)) for i, d in enumerate(per_day)]
    if len(big_per_day) >= 2:
        top = max(big_per_day, key=lambda x: x[1])
        low = min(big_per_day, key=lambda x: x[1])
        if top[1] - low[1] > MAX_SPREAD_BETWEEN_DAYS:
            issues.append(
                f"El Día {top[0]} tiene {top[1]} series de grupos grandes y el Día {low[0]} tiene {low[1]}: "
                f"que todos los días tengan una cantidad parecida (diferencia máxima {MAX_SPREAD_BETWEEN_DAYS}). "
                "No llenes los primeros días y dejes flacos los últimos."
            )

    for i, d in enumerate(per_day):
        complement = sum(d.get(m, 0) for m in COMPLEMENT)
        if complement > MAX_COMPLEMENT_SETS_PER_DAY:
            issues.append(
                f"El Día {labels[i]} tiene {complement} series de bíceps, tríceps, gemelos y abdominales: el "
                f"máximo es {MAX_COMPLEMENT_SETS_PER_DAY}. Son complemento: no se usan para completar un día."
            )
    return issues


def estimate_day_minutes(day: DayProposal) -> float:
    """R34: series + descansos + cambios de ejercicio + cardio + movilidad.

    El tiempo de una serie es repeticiones x 3 s, o los segundos del isométrico.
    """
    seconds = 0.0
    minutes = 0.0
    for e in day.exercises:
        if e.kind == ExerciseKind.CARDIO:
            minutes += sum(s.duration_minutes or 0 for s in e.sets)
        else:
            seconds += sum(
                s.duration_seconds if s.duration_seconds is not None else (s.reps or 0) * SECONDS_PER_REP
                for s in e.sets
            )
            seconds += (len(e.sets) - 1) * (e.rest_seconds or 0)
    minutes += seconds / 60
    minutes += (len(day.exercises) - 1) * TRANSITION_MINUTES
    if day.mobility_notes:
        minutes += MOBILITY_MINUTES
    return minutes


def reference_minutes(goal: Goal, level: Level) -> tuple[int, int] | None:
    """R18: duración de referencia (guía, no tope). None si R18 no define una."""
    if goal in (Goal.PERDER_GRASA, Goal.MANTENERME_ACTIVO, Goal.CONDICION_GENERAL):
        return (60, 60)
    if level == Level.PRINCIPIANTE:
        return (60, 60)
    if level == Level.INTERMEDIO:  # masa o fuerza
        return (60, 90)
    return None  # avanzado con masa o fuerza: R18 no lo define


def allowed_minutes(level: Level) -> tuple[int, ...]:
    """Los minutos por sesión que puede elegir el usuario (decisión 82), de 20 en 20 desde 40:
    hasta 60 para un principiante (R18) y hasta 80 para el resto."""
    # Por ahora el tope es 80 para todos (decisión 88) y 60 para los principiantes (R18).
    top = 60 if level == Level.PRINCIPIANTE else 80
    return tuple(range(40, top + 1, 20))


def exercise_count_hint(minutes: int) -> int:
    """Cuántos ejercicios de fuerza (de 3 series) hacen falta para un día de `minutes` minutos
    sin movilidad ni cardio (decisión 89). Es una guía para la IA, no una regla."""
    return max(1, round(minutes / (sum(MINUTES_PER_EXERCISE) / 2)))


def allowed_days(level: Level) -> tuple[int, ...]:
    """Los días por semana que puede elegir el usuario (decisión 52): R12 para principiantes
    (2 o 3) y R11 para el resto (2 a 6)."""
    return (2, 3) if level == Level.PRINCIPIANTE else (2, 3, 4, 5, 6)


def catalog_problems(routine: RoutineProposal, extra_names: Iterable[str] = ()) -> list[str]:
    """Ejercicios que no salen del catálogo (decisión 58) o con otro `kind` que el del catálogo.

    `extra_names`: ejercicios de la semana anterior que se pueden mantener aunque no estén en el
    catálogo (rutinas viejas, de antes del catálogo).
    """
    extra = {normalize_name(n) for n in extra_names}
    unknown: list[str] = []
    problems: list[str] = []
    for day in routine.days:
        for e in day.exercises:
            found = find(e.name)
            if found is None:
                if normalize_name(e.name) not in extra and e.name not in unknown:
                    unknown.append(e.name)
            elif found.kind != e.kind:
                problems.append(
                    f'"{e.name}" figura como {found.kind.value} en la lista de ejercicios '
                    f"disponibles y la rutina lo trae como {e.kind.value}: usá las etiquetas de la lista."
                )
    if unknown:
        listado = ", ".join(f'"{n}"' for n in unknown[:5]) + (
            f" y {len(unknown) - 5} más" if len(unknown) > 5 else ""
        )
        problems.insert(
            0,
            f"Ejercicios que no están en la lista de ejercicios disponibles: {listado}. "
            "Reemplazalos por ejercicios de la lista, con su nombre exacto.",
        )
    return problems


def validate_routine(
    routine: RoutineProposal,
    goal: Goal,
    level: Level,
    days: int | None = None,
    catalog_extra_names: Iterable[str] | None = None,
    minutes: int | None = None,
) -> ValidationResult:
    """`catalog_extra_names`: si es None no se exige el catálogo (llamadas directas, tests de
    reglas); si es una lista (aunque esté vacía), todo ejercicio tiene que salir del catálogo o
    estar en esa lista (decisión 58)."""
    result = ValidationResult()
    error = lambda rule, msg: result.errors.append(Issue(rule, msg))  # noqa: E731
    warn = lambda rule, msg: result.warnings.append(Issue(rule, msg))  # noqa: E731

    # --- Errores: la rutina se rechaza ---
    n_days = len(routine.days)
    if not 2 <= n_days <= 6:
        error("R11", f"La semana tiene {n_days} días y debe tener entre 2 y 6.")
    if level == Level.PRINCIPIANTE and n_days not in (2, 3):
        error("R12", f"Un principiante entrena 2 o 3 días y la rutina trae {n_days}.")
    # Decisión 52: los días los elige el usuario y la rutina tiene que traer exactamente esos.
    if days is not None and n_days != days:
        error("Días", f"La persona eligió {days} días por semana y la rutina trae {n_days}.")

    if catalog_extra_names is not None:
        for message in catalog_problems(routine, catalog_extra_names):
            error("Catálogo", message)

    n_strength = strength_days(routine)
    if n_strength < 2:
        error("R1", f"Hace falta fuerza al menos 2 días por semana y la rutina trae {n_strength}.")
    sets_by_muscle = weekly_sets_by_muscle(routine)
    missing = [m.value for m in BIG_GROUPS if sets_by_muscle.get(m, 0) < 1]
    if missing:
        error("R1", "Faltan grupos musculares grandes en la semana: " + ", ".join(missing) + ".")

    total_cardio = cardio_minutes(routine)
    if goal == Goal.PERDER_GRASA and not 150 <= total_cardio <= 300:
        error("R17", f"El cardio semanal es de {total_cardio} min y debe estar entre 150 y 300.")

    # --- Avisos: se muestran, no se rechaza ---
    _volume_warnings(routine, goal, n_strength, total_cardio, sets_by_muscle, warn)
    for message in distribution_issues(routine):  # decisión 90
        warn("Reparto", message)
        result.soft_issues.append(Issue("Reparto", message))

    # Decisión 82: si la persona eligió el tiempo, ese es la referencia (y manda sobre R18).
    reference = (minutes, minutes) if minutes is not None else reference_minutes(goal, level)
    if reference:
        low, high = reference
        minutes_chosen = minutes is not None
        for number, day in enumerate(routine.days, start=1):
            if all(e.kind == ExerciseKind.CARDIO for e in day.exercises):
                continue  # un día solo de cardio no tiene referencia de duración
            minutes_day = estimate_day_minutes(day)
            if goal == Goal.PERDER_GRASA:  # R18: 60 min de fuerza, más el cardio
                minutes_day -= sum(
                    s.duration_minutes or 0
                    for e in day.exercises
                    if e.kind == ExerciseKind.CARDIO
                    for s in e.sets
                )
            tolerance = CHOSEN_TOLERANCE_MINUTES if minutes_chosen else DURATION_TOLERANCE_MINUTES
            if minutes_day > high + tolerance or minutes_day < low - tolerance:
                warn(
                    "R34",
                    f"El Día {number} dura unos {round(minutes_day)} min y "
                    f"{'elegiste' if minutes_chosen else 'la referencia es'} "
                    f"{low if low == high else f'{low} a {high}'}.",
                )
                if minutes_chosen:
                    action = "agregá ejercicios" if minutes_day < minutes else "sacá ejercicios o series"
                    result.soft_issues.append(
                        Issue(
                            "R34",
                            f"El Día {number} dura unos {round(minutes_day)} min y la persona eligió "
                            f"{minutes}: {action} hasta llegar a unos {minutes} min (entre "
                            f"{minutes - tolerance} y {minutes + tolerance}).",
                        )
                    )
    return result


def _volume_warnings(routine, goal, n_strength, total_cardio, sets_by_muscle, warn) -> None:
    """Volumen por objetivo (R3, R4, R20, R24, R25). Solo avisan."""
    strength_sets = [
        len(e.sets) for d in routine.days for e in d.exercises if e.kind in STRENGTH_KINDS
    ]

    def per_exercise(rule: str, low: int, high: int) -> None:
        if any(not low <= n <= high for n in strength_sets):
            rango = f"{low}" if low == high else f"entre {low} y {high}"
            warn(rule, f"Cada ejercicio de fuerza debería tener {rango} series.")

    def per_group(rule: str, low: float, high: float) -> None:
        for muscle in BIG_GROUPS:
            sets = sets_by_muscle.get(muscle, 0)
            if not low <= sets <= high:
                warn(rule, f"{muscle.value}: {sets:g} series por semana y debería haber de {low:g} a {high:g}.")

    if goal == Goal.MASA:
        per_group("R3", 10, 20)
    elif goal == Goal.FUERZA:
        per_exercise("R4", 2, 3)
    elif goal == Goal.PERDER_GRASA:
        per_group("R20", 2, 4)
    elif goal == Goal.MANTENERME_ACTIVO:
        if n_strength != 2:
            warn("R24", f"Son 2 sesiones de fuerza y la rutina trae {n_strength}.")
        per_exercise("R24", 2, 2)  # el ACSM 2026 pide al menos 2 series por ejercicio
        per_group("R24", 4, 6)
        if total_cardio < 150:
            warn("R24", f"El aeróbico debería ser de 150 min por semana y trae {total_cardio}.")
    elif goal == Goal.CONDICION_GENERAL:
        if not 2 <= n_strength <= 3:
            warn("R25", f"Son 2 o 3 sesiones de fuerza y la rutina trae {n_strength}.")
        per_exercise("R25", 2, 3)
        per_group("R25", 6, 10)
        if not 150 <= total_cardio <= 300:
            warn("R25", f"El aeróbico debería ser de 150 a 300 min por semana y trae {total_cardio}.")

"""Reglas de entrenamiento que comprueba el CÓDIGO sobre lo que devolvió Gemini.

Fuente de cada regla: docs/criterios-entrenamiento.md (R1 a R35, aprobadas por el usuario).
Dos niveles:
- error: la rutina se rechaza (R1, R11, R12, R17). Son las que el proyecto fijó como "el código valida".
- aviso: se muestra al usuario pero no se rechaza (volumen por objetivo, R4, R18, R34).

R3 (10 a 20 series semanales para masa) aplica solo a los 6 grupos grandes (decisión del usuario);
bíceps, tríceps, gemelos y core trabajan por las series indirectas (R5). Solo avisa.
"""

from collections import defaultdict
from dataclasses import dataclass, field

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
TRANSITION_MINUTES = 1.5  # cambio entre ejercicios: 1 a 2 minutos
MOBILITY_MINUTES = 7.5  # 5 a 10 minutos en los días que la tienen
# Elección de diseño (R18 no define "se aleja mucho"): margen de aviso, en minutos.
DURATION_TOLERANCE_MINUTES = 15


@dataclass(frozen=True)
class Issue:
    rule: str
    message: str


@dataclass
class ValidationResult:
    errors: list[Issue] = field(default_factory=list)
    warnings: list[Issue] = field(default_factory=list)

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


def validate_routine(routine: RoutineProposal, goal: Goal, level: Level) -> ValidationResult:
    result = ValidationResult()
    error = lambda rule, msg: result.errors.append(Issue(rule, msg))  # noqa: E731
    warn = lambda rule, msg: result.warnings.append(Issue(rule, msg))  # noqa: E731

    # --- Errores: la rutina se rechaza ---
    n_days = len(routine.days)
    if not 2 <= n_days <= 6:
        error("R11", f"La semana tiene {n_days} días y debe tener entre 2 y 6.")
    if level == Level.PRINCIPIANTE and n_days not in (2, 3):
        error("R12", f"Un principiante entrena 2 o 3 días y la rutina trae {n_days}.")

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

    reference = reference_minutes(goal, level)
    if reference:
        low, high = reference
        for number, day in enumerate(routine.days, start=1):
            if all(e.kind == ExerciseKind.CARDIO for e in day.exercises):
                continue  # un día solo de cardio no tiene referencia de duración
            minutes = estimate_day_minutes(day)
            if goal == Goal.PERDER_GRASA:  # R18: 60 min de fuerza, más el cardio
                minutes -= sum(
                    s.duration_minutes or 0
                    for e in day.exercises
                    if e.kind == ExerciseKind.CARDIO
                    for s in e.sets
                )
            if minutes > high + DURATION_TOLERANCE_MINUTES or minutes < low - DURATION_TOLERANCE_MINUTES:
                warn(
                    "R34",
                    f"El Día {number} dura unos {round(minutes)} min y la referencia es "
                    f"{low if low == high else f'{low} a {high}'}.",
                )
    return result


def _volume_warnings(routine, goal, n_strength, total_cardio, sets_by_muscle, warn) -> None:
    """Volumen por objetivo (R3, R4, R20, R24, R25). Solo avisan."""
    strength_sets = [
        len(e.sets) for d in routine.days for e in d.exercises if e.kind in STRENGTH_KINDS
    ]

    def per_exercise(rule: str, low: int, high: int) -> None:
        if any(not low <= n <= high for n in strength_sets):
            warn(rule, f"Cada ejercicio de fuerza debería tener entre {low} y {high} series.")

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
        per_exercise("R24", 1, 2)
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

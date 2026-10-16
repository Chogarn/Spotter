"""Esquemas de Pydantic: lo que entra y sale de la API."""

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.ai.routine import RoutineProposal
from app.enums import Goal, Level, LoadFeel, PainLevel
from app.models import age_on


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_RE.match(email) or len(email) > 255:
        raise ValueError("El email no es válido")
    return email


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)

    _email = field_validator("email")(_clean_email)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío")
        return value


class LoginIn(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)

    _email = field_validator("email")(_clean_email)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    # La edad sale de la fecha de nacimiento. Se acepta solo `age` para guardar cambios de un
    # perfil viejo que todavía no tiene fecha (el nombre, las limitaciones).
    birth_date: date | None = None
    age: int | None = Field(default=None, ge=14, le=100)
    weight_kg: Decimal = Field(ge=30, le=300, max_digits=5, decimal_places=2)
    height_cm: int = Field(ge=100, le=250)
    sex: Literal["masculino", "femenino", "otro"] | None = None
    limitations: str | None = Field(default=None, max_length=1000)
    # Sin el tilde del aviso legal no se guarda nada.
    accept_legal_notice: Literal[True]

    @model_validator(mode="after")
    def age_from_birth_date(self):
        if self.birth_date is None:
            if self.age is None:
                raise ValueError("Falta la fecha de nacimiento")
            return self
        age = age_on(self.birth_date, date.today())
        if age < 14:
            raise ValueError("Tenés que tener al menos 14 años")
        if age > 100:
            raise ValueError("La fecha de nacimiento no es válida")
        self.age = age
        return self


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    age: int
    birth_date: date | None = None
    weight_kg: Decimal
    height_cm: int
    sex: str | None
    limitations: str | None
    legal_notice_accepted: bool


class GenerateIn(BaseModel):
    """Continuar una rutina (`routine_id`) o empezar una nueva (`goal` y `level`)."""

    routine_id: int | None = None
    goal: Goal | None = None
    level: Level | None = None
    # Cuántos días por semana entrena (decisión 52): obligatorio, también al continuar.
    # Que entre en lo que permite el nivel (2 o 3 para principiantes) lo comprueba el endpoint.
    days: int = Field(ge=2, le=6)

    @model_validator(mode="after")
    def one_way_or_the_other(self):
        has_choice = self.goal is not None or self.level is not None
        if self.routine_id is not None:
            if has_choice:
                raise ValueError("Con una rutina existente no se elige objetivo ni nivel")
        elif self.goal is None or self.level is None:
            raise ValueError("Falta el objetivo y el nivel, o la rutina a continuar")
        return self


class WarningOut(BaseModel):
    rule: str
    message: str


class AlternativeOut(BaseModel):
    """Un ejercicio del catálogo que puede reemplazar a otro de la propuesta (decisión 65)."""

    id: str
    name: str
    description: str
    equipment: str
    level: str
    mechanic: str


class SwapIn(BaseModel):
    """Cambiar `from_name` por el ejercicio del catálogo `to_id`, en todos los días."""

    from_name: str = Field(min_length=1, max_length=150)
    to_id: str = Field(min_length=1, max_length=64)


class SetShapeOut(BaseModel):
    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    target_weight_kg: float | None


class ExerciseChangeOut(BaseModel):
    """Qué cambió en un ejercicio respecto de la semana anterior (#49)."""

    name: str
    day_index: int
    status: str  # "nuevo", "cambia" o "igual"
    sets_before: list[SetShapeOut]
    sets_after: list[SetShapeOut]
    load: str | None  # "sube", "baja" o vacío
    sets_changed: bool
    rest_before: int | None
    rest_after: int | None
    rest_changed: bool


class ProposalChangesOut(BaseModel):
    """Antes y después de una propuesta de semana nueva. `has_base` falso en la primera rutina."""

    has_base: bool
    base_week_number: int | None = None
    exercises: list[ExerciseChangeOut] = []
    removed: list[str] = []


class ProposalOut(BaseModel):
    """Una propuesta de la IA lista para mostrar: la rutina, sus avisos y su estado."""

    id: int
    kind: str
    status: str
    created_at: datetime | None
    routine: RoutineProposal
    # Duración estimada de cada día en minutos (R34), en el mismo orden que `routine.days`.
    day_minutes: list[int]
    warnings: list[WarningOut]
    # Solo al aceptar: qué quedó creado (la semana, su número y la rutina).
    week_id: int | None = None
    week_number: int | None = None
    routine_id: int | None = None
    routine_name: str | None = None


class WeekDayOut(BaseModel):
    day_index: int
    title: str


class WeekOut(BaseModel):
    id: int
    week_start: date
    days: list[WeekDayOut]


class RoutineSummaryOut(BaseModel):
    """Una rutina en la lista "Mis rutinas"."""

    id: int
    name: str
    goal: Goal
    level: Level
    week_count: int
    has_active_week: bool
    days_per_week: int | None
    # Estado de cada día de la semana más nueva ("completed", "partial" o "pending"), en orden;
    # la lista "Tus rutinas" lo muestra como discos. Vacía si la rutina no tiene semanas.
    last_week_day_states: list[str] = []


class RoutineRenameIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class WeekSummaryOut(BaseModel):
    """Una semana en la lista de una rutina."""

    id: int
    # Orden de activación dentro de la rutina: la primera semana es la 1. Se calcula, no se guarda.
    number: int
    status: str
    week_start: date
    closed_at: datetime | None
    day_count: int
    # Estado de cada día ("completed", "partial" o "pending"), en orden: se muestra como discos.
    day_states: list[str]


class WeekDayItemOut(BaseModel):
    day_index: int
    title: str
    exercise_count: int
    minutes: int  # duración estimada (R34)
    # "pending" (nada registrado), "partial" (algo registrado) o "completed" (Día completado).
    state: str


class RoutineDetailOut(BaseModel):
    id: int
    name: str
    goal: Goal
    level: Level
    days_per_week: int | None
    weeks: list[WeekSummaryOut]  # de la más nueva a la más vieja


class CloseWeekIn(BaseModel):
    """Lo que el usuario puede escribir al cerrar la semana (opcional)."""

    note: str | None = Field(default=None, max_length=1000)


class RealSetOut(BaseModel):
    """Lo que el usuario realmente hizo en una serie."""

    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    weight_kg: float | None


class PlannedValuesOut(BaseModel):
    """Lo que tocaba en una serie."""

    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    weight_kg: float | None


class ResultSetOut(BaseModel):
    """Una serie del ejercicio: lo que tocaba y lo que se hizo (nulo si no se registró)."""

    planned: PlannedValuesOut
    real: RealSetOut | None


class ExerciseResultOut(BaseModel):
    """Cómo le fue en un ejercicio de la semana (la misma señal que recibe la IA), con las series
    para mostrar lo que tocaba frente a lo que se hizo."""

    name: str
    kind: str
    signal: str  # "superó", "cumplió", "no llegó" o "sin registrar"
    sets: list[ResultSetOut] = []
    # Lo que la persona marcó al terminarlo (decisión 74); si se repite en la semana, lo más fuerte.
    load_feel: str | None = None
    pain: str | None = None


class RoutineExerciseOut(BaseModel):
    """Un ejercicio que aparece en alguna semana de la rutina (para elegir qué graficar)."""

    id: int
    name: str
    kind: str


class ExerciseWeekPointOut(BaseModel):
    """Lo mejor realizado en un ejercicio en una semana. `value` vacío si no se registró nada."""

    week_id: int
    number: int
    status: str
    value: float | None


class ExerciseOptionOut(BaseModel):
    """Un ejercicio que aparece en alguna semana de la persona, en cualquier rutina."""

    id: int
    name: str
    kind: str
    weeks_count: int


class TimelinePointOut(BaseModel):
    """Lo mejor realizado en un ejercicio en una semana, con la rutina a la que pertenece."""

    week_id: int
    number: int  # número de la semana dentro de su rutina
    status: str
    week_start: date | None
    routine_id: int
    routine_name: str
    goal: str
    value: float | None


class ExerciseTimelineOut(BaseModel):
    """La evolución de un ejercicio por fecha, acumulando todas las rutinas."""

    exercise_id: int
    name: str
    kind: str
    unit: str  # "kg", "reps", "s" o "min" (cada tipo con su unidad: no se mezclan)
    points: list[TimelinePointOut]  # de la semana más vieja a la más nueva
    record: float | None
    first_value: float | None
    last_value: float | None
    weeks_with_data: int
    routines_count: int


class ExerciseHistoryOut(BaseModel):
    """La evolución de un ejercicio a lo largo de las semanas de una rutina (#62)."""

    exercise_id: int
    name: str
    kind: str
    # Qué se mide: "kg" (mayor peso), "reps" (sin peso: más repeticiones), "s" (isométrico: más
    # segundos) o "min" (cardio: minutos de la semana).
    unit: str
    weeks: list[ExerciseWeekPointOut]  # de la más vieja a la más nueva
    record: float | None


class WeekSummaryDetailOut(BaseModel):
    """El resumen de una semana para la pantalla Progreso (#28). Se calcula, no se guarda."""

    week_id: int
    routine_id: int
    routine_name: str
    number: int
    status: str
    week_start: date
    closed_at: datetime | None
    day_states: list[str]
    days_completed: int
    sets_done: int
    sets_planned: int
    kg_moved: float  # repeticiones × kilos de lo realizado
    cardio_minutes: int
    exercises: list[ExerciseResultOut]
    # El resumen que escribió la IA al armar la semana siguiente de la rutina (si ya existe).
    ai_summary: str | None
    closing_note: str | None


class WeekDetailOut(BaseModel):
    id: int
    routine_id: int
    routine_name: str
    number: int
    status: str
    week_start: date
    closing_note: str | None = None
    days: list[WeekDayItemOut]


class DaySetOut(BaseModel):
    id: int  # id de la serie planificada: con él se guarda lo realizado
    set_number: int
    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    target_weight_kg: float | None
    real: RealSetOut | None  # vacío si todavía no se registró nada en esta serie


class SetEntryIn(BaseModel):
    """Lo realizado en una serie. Qué campo corresponde lo decide el tipo del ejercicio."""

    reps: int | None = Field(default=None, ge=1, le=50)
    duration_minutes: int | None = Field(default=None, ge=1, le=180)
    duration_seconds: int | None = Field(default=None, ge=1, le=600)
    weight_kg: float | None = Field(default=None, ge=0, le=500)


class DayExerciseOut(BaseModel):
    id: int  # id del ejercicio planificado: con él se marca como hecho
    # El usuario lo cerró con "Marcar como hecho": queda bloqueado hasta reabrirlo.
    completed: bool
    name: str
    kind: str
    rest_seconds: int | None
    execution_notes: str | None
    reason: str | None
    sets: list[DaySetOut]
    # "Semana pasada": lo realizado en este ejercicio en la semana cerrada anterior de la rutina,
    # serie por serie (vacía la que no se registró). None si no hay semana anterior o el ejercicio
    # no estaba en ella.
    previous: list[RealSetOut | None] | None = None
    # "¿Cómo te fue?" (decisión 74): marcas opcionales; None = sin dato.
    load_feel: LoadFeel | None = None
    pain: PainLevel | None = None


class ExerciseFeelIn(BaseModel):
    """Marca de carga y dolor de un ejercicio hecho. Solo se toca lo que viene en el cuerpo:
    un campo ausente se deja como está y uno en `null` se borra."""

    load_feel: LoadFeel | None = None
    pain: PainLevel | None = None


class DayDetailOut(BaseModel):
    week_id: int
    week_number: int
    week_status: str
    day_index: int
    title: str
    mobility_notes: str | None
    minutes: int
    # Cuándo se tocó "Día completado". Vacío mientras el día está abierto.
    finished_at: datetime | None
    exercises: list[DayExerciseOut]


class DayStatusOut(BaseModel):
    finished_at: datetime | None


class CalendarSessionOut(BaseModel):
    """Un día de entrenamiento completado, para el calendario."""

    local_date: date  # el día del calendario de la persona (según la diferencia horaria que mandó)
    finished_at: datetime
    week_id: int
    week_number: int  # dentro de su rutina
    day_index: int
    title: str
    routine_name: str


class CalendarOut(BaseModel):
    """Calendario de entrenamientos (histórico, de todas las rutinas)."""

    month: str  # AAAA-MM
    # El mes del primer entrenamiento (hasta dónde se puede retroceder); nulo si nunca entrenó.
    first_month: str | None
    total_days: int  # días entrenados en total
    month_days: int  # días entrenados en el mes pedido
    sessions: list[CalendarSessionOut]

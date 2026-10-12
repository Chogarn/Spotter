"""Esquemas de Pydantic: lo que entra y sale de la API."""

import re
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.ai.routine import RoutineProposal
from app.enums import Goal, Level


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
    age: int = Field(ge=14, le=100)
    weight_kg: Decimal = Field(ge=30, le=300, max_digits=5, decimal_places=2)
    height_cm: int = Field(ge=100, le=250)
    sex: Literal["masculino", "femenino", "otro"] | None = None
    limitations: str | None = Field(default=None, max_length=1000)
    # Sin el tilde del aviso legal no se guarda nada.
    accept_legal_notice: Literal[True]


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    age: int
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
    weeks: list[WeekSummaryOut]  # de la más nueva a la más vieja


class CloseWeekIn(BaseModel):
    """Lo que el usuario puede escribir al cerrar la semana (opcional)."""

    note: str | None = Field(default=None, max_length=1000)


class WeekDetailOut(BaseModel):
    id: int
    routine_id: int
    routine_name: str
    number: int
    status: str
    week_start: date
    closing_note: str | None = None
    days: list[WeekDayItemOut]


class RealSetOut(BaseModel):
    """Lo que el usuario realmente hizo en una serie."""

    reps: int | None
    duration_minutes: int | None
    duration_seconds: int | None
    weight_kg: float | None


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

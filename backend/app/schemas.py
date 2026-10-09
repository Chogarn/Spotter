"""Esquemas de Pydantic: lo que entra y sale de la API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.ai.routine import RoutineProposal
from app.enums import Equipment, Goal, Level


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=14, le=100)
    weight_kg: Decimal = Field(ge=30, le=300, max_digits=5, decimal_places=2)
    height_cm: int = Field(ge=100, le=250)
    sex: Literal["masculino", "femenino", "otro"] | None = None
    level: Level
    goal: Goal
    equipment: Equipment
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
    level: Level
    goal: Goal
    equipment: Equipment
    limitations: str | None
    legal_notice_accepted: bool


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


class WeekSummaryOut(BaseModel):
    """Una semana en la lista "Mis rutinas"."""

    id: int
    # Orden de activación: la primera semana que tuvo el usuario es la 1. Se calcula, no se guarda.
    number: int
    status: str
    week_start: date
    closed_at: datetime | None
    day_count: int


class WeekDayItemOut(BaseModel):
    day_index: int
    title: str
    exercise_count: int
    minutes: int  # duración estimada (R34)
    # "pending" (nada registrado), "partial" (algo registrado) o "completed" (Día completado).
    state: str


class WeekDetailOut(BaseModel):
    id: int
    number: int
    status: str
    week_start: date
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

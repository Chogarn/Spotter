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

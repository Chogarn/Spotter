"""Formato de la rutina que devuelve Gemini (camino A). Pydantic lo valida.

Acá solo va la FORMA (tipos, listas cerradas de R13, rangos de sentido común). Las reglas de
entrenamiento (R1, R11, R17...) están en `rules.py`.
"""

from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.enums import (
    ExerciseDirection,
    ExerciseEquipment,
    ExerciseKind,
    ExerciseMechanic,
    ExerciseRegion,
    Level,
    Muscle,
)


class SetProposal(BaseModel):
    """Una serie: repeticiones (fuerza), minutos (cardio) o segundos (isométrico). Solo una."""

    reps: int | None = Field(default=None, ge=1, le=50)
    duration_minutes: int | None = Field(default=None, ge=1, le=180)
    # Tope de sentido común (no es una regla de entrenamiento): 10 minutos por serie.
    duration_seconds: int | None = Field(default=None, ge=1, le=600)
    # Vacío en ejercicios con peso corporal y en cardio.
    target_weight_kg: float | None = Field(default=None, ge=0, le=500)

    @model_validator(mode="after")
    def reps_or_duration(self) -> Self:
        medidas = [self.reps, self.duration_minutes, self.duration_seconds]
        if sum(m is not None for m in medidas) != 1:
            raise ValueError("cada serie lleva repeticiones, minutos o segundos: una sola de las tres")
        return self


class ExerciseProposal(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    kind: ExerciseKind
    # Etiquetas cerradas (R13).
    region: ExerciseRegion
    direction: ExerciseDirection
    primary_muscle: Muscle
    secondary_muscles: list[Muscle] = Field(default_factory=list, max_length=4)
    mechanic: ExerciseMechanic
    equipment: ExerciseEquipment
    level: Level
    execution_notes: str | None = Field(default=None, max_length=500)
    # Descanso entre series en segundos (R8). Obligatorio en fuerza e isométricos, vacío en cardio.
    rest_seconds: int | None = Field(default=None, ge=0, le=600)
    # Explicación de la IA ("¿por qué esto?").
    reason: str | None = Field(default=None, max_length=500)
    sets: list[SetProposal] = Field(min_length=1, max_length=10)

    @model_validator(mode="after")
    def coherence(self) -> Self:
        if self.kind == ExerciseKind.CARDIO:
            if any(s.duration_minutes is None for s in self.sets):
                raise ValueError("el cardio se mide en minutos")
            if any(s.target_weight_kg is not None for s in self.sets):
                raise ValueError("el cardio no lleva peso")
            # R13: el cardio usa full_body en región y músculo, y no empuja ni tira.
            if (
                self.region != ExerciseRegion.FULL_BODY
                or self.primary_muscle != Muscle.FULL_BODY
                or self.direction != ExerciseDirection.NONE
            ):
                raise ValueError("el cardio lleva region full_body, primary_muscle full_body y direction none")
        elif self.kind == ExerciseKind.ISOMETRIC:
            if any(s.duration_seconds is None for s in self.sets):
                raise ValueError("el isométrico se mide en segundos")
            if self.rest_seconds is None:
                raise ValueError("el isométrico necesita rest_seconds")
        else:
            if any(s.reps is None for s in self.sets):
                raise ValueError("la fuerza se mide en repeticiones")
            if self.rest_seconds is None:
                raise ValueError("la fuerza necesita rest_seconds")
        return self


class DayProposal(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    # Movilidad y equilibrio del día, en texto (R26).
    mobility_notes: str | None = Field(default=None, max_length=500)
    exercises: list[ExerciseProposal] = Field(min_length=1, max_length=12)


class RoutineProposal(BaseModel):
    """La semana completa. El orden de `days` es Día 1, Día 2..."""

    days: list[DayProposal] = Field(min_length=1, max_length=7)
    # Avisos para el usuario (R35: sesión más larga que la referencia, series recortadas...).
    notices: list[str] = Field(default_factory=list, max_length=10)
    # Resumen de evolución respecto de la semana anterior (qué subió, qué se mantuvo, qué no se hizo).
    summary: str | None = Field(default=None, max_length=1200)

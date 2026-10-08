"""Modelos de la base de datos. Ver docs/modelo-datos.md."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.enums import (
    Equipment,
    ExerciseKind,
    Feeling,
    Goal,
    Level,
    PlanOrigin,
    PlanStatus,
)


def enum_column(enum_cls: type) -> Enum:
    """Guarda el valor del enum como texto con una restricción CHECK."""
    return Enum(
        enum_cls,
        native_enum=False,
        create_constraint=True,
        length=32,
        values_callable=lambda e: [m.value for m in e],
        name=f"ck_{enum_cls.__name__.lower()}",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    profile: Mapped["Profile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    week_plans: Mapped[list["WeekPlan"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Profile(Base):
    __tablename__ = "profiles"
    # No hay "días por semana" ni "duración de la sesión": los define la IA, no el usuario.

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    age: Mapped[int] = mapped_column(Integer)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    height_cm: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str | None] = mapped_column(String(20))
    level: Mapped[Level] = mapped_column(enum_column(Level))
    goal: Mapped[Goal] = mapped_column(enum_column(Goal))
    equipment: Mapped[Equipment] = mapped_column(enum_column(Equipment))
    limitations: Mapped[str | None] = mapped_column(Text)
    legal_notice_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    user: Mapped[User] = relationship(back_populates="profile")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    # Minúsculas y sin tildes: evita duplicados tipo "Press banca" / "press de banca".
    name_normalized: Mapped[str] = mapped_column(String(150), unique=True)
    muscle_group: Mapped[str | None] = mapped_column(String(50))
    # strength: se mide en series y repeticiones. cardio: se mide en minutos.
    kind: Mapped[ExerciseKind] = mapped_column(
        enum_column(ExerciseKind),
        default=ExerciseKind.STRENGTH,
        server_default="strength",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class WeekPlan(Base):
    __tablename__ = "week_plans"
    __table_args__ = (Index("ix_week_plans_user_week", "user_id", "week_start"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # Cuándo el usuario activó la semana. No tiene que ser un lunes: la semana es un ciclo.
    week_start: Mapped[date] = mapped_column(Date)
    # Cuándo el usuario la cerró con el botón. Vacío mientras la semana sigue abierta.
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[PlanStatus] = mapped_column(
        enum_column(PlanStatus), default=PlanStatus.DRAFT, server_default="draft"
    )
    origin: Mapped[PlanOrigin] = mapped_column(enum_column(PlanOrigin))
    # Rutina original que cargó el usuario (solo camino B).
    original_routine: Mapped[dict[str, Any] | None] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql")
    )
    ai_summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="week_plans")
    days: Mapped[list["PlanDay"]] = relationship(
        back_populates="week_plan",
        cascade="all, delete-orphan",
        order_by="PlanDay.day_index",
    )


class PlanDay(Base):
    __tablename__ = "plan_days"
    __table_args__ = (
        CheckConstraint("day_index BETWEEN 1 AND 7", name="ck_plan_days_index"),
        UniqueConstraint("week_plan_id", "day_index", name="uq_plan_days_week_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    week_plan_id: Mapped[int] = mapped_column(
        ForeignKey("week_plans.id", ondelete="CASCADE")
    )
    # Orden dentro de la semana: 1 = "Día 1", 2 = "Día 2"... No es un día del calendario.
    day_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(100))

    week_plan: Mapped[WeekPlan] = relationship(back_populates="days")
    exercises: Mapped[list["PlanExercise"]] = relationship(
        back_populates="plan_day",
        cascade="all, delete-orphan",
        order_by="PlanExercise.position",
    )


class PlanExercise(Base):
    """Lo planificado: qué toca hacer en cada día."""

    __tablename__ = "plan_exercises"
    __table_args__ = (
        UniqueConstraint("plan_day_id", "position", name="uq_plan_exercises_day_pos"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_day_id: Mapped[int] = mapped_column(
        ForeignKey("plan_days.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    position: Mapped[int] = mapped_column(Integer)
    # Indicaciones de ejecución propias de esta rutina: ritmo, pausas, técnica
    # (por ejemplo, "bajar lento, pausa de 2 segundos arriba").
    execution_notes: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    edited_by_user: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    plan_day: Mapped[PlanDay] = relationship(back_populates="exercises")
    exercise: Mapped[Exercise] = relationship()
    # Las series, repeticiones y pesos viven en plan_sets (una fila por serie).
    # El resumen "4 x 10 con 50 kg" se calcula a partir de ellas, no se guarda.
    sets: Mapped[list["PlanSet"]] = relationship(
        back_populates="plan_exercise",
        cascade="all, delete-orphan",
        order_by="PlanSet.set_number",
    )


class PlanSet(Base):
    """Una serie planificada: cuántas repeticiones y con qué peso."""

    __tablename__ = "plan_sets"
    __table_args__ = (
        UniqueConstraint("plan_exercise_id", "set_number", name="uq_plan_sets_exercise_num"),
        # Una serie se mide en repeticiones (fuerza) o en minutos (cardio): una cosa o la otra.
        CheckConstraint(
            "(reps IS NOT NULL) <> (duration_minutes IS NOT NULL)",
            name="ck_plan_sets_reps_or_duration",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("plan_exercises.id", ondelete="CASCADE")
    )
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int | None] = mapped_column(Integer)
    # Minutos planificados, solo en ejercicios de cardio.
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    # Vacío en ejercicios con peso corporal y en cardio.
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    plan_exercise: Mapped[PlanExercise] = relationship(back_populates="sets")


class WorkoutSession(Base):
    """Una sesión de entrenamiento realizada."""

    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    plan_day_id: Mapped[int | None] = mapped_column(
        ForeignKey("plan_days.id", ondelete="SET NULL")
    )
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # Cuándo el usuario tocó "Día completado". Vacío mientras la sesión está en curso;
    # volver a dejarlo vacío reabre la sesión.
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    feeling: Mapped[Feeling | None] = mapped_column(enum_column(Feeling))
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="workout_sessions")
    sets: Mapped[list["SetEntry"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SetEntry.set_number",
    )


class SetEntry(Base):
    """Lo real: cada serie que el usuario hizo."""

    __tablename__ = "set_entries"
    __table_args__ = (
        CheckConstraint("effort BETWEEN 1 AND 10", name="ck_set_entries_effort"),
        # Una serie realizada se mide en repeticiones (fuerza) o en minutos (cardio).
        CheckConstraint(
            "(reps IS NOT NULL) <> (duration_minutes IS NOT NULL)",
            name="ck_set_entries_reps_or_duration",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    plan_exercise_id: Mapped[int | None] = mapped_column(
        ForeignKey("plan_exercises.id", ondelete="SET NULL")
    )
    # Serie planificada con la que se compara. Vacío en las series extra que no estaban en el plan.
    plan_set_id: Mapped[int | None] = mapped_column(
        ForeignKey("plan_sets.id", ondelete="SET NULL")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int | None] = mapped_column(Integer)
    # Minutos realizados, solo en ejercicios de cardio.
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    # Vacío en ejercicios con peso corporal y en cardio.
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    effort: Mapped[int | None] = mapped_column(Integer)

    session: Mapped[WorkoutSession] = relationship(back_populates="sets")
    exercise: Mapped[Exercise] = relationship()

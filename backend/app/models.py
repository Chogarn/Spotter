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
from app.enums import Equipment, Feeling, Goal, Level, PlanOrigin, PlanStatus


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
    __table_args__ = (
        CheckConstraint("days_per_week BETWEEN 1 AND 7", name="ck_profiles_days"),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    age: Mapped[int] = mapped_column(Integer)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    height_cm: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str | None] = mapped_column(String(20))
    level: Mapped[Level] = mapped_column(enum_column(Level))
    goal: Mapped[Goal] = mapped_column(enum_column(Goal))
    days_per_week: Mapped[int] = mapped_column(Integer)
    session_minutes: Mapped[int] = mapped_column(Integer)
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class WeekPlan(Base):
    __tablename__ = "week_plans"
    __table_args__ = (Index("ix_week_plans_user_week", "user_id", "week_start"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    week_start: Mapped[date] = mapped_column(Date)
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
    sets: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int] = mapped_column(Integer)
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    reason: Mapped[str | None] = mapped_column(Text)
    edited_by_user: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )

    plan_day: Mapped[PlanDay] = relationship(back_populates="exercises")
    exercise: Mapped[Exercise] = relationship()


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
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    plan_exercise_id: Mapped[int | None] = mapped_column(
        ForeignKey("plan_exercises.id", ondelete="SET NULL")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int] = mapped_column(Integer)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    effort: Mapped[int | None] = mapped_column(Integer)

    session: Mapped[WorkoutSession] = relationship(back_populates="sets")
    exercise: Mapped[Exercise] = relationship()

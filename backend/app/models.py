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
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.enums import (
    AiCallKind,
    ExerciseDirection,
    ExerciseEquipment,
    ExerciseKind,
    ExerciseMechanic,
    ExerciseRegion,
    Feeling,
    Goal,
    LoadFeel,
    PainLevel,
    Level,
    Muscle,
    PlanStatus,
    ProposalKind,
    ProposalStatus,
    RoutineSplit,
)


# Portable (Postgres y SQLite de los tests): suma de "tiene valor" = 1.
MEASURE_ONE_OF_THREE = (
    "(CASE WHEN reps IS NOT NULL THEN 1 ELSE 0 END"
    " + CASE WHEN duration_minutes IS NOT NULL THEN 1 ELSE 0 END"
    " + CASE WHEN duration_seconds IS NOT NULL THEN 1 ELSE 0 END) = 1"
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
    # Cuándo cambió la contraseña por última vez (decisión 80). Las sesiones iniciadas antes de ese
    # momento dejan de valer: así un cambio de contraseña cierra las sesiones de otros aparatos.
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Cuándo se verificó el correo (decisión 81). Una cuenta nueva solo existe después de verificarlo;
    # las anteriores a ese cambio se marcaron como verificadas en la migración 0021.
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    profile: Mapped["Profile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    week_plans: Mapped[list["WeekPlan"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    workout_sessions: Mapped[list["WorkoutSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    routines: Mapped[list["Routine"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Routine(Base):
    """Una rutina: un objetivo y un nivel, con las semanas que el usuario fue sumando."""

    __tablename__ = "routines"
    __table_args__ = (
        CheckConstraint("days_per_week BETWEEN 2 AND 6", name="ck_routines_days_per_week"),
        CheckConstraint("session_minutes BETWEEN 30 AND 120", name="ck_routines_session_minutes"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # Se arma solo ("Fuerza · desde el 9/10") y el usuario lo puede cambiar.
    name: Mapped[str] = mapped_column(String(100))
    # Los elige el usuario al empezar la rutina; las semanas siguientes los heredan.
    goal: Mapped[Goal] = mapped_column(enum_column(Goal))
    level: Mapped[Level] = mapped_column(enum_column(Level))
    # Cuántos días por semana entrena (decisión 52). Lo elige el usuario al generar y lo puede
    # cambiar al continuar. Vacío solo en rutinas sin semanas (no debería pasar).
    days_per_week: Mapped[int | None] = mapped_column(SmallInteger)
    # Dato histórico de las decisiones 82/88/89. La decisión 90 lo dejó apagado; no limita la IA.
    session_minutes: Mapped[int | None] = mapped_column(SmallInteger)
    # Split elegido para las semanas de la rutina; NULL en rutinas anteriores a esta función.
    split_type: Mapped[RoutineSplit | None] = mapped_column(enum_column(RoutineSplit))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="routines")
    weeks: Mapped[list["WeekPlan"]] = relationship(
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="WeekPlan.week_start, WeekPlan.id",
    )


class Profile(Base):
    __tablename__ = "profiles"
    # No hay "días por semana" ni "duración de la sesión": los define la IA, no el usuario.

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    # La edad se guarda al cargar el perfil; si hay fecha de nacimiento, la edad que se usa y
    # se muestra es la que se calcula a hoy (`current_age`). Los perfiles viejos solo tienen `age`.
    age: Mapped[int] = mapped_column(Integer)
    birth_date: Mapped[date | None] = mapped_column(Date)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    height_cm: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str | None] = mapped_column(String(20))
    # Nivel, objetivo y equipamiento no están acá: el usuario elige nivel y objetivo cada vez que
    # genera una semana (quedan en `week_plans`) y el equipamiento es siempre el de un gimnasio.
    limitations: Mapped[str | None] = mapped_column(Text)
    legal_notice_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    user: Mapped[User] = relationship(back_populates="profile")

    @property
    def current_age(self) -> int:
        """La edad de hoy: calculada desde la fecha de nacimiento, o la guardada si no hay."""
        if self.birth_date is None:
            return self.age
        return age_on(self.birth_date, date.today())


def age_on(birth_date: date, today: date) -> int:
    """Años cumplidos en `today`."""
    before_birthday = (today.month, today.day) < (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (1 if before_birthday else 0)


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    # Minúsculas y sin tildes: evita duplicados tipo "Press banca" / "press de banca".
    name_normalized: Mapped[str] = mapped_column(String(150), unique=True)
    muscle_group: Mapped[str | None] = mapped_column(String(50))
    # Etiquetas cerradas (R13). Las asigna la IA y el código las valida; sirven para contar
    # series por músculo (R3, R20, R24, R25), las indirectas a 0,5 (R5) y el equilibrio (R14).
    region: Mapped[ExerciseRegion] = mapped_column(enum_column(ExerciseRegion))
    direction: Mapped[ExerciseDirection] = mapped_column(enum_column(ExerciseDirection))
    primary_muscle: Mapped[Muscle] = mapped_column(enum_column(Muscle))
    # Lista de músculos secundarios (valores de Muscle); la valida Pydantic, no la base.
    secondary_muscles: Mapped[list[str]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"), default=list, server_default="[]"
    )
    mechanic: Mapped[ExerciseMechanic] = mapped_column(enum_column(ExerciseMechanic))
    equipment: Mapped[ExerciseEquipment] = mapped_column(enum_column(ExerciseEquipment))
    level: Mapped[Level] = mapped_column(enum_column(Level))
    # strength: series y repeticiones. cardio: minutos. isometric: segundos.
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
    __table_args__ = (
        Index("ix_week_plans_user_week", "user_id", "week_start"),
        Index("ix_week_plans_routine", "routine_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.id", ondelete="CASCADE"))
    # Cuándo el usuario activó la semana. No tiene que ser un lunes: la semana es un ciclo.
    week_start: Mapped[date] = mapped_column(Date)
    # Cuándo el usuario la cerró con el botón. Vacío mientras la semana sigue abierta.
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Comentario libre del usuario al cerrar la semana (cómo se sintió). Opcional y fijo después.
    closing_note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[PlanStatus] = mapped_column(
        enum_column(PlanStatus), default=PlanStatus.DRAFT, server_default="draft"
    )
    ai_summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="week_plans")
    routine: Mapped[Routine] = relationship(back_populates="weeks")
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
    # Movilidad y equilibrio del día, en texto (por ejemplo, "5 a 10 min de movilidad de cadera").
    # No se registra serie por serie: es una indicación de texto, editable por el usuario.
    mobility_notes: Mapped[str | None] = mapped_column(Text)

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
        CheckConstraint("rest_seconds >= 0", name="ck_plan_exercises_rest"),
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
    # Descanso entre series, en segundos. La IA lo propone (R8) y el usuario lo puede cambiar.
    rest_seconds: Mapped[int | None] = mapped_column(Integer)
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
        # Una serie se mide en repeticiones (fuerza), minutos (cardio) o segundos (isométrico):
        # exactamente una de las tres.
        CheckConstraint(MEASURE_ONE_OF_THREE, name="ck_plan_sets_reps_or_duration"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("plan_exercises.id", ondelete="CASCADE")
    )
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int | None] = mapped_column(Integer)
    # Minutos planificados, solo en ejercicios de cardio.
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    # Segundos planificados, solo en ejercicios isométricos (plancha).
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    # Vacío en ejercicios con peso corporal y en cardio.
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    plan_exercise: Mapped[PlanExercise] = relationship(back_populates="sets")


class BodyMeasurement(Base):
    """Una medición de cuerpo cargada a mano (decisión 87): el peso de un día y, si la persona
    quiere, la grasa corporal. Una por día. El IMC no se guarda: se calcula con la altura del perfil.
    """

    __tablename__ = "body_measurements"
    __table_args__ = (
        UniqueConstraint("user_id", "measured_on", name="uq_body_measurements_user_day"),
        CheckConstraint("weight_kg BETWEEN 30 AND 300", name="ck_body_measurements_weight"),
        CheckConstraint(
            "body_fat_pct IS NULL OR body_fat_pct BETWEEN 2 AND 70", name="ck_body_measurements_fat"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    measured_on: Mapped[date] = mapped_column(Date)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    body_fat_pct: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    # La semana en cuyo cierre se cargó, si fue ahí.
    week_plan_id: Mapped[int | None] = mapped_column(ForeignKey("week_plans.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


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
    # Cuándo tocó "Empezar día" (decisión 82). Reabrir el día lo vacía; solo sirve para medir
    # cuánto tardó.
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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
        # Una serie realizada se mide en repeticiones, minutos o segundos: exactamente una.
        CheckConstraint(MEASURE_ONE_OF_THREE, name="ck_set_entries_reps_or_duration"),
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
    # Segundos realizados, solo en ejercicios isométricos (plancha).
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    # Vacío en ejercicios con peso corporal y en cardio.
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    effort: Mapped[int | None] = mapped_column(Integer)

    session: Mapped[WorkoutSession] = relationship(back_populates="sets")
    exercise: Mapped[Exercise] = relationship()


class PlanProposal(Base):
    """Lo que propone la IA antes de aplicarse: solo al aceptar se escribe en el plan."""

    __tablename__ = "plan_proposals"
    __table_args__ = (Index("ix_plan_proposals_user_status", "user_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # Vacío en la primera rutina (kind = generate): todavía no existe ninguna semana.
    week_plan_id: Mapped[int | None] = mapped_column(
        ForeignKey("week_plans.id", ondelete="SET NULL")
    )
    kind: Mapped[ProposalKind] = mapped_column(enum_column(ProposalKind))
    request_text: Mapped[str | None] = mapped_column(Text)
    # Los cambios propuestos; los valida Pydantic antes de guardarse.
    proposed_changes: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql")
    )
    status: Mapped[ProposalStatus] = mapped_column(
        enum_column(ProposalStatus),
        default=ProposalStatus.PENDING,
        server_default="pending",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PendingRegistration(Base):
    """Un registro que espera que se verifique el correo (decisión 81).

    El usuario todavía NO existe: se crea al tocar el enlace. Se guarda solo el hash del código.
    Volver a registrarse con el mismo correo reemplaza la fila.
    """

    __tablename__ = "pending_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PasswordReset(Base):
    """Un enlace para elegir una contraseña nueva (decisión 81): de un solo uso y con vencimiento."""

    __tablename__ = "password_resets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class EmailLog(Base):
    """Una fila por cada correo que la app manda. Se escribe ANTES de enviar y los topes diario y
    por dirección se calculan contándolas (como `ai_calls` con Gemini)."""

    __tablename__ = "email_log"
    __table_args__ = (Index("ix_email_log_created_at", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(32))
    to_email: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class AiCall(Base):
    """Una fila por cada llamada a Gemini. NUNCA se borra: los topes se calculan contándolas.

    Se escribe ANTES de llamar, así una caída a mitad de la llamada igual queda contada.
    Los límites de Gemini son por proyecto, por eso se cuentan las filas de todos los usuarios.
    """

    __tablename__ = "ai_calls"
    __table_args__ = (Index("ix_ai_calls_created_at", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # SET NULL a propósito (decisión de borrar cuenta): borrar un usuario no puede borrar las
    # llamadas ya hechas; solo pierden el vínculo con la persona.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    kind: Mapped[AiCallKind] = mapped_column(enum_column(AiCallKind))
    model: Mapped[str] = mapped_column(String(64))
    # Vacío mientras la llamada está en curso (o si la app se cayó en el medio).
    succeeded: Mapped[bool | None] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# gemini-embedding-001 a 768 dimensiones (una de las recomendadas por Google). Cambiarla exige
# una migración y reindexar el catálogo.
EMBEDDING_DIM = 768


class CatalogEmbedding(Base):
    """El vector de un ejercicio del catálogo (`exercises.json`), para recuperarlo por similitud.

    Es un dato derivado: se puede borrar y volver a generar con `app.scripts.index_catalog`.
    `text_hash` dice con qué texto se calculó, para reindexar solo lo que cambió.
    """

    __tablename__ = "catalog_embeddings"

    catalog_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    text_hash: Mapped[str] = mapped_column(String(64))
    model: Mapped[str] = mapped_column(String(64))
    # En PostgreSQL es un `vector(768)` de pgvector; en SQLite de los tests, una lista en JSON.
    embedding: Mapped[list[float]] = mapped_column(
        JSON().with_variant(Vector(EMBEDDING_DIM), "postgresql")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ExerciseCompletion(Base):
    """Un ejercicio que el usuario cerró con "Marcar como hecho".

    Mientras exista esta fila el ejercicio queda bloqueado (sus series no se editan, marcan ni
    desmarcan) hasta reabrirlo. Reabrir borra solo esta fila: lo registrado se conserva.
    """

    __tablename__ = "exercise_completions"
    __table_args__ = (
        UniqueConstraint(
            "session_id", "plan_exercise_id", name="uq_exercise_completions_session_exercise"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    plan_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("plan_exercises.id", ondelete="CASCADE")
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # "¿Cómo te fue?" (decisión 74): marcas opcionales e independientes. Nulas = sin dato.
    load_feel: Mapped[LoadFeel | None] = mapped_column(enum_column(LoadFeel), nullable=True)
    pain: Mapped[PainLevel | None] = mapped_column(enum_column(PainLevel), nullable=True)

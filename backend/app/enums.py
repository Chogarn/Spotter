import enum


class Level(str, enum.Enum):
    PRINCIPIANTE = "principiante"
    INTERMEDIO = "intermedio"
    AVANZADO = "avanzado"


class Goal(str, enum.Enum):
    MASA = "masa"
    FUERZA = "fuerza"
    PERDER_GRASA = "perder_grasa"
    CONDICION_GENERAL = "condicion_general"
    MANTENERME_ACTIVO = "mantenerme_activo"


class Equipment(str, enum.Enum):
    GIMNASIO = "gimnasio"
    MANCUERNAS = "mancuernas"
    CASA = "casa"


class PlanStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"


class PlanOrigin(str, enum.Enum):
    GENERATED = "generated"
    IMPROVED = "improved"


class ExerciseKind(str, enum.Enum):
    STRENGTH = "strength"  # se mide en repeticiones
    CARDIO = "cardio"  # se mide en minutos
    ISOMETRIC = "isometric"  # se mide en segundos (plancha, sentadilla en pared)


class ExerciseRegion(str, enum.Enum):
    UPPER = "upper"
    LOWER = "lower"
    CORE = "core"
    FULL_BODY = "full_body"  # cardio y ejercicios de cuerpo entero


class ExerciseDirection(str, enum.Enum):
    PUSH = "push"
    PULL = "pull"
    NONE = "none"  # piernas, core, cardio


class Muscle(str, enum.Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    QUADRICEPS = "quadriceps"
    HAMSTRINGS = "hamstrings"
    GLUTES = "glutes"
    CALVES = "calves"
    CORE = "core"
    FULL_BODY = "full_body"  # cardio y ejercicios de cuerpo entero


class ExerciseMechanic(str, enum.Enum):
    COMPOUND = "compound"  # multiarticular
    ISOLATION = "isolation"  # monoarticular


class ExerciseEquipment(str, enum.Enum):
    BARBELL = "barbell"
    DUMBBELL = "dumbbell"
    MACHINE = "machine"
    CABLE = "cable"
    BODYWEIGHT = "bodyweight"
    BAND = "band"
    KETTLEBELL = "kettlebell"
    OTHER = "other"


class Feeling(str, enum.Enum):
    EASY = "easy"
    GOOD = "good"
    HARD = "hard"
    PAIN = "pain"


class ProposalKind(str, enum.Enum):
    GENERATE = "generate"  # camino A: la primera rutina
    ADJUST = "adjust"
    WEEK_CLOSE = "week_close"
    IMPROVE = "improve"
    REPEAT_EXERCISE = "repeat_exercise"


class ProposalStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DISCARDED = "discarded"


class AiCallKind(str, enum.Enum):
    """Para qué se llamó a Gemini. Mismos valores que ProposalKind."""

    GENERATE = "generate"
    ADJUST = "adjust"
    WEEK_CLOSE = "week_close"
    IMPROVE = "improve"
    REPEAT_EXERCISE = "repeat_exercise"

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
    STRENGTH = "strength"
    CARDIO = "cardio"


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

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


class Feeling(str, enum.Enum):
    EASY = "easy"
    GOOD = "good"
    HARD = "hard"
    PAIN = "pain"

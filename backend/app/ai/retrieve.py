"""Recupera del catálogo los ejercicios candidatos para una rutina (RAG, decisión 58).

Dos etapas:
1. El CÓDIGO descarta lo que no corresponde (reglas fijas): ejercicios de un nivel más alto que el
   de la persona, y cardio cuando el objetivo no lo usa.
2. Los VECTORES ordenan lo que queda por parecido con la persona (objetivo y nivel) y se toman los
   mejores de cada grupo muscular, para que todos queden cubiertos.

Las lesiones y limitaciones NO entran en la consulta: un vector mide parecido de significado, no
"evitar". Verificado el 2026-10-14: con "me duele la rodilla" quedaban primero la sentadilla y la
prensa, los que más cargan la rodilla. Las limitaciones las razona la IA con el perfil del prompt.

Si no se puede calcular el vector de la consulta (tope, error o catálogo sin indexar), se devuelve
todo lo permitido sin ordenar: la generación no se cae por una pieza auxiliar.
"""

import logging
import math
from collections.abc import Iterable
from dataclasses import dataclass

from sqlalchemy import select, type_coerce
from sqlalchemy.orm import Session

from app.ai.catalog import CatalogExercise, find, load_catalog
from app.ai.gemini import embed_texts
from app.ai.prompt import GOAL_TEXT
from app.enums import ExerciseKind, Goal, Level, Muscle
from app.models import EMBEDDING_DIM, CatalogEmbedding

logger = logging.getLogger(__name__)

# Cuántos ejercicios por grupo muscular llegan al prompt (elección de diseño, no una regla).
PER_GROUP = 6

LEVEL_ORDER = {Level.PRINCIPIANTE: 0, Level.INTERMEDIO: 1, Level.AVANZADO: 2}

# Objetivos que llevan cardio según `generar_rutina.md` (R17); masa y fuerza no.
CARDIO_GOALS = {Goal.PERDER_GRASA, Goal.MANTENERME_ACTIVO}


@dataclass
class Candidates:
    exercises: list[CatalogExercise]
    ranked: bool  # False: no se pudo usar los vectores y se devuelve todo lo permitido
    reason: str | None = None  # por qué no se ordenó, si aplica


def query_text(goal: Goal, level: Level) -> str:
    """El texto que se convierte en vector: el objetivo y el nivel de la persona."""
    return f"Persona de nivel {level.value} con este objetivo: {GOAL_TEXT[goal.value]}."


def allowed(exercise: CatalogExercise, goal: Goal, level: Level) -> bool:
    """Reglas fijas del código: no dependen de los vectores."""
    if LEVEL_ORDER[exercise.level] > LEVEL_ORDER[level]:
        return False
    if exercise.kind == ExerciseKind.CARDIO and goal not in CARDIO_GOALS:
        return False
    return True


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


def rank(db: Session, query_vector: list[float]) -> list[str]:
    """Ids del catálogo del más parecido al menos parecido a la consulta."""
    if db.get_bind().dialect.name == "postgresql":
        # pgvector: distancia coseno (<=>) calculada en la base.
        distance = type_coerce(CatalogEmbedding.embedding, _vector_type()).cosine_distance(
            query_vector
        )
        return list(
            db.scalars(select(CatalogEmbedding.catalog_id).order_by(distance, CatalogEmbedding.catalog_id))
        )
    # SQLite (tests): los vectores son listas JSON; mismo orden, calculado en Python.
    rows = db.execute(select(CatalogEmbedding.catalog_id, CatalogEmbedding.embedding)).all()
    scored = sorted(
        ((1 - _cosine(vector, query_vector), catalog_id) for catalog_id, vector in rows)
    )
    return [catalog_id for _, catalog_id in scored]


def _vector_type():
    from pgvector.sqlalchemy import Vector

    return Vector(EMBEDDING_DIM)


def retrieve_candidates(
    db: Session,
    user_id: int,
    goal: Goal,
    level: Level,
    keep_names: Iterable[str] = (),
    per_group: int = PER_GROUP,
) -> Candidates:
    """Los ejercicios que se le ofrecen a la IA.

    `keep_names`: ejercicios de la semana anterior que están en el catálogo; se incluyen siempre
    para poder mantenerlos al continuar una rutina.
    """
    permitted = [e for e in load_catalog() if allowed(e, goal, level)]
    keep = {e.id for e in (find(n) for n in keep_names) if e is not None and allowed(e, goal, level)}

    try:
        query_vector = embed_texts(
            db, user_id, [query_text(goal, level)], "RETRIEVAL_QUERY"
        )[0]
        order = rank(db, query_vector)
    except Exception as error:  # tope, configuración, red, Gemini caído...
        logger.warning("Sin ranking por vectores, se usa el catálogo permitido: %s", error)
        return Candidates(permitted, ranked=False, reason=str(error) or error.__class__.__name__)

    if not order:
        return Candidates(permitted, ranked=False, reason="el catálogo no está indexado")

    position = {catalog_id: i for i, catalog_id in enumerate(order)}
    # Un ejercicio sin vector (agregado después del último indexado) va al final, no se pierde.
    by_rank = sorted(permitted, key=lambda e: (position.get(e.id, len(order)), e.id))

    taken: dict[Muscle, int] = {}
    chosen: list[CatalogExercise] = []
    for exercise in by_rank:
        if exercise.id in keep or taken.get(exercise.primary_muscle, 0) < per_group:
            chosen.append(exercise)
            taken[exercise.primary_muscle] = taken.get(exercise.primary_muscle, 0) + 1

    # Agrupados por músculo (en el orden del enum) y, dentro de cada uno, del más al menos parecido.
    muscle_order = {m: i for i, m in enumerate(Muscle)}
    chosen.sort(key=lambda e: (muscle_order[e.primary_muscle], position.get(e.id, len(order))))
    return Candidates(chosen, ranked=True)

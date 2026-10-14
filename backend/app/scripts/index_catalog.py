"""Indexa el catálogo de ejercicios: calcula el vector de cada uno y lo guarda (RAG, decisión 58).

Es idempotente: solo calcula los ejercicios nuevos, los cuyo texto cambió y los que se indexaron
con otro modelo. Si no hay nada que hacer, no llama a Gemini. Cada pedido cuenta en `ai_calls` y en
los topes de embeddings. Se corre a mano, nunca en segundo plano.

Uso:

    docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.index_catalog
    ... python -m app.scripts.index_catalog --dry-run     # solo muestra qué haría
    ... python -m app.scripts.index_catalog --email yo@ejemplo.com
"""

import argparse
import sys
import time
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.catalog import CatalogExercise, embedding_text, load_catalog, text_hash
from app.ai.gemini import (
    EMBED_BATCH_SIZE,
    AiLimitError,
    embed_texts,
    load_embedding_settings,
)
from app.db import get_sessionmaker
from app.models import CatalogEmbedding, User


# El tope por minuto (80) es menor que el catálogo entero: se espera a que pase el minuto.
WAIT_SECONDS = 62
MAX_WAITS = 4


@dataclass
class IndexResult:
    indexed: int = 0
    unchanged: int = 0
    removed: int = 0


def exercises_to_index(db: Session, model: str) -> tuple[list[CatalogExercise], int]:
    """Los ejercicios sin vector, con el texto cambiado o indexados con otro modelo.

    Devuelve también cuántos quedan igual.
    """
    saved = {row.catalog_id: row for row in db.scalars(select(CatalogEmbedding))}
    pending = []
    for exercise in load_catalog():
        row = saved.get(exercise.id)
        if row is None or row.text_hash != text_hash(exercise) or row.model != model:
            pending.append(exercise)
    return pending, len(load_catalog()) - len(pending)


def remove_orphans(db: Session) -> int:
    """Borra los vectores de ejercicios que ya no están en el catálogo. No hace commit."""
    valid = {e.id for e in load_catalog()}
    orphans = [r for r in db.scalars(select(CatalogEmbedding)) if r.catalog_id not in valid]
    for row in orphans:
        db.delete(row)
    return len(orphans)


def index_catalog(db: Session, user_id: int) -> IndexResult:
    """Indexa lo pendiente, un pedido por vez, guardando cada lote apenas vuelve.

    Si un pedido falla (por ejemplo, por el tope), lo ya guardado se conserva y la próxima
    corrida sigue donde quedó.
    """
    result = IndexResult()
    result.removed = remove_orphans(db)
    db.commit()

    pending, result.unchanged = exercises_to_index(db, _model())
    for start in range(0, len(pending), EMBED_BATCH_SIZE):
        batch = pending[start : start + EMBED_BATCH_SIZE]
        vectors = embed_texts(
            db, user_id, [embedding_text(e) for e in batch], "RETRIEVAL_DOCUMENT"
        )
        for exercise, vector in zip(batch, vectors, strict=True):
            db.merge(
                CatalogEmbedding(
                    catalog_id=exercise.id,
                    text_hash=text_hash(exercise),
                    model=_model(),
                    embedding=vector,
                )
            )
        db.commit()
        result.indexed += len(batch)
    return result


def _model() -> str:
    return load_embedding_settings().model


def _pick_user(db: Session, email: str | None) -> User:
    if email:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            raise SystemExit(f"No existe un usuario con el email {email}.")
        return user
    users = list(db.scalars(select(User)))
    if len(users) != 1:
        raise SystemExit(
            f"Hay {len(users)} usuarios: indicá a cuál se le cuenta la llamada con --email."
        )
    return users[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Indexa el catálogo de ejercicios con embeddings.")
    parser.add_argument("--email", help="Usuario al que se le cuentan las llamadas en ai_calls.")
    parser.add_argument("--dry-run", action="store_true", help="Muestra qué haría, sin llamar.")
    args = parser.parse_args()

    with get_sessionmaker()() as db:
        user = _pick_user(db, args.email)
        model = _model()
        pending, unchanged = exercises_to_index(db, model)
        calls = -(-len(pending) // EMBED_BATCH_SIZE)
        print(f"Modelo: {model}")
        print(f"Catálogo: {len(load_catalog())} ejercicios; {unchanged} ya indexados, {len(pending)} pendientes.")
        if pending:
            print(
                f"Harían falta {calls} pedido(s) a Gemini de hasta {EMBED_BATCH_SIZE} textos; "
                f"cuentan {len(pending)} lugares del tope diario, uno por texto."
            )
        if args.dry_run:
            print("--dry-run: no se llamó a Gemini ni se guardó nada.")
            return 0
        total = IndexResult()
        for attempt in range(MAX_WAITS + 1):
            try:
                result = index_catalog(db, user.id)
            except AiLimitError as error:
                # Lo ya indexado quedó guardado: se espera a que pase el minuto y se retoma.
                done = len(load_catalog()) - len(exercises_to_index(db, model)[0])
                if error.scope == "day" or attempt == MAX_WAITS:
                    print(f"Tope de embeddings alcanzado ({error.scope}). Hay {done} indexados; corré el script de nuevo más tarde.")
                    return 1
                print(f"Tope por minuto: espero {WAIT_SECONDS} s y sigo ({done} indexados)...")
                time.sleep(WAIT_SECONDS)
                continue
            total.indexed += result.indexed
            total.unchanged = result.unchanged
            total.removed += result.removed
            break
        print(
            f"Listo: {total.indexed} indexados, {total.unchanged} sin cambios, "
            f"{total.removed} vectores huérfanos borrados."
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())

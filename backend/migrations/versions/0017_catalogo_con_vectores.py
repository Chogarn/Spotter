"""catálogo de ejercicios con vectores (RAG, decisión 58)

Habilita la extensión `vector` de pgvector, crea `catalog_embeddings` (un vector de 768
dimensiones por ejercicio del catálogo) y suma el tipo `embed` a las llamadas a la IA.

Revision ID: 0017
Revises: 0016
Create Date: 2026-10-14 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '0017'
down_revision: Union[str, Sequence[str], None] = '0016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

KINDS = ('generate', 'adjust', 'week_close', 'repeat_exercise')
KINDS_CON_EMBED = KINDS + ('embed',)


def _lista(valores: Sequence[str]) -> str:
    return ", ".join(f"'{v}'" for v in valores)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        'catalog_embeddings',
        sa.Column('catalog_id', sa.String(length=64), nullable=False),
        sa.Column('text_hash', sa.String(length=64), nullable=False),
        sa.Column('model', sa.String(length=64), nullable=False),
        sa.Column('embedding', Vector(768), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('catalog_id'),
    )
    # Las restricciones CHECK no se modifican: se borra y se crea de nuevo.
    op.drop_constraint('ck_aicallkind', 'ai_calls', type_='check')
    op.create_check_constraint('ck_aicallkind', 'ai_calls', f"kind IN ({_lista(KINDS_CON_EMBED)})")


def downgrade() -> None:
    # Si hay filas 'embed', recrear la restricción falla a propósito (no se pierden datos).
    op.drop_constraint('ck_aicallkind', 'ai_calls', type_='check')
    op.create_check_constraint('ck_aicallkind', 'ai_calls', f"kind IN ({_lista(KINDS)})")
    op.drop_table('catalog_embeddings')
    # La extensión se deja instalada: otras tablas futuras pueden usarla.

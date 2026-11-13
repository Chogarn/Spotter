"""vectores de consulta del RAG guardados (decisión 139)

Crea `query_embeddings`: un vector de 768 dimensiones por objetivo y nivel (12 en total), calculado
una vez con `app.scripts.index_catalog`. Así "Generar rutina" no llama a ninguna API de embeddings.

Revision ID: 0033
Revises: 0032
Create Date: 2026-11-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision: str = "0033"
down_revision: Union[str, Sequence[str], None] = "0032"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "query_embeddings",
        sa.Column("goal", sa.String(length=32), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("text_hash", sa.String(length=64), nullable=False),
        sa.Column("model", sa.String(length=64), nullable=False),
        sa.Column("embedding", Vector(768), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("goal", "level"),
    )


def downgrade() -> None:
    op.drop_table("query_embeddings")

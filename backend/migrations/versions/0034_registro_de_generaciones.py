"""registro de generaciones (decisión 141)

Crea `generation_logs`: una fila por intento de "Generar rutina" con los parámetros, el resultado y los
códigos de las reglas que fallaron. Solo para el equipo; ninguna pantalla la muestra.

Revision ID: 0034
Revises: 0033
Create Date: 2026-11-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0034"
down_revision: Union[str, Sequence[str], None] = "0033"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generation_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("goal", sa.String(length=32), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("days", sa.SmallInteger(), nullable=True),
        sa.Column("split", sa.String(length=32), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=True),
        sa.Column("model", sa.String(length=96), nullable=True),
        sa.Column("attempt", sa.SmallInteger(), nullable=False),
        sa.Column("outcome", sa.String(length=24), nullable=False),
        sa.Column("codes", JSONB(), server_default="[]", nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("shown", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generation_logs_created_at", "generation_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_generation_logs_created_at", table_name="generation_logs")
    op.drop_table("generation_logs")

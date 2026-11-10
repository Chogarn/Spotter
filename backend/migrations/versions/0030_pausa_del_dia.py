"""pausa del día en el modo entrenar (decisión 121)

Revision ID: 0030
Revises: 0029
Create Date: 2026-11-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0030"
down_revision: Union[str, Sequence[str], None] = "0029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("workout_sessions", sa.Column("paused_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "workout_sessions",
        sa.Column("paused_seconds", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("workout_sessions", "paused_seconds")
    op.drop_column("workout_sessions", "paused_at")

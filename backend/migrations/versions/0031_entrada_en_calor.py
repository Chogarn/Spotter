"""entrada en calor con cronómetro (decisión 122)

Revision ID: 0031
Revises: 0030
Create Date: 2026-11-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0031"
down_revision: Union[str, Sequence[str], None] = "0030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("workout_sessions", sa.Column("warmup_minutes", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("workout_sessions", "warmup_minutes")

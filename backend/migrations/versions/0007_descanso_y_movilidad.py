"""descanso y movilidad

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-08 14:21:27.095458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0007'
down_revision: Union[str, Sequence[str], None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('plan_days', sa.Column('mobility_notes', sa.Text(), nullable=True))
    op.add_column('plan_exercises', sa.Column('rest_seconds', sa.Integer(), nullable=True))
    # Alembic no genera las restricciones CHECK: el descanso no puede ser negativo.
    op.create_check_constraint('ck_plan_exercises_rest', 'plan_exercises', 'rest_seconds >= 0')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ck_plan_exercises_rest', 'plan_exercises', type_='check')
    op.drop_column('plan_exercises', 'rest_seconds')
    op.drop_column('plan_days', 'mobility_notes')

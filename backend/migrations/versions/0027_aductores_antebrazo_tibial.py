"""aductores, antebrazo y tibial como grupos musculares

Revision ID: 0027
Revises: 0026
Create Date: 2026-10-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0027'
down_revision: Union[str, Sequence[str], None] = '0026'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ANTES = "'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'full_body'"
AHORA = "'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'adductors', 'forearm', 'tibialis', 'full_body'"


def upgrade() -> None:
    """Upgrade schema."""
    # Las restricciones CHECK no se modifican: se borra y se crea de nuevo.
    op.drop_constraint('ck_muscle', 'exercises', type_='check')
    op.create_check_constraint('ck_muscle', 'exercises', f"primary_muscle IN ({AHORA})")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM exercises WHERE primary_muscle IN ('adductors', 'forearm', 'tibialis') "
               "AND id NOT IN (SELECT exercise_id FROM plan_exercises)")
    op.drop_constraint('ck_muscle', 'exercises', type_='check')
    op.create_check_constraint('ck_muscle', 'exercises', f"primary_muscle IN ({ANTES})")

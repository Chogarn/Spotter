"""ejercicios isometricos con duracion en segundos

Revision ID: 0010
Revises: 0009
Create Date: 2026-10-08 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0010'
down_revision: Union[str, Sequence[str], None] = '0009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TRES = (
    "(CASE WHEN reps IS NOT NULL THEN 1 ELSE 0 END"
    " + CASE WHEN duration_minutes IS NOT NULL THEN 1 ELSE 0 END"
    " + CASE WHEN duration_seconds IS NOT NULL THEN 1 ELSE 0 END) = 1"
)
DOS = '(reps IS NOT NULL) <> (duration_minutes IS NOT NULL)'


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('plan_sets', sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('set_entries', sa.Column('duration_seconds', sa.Integer(), nullable=True))

    # Las restricciones CHECK no se modifican: se borran y se crean de nuevo.
    op.drop_constraint('ck_plan_sets_reps_or_duration', 'plan_sets', type_='check')
    op.drop_constraint('ck_set_entries_reps_or_duration', 'set_entries', type_='check')
    op.create_check_constraint('ck_plan_sets_reps_or_duration', 'plan_sets', TRES)
    op.create_check_constraint('ck_set_entries_reps_or_duration', 'set_entries', TRES)

    op.drop_constraint('ck_exercisekind', 'exercises', type_='check')
    op.create_check_constraint(
        'ck_exercisekind', 'exercises', "kind IN ('strength', 'cardio', 'isometric')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Si ya hay series o ejercicios isométricos, volver atrás falla a propósito (no se pierden datos).
    op.drop_constraint('ck_exercisekind', 'exercises', type_='check')
    op.create_check_constraint('ck_exercisekind', 'exercises', "kind IN ('strength', 'cardio')")

    op.drop_constraint('ck_set_entries_reps_or_duration', 'set_entries', type_='check')
    op.drop_constraint('ck_plan_sets_reps_or_duration', 'plan_sets', type_='check')
    op.create_check_constraint('ck_plan_sets_reps_or_duration', 'plan_sets', DOS)
    op.create_check_constraint('ck_set_entries_reps_or_duration', 'set_entries', DOS)

    op.drop_column('set_entries', 'duration_seconds')
    op.drop_column('plan_sets', 'duration_seconds')

"""el usuario elige cuántos días por semana entrena (decisión 52)

Suma `routines.days_per_week` (2 a 6). Las rutinas que ya existen toman la cantidad de días
de su semana más nueva.

Revision ID: 0016
Revises: 0015
Create Date: 2026-10-13 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0016'
down_revision: Union[str, Sequence[str], None] = '0015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('routines', sa.Column('days_per_week', sa.SmallInteger(), nullable=True))
    op.create_check_constraint(
        'ck_routines_days_per_week', 'routines', 'days_per_week BETWEEN 2 AND 6'
    )
    # La semana más nueva es la última que se activó (mismo orden que usa la app).
    op.execute(
        """
        UPDATE routines r SET days_per_week = (
            SELECT count(*) FROM plan_days d
            WHERE d.week_plan_id = (
                SELECT w.id FROM week_plans w
                WHERE w.routine_id = r.id
                ORDER BY w.week_start DESC, w.id DESC
                LIMIT 1
            )
        )
        WHERE EXISTS (SELECT 1 FROM week_plans w WHERE w.routine_id = r.id)
        """
    )


def downgrade() -> None:
    op.drop_constraint('ck_routines_days_per_week', 'routines', type_='check')
    op.drop_column('routines', 'days_per_week')

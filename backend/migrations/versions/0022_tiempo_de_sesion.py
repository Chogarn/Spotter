"""tiempo de la sesión elegido por el usuario y hora de inicio del día

Decisión 82: el usuario elige cuánto quiere que dure cada sesión (`routines.session_minutes`) y
el modo entrenar mide cuánto tardó (`workout_sessions.started_at`, desde "Empezar día" hasta "Día
completado"). Nulos en las rutinas y sesiones anteriores.

Revision ID: 0022
Revises: 0021
Create Date: 2026-10-17 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0022'
down_revision: Union[str, Sequence[str], None] = '0021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('routines', sa.Column('session_minutes', sa.SmallInteger(), nullable=True))
    op.create_check_constraint(
        'ck_routines_session_minutes', 'routines', 'session_minutes BETWEEN 30 AND 120'
    )
    op.add_column('workout_sessions', sa.Column('started_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('workout_sessions', 'started_at')
    op.drop_constraint('ck_routines_session_minutes', 'routines', type_='check')
    op.drop_column('routines', 'session_minutes')

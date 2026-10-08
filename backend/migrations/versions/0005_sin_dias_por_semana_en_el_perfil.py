"""sin dias por semana en el perfil

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-08 13:33:55.282996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # La restricción ck_profiles_days (1 a 7) se elimina sola junto con la columna.
    op.drop_column('profiles', 'days_per_week')


def downgrade() -> None:
    """Downgrade schema."""
    # Al volver atrás la columna es obligatoria: se recrea con 5 (los días por defecto)
    # para no fallar si ya hay perfiles, y se vuelve a poner la restricción de 1 a 7.
    op.add_column('profiles', sa.Column('days_per_week', sa.INTEGER(), autoincrement=False, nullable=False, server_default='5'))
    op.alter_column('profiles', 'days_per_week', server_default=None)
    op.create_check_constraint('ck_profiles_days', 'profiles', 'days_per_week BETWEEN 1 AND 7')

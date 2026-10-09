"""objetivo y nivel por semana; sin nivel, objetivo ni equipamiento en el perfil

Revision ID: 0012
Revises: 0011
Create Date: 2026-10-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0012'
down_revision: Union[str, Sequence[str], None] = '0011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GOALS = ('masa', 'fuerza', 'perder_grasa', 'condicion_general', 'mantenerme_activo')
LEVELS = ('principiante', 'intermedio', 'avanzado')
EQUIPMENT = ('gimnasio', 'mancuernas', 'casa')


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('week_plans', sa.Column('goal', sa.Enum(*GOALS, name='ck_goal', native_enum=False, create_constraint=True, length=32), nullable=True))
    op.add_column('week_plans', sa.Column('level', sa.Enum(*LEVELS, name='ck_level', native_enum=False, create_constraint=True, length=32), nullable=True))
    # Las semanas que ya existen conservan lo que el usuario tenía en el perfil.
    op.execute(
        "UPDATE week_plans SET goal = p.goal, level = p.level "
        "FROM profiles p WHERE p.user_id = week_plans.user_id"
    )
    op.drop_column('profiles', 'level')
    op.drop_column('profiles', 'goal')
    op.drop_column('profiles', 'equipment')


def downgrade() -> None:
    """Downgrade schema."""
    # Al volver atrás las columnas son obligatorias: se recrean con un valor por defecto.
    op.add_column('profiles', sa.Column('level', sa.Enum(*LEVELS, name='ck_level', native_enum=False, create_constraint=True, length=32), nullable=False, server_default='intermedio'))
    op.add_column('profiles', sa.Column('goal', sa.Enum(*GOALS, name='ck_goal', native_enum=False, create_constraint=True, length=32), nullable=False, server_default='condicion_general'))
    op.add_column('profiles', sa.Column('equipment', sa.Enum(*EQUIPMENT, name='ck_equipment', native_enum=False, create_constraint=True, length=32), nullable=False, server_default='gimnasio'))
    op.alter_column('profiles', 'level', server_default=None)
    op.alter_column('profiles', 'goal', server_default=None)
    op.alter_column('profiles', 'equipment', server_default=None)
    op.drop_column('week_plans', 'level')
    op.drop_column('week_plans', 'goal')

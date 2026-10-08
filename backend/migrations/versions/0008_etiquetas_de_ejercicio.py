"""etiquetas de ejercicio

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-08 14:30:34.454619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0008'
down_revision: Union[str, Sequence[str], None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Las columnas son obligatorias. Para no fallar si ya hubiera ejercicios, se agregan con un
    # valor provisorio (server_default) que enseguida se quita: la IA asigna las etiquetas reales.
    op.add_column('exercises', sa.Column('region', sa.Enum('upper', 'lower', 'core', 'full_body', name='ck_exerciseregion', native_enum=False, create_constraint=True, length=32), server_default='full_body', nullable=False))
    op.add_column('exercises', sa.Column('direction', sa.Enum('push', 'pull', 'none', name='ck_exercisedirection', native_enum=False, create_constraint=True, length=32), server_default='none', nullable=False))
    op.add_column('exercises', sa.Column('primary_muscle', sa.Enum('chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'full_body', name='ck_muscle', native_enum=False, create_constraint=True, length=32), server_default='full_body', nullable=False))
    op.add_column('exercises', sa.Column('secondary_muscles', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), server_default='[]', nullable=False))
    op.add_column('exercises', sa.Column('mechanic', sa.Enum('compound', 'isolation', name='ck_exercisemechanic', native_enum=False, create_constraint=True, length=32), server_default='compound', nullable=False))
    op.add_column('exercises', sa.Column('equipment', sa.Enum('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'kettlebell', 'other', name='ck_exerciseequipment', native_enum=False, create_constraint=True, length=32), server_default='other', nullable=False))
    op.add_column('exercises', sa.Column('level', sa.Enum('principiante', 'intermedio', 'avanzado', name='ck_level', native_enum=False, create_constraint=True, length=32), server_default='principiante', nullable=False))
    for columna in ('region', 'direction', 'primary_muscle', 'mechanic', 'equipment', 'level'):
        op.alter_column('exercises', columna, server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('exercises', 'level')
    op.drop_column('exercises', 'equipment')
    op.drop_column('exercises', 'mechanic')
    op.drop_column('exercises', 'secondary_muscles')
    op.drop_column('exercises', 'primary_muscle')
    op.drop_column('exercises', 'direction')
    op.drop_column('exercises', 'region')

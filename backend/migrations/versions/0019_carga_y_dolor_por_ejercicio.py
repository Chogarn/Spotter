"""carga y dolor marcados por ejercicio

Decisión 74: al terminar un ejercicio se puede marcar, de forma opcional e independiente, cómo se
sintió la carga y si hubo dolor. Las dos columnas son nulas (sin dato) y viven en
`exercise_completions`.

Revision ID: 0019
Revises: 0018
Create Date: 2026-10-16 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0019'
down_revision: Union[str, Sequence[str], None] = '0018'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('exercise_completions', sa.Column('load_feel', sa.Enum('light', 'good', 'heavy', 'very_heavy', name='ck_loadfeel', native_enum=False, create_constraint=True, length=32), nullable=True))
    op.add_column('exercise_completions', sa.Column('pain', sa.Enum('mild', 'moderate', 'strong', name='ck_painlevel', native_enum=False, create_constraint=True, length=32), nullable=True))


def downgrade() -> None:
    op.drop_column('exercise_completions', 'pain')
    op.drop_column('exercise_completions', 'load_feel')

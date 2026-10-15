"""fecha de nacimiento en el perfil

La edad pasa a calcularse desde la fecha de nacimiento. La columna `age` se conserva: los
perfiles que ya existen solo la tienen a ella, y se completa `birth_date` cuando la persona
carga su fecha.

Revision ID: 0018
Revises: 0017
Create Date: 2026-10-15 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0018'
down_revision: Union[str, Sequence[str], None] = '0017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('birth_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('profiles', 'birth_date')

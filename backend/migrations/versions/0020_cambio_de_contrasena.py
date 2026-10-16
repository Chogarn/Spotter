"""fecha del último cambio de contraseña

Decisión 80: al cambiar la contraseña se cierran las sesiones de los demás aparatos. Para saber
cuáles son, se guarda cuándo se cambió: una sesión emitida antes de esa fecha ya no vale. Nula =
nunca se cambió.

Revision ID: 0020
Revises: 0019
Create Date: 2026-10-16 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0020'
down_revision: Union[str, Sequence[str], None] = '0019'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'password_changed_at')

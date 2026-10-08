"""sin duracion de sesion en el perfil

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-08 13:50:10.820211

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('profiles', 'session_minutes')


def downgrade() -> None:
    """Downgrade schema."""
    # Al volver atrás la columna es obligatoria: se recrea con 60 para no fallar si ya hay perfiles.
    op.add_column('profiles', sa.Column('session_minutes', sa.INTEGER(), autoincrement=False, nullable=False, server_default='60'))
    op.alter_column('profiles', 'session_minutes', server_default=None)

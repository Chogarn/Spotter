"""las llamadas a la IA sobreviven al borrado de la cuenta

Revision ID: 0025
Revises: 0024
Create Date: 2026-10-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0025"
down_revision: Union[str, Sequence[str], None] = "0024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FK = "ai_calls_user_id_fkey"


def upgrade() -> None:
    # Borrar un usuario no borra sus llamadas (cuentan para los topes): solo pierden el vínculo.
    op.drop_constraint(FK, "ai_calls", type_="foreignkey")
    op.alter_column("ai_calls", "user_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(FK, "ai_calls", "users", ["user_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    # Las llamadas de cuentas ya borradas quedan sin dueño: no se pueden volver a exigir.
    op.drop_constraint(FK, "ai_calls", type_="foreignkey")
    op.execute("DELETE FROM ai_calls WHERE user_id IS NULL")
    op.alter_column("ai_calls", "user_id", existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key(FK, "ai_calls", "users", ["user_id"], ["id"], ondelete="RESTRICT")

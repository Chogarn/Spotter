"""mediciones de cuerpo: peso y grasa corporal con fecha

Decisión 87: el peso deja de ser un solo valor en el perfil y pasa a ser un seguimiento con
historial. Cada medición tiene su fecha, el peso y, si la persona quiere, la grasa corporal; puede
quedar ligada a la semana en que se cargó (al cerrarla). Se parte del peso actual de cada perfil
como primera medición, con la fecha de hoy.

Revision ID: 0023
Revises: 0022
Create Date: 2026-10-23 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0023'
down_revision: Union[str, Sequence[str], None] = '0022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'body_measurements',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('measured_on', sa.Date(), nullable=False),
        sa.Column('weight_kg', sa.Numeric(5, 2), nullable=False),
        sa.Column('body_fat_pct', sa.Numeric(4, 1), nullable=True),
        sa.Column('week_plan_id', sa.Integer(), sa.ForeignKey('week_plans.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'measured_on', name='uq_body_measurements_user_day'),
        sa.CheckConstraint('weight_kg BETWEEN 30 AND 300', name='ck_body_measurements_weight'),
        sa.CheckConstraint('body_fat_pct IS NULL OR body_fat_pct BETWEEN 2 AND 70', name='ck_body_measurements_fat'),
    )
    op.execute(
        "INSERT INTO body_measurements (user_id, measured_on, weight_kg) "
        "SELECT user_id, CURRENT_DATE, weight_kg FROM profiles"
    )


def downgrade() -> None:
    op.drop_table('body_measurements')

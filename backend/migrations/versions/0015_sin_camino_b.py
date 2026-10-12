"""se descarta el camino B (cargar la rutina que ya hace y mejorarla)

Quita `week_plans.origin` y `week_plans.original_routine`, y el tipo `improve`
de las propuestas y de las llamadas a la IA.

Revision ID: 0015
Revises: 0014
Create Date: 2026-10-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0015'
down_revision: Union[str, Sequence[str], None] = '0014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

KINDS = ('generate', 'adjust', 'week_close', 'repeat_exercise')
KINDS_CON_IMPROVE = ('generate', 'adjust', 'week_close', 'improve', 'repeat_exercise')


def _lista(valores: Sequence[str]) -> str:
    return ", ".join(f"'{v}'" for v in valores)


def upgrade() -> None:
    """Upgrade schema."""
    # Las restricciones CHECK no se modifican: se borran y se crean de nuevo.
    # Si hubiera filas con 'improve', crear la nueva falla a propósito (no se pierden datos).
    for tabla, nombre in (('plan_proposals', 'ck_proposalkind'), ('ai_calls', 'ck_aicallkind')):
        op.drop_constraint(nombre, tabla, type_='check')
        op.create_check_constraint(nombre, tabla, f"kind IN ({_lista(KINDS)})")

    op.drop_constraint('ck_planorigin', 'week_plans', type_='check')
    op.drop_column('week_plans', 'origin')
    op.drop_column('week_plans', 'original_routine')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'week_plans',
        sa.Column(
            'original_routine',
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'),
            nullable=True,
        ),
    )
    # Todas las semanas existentes las armó la IA desde cero.
    op.add_column(
        'week_plans',
        sa.Column('origin', sa.String(length=32), server_default='generated', nullable=False),
    )
    op.alter_column('week_plans', 'origin', server_default=None)
    op.create_check_constraint('ck_planorigin', 'week_plans', "origin IN ('generated', 'improved')")

    for tabla, nombre in (('ai_calls', 'ck_aicallkind'), ('plan_proposals', 'ck_proposalkind')):
        op.drop_constraint(nombre, tabla, type_='check')
        op.create_check_constraint(nombre, tabla, f"kind IN ({_lista(KINDS_CON_IMPROVE)})")

"""unificar condición general y mantenerme activo en un solo objetivo

Revision ID: 0028
Revises: 0027
Create Date: 2026-10-26 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0028'
down_revision: Union[str, Sequence[str], None] = '0027'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ANTES = "'masa', 'fuerza', 'perder_grasa', 'condicion_general', 'mantenerme_activo'"
AHORA = "'masa', 'fuerza', 'perder_grasa', 'mantenerme_activo'"


def upgrade() -> None:
    """Upgrade schema."""
    # Las rutinas con "condición general" pasan a "mantenerme activo", con su nombre automático.
    op.execute("UPDATE routines SET goal = 'mantenerme_activo' WHERE goal = 'condicion_general'")
    op.execute("UPDATE routines SET name = 'Mantenerme activo' || substr(name, length('Condición general') + 1) "
               "WHERE name LIKE 'Condición general%'")
    # Las propuestas guardadas llevan el objetivo en sus cambios (JSON).
    op.execute("UPDATE plan_proposals "
               "SET proposed_changes = replace(proposed_changes::text, '\"condicion_general\"', '\"mantenerme_activo\"')::jsonb "
               "WHERE proposed_changes::text LIKE '%condicion_general%'")
    # Las restricciones CHECK no se modifican: se borra y se crea de nuevo.
    op.drop_constraint('ck_goal', 'routines', type_='check')
    op.create_check_constraint('ck_goal', 'routines', f"goal IN ({AHORA})")


def downgrade() -> None:
    """Downgrade schema."""
    # Las rutinas unificadas siguen como "mantenerme activo": no hay cómo separarlas de nuevo.
    op.drop_constraint('ck_goal', 'routines', type_='check')
    op.create_check_constraint('ck_goal', 'routines', f"goal IN ({ANTES})")

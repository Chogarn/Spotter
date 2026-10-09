"""rutinas: agrupan las semanas y llevan el objetivo y el nivel

Revision ID: 0013
Revises: 0012
Create Date: 2026-10-09 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0013'
down_revision: Union[str, Sequence[str], None] = '0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GOALS = ('masa', 'fuerza', 'perder_grasa', 'condicion_general', 'mantenerme_activo')
LEVELS = ('principiante', 'intermedio', 'avanzado')
LABEL = {
    'masa': 'Masa',
    'fuerza': 'Fuerza',
    'perder_grasa': 'Perder grasa',
    'condicion_general': 'Condición general',
    'mantenerme_activo': 'Mantenerme activo',
}


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'routines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('goal', sa.Enum(*GOALS, name='ck_goal', native_enum=False, create_constraint=True, length=32), nullable=False),
        sa.Column('level', sa.Enum(*LEVELS, name='ck_level', native_enum=False, create_constraint=True, length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('week_plans', sa.Column('routine_id', sa.Integer(), nullable=True))

    # Una rutina por cada usuario, objetivo y nivel distintos de las semanas que ya existen.
    bind = op.get_bind()
    groups = bind.execute(sa.text(
        "SELECT user_id, COALESCE(goal, 'condicion_general'), COALESCE(level, 'intermedio'), "
        "MIN(week_start) FROM week_plans GROUP BY 1, 2, 3 ORDER BY 4, 1"
    )).fetchall()
    taken: dict[int, set[str]] = {}
    for user_id, goal, level, first_start in groups:
        names = taken.setdefault(user_id, set())
        base = f"{LABEL[goal]} · desde el {first_start.day}/{first_start.month}"
        name, number = base, 2
        while name in names:
            name, number = f"{base} {number}", number + 1
        names.add(name)
        routine_id = bind.execute(sa.text(
            "INSERT INTO routines (user_id, name, goal, level) "
            "VALUES (:u, :n, :g, :l) RETURNING id"
        ), {'u': user_id, 'n': name, 'g': goal, 'l': level}).scalar_one()
        bind.execute(sa.text(
            "UPDATE week_plans SET routine_id = :r WHERE user_id = :u "
            "AND COALESCE(goal, 'condicion_general') = :g AND COALESCE(level, 'intermedio') = :l"
        ), {'r': routine_id, 'u': user_id, 'g': goal, 'l': level})

    op.alter_column('week_plans', 'routine_id', nullable=False)
    op.create_foreign_key('week_plans_routine_id_fkey', 'week_plans', 'routines', ['routine_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_week_plans_routine', 'week_plans', ['routine_id'])
    op.drop_column('week_plans', 'goal')
    op.drop_column('week_plans', 'level')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('week_plans', sa.Column('goal', sa.Enum(*GOALS, name='ck_goal', native_enum=False, create_constraint=True, length=32), nullable=True))
    op.add_column('week_plans', sa.Column('level', sa.Enum(*LEVELS, name='ck_level', native_enum=False, create_constraint=True, length=32), nullable=True))
    op.execute(
        "UPDATE week_plans SET goal = r.goal, level = r.level "
        "FROM routines r WHERE r.id = week_plans.routine_id"
    )
    op.drop_index('ix_week_plans_routine', table_name='week_plans')
    op.drop_constraint('week_plans_routine_id_fkey', 'week_plans', type_='foreignkey')
    op.drop_column('week_plans', 'routine_id')
    op.drop_table('routines')

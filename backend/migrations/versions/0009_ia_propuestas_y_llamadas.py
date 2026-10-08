"""propuestas de la IA y registro de llamadas a Gemini

Revision ID: 0009
Revises: 0008
Create Date: 2026-10-08 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0009'
down_revision: Union[str, Sequence[str], None] = '0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

KINDS = ('generate', 'adjust', 'week_close', 'improve', 'repeat_exercise')


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'plan_proposals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('week_plan_id', sa.Integer(), nullable=True),
        sa.Column('kind', sa.Enum(*KINDS, name='ck_proposalkind', native_enum=False, create_constraint=True, length=32), nullable=False),
        sa.Column('request_text', sa.Text(), nullable=True),
        sa.Column('proposed_changes', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'accepted', 'discarded', name='ck_proposalstatus', native_enum=False, create_constraint=True, length=32), server_default='pending', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['week_plan_id'], ['week_plans.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_plan_proposals_user_status', 'plan_proposals', ['user_id', 'status'])

    op.create_table(
        'ai_calls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.Enum(*KINDS, name='ck_aicallkind', native_enum=False, create_constraint=True, length=32), nullable=False),
        sa.Column('model', sa.String(length=64), nullable=False),
        sa.Column('succeeded', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_calls_created_at', 'ai_calls', ['created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_ai_calls_created_at', table_name='ai_calls')
    op.drop_table('ai_calls')
    op.drop_index('ix_plan_proposals_user_status', table_name='plan_proposals')
    op.drop_table('plan_proposals')

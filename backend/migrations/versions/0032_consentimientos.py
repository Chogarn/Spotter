"""aviso legal versionado y consentimiento de datos de salud

Revision ID: 0032
Revises: 0031
Create Date: 2026-11-12
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0032"
down_revision: Union[str, Sequence[str], None] = "0031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("legal_notice_version", sa.String(length=20), nullable=True))
    op.add_column("profiles", sa.Column("health_consent_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("profiles", sa.Column("health_consent_version", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "health_consent_version")
    op.drop_column("profiles", "health_consent_at")
    op.drop_column("profiles", "legal_notice_version")

"""guarda el split elegido en cada rutina

Revision ID: 0024
Revises: 0023
Create Date: 2026-10-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0024"
down_revision: Union[str, Sequence[str], None] = "0023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SPLITS = ("full_body", "upper_lower", "ppl")


def upgrade() -> None:
    op.add_column(
        "routines",
        sa.Column(
            "split_type",
            sa.Enum(
                *SPLITS,
                name="ck_routinesplit",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_constraint("ck_routinesplit", "routines", type_="check")
    op.drop_column("routines", "split_type")

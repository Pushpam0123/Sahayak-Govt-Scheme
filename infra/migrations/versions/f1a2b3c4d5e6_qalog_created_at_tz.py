"""Make qa_logs.created_at timezone-aware.

The column was created as a naive TIMESTAMP while the model defaulted it to
datetime.now(timezone.utc). asyncpg rejects an aware value for a naive column,
so this is the same latent fault that was fixed for scheme_eligibility_rules.

Note: documents/schemes keep their naive columns deliberately -- ingest/run.py
converts through an explicit _naive_utc() helper at every call site and
documents that convention. Only qa_logs is brought in line here.

Revision ID: f1a2b3c4d5e6
Revises: eb6db114bc62
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "eb6db114bc62"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "qa_logs",
        "created_at",
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "qa_logs",
        "created_at",
        type_=sa.DateTime(),
        existing_nullable=False,
    )

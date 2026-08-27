"""Record which model produced each chunk embedding.

Vectors from different embedding models occupy different spaces. Mixing them
produces cosine similarities that look plausible and mean nothing, and there was
no way to tell a partially re-embedded corpus from a healthy one -- a failed
re-ingest left the database looking complete while search silently degraded.

Existing rows are left NULL: their provenance genuinely is unknown, and
back-filling a guess would be exactly the kind of invented fact this column
exists to prevent.

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chunks", sa.Column("embedding_model", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("chunks", "embedding_model")

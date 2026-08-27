"""Add Phase 2 provenance columns to scheme_eligibility_rules.

The Phase 2 model gained extracted_by/extracted_at/verified_by/verified_at/notes
without a matching migration, so every query against the table failed with
UndefinedColumnError on a freshly migrated database.

Note on what this migration deliberately does NOT do: --autogenerate also proposed
dropping ix_chunks_embedding (HNSW) and ix_chunks_tsv (GIN). Those indexes are
created outside the ORM metadata, so autogenerate reads them as removals. Dropping
them would silently destroy vector and full-text search performance, so they are
left alone here.

Revision ID: eb6db114bc62
Revises: c7e3a1d9e2b0
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'eb6db114bc62'
down_revision: Union[str, Sequence[str], None] = 'c7e3a1d9e2b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column('extracted_by', sa.String(), nullable=True),
    )
    # server_default so the NOT NULL can be applied to tables that already hold rows.
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column(
            'extracted_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column('verified_by', sa.String(), nullable=True),
    )
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'scheme_eligibility_rules',
        sa.Column('notes', sa.Text(), nullable=True),
    )
    # updated_at predates this migration as a naive TIMESTAMP, but the model has
    # always defaulted it to datetime.now(timezone.utc). asyncpg rejects an aware
    # value for a naive column, so any write to this table failed. Bring it in
    # line with the timezone-aware convention the auth tables already follow.
    op.alter_column(
        'scheme_eligibility_rules',
        'updated_at',
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'scheme_eligibility_rules',
        'updated_at',
        type_=sa.DateTime(),
        existing_nullable=False,
    )
    op.drop_column('scheme_eligibility_rules', 'notes')
    op.drop_column('scheme_eligibility_rules', 'verified_at')
    op.drop_column('scheme_eligibility_rules', 'verified_by')
    op.drop_column('scheme_eligibility_rules', 'extracted_at')
    op.drop_column('scheme_eligibility_rules', 'extracted_by')

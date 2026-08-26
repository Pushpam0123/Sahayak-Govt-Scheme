"""add rich citizen fields to schemes

The Scheme ORM model (api/models/scheme.py) has declared benefit_amount,
benefit_type, required_documents, application_mode, application_url,
deadlines, helpline, last_verified_at and tags since the "Phase 2
Coverage" work (PLAN.md), but no migration was ever written for them -
the schemes table in a real Postgres database still only has the eight
original Phase 0 baseline columns. ingest/run.py writes to all of these
fields on every run, so without this migration ingestion cannot complete
against any live database. Discovered while executing Phase 0 work order
A3 (re-index the verified corpus and run the eval harness) on 2026-08-26;
added here as the minimal, forced fix needed to make that possible. This
does NOT address the same drift for the users/organizations/api_keys
tables (Phase 1) or scheme_eligibility_rules.extracted_by/verified_by/
verified_at/notes (Phase 2), which remain un-migrated and are reported
separately.

Revision ID: f1c9a2b4d6e8
Revises: a3d27841fba3
Create Date: 2026-08-26 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB


# revision identifiers, used by Alembic.
revision: str = 'f1c9a2b4d6e8'
down_revision: Union[str, Sequence[str], None] = 'a3d27841fba3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('schemes', sa.Column('benefit_amount', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('benefit_type', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('required_documents', JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('schemes', sa.Column('application_mode', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('application_url', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('deadlines', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('helpline', sa.String(), nullable=True))
    op.add_column('schemes', sa.Column('last_verified_at', sa.DateTime(), nullable=True))
    op.add_column('schemes', sa.Column('tags', ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('schemes', 'tags')
    op.drop_column('schemes', 'last_verified_at')
    op.drop_column('schemes', 'helpline')
    op.drop_column('schemes', 'deadlines')
    op.drop_column('schemes', 'application_url')
    op.drop_column('schemes', 'application_mode')
    op.drop_column('schemes', 'required_documents')
    op.drop_column('schemes', 'benefit_type')
    op.drop_column('schemes', 'benefit_amount')

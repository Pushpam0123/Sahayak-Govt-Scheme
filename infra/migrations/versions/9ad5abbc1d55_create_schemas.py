"""create_schemas

Revision ID: 9ad5abbc1d55
Revises: 20d50ff0068d
Create Date: 2026-07-20 17:32:33.648257

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '9ad5abbc1d55'
down_revision: Union[str, Sequence[str], None] = '20d50ff0068d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Create schemes table
    op.create_table(
        'schemes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('ministry', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('official_url', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default="active"),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schemes_id'), 'schemes', ['id'], unique=False)
    op.create_index(op.f('ix_schemes_state'), 'schemes', ['state'], unique=False)
    op.create_index(op.f('ix_schemes_category'), 'schemes', ['category'], unique=False)

    # 3. Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('scheme_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('doc_type', sa.String(), nullable=False),
        sa.Column('lang', sa.String(), nullable=False, server_default="en"),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.Column('checksum', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('checksum')
    )
    op.create_index(op.f('ix_documents_scheme_id'), 'documents', ['scheme_id'], unique=False)

    # 4. Create chunks table
    op.create_table(
        'chunks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('seq', sa.Integer(), nullable=False),
        sa.Column('heading_path', sa.Text(), nullable=True),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('tokens', sa.Integer(), nullable=False),
        sa.Column('embedding', Vector(1024), nullable=True),
        sa.Column('tsv', TSVECTOR, nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chunks_document_id'), 'chunks', ['document_id'], unique=False)

    # 5. Create index on embedding (using HNSW) and GIN index on tsv
    op.execute("CREATE INDEX ix_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops)")
    op.execute("CREATE INDEX ix_chunks_tsv ON chunks USING gin (tsv)")
    
    # 6. Create trigger to automatically update full-text search vector (tsv) on text insertions/updates
    op.execute(
        "CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON chunks "
        "FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(tsv, 'pg_catalog.english', text)"
    )


def downgrade() -> None:
    # Drop trigger and tables
    op.execute("DROP TRIGGER IF EXISTS tsvectorupdate ON chunks")
    op.drop_index(op.f('ix_chunks_document_id'), table_name='chunks')
    op.drop_table('chunks')
    op.drop_index(op.f('ix_documents_scheme_id'), table_name='documents')
    op.drop_table('documents')
    op.drop_index(op.f('ix_schemes_category'), table_name='schemes')
    op.drop_index(op.f('ix_schemes_state'), table_name='schemes')
    op.drop_index(op.f('ix_schemes_id'), table_name='schemes')
    op.drop_table('schemes')

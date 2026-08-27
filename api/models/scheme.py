from datetime import datetime, timezone
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
from sqlalchemy.orm import relationship

from api.db import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(String, primary_key=True, index=True)  # slug-based ID, e.g., 'pm-kisan'
    name = Column(String, nullable=False)
    state = Column(String, nullable=False, index=True)  # State name or 'Central'
    ministry = Column(String, nullable=True)
    category = Column(
        String, nullable=False, index=True
    )  # e.g., 'Agriculture', 'Education'
    summary = Column(Text, nullable=True)
    official_url = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)  # active, stale, draft

    # Rich citizen fields (Phase 2)
    benefit_amount = Column(String, nullable=True)  # e.g., '₹6,000 / year'
    benefit_type = Column(
        String, nullable=True
    )  # e.g., 'Direct Benefit Transfer (DBT)', 'Insurance', 'Pension'
    required_documents: Any = Column(JSONB, nullable=True)  # list of strings
    application_mode = Column(
        String, nullable=True
    )  # 'online' | 'offline' | 'hybrid' | 'csc'
    application_url = Column(String, nullable=True)
    deadlines = Column(String, nullable=True)  # e.g., 'Rolling'
    helpline = Column(String, nullable=True)
    last_verified_at = Column(DateTime, nullable=True)
    tags: Any = Column(ARRAY(String), nullable=True)

    documents = relationship(
        "Document", back_populates="scheme", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Scheme(id={self.id}, name={self.name})>"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(
        String,
        ForeignKey("schemes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    doc_type = Column(String, nullable=False)  # 'pdf' or 'html'
    lang = Column(String, default="en", nullable=False)  # 'en' or 'hi'
    fetched_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    checksum = Column(
        String, nullable=False, unique=True
    )  # md5, for idempotency checks
    fetch_status = Column(
        String, nullable=False, server_default="fetched"
    )  # 'fetched' | 'cached' | 'failed'
    verified_at = Column(
        DateTime, nullable=True
    )  # set only when fetched live and successfully from a real URL
    content_sha256 = Column(String, nullable=True)
    tls_verified = Column(
        Boolean, nullable=False, server_default=text("true")
    )  # False if the fetch only succeeded after an explicit, opted-in
    # insecure (certificate-unverified) retry - see ingest/fetcher.py

    scheme = relationship("Scheme", back_populates="documents")
    chunks = relationship(
        "Chunk", back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title})>"


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    seq = Column(Integer, nullable=False)  # sequence order in document
    heading_path = Column(Text, nullable=True)  # e.g., "Eligibility > Exclusions"
    text = Column(Text, nullable=False)
    tokens = Column(Integer, nullable=False)
    embedding = Column(Vector(1024), nullable=True)
    # Which embedding model produced `embedding`. Vectors from different models
    # are not comparable: mixing them yields similarity scores that look
    # plausible and mean nothing. Recorded so a partially re-embedded corpus is
    # detectable instead of silent.
    embedding_model = Column(String, nullable=True)
    tsv = Column(TSVECTOR, nullable=True)  # Full-text search vector

    document = relationship("Document", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<Chunk(id={self.id}, document_id={self.document_id}, seq={self.seq})>"

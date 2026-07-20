from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import TSVECTOR
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
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    checksum = Column(String, nullable=False, unique=True)  # for idempotency checks

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
    embedding = Column(Vector(1024), nullable=True)  # Voyage 3.5 size is 1024
    tsv = Column(TSVECTOR, nullable=True)  # Full-text search vector

    document = relationship("Document", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<Chunk(id={self.id}, document_id={self.document_id}, seq={self.seq})>"

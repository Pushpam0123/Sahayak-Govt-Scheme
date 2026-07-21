from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

from api.db import Base


class QALog(Base):
    __tablename__ = "qa_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=True, index=True)
    question = Column(Text, nullable=False)
    lang = Column(String, default="en", nullable=False)
    retrieved_chunk_ids: Any = Column(ARRAY(Integer), nullable=True)
    answer = Column(Text, nullable=False)
    citations_json: Any = Column(JSONB, nullable=True)  # list of citation dicts
    groundedness_json: Any = Column(JSONB, nullable=True)  # per-sentence evaluation
    latency_ms = Column(Float, nullable=True)
    tokens_in = Column(Integer, nullable=True)
    tokens_out = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<QALog(id={self.id}, question={self.question[:30]}, lang={self.lang})>"

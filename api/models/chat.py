from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from api.db import Base


class QALog(Base):
    __tablename__ = "qa_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    lang: Mapped[str] = mapped_column(String, default="en", nullable=False)
    retrieved_chunk_ids: Mapped[Optional[Any]] = mapped_column(
        ARRAY(Integer), nullable=True
    )
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    # list of citation dicts
    citations_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    # per-sentence evaluation
    groundedness_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    latency_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tokens_in: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_out: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Timezone-aware to match the auth tables: a naive column with an aware
    # default is rejected by asyncpg at insert time.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<QALog(id={self.id}, question={self.question[:30]}, lang={self.lang})>"

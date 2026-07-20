from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY

from api.db import Base


class EvalCase(Base):
    __tablename__ = "eval_cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    gold_answer = Column(Text, nullable=True)
    gold_chunk_ids: Any = Column(ARRAY(Integer), nullable=True)
    category = Column(String, nullable=False)

    def __repr__(self) -> str:
        return (
            f"<EvalCase(id={self.id}, "
            f"question={self.question[:30]}, "
            f"category={self.category})>"
        )


class EvalRun(Base):
    __tablename__ = "eval_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    git_sha = Column(String, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Recall metrics
    recall_at_5 = Column(Float, nullable=True)
    vector_recall = Column(Float, nullable=True)
    fts_recall = Column(Float, nullable=True)
    hybrid_recall = Column(Float, nullable=True)

    # Other Phase 3/4 evaluation metrics
    citation_precision = Column(Float, nullable=True)
    faithfulness = Column(Float, nullable=True)

    # Latency & details
    avg_latency_ms = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<EvalRun(id={self.id}, "
            f"git_sha={self.git_sha[:7]}, "
            f"hybrid_recall={self.hybrid_recall})>"
        )

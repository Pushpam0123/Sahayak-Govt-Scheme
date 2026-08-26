from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from api.db import Base


class SchemeEligibilityRules(Base):
    __tablename__ = "scheme_eligibility_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(
        String,
        ForeignKey("schemes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    rules_json: Any = Column(JSONB, nullable=False)
    is_verified: Any = Column(Boolean, default=False, nullable=False)
    extracted_by = Column(String, default="llm", nullable=True)  # 'llm' | 'human' | 'seed'
    extracted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<SchemeEligibilityRules(id={self.id}, "
            f"scheme_id={self.scheme_id}, "
            f"is_verified={self.is_verified})>"
        )

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
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
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<SchemeEligibilityRules(id={self.id}, "
            f"scheme_id={self.scheme_id}, "
            f"is_verified={self.is_verified})>"
        )

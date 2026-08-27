from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from api.db import Base


class SchemeEligibilityRules(Base):
    __tablename__ = "scheme_eligibility_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("schemes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    rules_json: Mapped[Any] = mapped_column(JSONB, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 'llm' | 'human' | 'seed'
    extracted_by: Mapped[Optional[str]] = mapped_column(
        String, default="llm", nullable=True
    )
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    verified_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<SchemeEligibilityRules(id={self.id}, "
            f"scheme_id={self.scheme_id}, "
            f"is_verified={self.is_verified})>"
        )

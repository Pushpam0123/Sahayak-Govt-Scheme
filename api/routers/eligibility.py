from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.db import get_db
from api.models.eligibility import SchemeEligibilityRules
from api.models.scheme import Scheme
from api.services.matcher import match_citizen_profile

router = APIRouter()


class ProfileRequest(BaseModel):
    age: Optional[int] = None
    state: Optional[str] = None
    gender: Optional[str] = None
    caste: Optional[str] = None
    annual_income: Optional[float] = None
    landholding_acres: Optional[float] = None


@router.post("/eligibility/match-all")
async def match_all_schemes(
    request: ProfileRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Matches a citizen profile against eligibility criteria for all schemes in DB."""
    try:
        # 1. Fetch all schemes to establish a base eligibility list
        stmt_schemes = select(Scheme.id)
        res_schemes = await db.execute(stmt_schemes)
        scheme_ids = res_schemes.scalars().all()

        results = {sid: {"eligible": True, "failed_rules": []} for sid in scheme_ids}

        # 2. Fetch all defined eligibility rules
        stmt_rules = select(SchemeEligibilityRules)
        res_rules = await db.execute(stmt_rules)
        rules_records = res_rules.scalars().all()

        profile_dict = request.dict()

        # 3. Match profile against each rule
        for r in rules_records:
            sid = str(r.scheme_id)
            if sid in results:
                eligible, failed_rules = match_citizen_profile(
                    profile_dict, r.rules_json
                )
                results[sid] = {
                    "eligible": eligible,
                    "failed_rules": failed_rules,
                }

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eligibility matching failed: {str(e)}",
        )

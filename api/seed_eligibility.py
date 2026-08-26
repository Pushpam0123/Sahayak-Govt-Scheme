import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from api.db import AsyncSessionLocal
from api.models.eligibility import SchemeEligibilityRules
from api.models.scheme import Scheme  # noqa: F401

logger = logging.getLogger("sahayak.seed.eligibility")
logging.basicConfig(level=logging.INFO)

SEEDED_RULES = {
    "pm-kisan": {
        "min_age": 18,
        "max_age": None,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "pm-fby": {
        "min_age": 18,
        "max_age": None,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "pm-jjby": {
        "min_age": 18,
        "max_age": 50,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "pm-sby": {
        "min_age": 18,
        "max_age": 70,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "atal-pension-yojana": {
        "min_age": 18,
        "max_age": 40,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "pm-matru-vandana": {
        "min_age": 19,
        "max_age": 45,
        "states": ["Any"],
        "genders": ["Female"],
        "castes": ["Any"],
        "max_income": 800000.0,
        "max_landholding_acres": None,
    },
    "stand-up-india": {
        "min_age": 18,
        "max_age": None,
        "states": ["Any"],
        "genders": ["Female", "Any"],
        "castes": ["SC", "ST", "Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
    "mp-ladli-behna": {
        "min_age": 21,
        "max_age": 60,
        "states": ["Madhya Pradesh"],
        "genders": ["Female"],
        "castes": ["Any"],
        "max_income": 250000.0,
        "max_landholding_acres": 5.0,
    },
    "ka-gruha-jyothi": {
        "min_age": 18,
        "max_age": None,
        "states": ["Karnataka"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": None,
    },
}


async def main() -> None:
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        for scheme_id, rules in SEEDED_RULES.items():
            stmt = select(SchemeEligibilityRules).where(
                SchemeEligibilityRules.scheme_id == scheme_id
            )
            res = await db.execute(stmt)
            existing = res.scalars().first()

            if existing:
                logger.info(f"Rules for scheme '{scheme_id}' already exist. Updating...")
                existing.rules_json = rules
                existing.is_verified = True
                existing.verified_by = "seed-harness"
                existing.verified_at = now
            else:
                logger.info(f"Seeding rules for scheme '{scheme_id}'...")
                new_rule = SchemeEligibilityRules(
                    scheme_id=scheme_id,
                    rules_json=rules,
                    is_verified=True,
                    extracted_by="seed",
                    extracted_at=now,
                    verified_by="seed-harness",
                    verified_at=now,
                )
                db.add(new_rule)

        await db.commit()
        logger.info("Successfully seeded verified eligibility rules for all 9 schemes.")


if __name__ == "__main__":
    asyncio.run(main())

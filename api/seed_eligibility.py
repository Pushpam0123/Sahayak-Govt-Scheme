import asyncio
import logging

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
        "max_landholding_acres": 5.0,
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
    "nsp-post-matric": {
        "min_age": 15,
        "max_age": 30,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["OBC", "SC", "ST"],
        "max_income": 250000.0,
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
}


async def main() -> None:
    async with AsyncSessionLocal() as db:
        for scheme_id, rules in SEEDED_RULES.items():
            # Check if scheme rules record already exists
            stmt = select(SchemeEligibilityRules).where(
                SchemeEligibilityRules.scheme_id == scheme_id
            )
            res = await db.execute(stmt)
            existing = res.scalars().first()

            if existing:
                logger.info(
                    f"Rules for scheme '{scheme_id}' already exist. Updating..."
                )
                existing.rules_json = rules
                existing.is_verified = True
            else:
                logger.info(f"Seeding rules for scheme '{scheme_id}'...")
                new_rule = SchemeEligibilityRules(
                    scheme_id=scheme_id,
                    rules_json=rules,
                    is_verified=True,
                )
                db.add(new_rule)

        await db.commit()
        logger.info("Successfully seeded eligibility rules.")


if __name__ == "__main__":
    asyncio.run(main())

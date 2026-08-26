from typing import Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app
from api.models.eligibility import SchemeEligibilityRules


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock()
    return session


@pytest.fixture
def client(mock_db: AsyncMock) -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


DEFAULT_PROFILE = {
    "age": 30,
    "state": "Central",
    "gender": "Female",
    "caste": "General",
    "annual_income": 100000,
    "landholding_acres": 1.0,
}


def test_scheme_with_no_rules_row_is_unknown_never_eligible(
    client: TestClient, mock_db: AsyncMock
) -> None:
    """A scheme with no SchemeEligibilityRules row must come back
    'unknown' - never 'eligible'. This is the whole point of 0.4: unknown
    must never render as an unearned 'yes'."""
    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = ["scheme-with-no-rules"]

    mock_rules_res = MagicMock()
    mock_rules_res.scalars().all.return_value = []  # No rules exist at all.

    mock_db.execute.side_effect = [mock_schemes_res, mock_rules_res]

    response = client.post("/api/v1/eligibility/match-all", json=DEFAULT_PROFILE)

    assert response.status_code == 200
    data = response.json()
    assert data == {"scheme-with-no-rules": {"status": "unknown", "failed_rules": []}}
    assert data["scheme-with-no-rules"]["status"] != "eligible"


def test_scheme_with_matching_rule_is_eligible(
    client: TestClient, mock_db: AsyncMock
) -> None:
    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = ["scheme-a"]

    rule = SchemeEligibilityRules(
        id=1,
        scheme_id="scheme-a",
        rules_json={"min_age": 18},
        is_verified=True,
    )
    mock_rules_res = MagicMock()
    mock_rules_res.scalars().all.return_value = [rule]

    mock_db.execute.side_effect = [mock_schemes_res, mock_rules_res]

    response = client.post("/api/v1/eligibility/match-all", json=DEFAULT_PROFILE)

    assert response.status_code == 200
    data = response.json()
    assert data == {"scheme-a": {"status": "eligible", "failed_rules": []}}


def test_scheme_with_failing_rule_is_ineligible(
    client: TestClient, mock_db: AsyncMock
) -> None:
    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = ["scheme-b"]

    rule = SchemeEligibilityRules(
        id=2,
        scheme_id="scheme-b",
        rules_json={"min_age": 60},
        is_verified=True,
    )
    mock_rules_res = MagicMock()
    mock_rules_res.scalars().all.return_value = [rule]

    mock_db.execute.side_effect = [mock_schemes_res, mock_rules_res]

    response = client.post("/api/v1/eligibility/match-all", json=DEFAULT_PROFILE)

    assert response.status_code == 200
    data = response.json()
    assert data["scheme-b"]["status"] == "ineligible"
    assert len(data["scheme-b"]["failed_rules"]) > 0


def test_mixed_schemes_only_evaluated_ones_leave_unknown(
    client: TestClient, mock_db: AsyncMock
) -> None:
    """A scheme with a rule row is decided; a scheme without one stays
    'unknown' in the very same response."""
    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = ["scheme-a", "scheme-with-no-rules"]

    rule = SchemeEligibilityRules(
        id=1,
        scheme_id="scheme-a",
        rules_json={"min_age": 18},
        is_verified=True,
    )
    mock_rules_res = MagicMock()
    mock_rules_res.scalars().all.return_value = [rule]

    mock_db.execute.side_effect = [mock_schemes_res, mock_rules_res]

    response = client.post("/api/v1/eligibility/match-all", json=DEFAULT_PROFILE)

    assert response.status_code == 200
    data = response.json()
    assert data["scheme-a"]["status"] == "eligible"
    assert data["scheme-with-no-rules"]["status"] == "unknown"

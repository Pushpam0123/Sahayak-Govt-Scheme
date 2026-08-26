from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from api.config import settings
from api.db import get_db
from api.main import app
from api.models.eligibility import SchemeEligibilityRules
from api.models.scheme import Chunk, Scheme


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock()
    return session


@pytest.fixture
def client(mock_db: AsyncMock):
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_get_rules_verification_queue(client: TestClient, mock_db: AsyncMock):
    mock_rule = SchemeEligibilityRules(
        id=1,
        scheme_id="pm-kisan",
        rules_json={"min_age": 18},
        is_verified=False,
        extracted_by="llm",
    )
    mock_scheme = Scheme(id="pm-kisan", name="PM Kisan", state="Central", category="Agriculture")

    mock_res = MagicMock()
    mock_res.all.return_value = [(mock_rule, mock_scheme)]
    mock_db.execute.return_value = mock_res

    res = client.get(
        "/api/v1/admin/rules/queue",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["scheme_id"] == "pm-kisan"
    assert data[0]["is_verified"] is False


def test_verify_scheme_rules(client: TestClient, mock_db: AsyncMock):
    mock_rule = SchemeEligibilityRules(
        id=1,
        scheme_id="pm-kisan",
        rules_json={"min_age": 18},
        is_verified=False,
    )
    mock_res = MagicMock()
    mock_res.scalars().first.return_value = mock_rule
    mock_db.execute.return_value = mock_res

    payload = {
        "rules_json": {"min_age": 18, "max_income": None},
        "verified_by": "operator@sahayak.gov.in",
        "notes": "Verified against 2026 guidelines paragraph 3",
    }
    res = client.post(
        "/api/v1/admin/rules/pm-kisan/verify",
        json=payload,
        headers={"X-Admin-Token": settings.ADMIN_TOKEN},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "verified"
    assert data["is_verified"] is True
    assert data["verified_by"] == "operator@sahayak.gov.in"


def test_trigger_rule_extraction(client: TestClient, mock_db: AsyncMock):
    mock_chunk = Chunk(
        id=1,
        document_id=10,
        seq=1,
        heading_path="PM Kisan > Eligibility",
        text="Eligible age is 18. All landholding farmers are eligible.",
        tokens=15,
    )
    mock_chunks_res = MagicMock()
    mock_chunks_res.scalars().all.return_value = [mock_chunk]

    mock_rule_res = MagicMock()
    mock_rule_res.scalars().first.return_value = None

    mock_db.execute.side_effect = [mock_chunks_res, mock_rule_res]

    with patch("api.routers.admin.extract_rules_from_chunk") as mock_extract:
        mock_extract.return_value = {"min_age": 18, "max_income": None}

        res = client.post(
            "/api/v1/admin/rules/pm-kisan/extract",
            headers={"X-Admin-Token": settings.ADMIN_TOKEN},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "extracted_queued_for_verification"
        assert data["is_verified"] is False
        assert data["rules_json"]["min_age"] == 18

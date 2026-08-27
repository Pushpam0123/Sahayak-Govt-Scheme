from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app
from api.models.scheme import Document, Scheme


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


def test_list_schemes(client: TestClient, mock_db: AsyncMock):
    mock_scheme = Scheme(
        id="pm-kisan",
        name="PM Kisan",
        state="Central",
        category="Agriculture",
        benefit_amount="₹6,000 / year",
        benefit_type="Direct Benefit Transfer (DBT)",
        status="active",
    )
    mock_res = MagicMock()
    mock_res.scalars().all.return_value = [mock_scheme]
    mock_db.execute.return_value = mock_res

    res = client.get("/api/v1/schemes?state=Central&category=Agriculture")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["id"] == "pm-kisan"
    assert data[0]["benefit_amount"] == "₹6,000 / year"


def test_get_scheme_detail_success(client: TestClient, mock_db: AsyncMock):
    mock_scheme = Scheme(
        id="pm-kisan",
        name="PM Kisan",
        state="Central",
        category="Agriculture",
        summary="Farmer financial assistance",
        benefit_amount="₹6,000 / year",
        benefit_type="Direct Benefit Transfer (DBT)",
        required_documents=["Aadhaar Card", "Bank Passbook"],
        application_mode="online",
        official_url="https://pmkisan.gov.in",
        status="active",
    )
    mock_doc = Document(
        id=1,
        scheme_id="pm-kisan",
        title="PM Kisan Guidelines",
        source_url="https://pmkisan.gov.in/guidelines.pdf",
        doc_type="pdf",
        fetch_status="fetched",
    )

    mock_scheme_res = MagicMock()
    mock_scheme_res.scalars().first.return_value = mock_scheme

    mock_doc_res = MagicMock()
    mock_doc_res.scalars().all.return_value = [mock_doc]

    mock_rules_res = MagicMock()
    mock_rules_res.scalars().first.return_value = None

    mock_db.execute.side_effect = [mock_scheme_res, mock_doc_res, mock_rules_res]

    res = client.get("/api/v1/schemes/pm-kisan")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "pm-kisan"
    assert data["benefit_amount"] == "₹6,000 / year"
    assert len(data["required_documents"]) == 2
    assert len(data["documents"]) == 1


def test_get_scheme_detail_not_found(client: TestClient, mock_db: AsyncMock):
    mock_scheme_res = MagicMock()
    mock_scheme_res.scalars().first.return_value = None
    mock_db.execute.return_value = mock_scheme_res

    res = client.get("/api/v1/schemes/non-existent-scheme")
    assert res.status_code == 404
    data = res.json()
    assert data["error"]["code"] == "SCHEME_NOT_FOUND"

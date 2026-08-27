from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app
from api.models.scheme import Chunk, Document, Scheme


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


def test_chat_stream_endpoint(client: TestClient, mock_db: AsyncMock) -> None:
    mock_chunk = Chunk(
        id=1,
        document_id=10,
        seq=1,
        heading_path="Test Scheme > Eligibility",
        text="Eligible farmer families receive 6,000 per year under PM-KISAN.",
        tokens=15,
    )
    mock_doc = Document(
        id=10,
        scheme_id="pm-kisan",
        title="PM-KISAN Guidelines",
        source_url="https://pmkisan.gov.in",
    )
    mock_scheme = Scheme(
        id="pm-kisan",
        name="PM-KISAN",
        state="Central",
        category="Agriculture",
        official_url="https://pmkisan.gov.in",
    )

    mock_res = MagicMock()
    mock_res.all.return_value = [(mock_doc, mock_scheme)]
    mock_db.execute.return_value = mock_res

    with patch("api.services.chat.hybrid_search") as mock_hybrid_search:
        mock_hybrid_search.return_value = [(mock_chunk, 0.04)]

        response = client.post(
            "/api/v1/chat/stream",
            json={"question": "What is PM-KISAN?"},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        text_body = response.text
        assert "event: context" in text_body
        assert "event: token" in text_body
        assert "event: done" in text_body

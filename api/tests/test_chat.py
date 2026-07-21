from typing import Generator
from unittest.mock import ANY, AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock()
    return session


@pytest.fixture
def client(mock_db: AsyncMock) -> Generator[TestClient, None, None]:
    # Override database dependency with mock
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_chat_endpoint(client: TestClient) -> None:
    # Patch grounded answer generation service
    with patch("api.routers.chat.get_grounded_answer") as mock_get_answer:
        mock_get_answer.return_value = {
            "id": 42,
            "answer": "Mock Answer [1]",
            "sentences": [{"text": "Mock Answer [1]", "citations": [1]}],
            "citations": [
                {
                    "n": 1,
                    "chunk_id": 10,
                    "source_url": "http://example.com",
                    "heading_path": "Eligibility Rules",
                    "quote": "Must be resident of India",
                }
            ],
            "usage": {"input_tokens": 320, "output_tokens": 30},
            "latency_ms": 25.5,
        }

        payload = {
            "question": "What is the age limit?",
            "session_id": "test-session",
            "filters": {
                "state": "Central",
                "category": "Pension",
                "scheme_id": "atal-pension-yojana",
            },
        }

        response = client.post("/api/v1/chat", json=payload)
        assert response.status_code == 200

        # Verify chat service arguments
        mock_get_answer.assert_called_once_with(
            db=ANY,  # Match mock db
            query="What is the age limit?",
            state="Central",
            category="Pension",
            scheme_id="atal-pension-yojana",
            session_id="test-session",
        )

        data = response.json()
        assert data["id"] == 42
        assert data["answer"] == "Mock Answer [1]"
        assert len(data["sentences"]) == 1
        assert data["sentences"][0]["citations"] == [1]
        assert len(data["citations"]) == 1
        assert data["citations"][0]["chunk_id"] == 10

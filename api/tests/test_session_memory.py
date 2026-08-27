from typing import Iterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app
from api.models.chat import QALog
from api.models.scheme import Chunk


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock()
    return session


@pytest.fixture
def client(mock_db: AsyncMock) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_chat_uses_session_history(client: TestClient, mock_db: AsyncMock) -> None:
    # Mock previous QALog entry for session
    past_qa = QALog(
        session_id="session-user-123",
        question="What is the minimum pension under APY?",
        answer="Minimum guaranteed pension is Rs 1,000 per month. [1]",
    )

    mock_history_res = MagicMock()
    mock_history_res.scalars().all.return_value = [past_qa]

    mock_doc_scheme_res = MagicMock()
    mock_doc_scheme_res.all.return_value = []

    mock_db.execute.side_effect = [mock_history_res, mock_doc_scheme_res]

    mock_chunk = Chunk(
        id=1,
        document_id=10,
        seq=1,
        heading_path="APY",
        text="APY minimum pension starts at Rs 1000 up to Rs 5000.",
        tokens=15,
    )

    with (
        patch("api.services.chat.hybrid_search") as mock_hybrid_search,
        patch("api.services.chat.get_llm_client") as mock_get_llm,
    ):
        mock_hybrid_search.return_value = [(mock_chunk, 0.05)]

        mock_llm_client = AsyncMock()
        mock_llm_client.generate_response.return_value = {
            "content": "You can join till age 40 to receive this pension. [1]",
            "usage": {"input_tokens": 150, "output_tokens": 25},
        }
        mock_get_llm.return_value = mock_llm_client

        response = client.post(
            "/api/v1/chat",
            json={
                "question": "What is the maximum age to join?",
                "session_id": "session-user-123",
            },
        )
        assert response.status_code == 200

        # Verify that generate_response received the past dialogue in messages
        call_args = mock_llm_client.generate_response.call_args
        messages_sent = call_args[0][1]
        assert len(messages_sent) == 3
        assert messages_sent[0]["role"] == "user"
        assert messages_sent[0]["content"] == "What is the minimum pension under APY?"
        assert messages_sent[1]["role"] == "assistant"
        assert (
            messages_sent[1]["content"]
            == "Minimum guaranteed pension is Rs 1,000 per month. [1]"
        )
        assert messages_sent[2]["role"] == "user"
        assert messages_sent[2]["content"] == "What is the maximum age to join?"

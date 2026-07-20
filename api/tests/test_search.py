from typing import Generator
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
def client(mock_db: AsyncMock) -> Generator[TestClient, None, None]:
    # Override database dependency with mock
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_search_endpoint_no_query(client: TestClient, mock_db: AsyncMock) -> None:
    # Set up mock execute return value for browsing
    mock_chunks_res = MagicMock()
    mock_chunks_res.scalars().all.return_value = [
        Chunk(
            id=1,
            document_id=10,
            seq=1,
            heading_path="Test Heading",
            text="Test Chunk Text",
            tokens=10,
        )
    ]

    mock_doc_res = MagicMock()
    mock_doc_res.scalar_one.return_value = Document(
        id=10, scheme_id="test-scheme", title="Test Scheme Name"
    )

    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = [
        Scheme(
            id="test-scheme",
            name="Test Scheme Name",
            state="Central",
            category="Agriculture",
        )
    ]

    # DB calls inside endpoint:
    # 1. select(Chunk)...
    # 2. select(Document)... for chunk
    # 3. select(Scheme)... for dropdown list
    mock_db.execute.side_effect = [mock_chunks_res, mock_doc_res, mock_schemes_res]

    response = client.get("/api/v1/search")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "schemes" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["text"] == "Test Chunk Text"
    assert data["results"][0]["scheme_id"] == "test-scheme"
    assert data["results"][0]["score"] == 1.0
    assert len(data["schemes"]) == 1
    assert data["schemes"][0]["id"] == "test-scheme"


def test_search_endpoint_with_query(client: TestClient, mock_db: AsyncMock) -> None:
    # Mock hybrid_search service
    mock_chunk = Chunk(
        id=5,
        document_id=20,
        seq=2,
        heading_path="Heading Path",
        text="Search Result Text",
        tokens=15,
    )

    mock_doc_res = MagicMock()
    mock_doc_res.scalar_one.return_value = Document(
        id=20, scheme_id="result-scheme", title="Result Scheme Name"
    )

    mock_schemes_res = MagicMock()
    mock_schemes_res.scalars().all.return_value = []

    mock_db.execute.side_effect = [mock_doc_res, mock_schemes_res]

    with patch("api.routers.search.hybrid_search") as mock_hybrid_search:
        mock_hybrid_search.return_value = [(mock_chunk, 0.0325)]

        response = client.get(
            "/api/v1/search?query=farmer&state=Punjab&category=Agriculture&limit=5"
        )
        assert response.status_code == 200

        # Verify hybrid_search was called correctly
        mock_hybrid_search.assert_called_once_with(
            db=mock_db,
            query="farmer",
            state="Punjab",
            category="Agriculture",
            scheme_id=None,
            limit=5,
        )

        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["text"] == "Search Result Text"
        assert data["results"][0]["scheme_id"] == "result-scheme"
        assert data["results"][0]["score"] == 0.0325

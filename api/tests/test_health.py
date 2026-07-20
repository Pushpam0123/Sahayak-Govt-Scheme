from typing import Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from api.db import get_db
from api.main import app


@pytest.fixture
def mock_db() -> AsyncMock:
    session = AsyncMock()
    session.execute.return_value = MagicMock()
    return session


@pytest.fixture
def client(mock_db: AsyncMock) -> Generator[TestClient, None, None]:
    # Override database dependency with mock
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to Sahayak API" in response.json()["message"]


def test_health_check_success(client: TestClient, mock_db: AsyncMock) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
    mock_db.execute.assert_called_once()


def test_health_check_failure(client: TestClient, mock_db: AsyncMock) -> None:
    # Simulate database connection failure
    mock_db.execute.side_effect = Exception("DB Connection Timeout")
    response = client.get("/api/v1/health")
    assert response.status_code == 500
    assert (
        "Database connection failed: DB Connection Timeout" in response.json()["detail"]
    )

from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from api.db import get_db
from api.main import app


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def client(mock_db: AsyncMock):
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_healthz_liveness(client: TestClient) -> None:
    response = client.get("/api/v1/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_readyz_healthy(client: TestClient, mock_db: AsyncMock) -> None:
    mock_db.execute.return_value = None
    response = client.get("/api/v1/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "connected"}


def test_readyz_database_failure(client: TestClient, mock_db: AsyncMock) -> None:
    mock_db.execute.side_effect = OperationalError("connection refused", {}, None)
    response = client.get("/api/v1/readyz")
    assert response.status_code == 503
    assert "Database readiness check failed" in response.json()["detail"]

from typing import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from api.auth import hash_api_key
from api.config import settings
from api.db import get_db
from api.main import app


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


def test_hash_api_key() -> None:
    key = "shk_live_testkey123"
    h1 = hash_api_key(key)
    h2 = hash_api_key(key)
    assert h1 == h2
    assert len(h1) == 64


def test_admin_stats_unauthorized(client: TestClient) -> None:
    # No token provided
    res = client.get("/api/v1/admin/stats")
    assert res.status_code == 401


def test_admin_stats_forbidden(client: TestClient) -> None:
    # Wrong token provided
    res = client.get("/api/v1/admin/stats", headers={"X-Admin-Token": "invalid-token"})
    assert res.status_code == 403


def test_admin_stats_success(client: TestClient, mock_db: AsyncMock) -> None:
    mock_db.scalar.side_effect = [9, 9, 9, 9, 150, 42, 1.25, 0]
    res = client.get(
        "/api/v1/admin/stats",
        headers={"X-Admin-Token": settings.ADMIN_TOKEN},
    )
    assert res.status_code == 200
    data = res.json()
    assert "catalogue" in data
    assert data["catalogue"]["total_schemes"] == 9
    assert data["usage"]["total_questions_served"] == 42


def test_admin_create_api_key(client: TestClient, mock_db: AsyncMock) -> None:
    res = client.post(
        "/api/v1/admin/api-keys",
        json={"name": "Test Partner Client"},
        headers={"Authorization": f"Bearer {settings.ADMIN_TOKEN}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "api_key" in data
    assert data["api_key"].startswith("shk_live_")
    assert data["name"] == "Test Partner Client"

import uuid

from fastapi.testclient import TestClient

from api.main import app


def test_request_id_attached_to_response():
    client = TestClient(app)
    res = client.get("/api/v1/healthz")
    assert res.status_code == 200
    assert "x-request-id" in res.headers
    assert len(res.headers["x-request-id"]) > 0


def test_custom_request_id_preserved():
    client = TestClient(app)
    custom_id = "req-custom-trace-12345"
    res = client.get("/api/v1/healthz", headers={"X-Request-ID": custom_id})
    assert res.status_code == 200
    assert res.headers["x-request-id"] == custom_id


def test_rate_limiter_blocks_excessive_requests():
    # The limiter is Redis-backed, so a fixed key would still hold counts from a
    # previous run inside the same window. Use a bucket unique to this run --
    # and keep it under 16 characters, because _get_client_identifier truncates
    # the API key to api_key[:16] when building the bucket name.
    unique_key = uuid.uuid4().hex[:16]

    from fastapi import FastAPI

    from api.middleware.rate_limiter import RateLimitMiddleware

    mini_app = FastAPI()
    mini_app.add_middleware(RateLimitMiddleware, requests_limit=2, window_seconds=60)

    @mini_app.get("/ping")
    def ping():
        return {"ping": "pong"}

    mini_client = TestClient(mini_app)
    r1 = mini_client.get("/ping", headers={"X-API-Key": unique_key})
    r2 = mini_client.get("/ping", headers={"X-API-Key": unique_key})
    r3 = mini_client.get("/ping", headers={"X-API-Key": unique_key})

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 429
    assert r3.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"

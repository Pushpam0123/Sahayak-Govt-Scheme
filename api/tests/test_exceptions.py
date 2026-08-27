from fastapi import APIRouter
from fastapi.testclient import TestClient

from api.exceptions import DocumentNotVerifiedError, SahayakError, SchemeNotFoundError
from api.main import app

err_router = APIRouter()


@err_router.get("/test/scheme-not-found")
def route_scheme_not_found() -> None:
    raise SchemeNotFoundError("unknown-scheme")


@err_router.get("/test/doc-not-verified")
def route_doc_not_verified() -> None:
    raise DocumentNotVerifiedError("fake-scheme", "Magic bytes missing")


@err_router.get("/test/custom-error")
def route_custom_error() -> None:
    raise SahayakError(
        "Custom error message", status_code=400, error_code="CUSTOM_BAD_REQUEST"
    )


app.include_router(err_router, prefix="/api/v1/test_errors")


def test_scheme_not_found_exception() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/test_errors/test/scheme-not-found")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "SCHEME_NOT_FOUND"
    assert "unknown-scheme" in data["error"]["message"]
    assert data["error"]["details"]["scheme_id"] == "unknown-scheme"


def test_document_not_verified_exception() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/test_errors/test/doc-not-verified")
    assert response.status_code == 403
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "DOCUMENT_NOT_VERIFIED"
    assert data["error"]["details"]["reason"] == "Magic bytes missing"


def test_custom_sahayak_error() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/test_errors/test/custom-error")
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "CUSTOM_BAD_REQUEST"
    assert data["error"]["message"] == "Custom error message"

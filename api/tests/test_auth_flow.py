"""Behavioural tests for the authentication surface added in Work Order F.

These encode the properties that were previously only checked by hand: password
hashing is salted, API keys are unguessable and never recoverable, and every way
a token can be wrong ends in 401.
"""

from datetime import timedelta
from typing import Iterator
from unittest.mock import AsyncMock

import jwt
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api.auth import (
    create_access_token,
    decode_access_token,
    generate_api_key,
    hash_api_key,
    hash_password,
    verify_password,
)
from api.config import settings
from api.db import get_db
from api.main import app
from api.schemas.auth import APIKeyListItem, UserResponse


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def client(mock_db: AsyncMock) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# --- Password hashing ---


def test_password_hash_is_salted_and_verifies() -> None:
    password = "correct horse battery staple"
    first = hash_password(password)
    second = hash_password(password)

    # A fresh salt per call means identical passwords never share a hash.
    assert first != second
    assert verify_password(password, first)
    assert verify_password(password, second)


def test_password_hash_is_not_the_plaintext() -> None:
    password = "correct horse battery staple"
    hashed = hash_password(password)
    assert password not in hashed
    assert hashed.startswith("$2b$")


def test_verify_password_rejects_wrong_password() -> None:
    hashed = hash_password("correct horse battery staple")
    assert not verify_password("Correct horse battery staple", hashed)
    assert not verify_password("", hashed)


def test_verify_password_returns_false_on_malformed_hash() -> None:
    # A corrupt stored hash must fail closed, not raise into the request handler.
    assert not verify_password("anything", "not-a-bcrypt-hash")


# --- API keys ---


def test_generate_api_key_is_unguessable_and_consistent() -> None:
    plaintext, prefix, key_hash = generate_api_key()

    assert plaintext.startswith("shk_live_")
    # 24 random bytes rendered as hex == 48 characters == 192 bits of entropy.
    assert len(plaintext) == len("shk_live_") + 48
    assert prefix == plaintext[:12]
    assert key_hash == hash_api_key(plaintext)
    # The stored hash must not contain the key it was derived from.
    assert plaintext not in key_hash


def test_generate_api_key_never_repeats() -> None:
    keys = {generate_api_key()[0] for _ in range(50)}
    assert len(keys) == 50


def test_api_key_hash_is_deterministic_for_lookup() -> None:
    plaintext, _, key_hash = generate_api_key()
    assert hash_api_key(plaintext) == key_hash
    assert len(key_hash) == 64


def test_api_key_list_schema_cannot_expose_plaintext() -> None:
    # The read-back model has no field capable of carrying the secret.
    assert "api_key" not in APIKeyListItem.model_fields
    assert "key_hash" not in APIKeyListItem.model_fields
    assert "prefix" in APIKeyListItem.model_fields


def test_user_response_schema_cannot_expose_password_hash() -> None:
    assert "password_hash" not in UserResponse.model_fields
    assert "password" not in UserResponse.model_fields


# --- JWT issuance and rejection ---


def test_token_round_trip_preserves_claims() -> None:
    token = create_access_token({"sub": "user-123", "role": "admin"})
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_token_with_altered_signature_is_rejected() -> None:
    token = create_access_token({"sub": "user-123"})
    header, payload, signature = token.split(".")

    # Alter the FIRST signature character, not the last. An HS256 signature is 32
    # bytes encoded as 43 base64url characters, so the final character carries only
    # 2 significant bits -- four different trailing characters decode to identical
    # signature bytes, and tampering there leaves the token valid ~1 time in 16.
    # Every bit of the first character is significant.
    replacement = "A" if signature[0] != "A" else "B"
    tampered = f"{header}.{payload}.{replacement}{signature[1:]}"

    with pytest.raises(HTTPException) as exc:
        decode_access_token(tampered)
    assert exc.value.status_code == 401


def test_expired_token_is_rejected() -> None:
    token = create_access_token(
        {"sub": "user-123"}, expires_delta=timedelta(seconds=-10)
    )
    with pytest.raises(HTTPException) as exc:
        decode_access_token(token)
    assert exc.value.status_code == 401
    assert "expired" in exc.value.detail.lower()


def test_token_signed_with_another_secret_is_rejected() -> None:
    forged = jwt.encode(
        {"sub": "user-123", "exp": 9999999999},
        "an-attacker-chosen-secret",
        algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(HTTPException) as exc:
        decode_access_token(forged)
    assert exc.value.status_code == 401


def test_token_without_subject_claim_is_rejected() -> None:
    token = jwt.encode(
        {"exp": 9999999999},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    with pytest.raises(HTTPException) as exc:
        decode_access_token(token)
    assert exc.value.status_code == 401


# --- Route-level enforcement ---


def test_me_without_credentials_is_401(client: TestClient) -> None:
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "credentials required" in res.json()["detail"].lower()


def test_me_with_garbage_bearer_token_is_401(client: TestClient) -> None:
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not.a.jwt"},
    )
    assert res.status_code == 401


def test_me_with_expired_token_is_401(client: TestClient) -> None:
    token = create_access_token(
        {"sub": "user-123"}, expires_delta=timedelta(seconds=-10)
    )
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_unknown_api_key_is_401(client: TestClient, mock_db: AsyncMock) -> None:
    result = AsyncMock()
    result.scalars = lambda: type("S", (), {"first": lambda self: None})()
    mock_db.execute.return_value = result

    res = client.get("/api/v1/auth/me", headers={"X-API-Key": "shk_live_" + "0" * 48})
    assert res.status_code == 401
    # Pin the reason so this cannot pass on an unrelated 401.
    assert res.json()["detail"] == "Invalid or inactive API key."


def test_login_does_not_reveal_whether_an_email_exists(
    client: TestClient, mock_db: AsyncMock
) -> None:
    result = AsyncMock()
    result.scalars = lambda: type("S", (), {"first": lambda self: None})()
    mock_db.execute.return_value = result

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert res.status_code == 401
    # Same generic message regardless of which half was wrong.
    assert res.json()["detail"] == "Invalid email or password."

import importlib
import os
from unittest.mock import patch

import api.config
from api.config import Settings


def test_settings_defaults() -> None:
    """The built-in defaults, independent of whatever is in the ambient environment.

    ``Settings`` binds ``os.getenv`` results in its class body, so the only way to
    observe the true defaults is to re-import the module with the environment
    cleared. Without this the test asserts the developer's shell (or conftest),
    not the defaults it claims to pin.
    """
    try:
        with patch.dict(os.environ, {}, clear=True):
            importlib.reload(api.config)
            defaults = api.config.Settings()

            assert defaults.ENVIRONMENT == "development"
            assert defaults.GEMINI_CHAT_MODEL == "gemini-3.6-flash"
            assert defaults.GEMINI_EMBEDDING_MODEL == "gemini-embedding-001"
            assert defaults.GEMINI_EMBEDDING_DIM == 1024
            assert isinstance(defaults.ALLOWED_ORIGINS, list)
            assert len(defaults.ALLOWED_ORIGINS) >= 1
            assert defaults.RATE_LIMIT_REQUESTS == 60
            # Secrets must have no usable default; startup validation depends on it.
            assert defaults.ADMIN_TOKEN == ""
            assert defaults.JWT_SECRET == ""
    finally:
        # Restore the module to the real (conftest-populated) environment.
        importlib.reload(api.config)


def test_settings_origins_wildcard() -> None:
    settings = Settings()
    settings._raw_origins = "*"
    assert settings.ALLOWED_ORIGINS == ["*"]


def test_settings_origins_custom_list() -> None:
    settings = Settings()
    settings._raw_origins = "https://sahayak.gov.in, https://app.sahayak.gov.in"
    assert settings.ALLOWED_ORIGINS == [
        "https://sahayak.gov.in",
        "https://app.sahayak.gov.in",
    ]

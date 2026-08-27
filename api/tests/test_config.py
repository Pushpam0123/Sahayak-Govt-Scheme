from api.config import Settings


def test_settings_defaults():
    settings = Settings()
    assert settings.ENVIRONMENT == "development"
    assert settings.CHAT_MODEL == "claude-haiku-4-5-20251001"
    assert settings.EMBEDDING_MODEL == "voyage-3-lite"
    assert isinstance(settings.ALLOWED_ORIGINS, list)
    assert len(settings.ALLOWED_ORIGINS) >= 1
    assert settings.RATE_LIMIT_REQUESTS == 60


def test_settings_origins_wildcard():
    settings = Settings()
    settings._raw_origins = "*"
    assert settings.ALLOWED_ORIGINS == ["*"]


def test_settings_origins_custom_list():
    settings = Settings()
    settings._raw_origins = "https://sahayak.gov.in, https://app.sahayak.gov.in"
    assert settings.ALLOWED_ORIGINS == [
        "https://sahayak.gov.in",
        "https://app.sahayak.gov.in",
    ]

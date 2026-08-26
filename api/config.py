import os
from typing import List


class Settings:
    # Environment & Debug
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/sahayak"
    )
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))

    # CORS
    _raw_origins: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
    )

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        if self._raw_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self._raw_origins.split(",") if origin.strip()]

    # Security
    ADMIN_TOKEN: str = os.getenv("ADMIN_TOKEN", "dev-admin-secret-change-in-prod")

    # LLM & Embeddings
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    VOYAGE_API_KEY: str = os.getenv("VOYAGE_API_KEY", "")
    CHAT_MODEL: str = os.getenv("CHAT_MODEL", "claude-3-5-sonnet-20241022")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "voyage-3-lite")

    # Token Pricing (Per Million Tokens in USD)
    ANTHROPIC_INPUT_COST_PER_M: float = float(os.getenv("ANTHROPIC_INPUT_COST_PER_M", "3.00"))
    ANTHROPIC_OUTPUT_COST_PER_M: float = float(os.getenv("ANTHROPIC_OUTPUT_COST_PER_M", "15.00"))
    ANTHROPIC_CACHE_READ_COST_PER_M: float = float(os.getenv("ANTHROPIC_CACHE_READ_COST_PER_M", "0.30"))
    ANTHROPIC_CACHE_WRITE_COST_PER_M: float = float(os.getenv("ANTHROPIC_CACHE_WRITE_COST_PER_M", "3.75"))

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))


settings = Settings()

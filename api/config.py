import os
from typing import List


class Settings:
    # Environment & Debug
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://sahayak:sahayak_password@127.0.0.1:5433/sahayak"
    )
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() in ("true", "1", "yes")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))

    # Redis Cache & Rate Limiting
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    RATE_LIMIT_FALLBACK_OPEN: bool = os.getenv("RATE_LIMIT_FALLBACK_OPEN", "true").lower() in ("true", "1", "yes")

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

    # Security & Auth (No insecure defaults — missing secrets fail startup loudly)
    ADMIN_TOKEN: str = os.getenv("ADMIN_TOKEN", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    # LLM & Embeddings (F-5 configurable defaults)
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    VOYAGE_API_KEY: str = os.getenv("VOYAGE_API_KEY", "")
    CHAT_MODEL: str = os.getenv("CHAT_MODEL", "claude-haiku-4-5-20251001")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "voyage-3-lite")

    # Token Pricing (Per Million Tokens in USD)
    ANTHROPIC_INPUT_COST_PER_M: float = float(os.getenv("ANTHROPIC_INPUT_COST_PER_M", "0.80"))
    ANTHROPIC_OUTPUT_COST_PER_M: float = float(os.getenv("ANTHROPIC_OUTPUT_COST_PER_M", "4.00"))
    ANTHROPIC_CACHE_READ_COST_PER_M: float = float(os.getenv("ANTHROPIC_CACHE_READ_COST_PER_M", "0.08"))
    ANTHROPIC_CACHE_WRITE_COST_PER_M: float = float(os.getenv("ANTHROPIC_CACHE_WRITE_COST_PER_M", "1.00"))

    # Rate Limiting Parameters
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

    def validate_security_configuration(self) -> None:
        """Enforces that production and runtime environments have mandatory secrets set."""
        if not self.ADMIN_TOKEN or self.ADMIN_TOKEN.strip() == "":
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: ADMIN_TOKEN environment variable is not set. "
                "A secure, non-empty admin token must be provided."
            )
        if not self.JWT_SECRET or self.JWT_SECRET.strip() == "":
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is not set. "
                "A secure, non-empty JWT secret must be provided for session issuance."
            )


settings = Settings()

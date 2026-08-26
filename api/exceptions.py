from typing import Any, Dict, Optional


class SahayakError(Exception):
    """Base application exception for Sahayak API."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class SchemeNotFoundError(SahayakError):
    def __init__(self, scheme_id: str):
        super().__init__(
            message=f"Scheme '{scheme_id}' was not found in the verified catalogue.",
            status_code=404,
            error_code="SCHEME_NOT_FOUND",
            details={"scheme_id": scheme_id},
        )


class DocumentNotVerifiedError(SahayakError):
    def __init__(self, scheme_id: str, reason: str = "Document is unverified"):
        super().__init__(
            message=f"Scheme '{scheme_id}' document is not verified and cannot be cited: {reason}",
            status_code=403,
            error_code="DOCUMENT_NOT_VERIFIED",
            details={"scheme_id": scheme_id, "reason": reason},
        )


class LLMProviderError(SahayakError):
    def __init__(self, provider: str, message: str):
        super().__init__(
            message=f"Upstream {provider} error: {message}",
            status_code=502,
            error_code="UPSTREAM_PROVIDER_ERROR",
            details={"provider": provider, "upstream_message": message},
        )


class RateLimitExceededError(SahayakError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            message="Rate limit exceeded. Please wait before submitting more requests.",
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after_seconds": retry_after},
        )

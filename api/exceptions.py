from typing import Any, Dict, Optional


class SahayakError(Exception):
    """Base application exception for Sahayak API."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
        internal_message: Optional[str] = None,
    ):
        super().__init__(internal_message or message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.internal_message = internal_message or message


class NotFoundError(SahayakError):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} '{identifier}' was not found.",
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
        )


class SchemeNotFoundError(NotFoundError):
    def __init__(self, scheme_id: str):
        super().__init__(resource="Scheme", identifier=scheme_id)
        self.error_code = "SCHEME_NOT_FOUND"


class DocumentNotVerifiedError(SahayakError):
    def __init__(self, scheme_id: str, reason: str = "Document is unverified"):
        super().__init__(
            message=f"Scheme '{scheme_id}' document is not verified and cannot be cited.",
            status_code=403,
            error_code="DOCUMENT_NOT_VERIFIED",
            details={"scheme_id": scheme_id, "reason": reason},
            internal_message=f"Scheme '{scheme_id}' citation rejected: {reason}",
        )


class UpstreamServiceError(SahayakError):
    def __init__(self, service: str, internal_detail: Optional[str] = None):
        super().__init__(
            message=f"Upstream service dependency ({service}) failed to process request.",
            status_code=502,
            error_code="UPSTREAM_SERVICE_ERROR",
            details={"service": service},
            internal_message=f"Upstream {service} failure: {internal_detail}" if internal_detail else None,
        )


class DatabaseError(SahayakError):
    def __init__(self, internal_detail: Optional[str] = None):
        super().__init__(
            message="A database error occurred while processing your request.",
            status_code=500,
            error_code="DATABASE_ERROR",
            internal_message=f"Database failure: {internal_detail}" if internal_detail else None,
        )


class RateLimitExceededError(SahayakError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            message="Rate limit exceeded. Please wait before submitting more requests.",
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after_seconds": retry_after},
        )

import time
import uuid
from collections import defaultdict
from typing import Any, Dict, List

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any = None,
        requests_limit: int = 60,
        window_seconds: int = 60,
    ):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.request_history: Dict[str, List[float]] = defaultdict(list)

    def _get_client_identifier(self, request: Request) -> str:
        # 1. Check for API key in header
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{api_key[:16]}"

        # 2. Check for Bearer token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return f"bearer:{auth_header[7:23]}"

        # 3. Check X-Forwarded-For (first IP is original client)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return f"ip:{first_ip}"

        # 4. Check Cloudflare header
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return f"ip:{cf_ip.strip()}"

        # 5. Fallback to client host
        return f"ip:{request.client.host if request.client else 'unknown'}"

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Generate or preserve X-Request-ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        client_key = self._get_client_identifier(request)
        current_time = time.time()

        # Clean up old timestamps outside sliding window
        history = self.request_history[client_key]
        self.request_history[client_key] = [
            t for t in history if current_time - t < self.window_seconds
        ]

        # Check limit violation
        if len(self.request_history[client_key]) >= self.requests_limit:
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Rate limit exceeded. Too many requests. Please try again later.",
                        "details": {"retry_after_seconds": self.window_seconds},
                    }
                },
            )
            response.headers["X-Request-ID"] = request_id
            response.headers["Retry-After"] = str(self.window_seconds)
            return response

        # Log timestamp
        self.request_history[client_key].append(current_time)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

import time
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
        # Allow starlette to initialize properly
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.request_history: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Clean up old timestamps outside sliding window
        history = self.request_history[client_ip]
        self.request_history[client_ip] = [
            t for t in history if current_time - t < self.window_seconds
        ]

        # Check limit violation
        if len(self.request_history[client_ip]) >= self.requests_limit:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": (
                        "Rate limit exceeded. Too many requests. "
                        "Please try again later."
                    )
                },
            )

        # Log timestamp
        self.request_history[client_ip].append(current_time)

        response = await call_next(request)
        return response

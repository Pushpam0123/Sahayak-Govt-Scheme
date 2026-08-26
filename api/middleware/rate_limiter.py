import logging
import time
import uuid
from typing import Any, Optional

import redis.asyncio as aioredis
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from api.config import settings

logger = logging.getLogger("sahayak.ratelimiter")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: Any = None,
        requests_limit: int = 60,
        window_seconds: int = 60,
        redis_url: Optional[str] = None,
    ):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.redis_url = redis_url or settings.REDIS_URL
        self._redis: Optional[aioredis.Redis] = None

    @property
    def redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0,
            )
        return self._redis

    def _get_client_identifier(self, request: Request) -> str:
        """
        Extracts client key prioritizing:
        1. API Key
        2. Bearer JWT
        3. Client IP (X-Forwarded-For -> CF-Connecting-IP -> client.host)
        """
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
        request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]

        client_key = self._get_client_identifier(request)
        redis_key = f"sahayak:ratelimit:{client_key}"
        current_time = time.time()
        window_start = current_time - self.window_seconds

        try:
            r = self.redis
            # Atomic sliding window query and record
            async with r.pipeline(transaction=True) as pipe:
                pipe.zremrangebyscore(redis_key, 0, window_start)
                pipe.zcard(redis_key)
                pipe.zadd(redis_key, {f"{current_time}:{uuid.uuid4().hex[:6]}": current_time})
                pipe.expire(redis_key, self.window_seconds + 10)
                results = await pipe.execute()

            request_count = results[1]  # Count before adding current request

            if request_count >= self.requests_limit:
                logger.warning(
                    "Rate limit exceeded for %s: %d requests in %ds (limit=%d) [request_id=%s]",
                    client_key,
                    request_count,
                    self.window_seconds,
                    self.requests_limit,
                    request_id,
                )
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Rate limit exceeded. Too many requests. Please try again later.",
                            "details": {"retry_after_seconds": self.window_seconds},
                            "request_id": request_id,
                        }
                    },
                )
                response.headers["X-Request-ID"] = request_id
                response.headers["Retry-After"] = str(self.window_seconds)
                return response

        except Exception as err:
            logger.warning(
                "Redis rate limiter unavailable: %s. Fallback policy: %s [request_id=%s]",
                err,
                "FAIL_OPEN" if settings.RATE_LIMIT_FALLBACK_OPEN else "FAIL_CLOSED",
                request_id,
            )
            if not settings.RATE_LIMIT_FALLBACK_OPEN:
                response = JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={
                        "error": {
                            "code": "RATE_LIMITER_UNAVAILABLE",
                            "message": "Rate limiter is temporarily unavailable.",
                            "request_id": request_id,
                        }
                    },
                )
                response.headers["X-Request-ID"] = request_id
                return response

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

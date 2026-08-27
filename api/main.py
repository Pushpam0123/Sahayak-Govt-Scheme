import logging
import uuid
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.config import settings
from api.exceptions import SahayakError
from api.middleware.rate_limiter import RateLimitMiddleware
from api.routers import admin, auth, chat, eligibility, health, schemes, search, usage

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("sahayak.api")

app = FastAPI(
    title="Sahayak API",
    description="Backend API for Sahayak Government Scheme RAG Assistant",
    version="0.2.0",
    docs_url="/docs"
    if settings.DEBUG or settings.ENVIRONMENT != "production"
    else None,
    redoc_url="/redoc"
    if settings.DEBUG or settings.ENVIRONMENT != "production"
    else None,
)


@app.on_event("startup")
async def startup_event() -> None:
    settings.validate_security_configuration()


# Middleware for assigning request_id to each incoming request
@app.middleware("http")
async def request_id_middleware(request: Request, call_next: Any) -> Any:
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Application exception handler
@app.exception_handler(SahayakError)
async def sahayak_exception_handler(
    request: Request, exc: SahayakError
) -> JSONResponse:
    req_id = getattr(request.state, "request_id", uuid.uuid4().hex[:12])
    logger.error(
        "Application error [request_id=%s] %s %s: %s",
        req_id,
        request.method,
        request.url.path,
        exc.internal_message,
        exc_info=True,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "request_id": req_id,
            }
        },
    )


# Unhandled exception catch-all
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    req_id = getattr(request.state, "request_id", uuid.uuid4().hex[:12])
    logger.error(
        "Unhandled exception [request_id=%s] processing %s %s: %s",
        req_id,
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred. Please try again later.",
                "request_id": req_id,
            }
        },
    )


# Rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    requests_limit=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
)

# CORS configurations
allow_all = "*" in settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers
app.include_router(health.router, prefix="/api/v1", tags=["system"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(schemes.router, prefix="/api/v1", tags=["schemes"])
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(eligibility.router, prefix="/api/v1", tags=["eligibility"])
app.include_router(usage.router, prefix="/api/v1", tags=["usage"])
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
def read_root() -> Dict[str, Any]:
    return {"message": "Welcome to Sahayak API. Access health check at /api/v1/health"}

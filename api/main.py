import logging
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.config import settings
from api.exceptions import SahayakError
from api.middleware.rate_limiter import RateLimitMiddleware
from api.routers import admin, chat, eligibility, health, search, usage

logger = logging.getLogger("sahayak.api")

app = FastAPI(
    title="Sahayak API",
    description="Backend API for Sahayak Government Scheme RAG Assistant",
    version="0.2.0",
    docs_url="/docs" if settings.DEBUG or settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.DEBUG or settings.ENVIRONMENT != "production" else None,
)

# Custom exception handler for application errors
@app.exception_handler(SahayakError)
async def sahayak_exception_handler(request: Request, exc: SahayakError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.DEBUG:
        message = str(exc)
    else:
        message = "An unexpected internal server error occurred. Please try again later."

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": message,
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
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(eligibility.router, prefix="/api/v1", tags=["eligibility"])
app.include_router(usage.router, prefix="/api/v1", tags=["usage"])
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
def read_root() -> Dict[str, Any]:
    return {"message": "Welcome to Sahayak API. Access health check at /api/v1/health"}

from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.middleware.rate_limiter import RateLimitMiddleware
from api.routers import chat, eligibility, health, search, usage

app = FastAPI(
    title="Sahayak API",
    description="Backend API for Sahayak Government Scheme RAG Assistant",
    version="0.1.0",
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware, requests_limit=60, window_seconds=60)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    # Allow React app (or any browser client) to communicate in dev
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers
app.include_router(health.router, prefix="/api/v1", tags=["system"])
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(eligibility.router, prefix="/api/v1", tags=["eligibility"])
app.include_router(usage.router, prefix="/api/v1", tags=["usage"])


@app.get("/")
def read_root() -> Dict[str, Any]:
    return {"message": "Welcome to Sahayak API. Access health check at /api/v1/health"}

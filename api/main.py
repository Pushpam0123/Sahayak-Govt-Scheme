from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import health

app = FastAPI(
    title="Sahayak API",
    description="Backend API for Sahayak Government Scheme RAG Assistant",
    version="0.1.0"
)

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

@app.get("/")
def read_root() -> Dict[str, Any]:
    return {
        "message": "Welcome to Sahayak API. Access health check at /api/v1/health"
    }

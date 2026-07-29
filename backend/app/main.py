"""ExoVision AI FastAPI Backend Application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ExoVision API",
    description="API for detecting exoplanet transit signals from astronomical light-curve data",
    version="0.1.0",
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    """Root endpoint returning welcome message."""
    return {"message": "Welcome to ExoVision API"}


@app.get("/api/v1/health")
def get_health() -> dict[str, str | int]:
    """Health check endpoint for Phase 1 API monitoring."""
    return {
        "status": "healthy",
        "service": "ExoVision API",
        "phase": 1,
    }

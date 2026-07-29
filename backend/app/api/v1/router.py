"""Version 1 API routes."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
def get_health() -> HealthResponse:
    """Report whether the Phase 1 API process is available."""
    return HealthResponse(
        status="healthy",
        service="ExoVision API",
        phase="1.1",
    )

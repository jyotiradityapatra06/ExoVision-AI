"""Version 1 API routes."""

from fastapi import APIRouter

from app.api.v1.ml import router as ml_router
from app.schemas.health import HealthResponse

router = APIRouter()
router.include_router(ml_router)


@router.get("/health", response_model=HealthResponse, tags=["system"])
def get_health() -> HealthResponse:
    """Report whether the Phase 1 API process is available."""
    return HealthResponse(
        status="healthy",
        service="ExoVision API",
        phase="1.1",
    )

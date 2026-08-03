"""Version 1 API routes."""

from fastapi import APIRouter

from app.api.v1.analysis import router as analysis_router
from app.api.v1.ml import router as ml_router
from app.api.v1.reports import router as reports_router
from app.api.v1.results import router as results_router
from app.api.v1.upload import router as upload_router
from app.schemas.health import HealthResponse

router = APIRouter()
router.include_router(ml_router)
router.include_router(upload_router)
router.include_router(analysis_router)
router.include_router(results_router)
router.include_router(reports_router)


@router.get("/health", response_model=HealthResponse, tags=["system"])
def get_health() -> HealthResponse:
    """Report whether the Phase 1 API process is available."""
    return HealthResponse(
        status="healthy",
        service="ExoVision API",
        phase="1.1",
    )

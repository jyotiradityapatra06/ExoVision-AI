"""ExoVision AI FastAPI application."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.config.settings import settings
from app.core.security import SecurityHeadersMiddleware
from app.models.analysis import AnalysisRepository
from app.models.database import initialize_database
from app.services.analysis_service import AnalysisService

logger = logging.getLogger("exovision.api")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    initialize_database(settings.database_path)
    recovered = AnalysisRepository(settings.database_path).recover_stale(
        settings.analysis_stale_minutes
    )
    recovery_service = AnalysisService(settings.upload_root)
    for analysis_id in recovered:
        recovery_service.mark_interrupted(analysis_id)
    if recovered:
        logger.warning("stale_analyses_recovered count=%d", len(recovered))
    application = FastAPI(
        title=settings.project_name,
        description=(
            "AI-assisted exoplanet candidate screening for stellar light curves."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    application.add_middleware(SecurityHeadersMiddleware)
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    @application.exception_handler(Exception)
    async def unexpected_error(request: Request, error: Exception) -> JSONResponse:
        logger.exception("unhandled_api_error path=%s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred."},
        )

    @application.get("/", tags=["system"])
    def read_root() -> dict[str, str]:
        """Return basic service information."""
        return {"message": "Welcome to ExoVision API"}

    return application


app = create_app()

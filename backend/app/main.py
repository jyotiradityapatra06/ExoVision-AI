"""ExoVision AI FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.config.settings import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.project_name,
        description=(
            "Foundation API for the future ExoVision light-curve analysis platform"
        ),
        version="0.1.0",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    @application.get("/", tags=["system"])
    def read_root() -> dict[str, str]:
        """Return basic service information."""
        return {"message": "Welcome to ExoVision API"}

    return application


app = create_app()

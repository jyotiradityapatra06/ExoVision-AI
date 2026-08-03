"""Version 1 uploaded light-curve analysis endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    AnalysisRepositoryDependency,
    CurrentUser,
    OwnedAnalysisUser,
)
from app.config.settings import settings
from app.schemas.analysis import AnalysisResponse, AnalysisStatus
from app.schemas.auth import AnalysisHistoryItem
from app.services.analysis_service import (
    AnalysisExecutionError,
    AnalysisNotFoundError,
    AnalysisService,
)

router = APIRouter(prefix="/analyze", tags=["analysis"])


def get_analysis_service() -> AnalysisService:
    """Create an analysis service over the configured local upload root."""
    return AnalysisService(settings.upload_root)


AnalysisServiceDependency = Annotated[AnalysisService, Depends(get_analysis_service)]


@router.post("/{analysis_id}", response_model=AnalysisResponse)
def start_analysis(
    analysis_id: str,
    service: AnalysisServiceDependency,
    _user: OwnedAnalysisUser,
    analyses: AnalysisRepositoryDependency,
) -> AnalysisResponse:
    """Synchronously run the existing astronomy and ML pipeline."""
    try:
        result = service.analyze(analysis_id)
    except AnalysisNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except AnalysisExecutionError as error:
        analyses.update_status(analysis_id, "failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    analyses.update_status(analysis_id, "completed")
    return AnalysisResponse(**result)


@router.get("/{analysis_id}/status", response_model=AnalysisStatus)
def get_analysis_status(
    analysis_id: str,
    service: AnalysisServiceDependency,
    _user: OwnedAnalysisUser,
) -> AnalysisStatus:
    """Return durable local progress for an uploaded analysis."""
    try:
        result = service.status(analysis_id)
    except AnalysisNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    return AnalysisStatus(**result)


@router.get("", response_model=list[AnalysisHistoryItem])
def list_analyses(
    user: CurrentUser,
    analyses: AnalysisRepositoryDependency,
) -> list[AnalysisHistoryItem]:
    """Return the authenticated user's analysis history."""
    return [
        AnalysisHistoryItem(
            id=record.id,
            filename=record.filename,
            status=record.status,
            created_at=record.created_at,
        )
        for record in analyses.list_for_user(user.id)
    ]

"""Version 1 uploaded light-curve analysis endpoints."""

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.api.dependencies import (
    AnalysisRepositoryDependency,
    CurrentUser,
    OwnedAnalysisUser,
)
from app.config.settings import settings
from app.models.analysis import AnalysisRepository
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


@router.post(
    "/{analysis_id}",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_analysis(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    service: AnalysisServiceDependency,
    _user: OwnedAnalysisUser,
    analyses: AnalysisRepositoryDependency,
) -> AnalysisResponse:
    """Idempotently accept an uploaded analysis for in-process execution."""
    if analyses.transition_status(analysis_id, "uploaded", "processing"):
        service.mark_processing(analysis_id)
        background_tasks.add_task(_execute_analysis, analysis_id, service, analyses)
    return _analysis_response(service, analyses, analysis_id)


@router.post(
    "/{analysis_id}/retry",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def retry_analysis(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    service: AnalysisServiceDependency,
    _user: OwnedAnalysisUser,
    analyses: AnalysisRepositoryDependency,
) -> AnalysisResponse:
    """Explicitly retry one failed analysis without allowing concurrent runs."""
    if analyses.transition_status(analysis_id, "failed", "processing"):
        service.mark_processing(analysis_id)
        background_tasks.add_task(_execute_analysis, analysis_id, service, analyses)
    return _analysis_response(service, analyses, analysis_id)


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


def _execute_analysis(
    analysis_id: str,
    service: AnalysisService,
    analyses: AnalysisRepository,
) -> None:
    """Run one claimed analysis after the HTTP response has been sent."""
    try:
        service.analyze(analysis_id)
    except (AnalysisExecutionError, AnalysisNotFoundError):
        analyses.update_status(analysis_id, "failed")
    else:
        analyses.update_status(analysis_id, "completed")


def _analysis_response(
    service: AnalysisService,
    analyses: AnalysisRepository,
    analysis_id: str,
) -> AnalysisResponse:
    try:
        current = service.status(analysis_id)
    except AnalysisNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found."
        ) from error
    record = analyses.by_id(analysis_id)
    if record is not None and record.status == "processing":
        current.update(
            status="processing",
            stage="preparing_observation",
            message="Preparing the uploaded observation.",
            retryable=False,
        )
    return AnalysisResponse(
        analysis_id=analysis_id,
        status=current["status"],
        stage=str(current["stage"]),
        message=str(current["message"]),
        retryable=bool(current["retryable"]),
    )


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

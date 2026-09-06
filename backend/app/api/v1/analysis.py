"""Version 1 uploaded light-curve analysis endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.api.dependencies import (
    AnalysisRepositoryDependency,
    CurrentUser,
    OwnedAnalysisUser,
)
from app.config.settings import settings
from app.core.security import enforce_rate_limit
from app.models.analysis import AnalysisRepository
from app.schemas.analysis import AnalysisResponse, AnalysisStatus
from app.schemas.auth import (
    AnalysisHistoryCounts,
    AnalysisHistoryItem,
    AnalysisHistoryPage,
    AnalysisSummaryItem,
)
from app.services.analysis_service import (
    AnalysisExecutionError,
    AnalysisNotFoundError,
    AnalysisService,
)
from app.services.result_service import ResultNotFoundError, ResultService

router = APIRouter(prefix="/analyze", tags=["analysis"])
logger = logging.getLogger(__name__)


def get_analysis_service() -> AnalysisService:
    """Create an analysis service over the configured local upload root."""
    return AnalysisService(settings.upload_root)


AnalysisServiceDependency = Annotated[AnalysisService, Depends(get_analysis_service)]


def get_history_result_service() -> ResultService:
    """Create the compact result reader used by dashboard history."""
    return ResultService(settings.upload_root)


HistoryResultServiceDependency = Annotated[
    ResultService, Depends(get_history_result_service)
]


@router.post(
    "/{analysis_id}",
    response_model=AnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_analysis(
    analysis_id: str,
    background_tasks: BackgroundTasks,
    service: AnalysisServiceDependency,
    user: OwnedAnalysisUser,
    analyses: AnalysisRepositoryDependency,
) -> AnalysisResponse:
    """Idempotently accept an uploaded analysis for in-process execution."""
    enforce_rate_limit("analysis", user.id)
    claim = analyses.claim_processing(
        analysis_id, user.id, "uploaded", settings.max_active_analyses_per_user
    )
    if claim == "limit":
        logger.warning("analysis_active_limit user_id=%s", user.id)
        raise HTTPException(
            status_code=429,
            detail=(
                "Active analysis limit reached. "
                "Wait for the current analysis to finish."
            ),
        )
    if claim == "claimed":
        logger.info("analysis_started analysis_id=%s user_id=%s", analysis_id, user.id)
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
    user: OwnedAnalysisUser,
    analyses: AnalysisRepositoryDependency,
) -> AnalysisResponse:
    """Explicitly retry one failed analysis without allowing concurrent runs."""
    enforce_rate_limit("analysis", user.id)
    claim = analyses.claim_processing(
        analysis_id, user.id, "failed", settings.max_active_analyses_per_user
    )
    if claim == "limit":
        logger.warning("analysis_retry_active_limit user_id=%s", user.id)
        raise HTTPException(
            status_code=429,
            detail=(
                "Active analysis limit reached. "
                "Wait for the current analysis to finish."
            ),
        )
    if claim == "claimed":
        logger.info("analysis_retried analysis_id=%s user_id=%s", analysis_id, user.id)
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
        logger.warning("analysis_failed analysis_id=%s", analysis_id)
        analyses.update_status(analysis_id, "failed")
    else:
        logger.info("analysis_completed analysis_id=%s", analysis_id)
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


@router.get("/history", response_model=AnalysisHistoryPage)
def dashboard_history(
    user: CurrentUser,
    analyses: AnalysisRepositoryDependency,
    service: AnalysisServiceDependency,
    result_service: HistoryResultServiceDependency,
    limit: int = Query(default=12, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> AnalysisHistoryPage:
    """Return one owned page of compact summaries without curve arrays."""
    records = analyses.list_for_user(user.id, limit=limit, offset=offset)
    items: list[AnalysisSummaryItem] = []
    for record in records:
        stage = _default_stage(record.status)
        safe_error = None
        try:
            state = service.status(record.id)
            stage = str(state["stage"])
            safe_error = str(state["error"]) if state.get("error") else None
        except AnalysisNotFoundError:
            pass

        scientific: dict[str, object] = {}
        if record.status == "completed":
            try:
                scientific = result_service.summary(record.id)
            except (ResultNotFoundError, ValueError):
                logger.warning("analysis_summary_unavailable analysis_id=%s", record.id)

        items.append(
            AnalysisSummaryItem(
                id=record.id,
                filename=record.filename,
                status=record.status,
                stage=stage,
                created_at=record.created_at,
                updated_at=record.updated_at or record.created_at,
                processing_started_at=record.processing_started_at,
                safe_error=safe_error,
                **scientific,
            )
        )
    counts = analyses.status_counts_for_user(user.id)
    return AnalysisHistoryPage(
        items=items,
        counts=AnalysisHistoryCounts(**counts),
        total=counts["total"],
        limit=limit,
        offset=offset,
    )


@router.get("", response_model=list[AnalysisHistoryItem])
def list_analyses(
    user: CurrentUser,
    analyses: AnalysisRepositoryDependency,
) -> list[AnalysisHistoryItem]:
    """Preserve the original authenticated history contract."""
    return [
        AnalysisHistoryItem(
            id=record.id,
            filename=record.filename,
            status=record.status,
            created_at=record.created_at,
        )
        for record in analyses.list_for_user(user.id)
    ]


def _default_stage(status_value: str) -> str:
    return {
        "uploaded": "ready",
        "processing": "preparing_observation",
        "completed": "completed",
        "failed": "failed",
    }.get(status_value, "ready")

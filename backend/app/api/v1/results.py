"""Version 1 completed-analysis result endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.config.settings import settings
from app.schemas.results import ResultResponse
from app.services.result_service import ResultNotFoundError, ResultService

router = APIRouter(prefix="/results", tags=["analysis"])


def get_result_service() -> ResultService:
    """Create a read-only result service over local analysis storage."""
    return ResultService(settings.upload_root)


ResultServiceDependency = Annotated[ResultService, Depends(get_result_service)]


@router.get("/{analysis_id}", response_model=ResultResponse)
def get_analysis_result(
    analysis_id: str,
    service: ResultServiceDependency,
) -> ResultResponse:
    """Return visualization-ready output for one completed analysis."""
    try:
        result = service.get(analysis_id)
    except ResultNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored analysis result is unavailable.",
        ) from error
    return ResultResponse(**result)

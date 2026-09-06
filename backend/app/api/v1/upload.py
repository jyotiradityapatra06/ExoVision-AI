"""Version 1 light-curve upload endpoint."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.dependencies import AnalysisRepositoryDependency, CurrentUser
from app.config.settings import settings
from app.core.security import enforce_rate_limit
from app.schemas.analysis import UploadResponse
from app.services.upload_service import UploadService, UploadValidationError

router = APIRouter(prefix="/upload", tags=["analysis"])
logger = logging.getLogger(__name__)


def get_upload_service() -> UploadService:
    """Create a stateless upload service for the configured local root."""
    return UploadService(
        settings.upload_root, max_upload_bytes=settings.max_upload_bytes
    )


UploadServiceDependency = Annotated[UploadService, Depends(get_upload_service)]


@router.post(
    "/lightcurve",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_lightcurve(
    service: UploadServiceDependency,
    user: CurrentUser,
    analyses: AnalysisRepositoryDependency,
    file: Annotated[UploadFile, File(description="CSV, FITS, or TXT light curve")],
) -> UploadResponse:
    """Validate and store one light-curve file for later analysis."""
    enforce_rate_limit("upload", user.id)
    if analyses.count_for_user(user.id) >= settings.max_analyses_per_user:
        logger.warning("analysis_count_quota_rejected user_id=%s", user.id)
        raise HTTPException(
            status_code=429,
            detail="Stored analysis quota reached; new uploads are unavailable.",
        )
    try:
        result = await service.save(
            file,
            existing_analysis_ids=analyses.ids_for_user(user.id),
            max_total_bytes=settings.max_storage_bytes_per_user,
        )
    except UploadValidationError as error:
        if "quota" in str(error).lower():
            logger.warning("storage_quota_rejected user_id=%s", user.id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    analyses.create(result["analysis_id"], user.id, result["filename"])
    return UploadResponse(**result)

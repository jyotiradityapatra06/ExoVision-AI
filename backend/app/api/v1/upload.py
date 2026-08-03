"""Version 1 light-curve upload endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config.settings import settings
from app.schemas.analysis import UploadResponse
from app.services.upload_service import UploadService, UploadValidationError

router = APIRouter(prefix="/upload", tags=["analysis"])


def get_upload_service() -> UploadService:
    """Create a stateless upload service for the configured local root."""
    return UploadService(settings.upload_root)


UploadServiceDependency = Annotated[UploadService, Depends(get_upload_service)]


@router.post(
    "/lightcurve",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_lightcurve(
    service: UploadServiceDependency,
    file: Annotated[UploadFile, File(description="CSV, FITS, or TXT light curve")],
) -> UploadResponse:
    """Validate and store one light-curve file for later analysis."""
    try:
        result = await service.save(file)
    except UploadValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    return UploadResponse(**result)

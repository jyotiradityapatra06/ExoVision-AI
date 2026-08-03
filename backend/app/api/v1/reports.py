"""Version 1 scientific PDF generation and download endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.api.dependencies import OwnedAnalysisUser
from app.config.settings import settings
from app.schemas.report import ReportResponse
from app.services.report_service import ReportNotFoundError, ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


def get_report_service() -> ReportService:
    """Create a report service over configured local storage roots."""
    return ReportService(settings.upload_root, settings.report_root)


ReportServiceDependency = Annotated[ReportService, Depends(get_report_service)]


@router.post("/{analysis_id}", response_model=ReportResponse)
def generate_report(
    analysis_id: str,
    service: ReportServiceDependency,
    _user: OwnedAnalysisUser,
) -> ReportResponse:
    """Generate a professional PDF from one completed analysis."""
    try:
        result = service.generate(analysis_id)
    except ReportNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scientific report generation failed.",
        ) from error
    return ReportResponse(**result)


@router.get("/{analysis_id}/download", response_class=FileResponse)
def download_report(
    analysis_id: str,
    service: ReportServiceDependency,
    _user: OwnedAnalysisUser,
) -> FileResponse:
    """Download a previously generated scientific PDF."""
    try:
        path = service.download_path(analysis_id)
    except ReportNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=path.name,
    )

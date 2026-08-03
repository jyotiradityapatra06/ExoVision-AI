"""Schemas for generated scientific report endpoints."""

from typing import Literal

from pydantic import BaseModel


class ReportResponse(BaseModel):
    """Metadata returned after successful PDF generation."""

    analysis_id: str
    status: Literal["generated"]
    filename: str
    download_url: str

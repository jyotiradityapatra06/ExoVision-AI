"""Schemas for local upload and analysis workflow endpoints."""

from typing import Literal

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Metadata returned after durable local upload storage."""

    analysis_id: str
    filename: str
    status: Literal["uploaded"]


class AnalysisResponse(BaseModel):
    """Summary returned after synchronous analysis execution."""

    analysis_id: str
    status: Literal["completed"]
    candidate_count: int = Field(ge=0)


class AnalysisStatus(BaseModel):
    """Persisted workflow status for an analysis identifier."""

    analysis_id: str
    status: Literal["uploaded", "processing", "completed", "failed"]
    progress: int = Field(ge=0, le=100)
    error: str | None = None

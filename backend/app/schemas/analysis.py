"""Schemas for local upload and analysis workflow endpoints."""

from typing import Literal

from pydantic import BaseModel, Field

AnalysisStage = Literal[
    "ready",
    "preparing_observation",
    "analyzing_lightcurve",
    "classifying_candidate",
    "preparing_results",
    "completed",
    "failed",
]


class UploadResponse(BaseModel):
    """Metadata returned after durable local upload storage."""

    analysis_id: str
    filename: str
    status: Literal["uploaded"]


class AnalysisResponse(BaseModel):
    """Idempotent acknowledgement returned when analysis is requested."""

    analysis_id: str
    status: Literal["processing", "completed", "failed"]
    stage: AnalysisStage
    message: str
    retryable: bool = False


class AnalysisStatus(BaseModel):
    """Persisted workflow status for an analysis identifier."""

    analysis_id: str
    status: Literal["uploaded", "processing", "completed", "failed"]
    progress: int = Field(ge=0, le=100)
    stage: AnalysisStage
    message: str
    retryable: bool = False
    error: str | None = None

"""Typed public projection of persisted ExoVision analysis results."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class LightCurveData(BaseModel):
    """Raw light-curve samples for client visualization."""

    time: list[float]
    flux: list[float]
    sample_count: int = Field(ge=0)


class TransitData(BaseModel):
    """Detected transit measurements and folded samples."""

    detected: bool
    period: float | None = None
    epoch: float | None = None
    duration: float | None = None
    depth: float | None = None
    snr: float | None = None
    phase: list[float] = Field(default_factory=list)
    flux: list[float] = Field(default_factory=list)


class CandidateResult(BaseModel):
    """Ranked candidate classification and scientific evidence."""

    rank: int = Field(ge=1)
    candidate_id: str
    classification: str
    confidence: float = Field(ge=0.0, le=1.0)
    period: float | None = None
    depth: float | None = None
    snr: float | None = None
    explanation: dict[str, Any]


class ResultResponse(BaseModel):
    """Complete visualization-ready analysis response."""

    analysis_id: str
    summary: dict[str, Any]
    lightcurve: LightCurveData
    transit: TransitData
    candidates: list[CandidateResult]

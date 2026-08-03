"""Pydantic request and response schemas for ML inference endpoints."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CandidateFeatures(BaseModel):
    """Partial prepared features accepted by the prediction endpoint."""

    model_config = ConfigDict(extra="forbid")

    period: float | None = None
    epoch: float | None = None
    duration: float | None = None
    depth: float | None = None
    depth_consistency: float | None = None
    number_of_transits: int | None = Field(default=None, ge=0)
    transit_snr: float | None = None
    noise_level: float | None = None
    folding_snr_improvement: float | None = None
    symmetry_score: float | None = None
    ingress_egress_ratio: float | None = None
    transit_width: float | None = None
    phase_folded_variance: float | None = None
    odd_even_depth_difference: float | None = None
    secondary_eclipse_indicator: float | None = None
    stellar_variability_score: float | None = None
    heuristic_confidence_score: float | None = None
    candidate_category: int | None = None


class PredictionRequest(BaseModel):
    """Prepared feature prediction request."""

    model_config = ConfigDict(extra="forbid")

    candidate_id: str = Field(min_length=1)
    features: CandidateFeatures


class CandidateAnalysisRequest(BaseModel):
    """Full serialized Phase 2 candidate analysis request."""

    model_config = ConfigDict(extra="forbid")

    candidate: dict[str, Any]


class ClassificationResponse(BaseModel):
    """Predicted scientific class and model confidence."""

    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class FeatureContributionResponse(BaseModel):
    """One importance-ranked piece of classification evidence."""

    feature: str
    value: float
    importance: float
    direction: Literal["positive", "negative", "neutral"]
    impact: Literal["positive", "negative", "neutral"]
    score: float
    description: str
    used_default: bool


class ExplanationResponse(BaseModel):
    """Human-readable evidence returned with a prediction."""

    prediction: str
    confidence: float = Field(ge=0.0, le=1.0)
    feature_contributions: list[FeatureContributionResponse]
    feature_importance: list[dict[str, str | float]]
    positive_factors: list[str]
    negative_factors: list[str]
    missing_features: list[str]
    summary: str
    method: str


class PredictionResponse(BaseModel):
    """Complete response for prepared feature classification."""

    candidate_id: str
    classification: ClassificationResponse
    probabilities: dict[str, float]
    explanation: ExplanationResponse


class CandidateReportResponse(BaseModel):
    """Scientific candidate report returned by full analysis."""

    candidate_id: str
    classification: ClassificationResponse
    evidence: dict[str, list[str]]
    feature_contributions: list[FeatureContributionResponse]
    summary: str
    missing_features: list[str]
    probabilities: dict[str, float]


class ModelInfoResponse(BaseModel):
    """Public metadata for the active classification model."""

    model: str
    version: str
    classes: list[str]
    features_count: int
    features: list[str]

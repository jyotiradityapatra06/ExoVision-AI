"""Version 1 ML inference endpoints."""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ai.ml.service import MLInferenceService
from app.api.dependencies import CurrentUser
from app.schemas.ml import (
    CandidateAnalysisRequest,
    CandidateReportResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

router = APIRouter(prefix="/ml", tags=["machine-learning"])


@lru_cache(maxsize=1)
def get_ml_service() -> MLInferenceService:
    """Load and cache one inference service for the current API process."""
    try:
        return MLInferenceService()
    except (FileNotFoundError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The ML model artifact is unavailable or incompatible.",
        ) from error


MLServiceDependency = Annotated[MLInferenceService, Depends(get_ml_service)]


@router.post("/predict", response_model=PredictionResponse)
def predict_candidate(
    request: PredictionRequest,
    _user: CurrentUser,
    service: MLServiceDependency,
) -> PredictionResponse:
    """Classify a prepared candidate and explain the result."""
    try:
        result = service.predict_candidate(
            request.features.model_dump(exclude_none=True)
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    return PredictionResponse(candidate_id=request.candidate_id, **result)


@router.post("/analyze", response_model=CandidateReportResponse)
def analyze_candidate(
    request: CandidateAnalysisRequest,
    _user: CurrentUser,
    service: MLServiceDependency,
) -> CandidateReportResponse:
    """Run complete ML inference, explanation, and report generation."""
    try:
        result = service.analyze_candidate(request.candidate)
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    return CandidateReportResponse(**result)


@router.get("/info", response_model=ModelInfoResponse)
def model_info(service: MLServiceDependency) -> ModelInfoResponse:
    """Describe the active model and expected feature schema."""
    return ModelInfoResponse(**service.model_info())

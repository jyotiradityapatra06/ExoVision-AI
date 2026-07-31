"""Evaluation metrics and benchmark modules."""

from ai.evaluation.candidate_scoring import (
    CandidateConfidenceScore,
    CandidateScoringConfig,
    ComponentWeights,
    ScoreCategory,
    ScoreComponent,
    ScorePenalty,
    rank_transit_candidates,
    score_transit_candidate,
)
from ai.evaluation.transit_recovery import (
    HarmonicClassification,
    InjectedTransitParameters,
    RecoveryThresholds,
    TransitRecoveryResult,
    calculate_absolute_period_error,
    calculate_depth_error,
    calculate_duration_error,
    calculate_period_ratio,
    calculate_relative_period_error,
    calculate_wrapped_epoch_error,
    classify_period_harmonic,
    evaluate_transit_recovery,
)

__all__ = [
    "CandidateConfidenceScore",
    "CandidateScoringConfig",
    "ComponentWeights",
    "HarmonicClassification",
    "InjectedTransitParameters",
    "RecoveryThresholds",
    "ScoreCategory",
    "ScoreComponent",
    "ScorePenalty",
    "TransitRecoveryResult",
    "calculate_absolute_period_error",
    "calculate_depth_error",
    "calculate_duration_error",
    "calculate_period_ratio",
    "calculate_relative_period_error",
    "calculate_wrapped_epoch_error",
    "classify_period_harmonic",
    "evaluate_transit_recovery",
    "rank_transit_candidates",
    "score_transit_candidate",
]

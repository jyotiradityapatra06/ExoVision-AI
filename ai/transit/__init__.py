"""Phase-folded transit analysis utilities."""

from ai.transit.candidate_extraction import (
    CandidateDataQuality,
    CandidateThresholds,
    FoldedTransitStatistics,
    OddEvenConsistency,
    TransitCandidate,
    TransitEvent,
    build_transit_candidate,
    evaluate_odd_even_consistency,
    extract_transit_events,
)
from ai.transit.phase_folding import (
    FoldedLightCurve,
    PhaseBinnedLightCurve,
    TransitWindow,
    bin_folded_lightcurve,
    extract_transit_window,
    fold_detection_result,
    fold_lightcurve,
)

__all__ = [
    "CandidateDataQuality",
    "CandidateThresholds",
    "FoldedLightCurve",
    "FoldedTransitStatistics",
    "OddEvenConsistency",
    "PhaseBinnedLightCurve",
    "TransitCandidate",
    "TransitEvent",
    "TransitWindow",
    "bin_folded_lightcurve",
    "build_transit_candidate",
    "evaluate_odd_even_consistency",
    "extract_transit_window",
    "extract_transit_events",
    "fold_detection_result",
    "fold_lightcurve",
]

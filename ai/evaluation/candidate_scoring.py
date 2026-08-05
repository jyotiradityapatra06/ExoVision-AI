"""Transparent heuristic quality scoring for transit candidates.

Scores rank engineering-quality candidates on a 0--100 scale. They are not
formal probabilities of planetary origin.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from numbers import Real
from typing import TYPE_CHECKING, Any, Sequence

import numpy as np

from ai.evaluation.transit_recovery import HarmonicClassification

if TYPE_CHECKING:
    from ai.transit.candidate_extraction import TransitCandidate


class ScoreCategory(str, Enum):
    """Candidate quality category derived from score thresholds."""

    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class ComponentWeights:
    """Nonnegative component weights normalized internally during scoring."""

    detector_significance: float = 1.0
    transit_snr: float = 1.0
    robust_snr: float = 1.0
    observed_transits: float = 1.0
    fully_observed_transits: float = 1.0
    in_transit_samples: float = 1.0
    baseline_samples: float = 1.0
    depth_consistency: float = 1.0
    phase_coverage: float = 1.0
    phase_bin_coverage: float = 1.0
    valid_sample_fraction: float = 1.0
    geometry_plausibility: float = 1.0
    odd_even_consistency: float = 1.0
    recovery_accuracy: float = 1.0

    def __post_init__(self) -> None:
        values = asdict(self)
        for name, raw_value in values.items():
            value = _finite_float(name, raw_value)
            if value < 0:
                raise ValueError(f"Weight '{name}' cannot be negative.")
            object.__setattr__(self, name, value)
        if not any(value > 0 for value in values.values()):
            raise ValueError("At least one component weight must be positive.")


@dataclass(frozen=True, slots=True)
class CandidateScoringConfig:
    """Thresholds, penalties, weights, and hard-rejection switches."""

    weights: ComponentWeights = field(default_factory=ComponentWeights)
    high_score_threshold: float = 75.0
    moderate_score_threshold: float = 50.0
    low_score_threshold: float = 25.0
    target_transit_snr: float = 10.0
    minimum_transit_snr: float = 3.0
    target_robust_snr: float = 8.0
    target_observed_transits: int = 4
    minimum_observed_transits: int = 2
    target_fully_observed_transits: int = 3
    target_in_transit_samples: int = 20
    minimum_in_transit_samples: int = 5
    target_baseline_samples: int = 50
    minimum_baseline_samples: int = 10
    depth_ratio_tolerance: float = 0.5
    target_phase_coverage: float = 0.8
    minimum_phase_coverage: float = 0.3
    target_valid_sample_fraction: float = 0.95
    minimum_valid_sample_fraction: float = 0.7
    maximum_quality_flagged_fraction: float = 0.1
    minimum_duration_period_ratio: float = 0.001
    preferred_duration_period_ratio: float = 0.03
    maximum_duration_period_ratio: float = 0.2
    odd_even_relative_tolerance: float = 0.5
    accepted_recovery_harmonics: tuple[HarmonicClassification, ...] = (
        HarmonicClassification.FUNDAMENTAL,
    )
    low_snr_penalty: float = 10.0
    insufficient_events_penalty: float = 10.0
    insufficient_transit_samples_penalty: float = 10.0
    insufficient_baseline_samples_penalty: float = 10.0
    poor_valid_fraction_penalty: float = 10.0
    quality_flags_penalty: float = 10.0
    poor_phase_coverage_penalty: float = 10.0
    geometry_penalty: float = 15.0
    depth_inconsistency_penalty: float = 10.0
    odd_even_mismatch_penalty: float = 10.0
    detector_not_detected_penalty: float = 25.0
    incorrect_recovery_penalty: float = 20.0
    invalid_values_penalty: float = 100.0
    reject_invalid_values: bool = True
    reject_detector_not_detected: bool = True
    reject_insufficient_events: bool = False
    reject_implausible_geometry: bool = True
    reject_incorrect_recovery: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.weights, ComponentWeights):
            raise ValueError("weights must be a ComponentWeights instance.")
        numeric_names = (
            "high_score_threshold",
            "moderate_score_threshold",
            "low_score_threshold",
            "target_transit_snr",
            "minimum_transit_snr",
            "target_robust_snr",
            "depth_ratio_tolerance",
            "target_phase_coverage",
            "minimum_phase_coverage",
            "target_valid_sample_fraction",
            "minimum_valid_sample_fraction",
            "maximum_quality_flagged_fraction",
            "minimum_duration_period_ratio",
            "preferred_duration_period_ratio",
            "maximum_duration_period_ratio",
            "odd_even_relative_tolerance",
            "low_snr_penalty",
            "insufficient_events_penalty",
            "insufficient_transit_samples_penalty",
            "insufficient_baseline_samples_penalty",
            "poor_valid_fraction_penalty",
            "quality_flags_penalty",
            "poor_phase_coverage_penalty",
            "geometry_penalty",
            "depth_inconsistency_penalty",
            "odd_even_mismatch_penalty",
            "detector_not_detected_penalty",
            "incorrect_recovery_penalty",
            "invalid_values_penalty",
        )
        for name in numeric_names:
            value = _finite_float(name, getattr(self, name))
            if value < 0:
                raise ValueError(f"{name} cannot be negative.")
            object.__setattr__(self, name, value)

        if not (
            100.0
            >= self.high_score_threshold
            > self.moderate_score_threshold
            > self.low_score_threshold
            >= 0.0
        ):
            raise ValueError(
                "Category thresholds must satisfy 100 >= high > moderate > low >= 0."
            )
        if self.minimum_transit_snr > self.target_transit_snr:
            raise ValueError("minimum_transit_snr cannot exceed target_transit_snr.")
        if self.minimum_phase_coverage > self.target_phase_coverage:
            raise ValueError(
                "minimum_phase_coverage cannot exceed target_phase_coverage."
            )
        if self.minimum_valid_sample_fraction > self.target_valid_sample_fraction:
            raise ValueError("minimum_valid_sample_fraction cannot exceed its target.")
        for target_name in (
            "target_transit_snr",
            "target_robust_snr",
            "depth_ratio_tolerance",
            "target_phase_coverage",
            "target_valid_sample_fraction",
            "maximum_duration_period_ratio",
        ):
            if getattr(self, target_name) <= 0:
                raise ValueError(f"{target_name} must be positive.")
        for fraction_name in (
            "target_phase_coverage",
            "minimum_phase_coverage",
            "target_valid_sample_fraction",
            "minimum_valid_sample_fraction",
            "maximum_quality_flagged_fraction",
        ):
            if getattr(self, fraction_name) > 1:
                raise ValueError(f"{fraction_name} cannot exceed 1.")
        if not (
            0
            <= self.minimum_duration_period_ratio
            < self.preferred_duration_period_ratio
            < self.maximum_duration_period_ratio
            < 1
        ):
            raise ValueError(
                "Geometry ratios must satisfy 0 <= minimum < preferred < maximum < 1."
            )

        integer_names = (
            "target_observed_transits",
            "minimum_observed_transits",
            "target_fully_observed_transits",
            "target_in_transit_samples",
            "minimum_in_transit_samples",
            "target_baseline_samples",
            "minimum_baseline_samples",
        )
        for name in integer_names:
            value = getattr(self, name)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, np.integer))
                or value < 1
            ):
                raise ValueError(f"{name} must be a positive integer.")
            object.__setattr__(self, name, int(value))
        if self.minimum_observed_transits > self.target_observed_transits:
            raise ValueError("minimum_observed_transits cannot exceed its target.")
        if self.minimum_in_transit_samples > self.target_in_transit_samples:
            raise ValueError("minimum_in_transit_samples cannot exceed its target.")
        if self.minimum_baseline_samples > self.target_baseline_samples:
            raise ValueError("minimum_baseline_samples cannot exceed its target.")

        try:
            harmonics = tuple(
                harmonic
                if isinstance(harmonic, HarmonicClassification)
                else HarmonicClassification(harmonic)
                for harmonic in self.accepted_recovery_harmonics
            )
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "accepted_recovery_harmonics contains an invalid category."
            ) from exc
        if not harmonics or HarmonicClassification.INCORRECT in harmonics:
            raise ValueError(
                "accepted_recovery_harmonics must be non-empty and exclude incorrect."
            )
        object.__setattr__(self, "accepted_recovery_harmonics", harmonics)
        for name in (
            "reject_invalid_values",
            "reject_detector_not_detected",
            "reject_insufficient_events",
            "reject_implausible_geometry",
            "reject_incorrect_recovery",
        ):
            if not isinstance(getattr(self, name), bool):
                raise ValueError(f"{name} must be a boolean.")

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe scoring configuration."""
        payload = asdict(self)
        payload["accepted_recovery_harmonics"] = [
            harmonic.value for harmonic in self.accepted_recovery_harmonics
        ]
        payload["weight_normalization"] = "normalized_over_available_components"
        return payload


@dataclass(frozen=True, slots=True)
class ScoreComponent:
    """One bounded, weighted contribution to the confidence score."""

    name: str
    raw_value: float | str | bool | None
    normalized_value: float | None
    configured_weight: float
    normalized_weight: float
    weighted_points: float
    explanation: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class ScorePenalty:
    """One transparent score deduction."""

    name: str
    magnitude: float
    applied: bool
    deducted_points: float
    explanation: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class CandidateConfidenceScore:
    """Serializable heuristic score and complete scoring explanation."""

    candidate_id: str
    total_score: float
    score_range: tuple[float, float]
    category: ScoreCategory
    components: tuple[ScoreComponent, ...]
    penalties: tuple[ScorePenalty, ...]
    hard_failure_flags: tuple[str, ...]
    warning_flags: tuple[str, ...]
    reasons: tuple[str, ...]
    configuration: CandidateScoringConfig
    metadata: dict[str, Any]

    @property
    def rejected(self) -> bool:
        return self.category is ScoreCategory.REJECTED

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-safe scoring report."""
        return {
            "candidate_id": self.candidate_id,
            "total_score": self.total_score,
            "score_range": list(self.score_range),
            "category": self.category.value,
            "rejected": self.rejected,
            "components": [component.to_dict() for component in self.components],
            "penalties": [penalty.to_dict() for penalty in self.penalties],
            "hard_failure_flags": list(self.hard_failure_flags),
            "warning_flags": list(self.warning_flags),
            "reasons": list(self.reasons),
            "configuration": self.configuration.to_dict(),
            "metadata": dict(self.metadata),
        }


def score_transit_candidate(
    candidate: TransitCandidate,
    config: CandidateScoringConfig | None = None,
) -> CandidateConfidenceScore:
    """Score a candidate for ranking; the result is not a probability."""
    from ai.transit.candidate_extraction import TransitCandidate

    if not isinstance(candidate, TransitCandidate):
        raise ValueError("candidate must be a TransitCandidate instance.")
    scoring = config or CandidateScoringConfig()
    if not isinstance(scoring, CandidateScoringConfig):
        raise ValueError("config must be a CandidateScoringConfig instance.")

    invalid_fields = _nonfinite_candidate_fields(candidate)
    hard_failures: list[str] = []
    if invalid_fields and scoring.reject_invalid_values:
        hard_failures.append("non_finite_candidate_values")
    if not candidate.detection.detected and scoring.reject_detector_not_detected:
        hard_failures.append("detector_not_detected")
    if (
        candidate.observed_transit_events < scoring.minimum_observed_transits
        and scoring.reject_insufficient_events
    ):
        hard_failures.append("insufficient_observed_transits")
    geometry_valid = (
        scoring.minimum_duration_period_ratio
        <= _safe_number(candidate.duration_period_ratio)
        <= scoring.maximum_duration_period_ratio
    )
    if not geometry_valid and scoring.reject_implausible_geometry:
        hard_failures.append("implausible_transit_geometry")
    recovery_accepted = _recovery_accepted(candidate, scoring)
    if (
        candidate.recovery is not None
        and not recovery_accepted
        and scoring.reject_incorrect_recovery
    ):
        hard_failures.append("recovery_validation_failed")

    component_inputs = _component_inputs(candidate, scoring, geometry_valid)
    weight_values = asdict(scoring.weights)
    available_weight = sum(
        weight_values[name]
        for name, (_, normalized, _) in component_inputs.items()
        if normalized is not None and weight_values[name] > 0
    )
    components: list[ScoreComponent] = []
    base_score = 0.0
    for name, (raw_value, normalized, explanation) in component_inputs.items():
        configured_weight = weight_values[name]
        normalized_weight = (
            configured_weight / available_weight
            if normalized is not None and available_weight > 0
            else 0.0
        )
        points = (
            100.0 * normalized * normalized_weight if normalized is not None else 0.0
        )
        base_score += points
        components.append(
            ScoreComponent(
                name=name,
                raw_value=raw_value,
                normalized_value=normalized,
                configured_weight=configured_weight,
                normalized_weight=normalized_weight,
                weighted_points=points,
                explanation=explanation,
            )
        )

    penalties = _score_penalties(
        candidate,
        scoring,
        invalid_fields,
        geometry_valid,
        recovery_accepted,
    )
    deducted = sum(penalty.deducted_points for penalty in penalties)
    total_score = float(np.clip(base_score - deducted, 0.0, 100.0))
    category = _score_category(total_score, bool(hard_failures), scoring)
    warnings = list(candidate.warnings)
    warnings.extend(penalty.name for penalty in penalties if penalty.applied)
    if candidate.recovery is None:
        warnings.append("recovery_metadata_unavailable")
    if available_weight == 0:
        warnings.append("no_available_weighted_components")
    reasons = [f"{component.name}: {component.explanation}" for component in components]
    reasons.extend(penalty.explanation for penalty in penalties if penalty.applied)
    reasons.extend(f"Hard rejection: {flag}." for flag in hard_failures)
    if category is ScoreCategory.REJECTED and not hard_failures:
        reasons.append("Score is below the configured low-category threshold.")

    return CandidateConfidenceScore(
        candidate_id=candidate.candidate_id,
        total_score=total_score,
        score_range=(0.0, 100.0),
        category=category,
        components=tuple(components),
        penalties=penalties,
        hard_failure_flags=tuple(dict.fromkeys(hard_failures)),
        warning_flags=tuple(dict.fromkeys(warnings)),
        reasons=tuple(reasons),
        configuration=scoring,
        metadata={
            "score_type": "heuristic_engineering_quality",
            "is_probability": False,
            "base_score_before_penalties": float(np.clip(base_score, 0.0, 100.0)),
            "total_penalty": deducted,
            "weights_normalized_internally": True,
        },
    )


def rank_transit_candidates(
    candidates: Sequence[TransitCandidate],
    config: CandidateScoringConfig | None = None,
) -> tuple[CandidateConfidenceScore, ...]:
    """Score and deterministically rank candidates, placing rejections last."""
    scores = [score_transit_candidate(candidate, config) for candidate in candidates]
    return tuple(
        sorted(
            scores,
            key=lambda result: (
                result.rejected,
                -result.total_score,
                result.candidate_id,
            ),
        )
    )


def _component_inputs(
    candidate: TransitCandidate,
    config: CandidateScoringConfig,
    geometry_valid: bool,
) -> dict[str, tuple[float | str | bool | None, float | None, str]]:
    stats = candidate.folded_statistics
    quality = candidate.data_quality
    depth_ratio = stats.measured_to_detector_depth_ratio
    depth_consistency = (
        None
        if depth_ratio is None or not np.isfinite(depth_ratio)
        else _clamp01(1.0 - abs(depth_ratio - 1.0) / config.depth_ratio_tolerance)
    )
    ratio = _safe_number(candidate.duration_period_ratio)
    geometry_score = _clamp01(
        1.0
        - abs(ratio - config.preferred_duration_period_ratio)
        / max(
            config.preferred_duration_period_ratio
            - config.minimum_duration_period_ratio,
            config.maximum_duration_period_ratio
            - config.preferred_duration_period_ratio,
        )
    )
    odd_even_score = _odd_even_score(candidate, config)
    recovery_score = (
        None
        if candidate.recovery is None
        else (1.0 if _recovery_accepted(candidate, config) else 0.0)
    )
    phase_bin_coverage = (
        quality.populated_phase_bins / quality.total_phase_bins
        if quality.total_phase_bins > 0
        else 0.0
    )
    return {
        "detector_significance": (
            candidate.detection.detected,
            1.0 if candidate.detection.detected else 0.0,
            "1 when the existing detector significance flag is true.",
        ),
        "transit_snr": (
            candidate.transit_snr,
            _ratio_score(candidate.transit_snr, config.target_transit_snr),
            f"SNR divided by target {config.target_transit_snr:g}, capped at 1.",
        ),
        "robust_snr": (
            stats.robust_snr,
            (
                0.0
                if stats.robust_snr is None
                else _ratio_score(stats.robust_snr, config.target_robust_snr)
            ),
            "MAD-based SNR divided by its configured target, capped at 1.",
        ),
        "observed_transits": (
            candidate.observed_transit_events,
            _ratio_score(
                candidate.observed_transit_events,
                config.target_observed_transits,
            ),
            "Observed event count divided by its target, capped at 1.",
        ),
        "fully_observed_transits": (
            quality.fully_observed_events,
            _ratio_score(
                quality.fully_observed_events,
                config.target_fully_observed_transits,
            ),
            "Fully covered event count divided by its target, capped at 1.",
        ),
        "in_transit_samples": (
            candidate.in_transit_sample_count,
            _ratio_score(
                candidate.in_transit_sample_count,
                config.target_in_transit_samples,
            ),
            "In-transit sample count divided by its target, capped at 1.",
        ),
        "baseline_samples": (
            candidate.out_of_transit_sample_count,
            _ratio_score(
                candidate.out_of_transit_sample_count,
                config.target_baseline_samples,
            ),
            "Local baseline sample count divided by its target, capped at 1.",
        ),
        "depth_consistency": (
            depth_ratio,
            depth_consistency,
            "Linear agreement of measured and detector depth within tolerance.",
        ),
        "phase_coverage": (
            quality.phase_coverage,
            _ratio_score(quality.phase_coverage, config.target_phase_coverage),
            "Phase coverage divided by its configured target, capped at 1.",
        ),
        "phase_bin_coverage": (
            phase_bin_coverage,
            _ratio_score(phase_bin_coverage, config.target_phase_coverage),
            "Populated phase-bin fraction divided by the coverage target.",
        ),
        "valid_sample_fraction": (
            quality.valid_sample_fraction,
            _ratio_score(
                quality.valid_sample_fraction,
                config.target_valid_sample_fraction,
            ),
            "Valid sample fraction divided by its target, capped at 1.",
        ),
        "geometry_plausibility": (
            ratio,
            geometry_score if geometry_valid else 0.0,
            "Triangular duration/period score around the preferred ratio.",
        ),
        "odd_even_consistency": (
            candidate.odd_even.status,
            odd_even_score,
            "Alternating-depth heuristic; mismatch is not a binary-star proof.",
        ),
        "recovery_accuracy": (
            None if candidate.recovery is None else candidate.recovery.harmonic.value,
            recovery_score,
            "Available only when synthetic recovery metadata is supplied.",
        ),
    }


def _score_penalties(
    candidate: TransitCandidate,
    config: CandidateScoringConfig,
    invalid_fields: tuple[str, ...],
    geometry_valid: bool,
    recovery_accepted: bool,
) -> tuple[ScorePenalty, ...]:
    quality = candidate.data_quality
    stats = candidate.folded_statistics
    depth_ratio = stats.measured_to_detector_depth_ratio
    rules = (
        (
            "invalid_values",
            bool(invalid_fields),
            config.invalid_values_penalty,
            f"Non-finite fields: {', '.join(invalid_fields)}.",
        ),
        (
            "detector_not_detected",
            not candidate.detection.detected,
            config.detector_not_detected_penalty,
            "Existing detector significance flag is false.",
        ),
        (
            "low_transit_snr",
            _safe_number(candidate.transit_snr) < config.minimum_transit_snr,
            config.low_snr_penalty,
            "Transit SNR is below the configured minimum.",
        ),
        (
            "insufficient_observed_transits",
            candidate.observed_transit_events < config.minimum_observed_transits,
            config.insufficient_events_penalty,
            "Observed event count is below the configured minimum.",
        ),
        (
            "insufficient_in_transit_samples",
            candidate.in_transit_sample_count < config.minimum_in_transit_samples,
            config.insufficient_transit_samples_penalty,
            "In-transit sample support is below the configured minimum.",
        ),
        (
            "insufficient_baseline_samples",
            candidate.out_of_transit_sample_count < config.minimum_baseline_samples,
            config.insufficient_baseline_samples_penalty,
            "Local baseline support is below the configured minimum.",
        ),
        (
            "poor_valid_sample_fraction",
            _safe_number(quality.valid_sample_fraction)
            < config.minimum_valid_sample_fraction,
            config.poor_valid_fraction_penalty,
            "Valid-sample fraction is below the configured minimum.",
        ),
        (
            "excessive_quality_flags",
            quality.quality_flagged_fraction is not None
            and _safe_number(quality.quality_flagged_fraction)
            > config.maximum_quality_flagged_fraction,
            config.quality_flags_penalty,
            "Quality-flagged fraction exceeds the configured maximum.",
        ),
        (
            "poor_phase_coverage",
            _safe_number(quality.phase_coverage) < config.minimum_phase_coverage,
            config.poor_phase_coverage_penalty,
            "Phase coverage is below the configured minimum.",
        ),
        (
            "implausible_geometry",
            not geometry_valid,
            config.geometry_penalty,
            "Duration-to-period ratio lies outside configured geometry limits.",
        ),
        (
            "depth_inconsistency",
            depth_ratio is None
            or not np.isfinite(depth_ratio)
            or abs(depth_ratio - 1.0) > config.depth_ratio_tolerance,
            config.depth_inconsistency_penalty,
            "Measured depth differs from detector depth beyond tolerance.",
        ),
        (
            "odd_even_mismatch",
            candidate.odd_even.status == "inconsistent",
            config.odd_even_mismatch_penalty,
            "Odd/even depths differ beyond the heuristic tolerance.",
        ),
        (
            "incorrect_recovery",
            candidate.recovery is not None and not recovery_accepted,
            config.incorrect_recovery_penalty,
            "Recovery metadata does not satisfy accepted recovery criteria.",
        ),
    )
    return tuple(
        ScorePenalty(
            name=name,
            magnitude=magnitude,
            applied=applied,
            deducted_points=magnitude if applied else 0.0,
            explanation=explanation,
        )
        for name, applied, magnitude, explanation in rules
    )


def _odd_even_score(
    candidate: TransitCandidate, config: CandidateScoringConfig
) -> float:
    odd_even = candidate.odd_even
    if odd_even.status == "consistent":
        return 1.0
    if odd_even.status == "insufficient_events":
        return 0.5
    difference = odd_even.relative_depth_difference
    if difference is None:
        return 0.0
    if config.odd_even_relative_tolerance == 0:
        return 0.0
    return _clamp01(1.0 - difference / config.odd_even_relative_tolerance)


def _recovery_accepted(
    candidate: TransitCandidate, config: CandidateScoringConfig
) -> bool:
    recovery = candidate.recovery
    return bool(
        recovery is not None
        and recovery.recovered
        and recovery.harmonic in config.accepted_recovery_harmonics
    )


def _nonfinite_candidate_fields(candidate: TransitCandidate) -> tuple[str, ...]:
    values = {
        "period_days": candidate.period_days,
        "duration_days": candidate.duration_days,
        "depth": candidate.depth,
        "transit_snr": candidate.transit_snr,
        "bls_power": candidate.detection.power,
        "duration_period_ratio": candidate.duration_period_ratio,
        "valid_sample_fraction": candidate.data_quality.valid_sample_fraction,
        "phase_coverage": candidate.data_quality.phase_coverage,
        "measured_depth": candidate.folded_statistics.measured_depth,
        "robust_snr": candidate.folded_statistics.robust_snr,
    }
    return tuple(
        name
        for name, value in values.items()
        if value is not None
        and (
            isinstance(value, bool)
            or not isinstance(value, Real)
            or not np.isfinite(value)
        )
    )


def _score_category(
    score: float, hard_rejected: bool, config: CandidateScoringConfig
) -> ScoreCategory:
    if hard_rejected or score < config.low_score_threshold:
        return ScoreCategory.REJECTED
    if score >= config.high_score_threshold:
        return ScoreCategory.HIGH
    if score >= config.moderate_score_threshold:
        return ScoreCategory.MODERATE
    return ScoreCategory.LOW


def _ratio_score(value: Real, target: Real) -> float:
    return _clamp01(_safe_number(value) / _safe_number(target))


def _safe_number(value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not np.isfinite(value):
        return 0.0
    return float(value)


def _clamp01(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def _finite_float(name: str, value: Real) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not np.isfinite(value):
        raise ValueError(f"{name} must be a finite number.")
    return float(value)

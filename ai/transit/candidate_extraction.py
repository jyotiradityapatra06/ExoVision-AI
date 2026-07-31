"""Transit-event extraction and numerical candidate feature generation."""

import hashlib
from dataclasses import asdict, dataclass
from numbers import Real
from typing import Any, Literal

import numpy as np

from ai.detection.models import TransitDetectionResult
from ai.evaluation.transit_recovery import TransitRecoveryResult
from ai.transit.phase_folding import (
    FoldedLightCurve,
    bin_folded_lightcurve,
    extract_transit_window,
    fold_detection_result,
)


@dataclass(frozen=True, slots=True)
class CandidateThresholds:
    """Configurable thresholds for candidate features and warnings."""

    minimum_in_transit_samples: int = 3
    minimum_baseline_samples: int = 5
    phase_bins: int = 50
    baseline_outer_factor: float = 3.0
    odd_even_relative_tolerance: float = 0.5
    minimum_events_for_odd_even: int = 2
    minimum_measured_snr: float = 3.0

    def __post_init__(self) -> None:
        for name in (
            "minimum_in_transit_samples",
            "minimum_baseline_samples",
            "phase_bins",
            "minimum_events_for_odd_even",
        ):
            value = getattr(self, name)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, np.integer))
                or value < 1
            ):
                raise ValueError(f"{name} must be a positive integer.")
            object.__setattr__(self, name, int(value))
        for name in (
            "baseline_outer_factor",
            "odd_even_relative_tolerance",
            "minimum_measured_snr",
        ):
            value = _finite_float(name, getattr(self, name))
            if value < 0:
                raise ValueError(f"{name} cannot be negative.")
            object.__setattr__(self, name, value)
        if self.baseline_outer_factor <= 1:
            raise ValueError("baseline_outer_factor must be greater than 1.")


@dataclass(frozen=True, slots=True)
class TransitEvent:
    """Measurements for one expected transit in the observation timeline."""

    event_number: int
    expected_center_time: float
    window_start: float
    window_end: float
    fully_observed: bool
    sample_count: int
    baseline_sample_count: int
    local_depth: float | None
    local_scatter: float | None
    local_snr: float | None
    warnings: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe event values."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class OddEvenConsistency:
    """Heuristic comparison of alternating measured transit depths."""

    odd_median_depth: float | None
    even_median_depth: float | None
    absolute_depth_difference: float | None
    relative_depth_difference: float | None
    status: Literal["consistent", "inconsistent", "insufficient_events"]
    usable_odd_events: int
    usable_even_events: int

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe odd/even values."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class FoldedTransitStatistics:
    """Flux statistics measured in folded transit and local baseline windows."""

    in_transit_mean: float | None
    in_transit_median: float | None
    in_transit_std: float | None
    in_transit_mad: float | None
    baseline_mean: float | None
    baseline_median: float | None
    baseline_std: float | None
    baseline_mad: float | None
    local_baseline_level: float | None
    measured_depth: float | None
    measured_to_detector_depth_ratio: float | None
    measured_snr: float | None
    robust_snr: float | None

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe folded statistics."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class CandidateDataQuality:
    """Coverage, filtering, binning, and quality-flag indicators."""

    valid_sample_fraction: float
    rejected_sample_fraction: float
    phase_coverage: float
    populated_phase_bins: int
    total_phase_bins: int
    quality_flagged_fraction: float | None
    fully_observed_events: int
    partially_observed_events: int

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe data-quality values."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class TransitCandidate:
    """Serializable transit candidate assembled from detector and folded data."""

    candidate_id: str
    source_id: str | None
    detection: TransitDetectionResult
    observed_transit_events: int
    in_transit_sample_count: int
    out_of_transit_sample_count: int
    duration_period_ratio: float
    transit_phase_fraction: float
    folded_statistics: FoldedTransitStatistics
    data_quality: CandidateDataQuality
    events: tuple[TransitEvent, ...]
    odd_even: OddEvenConsistency
    recovery: TransitRecoveryResult | None
    warnings: tuple[str, ...]
    metadata: dict[str, Any]

    @property
    def period_days(self) -> float:
        return self.detection.period_days

    @property
    def transit_epoch(self) -> float:
        return self.detection.transit_time

    @property
    def duration_days(self) -> float:
        return self.detection.duration_days

    @property
    def depth(self) -> float:
        return self.detection.depth

    @property
    def transit_snr(self) -> float:
        return self.detection.snr

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-safe nested candidate dictionary."""
        return {
            "candidate_id": self.candidate_id,
            "source_id": self.source_id,
            "detection_status": self.detection.detected,
            "period_days": self.period_days,
            "transit_epoch": self.transit_epoch,
            "duration_days": self.duration_days,
            "depth": self.depth,
            "depth_error": self.detection.depth_error,
            "transit_snr": self.transit_snr,
            "bls_power": self.detection.power,
            "false_alarm_probability": self.detection.false_alarm_probability,
            "observed_transit_events": self.observed_transit_events,
            "in_transit_sample_count": self.in_transit_sample_count,
            "out_of_transit_sample_count": self.out_of_transit_sample_count,
            "duration_period_ratio": self.duration_period_ratio,
            "transit_phase_fraction": self.transit_phase_fraction,
            "folded_statistics": self.folded_statistics.to_dict(),
            "data_quality": self.data_quality.to_dict(),
            "events": [event.to_dict() for event in self.events],
            "odd_even": self.odd_even.to_dict(),
            "recovery": (
                None if self.recovery is None else _json_safe(self.recovery.to_dict())
            ),
            "warnings": list(self.warnings),
            "metadata": _json_safe(dict(self.metadata)),
        }


def extract_transit_events(
    time: np.ndarray,
    flux: np.ndarray,
    period: Real,
    transit_epoch: Real,
    transit_duration: Real,
    flux_error: np.ndarray | None = None,
) -> tuple[TransitEvent, ...]:
    """Measure expected transit events intersecting an observation timeline."""
    time_arr, flux_arr, error_arr = _validated_series(time, flux, flux_error)
    valid_period = _finite_float("period", period)
    epoch = _finite_float("transit_epoch", transit_epoch)
    duration = _finite_float("transit_duration", transit_duration)
    if valid_period <= 0:
        raise ValueError("period must be positive.")
    if duration <= 0 or duration >= valid_period:
        raise ValueError(
            "transit_duration must be positive and smaller than period."
        )

    valid = np.isfinite(time_arr) & np.isfinite(flux_arr)
    if error_arr is not None:
        valid &= np.isfinite(error_arr) & (error_arr > 0)
    time_arr = time_arr[valid]
    flux_arr = flux_arr[valid]
    error_arr = None if error_arr is None else error_arr[valid]
    if len(time_arr) == 0:
        raise ValueError("No valid samples remain for event extraction.")
    order = np.argsort(time_arr, kind="stable")
    time_arr = time_arr[order]
    flux_arr = flux_arr[order]
    error_arr = None if error_arr is None else error_arr[order]

    start = float(time_arr[0])
    end = float(time_arr[-1])
    half_duration = duration / 2.0
    first_cycle = int(np.ceil((start - half_duration - epoch) / valid_period))
    last_cycle = int(np.floor((end + half_duration - epoch) / valid_period))
    cadence = (
        float(np.median(np.diff(np.unique(time_arr)))) if len(time_arr) > 1 else 0.0
    )
    events: list[TransitEvent] = []

    for sequence, cycle in enumerate(range(first_cycle, last_cycle + 1), start=1):
        center = epoch + cycle * valid_period
        window_start = center - half_duration
        window_end = center + half_duration
        distance = np.abs(time_arr - center)
        transit_mask = distance <= half_duration
        baseline_mask = (distance > half_duration) & (
            distance <= 1.5 * duration
        )
        transit_flux = flux_arr[transit_mask]
        baseline_flux = flux_arr[baseline_mask]
        warnings: list[str] = []

        boundary_complete = window_start >= start and window_end <= end
        coverage_complete = False
        if len(transit_flux) > 0:
            event_times = time_arr[transit_mask]
            edge_allowance = max(cadence * 1.5, duration * 0.1)
            no_internal_gap = bool(
                len(event_times) == 1
                or cadence == 0
                or np.max(np.diff(event_times)) <= cadence * 1.5
            )
            coverage_complete = bool(
                event_times[0] <= window_start + edge_allowance
                and event_times[-1] >= window_end - edge_allowance
                and no_internal_gap
            )
        fully_observed = boundary_complete and coverage_complete
        if not fully_observed:
            warnings.append("partial_or_gapped_event")
        if len(transit_flux) == 0:
            warnings.append("no_in_transit_samples")
        if len(baseline_flux) == 0:
            warnings.append("no_local_baseline_samples")

        local_depth = (
            float(np.median(baseline_flux) - np.median(transit_flux))
            if len(transit_flux) and len(baseline_flux)
            else None
        )
        scatter = _robust_scatter(baseline_flux)
        local_scatter = scatter if scatter is not None else None
        local_snr: float | None = None
        if local_depth is not None and local_depth > 0 and len(transit_flux):
            if error_arr is not None:
                transit_errors = error_arr[transit_mask]
                effective_error = float(
                    np.sqrt(np.sum(transit_errors**2)) / len(transit_errors)
                )
            else:
                effective_error = (
                    scatter / np.sqrt(len(transit_flux))
                    if scatter is not None and scatter > 0
                    else 0.0
                )
            if effective_error > 0:
                local_snr = float(local_depth / effective_error)

        events.append(
            TransitEvent(
                event_number=sequence,
                expected_center_time=float(center),
                window_start=float(window_start),
                window_end=float(window_end),
                fully_observed=fully_observed,
                sample_count=len(transit_flux),
                baseline_sample_count=len(baseline_flux),
                local_depth=local_depth,
                local_scatter=local_scatter,
                local_snr=local_snr,
                warnings=tuple(warnings),
            )
        )
    return tuple(events)


def evaluate_odd_even_consistency(
    events: tuple[TransitEvent, ...],
    relative_tolerance: Real = 0.5,
    minimum_events: int = 2,
) -> OddEvenConsistency:
    """Compare alternating event depths as an eclipsing-binary heuristic."""
    tolerance = _finite_float("relative_tolerance", relative_tolerance)
    if tolerance < 0:
        raise ValueError("relative_tolerance cannot be negative.")
    if (
        isinstance(minimum_events, bool)
        or not isinstance(minimum_events, (int, np.integer))
        or minimum_events < 2
    ):
        raise ValueError("minimum_events must be an integer of at least 2.")
    usable = [
        event
        for event in events
        if event.local_depth is not None and np.isfinite(event.local_depth)
    ]
    odd = [event.local_depth for event in usable if event.event_number % 2 == 1]
    even = [event.local_depth for event in usable if event.event_number % 2 == 0]
    if len(usable) < minimum_events or not odd or not even:
        return OddEvenConsistency(
            odd_median_depth=None,
            even_median_depth=None,
            absolute_depth_difference=None,
            relative_depth_difference=None,
            status="insufficient_events",
            usable_odd_events=len(odd),
            usable_even_events=len(even),
        )

    odd_depth = float(np.median(odd))
    even_depth = float(np.median(even))
    difference = abs(odd_depth - even_depth)
    scale = max(abs(odd_depth), abs(even_depth), np.finfo(float).eps)
    relative_difference = difference / scale
    return OddEvenConsistency(
        odd_median_depth=odd_depth,
        even_median_depth=even_depth,
        absolute_depth_difference=difference,
        relative_depth_difference=relative_difference,
        status=(
            "consistent" if relative_difference <= tolerance else "inconsistent"
        ),
        usable_odd_events=len(odd),
        usable_even_events=len(even),
    )


def build_transit_candidate(
    time: np.ndarray,
    flux: np.ndarray,
    detection: TransitDetectionResult,
    flux_error: np.ndarray | None = None,
    quality: np.ndarray | None = None,
    folded: FoldedLightCurve | None = None,
    recovery: TransitRecoveryResult | None = None,
    source_id: str | None = None,
    thresholds: CandidateThresholds | None = None,
) -> TransitCandidate:
    """Build numerical features and event measurements for one BLS candidate."""
    _validate_detection(detection)
    config = thresholds or CandidateThresholds()
    if not isinstance(config, CandidateThresholds):
        raise ValueError("thresholds must be a CandidateThresholds instance.")
    time_arr, flux_arr, error_arr = _validated_series(time, flux, flux_error)
    quality_arr = _validated_quality(quality, len(time_arr))
    if source_id is not None and (not isinstance(source_id, str) or not source_id):
        raise ValueError("source_id must be a non-empty string or None.")
    if recovery is not None and not isinstance(recovery, TransitRecoveryResult):
        raise ValueError("recovery must be a TransitRecoveryResult or None.")
    if recovery is not None:
        if not np.isclose(
            recovery.detected.period_days, detection.period_days, rtol=1e-9
        ) or not np.isclose(
            recovery.detected.transit_time,
            detection.transit_time,
            atol=1e-9 * detection.period_days,
        ):
            raise ValueError("recovery result is inconsistent with detection.")

    if folded is None:
        folded_result = fold_detection_result(
            time_arr,
            flux_arr,
            detection,
            flux_error=error_arr,
            quality=quality_arr,
        )
    else:
        _validate_folded_consistency(folded, detection)
        folded_result = folded

    window = extract_transit_window(
        folded_result,
        transit_duration=detection.duration_days,
        baseline_outer_factor=config.baseline_outer_factor,
    )
    events = extract_transit_events(
        time_arr,
        flux_arr,
        detection.period_days,
        detection.transit_time,
        detection.duration_days,
        flux_error=error_arr,
    )
    odd_even = evaluate_odd_even_consistency(
        events,
        relative_tolerance=config.odd_even_relative_tolerance,
        minimum_events=config.minimum_events_for_odd_even,
    )
    statistics = _folded_statistics(window, folded_result, detection)
    binned = bin_folded_lightcurve(
        folded_result, number_bins=config.phase_bins, minimum_samples=1
    )
    original_count = len(time_arr)
    quality_flagged_fraction = (
        None
        if folded_result.quality is None
        else float(np.mean(folded_result.quality != 0))
    )
    fully_observed = sum(event.fully_observed for event in events)
    quality_indicators = CandidateDataQuality(
        valid_sample_fraction=folded_result.valid_samples / original_count,
        rejected_sample_fraction=folded_result.rejected_samples / original_count,
        phase_coverage=float(np.mean(binned.sample_counts > 0)),
        populated_phase_bins=int(np.count_nonzero(binned.sample_counts)),
        total_phase_bins=len(binned.sample_counts),
        quality_flagged_fraction=quality_flagged_fraction,
        fully_observed_events=fully_observed,
        partially_observed_events=len(events) - fully_observed,
    )

    warnings = _candidate_warnings(
        detection,
        statistics,
        quality_indicators,
        events,
        odd_even,
        recovery,
        len(window.in_transit_indices),
        len(window.baseline_indices),
        config,
    )
    candidate_id = _candidate_identifier(source_id, detection)
    observed_events = sum(event.sample_count > 0 for event in events)
    ratio = detection.duration_days / detection.period_days

    return TransitCandidate(
        candidate_id=candidate_id,
        source_id=source_id,
        detection=detection,
        observed_transit_events=observed_events,
        in_transit_sample_count=len(window.in_transit_indices),
        out_of_transit_sample_count=len(window.baseline_indices),
        duration_period_ratio=ratio,
        transit_phase_fraction=ratio,
        folded_statistics=statistics,
        data_quality=quality_indicators,
        events=events,
        odd_even=odd_even,
        recovery=recovery,
        warnings=tuple(warnings),
        metadata={
            "feature_version": "2.2D",
            "source_id": source_id,
            "baseline_outer_factor": config.baseline_outer_factor,
            "odd_even_is_heuristic": True,
        },
    )


def _folded_statistics(
    window: Any,
    folded: FoldedLightCurve,
    detection: TransitDetectionResult,
) -> FoldedTransitStatistics:
    transit = window.in_transit_flux
    baseline = window.baseline_flux
    transit_values = _summary(transit)
    baseline_values = _summary(baseline)
    baseline_level = baseline_values["median"]
    transit_level = transit_values["median"]
    measured_depth = (
        baseline_level - transit_level
        if baseline_level is not None and transit_level is not None
        else None
    )
    depth_ratio = (
        measured_depth / detection.depth
        if measured_depth is not None and detection.depth > 0
        else None
    )
    measured_snr: float | None = None
    robust_snr: float | None = None
    if measured_depth is not None and measured_depth > 0 and len(transit):
        if folded.flux_error is not None:
            errors = folded.flux_error[window.in_transit_mask]
            effective_error = float(np.sqrt(np.sum(errors**2)) / len(errors))
            if effective_error > 0:
                measured_snr = measured_depth / effective_error
        baseline_std = baseline_values["std"]
        baseline_scatter = _robust_scatter(baseline)
        if measured_snr is None and baseline_std is not None and baseline_std > 0:
            measured_snr = measured_depth * np.sqrt(len(transit)) / baseline_std
        if baseline_scatter is not None and baseline_scatter > 0:
            robust_snr = measured_depth * np.sqrt(len(transit)) / baseline_scatter

    return FoldedTransitStatistics(
        in_transit_mean=transit_values["mean"],
        in_transit_median=transit_values["median"],
        in_transit_std=transit_values["std"],
        in_transit_mad=transit_values["mad"],
        baseline_mean=baseline_values["mean"],
        baseline_median=baseline_values["median"],
        baseline_std=baseline_values["std"],
        baseline_mad=baseline_values["mad"],
        local_baseline_level=baseline_level,
        measured_depth=measured_depth,
        measured_to_detector_depth_ratio=depth_ratio,
        measured_snr=None if measured_snr is None else float(measured_snr),
        robust_snr=None if robust_snr is None else float(robust_snr),
    )


def _summary(values: np.ndarray) -> dict[str, float | None]:
    if len(values) == 0:
        return {"mean": None, "median": None, "std": None, "mad": None}
    median = float(np.median(values))
    return {
        "mean": float(np.mean(values)),
        "median": median,
        "std": float(np.std(values)),
        "mad": float(np.median(np.abs(values - median))),
    }


def _robust_scatter(values: np.ndarray) -> float | None:
    if len(values) < 2:
        return None
    median = float(np.median(values))
    scatter = float(1.4826 * np.median(np.abs(values - median)))
    if scatter <= 0:
        scatter = float(np.std(values))
    return scatter if scatter > 0 and np.isfinite(scatter) else None


def _candidate_warnings(
    detection: TransitDetectionResult,
    statistics: FoldedTransitStatistics,
    quality: CandidateDataQuality,
    events: tuple[TransitEvent, ...],
    odd_even: OddEvenConsistency,
    recovery: TransitRecoveryResult | None,
    transit_samples: int,
    baseline_samples: int,
    thresholds: CandidateThresholds,
) -> list[str]:
    warnings: list[str] = []
    if not detection.detected:
        warnings.append("detector_significance_flag_false")
    if transit_samples < thresholds.minimum_in_transit_samples:
        warnings.append("insufficient_in_transit_samples")
    if baseline_samples < thresholds.minimum_baseline_samples:
        warnings.append("insufficient_baseline_samples")
    if statistics.measured_depth is None or statistics.measured_depth <= 0:
        warnings.append("non_positive_measured_depth")
    elif (
        statistics.measured_snr is None
        or statistics.measured_snr < thresholds.minimum_measured_snr
    ):
        warnings.append("low_measured_snr")
    if statistics.baseline_std == 0:
        warnings.append("flat_local_baseline")
    if quality.quality_flagged_fraction not in (None, 0.0):
        warnings.append("quality_flagged_samples_present")
    if any(not event.fully_observed for event in events):
        warnings.append("partial_or_gapped_transit_events")
    if odd_even.status == "inconsistent":
        warnings.append("odd_even_depth_inconsistency")
    elif odd_even.status == "insufficient_events":
        warnings.append("insufficient_events_for_odd_even")
    if recovery is not None and not recovery.recovered:
        warnings.append("recovery_validation_failed")
    return warnings


def _validated_series(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray | None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None]:
    time_arr = _numeric_array("time", time)
    flux_arr = _numeric_array("flux", flux)
    error_arr = (
        None if flux_error is None else _numeric_array("flux_error", flux_error)
    )
    if len(time_arr) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(flux_arr) != len(time_arr):
        raise ValueError(
            f"Array length mismatch: time ({len(time_arr)}) vs flux ({len(flux_arr)})."
        )
    if error_arr is not None and len(error_arr) != len(time_arr):
        raise ValueError(
            f"Array length mismatch: time ({len(time_arr)}) vs "
            f"flux_error ({len(error_arr)})."
        )
    return time_arr, flux_arr, error_arr


def _validated_quality(
    quality: np.ndarray | None, expected_length: int
) -> np.ndarray | None:
    if quality is None:
        return None
    values = np.asarray(quality)
    if values.ndim != 1:
        raise ValueError("quality must be one-dimensional.")
    if len(values) != expected_length:
        raise ValueError(
            f"Array length mismatch: time ({expected_length}) vs "
            f"quality ({len(values)})."
        )
    return values


def _validate_detection(detection: TransitDetectionResult) -> None:
    if not isinstance(detection, TransitDetectionResult):
        raise ValueError("detection must be a TransitDetectionResult instance.")
    for name in ("period_days", "duration_days", "transit_time", "depth"):
        _finite_float(f"detection.{name}", getattr(detection, name))
    if detection.period_days <= 0:
        raise ValueError("detection.period_days must be positive.")
    if detection.duration_days <= 0 or detection.duration_days >= detection.period_days:
        raise ValueError(
            "detection.duration_days must be positive and smaller than period."
        )
    if detection.depth <= 0:
        raise ValueError("detection.depth must be positive.")


def _validate_folded_consistency(
    folded: FoldedLightCurve, detection: TransitDetectionResult
) -> None:
    if not isinstance(folded, FoldedLightCurve):
        raise ValueError("folded must be a FoldedLightCurve instance.")
    if not np.isclose(folded.period_days, detection.period_days, rtol=1e-9):
        raise ValueError("Supplied folded period is inconsistent with detection.")
    epoch_delta = (
        folded.transit_epoch
        - detection.transit_time
        + 0.5 * detection.period_days
    ) % detection.period_days - 0.5 * detection.period_days
    if not np.isclose(epoch_delta, 0.0, atol=1e-9 * detection.period_days):
        raise ValueError("Supplied folded epoch is inconsistent with detection.")


def _candidate_identifier(
    source_id: str | None, detection: TransitDetectionResult
) -> str:
    identity = (
        f"{source_id or 'anonymous'}|{detection.period_days:.12g}|"
        f"{detection.transit_time:.12g}"
    )
    digest = hashlib.sha1(identity.encode("utf-8")).hexdigest()[:12]
    return f"exovision-{digest}"


def _numeric_array(name: str, values: np.ndarray) -> np.ndarray:
    try:
        array = np.asarray(values, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must contain numeric values.") from exc
    if array.ndim != 1:
        raise ValueError(f"{name} must be one-dimensional.")
    return array


def _finite_float(name: str, value: Real) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, Real)
        or not np.isfinite(value)
    ):
        raise ValueError(f"{name} must be a finite number.")
    return float(value)


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value

"""Metrics for comparing BLS detections with known injected transits."""

from dataclasses import asdict, dataclass
from enum import Enum
from numbers import Real
from typing import Any

import numpy as np

from ai.detection.models import TransitDetectionResult


class HarmonicClassification(str, Enum):
    """Relationship between a detected and injected orbital period."""

    FUNDAMENTAL = "fundamental"
    HALF_PERIOD = "half_period"
    DOUBLE_PERIOD = "double_period"
    OTHER_HARMONIC = "other_harmonic"
    INCORRECT = "incorrect"


def _finite_float(name: str, value: Real) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite number, got {value!r}.")
    converted = float(value)
    if not np.isfinite(converted):
        raise ValueError(f"{name} must be finite, got {converted}.")
    return converted


@dataclass(frozen=True, slots=True)
class InjectedTransitParameters:
    """Known physical parameters used to generate a synthetic transit."""

    period_days: float
    transit_time: float
    duration_days: float
    depth: float

    def __post_init__(self) -> None:
        for name in ("period_days", "transit_time", "duration_days", "depth"):
            object.__setattr__(self, name, _finite_float(name, getattr(self, name)))
        if self.period_days <= 0:
            raise ValueError("period_days must be positive.")
        if self.duration_days <= 0 or self.duration_days >= self.period_days:
            raise ValueError(
                "duration_days must be positive and smaller than period_days."
            )
        if self.depth <= 0:
            raise ValueError("depth must be positive.")


@dataclass(frozen=True, slots=True)
class RecoveryThresholds:
    """Configurable thresholds used to decide whether a signal was recovered."""

    period_relative_tolerance: float = 0.02
    harmonic_relative_tolerance: float = 0.02
    accepted_harmonics: tuple[HarmonicClassification, ...] = (
        HarmonicClassification.FUNDAMENTAL,
    )
    epoch_absolute_tolerance: float | None = None
    duration_relative_tolerance: float | None = None
    depth_relative_tolerance: float | None = None
    maximum_harmonic_order: int = 5
    require_detector_flag: bool = True

    def __post_init__(self) -> None:
        tolerance_names = (
            "period_relative_tolerance",
            "harmonic_relative_tolerance",
        )
        for name in tolerance_names:
            value = _finite_float(name, getattr(self, name))
            if value < 0:
                raise ValueError(f"{name} cannot be negative.")
            object.__setattr__(self, name, value)

        for name in (
            "epoch_absolute_tolerance",
            "duration_relative_tolerance",
            "depth_relative_tolerance",
        ):
            raw_value = getattr(self, name)
            if raw_value is None:
                continue
            value = _finite_float(name, raw_value)
            if value < 0:
                raise ValueError(f"{name} cannot be negative.")
            object.__setattr__(self, name, value)

        if (
            isinstance(self.maximum_harmonic_order, bool)
            or not isinstance(self.maximum_harmonic_order, (int, np.integer))
            or self.maximum_harmonic_order < 2
        ):
            raise ValueError("maximum_harmonic_order must be an integer of at least 2.")
        object.__setattr__(
            self, "maximum_harmonic_order", int(self.maximum_harmonic_order)
        )

        try:
            harmonics = tuple(
                item
                if isinstance(item, HarmonicClassification)
                else HarmonicClassification(item)
                for item in self.accepted_harmonics
            )
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "accepted_harmonics contains an invalid category."
            ) from exc
        if not harmonics:
            raise ValueError("accepted_harmonics cannot be empty.")
        if HarmonicClassification.INCORRECT in harmonics:
            raise ValueError("'incorrect' cannot be an accepted harmonic.")
        object.__setattr__(self, "accepted_harmonics", harmonics)


@dataclass(frozen=True, slots=True)
class TransitRecoveryResult:
    """Serializable comparison between an injection and BLS detection."""

    injected: InjectedTransitParameters
    detected: TransitDetectionResult
    absolute_period_error: float
    relative_period_error: float
    period_ratio: float
    epoch_error_days: float
    duration_error_days: float
    relative_duration_error: float
    depth_error: float
    relative_depth_error: float
    harmonic: HarmonicClassification
    harmonic_period_relative_error: float
    recovered: bool
    notes: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON/CSV-friendly dictionary containing Python scalars."""
        payload = asdict(self)
        payload["harmonic"] = self.harmonic.value
        payload["notes"] = list(self.notes)
        return payload


def calculate_absolute_period_error(
    injected_period: Real, detected_period: Real
) -> float:
    """Return the absolute period difference in days."""
    injected = _positive_period("injected_period", injected_period)
    detected = _positive_period("detected_period", detected_period)
    return abs(detected - injected)


def calculate_relative_period_error(
    injected_period: Real, detected_period: Real
) -> float:
    """Return absolute period error divided by the injected period."""
    injected = _positive_period("injected_period", injected_period)
    return calculate_absolute_period_error(injected, detected_period) / injected


def calculate_period_ratio(injected_period: Real, detected_period: Real) -> float:
    """Return detected period divided by injected period."""
    injected = _positive_period("injected_period", injected_period)
    detected = _positive_period("detected_period", detected_period)
    return detected / injected


def calculate_wrapped_epoch_error(
    injected_epoch: Real,
    detected_epoch: Real,
    period: Real,
) -> float:
    """Return the smallest absolute epoch separation modulo the injected period."""
    injected = _finite_float("injected_epoch", injected_epoch)
    detected = _finite_float("detected_epoch", detected_epoch)
    valid_period = _positive_period("period", period)
    wrapped = (detected - injected + 0.5 * valid_period) % valid_period
    return abs(wrapped - 0.5 * valid_period)


def calculate_duration_error(
    injected_duration: Real, detected_duration: Real
) -> float:
    """Return the absolute transit-duration difference in days."""
    injected = _positive_value("injected_duration", injected_duration)
    detected = _positive_value("detected_duration", detected_duration)
    return abs(detected - injected)


def calculate_depth_error(injected_depth: Real, detected_depth: Real) -> float:
    """Return the absolute fractional-depth difference."""
    injected = _positive_value("injected_depth", injected_depth)
    detected = _finite_float("detected_depth", detected_depth)
    if detected < 0:
        raise ValueError("detected_depth cannot be negative.")
    return abs(detected - injected)


def classify_period_harmonic(
    injected_period: Real,
    detected_period: Real,
    tolerance: Real = 0.02,
    maximum_order: int = 5,
) -> HarmonicClassification:
    """Classify a detected period using relative distance to simple harmonics."""
    ratio = calculate_period_ratio(injected_period, detected_period)
    valid_tolerance = _finite_float("tolerance", tolerance)
    if valid_tolerance < 0:
        raise ValueError("tolerance cannot be negative.")
    if (
        isinstance(maximum_order, bool)
        or not isinstance(maximum_order, (int, np.integer))
        or maximum_order < 2
    ):
        raise ValueError("maximum_order must be an integer of at least 2.")

    candidates = [
        (1.0, HarmonicClassification.FUNDAMENTAL),
        (0.5, HarmonicClassification.HALF_PERIOD),
        (2.0, HarmonicClassification.DOUBLE_PERIOD),
    ]
    for order in range(3, int(maximum_order) + 1):
        candidates.extend(
            (
                (float(order), HarmonicClassification.OTHER_HARMONIC),
                (1.0 / order, HarmonicClassification.OTHER_HARMONIC),
            )
        )
    expected_ratio, category = min(
        candidates,
        key=lambda candidate: _relative_difference(ratio, candidate[0]),
    )
    if _relative_difference(ratio, expected_ratio) <= valid_tolerance:
        return category
    return HarmonicClassification.INCORRECT


def evaluate_transit_recovery(
    injected: InjectedTransitParameters,
    detected: TransitDetectionResult,
    thresholds: RecoveryThresholds | None = None,
) -> TransitRecoveryResult:
    """Calculate validation metrics and decide whether BLS recovered a transit."""
    if not isinstance(injected, InjectedTransitParameters):
        raise ValueError("injected must be an InjectedTransitParameters instance.")
    if not isinstance(detected, TransitDetectionResult):
        raise ValueError("detected must be a TransitDetectionResult instance.")
    _validate_detector_result(detected)
    config = thresholds or RecoveryThresholds()
    if not isinstance(config, RecoveryThresholds):
        raise ValueError("thresholds must be a RecoveryThresholds instance.")

    absolute_period_error = calculate_absolute_period_error(
        injected.period_days, detected.period_days
    )
    relative_period_error = absolute_period_error / injected.period_days
    period_ratio = detected.period_days / injected.period_days
    harmonic = classify_period_harmonic(
        injected.period_days,
        detected.period_days,
        tolerance=config.harmonic_relative_tolerance,
        maximum_order=config.maximum_harmonic_order,
    )
    expected_ratio = _expected_harmonic_ratio(
        period_ratio, harmonic, config.maximum_harmonic_order
    )
    harmonic_period_error = (
        _relative_difference(period_ratio, expected_ratio)
        if expected_ratio is not None
        else float("inf")
    )
    epoch_error = calculate_wrapped_epoch_error(
        injected.transit_time, detected.transit_time, injected.period_days
    )
    duration_error = calculate_duration_error(
        injected.duration_days, detected.duration_days
    )
    relative_duration_error = duration_error / injected.duration_days
    depth_error = calculate_depth_error(injected.depth, detected.depth)
    relative_depth_error = depth_error / injected.depth

    notes: list[str] = []
    recovered = True
    if config.require_detector_flag and not detected.detected:
        recovered = False
        notes.append("Detector significance flag is false.")
    if detected.depth <= 0:
        recovered = False
        notes.append("Detected transit depth is not positive.")
    if harmonic not in config.accepted_harmonics:
        recovered = False
        notes.append(f"Harmonic category '{harmonic.value}' is not accepted.")
    if harmonic_period_error > config.period_relative_tolerance:
        recovered = False
        notes.append("Period-to-harmonic error exceeds tolerance.")
    if (
        config.epoch_absolute_tolerance is not None
        and epoch_error > config.epoch_absolute_tolerance
    ):
        recovered = False
        notes.append("Wrapped epoch error exceeds tolerance.")
    if (
        config.duration_relative_tolerance is not None
        and relative_duration_error > config.duration_relative_tolerance
    ):
        recovered = False
        notes.append("Relative duration error exceeds tolerance.")
    if (
        config.depth_relative_tolerance is not None
        and relative_depth_error > config.depth_relative_tolerance
    ):
        recovered = False
        notes.append("Relative depth error exceeds tolerance.")
    if recovered:
        notes.append("Candidate satisfies all configured recovery criteria.")

    return TransitRecoveryResult(
        injected=injected,
        detected=detected,
        absolute_period_error=absolute_period_error,
        relative_period_error=relative_period_error,
        period_ratio=period_ratio,
        epoch_error_days=epoch_error,
        duration_error_days=duration_error,
        relative_duration_error=relative_duration_error,
        depth_error=depth_error,
        relative_depth_error=relative_depth_error,
        harmonic=harmonic,
        harmonic_period_relative_error=harmonic_period_error,
        recovered=recovered,
        notes=tuple(notes),
    )


def _positive_period(name: str, value: Real) -> float:
    converted = _finite_float(name, value)
    if converted <= 0:
        raise ValueError(f"{name} must be positive.")
    return converted


def _positive_value(name: str, value: Real) -> float:
    converted = _finite_float(name, value)
    if converted <= 0:
        raise ValueError(f"{name} must be positive.")
    return converted


def _relative_difference(value: float, expected: float) -> float:
    return abs(value - expected) / expected


def _expected_harmonic_ratio(
    period_ratio: float,
    harmonic: HarmonicClassification,
    maximum_order: int,
) -> float | None:
    if harmonic is HarmonicClassification.FUNDAMENTAL:
        return 1.0
    if harmonic is HarmonicClassification.HALF_PERIOD:
        return 0.5
    if harmonic is HarmonicClassification.DOUBLE_PERIOD:
        return 2.0
    if harmonic is HarmonicClassification.OTHER_HARMONIC:
        candidates = [
            ratio
            for order in range(3, maximum_order + 1)
            for ratio in (float(order), 1.0 / order)
        ]
        return min(candidates, key=lambda candidate: abs(period_ratio - candidate))
    return None


def _validate_detector_result(detected: TransitDetectionResult) -> None:
    for name in (
        "period_days",
        "duration_days",
        "transit_time",
        "depth",
        "depth_error",
        "snr",
        "power",
    ):
        _finite_float(f"detected.{name}", getattr(detected, name))
    if detected.period_days <= 0:
        raise ValueError("detected.period_days must be positive.")
    if detected.duration_days <= 0 or detected.duration_days >= detected.period_days:
        raise ValueError(
            "detected.duration_days must be positive and smaller than detected period."
        )
    if detected.depth < 0:
        raise ValueError("detected.depth cannot be negative.")

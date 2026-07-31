"""Numerical phase folding, binning, and transit-window extraction."""

from dataclasses import dataclass
from numbers import Real
from typing import Any, Literal

import numpy as np

from ai.detection.models import TransitDetectionResult


def _json_array(values: np.ndarray) -> list[Any]:
    result: list[Any] = []
    for value in values.tolist():
        if isinstance(value, float) and not np.isfinite(value):
            result.append(None)
        elif isinstance(value, np.generic):
            result.append(value.item())
        else:
            result.append(value)
    return result


@dataclass(frozen=True, slots=True)
class FoldedLightCurve:
    """A phase-folded light curve centered on transit phase zero."""

    phase: np.ndarray
    relative_time: np.ndarray
    flux: np.ndarray
    flux_error: np.ndarray | None
    quality: np.ndarray | None
    original_indices: np.ndarray
    period_days: float
    transit_epoch: float
    valid_samples: int
    rejected_samples: int
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Convert the result into JSON-safe Python values."""
        return {
            "phase": _json_array(self.phase),
            "relative_time": _json_array(self.relative_time),
            "flux": _json_array(self.flux),
            "flux_error": (
                None if self.flux_error is None else _json_array(self.flux_error)
            ),
            "quality": None if self.quality is None else _json_array(self.quality),
            "original_indices": _json_array(self.original_indices),
            "period_days": self.period_days,
            "transit_epoch": self.transit_epoch,
            "valid_samples": self.valid_samples,
            "rejected_samples": self.rejected_samples,
            "metadata": dict(self.metadata),
        }


@dataclass(frozen=True, slots=True)
class PhaseBinnedLightCurve:
    """Aggregated flux measurements on a regular folded-phase grid."""

    phase_centers: np.ndarray
    flux: np.ndarray
    uncertainty: np.ndarray
    sample_counts: np.ndarray
    valid_bins: np.ndarray
    bin_edges: np.ndarray
    aggregation: str
    minimum_samples: int
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Convert the result into JSON-safe Python values."""
        return {
            "phase_centers": _json_array(self.phase_centers),
            "flux": _json_array(self.flux),
            "uncertainty": _json_array(self.uncertainty),
            "sample_counts": _json_array(self.sample_counts),
            "valid_bins": _json_array(self.valid_bins),
            "bin_edges": _json_array(self.bin_edges),
            "aggregation": self.aggregation,
            "minimum_samples": self.minimum_samples,
            "metadata": dict(self.metadata),
        }


@dataclass(frozen=True, slots=True)
class TransitWindow:
    """In-transit and nearby baseline samples from a folded light curve."""

    in_transit_mask: np.ndarray
    baseline_mask: np.ndarray
    in_transit_indices: np.ndarray
    baseline_indices: np.ndarray
    in_transit_original_indices: np.ndarray
    baseline_original_indices: np.ndarray
    in_transit_phase: np.ndarray
    baseline_phase: np.ndarray
    in_transit_flux: np.ndarray
    baseline_flux: np.ndarray
    phase_half_width: float
    baseline_outer_half_width: float
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Convert the result into JSON-safe Python values."""
        return {
            "in_transit_mask": _json_array(self.in_transit_mask),
            "baseline_mask": _json_array(self.baseline_mask),
            "in_transit_indices": _json_array(self.in_transit_indices),
            "baseline_indices": _json_array(self.baseline_indices),
            "in_transit_original_indices": _json_array(
                self.in_transit_original_indices
            ),
            "baseline_original_indices": _json_array(
                self.baseline_original_indices
            ),
            "in_transit_phase": _json_array(self.in_transit_phase),
            "baseline_phase": _json_array(self.baseline_phase),
            "in_transit_flux": _json_array(self.in_transit_flux),
            "baseline_flux": _json_array(self.baseline_flux),
            "phase_half_width": self.phase_half_width,
            "baseline_outer_half_width": self.baseline_outer_half_width,
            "metadata": dict(self.metadata),
        }


def fold_lightcurve(
    time: np.ndarray,
    flux: np.ndarray,
    period: Real,
    transit_epoch: Real,
    flux_error: np.ndarray | None = None,
    quality: np.ndarray | None = None,
    phase_range: tuple[Real, Real] = (-0.5, 0.5),
    sort_phase: bool = True,
    remove_invalid: bool = True,
) -> FoldedLightCurve:
    """Fold synchronized light-curve arrays around transit phase zero."""
    time_arr = _numeric_array("time", time)
    flux_arr = _numeric_array("flux", flux)
    arrays: dict[str, np.ndarray] = {"time": time_arr, "flux": flux_arr}
    error_arr = (
        None if flux_error is None else _numeric_array("flux_error", flux_error)
    )
    quality_arr = None if quality is None else np.asarray(quality)
    if quality_arr is not None and quality_arr.ndim != 1:
        raise ValueError("quality must be one-dimensional.")
    if error_arr is not None:
        arrays["flux_error"] = error_arr
    if quality_arr is not None:
        arrays["quality"] = quality_arr

    sample_count = len(time_arr)
    if sample_count == 0:
        raise ValueError("Light-curve arrays cannot be empty.")
    for name, values in arrays.items():
        if len(values) != sample_count:
            raise ValueError(
                f"Array length mismatch: time ({sample_count}) vs "
                f"{name} ({len(values)})."
            )

    valid_period = _finite_float("period", period)
    epoch = _finite_float("transit_epoch", transit_epoch)
    if valid_period <= 0:
        raise ValueError("period must be positive.")
    lower, upper = _validate_phase_range(phase_range)

    valid_mask = np.isfinite(time_arr) & np.isfinite(flux_arr)
    if error_arr is not None:
        valid_mask &= np.isfinite(error_arr)
    if quality_arr is not None:
        try:
            valid_mask &= np.isfinite(quality_arr)
        except TypeError as exc:
            raise ValueError("quality must contain numeric values.") from exc

    rejected = int(np.count_nonzero(~valid_mask))
    if rejected and not remove_invalid:
        raise ValueError(
            "Light-curve arrays contain non-finite values and "
            "remove_invalid is False."
        )
    if remove_invalid:
        selected = valid_mask
    else:
        selected = np.ones(sample_count, dtype=bool)
    if not np.any(selected):
        raise ValueError("No valid samples remain after filtering.")

    original_indices = np.arange(sample_count, dtype=np.int64)[selected]
    valid_time = time_arr[selected]
    valid_flux = flux_arr[selected]
    valid_error = None if error_arr is None else error_arr[selected]
    valid_quality = None if quality_arr is None else quality_arr[selected]

    time_delta = valid_time - epoch
    relative_time = (
        np.remainder(time_delta + 0.5 * valid_period, valid_period)
        - 0.5 * valid_period
    )
    centered_phase = relative_time / valid_period
    phase = (centered_phase - lower) % 1.0 + lower
    phase[np.isclose(phase, upper, rtol=0.0, atol=1e-14)] = lower

    if sort_phase:
        order = np.argsort(phase, kind="stable")
        phase = phase[order]
        relative_time = relative_time[order]
        valid_flux = valid_flux[order]
        original_indices = original_indices[order]
        if valid_error is not None:
            valid_error = valid_error[order]
        if valid_quality is not None:
            valid_quality = valid_quality[order]

    return FoldedLightCurve(
        phase=np.asarray(phase, dtype=np.float64),
        relative_time=np.asarray(relative_time, dtype=np.float64),
        flux=np.asarray(valid_flux, dtype=np.float64),
        flux_error=(
            None if valid_error is None else np.asarray(valid_error, dtype=np.float64)
        ),
        quality=None if valid_quality is None else np.asarray(valid_quality),
        original_indices=original_indices,
        period_days=valid_period,
        transit_epoch=epoch,
        valid_samples=len(phase),
        rejected_samples=rejected,
        metadata={
            "phase_range": [lower, upper],
            "sorted": sort_phase,
            "invalid_samples_removed": rejected if remove_invalid else 0,
            "phase_convention": "transit_center_at_zero",
        },
    )


def fold_detection_result(
    time: np.ndarray,
    flux: np.ndarray,
    detection: TransitDetectionResult,
    **kwargs: Any,
) -> FoldedLightCurve:
    """Fold a light curve using period and epoch from a BLS result."""
    if not isinstance(detection, TransitDetectionResult):
        raise ValueError("detection must be a TransitDetectionResult instance.")
    period = _finite_float("detection.period_days", detection.period_days)
    epoch = _finite_float("detection.transit_time", detection.transit_time)
    if period <= 0:
        raise ValueError("detection.period_days must be positive.")
    return fold_lightcurve(time, flux, period, epoch, **kwargs)


def bin_folded_lightcurve(
    folded: FoldedLightCurve,
    number_bins: int | None = None,
    bin_width: Real | None = None,
    aggregation: Literal["mean", "median"] = "mean",
    minimum_samples: int = 1,
) -> PhaseBinnedLightCurve:
    """Aggregate folded flux into deterministic phase bins."""
    if not isinstance(folded, FoldedLightCurve):
        raise ValueError("folded must be a FoldedLightCurve instance.")
    if number_bins is not None and bin_width is not None:
        raise ValueError("Specify either number_bins or bin_width, not both.")
    if aggregation not in ("mean", "median"):
        raise ValueError("aggregation must be 'mean' or 'median'.")
    if (
        isinstance(minimum_samples, bool)
        or not isinstance(minimum_samples, (int, np.integer))
        or minimum_samples < 1
    ):
        raise ValueError("minimum_samples must be a positive integer.")

    lower, upper = folded.metadata["phase_range"]
    if bin_width is not None:
        width = _finite_float("bin_width", bin_width)
        if width <= 0 or width > upper - lower:
            raise ValueError("bin_width must be positive and no larger than the range.")
        edges = np.arange(lower, upper, width, dtype=np.float64)
        edges = np.append(edges, upper)
    else:
        bins = 50 if number_bins is None else number_bins
        if (
            isinstance(bins, bool)
            or not isinstance(bins, (int, np.integer))
            or bins < 1
        ):
            raise ValueError("number_bins must be a positive integer.")
        edges = np.linspace(lower, upper, int(bins) + 1)

    bin_count = len(edges) - 1
    indices = np.searchsorted(edges, folded.phase, side="right") - 1
    indices = np.clip(indices, 0, bin_count - 1)
    counts = np.bincount(indices, minlength=bin_count).astype(np.int64)
    binned_flux = np.full(bin_count, np.nan, dtype=np.float64)
    uncertainty = np.full(bin_count, np.nan, dtype=np.float64)

    for bin_index in range(bin_count):
        mask = indices == bin_index
        count = int(counts[bin_index])
        if count < minimum_samples:
            continue
        values = folded.flux[mask]
        binned_flux[bin_index] = (
            float(np.mean(values))
            if aggregation == "mean"
            else float(np.median(values))
        )
        if folded.flux_error is not None:
            errors = folded.flux_error[mask]
            if aggregation == "mean":
                uncertainty[bin_index] = float(np.sqrt(np.sum(errors**2)) / count)
            elif count == 1:
                uncertainty[bin_index] = float(errors[0])
        if not np.isfinite(uncertainty[bin_index]) and count > 1:
            scale = 1.0 if aggregation == "mean" else 1.2533
            uncertainty[bin_index] = float(
                scale * np.std(values, ddof=1) / np.sqrt(count)
            )

    return PhaseBinnedLightCurve(
        phase_centers=(edges[:-1] + edges[1:]) / 2.0,
        flux=binned_flux,
        uncertainty=uncertainty,
        sample_counts=counts,
        valid_bins=counts >= minimum_samples,
        bin_edges=edges,
        aggregation=aggregation,
        minimum_samples=int(minimum_samples),
        metadata={
            "number_bins": bin_count,
            "empty_bins": int(np.count_nonzero(counts == 0)),
            "underfilled_bins": int(np.count_nonzero(counts < minimum_samples)),
            "period_days": folded.period_days,
        },
    )


def extract_transit_window(
    folded: FoldedLightCurve,
    transit_duration: Real | None = None,
    phase_half_width: Real | None = None,
    baseline_outer_factor: Real = 3.0,
) -> TransitWindow:
    """Extract transit and adjacent baseline regions around folded phase zero."""
    if not isinstance(folded, FoldedLightCurve):
        raise ValueError("folded must be a FoldedLightCurve instance.")
    if (transit_duration is None) == (phase_half_width is None):
        raise ValueError(
            "Specify exactly one of transit_duration or phase_half_width."
        )
    if transit_duration is not None:
        duration = _finite_float("transit_duration", transit_duration)
        if duration <= 0 or duration >= folded.period_days:
            raise ValueError(
                "transit_duration must be positive and smaller than the period."
            )
        half_width = duration / (2.0 * folded.period_days)
        width_source = "duration_days"
    else:
        half_width = _finite_float("phase_half_width", phase_half_width)
        if half_width <= 0 or half_width >= 0.5:
            raise ValueError("phase_half_width must lie between 0 and 0.5.")
        width_source = "phase"

    outer_factor = _finite_float("baseline_outer_factor", baseline_outer_factor)
    if outer_factor <= 1:
        raise ValueError("baseline_outer_factor must be greater than 1.")
    outer_width = min(half_width * outer_factor, 0.5)
    centered_phase = (folded.phase + 0.5) % 1.0 - 0.5
    absolute_phase = np.abs(centered_phase)
    in_transit_mask = absolute_phase <= half_width
    baseline_mask = (absolute_phase > half_width) & (
        absolute_phase <= outer_width
    )
    transit_indices = np.flatnonzero(in_transit_mask)
    baseline_indices = np.flatnonzero(baseline_mask)

    return TransitWindow(
        in_transit_mask=in_transit_mask,
        baseline_mask=baseline_mask,
        in_transit_indices=transit_indices,
        baseline_indices=baseline_indices,
        in_transit_original_indices=folded.original_indices[in_transit_mask],
        baseline_original_indices=folded.original_indices[baseline_mask],
        in_transit_phase=folded.phase[in_transit_mask],
        baseline_phase=folded.phase[baseline_mask],
        in_transit_flux=folded.flux[in_transit_mask],
        baseline_flux=folded.flux[baseline_mask],
        phase_half_width=half_width,
        baseline_outer_half_width=outer_width,
        metadata={
            "width_source": width_source,
            "transit_samples": len(transit_indices),
            "baseline_samples": len(baseline_indices),
            "baseline_outer_factor": outer_factor,
        },
    )


def _numeric_array(name: str, values: np.ndarray) -> np.ndarray:
    try:
        array = np.asarray(values, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must contain numeric values.") from exc
    if array.ndim != 1:
        raise ValueError(f"{name} must be one-dimensional.")
    return array


def _finite_float(name: str, value: Real | None) -> float:
    if (
        value is None
        or isinstance(value, bool)
        or not isinstance(value, Real)
        or not np.isfinite(value)
    ):
        raise ValueError(f"{name} must be a finite number.")
    return float(value)


def _validate_phase_range(
    phase_range: tuple[Real, Real],
) -> tuple[float, float]:
    if not isinstance(phase_range, tuple) or len(phase_range) != 2:
        raise ValueError("phase_range must be a two-item tuple.")
    lower = _finite_float("phase_range lower bound", phase_range[0])
    upper = _finite_float("phase_range upper bound", phase_range[1])
    if not np.isclose(upper - lower, 1.0):
        raise ValueError("phase_range must span exactly one normalized cycle.")
    if not lower <= 0 < upper:
        raise ValueError("phase_range must contain phase zero.")
    return lower, upper

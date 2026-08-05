"""Reusable orchestration for the complete Phase 2 transit workflow."""

from dataclasses import asdict, dataclass, field
from enum import Enum
from numbers import Real
from time import perf_counter
from typing import Any, Literal, Sequence

import numpy as np

from ai.detection import TransitDetectionResult, detect_transit_bls
from ai.evaluation import (
    CandidateConfidenceScore,
    CandidateScoringConfig,
    InjectedTransitParameters,
    RecoveryThresholds,
    TransitRecoveryResult,
    evaluate_transit_recovery,
    rank_transit_candidates,
    score_transit_candidate,
)
from ai.preprocessing import preprocess_lightcurve
from ai.transit import (
    CandidateThresholds,
    FoldedLightCurve,
    PhaseBinnedLightCurve,
    TransitCandidate,
    bin_folded_lightcurve,
    build_transit_candidate,
    fold_detection_result,
)


class PipelineStatus(str, Enum):
    """Final outcome of a transit-analysis pipeline run."""

    SUCCESS = "success"
    NO_DETECTION = "no_detection"
    REJECTED = "rejected"
    PARTIAL = "partial"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class BLSAnalysisConfig:
    """Arguments forwarded to the existing BLS detector."""

    minimum_period: float = 0.5
    maximum_period: float | None = None
    durations: tuple[float, ...] | None = None
    minimum_snr: float = 6.0

    def __post_init__(self) -> None:
        minimum = _finite_float("minimum_period", self.minimum_period)
        if minimum <= 0:
            raise ValueError("minimum_period must be positive.")
        object.__setattr__(self, "minimum_period", minimum)
        if self.maximum_period is not None:
            maximum = _finite_float("maximum_period", self.maximum_period)
            if maximum <= minimum:
                raise ValueError("maximum_period must exceed minimum_period.")
            object.__setattr__(self, "maximum_period", maximum)
        minimum_snr = _finite_float("minimum_snr", self.minimum_snr)
        if minimum_snr < 0:
            raise ValueError("minimum_snr cannot be negative.")
        object.__setattr__(self, "minimum_snr", minimum_snr)
        if self.durations is not None:
            durations = tuple(
                _finite_float("duration", duration) for duration in self.durations
            )
            if not durations or any(duration <= 0 for duration in durations):
                raise ValueError("durations must contain positive values.")
            object.__setattr__(self, "durations", durations)


@dataclass(frozen=True, slots=True)
class PhaseBinningConfig:
    """Optional folded-phase binning configuration."""

    number_bins: int | None = 50
    bin_width: float | None = None
    aggregation: Literal["mean", "median"] = "mean"
    minimum_samples: int = 1

    def __post_init__(self) -> None:
        if self.number_bins is not None and self.bin_width is not None:
            raise ValueError("Specify either number_bins or bin_width, not both.")
        if self.number_bins is None and self.bin_width is None:
            raise ValueError("One phase-binning size must be supplied.")
        if self.number_bins is not None and (
            isinstance(self.number_bins, bool)
            or not isinstance(self.number_bins, (int, np.integer))
            or self.number_bins < 1
        ):
            raise ValueError("number_bins must be a positive integer.")
        if self.bin_width is not None:
            width = _finite_float("bin_width", self.bin_width)
            if width <= 0:
                raise ValueError("bin_width must be positive.")
            object.__setattr__(self, "bin_width", width)
        if self.aggregation not in ("mean", "median"):
            raise ValueError("aggregation must be 'mean' or 'median'.")
        if (
            isinstance(self.minimum_samples, bool)
            or not isinstance(self.minimum_samples, (int, np.integer))
            or self.minimum_samples < 1
        ):
            raise ValueError("minimum_samples must be a positive integer.")


@dataclass(frozen=True, slots=True)
class TransitAnalysisConfig:
    """Typed configuration for Phase 2 orchestration."""

    preprocessing_enabled: bool = True
    preprocessing_config: dict[str, Any] = field(default_factory=dict)
    bls: BLSAnalysisConfig = field(default_factory=BLSAnalysisConfig)
    include_folded_output: bool = False
    phase_binning_enabled: bool = False
    phase_binning: PhaseBinningConfig = field(default_factory=PhaseBinningConfig)
    candidate_thresholds: CandidateThresholds = field(
        default_factory=CandidateThresholds
    )
    scoring: CandidateScoringConfig = field(default_factory=CandidateScoringConfig)
    recovery_thresholds: RecoveryThresholds = field(default_factory=RecoveryThresholds)
    optional_failure_mode: Literal["partial", "failed"] = "partial"
    retain_intermediate_arrays: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.preprocessing_enabled, bool):
            raise ValueError("preprocessing_enabled must be boolean.")
        if not isinstance(self.preprocessing_config, dict):
            raise ValueError("preprocessing_config must be a dictionary.")
        if not isinstance(self.bls, BLSAnalysisConfig):
            raise ValueError("bls must be a BLSAnalysisConfig instance.")
        if not isinstance(self.phase_binning, PhaseBinningConfig):
            raise ValueError("phase_binning must be a PhaseBinningConfig instance.")
        if not isinstance(self.candidate_thresholds, CandidateThresholds):
            raise ValueError(
                "candidate_thresholds must be a CandidateThresholds instance."
            )
        if not isinstance(self.scoring, CandidateScoringConfig):
            raise ValueError("scoring must be a CandidateScoringConfig instance.")
        if not isinstance(self.recovery_thresholds, RecoveryThresholds):
            raise ValueError(
                "recovery_thresholds must be a RecoveryThresholds instance."
            )
        if self.optional_failure_mode not in ("partial", "failed"):
            raise ValueError("optional_failure_mode must be 'partial' or 'failed'.")
        for name in (
            "include_folded_output",
            "phase_binning_enabled",
            "retain_intermediate_arrays",
        ):
            if not isinstance(getattr(self, name), bool):
                raise ValueError(f"{name} must be boolean.")

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-safe configuration summary."""
        return _json_safe(asdict(self))


@dataclass(frozen=True, slots=True)
class PipelineStageDiagnostic:
    """Concise status and error context for one pipeline stage."""

    stage: str
    success: bool
    warnings: tuple[str, ...] = ()
    error_type: str | None = None
    error_message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "stage": self.stage,
            "success": self.success,
            "warnings": list(self.warnings),
            "error_type": self.error_type,
            "error_message": self.error_message,
        }


@dataclass(frozen=True, slots=True)
class TransitAnalysisResult:
    """Structured output of one complete transit-analysis run."""

    source_id: str | None
    status: PipelineStatus
    input_summary: dict[str, Any]
    preprocessing_output: dict[str, Any] | None
    detection: TransitDetectionResult | None
    folded_output: dict[str, Any] | None
    phase_binned_output: dict[str, Any] | None
    recovery: TransitRecoveryResult | None
    candidate: TransitCandidate | None
    confidence: CandidateConfidenceScore | None
    stages: tuple[PipelineStageDiagnostic, ...]
    warnings: tuple[str, ...]
    errors: tuple[str, ...]
    timings_seconds: dict[str, float]
    configuration: TransitAnalysisConfig
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe pipeline output without hidden tracebacks."""
        return {
            "source_id": self.source_id,
            "status": self.status.value,
            "input_summary": _json_safe(self.input_summary),
            "preprocessing_output": _json_safe(self.preprocessing_output),
            "detection": (
                None if self.detection is None else _json_safe(asdict(self.detection))
            ),
            "folded_output": _json_safe(self.folded_output),
            "phase_binned_output": _json_safe(self.phase_binned_output),
            "recovery": (
                None if self.recovery is None else _json_safe(self.recovery.to_dict())
            ),
            "candidate": (None if self.candidate is None else self.candidate.to_dict()),
            "confidence": (
                None if self.confidence is None else self.confidence.to_dict()
            ),
            "stages": [stage.to_dict() for stage in self.stages],
            "warnings": list(self.warnings),
            "errors": list(self.errors),
            "timings_seconds": dict(self.timings_seconds),
            "configuration": self.configuration.to_dict(),
            "metadata": _json_safe(self.metadata),
        }


@dataclass(frozen=True, slots=True)
class LightCurveAnalysisInput:
    """One ordered input item for batch analysis."""

    time: np.ndarray
    flux: np.ndarray
    flux_error: np.ndarray | None = None
    quality: np.ndarray | None = None
    source_id: str | None = None
    injected_parameters: InjectedTransitParameters | None = None


@dataclass(frozen=True, slots=True)
class BatchTransitAnalysisResult:
    """Ordered collection of independent transit-analysis results."""

    results: tuple[TransitAnalysisResult, ...]
    status_counts: dict[str, int]
    ranked_candidates: tuple[CandidateConfidenceScore, ...]
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-safe batch output."""
        return {
            "results": [result.to_dict() for result in self.results],
            "status_counts": dict(self.status_counts),
            "ranked_candidates": [score.to_dict() for score in self.ranked_candidates],
            "metadata": _json_safe(self.metadata),
        }


def analyze_lightcurve(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray | None = None,
    quality: np.ndarray | None = None,
    source_id: str | None = None,
    injected_parameters: InjectedTransitParameters | None = None,
    config: TransitAnalysisConfig | None = None,
) -> TransitAnalysisResult:
    """Run the complete existing Phase 2 workflow for one light curve."""
    pipeline_config = config or TransitAnalysisConfig()
    if not isinstance(pipeline_config, TransitAnalysisConfig):
        raise ValueError("config must be a TransitAnalysisConfig instance.")
    started = perf_counter()
    stages: list[PipelineStageDiagnostic] = []
    warnings: list[str] = []
    errors: list[str] = []
    timings = _empty_timings()
    source = source_id if isinstance(source_id, str) and source_id else None

    stage_started = perf_counter()
    try:
        raw = _prepare_input(time, flux, flux_error, quality)
        if source_id is not None and source is None:
            raise ValueError("source_id must be a non-empty string or None.")
        input_summary = _lightcurve_summary(raw)
        stages.append(PipelineStageDiagnostic("input_validation", True))
    except (TypeError, ValueError) as exc:
        timings["input_validation"] = perf_counter() - stage_started
        stages.append(_failed_stage("input_validation", exc))
        errors.append(f"input_validation: {exc}")
        return _result(
            source,
            PipelineStatus.FAILED,
            {},
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )
    timings["input_validation"] = perf_counter() - stage_started

    working = raw
    preprocessing_output: dict[str, Any] | None
    if pipeline_config.preprocessing_enabled:
        stage_started = perf_counter()
        try:
            working = preprocess_lightcurve(
                raw, config=dict(pipeline_config.preprocessing_config)
            )
            preprocessing_output = _lightcurve_output(
                working, pipeline_config.retain_intermediate_arrays
            )
            stages.append(PipelineStageDiagnostic("preprocessing", True))
        except Exception as exc:
            timings["preprocessing"] = perf_counter() - stage_started
            stages.append(_failed_stage("preprocessing", exc))
            errors.append(f"preprocessing: {exc}")
            return _result(
                source,
                PipelineStatus.FAILED,
                input_summary,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                stages,
                warnings,
                errors,
                timings,
                pipeline_config,
                started,
            )
        timings["preprocessing"] = perf_counter() - stage_started
    else:
        preprocessing_output = {
            "enabled": False,
            **_lightcurve_summary(working),
        }
        stages.append(
            PipelineStageDiagnostic(
                "preprocessing", True, ("Preprocessing was disabled.",)
            )
        )

    stage_started = perf_counter()
    try:
        detection = detect_transit_bls(
            working,
            minimum_period=pipeline_config.bls.minimum_period,
            maximum_period=pipeline_config.bls.maximum_period,
            durations=pipeline_config.bls.durations,
            minimum_snr=pipeline_config.bls.minimum_snr,
        )
        stages.append(PipelineStageDiagnostic("detection", True))
    except Exception as exc:
        timings["detection"] = perf_counter() - stage_started
        stages.append(_failed_stage("detection", exc))
        errors.append(f"detection: {exc}")
        return _result(
            source,
            PipelineStatus.FAILED,
            input_summary,
            preprocessing_output,
            None,
            None,
            None,
            None,
            None,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )
    timings["detection"] = perf_counter() - stage_started
    if not detection.detected:
        warning = "BLS completed normally without a significant transit detection."
        warnings.append(warning)
        stages[-1] = PipelineStageDiagnostic("detection", True, (warning,))
        return _result(
            source,
            PipelineStatus.NO_DETECTION,
            input_summary,
            preprocessing_output,
            detection,
            None,
            None,
            None,
            None,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )

    stage_started = perf_counter()
    try:
        folded = fold_detection_result(
            working["time"],
            working["flux"],
            detection,
            flux_error=working["flux_error"],
            quality=working["quality"],
        )
        folded_output = _folded_output(folded, pipeline_config)
        stages.append(PipelineStageDiagnostic("folding", True))
    except Exception as exc:
        timings["folding"] = perf_counter() - stage_started
        stages.append(_failed_stage("folding", exc))
        errors.append(f"folding: {exc}")
        return _result(
            source,
            PipelineStatus.FAILED,
            input_summary,
            preprocessing_output,
            detection,
            None,
            None,
            None,
            None,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )
    timings["folding"] = perf_counter() - stage_started

    optional_failed = False
    phase_binned_output: dict[str, Any] | None = None
    if pipeline_config.phase_binning_enabled:
        stage_started = perf_counter()
        try:
            binned = bin_folded_lightcurve(
                folded,
                number_bins=pipeline_config.phase_binning.number_bins,
                bin_width=pipeline_config.phase_binning.bin_width,
                aggregation=pipeline_config.phase_binning.aggregation,
                minimum_samples=pipeline_config.phase_binning.minimum_samples,
            )
            phase_binned_output = _binned_output(
                binned, pipeline_config.retain_intermediate_arrays
            )
            stages.append(PipelineStageDiagnostic("phase_binning", True))
        except Exception as exc:
            optional_failed = True
            stages.append(_failed_stage("phase_binning", exc))
            errors.append(f"phase_binning: {exc}")
        timings["phase_binning"] = perf_counter() - stage_started

    recovery: TransitRecoveryResult | None = None
    if injected_parameters is not None:
        stage_started = perf_counter()
        try:
            recovery = evaluate_transit_recovery(
                injected_parameters,
                detection,
                pipeline_config.recovery_thresholds,
            )
            stages.append(PipelineStageDiagnostic("recovery", True))
        except Exception as exc:
            optional_failed = True
            stages.append(_failed_stage("recovery", exc))
            errors.append(f"recovery: {exc}")
        timings["recovery"] = perf_counter() - stage_started
    else:
        stages.append(
            PipelineStageDiagnostic(
                "recovery", True, ("No injected parameters supplied.",)
            )
        )

    stage_started = perf_counter()
    try:
        candidate = build_transit_candidate(
            working["time"],
            working["flux"],
            detection,
            flux_error=working["flux_error"],
            quality=working["quality"],
            folded=folded,
            recovery=recovery,
            source_id=source,
            thresholds=pipeline_config.candidate_thresholds,
        )
        stages.append(PipelineStageDiagnostic("candidate_construction", True))
    except Exception as exc:
        timings["candidate_construction"] = perf_counter() - stage_started
        stages.append(_failed_stage("candidate_construction", exc))
        errors.append(f"candidate_construction: {exc}")
        return _result(
            source,
            PipelineStatus.FAILED,
            input_summary,
            preprocessing_output,
            detection,
            folded_output,
            phase_binned_output,
            recovery,
            None,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )
    timings["candidate_construction"] = perf_counter() - stage_started

    stage_started = perf_counter()
    try:
        confidence = score_transit_candidate(candidate, pipeline_config.scoring)
        stages.append(PipelineStageDiagnostic("scoring", True))
    except Exception as exc:
        timings["scoring"] = perf_counter() - stage_started
        stages.append(_failed_stage("scoring", exc))
        errors.append(f"scoring: {exc}")
        return _result(
            source,
            PipelineStatus.FAILED,
            input_summary,
            preprocessing_output,
            detection,
            folded_output,
            phase_binned_output,
            recovery,
            candidate,
            None,
            stages,
            warnings,
            errors,
            timings,
            pipeline_config,
            started,
        )
    timings["scoring"] = perf_counter() - stage_started
    warnings.extend(candidate.warnings)
    warnings.extend(confidence.warning_flags)

    if optional_failed:
        status = (
            PipelineStatus.PARTIAL
            if pipeline_config.optional_failure_mode == "partial"
            else PipelineStatus.FAILED
        )
    elif confidence.rejected:
        status = PipelineStatus.REJECTED
    else:
        status = PipelineStatus.SUCCESS
    return _result(
        source,
        status,
        input_summary,
        preprocessing_output,
        detection,
        folded_output,
        phase_binned_output,
        recovery,
        candidate,
        confidence,
        stages,
        warnings,
        errors,
        timings,
        pipeline_config,
        started,
    )


def analyze_lightcurve_batch(
    inputs: Sequence[LightCurveAnalysisInput],
    config: TransitAnalysisConfig | None = None,
    rank_candidates: bool = True,
) -> BatchTransitAnalysisResult:
    """Analyze ordered inputs independently and continue after failures."""
    if not isinstance(rank_candidates, bool):
        raise ValueError("rank_candidates must be boolean.")
    pipeline_config = config or TransitAnalysisConfig()
    results: list[TransitAnalysisResult] = []
    for item in inputs:
        if not isinstance(item, LightCurveAnalysisInput):
            raise ValueError(
                "Every batch item must be a LightCurveAnalysisInput instance."
            )
        results.append(
            analyze_lightcurve(
                item.time,
                item.flux,
                flux_error=item.flux_error,
                quality=item.quality,
                source_id=item.source_id,
                injected_parameters=item.injected_parameters,
                config=pipeline_config,
            )
        )
    status_counts = {
        status.value: sum(result.status is status for result in results)
        for status in PipelineStatus
    }
    candidates = [
        result.candidate for result in results if result.candidate is not None
    ]
    ranked = (
        rank_transit_candidates(candidates, pipeline_config.scoring)
        if rank_candidates
        else ()
    )
    return BatchTransitAnalysisResult(
        results=tuple(results),
        status_counts=status_counts,
        ranked_candidates=ranked,
        metadata={
            "input_count": len(inputs),
            "completed_count": len(results),
            "ranking_enabled": rank_candidates,
            "input_order_preserved": True,
        },
    )


def _prepare_input(
    time: np.ndarray,
    flux: np.ndarray,
    flux_error: np.ndarray | None,
    quality: np.ndarray | None,
) -> dict[str, np.ndarray]:
    time_arr = _numeric_array("time", time)
    flux_arr = _numeric_array("flux", flux)
    if len(time_arr) == 0:
        raise ValueError("Input arrays cannot be empty.")
    if len(flux_arr) != len(time_arr):
        raise ValueError(
            f"Array length mismatch: time ({len(time_arr)}) vs flux ({len(flux_arr)})."
        )
    if flux_error is None:
        finite_flux = flux_arr[np.isfinite(flux_arr)]
        scatter = float(np.std(finite_flux)) if len(finite_flux) > 1 else 0.0
        estimated_error = max(scatter, np.finfo(np.float64).eps)
        error_arr = np.full(len(time_arr), estimated_error)
    else:
        error_arr = _numeric_array("flux_error", flux_error)
        if len(error_arr) != len(time_arr):
            raise ValueError(
                f"Array length mismatch: time ({len(time_arr)}) vs "
                f"flux_error ({len(error_arr)})."
            )
    if quality is None:
        quality_arr = np.zeros(len(time_arr), dtype=np.int32)
    else:
        quality_arr = np.asarray(quality)
        if quality_arr.ndim != 1:
            raise ValueError("quality must be one-dimensional.")
        if len(quality_arr) != len(time_arr):
            raise ValueError(
                f"Array length mismatch: time ({len(time_arr)}) vs "
                f"quality ({len(quality_arr)})."
            )
        try:
            finite_quality = np.isfinite(quality_arr)
        except TypeError as exc:
            raise ValueError("quality must contain numeric values.") from exc
        if not np.all(finite_quality):
            raise ValueError("quality must contain only finite values.")
    return {
        "time": np.array(time_arr, copy=True),
        "flux": np.array(flux_arr, copy=True),
        "flux_error": np.array(error_arr, copy=True),
        "quality": np.array(quality_arr, copy=True),
    }


def _result(
    source_id: str | None,
    status: PipelineStatus,
    input_summary: dict[str, Any],
    preprocessing_output: dict[str, Any] | None,
    detection: TransitDetectionResult | None,
    folded_output: dict[str, Any] | None,
    phase_binned_output: dict[str, Any] | None,
    recovery: TransitRecoveryResult | None,
    candidate: TransitCandidate | None,
    confidence: CandidateConfidenceScore | None,
    stages: list[PipelineStageDiagnostic],
    warnings: list[str],
    errors: list[str],
    timings: dict[str, float],
    config: TransitAnalysisConfig,
    started: float,
) -> TransitAnalysisResult:
    timings["total"] = perf_counter() - started
    return TransitAnalysisResult(
        source_id=source_id,
        status=status,
        input_summary=input_summary,
        preprocessing_output=preprocessing_output,
        detection=detection,
        folded_output=folded_output,
        phase_binned_output=phase_binned_output,
        recovery=recovery,
        candidate=candidate,
        confidence=confidence,
        stages=tuple(stages),
        warnings=tuple(dict.fromkeys(warnings)),
        errors=tuple(errors),
        timings_seconds={name: float(value) for name, value in timings.items()},
        configuration=config,
        metadata={
            "pipeline_version": "2.2F",
            "timings_informational": True,
            "tracebacks_included": False,
        },
    )


def _empty_timings() -> dict[str, float]:
    return {
        "input_validation": 0.0,
        "preprocessing": 0.0,
        "detection": 0.0,
        "folding": 0.0,
        "phase_binning": 0.0,
        "recovery": 0.0,
        "candidate_construction": 0.0,
        "scoring": 0.0,
        "total": 0.0,
    }


def _failed_stage(stage: str, error: Exception) -> PipelineStageDiagnostic:
    return PipelineStageDiagnostic(
        stage=stage,
        success=False,
        error_type=type(error).__name__,
        error_message=str(error),
    )


def _lightcurve_summary(lightcurve: dict[str, np.ndarray]) -> dict[str, Any]:
    time = lightcurve["time"]
    flux = lightcurve["flux"]
    valid = np.isfinite(time) & np.isfinite(flux)
    return {
        "sample_count": len(time),
        "finite_sample_count": int(np.count_nonzero(valid)),
        "time_min": _finite_or_none(np.min(time[valid]) if np.any(valid) else None),
        "time_max": _finite_or_none(np.max(time[valid]) if np.any(valid) else None),
        "flux_min": _finite_or_none(np.min(flux[valid]) if np.any(valid) else None),
        "flux_max": _finite_or_none(np.max(flux[valid]) if np.any(valid) else None),
    }


def _lightcurve_output(
    lightcurve: dict[str, np.ndarray], retain_arrays: bool
) -> dict[str, Any]:
    if not retain_arrays:
        return {"enabled": True, **_lightcurve_summary(lightcurve)}
    return {
        "enabled": True,
        **{name: _json_safe(values) for name, values in lightcurve.items()},
        "summary": _lightcurve_summary(lightcurve),
    }


def _folded_output(
    folded: FoldedLightCurve, config: TransitAnalysisConfig
) -> dict[str, Any]:
    summary = {
        "valid_samples": folded.valid_samples,
        "rejected_samples": folded.rejected_samples,
        "phase_min": _finite_or_none(np.min(folded.phase)),
        "phase_max": _finite_or_none(np.max(folded.phase)),
        "period_days": folded.period_days,
        "transit_epoch": folded.transit_epoch,
    }
    if config.include_folded_output and config.retain_intermediate_arrays:
        return {"summary": summary, "arrays": folded.to_dict()}
    return {"summary": summary, "arrays_included": False}


def _binned_output(
    binned: PhaseBinnedLightCurve, retain_arrays: bool
) -> dict[str, Any]:
    summary = {
        "number_bins": len(binned.phase_centers),
        "populated_bins": int(np.count_nonzero(binned.sample_counts)),
        "empty_bins": int(np.count_nonzero(binned.sample_counts == 0)),
        "aggregation": binned.aggregation,
    }
    if retain_arrays:
        return {"summary": summary, "arrays": binned.to_dict()}
    return {"summary": summary, "arrays_included": False}


def _numeric_array(name: str, values: np.ndarray) -> np.ndarray:
    try:
        array = np.asarray(values, dtype=np.float64)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must contain numeric values.") from exc
    if array.ndim != 1:
        raise ValueError(f"{name} must be one-dimensional.")
    return array


def _finite_float(name: str, value: Real) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not np.isfinite(value):
        raise ValueError(f"{name} must be a finite number.")
    return float(value)


def _finite_or_none(value: Any) -> float | None:
    if value is None or not np.isfinite(value):
        return None
    return float(value)


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [_json_safe(item) for item in list(value)]
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value

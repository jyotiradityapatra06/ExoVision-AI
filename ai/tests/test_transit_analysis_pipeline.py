"""Tests for end-to-end Phase 2 transit-analysis orchestration."""

import json

import numpy as np
import pytest

import ai.pipeline.transit_analysis as pipeline_module
from ai.evaluation import CandidateScoringConfig, InjectedTransitParameters
from ai.pipeline import (
    BLSAnalysisConfig,
    LightCurveAnalysisInput,
    PipelineStatus,
    TransitAnalysisConfig,
    analyze_lightcurve,
    analyze_lightcurve_batch,
)
from ai.simulation import generate_synthetic_transit


def strong_lightcurve(
    noise: float = 0.001,
    depth: float = 0.018,
    seed: int = 42,
):
    return generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=3.7,
        transit_epoch=101.1,
        transit_duration=0.16,
        transit_depth=depth,
        noise_std=noise,
        random_seed=seed,
        missing_fraction=0.05,
    )


def injected() -> InjectedTransitParameters:
    return InjectedTransitParameters(3.7, 101.1, 0.16, 0.018)


def test_successful_analysis_with_preprocessing_and_recovery():
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        source_id="strong-source",
        injected_parameters=injected(),
    )

    assert result.status is PipelineStatus.SUCCESS
    assert result.source_id == "strong-source"
    assert result.detection.detected
    assert result.recovery is not None and result.recovery.recovered
    assert result.candidate is not None
    assert result.confidence is not None and not result.confidence.rejected
    assert result.preprocessing_output["enabled"] is True
    assert result.timings_seconds["total"] > 0
    assert all(stage.success for stage in result.stages)


def test_normal_no_detection_is_not_an_error():
    rng = np.random.default_rng(3)
    time = np.arange(0.0, 20.0, 0.02)
    flux = 1.0 + rng.normal(0.0, 0.002, len(time))
    result = analyze_lightcurve(
        time,
        flux,
        np.full(len(time), 0.002),
        config=TransitAnalysisConfig(bls=BLSAnalysisConfig(minimum_snr=20.0)),
    )

    assert result.status is PipelineStatus.NO_DETECTION
    assert result.detection is not None and not result.detection.detected
    assert result.errors == ()
    assert result.candidate is None
    assert result.confidence is None


def test_confidence_rejected_status():
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        config=TransitAnalysisConfig(
            scoring=CandidateScoringConfig(
                high_score_threshold=100.0,
                moderate_score_threshold=99.95,
                low_score_threshold=99.9,
            )
        ),
    )

    assert result.status is PipelineStatus.REJECTED
    assert result.confidence is not None and result.confidence.rejected


def test_invalid_initial_input_returns_failed_diagnostic():
    result = analyze_lightcurve(np.arange(5.0), np.ones(4), source_id="bad")

    assert result.status is PipelineStatus.FAILED
    assert result.stages[0].stage == "input_validation"
    assert not result.stages[0].success
    assert result.stages[0].error_type == "ValueError"
    assert "length mismatch" in result.errors[0]


def test_preprocessing_can_be_disabled_with_numpy_config_scalars():
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        config=TransitAnalysisConfig(
            preprocessing_enabled=False,
            bls=BLSAnalysisConfig(
                minimum_period=np.float64(1.0),
                maximum_period=np.float64(8.0),
                durations=(np.float64(0.1), np.float64(0.16)),
            ),
        ),
    )

    assert result.status in (PipelineStatus.SUCCESS, PipelineStatus.REJECTED)
    assert result.preprocessing_output["enabled"] is False
    preprocessing_stage = next(
        stage for stage in result.stages if stage.stage == "preprocessing"
    )
    assert preprocessing_stage.success
    assert preprocessing_stage.warnings


def test_missing_injected_parameters_skips_recovery():
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
    )

    assert result.recovery is None
    recovery_stage = next(stage for stage in result.stages if stage.stage == "recovery")
    assert recovery_stage.success
    assert "No injected parameters" in recovery_stage.warnings[0]


@pytest.mark.parametrize(
    ("mode", "expected"),
    [
        ("partial", PipelineStatus.PARTIAL),
        ("failed", PipelineStatus.FAILED),
    ],
)
def test_optional_recovery_failure_policy(mode, expected):
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        injected_parameters=object(),  # type: ignore[arg-type]
        config=TransitAnalysisConfig(optional_failure_mode=mode),
    )

    assert result.status is expected
    assert result.candidate is not None
    recovery_stage = next(stage for stage in result.stages if stage.stage == "recovery")
    assert not recovery_stage.success
    assert recovery_stage.error_type == "ValueError"


def test_required_stage_failure_returns_failed(monkeypatch):
    lightcurve = strong_lightcurve()

    def fail_candidate(*args, **kwargs):
        raise RuntimeError("candidate construction unavailable")

    monkeypatch.setattr(pipeline_module, "build_transit_candidate", fail_candidate)
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
    )

    assert result.status is PipelineStatus.FAILED
    assert any(
        stage.stage == "candidate_construction" and not stage.success
        for stage in result.stages
    )
    assert result.candidate is None


def test_intermediate_arrays_included_and_excluded():
    lightcurve = strong_lightcurve()
    included = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        config=TransitAnalysisConfig(
            include_folded_output=True,
            retain_intermediate_arrays=True,
        ),
    )
    excluded = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
    )

    assert "arrays" in included.folded_output
    assert isinstance(included.preprocessing_output["time"], list)
    assert excluded.folded_output["arrays_included"] is False
    assert "time" not in excluded.preprocessing_output
    assert excluded.folded_output["summary"]["valid_samples"] > 0


def test_phase_binned_output_and_json_serialization():
    lightcurve = strong_lightcurve()
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        config=TransitAnalysisConfig(phase_binning_enabled=True),
    )
    payload = result.to_dict()

    assert result.phase_binned_output["summary"]["number_bins"] == 50
    assert result.phase_binned_output["summary"]["populated_bins"] > 0
    assert payload["metadata"]["pipeline_version"] == "2.2F"
    json.dumps(payload, allow_nan=False)


def test_source_identifier_is_deterministic():
    lightcurve = strong_lightcurve()
    first = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        source_id="same-source",
    )
    second = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        lightcurve["flux_error"],
        lightcurve["quality"],
        source_id="same-source",
    )

    assert first.candidate.candidate_id == second.candidate.candidate_id


def test_mixed_batch_preserves_order_counts_ranking_and_continues():
    strong = strong_lightcurve()
    weak = strong_lightcurve(noise=0.006, depth=0.006, seed=43)
    rng = np.random.default_rng(8)
    flat_time = np.arange(0.0, 20.0, 0.02)
    flat_flux = 1.0 + rng.normal(0.0, 0.002, len(flat_time))
    inputs = (
        LightCurveAnalysisInput(
            strong["time"],
            strong["flux"],
            strong["flux_error"],
            strong["quality"],
            "strong",
            injected(),
        ),
        LightCurveAnalysisInput(
            weak["time"],
            weak["flux"],
            weak["flux_error"],
            weak["quality"],
            "weak",
            InjectedTransitParameters(3.7, 101.1, 0.16, 0.006),
        ),
        LightCurveAnalysisInput(
            flat_time,
            flat_flux,
            np.full(len(flat_time), 0.002),
            source_id="flat",
        ),
        LightCurveAnalysisInput(
            np.arange(5.0),
            np.ones(4),
            source_id="invalid",
        ),
    )
    batch = analyze_lightcurve_batch(inputs)

    assert [result.source_id for result in batch.results] == [
        "strong",
        "weak",
        "flat",
        "invalid",
    ]
    assert len(batch.results) == 4
    assert batch.results[-1].status is PipelineStatus.FAILED
    assert batch.status_counts["failed"] == 1
    assert sum(batch.status_counts.values()) == 4
    assert (
        batch.results[0].confidence.total_score
        > batch.results[1].confidence.total_score
    )
    assert batch.results[2].status in (
        PipelineStatus.NO_DETECTION,
        PipelineStatus.REJECTED,
    )
    assert batch.ranked_candidates
    assert batch.ranked_candidates[0].candidate_id == (
        batch.results[0].candidate.candidate_id
    )
    json.dumps(batch.to_dict(), allow_nan=False)

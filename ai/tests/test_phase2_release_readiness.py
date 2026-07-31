"""Release-facing smoke tests for the complete Phase 2 workflow."""

import json
from pathlib import Path

import pytest

from ai.evaluation import (
    CandidateConfidenceScore,
    InjectedTransitParameters,
    evaluate_transit_recovery,
    score_transit_candidate,
)
from ai.pipeline import (
    PipelineStatus,
    TransitAnalysisResult,
    analyze_lightcurve,
    analyze_lightcurve_batch,
)
from ai.simulation import generate_synthetic_transit
from ai.transit import TransitCandidate, build_transit_candidate, fold_lightcurve
from scripts import run_transit_demo


@pytest.fixture(scope="module")
def demo_result() -> tuple[InjectedTransitParameters, TransitAnalysisResult]:
    """Run the moderately expensive BLS demo once for release smoke tests."""
    return run_transit_demo.run_demo()


def test_public_phase2_exports_are_importable() -> None:
    assert callable(generate_synthetic_transit)
    assert callable(evaluate_transit_recovery)
    assert callable(score_transit_candidate)
    assert callable(fold_lightcurve)
    assert callable(build_transit_candidate)
    assert callable(analyze_lightcurve)
    assert callable(analyze_lightcurve_batch)
    assert CandidateConfidenceScore is not None
    assert TransitCandidate is not None


def test_demo_recovers_injected_transit(
    demo_result: tuple[InjectedTransitParameters, TransitAnalysisResult],
) -> None:
    injected, result = demo_result

    assert result.status is PipelineStatus.SUCCESS
    assert result.detection is not None
    assert result.recovery is not None
    assert result.recovery.recovered
    assert result.detection.period_days == pytest.approx(
        injected.period_days, rel=0.02
    )
    assert result.candidate is not None
    assert result.confidence is not None


def test_default_demo_serialization_is_concise_and_json_safe(
    demo_result: tuple[InjectedTransitParameters, TransitAnalysisResult],
) -> None:
    _, result = demo_result

    payload = result.to_dict()
    serialized = json.dumps(payload, allow_nan=False)

    assert payload["status"] == "success"
    assert "time" not in payload["preprocessing_output"]
    assert payload["folded_output"]["arrays_included"] is False
    assert "original_indices" not in serialized


def test_demo_cli_prints_summary_and_writes_json(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    demo_result: tuple[InjectedTransitParameters, TransitAnalysisResult],
) -> None:
    monkeypatch.setattr(run_transit_demo, "run_demo", lambda: demo_result)
    output = tmp_path / "demo.json"

    exit_code = run_transit_demo.main(["--output", str(output)])

    stdout = capsys.readouterr().out
    assert exit_code == 0
    assert "Pipeline status: success" in stdout
    assert "Injected period:" in stdout
    assert "Detected period:" in stdout
    assert "Confidence category:" in stdout
    assert json.loads(output.read_text(encoding="utf-8"))["status"] == "success"


def test_demo_generation_is_deterministic(
    demo_result: tuple[InjectedTransitParameters, TransitAnalysisResult],
) -> None:
    _, first = demo_result
    _, second = run_transit_demo.run_demo()

    assert second.status is first.status
    assert second.detection is not None
    assert first.detection is not None
    assert second.detection.period_days == first.detection.period_days
    assert second.detection.depth == first.detection.depth
    assert second.confidence is not None
    assert first.confidence is not None
    assert second.confidence.total_score == first.confidence.total_score

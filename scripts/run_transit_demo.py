"""Run a deterministic synthetic end-to-end ExoVision transit demonstration."""

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

# Support the documented direct invocation from the repository root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai.evaluation import InjectedTransitParameters
from ai.pipeline import PipelineStatus, TransitAnalysisResult, analyze_lightcurve
from ai.simulation import generate_synthetic_transit

INJECTED_PERIOD_DAYS = 3.7


def run_demo() -> tuple[InjectedTransitParameters, TransitAnalysisResult]:
    """Generate deterministic data and run the complete Phase 2 pipeline."""
    injected = InjectedTransitParameters(
        period_days=INJECTED_PERIOD_DAYS,
        transit_time=101.1,
        duration_days=0.16,
        depth=0.018,
    )
    lightcurve = generate_synthetic_transit(
        start_time=100.0,
        end_time=130.0,
        cadence=0.02,
        period=injected.period_days,
        transit_epoch=injected.transit_time,
        transit_duration=injected.duration_days,
        transit_depth=injected.depth,
        noise_std=0.001,
        random_seed=42,
        missing_fraction=0.05,
    )
    result = analyze_lightcurve(
        lightcurve["time"],
        lightcurve["flux"],
        flux_error=lightcurve["flux_error"],
        quality=lightcurve["quality"],
        source_id="synthetic-demo",
        injected_parameters=injected,
    )
    return injected, result


def _print_summary(
    injected: InjectedTransitParameters, result: TransitAnalysisResult
) -> None:
    detection = result.detection
    candidate = result.candidate
    confidence = result.confidence
    recovery = result.recovery
    print("ExoVision AI Phase 2 Transit Demo")
    print(f"Pipeline status: {result.status.value}")
    print(f"Injected period: {injected.period_days:.6f} days")
    print(
        "Detected period: "
        + (
            f"{detection.period_days:.6f} days"
            if detection is not None
            else "not available"
        )
    )
    print(
        "Period recovery error: "
        + (
            f"{recovery.absolute_period_error:.6f} days"
            if recovery is not None
            else "not available"
        )
    )
    print(
        "Detected depth: "
        + (f"{detection.depth:.6f}" if detection is not None else "not available")
    )
    print(
        "Transit SNR: "
        + (f"{detection.snr:.2f}" if detection is not None else "not available")
    )
    print(
        "Observed events: "
        + (
            str(candidate.observed_transit_events)
            if candidate is not None
            else "not available"
        )
    )
    print(
        "Confidence score: "
        + (
            f"{confidence.total_score:.2f}/100"
            if confidence is not None
            else "not available"
        )
    )
    print(
        "Confidence category: "
        + (confidence.category.value if confidence is not None else "not available")
    )
    print(
        "Warnings: "
        + (", ".join(result.warnings) if result.warnings else "none")
    )


def main(argv: Sequence[str] | None = None) -> int:
    """Run the demo and optionally write the JSON-safe pipeline result."""
    parser = argparse.ArgumentParser(
        description="Run the deterministic ExoVision Phase 2 transit demo."
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path for the concise JSON pipeline result.",
    )
    args = parser.parse_args(argv)

    injected, result = run_demo()
    _print_summary(injected, result)
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(
            json.dumps(result.to_dict(), indent=2, allow_nan=False),
            encoding="utf-8",
        )
        print(f"JSON result: {args.output}")
    return 1 if result.status is PipelineStatus.FAILED else 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Read-only projection of stored analysis JSON for result dashboards."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class ResultNotFoundError(FileNotFoundError):
    """Raised when a completed analysis result cannot be found."""


class ResultService:
    """Load stored output and shape a stable visualization response."""

    def __init__(self, upload_root: str | Path) -> None:
        self.upload_root = Path(upload_root).resolve()

    def get(self, analysis_id: str) -> dict[str, Any]:
        """Return one complete, visualization-ready analysis result."""
        if not analysis_id or not analysis_id.isalnum():
            raise ResultNotFoundError("Analysis result not found.")
        result_path = self.upload_root / analysis_id / "result.json"
        if not result_path.is_file():
            raise ResultNotFoundError("Analysis result not found.")
        try:
            stored = json.loads(result_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError("Stored analysis result is unreadable.") from error
        return _project_result(analysis_id, stored)


def _project_result(analysis_id: str, stored: dict[str, Any]) -> dict[str, Any]:
    pipeline = _mapping(stored.get("pipeline"))
    raw = _mapping(stored.get("lightcurve"))
    time, flux = _paired_numbers(raw.get("time"), raw.get("flux"))
    time, flux = _downsample(time, flux)

    candidate = _mapping(pipeline.get("candidate"))
    detection = _mapping(pipeline.get("detection"))
    folded_output = _mapping(pipeline.get("folded_output"))
    folded_arrays = _mapping(folded_output.get("arrays"))
    phase, folded_flux = _paired_numbers(
        folded_arrays.get("phase"), folded_arrays.get("flux")
    )
    phase, folded_flux = _downsample(phase, folded_flux)

    period = _number(candidate.get("period_days", detection.get("period_days")))
    epoch = _number(candidate.get("transit_epoch", detection.get("transit_time")))
    duration = _number(candidate.get("duration_days", detection.get("duration_days")))
    depth = _number(candidate.get("depth", detection.get("depth")))
    snr = _number(candidate.get("transit_snr", detection.get("snr")))
    ml_report = _mapping(stored.get("ml_report"))
    classification = _mapping(ml_report.get("classification"))
    evidence = _mapping(ml_report.get("evidence"))

    candidates: list[dict[str, Any]] = []
    if candidate:
        candidates.append(
            {
                "rank": 1,
                "candidate_id": str(candidate.get("candidate_id", analysis_id)),
                "classification": str(classification.get("label", "Unclassified")),
                "confidence": _probability(classification.get("confidence")),
                "period": period,
                "depth": depth,
                "snr": snr,
                "explanation": {
                    "positive_factors": _strings(evidence.get("positive")),
                    "negative_factors": _strings(evidence.get("negative")),
                    "summary": str(ml_report.get("summary", "")),
                },
            }
        )

    input_summary = _mapping(pipeline.get("input_summary"))
    return {
        "analysis_id": analysis_id,
        "summary": {
            "status": str(stored.get("status", pipeline.get("status", "completed"))),
            "candidate_count": len(candidates),
            "sample_count": int(input_summary.get("sample_count", len(time))),
            "pipeline_status": str(pipeline.get("status", "unknown")),
        },
        "lightcurve": {"time": time, "flux": flux, "sample_count": len(time)},
        "transit": {
            "detected": bool(candidate),
            "period": period,
            "epoch": epoch,
            "duration": duration,
            "depth": depth,
            "snr": snr,
            "phase": phase,
            "flux": folded_flux,
        },
        "candidates": candidates,
    }


def _mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _paired_numbers(first: Any, second: Any) -> tuple[list[float], list[float]]:
    if not isinstance(first, list) or not isinstance(second, list):
        return [], []
    pairs: list[tuple[float, float]] = []
    for left, right in zip(first, second, strict=False):
        left_number = _number(left)
        right_number = _number(right)
        if left_number is not None and right_number is not None:
            pairs.append((left_number, right_number))
    return [pair[0] for pair in pairs], [pair[1] for pair in pairs]


def _downsample(
    horizontal: list[float], vertical: list[float], maximum: int = 5000
) -> tuple[list[float], list[float]]:
    if len(horizontal) <= maximum:
        return horizontal, vertical
    step = len(horizontal) / maximum
    indices = [min(int(index * step), len(horizontal) - 1) for index in range(maximum)]
    return [horizontal[index] for index in indices], [
        vertical[index] for index in indices
    ]


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def _probability(value: Any) -> float:
    number = _number(value)
    return min(1.0, max(0.0, number if number is not None else 0.0))


def _strings(value: Any) -> list[str]:
    return [str(item) for item in value] if isinstance(value, list) else []

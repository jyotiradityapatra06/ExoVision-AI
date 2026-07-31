"""Deterministic flattening of Phase 2 candidates into ML feature records."""

from collections.abc import Mapping
from dataclasses import is_dataclass
from numbers import Integral, Real
from typing import Any

import numpy as np

FEATURE_NAMES: tuple[str, ...] = (
    "period_days",
    "duration_days",
    "depth",
    "transit_snr",
    "bls_power",
    "transit_count",
    "transit_epoch",
    "phase_coverage",
    "residual_rms",
    "odd_even_depth_difference",
    "relative_odd_even_depth_difference",
    "secondary_eclipse_depth",
    "secondary_to_primary_depth_ratio",
    "candidate_score",
    "recovery_period_error",
    "recovery_epoch_error",
)

METADATA_FIELDS: tuple[str, ...] = (
    "candidate_id",
    "source_id",
    "mission",
    "sector_or_quarter",
    "label_source",
)

TARGET_FIELD = "label"
RECORD_COLUMNS: tuple[str, ...] = (*METADATA_FIELDS, *FEATURE_NAMES, TARGET_FIELD)

_POSITIVE_LABELS = {"planet", "confirmed_planet", "positive"}
_NEGATIVE_LABELS = {"false_positive", "non_planet", "negative"}
_MISSING = object()


def get_feature_names() -> tuple[str, ...]:
    """Return the stable ordered model-feature schema."""
    return FEATURE_NAMES


def normalize_label(value: Any) -> int | None:
    """Normalize supported binary label aliases to 0 or 1."""
    value = _python_scalar(value)
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError("label must be 0, 1, or a documented string alias.")
    if isinstance(value, Integral):
        if int(value) in (0, 1):
            return int(value)
        raise ValueError("integer label must be 0 or 1.")
    if isinstance(value, str):
        alias = value.strip().lower().replace("-", "_").replace(" ", "_")
        if alias in _POSITIVE_LABELS:
            return 1
        if alias in _NEGATIVE_LABELS:
            return 0
    raise ValueError(f"Unknown label {value!r}.")


def sanitize_optional_value(value: Any, *, name: str = "value") -> float | None:
    """Return a finite Python float or ``None`` for a missing optional value."""
    value = _python_scalar(value)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite number or None.")
    converted = float(value)
    if not np.isfinite(converted):
        return None
    return converted


def extract_candidate_features(
    candidate: Mapping[str, Any] | Any,
    *,
    metadata: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Flatten an existing Phase 2 candidate into an ordered feature record."""
    if not isinstance(candidate, Mapping) and not is_dataclass(candidate):
        raise TypeError("candidate must be a mapping or dataclass instance.")
    if metadata is not None and not isinstance(metadata, Mapping):
        raise TypeError("metadata must be a mapping or None.")

    nested_candidate = _value(candidate, "candidate")
    core = nested_candidate if nested_candidate is not None else candidate
    detection = _value(core, "detection")
    quality = _value(core, "data_quality")
    statistics = _value(core, "folded_statistics")
    odd_even = _value(core, "odd_even")
    recovery = _value(core, "recovery")
    confidence = _value(candidate, "confidence") or _value(core, "confidence")
    embedded_metadata = _value(core, "metadata")

    source_metadata: dict[str, Any] = {}
    if isinstance(embedded_metadata, Mapping):
        source_metadata.update(embedded_metadata)
    if metadata is not None:
        source_metadata.update(metadata)

    record: dict[str, Any] = {}
    for field in METADATA_FIELDS:
        raw = source_metadata.get(field, _value(core, field))
        record[field] = _metadata_value(raw, field)

    feature_sources = {
        "period_days": _first(core, detection, "period_days", "period"),
        "duration_days": _first(
            core, detection, "duration_days", "duration"
        ),
        "depth": _first(core, detection, "depth"),
        "transit_snr": _first(core, detection, "transit_snr", "snr"),
        "bls_power": _first(core, detection, "bls_power", "power"),
        "transit_count": _first(
            core, None, "observed_transit_events", "transit_count"
        ),
        "transit_epoch": _first(
            core, detection, "transit_epoch", "transit_time", "epoch"
        ),
        "phase_coverage": _first(quality, core, "phase_coverage"),
        "residual_rms": _first(
            statistics, core, "residual_rms", "baseline_std"
        ),
        "odd_even_depth_difference": _first(
            odd_even, core, "absolute_depth_difference"
        ),
        "relative_odd_even_depth_difference": _first(
            odd_even, core, "relative_depth_difference"
        ),
        "secondary_eclipse_depth": _first(
            core, statistics, "secondary_eclipse_depth"
        ),
        "candidate_score": _first(
            core, confidence, "candidate_score", "total_score"
        ),
        "recovery_period_error": _first(
            recovery, core, "absolute_period_error", "recovery_period_error"
        ),
        "recovery_epoch_error": _first(
            recovery, core, "epoch_error_days", "recovery_epoch_error"
        ),
    }
    for name in FEATURE_NAMES:
        if name == "secondary_to_primary_depth_ratio":
            continue
        if name == "transit_count":
            raw_count = _python_scalar(feature_sources[name])
            if (
                isinstance(raw_count, bool)
                or not isinstance(raw_count, Integral)
                or int(raw_count) < 0
            ):
                raise ValueError("transit_count must be a non-negative integer.")
            record[name] = int(raw_count)
            continue
        record[name] = sanitize_optional_value(
            feature_sources.get(name), name=name
        )
    explicit_ratio = _first(
        core, statistics, "secondary_to_primary_depth_ratio"
    )
    record["secondary_to_primary_depth_ratio"] = (
        sanitize_optional_value(explicit_ratio, name="secondary_to_primary_depth_ratio")
        if explicit_ratio is not None
        else _safe_ratio(
            record["secondary_eclipse_depth"], record["depth"]
        )
    )

    raw_label = source_metadata.get(
        TARGET_FIELD, _value(core, TARGET_FIELD) or _value(candidate, TARGET_FIELD)
    )
    record[TARGET_FIELD] = normalize_label(raw_label)
    ordered = {column: record[column] for column in RECORD_COLUMNS}
    validate_feature_record(ordered)
    return ordered


def validate_feature_record(record: Mapping[str, Any]) -> None:
    """Validate required features, optional finite values, and target label."""
    if not isinstance(record, Mapping):
        raise TypeError("record must be a mapping.")
    missing = [name for name in FEATURE_NAMES if name not in record]
    if missing:
        raise ValueError(f"Feature record is missing columns: {', '.join(missing)}.")

    period = _required_float(record["period_days"], "period_days")
    duration = _required_float(record["duration_days"], "duration_days")
    depth = _required_float(record["depth"], "depth")
    count = record["transit_count"]
    if period <= 0:
        raise ValueError("period_days must be greater than zero.")
    if duration <= 0:
        raise ValueError("duration_days must be greater than zero.")
    if depth < 0:
        raise ValueError("depth must be non-negative.")
    if (
        isinstance(count, bool)
        or not isinstance(_python_scalar(count), Integral)
        or int(count) < 0
    ):
        raise ValueError("transit_count must be a non-negative integer.")
    for name in FEATURE_NAMES:
        if name in {"period_days", "duration_days", "depth", "transit_count"}:
            continue
        value = record[name]
        if value is not None:
            _required_float(value, name)
    if TARGET_FIELD in record:
        normalize_label(record[TARGET_FIELD])


def feature_vector(record: Mapping[str, Any]) -> tuple[float | int | None, ...]:
    """Return model features in stable schema order, excluding leakage fields."""
    validate_feature_record(record)
    return tuple(record[name] for name in FEATURE_NAMES)


def _value(source: Any, name: str) -> Any:
    if source is None:
        return None
    if isinstance(source, Mapping):
        return source.get(name)
    return getattr(source, name, None)


def _first(primary: Any, secondary: Any, *names: str) -> Any:
    for source in (primary, secondary):
        for name in names:
            value = _value(source, name)
            if value is not None:
                return value
    return None


def _python_scalar(value: Any) -> Any:
    return value.item() if isinstance(value, np.generic) else value


def _metadata_value(value: Any, name: str) -> str | int | None:
    value = _python_scalar(value)
    if value is None:
        return None
    if isinstance(value, (str, Integral)) and not isinstance(value, bool):
        return int(value) if isinstance(value, Integral) else value
    raise ValueError(f"{name} must be a string, integer, or None.")


def _required_float(value: Any, name: str) -> float:
    value = _python_scalar(value)
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite number.")
    converted = float(value)
    if not np.isfinite(converted):
        raise ValueError(f"{name} must be finite.")
    return converted


def _safe_ratio(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return float(numerator / denominator)

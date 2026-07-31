"""Stable public APIs for ML feature records and tabular datasets."""

from ai.ml.dataset_builder import CandidateDatasetBuilder
from ai.ml.feature_engineering import (
    FEATURE_NAMES,
    METADATA_FIELDS,
    TARGET_FIELD,
    extract_candidate_features,
    feature_vector,
    get_feature_names,
    normalize_label,
    sanitize_optional_value,
    validate_feature_record,
)

__all__ = [
    "FEATURE_NAMES",
    "METADATA_FIELDS",
    "TARGET_FIELD",
    "CandidateDatasetBuilder",
    "extract_candidate_features",
    "feature_vector",
    "get_feature_names",
    "normalize_label",
    "sanitize_optional_value",
    "validate_feature_record",
]

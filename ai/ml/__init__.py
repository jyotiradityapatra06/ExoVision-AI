"""Stable public APIs for ML feature records and tabular datasets."""

from ai.ml.dataset import (
    TARGET_COLUMN,
    DatasetSplit,
    TargetLabel,
    generate_synthetic_dataset,
    generate_synthetic_ml_dataset,
    split_ml_dataset,
)
from ai.ml.dataset_builder import CandidateDatasetBuilder
from ai.ml.explain import CandidateExplainer
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
from ai.ml.features import (
    ML_FEATURE_NAMES,
    CandidateCategory,
    MLFeatures,
    extract_features,
    extract_ml_features,
)
from ai.ml.model import MLClassifier
from ai.ml.report import generate_candidate_report
from ai.ml.service import MLInferenceService

__all__ = [
    "FEATURE_NAMES",
    "METADATA_FIELDS",
    "TARGET_FIELD",
    "CandidateDatasetBuilder",
    "CandidateCategory",
    "CandidateExplainer",
    "DatasetSplit",
    "MLFeatures",
    "MLClassifier",
    "MLInferenceService",
    "ML_FEATURE_NAMES",
    "TARGET_COLUMN",
    "TargetLabel",
    "extract_candidate_features",
    "extract_features",
    "extract_ml_features",
    "feature_vector",
    "get_feature_names",
    "generate_synthetic_dataset",
    "generate_synthetic_ml_dataset",
    "generate_candidate_report",
    "normalize_label",
    "sanitize_optional_value",
    "split_ml_dataset",
    "validate_feature_record",
]

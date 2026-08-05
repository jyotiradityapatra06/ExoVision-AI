"""Tests for leakage-safe candidate dataset construction."""

import pandas as pd
import pytest

from ai.ml import FEATURE_NAMES, METADATA_FIELDS, CandidateDatasetBuilder


def candidate(candidate_id: str, label=None, **updates):
    record = {
        "candidate_id": candidate_id,
        "source_id": f"source-{candidate_id}",
        "period_days": 2.0,
        "duration_days": 0.1,
        "depth": 0.02,
        "transit_snr": 10.0,
        "bls_power": 5.0,
        "transit_count": 4,
        "transit_epoch": 0.5,
        "phase_coverage": 0.8,
        "residual_rms": 0.001,
        "label": label,
    }
    record.update(updates)
    return record


def test_add_many_dataframe_and_stable_columns():
    builder = CandidateDatasetBuilder()
    builder.add_many([candidate("b", "planet"), candidate("a", "false_positive")])

    frame = builder.to_dataframe()

    assert list(frame["candidate_id"]) == ["b", "a"]
    assert list(frame.columns[: len(METADATA_FIELDS)]) == list(METADATA_FIELDS)
    assert list(frame.columns[len(METADATA_FIELDS) : -1]) == list(FEATURE_NAMES)
    assert list(frame["label"]) == [1, 0]


def test_duplicate_candidate_ids_are_rejected_and_counted():
    builder = CandidateDatasetBuilder()
    builder.add(candidate("duplicate"))

    with pytest.raises(ValueError, match="Duplicate candidate_id"):
        builder.add(candidate("duplicate"))

    assert len(builder) == 1
    assert builder.summary()["duplicate_count"] == 1


def test_model_matrix_excludes_metadata_and_target():
    builder = CandidateDatasetBuilder()
    builder.add(
        candidate("one", "planet"),
        metadata={"mission": "TESS", "label_source": "catalog"},
    )

    matrix = builder.model_matrix()

    assert list(matrix.columns) == list(FEATURE_NAMES)
    assert not set(METADATA_FIELDS).intersection(matrix.columns)
    assert "label" not in matrix


def test_target_vector_labelled_unlabelled_and_partial():
    labelled = CandidateDatasetBuilder()
    labelled.add_many([candidate("p", "planet"), candidate("n", "negative")])
    assert labelled.target_vector().tolist() == [1, 0]

    unlabelled = CandidateDatasetBuilder()
    unlabelled.add(candidate("u"))
    with pytest.raises(ValueError, match="no labelled"):
        unlabelled.target_vector()

    partial = CandidateDatasetBuilder()
    partial.add_many([candidate("p", 1), candidate("u")])
    with pytest.raises(ValueError, match="unlabelled"):
        partial.target_vector()
    assert partial.target_vector(require_complete=False).tolist() == [1, pd.NA]


def test_csv_round_trip_preserves_schema_values_and_no_index(tmp_path):
    builder = CandidateDatasetBuilder()
    builder.add_many(
        [
            candidate("positive", "planet", secondary_eclipse_depth=0.002),
            candidate("unlabelled"),
        ]
    )
    path = builder.export_csv(tmp_path / "nested" / "dataset.csv")

    raw = pd.read_csv(path)
    restored = CandidateDatasetBuilder.from_csv(path)

    assert "Unnamed: 0" not in raw.columns
    assert restored.to_dataframe().columns.tolist() == raw.columns.tolist()
    assert restored.to_dataframe()["label"].tolist()[0] == 1
    assert pd.isna(restored.to_dataframe()["label"].tolist()[1])


def test_summary_counts_classes_and_missing_features():
    builder = CandidateDatasetBuilder()
    builder.add_many(
        [
            candidate("p", 1, secondary_eclipse_depth=0.004),
            candidate("n", 0),
            candidate("u"),
        ]
    )

    summary = builder.summary()

    assert summary["row_count"] == 3
    assert summary["feature_count"] == len(FEATURE_NAMES)
    assert summary["labelled_count"] == 2
    assert summary["unlabelled_count"] == 1
    assert summary["positive_count"] == 1
    assert summary["negative_count"] == 1
    assert summary["class_balance"] == {
        "positive_fraction": 0.5,
        "negative_fraction": 0.5,
    }
    assert summary["missing_value_count_by_feature"]["secondary_eclipse_depth"] == 2


def test_empty_dataset_behaviour(tmp_path):
    builder = CandidateDatasetBuilder()

    with pytest.raises(ValueError, match="empty"):
        builder.to_dataframe()
    with pytest.raises(ValueError, match="empty"):
        builder.export_csv(tmp_path / "empty.csv")

    frame = builder.to_dataframe(allow_empty=True)
    builder.export_csv(tmp_path / "empty.csv", allow_empty=True)
    assert frame.empty
    assert list(frame.columns[len(METADATA_FIELDS) : -1]) == list(FEATURE_NAMES)

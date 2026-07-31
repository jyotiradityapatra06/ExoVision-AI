"""Tabular dataset assembly for validated transit-candidate feature records."""

from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any

import pandas as pd

from ai.ml.feature_engineering import (
    FEATURE_NAMES,
    METADATA_FIELDS,
    RECORD_COLUMNS,
    TARGET_FIELD,
    extract_candidate_features,
    get_feature_names,
    validate_feature_record,
)


class CandidateDatasetBuilder:
    """Build a deterministic leakage-safe candidate dataset."""

    def __init__(self) -> None:
        self._records: list[dict[str, Any]] = []
        self._candidate_ids: set[str] = set()
        self._duplicate_count = 0

    def __len__(self) -> int:
        return len(self._records)

    def add(
        self,
        candidate: Mapping[str, Any] | Any,
        *,
        metadata: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Extract, validate, and append one candidate record."""
        record = extract_candidate_features(candidate, metadata=metadata)
        candidate_id = record["candidate_id"]
        if candidate_id is not None and candidate_id in self._candidate_ids:
            self._duplicate_count += 1
            raise ValueError(f"Duplicate candidate_id {candidate_id!r}.")
        self._records.append(dict(record))
        if candidate_id is not None:
            self._candidate_ids.add(candidate_id)
        return dict(record)

    def add_many(
        self,
        candidates: Iterable[Mapping[str, Any] | Any],
    ) -> None:
        """Append candidates in input order."""
        for candidate in candidates:
            self.add(candidate)

    def to_dataframe(self, *, allow_empty: bool = False) -> pd.DataFrame:
        """Return rows and columns in deterministic insertion/schema order."""
        self._require_nonempty(allow_empty)
        return pd.DataFrame(self._records, columns=RECORD_COLUMNS)

    def export_csv(
        self, path: str | Path, *, allow_empty: bool = False
    ) -> Path:
        """Write a stable CSV without an index column."""
        destination = Path(path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        self.to_dataframe(allow_empty=allow_empty).to_csv(
            destination, index=False
        )
        return destination

    @classmethod
    def from_csv(cls, path: str | Path) -> "CandidateDatasetBuilder":
        """Read an exported feature dataset and validate every record."""
        frame = pd.read_csv(path)
        missing = [column for column in RECORD_COLUMNS if column not in frame]
        if missing:
            raise ValueError(f"CSV is missing columns: {', '.join(missing)}.")
        builder = cls()
        for raw in frame.loc[:, RECORD_COLUMNS].to_dict(orient="records"):
            record = {
                key: None if pd.isna(value) else value
                for key, value in raw.items()
            }
            record["transit_count"] = int(record["transit_count"])
            if record[TARGET_FIELD] is not None:
                record[TARGET_FIELD] = int(record[TARGET_FIELD])
            validate_feature_record(record)
            candidate_id = record["candidate_id"]
            if candidate_id is not None and candidate_id in builder._candidate_ids:
                builder._duplicate_count += 1
                raise ValueError(f"Duplicate candidate_id {candidate_id!r}.")
            builder._records.append(record)
            if candidate_id is not None:
                builder._candidate_ids.add(candidate_id)
        return builder

    def model_matrix(self, *, allow_empty: bool = False) -> pd.DataFrame:
        """Return model inputs only, excluding identifiers and target labels."""
        return self.to_dataframe(allow_empty=allow_empty).loc[:, FEATURE_NAMES]

    def target_vector(self, *, require_complete: bool = True) -> pd.Series:
        """Return labels, optionally requiring every row to be labelled."""
        frame = self.to_dataframe()
        labels = frame[TARGET_FIELD]
        if not labels.notna().any():
            raise ValueError("Dataset contains no labelled records.")
        if require_complete and labels.isna().any():
            raise ValueError("Dataset contains unlabelled records.")
        return labels.astype("Int64")

    def feature_names(self) -> tuple[str, ...]:
        """Return stable model-feature names."""
        return get_feature_names()

    def summary(self) -> dict[str, Any]:
        """Return class, missing-value, and schema statistics."""
        frame = self.to_dataframe(allow_empty=True)
        labels = frame[TARGET_FIELD] if len(frame) else pd.Series(dtype="Int64")
        labelled = int(labels.notna().sum())
        positive = int((labels == 1).sum())
        negative = int((labels == 0).sum())
        return {
            "row_count": len(frame),
            "feature_count": len(FEATURE_NAMES),
            "labelled_count": labelled,
            "unlabelled_count": len(frame) - labelled,
            "positive_count": positive,
            "negative_count": negative,
            "missing_value_count_by_feature": {
                name: int(frame[name].isna().sum()) if len(frame) else 0
                for name in FEATURE_NAMES
            },
            "duplicate_count": self._duplicate_count,
            "class_balance": {
                "positive_fraction": (
                    positive / labelled if labelled else None
                ),
                "negative_fraction": (
                    negative / labelled if labelled else None
                ),
            },
            "metadata_fields": list(METADATA_FIELDS),
        }

    def _require_nonempty(self, allow_empty: bool) -> None:
        if not isinstance(allow_empty, bool):
            raise ValueError("allow_empty must be boolean.")
        if not self._records and not allow_empty:
            raise ValueError("Dataset is empty.")

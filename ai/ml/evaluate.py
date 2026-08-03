"""Evaluation metrics and readable reports for Phase 3 classifiers."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from ai.ml.dataset import TargetLabel
from ai.ml.model import MLClassifier

CLASS_NAMES: tuple[str, ...] = (
    "Noise",
    "Planet Transit Candidate",
    "Eclipsing Binary",
    "Stellar Activity / Star Spots",
)


def evaluate_classifier(
    classifier: MLClassifier,
    features: pd.DataFrame | np.ndarray | Sequence[Sequence[float]],
    labels: pd.Series | np.ndarray | Sequence[int],
    *,
    print_output: bool = False,
) -> dict[str, Any]:
    """Evaluate a classifier with macro metrics and per-class details."""
    expected = np.asarray(labels, dtype=int)
    predicted = classifier.predict(features)
    class_ids = [int(label) for label in TargetLabel]
    report = classification_report(
        expected,
        predicted,
        labels=class_ids,
        target_names=CLASS_NAMES,
        zero_division=0,
        output_dict=True,
    )
    metrics: dict[str, Any] = {
        "accuracy": float(accuracy_score(expected, predicted)),
        "precision": float(
            precision_score(expected, predicted, average="macro", zero_division=0)
        ),
        "recall": float(
            recall_score(expected, predicted, average="macro", zero_division=0)
        ),
        "f1_score": float(
            f1_score(expected, predicted, average="macro", zero_division=0)
        ),
        "confusion_matrix": confusion_matrix(
            expected, predicted, labels=class_ids
        ).tolist(),
        "classification_report": report,
    }
    if print_output:
        print(format_evaluation(metrics))
    return metrics


def format_evaluation(metrics: dict[str, Any]) -> str:
    """Format evaluation output for command-line use."""
    matrix = np.asarray(metrics["confusion_matrix"])
    matrix_lines = "\n".join("  " + " ".join(map(str, row)) for row in matrix)
    return (
        f"Accuracy:  {metrics['accuracy']:.4f}\n"
        f"Precision: {metrics['precision']:.4f}\n"
        f"Recall:    {metrics['recall']:.4f}\n"
        f"F1 score:  {metrics['f1_score']:.4f}\n"
        f"Confusion matrix:\n{matrix_lines}"
    )

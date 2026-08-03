"""End-to-end training entry point for the Phase 3 Random Forest baseline."""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ai.ml.dataset import TARGET_COLUMN, DatasetSplit, generate_synthetic_ml_dataset
from ai.ml.evaluate import evaluate_classifier, format_evaluation
from ai.ml.features import ML_FEATURE_NAMES
from ai.ml.model import DEFAULT_MODEL_PATH, MLClassifier


@dataclass(frozen=True, slots=True)
class TrainingConfig:
    """Configuration for reproducible synthetic baseline training."""

    number_of_samples: int = 5000
    random_seed: int = 42
    test_size: float = 0.2
    model_parameters: dict[str, Any] = field(
        default_factory=lambda: {"n_estimators": 200, "max_depth": None}
    )
    model_path: Path = DEFAULT_MODEL_PATH


@dataclass(frozen=True, slots=True)
class TrainingResult:
    """Trained model, held-out metrics, and persisted artifact location."""

    classifier: MLClassifier
    metrics: dict[str, Any]
    model_path: Path
    training_samples: int
    test_samples: int


def train_classifier(config: TrainingConfig | None = None) -> TrainingResult:
    """Generate data, train, evaluate, and save the baseline classifier."""
    settings = config or TrainingConfig()
    generated = generate_synthetic_ml_dataset(
        settings.number_of_samples,
        random_seed=settings.random_seed,
        test_size=settings.test_size,
    )
    if not isinstance(generated, DatasetSplit):
        raise RuntimeError("Expected a train/test dataset split.")
    parameters = dict(settings.model_parameters)
    parameters.setdefault("random_state", settings.random_seed)
    classifier = MLClassifier(**parameters)
    classifier.fit(
        generated.train.loc[:, ML_FEATURE_NAMES],
        generated.train[TARGET_COLUMN],
    )
    metrics = evaluate_classifier(
        classifier,
        generated.test.loc[:, ML_FEATURE_NAMES],
        generated.test[TARGET_COLUMN],
    )
    model_path = classifier.save(settings.model_path)
    return TrainingResult(
        classifier=classifier,
        metrics=metrics,
        model_path=model_path,
        training_samples=len(generated.train),
        test_samples=len(generated.test),
    )


def main(argv: list[str] | None = None) -> int:
    """Run training from ``python -m ai.ml.train``."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=5000)
    parser.add_argument("--random-seed", type=int, default=42)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--estimators", type=int, default=200)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    arguments = parser.parse_args(argv)
    print("Generating dataset...")
    print(f"Samples: {arguments.samples}\n")
    print("Training classifier...")
    result = train_classifier(
        TrainingConfig(
            number_of_samples=arguments.samples,
            random_seed=arguments.random_seed,
            test_size=arguments.test_size,
            model_parameters={"n_estimators": arguments.estimators},
            model_path=arguments.model_path,
        )
    )
    print("\nTraining complete.\n")
    print(format_evaluation(result.metrics))
    print(f"\nModel saved:\n{result.model_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

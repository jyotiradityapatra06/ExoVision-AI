"""Tests for Phase 3 training and evaluation orchestration."""

from ai.ml.evaluate import evaluate_classifier
from ai.ml.features import ML_FEATURE_NAMES
from ai.ml.model import MLClassifier
from ai.ml.train import TrainingConfig, train_classifier


def test_training_pipeline_saves_model_and_generates_metrics(tmp_path):
    result = train_classifier(
        TrainingConfig(
            number_of_samples=80,
            random_seed=4,
            test_size=0.25,
            model_parameters={"n_estimators": 20, "max_depth": 6},
            model_path=tmp_path / "model.joblib",
        )
    )

    assert result.model_path.is_file()
    assert result.training_samples == 60
    assert result.test_samples == 20
    assert set(result.metrics) == {
        "accuracy",
        "precision",
        "recall",
        "f1_score",
        "confusion_matrix",
        "classification_report",
    }
    assert len(result.metrics["confusion_matrix"]) == 4


def test_evaluation_metrics_are_bounded():
    from ai.ml.dataset import TARGET_COLUMN, generate_synthetic_ml_dataset

    dataset = generate_synthetic_ml_dataset(40, random_seed=8)
    classifier = MLClassifier(n_estimators=10).fit(
        dataset.loc[:, ML_FEATURE_NAMES], dataset[TARGET_COLUMN]
    )
    metrics = evaluate_classifier(
        classifier,
        dataset.loc[:, ML_FEATURE_NAMES],
        dataset[TARGET_COLUMN],
    )

    for name in ("accuracy", "precision", "recall", "f1_score"):
        assert 0.0 <= metrics[name] <= 1.0

# ExoVision AI Phase 3 Final Report

## 1. Objective

Phase 3 delivers a deterministic, classical machine-learning layer that turns a
Phase 2 transit candidate into a four-class prediction, probability estimates,
human-readable evidence, and a JSON-safe scientific report. The release also
exposes this workflow through the existing versioned FastAPI backend.

## 2. Architecture

Phase 3 is isolated under `ai/ml/`. Phase 1 simulation and preprocessing code
and Phase 2 detection, folding, extraction, recovery, and scoring algorithms are
unchanged. The backend adds one router to the existing FastAPI application and
keeps HTTP schemas under `backend/app/schemas/`.

The module responsibilities are:

- `features.py`: stable four-class numerical feature schema and extraction.
- `dataset.py`: balanced deterministic synthetic data and stratified splitting.
- `model.py`: schema-aware Random Forest fitting, prediction, and persistence.
- `train.py` and `evaluate.py`: offline training and held-out metrics.
- `predict.py`: candidate-to-probability prediction helper.
- `explain.py` and `report.py`: importance-ranked evidence and scientific reports.
- `service.py`: long-lived inference orchestration for API consumers.

The earlier `feature_engineering.py` and `dataset_builder.py` APIs remain tested
for compatibility with existing binary catalog workflows. They are deliberately
retained rather than unused duplicate implementations. Import review found no
runtime cycles. The release artifact path is owned by `model.py`, preventing the
inference path from importing the offline training pipeline.

## 3. ML Pipeline

```text
Phase 2 candidate
      ↓
Feature extraction (18 ordered numerical features)
      ↓
Random Forest classification
      ↓
Four-class probability output
      ↓
Importance-ranked human-readable explanation
      ↓
JSON-safe scientific candidate report
```

The persisted artifact contains its format version and ordered feature schema.
Loading rejects missing, malformed, or incompatible artifacts. Inference does
not mutate or retrain the estimator.

## 4. Classification Classes

| Label | Scientific class |
| ---: | --- |
| 0 | Noise / false positive |
| 1 | Planet transit candidate |
| 2 | Eclipsing binary |
| 3 | Stellar activity / star spots |

## 5. Explainable AI Approach

The explainer ranks the five strongest features using the Random Forest's native
impurity importances. Deterministic astronomy-oriented rules identify whether a
measured value supports or challenges the predicted class. Reports include the
feature value, global importance, evidence direction, signed evidence score,
plain-language description, and whether a safe default was used.

These explanations are review aids, not causal statements or calibrated local
attributions. Future SHAP integration remains optional and requires separate
scientific and dependency review.

## 6. API Endpoints

All routes use the existing `/api/v1` namespace:

- `POST /api/v1/ml/predict` validates prepared features and returns a class,
  confidence, four probabilities, and explanation.
- `POST /api/v1/ml/analyze` processes a serialized Phase 2 candidate and returns
  a complete scientific report.
- `GET /api/v1/ml/info` reports estimator, release version, class labels, and
  the ordered feature schema.

The model service is loaded lazily and cached once per backend process. Invalid
candidate input returns HTTP 422. A missing or incompatible artifact returns
HTTP 503 without exposing an internal traceback. Pydantic response models
validate every successful API payload.

## 7. Testing Results

The release suite contains **187 tests**, all passing. Coverage includes feature
extraction, balanced dataset generation, deterministic model behavior,
persistence, metrics, prediction probabilities, explanation ranking, JSON
reports, all ML endpoints, and an artifact-backed end-to-end Phase 3 integration
test. The Python application, backend, scripts, and tests pass Ruff. Dependency
resolution passes `pip check`, and package compilation succeeds.

Repository-wide Ruff still reports five pre-existing findings in
`notebooks/01_lightcurve_exploration.ipynb`. The notebook is outside Phase 3 and
was intentionally not modified during this audit.

## 8. Known Limitations

- Training and reported baseline accuracy currently rely on synthetic data.
- Independent validation on real Kepler and TESS candidate catalogs is pending.
- The Random Forest is a baseline model, not a final scientifically calibrated
  classifier.
- Model probabilities are not independently calibrated occurrence probabilities.
- The generated Joblib artifact is deployment data and is excluded from Git;
  deployments must provision it through an artifact workflow.
- Explanations combine global impurity importance with domain direction rules,
  rather than exact local feature attribution.

## 9. Future Improvements

After Phase 4 integration, scientific hardening should add source-grouped mission
validation, catalog and injection/recovery datasets, probability calibration,
class-imbalance monitoring, artifact registry/version checks, model drift
monitoring, and comparison with other classical baselines. These improvements
must preserve the stable API and feature-schema contracts or introduce explicit
versions.

Phase 3 is ready for Phase 4 frontend integration, subject to the documented
scientific-validation and artifact-provisioning limitations.

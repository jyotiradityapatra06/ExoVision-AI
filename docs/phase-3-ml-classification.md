# Phase 3: ML Classification

## Objective

Phase 3 adds a machine-learning classification layer after Phase 2 candidate
detection. Phase 3.1 establishes features and datasets only; it does not train,
select, or deploy a model.

The target is a four-class problem:

| Label | Class |
| ---: | --- |
| 0 | Noise / false positive |
| 1 | Planet transit candidate |
| 2 | Eclipsing binary |
| 3 | Stellar activity / star spots |

## Feature engineering

`ai.ml.features` consumes Phase 2 `TransitCandidate` dataclasses, serialized
candidate dictionaries, or complete pipeline results. The stable numerical
schema combines orbital and transit measurements, signal quality, folded-shape
statistics, common false-positive indicators, and the existing heuristic score.

Optional folded phase/flux arrays improve symmetry, ingress/egress, variance,
and folding-improvement measurements. When optional data is absent or non-finite,
the extractor emits conservative finite defaults. This makes records safe for
tabular ML tools and keeps extraction deterministic. Candidate score categories
are ordinally encoded from rejected (0) through high (3); they are input features,
not target labels or probabilities.

The earlier binary catalog feature API remains available for compatibility.

## Dataset strategy

`ai.ml.dataset` builds exactly balanced synthetic datasets with configurable
sample counts and random seeds. It reuses the Phase 1 synthetic transit generator
and applies class-specific signal characteristics: shallow consistent planet
events, deep odd/even and secondary eclipses, periodic stellar modulation, and
noise-only curves. Output is a pandas `DataFrame` containing the stable feature
columns and `target`.

The optional split is deterministic and stratified so every class retains the
same proportion in train and test data. Synthetic data is intended for pipeline
validation and initial experiments, not as a substitute for vetted mission
catalogs. Later datasets should combine confirmed planets, catalogued eclipsing
binaries, variability labels, injected signals, and carefully sampled negatives.

## Future model training plan

Phase 3.2 can compare transparent baselines such as multinomial logistic
regression and tree ensembles, using stratified cross-validation and class-aware
metrics (macro F1, per-class recall, confusion matrices, and calibration).
Splits should be grouped by source star to prevent leakage. Feature scaling,
imputation policy, model serialization, threshold calibration, and held-out real
mission evaluation must be versioned with the feature schema. No model training
is performed in Phase 3.1.

## Phase 3.2 ML architecture

The first classification baseline is a scikit-learn `RandomForestClassifier`
wrapped by `ai.ml.model.MLClassifier`. The wrapper owns input-schema validation,
deterministic estimator configuration, prediction, probability output, and
joblib persistence. Saved artifacts contain a format version and the ordered
feature names; loading fails early if an artifact does not match the current
feature schema.

The integration flow is:

```text
Phase 2 candidate -> ML feature extraction -> Random Forest -> class probabilities
```

`ai.ml.predict.predict_candidate` provides this flow as one call. It returns the
readable predicted class, its confidence, and probabilities for all four target
classes. These probabilities are model estimates and are not independently
calibrated astrophysical probabilities.

## Training workflow

Run the baseline trainer from the repository root:

```console
python -m ai.ml.train
```

The command generates balanced synthetic data, performs a deterministic
stratified split, trains the forest, evaluates its held-out predictions, and
saves `models/exovision_classifier.joblib`. Command-line flags configure sample
count, seed, test fraction, tree count, and output path. The same workflow is
available programmatically through `TrainingConfig` and `train_classifier`.

Evaluation reports accuracy, macro precision, macro recall, macro F1, a
four-by-four confusion matrix, and a per-class classification report. Macro
averaging gives equal weight to each scientific class.

## Future improvements

The synthetic baseline should next be evaluated on source-grouped, catalogued
mission data and realistic injection/recovery samples. Candidate improvements
include tuned Random Forest parameters, calibrated probabilities, comparison
with gradient-boosted trees and linear baselines, drift monitoring, artifact
version metadata, and robust handling of class imbalance. The Phase 3.3
explainability layer is described below.

## Explainable AI architecture

Explainability matters because a classification alone is not enough for
scientific review. Students need understandable reasoning, researchers need the
measurements behind a decision, and operators need to recognize weak or missing
evidence before prioritizing follow-up observations.

`ai.ml.explain.CandidateExplainer` combines the fitted Random Forest's native
impurity-based feature importance with deterministic astronomy-oriented rules.
The model importance ranks which measurements matter most to the forest overall;
the domain rule identifies whether the candidate's measured value supports or
challenges its predicted class. The five highest-ranked measurements are
returned with their value, importance, signed evidence score, direction, and a
plain-language description. Missing values receive conservative defaults and
are disclosed explicitly in the explanation.

This approach is lightweight and repeatable, but it is evidence-oriented rather
than a causal or exact local decomposition of the prediction. Reports generated
by `ai.ml.report.generate_candidate_report` preserve that evidence in JSON-safe
positive and negative groups for later UI or API use.

A future iteration can add SHAP TreeExplainer values for mathematically grounded
per-candidate local contributions, subject to dependency, runtime, model-version,
and scientific-validation review. SHAP output should complement rather than
replace the human-readable astronomy descriptions.

## ML API architecture

Phase 3.4 exposes classification through the existing versioned FastAPI backend:

```text
Frontend / external client
          ↓
FastAPI `/api/v1/ml`
          ↓
MLInferenceService
          ↓
Random Forest classifier
          ↓
Explanation engine
          ↓
JSON-safe scientific report
```

The service lazily loads `models/exovision_classifier.joblib` once per backend
process and reuses the same fitted classifier and explainer for subsequent
requests. It does not train or mutate the model during inference.

The version 1 endpoints are:

- `POST /api/v1/ml/predict`: classify prepared, potentially partial feature
  input and return probabilities plus human-readable evidence.
- `POST /api/v1/ml/analyze`: accept a serialized Phase 2 candidate and return a
  complete classification and scientific report.
- `GET /api/v1/ml/info`: return the active estimator type, model version, class
  labels, and ordered input feature schema.

Pydantic schemas reject unknown prepared features and malformed identifiers.
Domain/input errors return HTTP 422 responses. Model artifacts should be created
by the offline Phase 3.2 training workflow before starting inference endpoints.

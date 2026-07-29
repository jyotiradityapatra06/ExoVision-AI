# Machine Learning & AI Detection Roadmap

Everything in this document is planned work beyond Phase 1.1. No datasets,
feature pipelines, trained models, or inference services currently exist.

## 1. Classical Signal Processing Baseline
- **Box Least Squares (BLS)**: Search for periodic rectangular transit dips across a frequency grid.
- **Transit Least Squares (TLS)**: Enhanced periodogram utilizing limb-darkened transit models for improved sensitivity to small planets.

## 2. Feature Engineering & Diagnostics
- **Global & Local Views**: 201-bin global light curve view and 61-bin local transit zoom view.
- **Centroid Motion**: Column/row pixel flux centroid offsets during in-transit vs out-of-transit phases.
- **Odd-Even Depth Comparison**: Ratio of odd to even transit depths to flag eclipsing binaries.

## 3. Deep Learning & Model Architecture
- **1D Convolutional Neural Network (CNN)**: Dual-stream CNN receiving global and local light-curve views (Astronet architecture variant).
- **Gradient Boosted Decision Trees (XGBoost / LightGBM)**: Classifying tabular features extracted from transit periodograms.
- **Ensemble Voting Classifier**: Fusion of CNN confidence probabilities and GBDT predictions.

## 4. Evaluation & Benchmarks
- Metrics: Precision, Recall, ROC-AUC, PR-AUC, False Positive Rate (FPR) at 99% recall.
- Datasets for benchmarking: Confirmed Kepler Planets, Kepler False Positives, TESS TOI Catalog.

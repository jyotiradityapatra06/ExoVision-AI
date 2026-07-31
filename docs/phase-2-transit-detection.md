# Phase 2 — Transit Detection and Candidate Analysis

Intended release: **v1.2.0 — Phase 2 Transit Detection and Candidate Analysis**

Phase 2 turns a validated astronomical light curve into a detected, measured,
and ranked transit candidate. It builds on the completed Phase 1 acquisition
and preprocessing foundation. The implementation is suitable for engineering
validation and controlled synthetic experiments; it has not been calibrated
or scientifically validated as a mission-grade discovery pipeline.

## Workflow

```text
time, flux, optional uncertainty and quality
                    |
                    v
       optional Phase 1 preprocessing
                    |
                    v
          Box Least Squares detection
                    |
                    v
              phase folding
                    |
          +---------+----------+
          |                    |
    phase binning       transit-window analysis
                               |
                       individual event extraction
                               |
                       odd/even consistency
                               |
                       candidate features
                               |
                    heuristic quality score
                               |
                    structured pipeline result
```

When known synthetic parameters are supplied, recovery validation runs after
detection and before candidate construction.

## Components

### Preprocessing relationship

`ai.preprocessing.preprocess_lightcurve()` remains the Phase 1 preprocessing
contract. It cleans synchronized arrays, normalizes flux, performs transit-safe
outlier removal, and detrends low-frequency variation. The Phase 2 pipeline can
disable preprocessing for already prepared light curves.

### BLS detection

`ai.detection.detect_transit_bls()` uses Astropy Box Least Squares and returns a
`TransitDetectionResult` containing period, epoch, duration, depth, BLS power,
depth error, SNR, and the detector significance flag. A BLS signal is a
**transit candidate, not a confirmed exoplanet**.

### Synthetic transits and recovery

`ai.simulation.generate_synthetic_transit()` creates deterministic periodic box
transits with configurable cadence, noise, missing observations, and outliers.

`ai.evaluation.evaluate_transit_recovery()` compares a detection with known
injected period, epoch, duration, and depth. It reports wrapped epoch error,
period and shape errors, harmonic classification, and configurable recovery
status.

### Phase folding and binning

`ai.transit.fold_lightcurve()` folds samples around transit phase zero using
the default convention `-0.5 <= phase < 0.5`. Original indices survive
filtering and stable phase sorting.

`ai.transit.bin_folded_lightcurve()` supports fixed bin counts or widths, mean
or median aggregation, sample counts, minimum samples, empty bins, and
uncertainty estimates.

### Transit windows and events

`ai.transit.extract_transit_window()` separates the folded transit from its
nearby local baseline.

`ai.transit.extract_transit_events()` projects period, epoch, and duration
across the original timeline. Each event reports expected center and window,
sample support, full/partial coverage, local depth, local scatter, heuristic
SNR, and warnings for gaps or missing support.

### Odd/even consistency

`ai.transit.evaluate_odd_even_consistency()` compares alternating event depths.
An odd/even mismatch is a **false-positive warning heuristic**. It does not
prove that a signal is an eclipsing binary and does not disprove planetary
origin.

### Candidate features

`ai.transit.build_transit_candidate()` assembles:

- detector geometry and significance;
- observed and fully observed event counts;
- folded transit and local-baseline statistics;
- measured depth and detector-depth agreement;
- detector, propagated, and robust SNR measures;
- valid-sample, quality-flag, phase, and phase-bin coverage;
- odd/even consistency;
- optional recovery metadata;
- deterministic candidate identifier and warning flags.

### Confidence scoring

`ai.evaluation.score_transit_candidate()` produces a transparent score from
0–100 using bounded weighted components and explicit penalties. Default
categories are:

- high: score at least 75;
- moderate: score at least 50;
- low: score at least 25;
- rejected: score below 25 or an enabled hard-rejection condition.

Weights are normalized internally over available components. Components,
normalization targets, penalties, category boundaries, and hard-rejection
switches are configurable and included in serialized output.

The confidence score is a **heuristic engineering-quality score, not a
calibrated probability** that a candidate is a planet.

### End-to-end orchestration

`ai.pipeline.analyze_lightcurve()` coordinates validation, optional
preprocessing, BLS, folding, optional recovery and phase binning, candidate
construction, and scoring.

Pipeline statuses are:

- `success`: required stages pass and scoring does not reject the candidate;
- `no_detection`: BLS completes normally with `detected=False`;
- `rejected`: a candidate is constructed but confidence rules reject it;
- `partial`: an optional stage fails under the partial-failure policy;
- `failed`: input validation, a required stage, or configured optional failure
  fails.

Each attempted stage records success, warnings, error type, and a concise error
message. Serialized results intentionally omit full tracebacks.

`ai.pipeline.analyze_lightcurve_batch()` processes inputs independently in
order, continues after failures, aggregates status counts, and optionally ranks
constructed candidates. Ranking places non-rejected candidates first, then
sorts by descending score and deterministic candidate identifier.

## Serialization

All Phase 2 result structures provide `to_dict()`. NumPy scalar values become
Python-native values and non-finite optional values become `None`. Pipeline
results exclude large intermediate arrays by default and retain summaries with
sample counts and ranges. Arrays can be explicitly retained through
`TransitAnalysisConfig`.

Stage timing uses a monotonic clock and is informational. Tests should not
compare exact runtime values.

## Minimal usage

```python
from ai.pipeline import analyze_lightcurve

result = analyze_lightcurve(
    time,
    flux,
    flux_error=flux_error,
    quality=quality,
    source_id="TIC-123",
)

print(result.status.value)
if result.confidence is not None:
    print(result.confidence.total_score)
```

Run the deterministic demonstration from the project root:

```powershell
python scripts/run_transit_demo.py
python scripts/run_transit_demo.py --output outputs/transit-demo.json
```

## Scientific limitations

- Synthetic events are idealized box transits.
- BLS can select aliases or simple period harmonics.
- Detrending and window choices can alter measured depth and SNR.
- Event-completeness checks use cadence-based heuristics.
- SNR calculations assume approximately independent samples.
- Odd/even and confidence scores are heuristic.
- Scores are not calibrated across Kepler, K2, and TESS populations.
- Stellar variability, centroid motion, dilution, eclipsing binaries, and
  instrumental systematics require further validation.
- No transit-timing variation model, astrophysical vetting, or ML classifier is
  included.

Astrophysical validation, false-positive classification, and ML-based ranking
belong to later project phases.

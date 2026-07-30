# ExoVision AI Phase 1 Final Audit Report

Audit date: 2026-07-30  
Target runtime: Python 3.12

## Executive Summary

Phase 1 has a coherent, simple pipeline from FITS ingestion through CSV export.
The hardening pass corrected dependency and runtime metadata, made malformed
FITS errors contextual, completed required input coverage, documented operation,
and completed generated-artifact ignore rules. No BLS/TLS or ML functionality
was added and no working signal-processing algorithm was changed.

**Phase 2 readiness score: 9/10 — ready with tracked, non-blocking technical
debt.**

## Architecture Status

The Phase 1 boundaries are appropriate:

```text
FITS -> loader/validation -> preprocessing -> visualization -> CSV export
```

Packages have `__init__.py` files where required. Imports resolve from the
repository root under the configured pytest path. No duplicate Phase 1 modules
or broken relative imports were found. The empty `features`, `detection`,
`experiments`, and `evaluation` packages are roadmap placeholders rather than
active Phase 1 modules.

## Completed Features

- Deterministic Kepler and TESS sample FITS generation
- Metadata catalog generation
- FITS binary-table discovery and mission column fallbacks
- Array shape, length, and empty-input validation
- Non-finite and duplicate-sample cleaning
- Median and z-score normalization
- Transit-safe robust outlier removal
- Lightkurve/Savitzky-Golay detrending
- Raw, processed, and comparison plots
- Standardized CSV export
- Batch preprocessing script with per-file error isolation

## Findings

### Resolved

Issue: Python target was inconsistent with the Phase 1 target.  
Location: `pyproject.toml`, `README.md`  
Severity: High  
Recommended fix: Target Python 3.12 consistently.  
Resolution: Ruff now targets `py312`; setup documentation requires Python 3.12.

Issue: Development dependency name was invalid (`httpx2`).  
Location: `backend/requirements-dev.txt`  
Severity: Critical  
Recommended fix: Replace it with the compatible `httpx` dependency.  
Resolution: Corrected to `httpx>=0.27,<1.0`.

Issue: AI runtime dependencies had no root installation manifest.  
Location: repository root  
Severity: Critical  
Recommended fix: Add a Python 3.12-compatible root `requirements.txt`.  
Resolution: Added direct Phase 1 runtime dependencies with bounded major
versions and included backend runtime requirements.

Issue: Malformed FITS files leaked low-context Astropy I/O exceptions.  
Location: `ai/utils/lightcurve_loader.py`  
Severity: Medium  
Recommended fix: Raise a contextual exception while preserving the cause.  
Resolution: Malformed FITS open failures now raise a path-specific `ValueError`.

Issue: Required mission and negative-path integration coverage was incomplete.  
Location: `ai/tests/test_lightcurve_loader.py`  
Severity: High  
Recommended fix: Cover Kepler, TESS, invalid FITS, and empty FITS samples.  
Resolution: Added deterministic synthetic tests for all four cases; the existing
full pipeline test covers loader through plots and CSV.

Issue: Generated pipeline output was not explicitly ignored.  
Location: `.gitignore`  
Severity: Medium  
Recommended fix: Ignore `outputs/` while retaining existing rules.  
Resolution: Added `outputs/`; `.venv/`, `__pycache__/`, `.pytest_cache/`,
`*.fits`, and `*.csv` were already covered.

Issue: README text was encoding-corrupted and omitted current Phase 1 commands.  
Location: `README.md`  
Severity: High  
Recommended fix: Replace it with UTF-8 documentation for installation,
acquisition, pipeline execution, tests, and roadmap.  
Resolution: Completed.

### Open Technical Debt

Issue: Preprocessing configuration is a free-form dictionary and unknown keys
are accepted silently.  
Location: `ai/preprocessing/pipeline.py`  
Severity: Medium  
Recommended fix: Before Phase 2 adds detector settings, introduce a small typed
configuration object in `ai/config/` (or a validated YAML loader). Keep paths
separate from algorithm parameters. Do not add configuration infrastructure
until multiple entry points require it.

Issue: Batch discovery is non-recursive and output names use only the FITS stem.  
Location: `scripts/preprocess_dataset.py`  
Severity: Medium  
Recommended fix: When archive-native nested downloads become the primary input,
support explicit manifests or recursive discovery and collision-safe target
identifiers. Preserve the current simple behavior for Phase 1 samples.

Issue: Batch processing is serial and builds plots and DataFrames one file at a
time.  
Location: `scripts/preprocess_dataset.py`, `ai/export/csv_exporter.py`  
Severity: Low for Phase 1; Medium at thousands-of-curves scale  
Recommended fix: Benchmark first, then use bounded worker processes and chunked
or direct CSV writes if export memory becomes material. Keep per-file processing
to bound peak memory.

Issue: Several NumPy stages make defensive copies after boolean indexing, which
already returns copies.  
Location: `ai/preprocessing/outliers.py`, `ai/preprocessing/normalize.py`,
`ai/preprocessing/detrend.py`  
Severity: Low  
Recommended fix: Remove redundant copies only after profiling; current
immutability guarantees are preferable to premature optimization.

Issue: `auto` detrending catches broad exceptions before its documented fallback.  
Location: `ai/preprocessing/detrend.py`  
Severity: Low  
Recommended fix: Narrow caught exception types after collecting representative
Lightkurve failure modes. The fallback is logged and explicit, so this is not a
silent failure.

Issue: Dependency ranges are reproducible at the compatible-major level, not
bit-for-bit locked.  
Location: `requirements.txt`, `backend/requirements*.txt`  
Severity: Low  
Recommended fix: Add a generated lock/constraints file in CI when deployment
packaging is introduced; retain the readable direct-dependency manifests.

## Error Handling and Logging

Library functions raise meaningful `ValueError` or `FileNotFoundError`
exceptions. Pipeline stages log counts and selected methods. The batch script
logs per-file failures and continues, which is appropriate for large datasets.
There are no silent `pass` blocks in the Phase 1 Python path.

## Performance Assessment

Processing is vectorized with NumPy/SciPy; no per-cadence Python loops were
found. FITS files are closed through context management. The batch workflow
processes one curve at a time, keeping memory proportional to a single light
curve plus plot/DataFrame overhead. This is suitable for Phase 2 development,
though throughput should be benchmarked before processing thousands of curves.

## Test Status

Required gates:

```text
python -m pytest -v
python -m ruff check ai scripts
```

Final observed result: **38 passed, 1 optional-dependency warning**. Ruff
reported **All checks passed**. Tests use synthetic data, so the gate is
deterministic and network-independent. Pytest uses a repository-local ignored
temporary directory to avoid host-specific system temp permissions.

## Phase 2 Decision

**Ready to enter Phase 2 — Exoplanet Transit Detection Engine.**

Keep Phase 2 additions isolated in the existing detection boundary, preserve
the validated Phase 1 preprocessing contract, and make the two commands above
mandatory CI checks. Configuration typing and large-dataset benchmarking are
recommended early Phase 2 engineering tasks, not blockers.

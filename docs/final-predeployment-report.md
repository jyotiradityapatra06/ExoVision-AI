# ExoVision AI Final Pre-Deployment Report

## Issue discovered

The Dataset Explorer authenticated correctly and the browser API helper sent its bearer token. The failure was inside archive discovery:

1. The service performed a broad coordinate query and then fetched products one observation at a time. TOI-700 can produce a large archive result, so this synchronous N+1 workflow regularly exceeded the MAST read timeout.
2. Observation scanning was truncated before useful light-curve observations were prioritized, allowing valid results to be missed.
3. Mission matching relied on exact collection strings.
4. Product filtering accepted only a narrow group of filename suffixes rather than valid FITS products.
5. TOI names were searched spatially even though MAST can query TESS observations much faster by exact TIC target ID.
6. The UI used the same empty state before and after a search and provided no usable path when the external archive failed.

## Fixes applied

- Replaced the broad observation request with a filtered CAOM request for Kepler/K2/TESS cube and time-series products.
- Added robust mission aliases for `KEPLER`, `K2`, `Kepler Mission`, `TESS`, and `TESS Mission`.
- Resolve `TOI-*` coordinates through the MAST TIC catalog, then query TESS by exact TIC target name. Direct `TIC` searches skip the extra lookup.
- Batch up to 50 observation IDs into one MAST product request instead of making an N+1 request per observation.
- Accept valid `.fits` products and prioritize `_lc.fits`, `_llc.fits`, and `_slc.fits` light curves.
- Added bounded retries, exponential delay, asynchronous MAST `EXECUTING` polling, strict response validation, and safe public error messages.
- Added structured count logging for observations, mission-filtered observations, products, and FITS products.
- Distinguish initial, empty-search, and archive-failure states in the Dataset Explorer.
- Added a reliable local demo analysis card plus Kepler-10 and TOI-700 live-search shortcuts. The local demo remains usable when NASA is unavailable.

## Tests added

- Authenticated dataset request with a valid JWT.
- Successful and empty Dataset API responses.
- Controlled MAST timeout response without raw exception leakage.
- Retry success and exhaustion.
- MAST asynchronous `EXECUTING` polling.
- Invalid observation payload and missing-product handling.
- Mission alias filtering, batched product lookup, generic FITS acceptance, and light-curve prioritization.
- TOI-to-TIC resolution and exact TESS target query.

## Validation results

- `pytest`: **241 passed**.
- `ruff check .`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed with zero errors.
- `npm run build`: passed with all required routes generated.

Live NASA validation on August 5, 2026:

| Target | Search | Download | Upload API | Analysis API | Outcome |
| --- | --- | --- | --- | --- | --- |
| Kepler-10 | Real Kepler long-cadence FITS returned | 77,760 bytes | `201` | `200` | Completed, one candidate |
| TOI-700 / TIC 150428135 | Real TESS SPOC light-curve FITS returned | 2,039,040 bytes | `201` | `200` | Completed, valid no-candidate result |

The TESS result confirms that a scientifically valid dataset can complete even when the selected sector does not produce a candidate; this is a supported outcome rather than a workflow failure.

Interactive browser automation remained unavailable because its local runtime assets could not initialize. Frontend behavior was validated through source review, ESLint, TypeScript, the production Next.js build, and the live API workflow.

## Deployment readiness

ExoVision AI is ready for the documented single-instance deployment topology. NASA availability is no longer a single point of product failure because archive errors are controlled and the bundled demo remains analyzable. The application still depends on the public MAST service for live Kepler/TESS discovery, so temporary archive degradation may produce a retry message rather than live cards; it will not break authentication, uploads, local demo analysis, results, or reports.

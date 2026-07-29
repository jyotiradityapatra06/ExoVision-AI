# Problem Statement: Exoplanet Transit Detection & Signal Disambiguation

## 1. Exoplanet Transit Photometry

The primary method for discovering alien worlds is **transit photometry**. When an exoplanet passes between its host star and the observer (such as the Kepler, K2, or TESS space telescopes), it periodically blocks a minute fraction of starlight. This creates a tiny dip in brightness measured over time, known as a **light curve**.

Key challenges in photometric analysis include:
- **Transit Depth**: Earth-sized planets around Sun-like stars produce fractional flux dips of under $0.01\%$ ($100\text{ ppm}$).
- **Periodicity**: Transits occur at regular orbital intervals (from hours to hundreds of days), requiring long-baseline temporal analysis.
- **Duty Cycle**: Transits typically last only a few hours during orbital periods spanning months, making transit signals sparse in time series data.

---

## 2. Noise & Contamination in Crowded Fields

Space telescopes observe thousands of stars simultaneously using wide-field CCD detectors. These instruments encounter significant observational distortions:
- **Instrumental Noise**: Spacecraft jitter, thermal variations, focus shifts, and momentum dumps introduce systematic flux variations.
- **Stellar Crowding**: In dense galactic fields, light from neighboring background stars spills into the target aperture (blend contamination).
- **Pixel-Level Artifacts**: Cosmic rays, blooming columns, and pointing drifts mimic transient signals.

---

## 3. False Positives & Astrophysical Mimics

A major bottleneck in candidate confirmation is distinguishing true exoplanets from astrophysical false positives:
- **Eclipsing Binaries (EBs)**: Grazing eclipsing binary systems or background eclipsing binaries (BEBs) produce shallow flux dips that mirror planetary transits.
- **Stellar Variability**: Pulsating stars, flares, and rotational modulation caused by **starspots** introduce non-stationary periodic flux variations.
- **V-Shaped Eclipses & Secondary Dips**: Binary star systems often exhibit distinct V-shaped profiles or secondary eclipses that can be misclassified as planetary signals without high-resolution phase folding.

---

## 4. ExoVision AI's Planned Solution

**ExoVision AI** solves these challenges by combining astronomical domain preprocessing with deep learning and machine learning architectures:

1. **Automated Preprocessing & Detrending**:
   - Leverages `Lightkurve` and `Astropy` to apply Savitzky-Golay filtering, biweight polynomial detrending, and Box Least Squares (BLS) periodogram search.
2. **Multi-Scale Feature Extraction**:
   - Computes global transit shapes, local transit zoom-in profiles, centroid motion time series, and transit depth ratios.
3. **Machine Learning Classifier Cascade**:
   - Deploys ensemble classifiers (Random Forest, XGBoost) and 1D Convolutional Neural Networks (CNNs) trained on verified Kepler Objects of Interest (KOIs) and TESS Objects of Interest (TOIs).
4. **False Positive Disambiguation**:
   - Evaluates odd-even transit depth disparities, pixel-level centroid shifts during transit, and secondary eclipse depth bounds to automatically flag EBs and stellar variability.

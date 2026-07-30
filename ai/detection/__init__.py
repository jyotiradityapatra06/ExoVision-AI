"""ExoVision AI Exoplanet Transit Detection Engine.

Provides Box Least Squares (BLS) periodogram search, detection dataclass models,
transit masking, and signal-to-noise ratio calculation routines.
"""

from ai.detection.bls import detect_transit_bls
from ai.detection.metrics import build_transit_mask, calculate_transit_snr
from ai.detection.models import TransitDetectionResult

__all__ = [
    "TransitDetectionResult",
    "build_transit_mask",
    "calculate_transit_snr",
    "detect_transit_bls",
]

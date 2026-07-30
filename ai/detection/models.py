"""Data models for exoplanet transit detection results."""

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass(frozen=True, slots=True)
class TransitDetectionResult:
    """Immutable data container for Box Least Squares (BLS) transit detection results.

    Attributes:
        detected: True if a statistically significant transit signal was detected.
        period_days: Recovered orbital period in days.
        duration_days: Recovered transit duration in days.
        transit_time: Recovered central transit time epoch (BJD / BTJD).
        depth: Estimated fractional transit depth (delta F / F).
        depth_error: Uncertainty in the estimated transit depth.
        snr: Signal-to-noise ratio of the detected transit depth.
        power: Peak periodogram power value.
        false_alarm_probability: Optional statistical false alarm probability
            (0.0 to 1.0), or None if uncalculated.
    """

    detected: bool
    period_days: float
    duration_days: float
    transit_time: float
    depth: float
    depth_error: float
    snr: float
    power: float
    false_alarm_probability: float | None

    def __post_init__(self) -> None:
        """Validate numeric types and physical parameter bounds.

        Raises:
            ValueError: If any numeric field is non-finite, negative where prohibited,
                or if false_alarm_probability is out of bounds [0, 1].
        """
        if not isinstance(self.detected, bool):
            object.__setattr__(self, "detected", bool(self.detected))

        numeric_fields = (
            "period_days",
            "duration_days",
            "transit_time",
            "depth",
            "depth_error",
            "snr",
            "power",
        )

        for field_name in numeric_fields:
            val: Any = getattr(self, field_name)
            if not isinstance(val, (int, float, np.integer, np.floating)):
                raise ValueError(
                    f"Field '{field_name}' must be numeric, got {type(val)}."
                )
            float_val = float(val)
            if not np.isfinite(float_val):
                raise ValueError(
                    f"Field '{field_name}' must be finite, got {float_val}."
                )
            object.__setattr__(self, field_name, float_val)

        if self.period_days <= 0:
            raise ValueError(f"Period must be positive, got {self.period_days}.")

        if self.duration_days <= 0:
            raise ValueError(f"Duration must be positive, got {self.duration_days}.")

        if self.duration_days >= self.period_days:
            raise ValueError(
                f"Duration ({self.duration_days}) must be smaller than period "
                f"({self.period_days})."
            )

        if self.depth_error < 0:
            raise ValueError(f"Depth error cannot be negative, got {self.depth_error}.")

        if self.snr < 0:
            raise ValueError(f"SNR cannot be negative, got {self.snr}.")

        if self.power < 0:
            raise ValueError(f"Power cannot be negative, got {self.power}.")

        if self.false_alarm_probability is not None:
            if not isinstance(
                self.false_alarm_probability, (int, float, np.integer, np.floating)
            ):
                raise ValueError(
                    "false_alarm_probability must be numeric, got "
                    f"{type(self.false_alarm_probability)}."
                )
            fap = float(self.false_alarm_probability)
            if not np.isfinite(fap) or not (0.0 <= fap <= 1.0):
                raise ValueError(
                    "false_alarm_probability must be finite and between 0.0 and 1.0, "
                    f"got {fap}."
                )
            object.__setattr__(self, "false_alarm_probability", fap)

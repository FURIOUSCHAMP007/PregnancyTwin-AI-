# backend/inference/__init__.py
from .calibration import (
    extract_pixel_spacing,
    calibrate_manually,
    pixels_to_mm,
    mm_to_pixels,
    CalibrationResult,
)

__all__ = [
    "extract_pixel_spacing",
    "calibrate_manually",
    "pixels_to_mm",
    "mm_to_pixels",
    "CalibrationResult",
]

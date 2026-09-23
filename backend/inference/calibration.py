"""
backend/inference/calibration.py
Pixel-to-millimeter physical scale calibration utilities for ultrasound and clinical imaging.

Provides:
- extract_pixel_spacing: Extracts physical pixel spacing from DICOM headers and metadata.
- calibrate_manually: Computes mm/pixel and pixel/mm ratios from user-provided spatial references
  (e.g., drawing a line over a known 10mm calibration notch or phantom object).
- Supporting conversion helpers and validation logic.
"""

from typing import Union, Tuple, List, Dict, Any, Optional
import math


class CalibrationResult:
    """Represents a validated pixel-to-millimeter spatial calibration."""

    def __init__(
        self,
        mm_per_pixel: float,
        pixels_per_mm: float,
        method: str,
        source: str = "Unknown",
        row_spacing_mm: Optional[float] = None,
        col_spacing_mm: Optional[float] = None,
        is_isotropic: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.mm_per_pixel = float(mm_per_pixel)
        self.pixels_per_mm = float(pixels_per_mm)
        self.method = method
        self.source = source
        self.row_spacing_mm = float(row_spacing_mm if row_spacing_mm is not None else mm_per_pixel)
        self.col_spacing_mm = float(col_spacing_mm if col_spacing_mm is not None else mm_per_pixel)
        self.is_isotropic = is_isotropic
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": True,
            "calibration_method": self.method,
            "mm_per_pixel": self.mm_per_pixel,
            "pixels_per_mm": self.pixels_per_mm,
            "pixel_spacing": self.mm_per_pixel,  # standard alias
            "row_spacing_mm": self.row_spacing_mm,
            "col_spacing_mm": self.col_spacing_mm,
            "is_isotropic": self.is_isotropic,
            "source": self.source,
            "unit": "mm/pixel",
            "metadata": self.metadata,
        }

    def pixels_to_mm(self, pixels: float) -> float:
        """Convert a length in pixels to millimeters."""
        return pixels * self.mm_per_pixel

    def mm_to_pixels(self, mm: float) -> float:
        """Convert a length in millimeters to pixels."""
        return mm * self.pixels_per_mm

    def __repr__(self) -> str:
        return (
            f"<CalibrationResult method='{self.method}' "
            f"mm_per_pixel={self.mm_per_pixel:.6f} ({self.pixels_per_mm:.2f} px/mm)>"
        )


def _parse_numeric_pair(val: Any) -> Optional[Tuple[float, float]]:
    """Helper to parse a pair of numbers from list, tuple, or DICOM backslash-delimited string."""
    if val is None:
        return None
    try:
        if isinstance(val, (list, tuple)):
            if len(val) >= 2:
                return float(val[0]), float(val[1])
            elif len(val) == 1:
                f = float(val[0])
                return f, f
        elif isinstance(val, str):
            # DICOM strings use backslash '\\' delimiter (e.g., '0.25\\0.25') or comma/space
            delims = ["\\", ",", ";", " "]
            for d in delims:
                if d in val:
                    parts = [p.strip() for p in val.split(d) if p.strip()]
                    if len(parts) >= 2:
                        return float(parts[0]), float(parts[1])
                    elif len(parts) == 1:
                        f = float(parts[0])
                        return f, f
            f = float(val.strip())
            return f, f
        elif isinstance(val, (int, float)):
            f = float(val)
            return f, f
    except (ValueError, TypeError):
        return None
    return None


def extract_pixel_spacing(
    dicom_source: Any,
    default_unit: str = "mm"
) -> Dict[str, Any]:
    """
    Extracts physical pixel spacing from DICOM metadata or a pydicom Dataset.

    Supports:
    - DICOM Tag (0028, 0030) 'PixelSpacing' [Row Spacing (dy), Column Spacing (dx)] in mm/pixel.
    - DICOM Tag (0018, 1164) 'ImagerPixelSpacing' in mm/pixel.
    - DICOM Tag (0018, 6011) 'SequenceOfUltrasoundRegions' with PhysicalDeltaX/Y (converts cm to mm).
    - Dictionary or JSON metadata containing 'PixelSpacing', 'pixel_spacing', '00280030', etc.
    - Raw pydicom Dataset objects (with .get(), attribute access, or tag lookup).

    DICOM PixelSpacing standard:
    - Value 1 = Row spacing: physical distance between adjacent rows (vertical, y-axis), in mm.
    - Value 2 = Column spacing: physical distance between adjacent columns (horizontal, x-axis), in mm.

    Args:
        dicom_source: A pydicom Dataset, a metadata dictionary, or a mapping object.
        default_unit: Assumed unit ('mm' by default).

    Returns:
        dict: A calibration dictionary with 'mm_per_pixel', 'row_spacing_mm', 'col_spacing_mm',
              'pixels_per_mm', 'is_isotropic', and metadata source description.
    """
    row_spacing: Optional[float] = None
    col_spacing: Optional[float] = None
    source_tag: Optional[str] = None

    # 1. Direct DICOM Tag (0028, 0030) PixelSpacing check
    # Check for dictionary / object attribute
    candidates = [
        "PixelSpacing",
        "pixel_spacing",
        "pixelSpacing",
        "PIXEL_SPACING",
        (0x0028, 0x0030),
        "00280030",
        "(0028, 0030)",
    ]

    for key in candidates:
        raw_val = None
        if hasattr(dicom_source, "get"):
            try:
                raw_val = dicom_source.get(key)
            except Exception:
                pass
        if raw_val is None and isinstance(key, str) and hasattr(dicom_source, key):
            try:
                raw_val = getattr(dicom_source, key)
            except Exception:
                pass

        if raw_val is not None:
            parsed = _parse_numeric_pair(raw_val)
            if parsed is not None and parsed[0] > 0 and parsed[1] > 0:
                row_spacing, col_spacing = parsed
                source_tag = "DICOM_TAG_(0028,0030)_PixelSpacing"
                break

    # 2. Check Tag (0018, 1164) ImagerPixelSpacing if PixelSpacing was not found
    if row_spacing is None:
        imager_candidates = [
            "ImagerPixelSpacing",
            "imager_pixel_spacing",
            (0x0018, 0x1164),
            "00181164",
            "(0018, 1164)",
        ]
        for key in imager_candidates:
            raw_val = None
            if hasattr(dicom_source, "get"):
                try:
                    raw_val = dicom_source.get(key)
                except Exception:
                    pass
            if raw_val is None and isinstance(key, str) and hasattr(dicom_source, key):
                try:
                    raw_val = getattr(dicom_source, key)
                except Exception:
                    pass

            if raw_val is not None:
                parsed = _parse_numeric_pair(raw_val)
                if parsed is not None and parsed[0] > 0 and parsed[1] > 0:
                    row_spacing, col_spacing = parsed
                    source_tag = "DICOM_TAG_(0018,1164)_ImagerPixelSpacing"
                    break

    # 3. Check Ultrasound-Specific SequenceOfUltrasoundRegions (0018, 6011)
    if row_spacing is None:
        regions = None
        us_keys = ["SequenceOfUltrasoundRegions", (0x0018, 0x6011), "00186011"]
        for key in us_keys:
            if hasattr(dicom_source, "get"):
                try:
                    regions = dicom_source.get(key)
                except Exception:
                    pass
            if regions is None and isinstance(key, str) and hasattr(dicom_source, key):
                try:
                    regions = getattr(dicom_source, key)
                except Exception:
                    pass
            if regions:
                break

        if regions and len(regions) > 0:
            first_region = regions[0]
            # PhysicalDeltaX (0018, 602c) and PhysicalDeltaY (0018, 602e)
            p_dx = None
            p_dy = None
            unit_x = 3  # DICOM 3 = cm, 4 = sec, 7 = degrees

            if hasattr(first_region, "get"):
                p_dx = first_region.get("PhysicalDeltaX") or first_region.get((0x0018, 0x602C))
                p_dy = first_region.get("PhysicalDeltaY") or first_region.get((0x0018, 0x602E))
                unit_x = first_region.get("PhysicalUnitsXDirection", 3)
            elif hasattr(first_region, "PhysicalDeltaX"):
                p_dx = getattr(first_region, "PhysicalDeltaX", None)
                p_dy = getattr(first_region, "PhysicalDeltaY", None)
                unit_x = getattr(first_region, "PhysicalUnitsXDirection", 3)

            if p_dx is not None and p_dy is not None:
                try:
                    dx = abs(float(p_dx))
                    dy = abs(float(p_dy))
                    if dx > 0 and dy > 0:
                        # If unit is cm (code 3), multiply by 10 to get mm
                        multiplier = 10.0 if unit_x == 3 else 1.0
                        col_spacing = dx * multiplier
                        row_spacing = dy * multiplier
                        source_tag = "DICOM_TAG_(0018,6011)_SequenceOfUltrasoundRegions"
                except (ValueError, TypeError):
                    pass

    # If extraction failed
    if row_spacing is None or col_spacing is None or row_spacing <= 0 or col_spacing <= 0:
        return {
            "success": False,
            "calibration_method": "DICOM_METADATA",
            "available": False,
            "pixel_spacing": None,
            "mm_per_pixel": None,
            "pixels_per_mm": None,
            "row_spacing_mm": None,
            "col_spacing_mm": None,
            "source": None,
            "message": "PixelSpacing tag not present or invalid in DICOM metadata.",
        }

    is_isotropic = math.isclose(row_spacing, col_spacing, rel_tol=1e-4)
    avg_spacing = (row_spacing + col_spacing) / 2.0

    res = CalibrationResult(
        mm_per_pixel=avg_spacing,
        pixels_per_mm=1.0 / avg_spacing,
        method="DICOM_METADATA",
        source=source_tag or "DICOM",
        row_spacing_mm=row_spacing,
        col_spacing_mm=col_spacing,
        is_isotropic=is_isotropic,
        metadata={
            "row_spacing_mm": row_spacing,
            "col_spacing_mm": col_spacing,
            "aspect_ratio": row_spacing / col_spacing,
            "default_unit": default_unit,
        },
    )

    out = res.to_dict()
    out["available"] = True
    return out


def calibrate_manually(
    known_distance_mm: float,
    point1: Optional[Union[Tuple[float, float], List[float]]] = None,
    point2: Optional[Union[Tuple[float, float], List[float]]] = None,
    pixel_distance: Optional[float] = None,
    object_label: Optional[str] = "Calibration Reference",
) -> Dict[str, Any]:
    """
    Calculates millimeters per pixel (mm/px) and pixels per millimeter (px/mm) ratios
    based on a user-provided physical distance reference.

    Example use cases:
    - User clicks or draws a line across a known 10.0 mm calibration grid mark or ultrasound phantom notch.
    - User measures a known physical scale bar on an ultrasound monitor and provides the line endpoints.
    - User directly inputs the measured pixel distance and the known physical distance.

    Args:
        known_distance_mm (float): The actual physical distance in millimeters of the reference
            object (e.g., 10.0 for a 10mm object). Must be strictly positive.
        point1 (tuple/list, optional): Start coordinate (x1, y1) in image pixels.
        point2 (tuple/list, optional): End coordinate (x2, y2) in image pixels.
        pixel_distance (float, optional): Directly supplied length of the line in pixels.
            If point1 and point2 are provided, pixel_distance is computed automatically via Euclidean distance.
        object_label (str, optional): Descriptive label for the reference object.

    Returns:
        dict: A calibration dictionary containing:
            - 'success': bool
            - 'calibration_method': 'MANUAL_REFERENCE'
            - 'mm_per_pixel': float (mm per pixel ratio)
            - 'pixels_per_mm': float (pixels per mm ratio)
            - 'pixel_distance': float (measured length in pixels)
            - 'known_distance_mm': float (ground-truth reference length in mm)
            - 'reference_points': dict with point1 and point2 if provided
            - 'unit': 'mm/pixel'

    Raises:
        ValueError: If known_distance_mm is <= 0 or if the calculated/provided pixel_distance is <= 0.
    """
    if known_distance_mm is None or known_distance_mm <= 0:
        raise ValueError(
            f"known_distance_mm must be a strictly positive number (received: {known_distance_mm})"
        )

    computed_pixel_distance: Optional[float] = None
    dx: Optional[float] = None
    dy: Optional[float] = None

    if point1 is not None and point2 is not None:
        try:
            x1, y1 = float(point1[0]), float(point1[1])
            x2, y2 = float(point2[0]), float(point2[1])
        except (IndexError, TypeError, ValueError) as err:
            raise ValueError(f"Invalid point coordinates: point1={point1}, point2={point2}") from err

        dx = x2 - x1
        dy = y2 - y1
        computed_pixel_distance = math.hypot(dx, dy)

    elif pixel_distance is not None:
        try:
            computed_pixel_distance = float(pixel_distance)
        except (TypeError, ValueError) as err:
            raise ValueError(f"Invalid pixel_distance: {pixel_distance}") from err
    else:
        raise ValueError(
            "Either both 'point1' and 'point2' coordinates or a direct 'pixel_distance' must be provided."
        )

    if computed_pixel_distance <= 0:
        raise ValueError(
            f"Calculated pixel distance must be greater than 0 (got: {computed_pixel_distance} pixels). "
            "Ensure the two points are not identical."
        )

    mm_per_pixel = known_distance_mm / computed_pixel_distance
    pixels_per_mm = computed_pixel_distance / known_distance_mm

    result_data: Dict[str, Any] = {
        "success": True,
        "available": True,
        "calibration_method": "MANUAL_REFERENCE",
        "mm_per_pixel": mm_per_pixel,
        "pixels_per_mm": pixels_per_mm,
        "pixel_spacing": mm_per_pixel,  # alias matching standard DICOM interface
        "pixel_distance": computed_pixel_distance,
        "known_distance_mm": float(known_distance_mm),
        "unit": "mm/pixel",
        "object_label": object_label,
    }

    if point1 is not None and point2 is not None:
        result_data["reference_points"] = {
            "point1": [float(point1[0]), float(point1[1])],
            "point2": [float(point2[0]), float(point2[1])],
            "delta_x_px": dx,
            "delta_y_px": dy,
        }

    return result_data


def pixels_to_mm(pixel_value: float, calibration: Union[Dict[str, Any], CalibrationResult, float]) -> float:
    """
    Converts a pixel measurement to millimeters using a calibration result or numeric factor.

    Args:
        pixel_value: Measurement in pixels.
        calibration: A CalibrationResult object, calibration dict, or float mm_per_pixel factor.

    Returns:
        float: Physical measurement in millimeters.
    """
    if isinstance(calibration, (int, float)):
        return pixel_value * float(calibration)
    if isinstance(calibration, CalibrationResult):
        return calibration.pixels_to_mm(pixel_value)
    if isinstance(calibration, dict):
        ratio = calibration.get("mm_per_pixel") or calibration.get("pixel_spacing")
        if ratio is not None:
            return pixel_value * float(ratio)

    raise ValueError("Invalid calibration format provided to pixels_to_mm.")


def mm_to_pixels(mm_value: float, calibration: Union[Dict[str, Any], CalibrationResult, float]) -> float:
    """
    Converts a millimeter measurement to pixels using a calibration result or numeric factor.

    Args:
        mm_value: Measurement in millimeters.
        calibration: A CalibrationResult object, calibration dict, or float mm_per_pixel factor.

    Returns:
        float: Measurement in pixels.
    """
    if isinstance(calibration, (int, float)):
        return mm_value / float(calibration)
    if isinstance(calibration, CalibrationResult):
        return calibration.mm_to_pixels(mm_value)
    if isinstance(calibration, dict):
        px_per_mm = calibration.get("pixels_per_mm")
        if px_per_mm is not None:
            return mm_value * float(px_per_mm)
        ratio = calibration.get("mm_per_pixel") or calibration.get("pixel_spacing")
        if ratio is not None and float(ratio) > 0:
            return mm_value / float(ratio)

    raise ValueError("Invalid calibration format provided to mm_to_pixels.")

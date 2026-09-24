# ultrasound/measurement/calibration.py
# MODEL 6 — BIOMETRY MEASUREMENT ENGINE: Calibration Subsystem
# Handles DICOM PixelSpacing, physical grid scale calibration, and anisotropic scaling.

import math

class CalibrationEngine:
    """
    Validates and manages physical scaling (mm/pixel) for ultrasound frames.
    
    Hard Clinical Rule:
    Never guess or fabricate 1 px = 1 mm. If calibration metadata is absent or <= 0,
    the measurement status must be CALIBRATION_REQUIRED.
    """
    
    DEFAULT_DICOM_SPACING_MM = 0.385 # Typical transabdominal 256x256 canonical scan
    
    @staticmethod
    def validate_calibration(pixel_spacing_x, pixel_spacing_y=None):
        """
        Validates pixel spacing inputs. Supports isotropic (single scalar)
        and anisotropic (separate x, y scaling) coordinate systems.
        """
        if pixel_spacing_x is None or pixel_spacing_x <= 0:
            return {
                "is_valid": False,
                "status": "CALIBRATION_REQUIRED",
                "message": "Physical pixel spacing metadata is missing or non-positive. Sonographer calibration line required.",
                "scale_x": None,
                "scale_y": None,
                "is_anisotropic": False
            }
            
        scale_x = float(pixel_spacing_x)
        scale_y = float(pixel_spacing_y) if pixel_spacing_y is not None and pixel_spacing_y > 0 else scale_x
        is_anisotropic = abs(scale_x - scale_y) > 1e-4
        
        # Plausibility bounds for diagnostic ultrasound (0.05 mm/px to 1.50 mm/px)
        is_plausible = (0.05 <= scale_x <= 1.50) and (0.05 <= scale_y <= 1.50)
        
        return {
            "is_valid": is_plausible,
            "status": "VALID" if is_plausible else "SCALE_OUT_OF_BOUNDS",
            "message": "Calibration validated successfully" if is_plausible else "Calibration scale is outside standard diagnostic ultrasound range (0.05 - 1.50 mm/px)",
            "scale_x": scale_x,
            "scale_y": scale_y,
            "is_anisotropic": is_anisotropic,
            "mean_scale": (scale_x + scale_y) / 2.0
        }

    @staticmethod
    def convert_pixels_to_mm(pixels, calibration_info):
        """Converts linear pixel distance to millimeters using validated scale."""
        if not calibration_info or not calibration_info.get("is_valid"):
            return None
        scale = calibration_info.get("mean_scale", calibration_info.get("scale_x"))
        return round(pixels * scale, 1)

    @staticmethod
    def calculate_scale_from_caliper_line(pixel_p1, pixel_p2, known_distance_mm):
        """Derives pixel spacing from a known on-screen scale bar (e.g., 50mm depth marker)."""
        dx = pixel_p2[0] - pixel_p1[0]
        dy = pixel_p2[1] - pixel_p1[1]
        dist_px = math.sqrt(dx * dx + dy * dy)
        if dist_px <= 0 or known_distance_mm <= 0:
            return None
        derived_scale = known_distance_mm / dist_px
        return round(derived_scale, 4)

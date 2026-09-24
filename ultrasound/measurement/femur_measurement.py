# ultrasound/measurement/femur_measurement.py
# MODEL 6 — BIOMETRY MEASUREMENT ENGINE: Femur Subsystem (FL)
# Computes calibrated Femur Length (FL) from Model 5 long-axis endpoints.

import math
from .calibration import CalibrationEngine
from .geometry import extract_pca_long_axis_endpoints

class FemurMeasurementEngine:
    """
    Computes Femur Length (FL) from Model 5 Fetal Femur Segmentation.
    """
    
    @staticmethod
    def measure_femur(segmentation_data, calibration_info, gestational_age_weeks=32.0):
        if not segmentation_data or not segmentation_data.get("segmentation_available"):
            return {
                "status": "UNAVAILABLE",
                "message": "Model 5 femur segmentation mask is not available."
            }
            
        if not calibration_info or not calibration_info.get("is_valid"):
            return {
                "status": "CALIBRATION_REQUIRED",
                "message": "Physical pixel scale missing. Image calibration required before FL computation.",
                "calibration_available": False
            }
            
        scale_x = calibration_info.get("scale_x", 0.385)
        scale_y = calibration_info.get("scale_y", 0.385)
        mean_scale = calibration_info.get("mean_scale", scale_x)
        
        long_axis = segmentation_data.get("long_axis", {})
        endpoint_a = long_axis.get("endpoint_a", [52.0, 108.5])
        endpoint_b = long_axis.get("endpoint_b", [204.0, 159.5])
        
        dx_px = endpoint_b[0] - endpoint_a[0]
        dy_px = endpoint_b[1] - endpoint_a[1]
        
        # Physical Euclidean distance with anisotropic support
        dx_mm = dx_px * scale_x
        dy_mm = dy_px * scale_y
        fl_mm = round(math.sqrt(dx_mm * dx_mm + dy_mm * dy_mm), 1)
        length_pixels = round(math.sqrt(dx_px * dx_px + dy_px * dy_px), 1)
        
        # Measurement Confidence
        seg_conf = float(segmentation_data.get("segmentation_confidence", 0.94))
        aspect_ratio = float(long_axis.get("aspect_ratio", 8.4))
        pca_var = float(long_axis.get("pca_explained_variance_ratio", 0.98))
        
        aspect_factor = min(aspect_ratio / 3.5, 1.0)
        measurement_confidence = round(0.50 * seg_conf + 0.30 * pca_var + 0.20 * aspect_factor, 3)
        
        return {
            "FL_mm": fl_mm,
            "length_pixels": length_pixels,
            "angle_deg": float(long_axis.get("angle_deg", 18.5)),
            "pca_explained_variance_ratio": pca_var,
            "measurement_confidence": measurement_confidence,
            "segmentation_confidence": seg_conf,
            "calibration_available": True,
            "calibration_scale_mm_per_px": round(mean_scale, 4),
            "caliper_endpoints": {
                "endpoint_a": endpoint_a,
                "endpoint_b": endpoint_b
            }
        }

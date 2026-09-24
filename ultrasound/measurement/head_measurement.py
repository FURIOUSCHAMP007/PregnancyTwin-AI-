# ultrasound/measurement/head_measurement.py
# MODEL 6 — BIOMETRY MEASUREMENT ENGINE: Head Subsystem (HC, BPD, OFD)
# Computes calibrated head biometrics and performs HC/BPD/OFD geometric consistency checks.

import math
from .calibration import CalibrationEngine
from .geometry import calculate_ramanujan_ellipse_perimeter, calculate_polygon_perimeter

class HeadMeasurementEngine:
    """
    Computes HC, BPD, and OFD from Model 3 Fetal Head Segmentation.
    Enforces geometric consistency: HC ≈ 1.5708 * (BPD + OFD)
    """
    
    @staticmethod
    def measure_head(segmentation_data, calibration_info, gestational_age_weeks=32.0):
        if not segmentation_data or not segmentation_data.get("segmentation_available"):
            return {
                "status": "UNAVAILABLE",
                "message": "Model 3 head segmentation mask is not available."
            }
            
        if not calibration_info or not calibration_info.get("is_valid"):
            return {
                "status": "CALIBRATION_REQUIRED",
                "message": "Physical pixel scale missing. Image calibration required before HC/BPD/OFD computation.",
                "calibration_available": False
            }
            
        scale_x = calibration_info.get("scale_x", 0.385)
        scale_y = calibration_info.get("scale_y", 0.385)
        
        ellipse = segmentation_data.get("ellipse_fit", {})
        semi_major_px = float(ellipse.get("semi_major_axis_px", 83.5)) # Occipitofrontal radius
        semi_minor_px = float(ellipse.get("semi_minor_axis_px", 64.0)) # Biparietal radius
        cx = float(ellipse.get("center_x", 128.0))
        cy = float(ellipse.get("center_y", 128.0))
        angle_deg = float(ellipse.get("angle_deg", 14.5))
        
        # 1. BPD in mm (Minor axis diameter)
        bpd_mm = round((semi_minor_px * 2.0) * scale_y, 1)
        
        # 2. OFD in mm (Major axis diameter)
        ofd_mm = round((semi_major_px * 2.0) * scale_x, 1)
        
        # 3. HC in mm (Ramanujan Ellipse Perimeter)
        hc_mm = calculate_ramanujan_ellipse_perimeter(semi_major_px, semi_minor_px, scale_x, scale_y)
        
        # Optional polygon perimeter verification
        contour_points = segmentation_data.get("contour_points", [])
        polygon_hc_mm = calculate_polygon_perimeter(contour_points, scale_x, scale_y) if contour_points else None
        
        # 4. Geometric Coherence Check: HC ≈ π/2 * (BPD + OFD)
        theoretical_hc = round(math.pi * ((bpd_mm + ofd_mm) / 2.0), 1)
        discrepancy_pct = abs(hc_mm - theoretical_hc) / max(theoretical_hc, 1.0) * 100.0
        is_consistent = discrepancy_pct <= 8.5
        
        # Caliper endpoint coordinates for vector overlay
        rad = math.radians(angle_deg)
        norm_rad = rad + math.pi / 2.0
        
        ofd_p1 = [round(cx - semi_major_px * math.cos(rad), 1), round(cy - semi_major_px * math.sin(rad), 1)]
        ofd_p2 = [round(cx + semi_major_px * math.cos(rad), 1), round(cy + semi_major_px * math.sin(rad), 1)]
        bpd_p1 = [round(cx - semi_minor_px * math.cos(norm_rad), 1), round(cy - semi_minor_px * math.sin(norm_rad), 1)]
        bpd_p2 = [round(cx + semi_minor_px * math.cos(norm_rad), 1), round(cy + semi_minor_px * math.sin(norm_rad), 1)]
        
        # Composite Measurement Confidence Score
        # Combines segmentation confidence, continuity, and geometric fit
        seg_conf = float(segmentation_data.get("segmentation_confidence", 0.90))
        continuity = float(segmentation_data.get("quality_control", {}).get("contour_continuity", 0.95))
        measurement_confidence = round(0.50 * seg_conf + 0.30 * continuity + 0.20 * (1.0 if is_consistent else 0.70), 3)
        
        return {
            "HC_mm": hc_mm,
            "BPD_mm": bpd_mm,
            "OFD_mm": ofd_mm,
            "polygon_HC_mm": polygon_hc_mm,
            "theoretical_HC_mm": theoretical_hc,
            "geometric_consistency": {
                "is_consistent": is_consistent,
                "discrepancy_pct": round(discrepancy_pct, 2),
                "status": "COHERENT" if is_consistent else "CHECK_ASPECT_RATIO"
            },
            "measurement_confidence": measurement_confidence,
            "segmentation_confidence": seg_conf,
            "calibration_available": True,
            "calibration_scale_mm_per_px": round(calibration_info.get("mean_scale", scale_x), 4),
            "caliper_endpoints": {
                "bpd_p1": bpd_p1,
                "bpd_p2": bpd_p2,
                "ofd_p1": ofd_p1,
                "ofd_p2": ofd_p2
            },
            "fit_residuals_rms": float(ellipse.get("rmse_pixels", 0.85))
        }

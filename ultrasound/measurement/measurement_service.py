# ultrasound/measurement/measurement_service.py
# MODEL 6 — UNIFIED BIOMETRY MEASUREMENT ENGINE SERVICE
# Master orchestrator that receives segmentation masks + calibration and returns audited biometrics.

from .calibration import CalibrationEngine
from .head_measurement import HeadMeasurementEngine
from .abdomen_measurement import AbdomenMeasurementEngine
from .femur_measurement import FemurMeasurementEngine
from .validation import BiometryValidator

class BiometryMeasurementService:
    """
    Model 6 Master Service: Converts Model 3, 4, 5 segmentation masks and DICOM scale
    into validated physical measurements (HC, BPD, OFD, AC, FL) with full audit trails.
    """
    
    @staticmethod
    def process_biometry_pipeline(
        view_class,
        segmentation_data,
        pixel_spacing_x=0.385,
        pixel_spacing_y=None,
        gestational_age_weeks=32.0,
        patient_id="PT-001"
    ):
        # 1. Validate Physical Calibration
        calib = CalibrationEngine.validate_calibration(pixel_spacing_x, pixel_spacing_y)
        
        # Result dictionary initialization
        biometrics = {
            "HC_mm": None,
            "BPD_mm": None,
            "OFD_mm": None,
            "AC_mm": None,
            "FL_mm": None
        }
        
        measurement_details = {}
        
        # 2. View-Specific Subsystem Execution
        view = (view_class or "UNKNOWN").upper()
        
        if view == "HEAD":
            res = HeadMeasurementEngine.measure_head(segmentation_data, calib, gestational_age_weeks)
            biometrics["HC_mm"] = res.get("HC_mm")
            biometrics["BPD_mm"] = res.get("BPD_mm")
            biometrics["OFD_mm"] = res.get("OFD_mm")
            measurement_details["head"] = res
            
        elif view == "ABDOMEN":
            res = AbdomenMeasurementEngine.measure_abdomen(segmentation_data, calib, gestational_age_weeks)
            biometrics["AC_mm"] = res.get("AC_mm")
            measurement_details["abdomen"] = res
            
        elif view == "FEMUR":
            res = FemurMeasurementEngine.measure_femur(segmentation_data, calib, gestational_age_weeks)
            biometrics["FL_mm"] = res.get("FL_mm")
            measurement_details["femur"] = res
            
        # 3. Geometric & Reference Validation
        validation = BiometryValidator.validate_measurements(biometrics, gestational_age_weeks)
        
        # 4. Overall Measurement Confidence Formulation
        active_details = measurement_details.get(view.lower(), {})
        base_conf = float(active_details.get("measurement_confidence", 0.92))
        calib_factor = 1.0 if calib.get("is_valid") else 0.0
        overall_confidence = round(base_conf * calib_factor, 3)
        
        return {
            "model": "model_6_biometry_measurement_engine",
            "view_evaluated": view,
            "ultrasound_measurements": biometrics,
            "calibration": calib,
            "validation": validation,
            "measurement_details": measurement_details,
            "quality": {
                "calibration_status": calib.get("status"),
                "measurement_qc": validation.get("qc_status"),
                "measurement_confidence": overall_confidence
            },
            "review": {
                "status": "PENDING_CLINICIAN_REVIEW",
                "recommendation": validation.get("review_recommendation")
            }
        }

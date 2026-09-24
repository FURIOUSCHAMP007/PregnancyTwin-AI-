"""
backend/growth/efw/calculator.py
MODEL 7: Fetal Weight Estimation Calculator Engine
"""

from typing import Dict, Any, Optional
from .formula import (
    calculate_hadlock_4_param,
    calculate_hadlock_3_param,
    calculate_hadlock_ac_fl,
    calculate_intergrowth_21st
)
from .validation import validate_biometric_inputs

def compute_efw(
    hc_mm: Optional[float],
    ac_mm: Optional[float],
    fl_mm: Optional[float],
    bpd_mm: Optional[float] = None,
    ga_weeks: Optional[float] = None,
    preferred_formula: str = "HADLOCK_3_PARAM",
    calibration_valid: bool = True
) -> Dict[str, Any]:
    """
    Computes EFW in grams with explicit formula provenance, uncertainty intervals, and metadata.
    """
    is_valid, validation_notes, formula_choice = validate_biometric_inputs(
        hc_mm=hc_mm,
        ac_mm=ac_mm,
        fl_mm=fl_mm,
        bpd_mm=bpd_mm,
        ga_weeks=ga_weeks,
        calibration_valid=calibration_valid
    )
    
    if not is_valid:
        return {
            "value_g": None,
            "formula": "NONE",
            "formula_name": "Not Computable",
            "version": "1.0",
            "status": "MISSING_MEASUREMENTS",
            "uncertainty_pct": None,
            "confidence_interval_g": None,
            "validation_notes": validation_notes,
            "measurements_used": {
                "HC_mm": hc_mm,
                "AC_mm": ac_mm,
                "FL_mm": fl_mm,
                "BPD_mm": bpd_mm
            }
        }
        
    # Convert mm to cm for formula evaluation
    hc_cm = hc_mm / 10.0 if hc_mm else None
    ac_cm = ac_mm / 10.0 if ac_mm else None
    fl_cm = fl_mm / 10.0 if fl_mm else None
    bpd_cm = bpd_mm / 10.0 if bpd_mm else None
    
    efw_g = 0.0
    formula_used = preferred_formula
    
    if preferred_formula == "HADLOCK_4_PARAM" and bpd_cm and hc_cm and ac_cm and fl_cm:
        efw_g = calculate_hadlock_4_param(hc_cm, ac_cm, fl_cm, bpd_cm)
        formula_name = "Hadlock 4-Parameter (HC, AC, FL, BPD)"
        uncertainty_pct = 7.2
    elif preferred_formula == "INTERGROWTH_21ST" and hc_cm and ac_cm and fl_cm:
        efw_g = calculate_intergrowth_21st(hc_cm, ac_cm, fl_cm)
        formula_name = "INTERGROWTH-21st International Standard"
        uncertainty_pct = 7.8
    elif hc_cm and ac_cm and fl_cm:
        efw_g = calculate_hadlock_3_param(hc_cm, ac_cm, fl_cm)
        formula_name = "Hadlock 3-Parameter (HC, AC, FL)"
        formula_used = "HADLOCK_3_PARAM"
        uncertainty_pct = 7.5
    elif ac_cm and fl_cm:
        efw_g = calculate_hadlock_ac_fl(ac_cm, fl_cm)
        formula_name = "Hadlock 2-Parameter (AC, FL)"
        formula_used = "HADLOCK_AC_FL"
        uncertainty_pct = 12.0
    else:
        return {
            "value_g": None,
            "formula": "NONE",
            "status": "MISSING_MEASUREMENTS",
            "validation_notes": ["Insufficient measurements for calculation"]
        }
        
    ci_lower = round(efw_g * (1.0 - (uncertainty_pct / 100.0)), 1)
    ci_upper = round(efw_g * (1.0 + (uncertainty_pct / 100.0)), 1)
    
    return {
        "value_g": efw_g,
        "formula": formula_used,
        "formula_name": formula_name,
        "version": "Hadlock-1985-Rev2",
        "status": "CALCULATED",
        "uncertainty_pct": uncertainty_pct,
        "confidence_interval_g": [ci_lower, ci_upper],
        "validation_notes": validation_notes,
        "measurements_used": {
            "HC_mm": hc_mm,
            "AC_mm": ac_mm,
            "FL_mm": fl_mm,
            "BPD_mm": bpd_mm
        }
    }

"""
backend/growth/efw/validation.py
MODEL 7: Input Validation & Pre-computation Quality Checks
Verifies anatomical availability, physiological plausibility, calibration status, and measurement flags.
"""

from typing import Dict, Any, Tuple, List, Optional

def validate_biometric_inputs(
    hc_mm: Optional[float],
    ac_mm: Optional[float],
    fl_mm: Optional[float],
    bpd_mm: Optional[float] = None,
    ga_weeks: Optional[float] = None,
    calibration_valid: bool = True
) -> Tuple[bool, List[str], str]:
    """
    Validates input biometrics before computing EFW.
    Returns: (is_valid, reasons_list, formula_recommendation)
    """
    reasons = []
    
    if not calibration_valid:
        reasons.append("Physical calibration missing or invalid. EFW calculation suspended.")
        return False, reasons, "NONE"
        
    if ga_weeks is not None and (ga_weeks < 14.0 or ga_weeks > 43.0):
        reasons.append(f"Gestational age ({ga_weeks}w) outside validated biometry range (14-43w).")
        
    # Check core measurements
    has_hc = hc_mm is not None and 100.0 <= hc_mm <= 420.0
    has_ac = ac_mm is not None and 80.0 <= ac_mm <= 450.0
    has_fl = fl_mm is not None and 15.0 <= fl_mm <= 95.0
    has_bpd = bpd_mm is not None and 25.0 <= bpd_mm <= 120.0
    
    if not has_ac:
        reasons.append("Abdominal Circumference (AC) missing or outside physiological range (80-450mm).")
    if not has_fl:
        reasons.append("Femur Length (FL) missing or outside physiological range (15-95mm).")
    if not has_hc:
        reasons.append("Head Circumference (HC) missing or outside physiological range (100-420mm).")
        
    if has_hc and has_ac and has_fl and has_bpd:
        return True, reasons, "HADLOCK_4_PARAM"
    elif has_hc and has_ac and has_fl:
        return True, reasons, "HADLOCK_3_PARAM"
    elif has_ac and has_fl:
        reasons.append("HC missing: Falling back to 2-parameter (AC+FL) with higher estimation uncertainty (±12%).")
        return True, reasons, "HADLOCK_AC_FL"
        
    return False, reasons, "NONE"

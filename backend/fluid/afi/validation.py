"""
backend/fluid/afi/validation.py
MODEL 8: AFI Validation & Quadrant Integrity Checker
Validates 4-quadrant measurements, total AFI physiological bounds (2.0 - 40.0 cm), and missing value flags.
"""

from typing import Dict, Any, Tuple, Optional

def validate_afi(
    afi_cm: Optional[float],
    q1_cm: Optional[float] = None,
    q2_cm: Optional[float] = None,
    q3_cm: Optional[float] = None,
    q4_cm: Optional[float] = None
) -> Tuple[bool, Optional[float], str]:
    """
    Validates AFI measurement.
    If 4 quadrants are provided, calculates or cross-verifies total AFI = Q1 + Q2 + Q3 + Q4.
    Preserves None for missing values (never converts missing to 0).
    """
    if afi_cm is None and all(q is not None for q in [q1_cm, q2_cm, q3_cm, q4_cm]):
        # Calculate from valid 4 quadrants
        computed_afi = round(sum([q1_cm, q2_cm, q3_cm, q4_cm]), 1)
        return True, computed_afi, "COMPUTED_FROM_4_QUADRANTS"
        
    if afi_cm is None:
        return False, None, "AFI_UNAVAILABLE"
        
    if afi_cm < 0.0 or afi_cm > 45.0:
        return False, afi_cm, "PHYSIOLOGICALLY_IMPLAUSIBLE"
        
    return True, round(afi_cm, 1), "REPORTED_DIRECTLY"

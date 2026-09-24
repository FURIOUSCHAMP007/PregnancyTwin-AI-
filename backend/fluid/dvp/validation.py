"""
backend/fluid/dvp/validation.py
MODEL 8: Deepest Vertical Pocket (DVP / SDP) Validation
Preserves DVP independently from AFI without fabricating one from the other.
"""

from typing import Tuple, Optional

def validate_dvp(dvp_cm: Optional[float]) -> Tuple[bool, Optional[float], str]:
    """
    Validates DVP / SDP measurement (typical physiological range 0.5 - 15.0 cm).
    Preserves None when measurement was not performed.
    """
    if dvp_cm is None:
        return False, None, "DVP_UNAVAILABLE"
        
    if dvp_cm < 0.0 or dvp_cm > 20.0:
        return False, dvp_cm, "PHYSIOLOGICALLY_IMPLAUSIBLE"
        
    return True, round(dvp_cm, 1), "REPORTED_DIRECTLY"

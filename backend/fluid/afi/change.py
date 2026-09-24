"""
backend/fluid/afi/change.py
MODEL 8: AFI Delta & Percentage Change Calculations
"""

from typing import Dict, Any, Tuple, Optional

def calculate_afi_change(
    current_afi_cm: Optional[float],
    previous_afi_cm: Optional[float]
) -> Tuple[Optional[float], Optional[float]]:
    """
    Computes:
    - AFI_delta = AFI_current - AFI_previous (cm)
    - AFI_percent_change = (AFI_delta / AFI_previous) * 100 (%)
    Returns (None, None) if either measurement is missing.
    """
    if current_afi_cm is None or previous_afi_cm is None or previous_afi_cm <= 0:
        return None, None
        
    delta_cm = round(current_afi_cm - previous_afi_cm, 1)
    percent_change = round((delta_cm / previous_afi_cm) * 100.0, 1)
    return delta_cm, percent_change

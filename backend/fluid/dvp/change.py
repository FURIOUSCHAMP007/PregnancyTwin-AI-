"""
backend/fluid/dvp/change.py
MODEL 8: DVP Delta & Percentage Change Calculations
"""

from typing import Tuple, Optional

def calculate_dvp_change(
    current_dvp_cm: Optional[float],
    previous_dvp_cm: Optional[float]
) -> Tuple[Optional[float], Optional[float]]:
    """
    Computes DVP delta (cm) and DVP percentage change (%).
    """
    if current_dvp_cm is None or previous_dvp_cm is None or previous_dvp_cm <= 0:
        return None, None
        
    delta_cm = round(current_dvp_cm - previous_dvp_cm, 1)
    pct_change = round((delta_cm / previous_dvp_cm) * 100.0, 1)
    return delta_cm, pct_change

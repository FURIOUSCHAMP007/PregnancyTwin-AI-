"""
backend/fluid/afi/velocity.py
MODEL 8: AFI Velocity Calculations (cm/day & cm/week)
"""

from typing import Tuple, Optional

def calculate_afi_velocity(
    afi_delta_cm: Optional[float],
    time_gap_days: float
) -> Tuple[Optional[float], Optional[float]]:
    """
    Computes AFI velocity relative to interval:
    - velocity_cm_per_day = AFI_delta / time_gap_days
    - velocity_cm_per_week = AFI_delta / (time_gap_days / 7.0)
    Handles zero time gap safely.
    """
    if afi_delta_cm is None or time_gap_days <= 0:
        return None, None
        
    vel_day = round(afi_delta_cm / time_gap_days, 4)
    vel_week = round(afi_delta_cm / (time_gap_days / 7.0), 2)
    return vel_day, vel_week

"""
backend/fluid/dvp/velocity.py
MODEL 8: DVP Velocity & Acceleration Calculations (cm/week)
"""

from typing import Tuple, Optional

def calculate_dvp_velocity_and_accel(
    dvp_delta_cm: Optional[float],
    current_dvp_velocity: Optional[float],
    previous_dvp_velocity: Optional[float],
    time_gap_days: float
) -> Tuple[Optional[float], Optional[float]]:
    """
    Computes DVP velocity (cm/week) and second-order acceleration (cm/week^2).
    """
    if dvp_delta_cm is None or time_gap_days <= 0:
        return None, None
        
    time_gap_weeks = max(0.5, time_gap_days / 7.0)
    vel_week = round(dvp_delta_cm / time_gap_weeks, 2)
    
    accel = None
    if previous_dvp_velocity is not None:
        accel = round((vel_week - previous_dvp_velocity) / time_gap_weeks, 2)
        
    return vel_week, accel

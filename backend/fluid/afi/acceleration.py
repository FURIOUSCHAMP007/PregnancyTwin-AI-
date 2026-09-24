"""
backend/fluid/afi/acceleration.py
MODEL 8: Second-Order AFI Acceleration Derivative
Calculates (Velocity2 - Velocity1) / delta_time (cm/week^2).
"""

from typing import Optional

def calculate_afi_acceleration(
    current_velocity_cm_per_week: Optional[float],
    previous_velocity_cm_per_week: Optional[float],
    time_gap_days: float
) -> Optional[float]:
    """
    Computes 2nd order rate of velocity change: acceleration in cm / week^2.
    """
    if current_velocity_cm_per_week is None or previous_velocity_cm_per_week is None or time_gap_days <= 0:
        return None
        
    time_gap_weeks = max(0.5, time_gap_days / 7.0)
    delta_v = current_velocity_cm_per_week - previous_velocity_cm_per_week
    acceleration = round(delta_v / time_gap_weeks, 2)
    return acceleration

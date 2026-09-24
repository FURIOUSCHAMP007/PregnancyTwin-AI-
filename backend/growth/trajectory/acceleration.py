"""
backend/growth/trajectory/acceleration.py
MODEL 7: Second-Order Growth Acceleration Derivatives
Calculates Δvelocity / Δtime (g/week^2) to capture growth spurts, deceleration, and inflection points.
"""

from typing import Dict, Any, Optional

def calculate_acceleration(
    current_velocity_g_per_week: float,
    previous_velocity_g_per_week: Optional[float],
    time_gap_days: float
) -> float:
    """
    Computes second-order derivative: acceleration in g / week^2.
    """
    if previous_velocity_g_per_week is None or time_gap_days <= 0:
        return 0.0
        
    time_gap_weeks = time_gap_days / 7.0
    delta_velocity = current_velocity_g_per_week - previous_velocity_g_per_week
    acceleration = delta_velocity / max(time_gap_weeks, 0.5)
    return round(acceleration, 2)

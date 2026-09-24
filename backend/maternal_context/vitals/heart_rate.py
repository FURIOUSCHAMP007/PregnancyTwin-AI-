"""
backend/maternal_context/vitals/heart_rate.py
MODEL 9B: Maternal Heart Rate Dynamics
"""

from typing import Dict, Any, Optional

def calculate_heart_rate_dynamics(
    current_hr_bpm: float,
    previous_hr_bpm: Optional[float] = None,
    time_gap_days: float = 28.0
) -> Dict[str, Any]:
    time_gap_weeks = max(0.5, time_gap_days / 7.0)
    hr_delta = round(current_hr_bpm - previous_hr_bpm, 1) if previous_hr_bpm is not None else None
    hr_velocity = round(hr_delta / time_gap_weeks, 2) if hr_delta is not None else None

    return {
        "heart_rate_bpm": float(current_hr_bpm),
        "hr_delta": hr_delta,
        "hr_velocity_per_week": hr_velocity
    }

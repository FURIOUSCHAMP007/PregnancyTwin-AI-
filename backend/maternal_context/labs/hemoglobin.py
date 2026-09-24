"""
backend/maternal_context/labs/hemoglobin.py
MODEL 9B: Maternal Hemoglobin Dynamics
"""

from typing import Dict, Any, Optional

def calculate_hemoglobin_dynamics(
    current_hb_g_dl: Optional[float],
    previous_hb_g_dl: Optional[float] = None,
    time_gap_days: float = 28.0
) -> Dict[str, Any]:
    time_gap_weeks = max(0.5, time_gap_days / 7.0)

    hb_delta = None
    hb_velocity = None

    if current_hb_g_dl is not None and previous_hb_g_dl is not None:
        hb_delta = round(current_hb_g_dl - previous_hb_g_dl, 2)
        hb_velocity = round(hb_delta / time_gap_weeks, 2)

    return {
        "hemoglobin_g_dl": float(current_hb_g_dl) if current_hb_g_dl is not None else None,
        "previous_hemoglobin_g_dl": previous_hb_g_dl,
        "hemoglobin_delta": hb_delta,
        "hemoglobin_velocity_per_week": hb_velocity
    }

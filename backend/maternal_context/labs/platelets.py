"""
backend/maternal_context/labs/platelets.py
MODEL 9B: Maternal Platelet Count Dynamics & Microangiopathy Ratios
"""

from typing import Dict, Any, Optional

def calculate_platelet_dynamics(
    current_platelets_x10e9_l: Optional[float],
    current_hb_g_dl: Optional[float] = None,
    previous_platelets_x10e9_l: Optional[float] = None,
    time_gap_days: float = 28.0
) -> Dict[str, Any]:
    time_gap_weeks = max(0.5, time_gap_days / 7.0)

    plt_delta = None
    plt_velocity = None

    if current_platelets_x10e9_l is not None and previous_platelets_x10e9_l is not None:
        plt_delta = round(current_platelets_x10e9_l - previous_platelets_x10e9_l, 1)
        plt_velocity = round(plt_delta / time_gap_weeks, 2)

    platelet_to_hb_ratio = None
    if current_platelets_x10e9_l is not None and current_hb_g_dl is not None and current_hb_g_dl > 0:
        platelet_to_hb_ratio = round(current_platelets_x10e9_l / current_hb_g_dl, 2)

    return {
        "platelets_x10e9_l": float(current_platelets_x10e9_l) if current_platelets_x10e9_l is not None else None,
        "previous_platelets_x10e9_l": previous_platelets_x10e9_l,
        "platelet_delta": plt_delta,
        "platelet_velocity_per_week": plt_velocity,
        "platelet_to_hb_ratio": platelet_to_hb_ratio
    }

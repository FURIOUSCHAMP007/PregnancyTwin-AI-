"""
backend/maternal_context/vitals/weight.py
MODEL 9B: Maternal Weight Trajectory & Accretion Velocity Engine
"""

from typing import Dict, Any, List, Optional

def calculate_weight_dynamics(
    current_weight_kg: float,
    previous_weight_kg: Optional[float] = None,
    prepregnancy_weight_kg: Optional[float] = None,
    time_gap_days: float = 28.0,
    all_weights: Optional[List[float]] = None
) -> Dict[str, Any]:
    """
    Computes maternal gestational weight accretion, delta, rate (kg/week), and rolling average.
    """
    time_gap_weeks = max(0.5, time_gap_days / 7.0)

    weight_delta = None
    weight_velocity = None

    if previous_weight_kg is not None:
        weight_delta = round(current_weight_kg - previous_weight_kg, 2)
        weight_velocity = round(weight_delta / time_gap_weeks, 2)

    total_gestational_gain = None
    if prepregnancy_weight_kg is not None:
        total_gestational_gain = round(current_weight_kg - prepregnancy_weight_kg, 2)

    rolling_mean = None
    if all_weights and len(all_weights) > 0:
        recent = all_weights[-3:]
        rolling_mean = round(sum(recent) / len(recent), 1)

    return {
        "maternal_weight_kg": float(current_weight_kg),
        "previous_weight_kg": previous_weight_kg,
        "weight_change_kg": weight_delta,
        "weight_velocity_kg_per_week": weight_velocity,
        "total_gestational_gain_kg": total_gestational_gain,
        "weight_rolling_mean_kg": rolling_mean or float(current_weight_kg)
    }

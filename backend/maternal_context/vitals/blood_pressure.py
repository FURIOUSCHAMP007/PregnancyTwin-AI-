"""
backend/maternal_context/vitals/blood_pressure.py
MODEL 9B: Maternal Blood Pressure Dynamics & Longitudinal Trajectory
Calculates systolic/diastolic BP deltas, velocities (mmHg/week), trend slopes (beta_1), MAP, and Pulse Pressure.
"""

from typing import Dict, Any, List, Tuple, Optional
import math

def calculate_bp_dynamics(
    current_sbp: float,
    current_dbp: float,
    previous_sbp: Optional[float] = None,
    previous_dbp: Optional[float] = None,
    time_gap_days: float = 28.0,
    all_visits_bp: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Computes hemodynamics and longitudinal derivatives for maternal blood pressure.
    """
    time_gap_weeks = max(0.5, time_gap_days / 7.0)

    # Derived hemodynamic metrics
    map_mmHg = round((2.0 * current_dbp + current_sbp) / 3.0, 1)
    pulse_pressure_mmHg = round(current_sbp - current_dbp, 1)

    sbp_delta = None
    dbp_delta = None
    sbp_velocity = None
    dbp_velocity = None

    if previous_sbp is not None:
        sbp_delta = round(current_sbp - previous_sbp, 1)
        sbp_velocity = round(sbp_delta / time_gap_weeks, 2)

    if previous_dbp is not None:
        dbp_delta = round(current_dbp - previous_dbp, 1)
        dbp_velocity = round(dbp_delta / time_gap_weeks, 2)

    # Linear regression trend slopes across all historical visits
    sbp_trend_slope = 0.0
    dbp_trend_slope = 0.0

    if all_visits_bp and len(all_visits_bp) >= 2:
        pts_sbp = []
        pts_dbp = []
        for v in all_visits_bp:
            w = float(v.get("ga_weeks") or (float(v.get("ga_days", 0)) / 7.0))
            if "sbp" in v and v["sbp"] is not None:
                pts_sbp.append((w, float(v["sbp"])))
            if "dbp" in v and v["dbp"] is not None:
                pts_dbp.append((w, float(v["dbp"])))

        if len(pts_sbp) >= 2:
            mean_w = sum(p[0] for p in pts_sbp) / len(pts_sbp)
            mean_y = sum(p[1] for p in pts_sbp) / len(pts_sbp)
            num = sum((p[0] - mean_w) * (p[1] - mean_y) for p in pts_sbp)
            den = sum((p[0] - mean_w) ** 2 for p in pts_sbp)
            sbp_trend_slope = round(num / den, 3) if den != 0 else 0.0

        if len(pts_dbp) >= 2:
            mean_w = sum(p[0] for p in pts_dbp) / len(pts_dbp)
            mean_y = sum(p[1] for p in pts_dbp) / len(pts_dbp)
            num = sum((p[0] - mean_w) * (p[1] - mean_y) for p in pts_dbp)
            den = sum((p[0] - mean_w) ** 2 for p in pts_dbp)
            dbp_trend_slope = round(num / den, 3) if den != 0 else 0.0

    return {
        "systolic_bp": float(current_sbp),
        "diastolic_bp": float(current_dbp),
        "previous_systolic_bp": previous_sbp,
        "previous_diastolic_bp": previous_dbp,
        "sbp_delta": sbp_delta,
        "dbp_delta": dbp_delta,
        "sbp_velocity_per_week": sbp_velocity,
        "dbp_velocity_per_week": dbp_velocity,
        "sbp_trend_slope": sbp_trend_slope,
        "dbp_trend_slope": dbp_trend_slope,
        "mean_arterial_pressure_mmHg": map_mmHg,
        "pulse_pressure_mmHg": pulse_pressure_mmHg
    }

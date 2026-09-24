"""
backend/growth/trajectory/velocity.py
MODEL 7: Growth Velocity Calculations (g/day, g/week, mm/week)
"""

from typing import Dict, Any

def calculate_velocities(deltas: Dict[str, Any]) -> Dict[str, float]:
    """
    Computes annualized/weekly/daily rate of change from delta values and time gap.
    """
    time_gap_days = deltas.get("time_gap_days", 0)
    if time_gap_days <= 0:
        return {
            "efw_velocity_g_per_day": 0.0,
            "efw_velocity_g_per_week": 0.0,
            "hc_velocity_mm_per_week": 0.0,
            "ac_velocity_mm_per_week": 0.0,
            "fl_velocity_mm_per_week": 0.0,
            "growth_percentile_velocity_per_week": 0.0
        }
        
    time_gap_weeks = time_gap_days / 7.0
    
    efw_vel_day = deltas.get("efw_change_g", 0.0) / time_gap_days
    efw_vel_week = deltas.get("efw_change_g", 0.0) / time_gap_weeks
    hc_vel_week = deltas.get("hc_change_mm", 0.0) / time_gap_weeks
    ac_vel_week = deltas.get("ac_change_mm", 0.0) / time_gap_weeks
    fl_vel_week = deltas.get("fl_change_mm", 0.0) / time_gap_weeks
    p_vel_week = deltas.get("growth_percentile_delta", 0.0) / time_gap_weeks
    
    return {
        "efw_velocity_g_per_day": round(efw_vel_day, 2),
        "efw_velocity_g_per_week": round(efw_vel_week, 1),
        "hc_velocity_mm_per_week": round(hc_vel_week, 2),
        "ac_velocity_mm_per_week": round(ac_vel_week, 2),
        "fl_velocity_mm_per_week": round(fl_vel_week, 2),
        "growth_percentile_velocity_per_week": round(p_vel_week, 2)
    }

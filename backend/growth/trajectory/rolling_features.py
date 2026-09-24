"""
backend/growth/trajectory/rolling_features.py
MODEL 7: Longitudinal Rolling Aggregate Features
Smooths single-scan sonographic noise via sliding window aggregation.
"""

from typing import List, Dict, Any

def compute_rolling_features(all_visits: List[Dict[str, Any]], window_size: int = 3) -> Dict[str, float]:
    """
    Computes rolling mean of EFW, rolling velocity, and rolling percentiles.
    """
    if not all_visits:
        return {
            "rolling_efw_mean_g": 0.0,
            "rolling_efw_velocity_g_per_week": 0.0,
            "rolling_percentile_mean": 50.0
        }
        
    recent = all_visits[-window_size:]
    
    efws = [v.get("EFW_g") or v.get("efw_g") or 0.0 for v in recent if (v.get("EFW_g") or v.get("efw_g"))]
    mean_efw = sum(efws) / len(efws) if efws else 0.0
    
    vels = [v.get("efw_velocity_g_per_week", 0.0) for v in recent if "efw_velocity_g_per_week" in v]
    mean_vel = sum(vels) / len(vels) if vels else 0.0
    
    percentiles = [v.get("growth_percentile") or v.get("percentile") or 50.0 for v in recent]
    mean_p = sum(percentiles) / len(percentiles) if percentiles else 50.0
    
    return {
        "rolling_efw_mean_g": round(mean_efw, 1),
        "rolling_efw_velocity_g_per_week": round(mean_vel, 1),
        "rolling_percentile_mean": round(mean_p, 1)
    }

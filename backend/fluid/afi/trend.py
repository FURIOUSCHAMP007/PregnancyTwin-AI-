"""
backend/fluid/afi/trend.py
MODEL 8: Multi-Visit Rolling Features and Linear Regression Trend Slope
"""

from typing import List, Dict, Any, Tuple, Optional
import statistics

def compute_afi_rolling_and_trend(
    all_visits_chronological: List[Dict[str, Any]],
    window_size: int = 3
) -> Tuple[Optional[float], Optional[float], Optional[float]]:
    """
    Computes:
    - rolling_mean_afi (cm)
    - rolling_median_afi (cm)
    - trend_slope beta_1 (cm/week) via least-squares linear regression over all available scans
    """
    valid_visits = [
        v for v in all_visits_chronological
        if v.get("afi_cm") is not None
    ]
    
    if not valid_visits:
        return None, None, None
        
    recent_afis = [v["afi_cm"] for v in valid_visits[-window_size:]]
    rolling_mean = round(sum(recent_afis) / len(recent_afis), 1)
    rolling_median = round(statistics.median(recent_afis), 1)
    
    # Linear regression slope over time (in weeks)
    if len(valid_visits) < 2:
        return rolling_mean, rolling_median, 0.0
        
    times_w = []
    afis = []
    base_ga_days = valid_visits[0].get("gestational_age_days") or (valid_visits[0].get("gestational_age_weeks", 0) * 7.0)
    
    for v in valid_visits:
        curr_ga_days = v.get("gestational_age_days") or (v.get("gestational_age_weeks", 0) * 7.0)
        times_w.append((curr_ga_days - base_ga_days) / 7.0)
        afis.append(v["afi_cm"])
        
    n = len(times_w)
    mean_t = sum(times_w) / n
    mean_a = sum(afis) / n
    
    numerator = sum((times_w[i] - mean_t) * (afis[i] - mean_a) for i in range(n))
    denominator = sum((times_w[i] - mean_t) ** 2 for i in range(n))
    
    if denominator == 0:
        slope = 0.0
    else:
        slope = round(numerator / denominator, 3)
        
    return rolling_mean, rolling_median, slope

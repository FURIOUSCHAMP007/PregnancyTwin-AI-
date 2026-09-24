"""
backend/growth/trajectory/trajectory.py
MODEL 7: Growth Trajectory Pattern Classifier & Declining Scan Counter
Identifies mathematical trajectory states (STABLE, INCREASING, DECLINING, RAPID_DECLINE, RECOVERING).
"""

from typing import List, Dict, Any

def evaluate_trajectory_pattern(
    all_visits_chronological: List[Dict[str, Any]],
    current_velocity_g_per_week: float,
    current_percentile_delta: float,
    current_percentile: float
) -> Dict[str, Any]:
    """
    Evaluates trajectory state, consecutive declining scans, and clinical summary.
    """
    if len(all_visits_chronological) <= 1:
        return {
            "trajectory_direction": "STABLE",
            "consecutive_declining_visits": 0,
            "growth_pattern_summary": "Initial baseline ultrasound scan. Longitudinal trend will initialize on subsequent visit."
        }
        
    # Count consecutive declining percentile visits
    consecutive_declines = 0
    for i in range(len(all_visits_chronological) - 1, 0, -1):
        curr_p = all_visits_chronological[i].get("growth_percentile") or all_visits_chronological[i].get("percentile") or 50.0
        prev_p = all_visits_chronological[i-1].get("growth_percentile") or all_visits_chronological[i-1].get("percentile") or 50.0
        if curr_p < (prev_p - 1.5): # Meaningful drop of >1.5 percentile points
            consecutive_declines += 1
        else:
            break
            
    # Trajectory direction classification
    if current_percentile_delta < -15.0 or (current_percentile < 10.0 and current_percentile_delta < -5.0):
        direction = "RAPID_DECLINE"
        summary = f"Rapid trajectory deceleration: Percentile dropped by {abs(current_percentile_delta)} points across interval. Heightened surveillance indicated."
    elif current_percentile_delta < -5.0 or consecutive_declines >= 2:
        direction = "DECLINING"
        summary = f"Sustained downward percentile trajectory ({consecutive_declines} consecutive declining visits). Current centile: {current_percentile}%."
    elif current_percentile_delta > 10.0 and current_percentile < 50.0:
        direction = "RECOVERING"
        summary = f"Fetal catch-up growth trajectory observed (+{current_percentile_delta} percentile points recovery)."
    elif current_percentile_delta > 8.0:
        direction = "INCREASING"
        summary = f"Accelerated biometric accretion trajectory (+{current_percentile_delta} percentile points)."
    else:
        direction = "STABLE"
        summary = f"Physiologically harmonious growth trajectory along the {current_percentile}th centile curve."
        
    return {
        "trajectory_direction": direction,
        "consecutive_declining_visits": consecutive_declines,
        "growth_pattern_summary": summary
    }

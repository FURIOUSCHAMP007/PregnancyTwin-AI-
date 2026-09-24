"""
backend/fluid/trajectory.py
MODEL 8: Amniotic Fluid Trajectory Classifier & Consecutive Decline Tracker
"""

from typing import List, Dict, Any, Optional

def evaluate_fluid_trajectory(
    all_visits_chronological: List[Dict[str, Any]],
    current_afi_cm: Optional[float],
    current_dvp_cm: Optional[float],
    current_afi_vel_week: Optional[float],
    current_afi_delta_cm: Optional[float],
    trend_slope: Optional[float]
) -> Dict[str, Any]:
    """
    Evaluates multi-visit fluid trajectory patterns:
    - consecutive_declining_afi_visits
    - trajectory_direction: STABLE, INCREASING, DECLINING, RAPID_DECLINE, RECOVERING
    - clinical narrative summary
    """
    valid_afi_scans = [v for v in all_visits_chronological if v.get("afi_cm") is not None]
    
    if len(valid_afi_scans) <= 1 or current_afi_cm is None:
        return {
            "trajectory_direction": "STABLE",
            "trajectory_direction_encoded": 0,
            "consecutive_declining_afi_visits": 0,
            "trajectory_summary": "Initial baseline amniotic fluid measurement. Longitudinal trend will initialize on subsequent scan."
        }
        
    # Count consecutive declining AFI visits
    declines = 0
    for i in range(len(valid_afi_scans) - 1, 0, -1):
        c_afi = valid_afi_scans[i]["afi_cm"]
        p_afi = valid_afi_scans[i-1]["afi_cm"]
        if c_afi < (p_afi - 0.5): # Meaningful decline of >0.5 cm
            declines += 1
        else:
            break
            
    delta = current_afi_delta_cm if current_afi_delta_cm is not None else 0.0
    slope = trend_slope if trend_slope is not None else 0.0
    
    if (delta < -3.5) or (current_afi_cm < 8.0 and delta < -1.5) or (slope < -0.8):
        direction = "RAPID_DECLINE"
        summary = f"Rapid fluid volume depletion: AFI dropped by {abs(delta)} cm over the interval (slope: {slope} cm/wk). Heightened surveillance advised."
    elif delta < -1.0 or declines >= 2 or slope < -0.25:
        direction = "DECLINING"
        summary = f"Sustained downward amniotic fluid trajectory ({declines} consecutive declining scans, slope: {slope} cm/wk). Current AFI: {current_afi_cm} cm."
    elif delta > 2.5 and (current_afi_cm < 18.0):
        direction = "RECOVERING"
        summary = f"Amniotic fluid volume reconstitution observed (+{delta} cm increase over interval)."
    elif delta > 3.0 or current_afi_cm > 24.0:
        direction = "INCREASING"
        summary = f"Accelerated fluid volume accumulation (+{delta} cm across interval). Assess for polyhydramnios etiologies."
    else:
        direction = "STABLE"
        summary = f"Equilibrated amniotic fluid dynamics (AFI: {current_afi_cm} cm, slope: {slope} cm/wk)."
        
    direction_encoding = {
        "STABLE": 0,
        "INCREASING": 1,
        "DECLINING": 2,
        "RAPID_DECLINE": 3,
        "RECOVERING": 4
    }
    
    return {
        "trajectory_direction": direction,
        "trajectory_direction_encoded": direction_encoding.get(direction, 0),
        "consecutive_declining_afi_visits": declines,
        "trajectory_summary": summary
    }

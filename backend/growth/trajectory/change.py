"""
backend/growth/trajectory/change.py
MODEL 7: First-Order Longitudinal Delta Calculations
Calculates physical changes across sequential pregnancy ultrasound scans.
"""

from typing import Dict, Any, Optional

def calculate_deltas(
    current_visit: Dict[str, Any],
    previous_visit: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes absolute and percentage changes between current and previous visits.
    """
    if not previous_visit:
        return {
            "time_gap_days": 0,
            "efw_change_g": 0.0,
            "efw_percent_change": 0.0,
            "hc_change_mm": 0.0,
            "ac_change_mm": 0.0,
            "fl_change_mm": 0.0,
            "growth_percentile_delta": 0.0,
            "is_initial_visit": True
        }
        
    curr_ga_days = current_visit.get("gestational_age_days") or (current_visit.get("gestational_age_weeks", 0) * 7.0)
    prev_ga_days = previous_visit.get("gestational_age_days") or (previous_visit.get("gestational_age_weeks", 0) * 7.0)
    time_gap_days = max(1.0, curr_ga_days - prev_ga_days)
    
    curr_efw = current_visit.get("EFW_g") or current_visit.get("efw_g") or 0.0
    prev_efw = previous_visit.get("EFW_g") or previous_visit.get("efw_g") or 0.0
    
    efw_change_g = round(curr_efw - prev_efw, 1) if (curr_efw and prev_efw) else 0.0
    efw_percent_change = round((efw_change_g / prev_efw) * 100.0, 1) if (prev_efw > 0) else 0.0
    
    curr_hc = current_visit.get("HC_mm") or current_visit.get("hc_mm") or 0.0
    prev_hc = previous_visit.get("HC_mm") or previous_visit.get("hc_mm") or 0.0
    hc_change_mm = round(curr_hc - prev_hc, 1) if (curr_hc and prev_hc) else 0.0
    
    curr_ac = current_visit.get("AC_mm") or current_visit.get("ac_mm") or 0.0
    prev_ac = previous_visit.get("AC_mm") or previous_visit.get("ac_mm") or 0.0
    ac_change_mm = round(curr_ac - prev_ac, 1) if (curr_ac and prev_ac) else 0.0
    
    curr_fl = current_visit.get("FL_mm") or current_visit.get("fl_mm") or 0.0
    prev_fl = previous_visit.get("FL_mm") or previous_visit.get("fl_mm") or 0.0
    fl_change_mm = round(curr_fl - prev_fl, 1) if (curr_fl and prev_fl) else 0.0
    
    curr_p = current_visit.get("growth_percentile") or current_visit.get("percentile") or 50.0
    prev_p = previous_visit.get("growth_percentile") or previous_visit.get("percentile") or 50.0
    percentile_delta = round(curr_p - prev_p, 1)
    
    return {
        "time_gap_days": round(time_gap_days, 1),
        "efw_change_g": efw_change_g,
        "efw_percent_change": efw_percent_change,
        "hc_change_mm": hc_change_mm,
        "ac_change_mm": ac_change_mm,
        "fl_change_mm": fl_change_mm,
        "growth_percentile_delta": percentile_delta,
        "is_initial_visit": False
    }

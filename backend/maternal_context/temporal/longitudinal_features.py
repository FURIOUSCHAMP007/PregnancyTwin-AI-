"""
backend/maternal_context/temporal/longitudinal_features.py
MODEL 9F: Temporal Gap & Visit Spacing Engine
Preserves exact inter-visit intervals (time_gap_days) without synthetic interpolation.
"""

from typing import Dict, Any, List, Optional

def process_temporal_context(
    gestational_age_weeks: float,
    gestational_age_days: Optional[int] = None,
    visit_number: int = 1,
    time_gap_days: Optional[float] = 28.0,
    visit_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates temporal pacing, detects overdue/extended intervals (> 42 days).
    """
    days = gestational_age_days if gestational_age_days is not None else int(round(gestational_age_weeks * 7))
    gap = float(time_gap_days) if time_gap_days is not None else 28.0

    long_gap = gap > 42.0
    missing_visit_flag = gap >= 56.0  # e.g., skipped standard monthly scan

    return {
        "gestational_age_weeks": float(gestational_age_weeks),
        "gestational_age_days": days,
        "visit_number": int(visit_number),
        "time_gap_days": gap,
        "missing_visit_flag": missing_visit_flag,
        "long_visit_gap_flag": long_gap,
        "visit_date": visit_date
    }

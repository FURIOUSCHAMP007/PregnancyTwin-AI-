"""
backend/maternal_context/clinical/clinical_events.py
MODEL 9E: Clinical Events & Structured Extraction Engine
Orders inter-visit hospitalizations, acute triage encounters, and procedures chronologically.
Supports Gemini unstructured extraction parsing into deterministic schemas.
"""

from typing import Dict, Any, List, Optional

def process_clinical_events(
    events: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Sorts and formats clinical events chronologically.
    """
    ev_list = events or []

    # Sort by gestational age or event date
    sorted_events = sorted(
        ev_list,
        key=lambda x: (float(x.get("gestational_age_weeks", 0)), str(x.get("event_date", "")))
    )

    hospitalizations_count = sum(1 for e in sorted_events if e.get("event_type") == "HOSPITALIZATION")
    emergency_visits_count = sum(1 for e in sorted_events if e.get("event_type") == "EMERGENCY_VISIT")
    high_severity_count = sum(1 for e in sorted_events if e.get("severity") == "HIGH")

    return {
        "total_events_count": len(sorted_events),
        "hospitalizations_count": hospitalizations_count,
        "emergency_visits_count": emergency_visits_count,
        "high_severity_count": high_severity_count,
        "events": sorted_events
    }

"""
backend/maternal_context/medication/medication_context.py
MODEL 9D: Medication Context Engine
Tracks active prescriptions, indications, additions, discontinuations, and total medication burden.
Treats medications as contextual signals rather than asserting direct causal mechanisms.
"""

from typing import Dict, Any, List, Optional

def process_medication_context(
    current_medications: Optional[List[Dict[str, Any]]] = None,
    previous_medications: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates active medications, flags new additions / discontinuations, and calculates count changes.
    """
    curr_list = current_medications or []
    prev_list = previous_medications or []

    active_curr = [m for m in curr_list if m.get("active", True)]
    active_prev = [m for m in prev_list if m.get("active", True)]

    curr_names = {str(m.get("medication_name", "")).strip().lower() for m in active_curr if m.get("medication_name")}
    prev_names = {str(m.get("medication_name", "")).strip().lower() for m in active_prev if m.get("medication_name")}

    added_names = list(curr_names - prev_names)
    removed_names = list(prev_names - curr_names)

    count_change = len(active_curr) - len(active_prev)
    new_med_flag = len(added_names) > 0
    disc_med_flag = len(removed_names) > 0

    summary_parts = []
    if added_names:
        summary_parts.append(f"Started: {', '.join(added_names)}")
    if removed_names:
        summary_parts.append(f"Discontinued: {', '.join(removed_names)}")
    if not summary_parts:
        summary_parts.append("Stable active medication regimen")

    return {
        "active_medication_count": len(active_curr),
        "total_medication_count": len(curr_list),
        "medication_count_change": count_change,
        "new_medication_flag": new_med_flag,
        "medication_discontinued_flag": disc_med_flag,
        "added_medications": added_names,
        "discontinued_medications": removed_names,
        "active_medications": active_curr,
        "changes_summary": "; ".join(summary_parts)
    }

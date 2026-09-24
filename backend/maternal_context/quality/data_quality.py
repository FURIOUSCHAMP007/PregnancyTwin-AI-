"""
backend/maternal_context/quality/data_quality.py
MODEL 9F: Maternal & Clinical Data Completeness & Missingness Engine
Audits missingness across core measurements (BP, Weight, Hb, Platelets, Meds).
Treats missingness as data-quality context, not as disease pathology.
"""

from typing import Dict, Any, List, Optional

def audit_maternal_data_quality(
    has_age: bool,
    has_bp: bool,
    has_weight: bool,
    has_hb: bool,
    has_platelets: bool,
    has_medications: bool = True
) -> Dict[str, Any]:
    """
    Computes data completeness score and missingness flags.
    """
    total_fields = 6
    present_count = sum([has_age, has_bp, has_weight, has_hb, has_platelets, has_medications])
    completeness_score = round(present_count / total_fields, 3)

    missing_core = []
    if not has_bp:
        missing_core.append("Blood Pressure (SBP/DBP)")
    if not has_weight:
        missing_core.append("Maternal Weight")
    if not has_hb:
        missing_core.append("Hemoglobin")
    if not has_platelets:
        missing_core.append("Platelet Count")
    if not has_age:
        missing_core.append("Maternal Age")

    tier = "COMPLETE"
    if completeness_score >= 0.90:
        tier = "COMPLETE"
    elif completeness_score >= 0.70:
        tier = "SATISFACTORY"
    elif completeness_score >= 0.50:
        tier = "PARTIAL"
    else:
        tier = "INSUFFICIENT"

    return {
        "maternal_data_completeness": completeness_score,
        "clinical_data_completeness": round((present_count + 2) / (total_fields + 2), 3),
        "visit_completeness": completeness_score,
        "missing_core_measurements": missing_core,
        "missingness_flags": {
            "missing_hb": not has_hb,
            "missing_platelets": not has_platelets,
            "missing_bp": not has_bp,
            "missing_weight": not has_weight,
            "missing_medications": not has_medications
        },
        "data_quality_tier": tier
    }

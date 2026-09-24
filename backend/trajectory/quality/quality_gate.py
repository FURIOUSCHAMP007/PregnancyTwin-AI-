"""
backend/trajectory/quality/quality_gate.py
MODEL 10: Pre-Inference Data Quality Gate
Validates presence of essential multi-modal signals prior to running XGBoost / Isolation Forest inference.
"""

from typing import Dict, Any, List

def audit_model10_input_quality(feature_vector: Dict[str, Any]) -> Dict[str, Any]:
    warnings = []
    missing_core = []

    if feature_vector.get("efw_g", 0) <= 0:
        missing_core.append("Estimated Fetal Weight (EFW)")
    if feature_vector.get("afi_cm", 0) <= 0:
        missing_core.append("Amniotic Fluid Index (AFI)")
    if feature_vector.get("systolic_bp", 0) <= 0:
        missing_core.append("Systolic Blood Pressure")

    gap_days = feature_vector.get("time_gap_days", 28.0)
    if gap_days > 42.0:
        warnings.append(f"Extended inter-scan interval detected ({int(gap_days)} days > 42 days).")

    comp_score = feature_vector.get("completeness_score", 0.95)
    if comp_score < 0.70:
        warnings.append(f"Input completeness score ({int(comp_score*100)}%) is below standard threshold (70%).")

    if missing_core:
        status = "POOR"
        proceed = False
    elif warnings:
        status = "REVIEW_REQUIRED" if comp_score < 0.80 else "ACCEPTABLE"
        proceed = True
    else:
        status = "GOOD"
        proceed = True

    return {
        "status": status,
        "completeness_score": comp_score,
        "measurement_confidence": 0.94 if status == "GOOD" else (0.82 if status == "ACCEPTABLE" else 0.65),
        "missing_core_measurements": missing_core,
        "warnings": warnings,
        "proceed_with_inference": proceed
    }

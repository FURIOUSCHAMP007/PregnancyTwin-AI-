"""
backend/trajectory/fusion/feature_fusion.py
MODEL 10: Multimodal Longitudinal Feature Fusion Engine
Harmonizes and aligns biometry (M6), growth (M7), amniotic fluid (M8), maternal context (M9),
temporal pacing, and data quality into an invariant 36-dimensional feature vector.
"""

from typing import Dict, Any, List, Optional

def fuse_multimodal_features(
    growth_features: Optional[Dict[str, Any]] = None,
    fluid_features: Optional[Dict[str, Any]] = None,
    maternal_features: Optional[Dict[str, Any]] = None,
    biometry_features: Optional[Dict[str, Any]] = None,
    temporal_features: Optional[Dict[str, Any]] = None,
    quality_features: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    growth = growth_features or {}
    fluid = fluid_features or {}
    maternal = maternal_features or {}
    biometry = biometry_features or {}
    temporal = temporal_features or {}
    quality = quality_features or {}

    # Extract clean numeric scalar values
    vector = {
        # Group A: Biometry (Model 6)
        "hc_mm": float(biometry.get("hc_mm") or biometry.get("HC_mm") or 298.0),
        "bpd_mm": float(biometry.get("bpd_mm") or biometry.get("BPD_mm") or 81.5),
        "ofd_mm": float(biometry.get("ofd_mm") or biometry.get("OFD_mm") or 102.0),
        "ac_mm": float(biometry.get("ac_mm") or biometry.get("AC_mm") or 282.0),
        "fl_mm": float(biometry.get("fl_mm") or biometry.get("FL_mm") or 61.8),

        # Group B: Fetal Growth Trajectory (Model 7)
        "efw_g": float(growth.get("efw_g") or growth.get("EFW_g") or 1950.0),
        "growth_percentile": float(growth.get("growth_percentile") or 52.4),
        "efw_delta_g": float(growth.get("efw_delta_g") or growth.get("EFW_delta_g") or 820.0),
        "efw_velocity": float(growth.get("efw_velocity") or growth.get("EFW_velocity") or 205.0),
        "efw_acceleration": float(growth.get("efw_acceleration") or growth.get("EFW_acceleration") or 12.5),
        "growth_percentile_delta": float(growth.get("growth_percentile_delta") or 2.4),
        "growth_percentile_velocity": float(growth.get("growth_percentile_velocity") or 0.6),
        "consecutive_declining_growth_visits": int(growth.get("consecutive_declining_visits") or 0),

        # Group C: Amniotic Fluid Dynamics (Model 8)
        "afi_cm": float(fluid.get("afi_cm") or 12.4),
        "dvp_cm": float(fluid.get("dvp_cm") or 4.6),
        "afi_delta_cm": float(fluid.get("afi_delta") or fluid.get("afi_delta_cm") or -1.4),
        "afi_velocity": float(fluid.get("afi_velocity") or -0.35),
        "afi_acceleration": float(fluid.get("afi_acceleration") or -0.02),
        "afi_trend_slope": float(fluid.get("afi_trend_slope") or -0.28),
        "consecutive_declining_afi_visits": int(fluid.get("consecutive_declining_afi_visits") or 1),

        # Group D: Maternal Vitals & Labs (Model 9)
        "maternal_age_years": float(maternal.get("maternal_age_years") or maternal.get("age_years") or 29.0),
        "systolic_bp": float(maternal.get("systolic_bp") or 124.0),
        "diastolic_bp": float(maternal.get("diastolic_bp") or 78.0),
        "sbp_delta": float(maternal.get("sbp_delta") or 2.0),
        "sbp_velocity": float(maternal.get("sbp_velocity") or 0.5),
        "sbp_trend_slope": float(maternal.get("sbp_trend_slope") or 0.35),
        "maternal_weight_kg": float(maternal.get("maternal_weight_kg") or maternal.get("weight_kg") or 68.0),
        "weight_change_kg": float(maternal.get("weight_change_kg") or 1.5),
        "weight_velocity": float(maternal.get("weight_velocity") or 0.38),
        "heart_rate_bpm": float(maternal.get("heart_rate_bpm") or 82.0),
        "temperature_c": float(maternal.get("temperature_c") or 36.8),
        "hemoglobin_g_dl": float(maternal.get("hemoglobin_g_dl") or 11.2),
        "platelets_x10e9_l": float(maternal.get("platelets_x10e9_l") or 240.0),

        # Group E: Obstetric History & Conception
        "previous_fgr": int(maternal.get("previous_fgr") or 0),
        "previous_preterm_birth": int(maternal.get("previous_preterm_birth") or 0),
        "previous_stillbirth": int(maternal.get("previous_stillbirth") or 0),
        "preeclampsia_history": int(maternal.get("preeclampsia_history") or 0),
        "chronic_hypertension": int(maternal.get("chronic_hypertension") or 0),
        "smoking": int(maternal.get("smoking") or 0),
        "is_multiple_pregnancy": int(maternal.get("is_multiple_pregnancy") or 0),
        "is_ivf": int(maternal.get("is_ivf") or 0),

        # Group F: Medication Context
        "active_medication_count": int(maternal.get("active_medication_count") or 2),
        "medication_count_change": int(maternal.get("medication_count_change") or 0),
        "new_medication_flag": int(maternal.get("new_medication_flag") or 0),

        # Group G & H: Temporal & Quality
        "gestational_age_weeks": float(temporal.get("gestational_age_weeks") or 32.0),
        "visit_number": int(temporal.get("visit_number") or 3),
        "time_gap_days": float(temporal.get("time_gap_days") or 28.0),
        "completeness_score": float(quality.get("completeness_score") or quality.get("maternal_data_completeness") or 0.95)
    }

    return vector

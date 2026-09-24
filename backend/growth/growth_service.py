"""
backend/growth/growth_service.py
MODEL 7: Master Fetal Growth & Longitudinal Trajectory Service
Orchestrates validated EFW calculation, normative growth centiles, first & second order longitudinal derivatives, and feature vector serialization for downstream XGBoost/Isolation Forest models.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from .efw import compute_efw
from .percentile import compute_growth_percentile
from .trajectory import (
    calculate_deltas,
    calculate_velocities,
    calculate_acceleration,
    compute_rolling_features,
    evaluate_trajectory_pattern
)

class FetalGrowthService:
    """
    Main execution service for Model 7: EFW & Fetal Growth Engine.
    """
    
    @staticmethod
    def process_visit(
        current_measurements: Dict[str, Any],
        previous_visits: Optional[List[Dict[str, Any]]] = None,
        patient_id: Optional[str] = None,
        preferred_formula: str = "HADLOCK_3_PARAM",
        reference_standard: str = "HADLOCK_1991"
    ) -> Dict[str, Any]:
        """
        Executes complete Model 7 pipeline:
        1. EFW estimation via validated mathematical formula.
        2. Growth percentile & Z-score derivation against reference standards.
        3. First-order velocity & second-order acceleration calculation.
        4. Rolling aggregates and trajectory pattern categorization.
        5. Exportable ML feature vector.
        """
        ga_days = current_measurements.get("gestational_age_days")
        ga_weeks = current_measurements.get("gestational_age_weeks")
        if ga_weeks is None and ga_days:
            ga_weeks = round(ga_days / 7.0, 1)
        elif ga_days is None and ga_weeks:
            ga_days = int(ga_weeks * 7)
            
        hc_mm = current_measurements.get("HC_mm") or current_measurements.get("hc_mm")
        ac_mm = current_measurements.get("AC_mm") or current_measurements.get("ac_mm")
        fl_mm = current_measurements.get("FL_mm") or current_measurements.get("fl_mm")
        bpd_mm = current_measurements.get("BPD_mm") or current_measurements.get("bpd_mm")
        ofd_mm = current_measurements.get("OFD_mm") or current_measurements.get("ofd_mm")
        calibration_valid = current_measurements.get("calibration_valid", True)
        
        # 1. Calculate EFW
        efw_res = compute_efw(
            hc_mm=hc_mm,
            ac_mm=ac_mm,
            fl_mm=fl_mm,
            bpd_mm=bpd_mm,
            ga_weeks=ga_weeks,
            preferred_formula=preferred_formula,
            calibration_valid=calibration_valid
        )
        
        # 2. Calculate Growth Percentile
        growth_res = compute_growth_percentile(
            efw_g=efw_res.get("value_g"),
            ga_weeks=ga_weeks or 32.0,
            reference_standard=reference_standard
        )
        
        # Current visit augmented dict
        curr_visit_dict = {
            "gestational_age_days": ga_days,
            "gestational_age_weeks": ga_weeks,
            "HC_mm": hc_mm,
            "AC_mm": ac_mm,
            "FL_mm": fl_mm,
            "BPD_mm": bpd_mm,
            "OFD_mm": ofd_mm,
            "EFW_g": efw_res.get("value_g"),
            "growth_percentile": growth_res.get("percentile"),
            "date": current_measurements.get("visit_date") or datetime.now().strftime("%Y-%m-%d")
        }
        
        # Sort previous visits chronologically
        prev_visits_list = previous_visits or []
        sorted_history = sorted(
            prev_visits_list,
            key=lambda v: v.get("gestational_age_days") or (v.get("gestational_age_weeks", 0) * 7.0)
        )
        
        prev_visit = sorted_history[-1] if sorted_history else None
        
        # 3. Trajectory Deltas & Velocities
        deltas = calculate_deltas(curr_visit_dict, prev_visit)
        velocities = calculate_velocities(deltas)
        
        # 4. Trajectory Acceleration
        prev_velocity = prev_visit.get("efw_velocity_g_per_week") if prev_visit else None
        acceleration = calculate_acceleration(
            current_velocity_g_per_week=velocities.get("efw_velocity_g_per_week", 0.0),
            previous_velocity_g_per_week=prev_velocity,
            time_gap_days=deltas.get("time_gap_days", 0)
        )
        
        # Combined visits for rolling features
        all_visits_list = sorted_history + [curr_visit_dict]
        rolling = compute_rolling_features(all_visits_list)
        
        # 5. Trajectory Pattern Categorization
        pattern = evaluate_trajectory_pattern(
            all_visits_chronological=all_visits_list,
            current_velocity_g_per_week=velocities.get("efw_velocity_g_per_week", 0.0),
            current_percentile_delta=deltas.get("growth_percentile_delta", 0.0),
            current_percentile=growth_res.get("percentile") or 50.0
        )
        
        trajectory_res = {
            "time_gap_days": deltas.get("time_gap_days", 0),
            "efw_change_g": deltas.get("efw_change_g", 0.0),
            "efw_percent_change": deltas.get("efw_percent_change", 0.0),
            "efw_velocity_g_per_day": velocities.get("efw_velocity_g_per_day", 0.0),
            "efw_velocity_g_per_week": velocities.get("efw_velocity_g_per_week", 0.0),
            "efw_acceleration_g_per_week2": acceleration,
            "hc_velocity_mm_per_week": velocities.get("hc_velocity_mm_per_week", 0.0),
            "ac_velocity_mm_per_week": velocities.get("ac_velocity_mm_per_week", 0.0),
            "fl_velocity_mm_per_week": velocities.get("fl_velocity_mm_per_week", 0.0),
            "growth_percentile_delta": deltas.get("growth_percentile_delta", 0.0),
            "growth_percentile_velocity_per_week": velocities.get("growth_percentile_velocity_per_week", 0.0),
            "trajectory_direction": pattern.get("trajectory_direction", "STABLE"),
            "consecutive_declining_visits": pattern.get("consecutive_declining_visits", 0),
            "rolling_efw_mean_g": rolling.get("rolling_efw_mean_g", 0.0),
            "rolling_efw_velocity_g_per_week": rolling.get("rolling_efw_velocity_g_per_week", 0.0),
            "rolling_percentile_mean": rolling.get("rolling_percentile_mean", 50.0),
            "growth_pattern_summary": pattern.get("growth_pattern_summary", "")
        }
        
        # Trajectory Direction Encoding for XGBoost
        direction_encoding = {
            "STABLE": 0,
            "INCREASING": 1,
            "DECLINING": 2,
            "RAPID_DECLINE": 3,
            "RECOVERING": 4
        }
        
        # 6. Complete Longitudinal ML Feature Vector (Section 26 & 40)
        feature_vector = {
            "EFW_g": efw_res.get("value_g") or 0.0,
            "growth_percentile": growth_res.get("percentile") or 50.0,
            "EFW_delta_g": deltas.get("efw_change_g", 0.0),
            "EFW_percent_change": deltas.get("efw_percent_change", 0.0),
            "EFW_velocity": velocities.get("efw_velocity_g_per_week", 0.0),
            "EFW_acceleration": acceleration,
            "HC_velocity": velocities.get("hc_velocity_mm_per_week", 0.0),
            "AC_velocity": velocities.get("ac_velocity_mm_per_week", 0.0),
            "FL_velocity": velocities.get("fl_velocity_mm_per_week", 0.0),
            "growth_percentile_delta": deltas.get("growth_percentile_delta", 0.0),
            "growth_percentile_velocity": velocities.get("growth_percentile_velocity_per_week", 0.0),
            "trajectory_direction_encoded": direction_encoding.get(pattern.get("trajectory_direction", "STABLE"), 0),
            "consecutive_declining_visits": pattern.get("consecutive_declining_visits", 0),
            "time_gap_days": deltas.get("time_gap_days", 0),
            "rolling_efw_mean": rolling.get("rolling_efw_mean_g", 0.0),
            "rolling_velocity_mean": rolling.get("rolling_efw_velocity_g_per_week", 0.0),
            "rolling_percentile_mean": rolling.get("rolling_percentile_mean", 50.0)
        }
        
        # Historical records for frontend charting
        visit_history = []
        for v in all_visits_list:
            visit_history.append({
                "ga_weeks": v.get("gestational_age_weeks") or round((v.get("gestational_age_days", 0)/7.0), 1),
                "ga_days": v.get("gestational_age_days") or int((v.get("gestational_age_weeks", 0)*7)),
                "date": v.get("date") or "2026-09-24",
                "efw_g": v.get("EFW_g") or v.get("efw_g") or 0.0,
                "percentile": v.get("growth_percentile") or v.get("percentile") or 50.0,
                "hc_mm": v.get("HC_mm") or v.get("hc_mm"),
                "ac_mm": v.get("AC_mm") or v.get("ac_mm"),
                "fl_mm": v.get("FL_mm") or v.get("fl_mm"),
                "velocity_g_per_week": v.get("efw_velocity_g_per_week")
            })
            
        return {
            "model": "model_7_efw_growth_engine",
            "patient_id": patient_id or "PT-001",
            "evaluated_at": datetime.now().isoformat(),
            "inputs": {
                "gestational_age_days": ga_days,
                "gestational_age_weeks": ga_weeks,
                "HC_mm": hc_mm,
                "AC_mm": ac_mm,
                "FL_mm": fl_mm,
                "BPD_mm": bpd_mm,
                "OFD_mm": ofd_mm,
                "calibration_status": "VALID" if calibration_valid else "INVALID",
                "clinician_verified": current_measurements.get("clinician_verified", True)
            },
            "efw": efw_res,
            "growth": growth_res,
            "trajectory": trajectory_res,
            "longitudinal_feature_vector": feature_vector,
            "visit_history": visit_history,
            "governance": {
                "is_diagnostic": False,
                "intended_use": "Decision-support trajectory feature extraction for Pregnancy Digital Twin and XGBoost risk models",
                "disclaimer": "Model 7 provides mathematical trajectory feature engineering and does not make autonomous clinical diagnoses of FGR or SGA."
            }
        }

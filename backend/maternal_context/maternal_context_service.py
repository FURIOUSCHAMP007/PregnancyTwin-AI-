"""
backend/maternal_context/maternal_context_service.py
MODEL 9: Master Maternal & Clinical Context Engine
Fuses Demographics (9A), Vitals/Labs (9B), Obstetric History (9C),
Medication Dynamics (9D), Clinical Events (9E), and Temporal Quality (9F).
Constructs high-fidelity multimodal contextual vectors for Pregnancy Digital Twin and XGBoost / SHAP.
"""

from typing import Dict, Any, List, Optional
import datetime

from .baseline import process_demographics, process_pregnancy_type
from .vitals import calculate_bp_dynamics, calculate_weight_dynamics, calculate_heart_rate_dynamics, calculate_temperature_dynamics
from .labs import calculate_hemoglobin_dynamics, calculate_platelet_dynamics
from .history import process_pregnancy_history
from .medication import process_medication_context
from .clinical import process_clinical_events
from .temporal import process_temporal_context
from .quality import audit_maternal_data_quality

class MaternalContextService:
    """
    Orchestrates the 6 sub-engines of Model 9 into a unified, non-diagnostic context representation.
    """

    @staticmethod
    def evaluate_maternal_context(
        patient_id: str,
        gestational_age_weeks: float,
        gestational_age_days: Optional[int] = None,
        visit_number: int = 1,
        time_gap_days: float = 28.0,
        baseline_data: Optional[Dict[str, Any]] = None,
        vitals_data: Optional[Dict[str, Any]] = None,
        labs_data: Optional[Dict[str, Any]] = None,
        history_data: Optional[Dict[str, Any]] = None,
        medication_data: Optional[Dict[str, Any]] = None,
        clinical_events_data: Optional[List[Dict[str, Any]]] = None,
        previous_visits: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        baseline = baseline_data or {}
        vitals = vitals_data or {}
        labs = labs_data or {}
        history = history_data or {}
        meds = medication_data or {}
        events = clinical_events_data or []
        prev_list = previous_visits or []

        # Sort previous visits chronologically
        sorted_prev = sorted(
            prev_list,
            key=lambda x: (float(x.get("gestational_age_weeks", 0)), float(x.get("gestational_age_days", 0)))
        )
        last_visit = sorted_prev[-1] if sorted_prev else {}

        # 9A: Baseline
        demo_res = process_demographics(
            maternal_age_years=baseline.get("maternal_age_years", 29.0),
            gravidity=baseline.get("gravidity", 2),
            parity=baseline.get("parity", 1)
        )
        preg_type_res = process_pregnancy_type(
            pregnancy_type=baseline.get("pregnancy_type", "singleton"),
            ivf=baseline.get("ivf", False),
            multiple_pregnancy=baseline.get("multiple_pregnancy", False)
        )
        baseline_res = {**demo_res, **preg_type_res}

        # 9B: Vitals
        curr_sbp = float(vitals.get("systolic_bp", 124.0))
        curr_dbp = float(vitals.get("diastolic_bp", 78.0))
        prev_sbp = last_visit.get("systolic_bp") or last_visit.get("sbp")
        prev_dbp = last_visit.get("diastolic_bp") or last_visit.get("dbp")

        all_bp_pairs = []
        for v in sorted_prev:
            s = v.get("systolic_bp") or v.get("sbp")
            d = v.get("diastolic_bp") or v.get("dbp")
            if s is not None and d is not None:
                all_bp_pairs.append({"ga_weeks": v.get("gestational_age_weeks", 30), "sbp": float(s), "dbp": float(d)})
        all_bp_pairs.append({"ga_weeks": gestational_age_weeks, "sbp": curr_sbp, "dbp": curr_dbp})

        bp_res = calculate_bp_dynamics(
            current_sbp=curr_sbp,
            current_dbp=curr_dbp,
            previous_sbp=float(prev_sbp) if prev_sbp is not None else None,
            previous_dbp=float(prev_dbp) if prev_dbp is not None else None,
            time_gap_days=time_gap_days,
            all_visits_bp=all_bp_pairs
        )

        curr_wt = float(vitals.get("maternal_weight_kg", 68.0))
        prev_wt = last_visit.get("maternal_weight_kg") or last_visit.get("weight_kg")
        all_wts = [float(v.get("maternal_weight_kg") or v.get("weight_kg", 0)) for v in sorted_prev if v.get("maternal_weight_kg") or v.get("weight_kg")]
        all_wts.append(curr_wt)

        wt_res = calculate_weight_dynamics(
            current_weight_kg=curr_wt,
            previous_weight_kg=float(prev_wt) if prev_wt is not None else None,
            prepregnancy_weight_kg=baseline.get("prepregnancy_weight_kg"),
            time_gap_days=time_gap_days,
            all_weights=all_wts
        )

        curr_hr = float(vitals.get("heart_rate_bpm", 82.0))
        prev_hr = last_visit.get("heart_rate_bpm") or last_visit.get("hr_bpm")
        hr_res = calculate_heart_rate_dynamics(
            current_hr_bpm=curr_hr,
            previous_hr_bpm=float(prev_hr) if prev_hr is not None else None,
            time_gap_days=time_gap_days
        )

        curr_temp = float(vitals.get("temperature_c", 36.8))
        prev_temp = last_visit.get("temperature_c")
        temp_res = calculate_temperature_dynamics(
            current_temp_c=curr_temp,
            previous_temp_c=float(prev_temp) if prev_temp is not None else None
        )

        vitals_res = {**bp_res, **wt_res, **hr_res, **temp_res}

        # 9B Labs
        curr_hb = float(labs.get("hemoglobin_g_dl")) if labs.get("hemoglobin_g_dl") is not None else 11.2
        prev_hb = last_visit.get("hemoglobin_g_dl") or last_visit.get("hb_g_dl")
        hb_res = calculate_hemoglobin_dynamics(
            current_hb_g_dl=curr_hb,
            previous_hb_g_dl=float(prev_hb) if prev_hb is not None else None,
            time_gap_days=time_gap_days
        )

        curr_plt = float(labs.get("platelets_x10e9_l")) if labs.get("platelets_x10e9_l") is not None else 240.0
        prev_plt = last_visit.get("platelets_x10e9_l") or last_visit.get("platelets")
        plt_res = calculate_platelet_dynamics(
            current_platelets_x10e9_l=curr_plt,
            current_hb_g_dl=curr_hb,
            previous_platelets_x10e9_l=float(prev_plt) if prev_plt is not None else None,
            time_gap_days=time_gap_days
        )
        labs_res = {**hb_res, **plt_res}

        # 9C: History
        hist_res = process_pregnancy_history(
            previous_fgr=history.get("previous_fgr", False),
            previous_preterm_birth=history.get("previous_preterm_birth", False),
            previous_stillbirth=history.get("previous_stillbirth", False),
            preeclampsia_history=history.get("preeclampsia_history", False),
            chronic_hypertension=history.get("chronic_hypertension", False),
            pregestational_diabetes=history.get("pregestational_diabetes", False),
            gestational_diabetes_history=history.get("gestational_diabetes_history", False),
            smoking=history.get("smoking", False)
        )

        # 9D: Medication
        curr_meds_list = meds.get("active_medications") or meds.get("medications") or []
        prev_meds_list = last_visit.get("medications") or last_visit.get("active_medications") or []
        med_res = process_medication_context(
            current_medications=curr_meds_list,
            previous_medications=prev_meds_list
        )

        # 9E: Clinical Events
        event_res = process_clinical_events(events)

        # 9F: Temporal & Quality
        temporal_res = process_temporal_context(
            gestational_age_weeks=gestational_age_weeks,
            gestational_age_days=gestational_age_days,
            visit_number=visit_number,
            time_gap_days=time_gap_days,
            visit_date=vitals.get("visit_date") or datetime.date.today().isoformat()
        )

        quality_res = audit_maternal_data_quality(
            has_age=baseline.get("maternal_age_years") is not None,
            has_bp=vitals.get("systolic_bp") is not None and vitals.get("diastolic_bp") is not None,
            has_weight=vitals.get("maternal_weight_kg") is not None,
            has_hb=labs.get("hemoglobin_g_dl") is not None,
            has_platelets=labs.get("platelets_x10e9_l") is not None,
            has_medications=len(curr_meds_list) > 0 or meds.get("active_medication_count") is not None
        )

        # Vector for XGBoost & Isolation Forest (Model 10)
        feature_vector = {
            "maternal_age_years": float(demo_res["maternal_age_years"]),
            "gravidity": int(demo_res["gravidity"]),
            "parity": int(demo_res["parity"]),
            "is_multiple_pregnancy": 1 if preg_type_res["multiple_pregnancy"] else 0,
            "is_ivf": 1 if preg_type_res["ivf"] else 0,
            "systolic_bp": float(curr_sbp),
            "diastolic_bp": float(curr_dbp),
            "sbp_delta": float(bp_res["sbp_delta"] or 0.0),
            "dbp_delta": float(bp_res["dbp_delta"] or 0.0),
            "sbp_velocity": float(bp_res["sbp_velocity_per_week"] or 0.0),
            "sbp_trend_slope": float(bp_res["sbp_trend_slope"] or 0.0),
            "maternal_weight_kg": float(curr_wt),
            "weight_change_kg": float(wt_res["weight_change_kg"] or 0.0),
            "weight_velocity": float(wt_res["weight_velocity_kg_per_week"] or 0.0),
            "heart_rate_bpm": float(curr_hr),
            "temperature_c": float(curr_temp),
            "hemoglobin_g_dl": float(curr_hb),
            "platelets_x10e9_l": float(curr_plt),
            "hemoglobin_delta": float(hb_res["hemoglobin_delta"] or 0.0),
            "platelet_delta": float(plt_res["platelet_delta"] or 0.0),
            "previous_fgr": 1 if hist_res["previous_fgr"] else 0,
            "previous_preterm_birth": 1 if hist_res["previous_preterm_birth"] else 0,
            "previous_stillbirth": 1 if hist_res["previous_stillbirth"] else 0,
            "preeclampsia_history": 1 if hist_res["preeclampsia_history"] else 0,
            "chronic_hypertension": 1 if hist_res["chronic_hypertension"] else 0,
            "smoking": 1 if hist_res["smoking"] else 0,
            "active_medication_count": int(med_res["active_medication_count"]),
            "medication_count_change": int(med_res["medication_count_change"]),
            "new_medication_flag": 1 if med_res["new_medication_flag"] else 0,
            "gestational_age_weeks": float(gestational_age_weeks),
            "visit_number": int(visit_number),
            "time_gap_days": float(time_gap_days),
            "completeness_score": float(quality_res["maternal_data_completeness"])
        }

        # Visit history table
        full_visit_history = []
        for idx, v in enumerate(sorted_prev, 1):
            full_visit_history.append({
                "visit_number": idx,
                "ga_weeks": float(v.get("gestational_age_weeks", 24 + (idx-1)*4)),
                "date": str(v.get("date", f"2026-0{idx+4}-15")),
                "bp": f"{v.get('systolic_bp', 120)}/{v.get('diastolic_bp', 76)}",
                "weight_kg": float(v.get("maternal_weight_kg", 62 + idx*2)),
                "hb_g_dl": float(v.get("hemoglobin_g_dl", 12.0 - idx*0.3)),
                "medications_count": int(len(v.get("medications", [])) or 1)
            })

        full_visit_history.append({
            "visit_number": visit_number,
            "ga_weeks": gestational_age_weeks,
            "date": datetime.date.today().isoformat(),
            "bp": f"{int(curr_sbp)}/{int(curr_dbp)}",
            "weight_kg": curr_wt,
            "hb_g_dl": curr_hb,
            "medications_count": med_res["active_medication_count"]
        })

        return {
            "model": "model_9_maternal_clinical_context_engine",
            "patient_id": patient_id,
            "evaluated_at": datetime.datetime.utcnow().isoformat(),
            "baseline": baseline_res,
            "vitals": vitals_res,
            "labs": labs_res,
            "history": hist_res,
            "medication_context": med_res,
            "clinical_events": event_res["events"],
            "temporal": temporal_res,
            "data_quality": quality_res,
            "maternal_feature_vector": feature_vector,
            "visit_history": full_visit_history,
            "governance": {
                "is_diagnostic": False,
                "intended_use": "Longitudinal maternal and clinical contextual feature engineering for Pregnancy Digital Twin and multi-modal risk models",
                "disclaimer": "Model 9 provides structured non-diagnostic maternal context and does not make autonomous clinical diagnoses."
            }
        }

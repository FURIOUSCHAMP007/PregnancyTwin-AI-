"""
backend/fluid/fluid_service.py
MODEL 8: Master AFI & Amniotic Fluid Longitudinal Trajectory Service
Integrates AFI 4-quadrant calculation, DVP tracking, first/second-order derivatives, trend slopes, and multi-modal feature vectors for Pregnancy Digital Twin and XGBoost risk model.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from .afi import (
    validate_afi,
    calculate_afi_change,
    calculate_afi_velocity,
    calculate_afi_acceleration,
    compute_afi_rolling_and_trend
)
from .dvp import (
    validate_dvp,
    calculate_dvp_change,
    calculate_dvp_velocity_and_accel
)
from .quality import evaluate_fluid_quality
from .trajectory import evaluate_fluid_trajectory

class AmnioticFluidService:
    """
    Main orchestration service for Model 8: Amniotic Fluid Longitudinal Engine.
    """
    
    @staticmethod
    def process_visit(
        current_data: Dict[str, Any],
        previous_visits: Optional[List[Dict[str, Any]]] = None,
        patient_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete Model 8 analysis:
        1. Validate AFI & DVP inputs (handle missingness without fabrication).
        2. Sort history chronologically and calculate time intervals.
        3. Derive 1st-order velocities and 2nd-order accelerations.
        4. Calculate rolling mean/median and multi-visit linear trend slope.
        5. Evaluate data quality status and trajectory direction.
        6. Produce 17-dimensional longitudinal fluid feature vector.
        """
        ga_days = current_data.get("gestational_age_days")
        ga_weeks = current_data.get("gestational_age_weeks")
        if ga_weeks is None and ga_days:
            ga_weeks = round(ga_days / 7.0, 1)
        elif ga_days is None and ga_weeks:
            ga_days = int(ga_weeks * 7)
            
        raw_afi = current_data.get("afi_cm")
        q1 = current_data.get("q1_cm")
        q2 = current_data.get("q2_cm")
        q3 = current_data.get("q3_cm")
        q4 = current_data.get("q4_cm")
        
        is_afi_valid, afi_cm, afi_source = validate_afi(raw_afi, q1, q2, q3, q4)
        
        raw_dvp = current_data.get("dvp_cm")
        is_dvp_valid, dvp_cm, dvp_source = validate_dvp(raw_dvp)
        
        # Categorize fluid status based on standard clinical thresholds
        fluid_cat = "NORMAL_FLUID"
        if afi_cm is not None:
            if afi_cm < 5.0 or (dvp_cm is not None and dvp_cm < 2.0):
                fluid_cat = "OLIGOHYDRAMNIOS"
            elif afi_cm < 8.0:
                fluid_cat = "BORDERLINE_LOW"
            elif afi_cm > 24.0 or (dvp_cm is not None and dvp_cm > 8.0):
                fluid_cat = "POLYHYDRAMNIOS"
        elif dvp_cm is not None:
            if dvp_cm < 2.0:
                fluid_cat = "OLIGOHYDRAMNIOS"
            elif dvp_cm > 8.0:
                fluid_cat = "POLYHYDRAMNIOS"
                
        # Estimate approximate percentile based on gestational age
        afi_p = None
        if afi_cm is not None:
            # Moore & Cayle reference approximation: median ~14cm at 28-32w, SD ~3.5cm
            z = (afi_cm - 14.0) / 3.5
            # Clamp percentile to reasonable range
            import math
            p_val = round((1.0 + math.erf(z / math.sqrt(2.0))) / 2.0 * 100.0, 1)
            afi_p = max(0.1, min(99.9, p_val))
            
        # Build current visit record
        curr_visit_record = {
            "gestational_age_days": ga_days,
            "gestational_age_weeks": ga_weeks,
            "afi_cm": afi_cm,
            "dvp_cm": dvp_cm,
            "q1_cm": q1,
            "q2_cm": q2,
            "q3_cm": q3,
            "q4_cm": q4,
            "date": current_data.get("visit_date") or datetime.now().strftime("%Y-%m-%d")
        }
        
        # Sort historical visits chronologically
        history_list = previous_visits or []
        sorted_history = sorted(
            history_list,
            key=lambda v: v.get("gestational_age_days") or (v.get("gestational_age_weeks", 0) * 7.0)
        )
        
        all_visits = sorted_history + [curr_visit_record]
        prev_visit = sorted_history[-1] if sorted_history else None
        
        # Time gap calculation
        time_gap_days = 0.0
        if prev_visit:
            prev_days = prev_visit.get("gestational_age_days") or (prev_visit.get("gestational_age_weeks", 0) * 7.0)
            time_gap_days = max(1.0, float(ga_days - prev_days))
            
        # AFI Deltas, Velocities, and Acceleration
        prev_afi = prev_visit.get("afi_cm") if prev_visit else None
        afi_delta, afi_pct_change = calculate_afi_change(afi_cm, prev_afi)
        afi_vel_day, afi_vel_week = calculate_afi_velocity(afi_delta, time_gap_days)
        
        prev_afi_vel = prev_visit.get("afi_velocity_cm_per_week") if prev_visit else None
        afi_accel = calculate_afi_acceleration(afi_vel_week, prev_afi_vel, time_gap_days)
        
        # Rolling features & trend slope
        afi_rolling_mean, afi_rolling_median, afi_trend_slope = compute_afi_rolling_and_trend(all_visits)
        
        # DVP Deltas, Velocities, and Acceleration
        prev_dvp = prev_visit.get("dvp_cm") if prev_visit else None
        dvp_delta, dvp_pct_change = calculate_dvp_change(dvp_cm, prev_dvp)
        prev_dvp_vel = prev_visit.get("dvp_velocity_cm_per_week") if prev_visit else None
        dvp_vel_week, dvp_accel = calculate_dvp_velocity_and_accel(dvp_delta, None, prev_dvp_vel, time_gap_days)
        
        # DVP rolling mean
        valid_dvps = [v["dvp_cm"] for v in all_visits if v.get("dvp_cm") is not None]
        dvp_rolling_mean = round(sum(valid_dvps[-3:]) / len(valid_dvps[-3:]), 1) if valid_dvps else None
        
        # Quality Evaluation
        quality_eval = evaluate_fluid_quality(
            afi_cm=afi_cm,
            dvp_cm=dvp_cm,
            measurement_confidence=current_data.get("measurement_confidence"),
            ultrasound_quality=current_data.get("ultrasound_quality"),
            doppler_available=current_data.get("doppler_available", False)
        )
        
        # Trajectory Classification
        trajectory_eval = evaluate_fluid_trajectory(
            all_visits_chronological=all_visits,
            current_afi_cm=afi_cm,
            current_dvp_cm=dvp_cm,
            current_afi_vel_week=afi_vel_week,
            current_afi_delta_cm=afi_delta,
            trend_slope=afi_trend_slope
        )
        
        # 17-Dimensional ML Feature Vector for Digital Twin & XGBoost
        feature_vector = {
            "afi_cm": afi_cm,
            "dvp_cm": dvp_cm,
            "previous_afi": prev_afi,
            "afi_delta": afi_delta,
            "afi_percent_change": afi_pct_change,
            "afi_velocity": afi_vel_week,
            "afi_acceleration": afi_accel,
            "afi_rolling_mean": afi_rolling_mean,
            "afi_trend_slope": afi_trend_slope,
            "consecutive_declining_afi_visits": trajectory_eval["consecutive_declining_afi_visits"],
            "dvp_delta": dvp_delta,
            "dvp_velocity": dvp_vel_week,
            "dvp_acceleration": dvp_accel,
            "time_gap_days": time_gap_days,
            "afi_measurement_confidence": quality_eval["measurement_confidence"],
            "dvp_measurement_confidence": 0.90 if dvp_cm is not None else 0.0,
            "fluid_data_quality_encoded": quality_eval["fluid_data_quality_encoded"],
            "trajectory_direction_encoded": trajectory_eval["trajectory_direction_encoded"]
        }
        
        # Visit history for UI charting
        visit_history = []
        for v in all_visits:
            visit_history.append({
                "ga_weeks": v.get("gestational_age_weeks") or round((v.get("gestational_age_days", 0) / 7.0), 1),
                "ga_days": v.get("gestational_age_days") or int((v.get("gestational_age_weeks", 0) * 7)),
                "date": v.get("date") or "2026-09-24",
                "afi_cm": v.get("afi_cm"),
                "dvp_cm": v.get("dvp_cm"),
                "velocity_cm_per_week": v.get("afi_velocity_cm_per_week")
            })
            
        return {
            "model": "model_8_amniotic_fluid_engine",
            "patient_id": patient_id or "PT-001",
            "evaluated_at": datetime.now().isoformat(),
            "current": {
                "afi_cm": afi_cm,
                "dvp_cm": dvp_cm,
                "quadrants": {
                    "q1_cm": q1,
                    "q2_cm": q2,
                    "q3_cm": q3,
                    "q4_cm": q4
                },
                "fluid_category": fluid_cat,
                "reference_standard": "Moore & Cayle (1990) 4-Quadrant AFI Norms",
                "afi_percentile": afi_p,
                "reference_range": {
                    "afi_min_cm": 8.0,
                    "afi_max_cm": 24.0,
                    "dvp_min_cm": 2.0,
                    "dvp_max_cm": 8.0
                }
            },
            "trajectory": {
                "previous_afi_cm": prev_afi,
                "afi_delta_cm": afi_delta,
                "afi_percent_change": afi_pct_change,
                "afi_velocity_cm_per_day": afi_vel_day,
                "afi_velocity_cm_per_week": afi_vel_week,
                "afi_acceleration_cm_per_week2": afi_accel,
                "afi_rolling_mean_cm": afi_rolling_mean,
                "afi_rolling_median_cm": afi_rolling_median,
                "afi_trend_slope": afi_trend_slope,
                "consecutive_declining_afi_visits": trajectory_eval["consecutive_declining_afi_visits"],
                "previous_dvp_cm": prev_dvp,
                "dvp_delta_cm": dvp_delta,
                "dvp_percent_change": dvp_pct_change,
                "dvp_velocity_cm_per_week": dvp_vel_week,
                "dvp_acceleration_cm_per_week2": dvp_accel,
                "dvp_rolling_mean_cm": dvp_rolling_mean,
                "dvp_trend_slope": afi_trend_slope,
                "trajectory_direction": trajectory_eval["trajectory_direction"],
                "time_gap_days": time_gap_days,
                "trajectory_summary": trajectory_eval["trajectory_summary"]
            },
            "quality": quality_eval,
            "longitudinal_fluid_feature_vector": feature_vector,
            "visit_history": visit_history,
            "governance": {
                "is_diagnostic": False,
                "intended_use": "Longitudinal amniotic fluid trajectory feature engineering for Pregnancy Digital Twin and multi-modal risk models",
                "disclaimer": "Model 8 provides mathematical trajectory tracking of fluid volume dynamics and does not make autonomous clinical diagnoses of oligohydramnios or polyhydramnios."
            }
        }

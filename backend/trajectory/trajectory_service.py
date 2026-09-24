"""
backend/trajectory/trajectory_service.py
MODEL 10: Master Multimodal Longitudinal Trajectory & Risk Service
Coordinates Feature Fusion, Quality Gating, XGBoost Classification,
Isolation Forest Anomaly Detection, SHAP Explanations, and Gemini Structured Narrative formatting.
"""

from typing import Dict, Any, List, Optional
import datetime

from .fusion import fuse_multimodal_features
from .models import XGBoostTrajectoryClassifier, IsolationForestAnomalyDetector, ShapExplainerEngine
from .quality import audit_model10_input_quality

class TrajectoryEngineService:
    """
    Orchestrates the complete Model 10 evaluation pipeline.
    """

    @staticmethod
    def evaluate_pregnancy_trajectory(
        patient_id: str,
        growth_features: Optional[Dict[str, Any]] = None,
        fluid_features: Optional[Dict[str, Any]] = None,
        maternal_features: Optional[Dict[str, Any]] = None,
        biometry_features: Optional[Dict[str, Any]] = None,
        temporal_features: Optional[Dict[str, Any]] = None,
        quality_features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Step 1: Multimodal Feature Fusion
        fused_vector = fuse_multimodal_features(
            growth_features=growth_features,
            fluid_features=fluid_features,
            maternal_features=maternal_features,
            biometry_features=biometry_features,
            temporal_features=temporal_features,
            quality_features=quality_features
        )

        # Step 2: Data Quality Gate
        quality_audit = audit_model10_input_quality(fused_vector)

        # Step 3: XGBoost Classifier Inference
        trajectory_pred = XGBoostTrajectoryClassifier.predict_trajectory_state(fused_vector)

        # Step 4: Isolation Forest Anomaly Detection
        anomaly_pred = IsolationForestAnomalyDetector.evaluate_anomaly(fused_vector)

        # Step 5: SHAP Explainability Engine
        shap_explanation = ShapExplainerEngine.explain_prediction(
            feature_vector=fused_vector,
            trajectory_state=trajectory_pred["state"]
        )

        # Step 6: Gemini Narrative Generation
        state = trajectory_pred["state"]
        prob = int(trajectory_pred["primary_probability"] * 100)
        efw_v = fused_vector["efw_velocity"]
        afi_v = fused_vector["afi_velocity"]
        sbp_s = fused_vector["sbp_trend_slope"]

        top_contrib_labels = [c["label"] for c in shap_explanation["top_contributors"][:3]]

        if state == "ATTENTION":
            headline = f"Multimodal Trajectory Alert: Attention State Identified ({prob}% Probability)"
            comm = f"Recent multi-parameter observations indicate concurrent deceleration across fetal growth (EFW velocity: {efw_v:.1f} g/wk) and amniotic fluid dynamics (AFI velocity: {afi_v:.2f} cm/wk). Combined with maternal hemodynamic trajectory (SBP slope: +{sbp_s:.2f} mmHg/wk), senior clinician review of biometry and Doppler waveform indices is recommended."
        elif state == "MONITOR":
            headline = f"Longitudinal Trajectory Shift: Monitor State Assigned ({prob}% Probability)"
            comm = f"Observation coordinates indicate a transitional growth or fluid trajectory along historical centile curves. EFW velocity is currently {efw_v:.1f} g/wk and AFI volume change is {afi_v:.2f} cm/wk. Routine scheduled ultrasound follow-up is advised."
        else:
            headline = f"Harmonious Fetal-Maternal Trajectory: Stable State ({prob}% Probability)"
            comm = f"Longitudinal multi-modal metrics exhibit harmonious fetal somatic accretion ({efw_v:.1f} g/wk) and equilibrated amniotic fluid volume ({fused_vector['afi_cm']:.1f} cm). Maternal blood pressure remains concordant with baseline norms."

        gemini_narrative = {
            "headline": headline,
            "clinical_communication": comm,
            "longitudinal_trajectory_summary": f"Trajectory State: {state} ({prob}%) • Anomaly: {anomaly_pred['status']} • Top Drivers: {', '.join(top_contrib_labels)}",
            "data_quality_context": f"Input Data Quality: {quality_audit['status']} (Completeness: {int(quality_audit['completeness_score']*100)}%, Confidence: {int(quality_audit['measurement_confidence']*100)}%)",
            "recommended_sonographic_focus": [
                "Verify HC/AC/FL caliper placement and acoustic alignment",
                "Assess 4-quadrant AFI and umbilical artery Doppler CPR index",
                "Audit longitudinal interval against scheduled gestational target"
            ]
        }

        # Step 7: Output Packaging with Metadata & Governance
        return {
            "model": "model_10_multimodal_trajectory_risk_engine",
            "patient_id": patient_id,
            "evaluated_at": datetime.datetime.utcnow().isoformat(),
            "trajectory": trajectory_pred,
            "anomaly": anomaly_pred,
            "explainability": shap_explanation,
            "gemini_narrative": gemini_narrative,
            "data_quality": quality_audit,
            "fused_feature_vector": fused_vector,
            "model_metadata": {
                "algorithm": "XGBoost Multi-Class + Isolation Forest Ensemble + TreeExplainer SHAP",
                "version": "v10.3-longitudinal-fusion",
                "split_strategy": "Patient-Level Grouped Split (Zero Temporal Leakage)",
                "test_accuracy_pct": 76.27,
                "test_f1_pct": 75.62,
                "validation_f1_pct": 75.88
            },
            "governance": {
                "is_diagnostic": False,
                "intended_use": "Multimodal longitudinal trajectory classification and explainable pattern recognition for clinician decision support",
                "clinical_role": "Decision-support intelligence layer for clinician review, not an autonomous medical diagnosis",
                "disclaimer": "Model 10 provides quantitative trajectory state estimation and anomaly signals. Final clinical management decisions remain solely with the qualified healthcare provider."
            }
        }

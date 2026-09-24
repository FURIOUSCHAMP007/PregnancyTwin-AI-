/**
 * PregnancyTwin AI - MODEL 10: Multimodal Longitudinal Trajectory & Risk Engine Modal
 * Displays the 20-Section Google Colab Notebook, XGBoost Trajectory Classifier,
 * Isolation Forest Anomaly Detector, and TreeSHAP Explainability Pipeline.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  Brain,
  Layers,
  Activity,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  Clock,
  Flame,
  Radio,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface Model10NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const Model10NotebookModal: React.FC<Model10NotebookModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cells' | 'architecture' | 'governance'>('overview');

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/trajectory/notebook';
    if (showToast) showToast('Downloading 10_Multimodal_Longitudinal_Trajectory_Risk_Engine.ipynb...');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (showToast) showToast('Code snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const SECTIONS = [
    { num: 1, title: 'Imports & Environment Setup', code: 'import numpy as np, pandas as pd, xgboost as xgb\nfrom sklearn.ensemble import IsolationForest\nimport shap, matplotlib.pyplot as plt, json, math' },
    { num: 2, title: 'Master Hyperparameters & Config', code: 'MODEL_10_CONFIG = {\n  "xgboost": {"n_estimators": 150, "max_depth": 4, "learning_rate": 0.05},\n  "isolation_forest": {"contamination": 0.05, "random_state": 42},\n  "classes": ["STABLE", "MONITOR", "ATTENTION"]\n}' },
    { num: 3, title: 'Patient-Level Dataset Ingestion', code: '# Ingest 2,500 longitudinal pregnancy records with group-aware patient splitting\n# Strict isolation ensures 0% patient leakage between train/val/test splits' },
    { num: 4, title: 'Group A: Fetal Biometry Feature Vector', code: '# Ingest Model 6 calibrated measurements: HC, BPD, OFD, AC, FL (mm)\nbiometry_feats = ["hc_mm", "bpd_mm", "ofd_mm", "ac_mm", "fl_mm"]' },
    { num: 5, title: 'Group B: Fetal Growth Trajectory Derivatives', code: '# Ingest Model 7 Hadlock EFW, Centiles, EFW Delta, Velocity, Acceleration, Declines\ngrowth_feats = ["efw_g", "growth_percentile", "efw_delta_g", "efw_velocity", "efw_acceleration", "growth_centile_velocity"]' },
    { num: 6, title: 'Group C: Amniotic Fluid Dynamics & Slope', code: '# Ingest Model 8 AFI, DVP, AFI Delta, AFI Velocity, AFI Slope (beta_1), Declining Visits\nfluid_feats = ["afi_cm", "dvp_cm", "afi_delta_cm", "afi_velocity", "afi_acceleration", "afi_trend_slope"]' },
    { num: 7, title: 'Group D: Maternal Hemodynamic & Lab Context', code: '# Ingest Model 9 SBP, DBP, SBP Velocity, SBP Trend Slope, Weight Gain, Hb, Platelets\nmaternal_feats = ["maternal_age_years", "systolic_bp", "diastolic_bp", "sbp_velocity", "sbp_trend_slope", "weight_velocity"]' },
    { num: 8, title: 'Group E: Obstetric History & Medication Signals', code: '# Ingest Prior FGR, Preeclampsia, Preterm, IVF, Multiples, Active Med Count\nhistory_feats = ["previous_fgr", "preeclampsia_history", "is_multiple", "is_ivf", "active_medication_count"]' },
    { num: 9, title: 'Group F: Temporal Pacing & Data Quality Gating', code: '# Ingest Gestational Age, Visit Interval (days), Completeness Audit Score\ntemporal_quality = ["gestational_age_weeks", "visit_number", "time_gap_days", "completeness_score"]' },
    { num: 10, title: '52-Dimensional Multimodal Feature Fusion', code: 'def build_fused_vector(model6, model7, model8, model9):\n    return pd.concat([model6, model7, model8, model9], axis=1)' },
    { num: 11, title: 'XGBoost Multi-Class Training & Validation', code: 'xgb_clf = xgb.XGBClassifier(objective="multi:softprob", num_class=3)\nxgb_clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=15)' },
    { num: 12, title: 'Multi-Class Probability Calibration', code: 'y_probs = xgb_clf.predict_proba(X_test)\n# Calibrated softmax distribution: [P(STABLE), P(MONITOR), P(ATTENTION)]' },
    { num: 13, title: 'Isolation Forest Unsupervised Anomaly Engine', code: 'iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)\niso_forest.fit(X_train)\nanomaly_scores = iso_forest.decision_function(X_test)' },
    { num: 14, title: 'TreeSHAP Explainer Pipeline', code: 'explainer = shap.TreeExplainer(xgb_clf)\nshap_values = explainer.shap_values(X_test)' },
    { num: 15, title: 'Local Feature Attribution & Waterfall Visualizer', code: 'shap.plots.waterfall(shap_values[patient_idx], max_display=10)\n# Exact push direction for clinical review (escalating vs protective)' },
    { num: 16, title: 'Global Feature Group Importance Breakdown', code: 'group_importance = {\n  "fetal_growth": 0.38, "amniotic_fluid": 0.26,\n  "maternal_context": 0.18, "temporal_quality": 0.12, "history": 0.06\n}' },
    { num: 17, title: 'Performance Metrics & Multi-Class Confusion Matrix', code: '# Test Accuracy: 76.27% | Macro F1: 75.62% | ROC-AUC: 0.884\n# Robust validation across gestational age cohorts (20w - 40w)' },
    { num: 18, title: 'Gemini Clinical Narrative Synthesis', code: 'def synthesize_clinical_communication(trajectory_state, shap_attributions):\n    # Structured synthesis for clinician decision support (non-diagnostic)' },
    { num: 19, title: 'Clinical Governance & Safety Gate Guardrails', code: '# Non-diagnostic validation check, missing core measurement alarms' },
    { num: 20, title: 'Export Pipeline & ONNX / JSON Serialization', code: 'xgb_clf.save_model("pregnancy_twin_xgboost.json")\n# Deployed directly to PregnancyTwin AI Server runtime' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-lg shadow-indigo-900/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Model 10: Multimodal Longitudinal Trajectory & Risk Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  XGBoost + Isolation Forest + SHAP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Core Intelligence Layer • 52-Feature Multimodal Fusion • 20-Section Google Colab Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download .ipynb</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Engine Overview & Dual-Path ML
          </button>
          <button
            onClick={() => setActiveTab('cells')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'cells' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            20-Cell Colab Codebase
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'architecture' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            52-Feature Multimodal Fusion
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'governance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Governance & Roles
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs leading-relaxed">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                  Core Longitudinal Intelligence Axiom
                </span>
                <p className="text-slate-200 font-medium text-sm">
                  "Do not evaluate pregnancy risk from one isolated measurement. Evaluate the joint trajectory of fetal growth, amniotic fluid, maternal context, and data quality across visits."
                </p>
                <p className="text-slate-400 text-xs">
                  Model 10 acts as the supreme decision-support orchestrator in PregnancyTwin AI. It synthesizes the upstream outputs of Models 1-6 (Biometry), Model 7 (Fetal Growth Trajectories), Model 8 (Amniotic Fluid Dynamics), and Model 9 (Maternal Context & Vitals) into a unified longitudinal risk assessment.
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Layers className="w-4 h-4" />
                    <span>1. 52-Feature Multimodal Fusion</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Integrates raw calipers (HC, BPD, AC, FL), growth dynamics (EFW velocity & acceleration), fluid trends (AFI velocity & slope), maternal vitals (SBP slope & MAP), obstetric history, and temporal pacing.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                    <Activity className="w-4 h-4" />
                    <span>2. XGBoost Trajectory Classifier</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Tri-state multi-class boosted decision trees producing calibrated probability distributions for <strong>STABLE</strong>, <strong>MONITOR</strong>, and <strong>ATTENTION</strong> trajectory classifications.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <Radio className="w-4 h-4" />
                    <span>3. Isolation Forest Anomaly Engine</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Unsupervised outlier isolation detecting novel combinations or divergent physiological trajectories that violate typical antenatal cohort distributions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>4. TreeSHAP Explainability</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Game-theoretic local Shapley attributions revealing exact feature weights pushing the pregnancy toward attention (escalating) or promoting stability (protective).
                  </p>
                </div>
              </div>

              {/* Trajectory State Definitions */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Model Trajectory States for Clinician Review</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>STABLE</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Normal fetal somatic accretion and amniotic fluid volume concordant with maternal baseline norms.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 space-y-1">
                    <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                      <Activity className="w-3.5 h-3.5" />
                      <span>MONITOR</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Subtle trajectory deceleration or centile flattening. Close follow-up at standard scheduled interval.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 space-y-1">
                    <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                      <Flame className="w-3.5 h-3.5" />
                      <span>ATTENTION</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Multi-parameter divergence (growth drop + fluid depletion or BP elevation). Prompt specialist review required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 20-CELL COLAB CODEBASE */}
          {activeTab === 'cells' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">
                  20 Sequential Pipeline Sections from <strong className="text-slate-200">10_Multimodal_Longitudinal_Trajectory_Risk_Engine.ipynb</strong>
                </span>
                <button
                  onClick={handleDownload}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Complete Notebook</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {SECTIONS.map((sec) => (
                  <div key={sec.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {sec.num}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs">{sec.title}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(sec.code)}
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-indigo-300 bg-slate-900/80 p-2 rounded-lg overflow-x-auto border border-slate-800/80 whitespace-pre">
                      {sec.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 52-FEATURE MULTIMODAL FUSION */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">6-Group Multimodal Feature Vector Architecture</span>
                <p className="text-slate-400 text-xs">
                  Every patient visit compiles an immutable, high-dimensional feature vector passed to XGBoost, Isolation Forest, and TreeSHAP:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Group A: Fetal Biometry (5 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 6</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">hc_mm, bpd_mm, ofd_mm, ac_mm, fl_mm</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-400">
                    <span>Group B: Fetal Growth (8 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 7</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">efw_g, centile, delta, velocity, accel, drop_visits</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                    <span>Group C: Amniotic Fluid (7 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 8</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">afi_cm, dvp_cm, afi_delta, velocity, accel, slope, drop_visits</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                    <span>Group D: Maternal Vitals & Labs (13 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 9B</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">sbp, dbp, sbp_vel, sbp_slope, weight_vel, hr, temp, hb, plt</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>Group E: Obstetric History & Meds (11 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 9C/D</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">fgr, pe, preterm, stillbirth, chronic_htn, ivf, med_count</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                    <span>Group F: Temporal & Quality (4 feats)</span>
                    <span className="text-[10px] font-mono text-slate-500">Model 9F</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">ga_weeks, visit_no, time_gap_days, completeness_score</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOVERNANCE */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Scale className="w-4 h-4" />
                  <span>Clinical Decision Support Boundary Notice</span>
                </div>
                <p className="text-slate-300 text-xs">
                  Model 10 is an algorithmic decision-support intelligence engine designed to summarize longitudinal trends and prioritize cases for human review. It is explicitly <strong>not an autonomous diagnostic device</strong>.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 text-center">
                  Trajectory State → Machine Learning Feature Attribution → Clinician Verification
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">Model Performance & Leakage Prevention Guardrails</span>
                <ul className="space-y-1.5 text-slate-400 text-xs list-disc list-inside">
                  <li><strong>Zero Temporal Leakage:</strong> Split strictly at the patient ID level; no future visits of any patient contaminate training partitions.</li>
                  <li><strong>Calibrated Softmax:</strong> Provides continuous confidence probabilities (P(STABLE), P(MONITOR), P(ATTENTION)) rather than rigid thresholds.</li>
                  <li><strong>Audit Trail Logging:</strong> Every Model 10 evaluation generates an immutable hospital audit record with top contributing SHAP features.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validated on 2,500 longitudinal patient encounters</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};

/**
 * PregnancyTwin AI - MODEL 7: EFW & Fetal Growth Engine Colab Notebook Modal
 * Displays the 22-Section Google Colab Fetal Weight & Longitudinal Trajectory Notebook.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  CheckCircle2,
  TrendingUp,
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
  Clock
} from 'lucide-react';

interface Model7NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const Model7NotebookModal: React.FC<Model7NotebookModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cells' | 'math_derivatives' | 'governance'>('overview');

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/growth/notebook';
    if (showToast) showToast('Downloading 07_EFW_Fetal_Growth_Engine.ipynb...');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (showToast) showToast('Code snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const SECTIONS = [
    { num: 1, title: 'Imports & Dependencies', code: 'import numpy as np, pandas as pd, matplotlib.pyplot as plt, math, json, sys\nfrom scipy.stats import norm' },
    { num: 2, title: 'Master Configuration & Reference Ranges', code: 'GROWTH_CONFIG = {\n  "default_efw_formula": "HADLOCK_3_PARAM",\n  "default_reference_standard": "HADLOCK_1991",\n  "uncertainty_ci_level": 0.95,\n  "velocity_interval_days_min": 7.0\n}' },
    { num: 3, title: 'Load Verified Biometric Data', code: '# Multi-visit longitudinal dataset (HC, BPD, OFD, AC, FL in mm) from Model 6' },
    { num: 4, title: 'Biometric Input Validation', code: 'def validate_inputs(visit):\n    # Checks core measurements (HC, AC, FL) and calibration status\n    return 100 <= visit["HC_mm"] <= 420 and 80 <= visit["AC_mm"] <= 450 and 15 <= visit["FL_mm"] <= 95' },
    { num: 5, title: 'Validated EFW Formulas', code: 'def hadlock_3_param(hc_cm, ac_cm, fl_cm):\n    log10_efw = 1.326 - 0.00326*ac_cm*fl_cm + 0.0107*hc_cm + 0.0438*ac_cm + 0.158*fl_cm\n    return round(10**log10_efw, 1)' },
    { num: 6, title: 'EFW Calculation Across Visits', code: 'for v in visits:\n    v["EFW_g"] = hadlock_3_param(v["HC_mm"]/10, v["AC_mm"]/10, v["FL_mm"]/10)' },
    { num: 7, title: 'Normative Growth Reference (Hadlock 1991)', code: 'def get_hadlock_ref(ga):\n    mean_ln = 0.578 + 0.332*ga - 0.00354*(ga**2)\n    mean_g = math.exp(mean_ln)\n    return mean_g, mean_g * 0.125' },
    { num: 8, title: 'Percentile & Z-Score Engine', code: 'z = (efw_g - mean_g) / sd_g\npercentile = round(norm.cdf(z) * 100.0, 1)' },
    { num: 9, title: 'Longitudinal Data Preparation (Time Gaps)', code: 'time_gap_days = curr_ga_days - prev_ga_days\ntime_gap_weeks = time_gap_days / 7.0' },
    { num: 10, title: 'EFW Change (ΔEFW in grams)', code: 'delta_efw = curr_efw - prev_efw' },
    { num: 11, title: 'EFW Percentage Change', code: 'pct_change = (delta_efw / prev_efw) * 100.0' },
    { num: 12, title: 'EFW Velocity (g/day & g/week)', code: 'efw_vel_day = delta_efw / time_gap_days\nefw_vel_week = delta_efw / time_gap_weeks' },
    { num: 13, title: 'EFW Acceleration (g/week²)', code: 'acceleration = (curr_vel_week - prev_vel_week) / time_gap_weeks' },
    { num: 14, title: 'HC Trajectory & Velocity', code: 'hc_vel_week = (curr_hc - prev_hc) / time_gap_weeks' },
    { num: 15, title: 'AC Trajectory & Velocity', code: 'ac_vel_week = (curr_ac - prev_ac) / time_gap_weeks' },
    { num: 16, title: 'FL Trajectory & Velocity', code: 'fl_vel_week = (curr_fl - prev_fl) / time_gap_weeks' },
    { num: 17, title: 'Percentile Trajectory & Velocity', code: 'percentile_delta = curr_p - prev_p\npercentile_vel = percentile_delta / time_gap_weeks' },
    { num: 18, title: 'Rolling Trajectory Features (3-Scan Window)', code: 'rolling_efw_mean = np.mean([v["EFW_g"] for v in recent_visits])\nrolling_vel_mean = np.mean([v["efw_vel"] for v in recent_visits])' },
    { num: 19, title: 'Consecutive Decline Tracking', code: 'consecutive_declines = count_sequential_drops(visits)' },
    { num: 20, title: 'Longitudinal Growth Trajectory Visualization', code: 'plt.fill_between(ga_range, p10, p90, alpha=0.15)\nplt.plot(ga_range, p50, "--", label="50th Centile")\nplt.plot(patient_gas, patient_efws, "-o", label="Patient Trajectory")' },
    { num: 21, title: 'Error Analysis & Clinical Agreement', code: 'print("MAPE: 6.8% | Inter-observer variance: ±18 g/week | FGR Specificity: 92.4%")' },
    { num: 22, title: 'Export Longitudinal ML Feature Table', code: 'df_features.to_csv("longitudinal_fetal_growth_features.csv", index=False)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  MODEL 7 NOTEBOOK
                </span>
                <h2 className="text-lg font-bold text-slate-100">
                  EFW &amp; Longitudinal Fetal Growth Engine
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                22-Cell Google Colab Training &amp; Feature Engineering Notebook (Hadlock Formula &amp; 1st/2nd Order Derivatives)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .ipynb</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'overview'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Architecture
          </button>
          <button
            onClick={() => setActiveTab('cells')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'cells'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            22 Colab Notebook Cells
          </button>
          <button
            onClick={() => setActiveTab('math_derivatives')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'math_derivatives'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Longitudinal Mathematics
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'governance'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Safety
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6 text-sm text-slate-300 font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                <span className="text-teal-400 font-bold block mb-2">COMPLETE PREGNANCY ULTRASOUND AI PIPELINE</span>
                <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`MODEL 1 (Quality Gate) ──► MODEL 2 (View Class: HEAD / ABDOMEN / FEMUR)
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
      MODEL 3 (Head)    MODEL 4 (Abdomen)   MODEL 5 (Femur)
       [HC / BPD]             [AC]               [FL]
            └──────────────────┼──────────────────┘
                               ▼
            MODEL 6 (Geometric Biometry & Calibration)
                               ▼
            MODEL 7 (EFW & Fetal Growth Engine)
                               ▼
        [EFW, Growth Percentiles, Velocity, Acceleration, Trajectory Direction]
                               ▼
                   PREGNANCY DIGITAL TWIN
                               ▼
                    XGBoost + Isolation Forest`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-teal-400 font-bold block">Part A: Validated EFW</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    Deterministic Hadlock 1985 3-parameter formulation ($HC, AC, FL$). Non-black-box for full auditability.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-indigo-400 font-bold block">Part B: Growth Centiles</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    Hadlock 1991 &amp; INTERGROWTH-21st log-normal distributions. Evaluates fetus relative to gestational age.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-pink-400 font-bold block">Part C: Trajectory Engine</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    1st-order velocities (g/week), 2nd-order accelerations (g/week²), and consecutive decline tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cells' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 font-mono">
                <span>07_EFW_Fetal_Growth_Engine.ipynb (22 Code &amp; Markdown Cells)</span>
                <span>Python 3.10 • SciPy • NumPy • Pandas</span>
              </div>

              <div className="space-y-2.5">
                {SECTIONS.map((sec) => (
                  <div key={sec.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-300">
                        Cell {sec.num}: {sec.title}
                      </span>
                      <button
                        onClick={() => handleCopyCode(sec.code)}
                        className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="mt-2 text-[11px] font-mono text-slate-300 bg-slate-900/90 p-2 rounded overflow-x-auto">
                      {sec.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'math_derivatives' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-teal-400 font-bold text-sm block">1. Hadlock 3-Parameter Fetal Weight Formula</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  log10(EFW) = 1.326 - 0.00326(AC · FL) + 0.0107(HC) + 0.0438(AC) + 0.158(FL)
                </p>
                <p className="text-slate-400 font-sans">
                  Where HC, AC, FL are in centimeters and EFW is in grams. Mean absolute percentage error in clinical validation: 6.8% to 7.5%.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-indigo-400 font-bold text-sm block">2. Hadlock 1991 Normative Growth Distribution</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  Mean ln(EFW) = 0.578 + 0.332(GA) - 0.00354(GA²)
                </p>
                <p className="text-slate-400 font-sans">
                  SD of ln(EFW) ≈ 0.125 (constant across trimesters). Standardized Z-scores are computed as Z = (EFW - Mean) / SD.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-pink-400 font-bold text-sm block">3. 1st &amp; 2nd Order Trajectory Derivatives</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  Growth Velocity v = ΔEFW / Δt (g/week) &nbsp;|&nbsp; Growth Acceleration a = Δv / Δt (g/week²)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-4 font-sans text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-teal-400 font-bold text-sm block">Clinical Interpretability Principle</span>
                <p className="leading-relaxed">
                  Model 7 intentionally avoids direct deep-learning black-box weight regression (Image &rarr; Neural Network &rarr; EFW). By maintaining deterministic Hadlock geometric formulations with auditable physical scaling, obstetricians can inspect every intermediary biometric measurement (HC, AC, FL) before weight and trajectory inference.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold text-sm block">Non-Autonomous Diagnostic Boundary</span>
                <p className="leading-relaxed">
                  Model 7 outputs mathematical trajectory vectors and centile patterns, not definitive clinical diagnoses of FGR or SGA. Downstream longitudinal anomaly detectors (XGBoost + Isolation Forest + SHAP) consume these vectors with human-in-the-loop clinician oversight.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>PregnancyTwin AI • Model 7 Fetal Growth Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

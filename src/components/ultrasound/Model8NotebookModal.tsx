/**
 * PregnancyTwin AI - MODEL 8: AFI / Amniotic Fluid Longitudinal Engine Modal
 * Displays the 20-Section Google Colab Fluid Trajectory Notebook, 4-Quadrant calculations,
 * 1st/2nd order derivatives, and linear trend slopes.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  Droplets,
  TrendingDown,
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

interface Model8NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const Model8NotebookModal: React.FC<Model8NotebookModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cells' | 'math_derivatives' | 'governance'>('overview');

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/fluid/notebook';
    if (showToast) showToast('Downloading 08_AFI_Amniotic_Fluid_Longitudinal_Engine.ipynb...');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (showToast) showToast('Code snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const SECTIONS = [
    { num: 1, title: 'Imports & Dependencies', code: 'import numpy as np, pandas as pd, matplotlib.pyplot as plt, math, json, sys' },
    { num: 2, title: 'Master Fluid Configuration', code: 'FLUID_CONFIG = {\n  "afi_reference": "Moore & Cayle (1990)",\n  "normal_range_cm": [8.0, 24.0],\n  "oligo_threshold_cm": 5.0\n}' },
    { num: 3, title: 'Load Longitudinal Pregnancy Dataset', code: '# 4-Quadrant AFI and DVP multi-visit records' },
    { num: 4, title: 'Validate AFI & DVP Measurements', code: 'def validate_fluid(v):\n    # Preserves None for missing (never replaces with 0)\n    return (0.0 <= v["afi_cm"] <= 45.0)' },
    { num: 5, title: 'Handle Missing Values (None vs 0)', code: '# Absence of Doppler/DVP preserved as None' },
    { num: 6, title: 'Sort Visits Chronologically', code: 'sorted_visits = sorted(visits, key=lambda v: v["gestational_age_days"])' },
    { num: 7, title: 'Calculate Interval Time Gaps', code: 'time_gap_days = curr_days - prev_days' },
    { num: 8, title: 'Previous AFI Tracking', code: 'curr["previous_afi_cm"] = prev["afi_cm"]' },
    { num: 9, title: 'AFI Delta (ΔAFI in cm)', code: 'delta_afi = round(curr_afi - prev_afi, 1)' },
    { num: 10, title: 'AFI Percentage Change', code: 'pct_change = round((delta_afi / prev_afi) * 100.0, 1)' },
    { num: 11, title: 'AFI Velocity (cm/day & cm/week)', code: 'vel_week = round(delta_afi / (time_gap_days / 7.0), 2)' },
    { num: 12, title: 'AFI Acceleration (cm/week²)', code: 'acceleration = round((curr_vel - prev_vel) / time_gap_weeks, 2)' },
    { num: 13, title: 'Rolling AFI (3-Scan Window)', code: 'rolling_mean = np.mean([v["afi_cm"] for v in recent_visits])' },
    { num: 14, title: 'AFI Multi-Scan Linear Trend Slope', code: 'slope, intercept = np.polyfit(ga_weeks, afi_values, 1)' },
    { num: 15, title: 'DVP Longitudinal Features', code: 'dvp_delta = curr_dvp - prev_dvp\ndvp_velocity = dvp_delta / time_gap_weeks' },
    { num: 16, title: 'Consecutive Decline Tracking', code: 'consecutive_declines = count_sequential_drops(afi_scans)' },
    { num: 17, title: 'Data Quality Auditing', code: 'quality_status = "GOOD" if (has_afi and has_dvp) else "PARTIAL"' },
    { num: 18, title: 'Visualize Fluid Trajectory & Trendline', code: 'plt.axhspan(8, 24, alpha=0.15, label="Normal Band")\nplt.plot(gas, afis, "-o", label="Patient AFI")' },
    { num: 19, title: 'Export Longitudinal Fluid Feature Table', code: 'df_fluid.to_csv("longitudinal_amniotic_fluid_features.csv", index=False)' },
    { num: 20, title: 'Multimodal Fusion with Model 7 Growth', code: 'fused_vector = {**growth_features, **fluid_features}' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  MODEL 8 NOTEBOOK
                </span>
                <h2 className="text-lg font-bold text-slate-100">
                  AFI &amp; Amniotic Fluid Longitudinal Engine
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                20-Cell Google Colab Training Notebook (AFI / DVP Dynamics, Velocity Derivatives &amp; Linear Trend Slopes)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
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
                ? 'border-sky-400 text-sky-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Architecture
          </button>
          <button
            onClick={() => setActiveTab('cells')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'cells'
                ? 'border-sky-400 text-sky-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            20 Colab Notebook Cells
          </button>
          <button
            onClick={() => setActiveTab('math_derivatives')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'math_derivatives'
                ? 'border-sky-400 text-sky-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Fluid Dynamics Mathematics
          </button>
          <button
            onClick={() => setActiveTab('governance')}
            className={`py-3 px-4 border-b-2 font-mono transition ${
              activeTab === 'governance'
                ? 'border-sky-400 text-sky-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Safety &amp; Missingness
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6 text-sm text-slate-300 font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                <span className="text-sky-400 font-bold block mb-2">MODEL 7 (GROWTH) + MODEL 8 (FLUID) MULTIMODAL FUSION</span>
                <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`MODEL 7: FETAL GROWTH TRAJECTORY          MODEL 8: AMNIOTIC FLUID ENGINE
  ├── EFW (g) + Centile (Hadlock)           ├── 4-Quadrant AFI (cm)
  ├── Growth Velocity (g/week)              ├── Single Deepest Pocket DVP (cm)
  ├── Growth Acceleration (g/wk²)           ├── AFI Velocity (cm/week & cm/day)
  └── Consecutive Declining Centiles        ├── Linear Trend Slope (β₁)
                    │                                 │
                    └───────────────┬─────────────────┘
                                    ▼
                         PREGNANCY DIGITAL TWIN
                                    ▼
                         XGBOOST + ISOLATION FOREST
                                    ▼
                              SHAP EXPLANATION`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sky-400 font-bold block">4-Quadrant AFI</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    Q1 + Q2 + Q3 + Q4 volumetric sum with physiological plausibility validation (8.0 – 24.0 cm).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-indigo-400 font-bold block">DVP / SDP Tracking</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    Maintains Deepest Vertical Pocket as an independent clinical indicator without synthetic fabrication.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-teal-400 font-bold block">Slope &amp; Velocity</span>
                  <p className="text-slate-400 mt-1 font-sans text-xs">
                    Distinguishes recent change (velocity: cm/wk) from multi-scan trajectories (linear slope: β₁).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cells' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 font-mono">
                <span>08_AFI_Amniotic_Fluid_Longitudinal_Engine.ipynb (20 Code &amp; Markdown Cells)</span>
                <span>Python 3.10 • SciPy • NumPy • Pandas</span>
              </div>

              <div className="space-y-2.5">
                {SECTIONS.map((sec) => (
                  <div key={sec.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-sky-300">
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
                <span className="text-sky-400 font-bold text-sm block">1. AFI Delta &amp; Percentage Change</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  AFI_delta = AFI_current - AFI_previous (cm) &nbsp;|&nbsp; AFI_%_change = (AFI_delta / AFI_previous) * 100
                </p>
                <p className="text-slate-400 font-sans">
                  Captures normalized relative volume alteration across sequential prenatal evaluations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-teal-400 font-bold text-sm block">2. First &amp; Second Order Fluid Derivatives</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  AFI Velocity v = ΔAFI / Δt (cm/week) &nbsp;|&nbsp; AFI Acceleration a = Δv / Δt (cm/week²)
                </p>
                <p className="text-slate-400 font-sans">
                  Distinguishes linear fluid decline from accelerating volume depletion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-pink-400 font-bold text-sm block">3. Multi-Scan Linear Trend Slope (β₁)</span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded">
                  β₁ = Σ[(t_i - t_mean)(AFI_i - AFI_mean)] / Σ[(t_i - t_mean)²] (cm/week)
                </p>
                <p className="text-slate-400 font-sans">
                  Least-squares regression slope provides resilience against single-scan measurement variance.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-4 font-sans text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-sky-400 font-bold text-sm block">Missing Value Governance: None vs 0</span>
                <p className="leading-relaxed">
                  In amniotic fluid analysis, a value of 0.0 cm represents complete anhydramnios (a critical obstetric emergency), whereas missing measurements must be recorded as <code>null</code>. Model 8 enforces strict null-safety so that unavailable scans never generate false anhydramnios alerts or fabricated Doppler values.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold text-sm block">Non-Autonomous Decision Support</span>
                <p className="leading-relaxed">
                  Model 8 derives mathematical trajectory slopes and volume velocities to empower obstetricians. It does not output autonomous diagnoses of oligohydramnios or polyhydramnios.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>PregnancyTwin AI • Model 8 Amniotic Fluid Engine</span>
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

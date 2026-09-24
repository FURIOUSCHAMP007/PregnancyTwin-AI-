/**
 * PregnancyTwin AI - MODEL 9: Maternal & Clinical Context Engine Modal
 * Displays the 20-Section Google Colab Notebook, 6 Sub-Engines, Vitals/Labs Trajectories,
 * and 34-feature fusion representation for Model 10.
 */

import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  User,
  Heart,
  Pill,
  History,
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

interface Model9NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const Model9NotebookModal: React.FC<Model9NotebookModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cells' | 'sub_engines' | 'governance'>('overview');

  if (!isOpen) return null;

  const handleDownload = () => {
    window.location.href = '/api/maternal/notebook';
    if (showToast) showToast('Downloading 09_Maternal_Clinical_Context_Engine.ipynb...');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (showToast) showToast('Code snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const SECTIONS = [
    { num: 1, title: 'Imports & Dependencies', code: 'import numpy as np, pandas as pd, matplotlib.pyplot as plt, math, json, sys' },
    { num: 2, title: 'Master Context Configuration', code: 'MODEL_9_CONFIG = {\n  "normal_ranges": {"sbp_mmHg": [90, 135], "dbp_mmHg": [60, 85]},\n  "missingness_threshold": 0.70\n}' },
    { num: 3, title: 'Load Longitudinal Patient History', code: '# 3-visit sequential records for PT-001 (GA 24w, 28w, 32w)' },
    { num: 4, title: 'Sub-Engine 9A: Baseline Demographics', code: 'def process_baseline_demographics(age, gravidity, parity, is_ivf, is_twin): ...' },
    { num: 5, title: 'Sub-Engine 9B: Maternal Vitals Trajectory', code: 'def compute_vital_trajectories(curr, prev): ... # SBP/DBP velocity & MAP' },
    { num: 6, title: 'Sub-Engine 9B: Laboratory Trajectory', code: 'def compute_lab_trajectories(curr, prev): ... # Hb & Platelet/Hb ratio' },
    { num: 7, title: 'Sub-Engine 9C: Obstetric Background Vectors', code: 'def encode_obstetric_history(fgr, ptb, stillbirth, pe, chronic_htn): ...' },
    { num: 8, title: 'Sub-Engine 9D: Medication Dynamics', code: 'def analyze_medication_dynamics(curr_meds, prev_meds): ... # Prescriptions count' },
    { num: 9, title: 'Sub-Engine 9E: Clinical Events & Gemini OCR', code: '# Inter-visit hospitalizations, OGTT lab events, and emergency encounters' },
    { num: 10, title: 'Sub-Engine 9F: Temporal Pacing & Visit Spacing', code: 'def analyze_temporal_spacing(curr_ga, prev_ga): ... # Gap > 42d flag' },
    { num: 11, title: 'Previous-Value Feature Engineering', code: 'df_visits["prev_sbp"] = df_visits["sbp"].shift(1)' },
    { num: 12, title: '1st-Order Delta Features', code: 'df_visits["sbp_delta"] = df_visits["sbp"] - df_visits["prev_sbp"]' },
    { num: 13, title: 'Longitudinal Velocities (per week)', code: 'df_visits["sbp_velocity_wk"] = df_visits["sbp_delta"] / df_visits["ga_delta_weeks"]' },
    { num: 14, title: 'Multi-Visit OLS Trend Slopes (beta_1)', code: 'sbp_slope = sum((w - mean_w)*(s - mean_s)) / sum((w - mean_w)**2)' },
    { num: 15, title: 'Data Quality & Completeness Audit', code: 'completeness = sum(1 for k in keys if record[k] is not None) / len(keys)' },
    { num: 16, title: 'Feature Preprocessing for XGBoost', code: '# Native physiological scales preserved for clinical SHAP interpretability' },
    { num: 17, title: '34-Feature Vector Construction', code: 'maternal_vector = { ... } # Continuous + Binary flags' },
    { num: 18, title: 'Multimodal Fusion with Models 7 & 8', code: 'fused_vector = {**model_7_growth, **model_8_fluid, **maternal_vector}' },
    { num: 19, title: 'Visualizing Maternal Trajectories', code: 'plt.plot(df_visits["ga_weeks"], df_visits["sbp"])' },
    { num: 20, title: 'Governance & Output Contract', code: 'governance_notice = {"is_diagnostic": False, "role": "Feature Engineering"}' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-indigo-400">MODEL 9 ENGINE NOTEBOOK</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  20 Sections • 6 Sub-Engines
                </span>
              </div>
              <h2 className="text-base font-black text-white">
                09_Maternal_Clinical_Context_Engine.ipynb
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ipynb</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-2 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sub_engines')}
            className={`pb-2.5 px-2 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'sub_engines' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            6 Sub-Engines (9A–9F)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cells')}
            className={`pb-2.5 px-2 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'cells' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Notebook Code Cells (1–20)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('governance')}
            className={`pb-2.5 px-2 border-b-2 font-semibold transition cursor-pointer ${
              activeTab === 'governance' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Governance
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-indigo-200 text-xs leading-relaxed">
                <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Model 9 Multimodal Feature Extraction Pipeline
                </p>
                Model 9 converts maternal demographics, blood pressure trajectories, weight velocities, lab profiles, obstetric background flags, and prescription dynamics into structured numerical vectors for downstream tree ensemble models (XGBoost / Isolation Forest).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-bold">1. Demographic Baseline</div>
                  <div className="text-slate-400 text-[11px]">Age, Gravidity, Parity, IVF, Singleton vs. Twins.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-purple-400 font-bold">2. Longitudinal Vitals</div>
                  <div className="text-slate-400 text-[11px]">SBP/DBP velocities, MAP, pulse pressure, weight accretion.</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">3. Multimodal Fusion</div>
                  <div className="text-slate-400 text-[11px]">Fuses with M7 (Growth) and M8 (Fluid) for Model 10.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sub_engines' && (
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-indigo-400">9A: Maternal Baseline Engine</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Demographics, age, gravidity, parity, conception method, plurality.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 text-[10px]">Deterministic</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-purple-400">9B: Maternal Vital &amp; Lab Engine</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Blood pressure trajectories, weight velocity, HR, core temperature, Hb, platelets.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 text-[10px]">1st/2nd Derivatives</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-pink-400">9C: Pregnancy History Engine</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Prior FGR, preterm birth, stillbirth, preeclampsia, chronic HTN, smoking.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-pink-900/50 text-pink-300 text-[10px]">Binary Vector</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-amber-400">9D: Medication Context Engine</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Active prescriptions, start/stop tracking, indications, count changes.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 text-[10px]">Temporal Context</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-cyan-400">9E: Clinical Events Engine</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Chronological ordering of hospitalizations, acute triage encounters, OGTT labs.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 text-[10px]">Gemini Structured</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <strong className="text-emerald-400">9F: Temporal Context &amp; Quality Audit</strong>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Visit spacing, gap analysis (&gt;42d), missingness flags, data completeness score.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 text-[10px]">Quality Gate</span>
              </div>
            </div>
          )}

          {activeTab === 'cells' && (
            <div className="space-y-3 font-mono text-xs">
              {SECTIONS.map((sec) => (
                <div key={sec.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">
                      Section {sec.num}: {sec.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(sec.code)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy code snippet"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <pre className="p-2 rounded-lg bg-slate-900 text-slate-300 text-[11px] overflow-x-auto border border-slate-800/80">
                    {sec.code}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Clinical Governance &amp; Non-Diagnostic Protocol</span>
                </div>
                <p>
                  Model 9 is explicitly designed as a <strong>feature engineering and temporal context layer</strong>. It does not output standalone medical diagnoses of preeclampsia, gestational hypertension, or anemia. All extracted maternal features are passed downstream into Model 10 for explainable multi-modal risk stratification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">PregnancyTwin AI • Model 9 Colab Suite</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

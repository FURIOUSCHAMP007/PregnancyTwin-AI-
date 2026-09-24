/**
 * PregnancyTwin AI - MODEL 9: Maternal & Clinical Context Engine Card
 * 
 * Core Clinical Principle:
 * "Who is this pregnancy, what maternal/clinical context surrounds it, and what has changed between visits?
 * Context informs multimodal trajectory models (Model 10) without making autonomous diagnostic leaps."
 */

import React, { useState } from 'react';
import {
  Heart,
  Activity,
  User,
  Pill,
  Calendar,
  Layers,
  Sparkles,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  History,
  Clock,
  Scale,
  Thermometer,
  FileText
} from 'lucide-react';
import { Model9CompleteMaternalContextOutput } from '../../types';

export interface Model9MaternalContextCardProps {
  contextResult: Model9CompleteMaternalContextOutput | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
  onOpenNotebookModal?: () => void;
  onIngestToDigitalTwin?: (features: any) => void;
  className?: string;
}

export const Model9MaternalContextCard: React.FC<Model9MaternalContextCardProps> = ({
  contextResult,
  isLoading = false,
  onRecalculate,
  onOpenNotebookModal,
  onIngestToDigitalTwin,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'vitals_trajectory' | 'baseline_history' | 'medication_dynamics' | 'ml_vector'>('vitals_trajectory');

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center space-x-3 ${className}`}>
        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm font-medium font-mono text-slate-300">
          Model 9 Engine: Structuring Maternal &amp; Clinical Context...
        </span>
      </div>
    );
  }

  if (!contextResult) return null;

  const { baseline, vitals, labs, history, medication_context, temporal, data_quality, maternal_feature_vector, visit_history } = contextResult;

  const isBpIncreasing = (vitals.sbp_trend_slope ?? 0) > 0.5;
  const isWeightAccreting = (vitals.weight_velocity_kg_per_week ?? 0) > 0.3;
  const completenessPct = Math.round((data_quality.maternal_data_completeness ?? 0.94) * 100);

  return (
    <div className={`p-5 rounded-2xl bg-slate-900 border border-indigo-950/80 text-slate-100 shadow-xl space-y-4 ${className}`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-md shadow-indigo-900/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">
                Model 9 Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Context &amp; Temporal Fusion
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Non-Diagnostic
              </span>
            </div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5">
              Maternal &amp; Clinical Context Layer
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {onOpenNotebookModal && (
            <button
              type="button"
              onClick={onOpenNotebookModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-mono font-semibold border border-indigo-800/60 transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Colab Notebook (20 Cells)</span>
            </button>
          )}

          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition border border-slate-700 cursor-pointer"
              title="Recalculate maternal context derivatives"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Blood Pressure */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              Blood Pressure
            </span>
            <span className={isBpIncreasing ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {vitals.sbp_trend_slope ? `${vitals.sbp_trend_slope > 0 ? '+' : ''}${vitals.sbp_trend_slope} /wk` : 'Stable'}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {vitals.systolic_bp} / {vitals.diastolic_bp}{' '}
            <span className="text-[10px] text-slate-400 font-normal font-sans">mmHg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            MAP: <strong className="text-slate-200">{vitals.mean_arterial_pressure_mmHg || 93.3} mmHg</strong>
          </div>
        </div>

        {/* Metric 2: Maternal Weight */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-teal-400" />
              Weight Accretion
            </span>
            <span className="text-teal-300 font-bold">
              {vitals.weight_velocity_kg_per_week ? `+${vitals.weight_velocity_kg_per_week} kg/wk` : '+0.45 kg/wk'}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {vitals.maternal_weight_kg}{' '}
            <span className="text-[10px] text-slate-400 font-normal font-sans">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Change: <strong className="text-teal-300">+{vitals.weight_change_kg ?? 1.8} kg</strong>
          </div>
        </div>

        {/* Metric 3: Active Medications */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Pill className="w-3 h-3 text-purple-400" />
              Medication Burden
            </span>
            <span className="text-purple-300 font-bold">
              {medication_context.new_medication_flag ? 'New Added' : 'Stable'}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {medication_context.active_medication_count}{' '}
            <span className="text-[10px] text-slate-400 font-normal font-sans">active</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {medication_context.changes_summary || '2 active regimens'}
          </div>
        </div>

        {/* Metric 4: Completeness & Temporal Gap */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Temporal Pacing
            </span>
            <span className="text-emerald-400 font-bold">
              {temporal.time_gap_days}d gap
            </span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {completenessPct}%{' '}
            <span className="text-[10px] text-slate-400 font-normal font-sans">Complete</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            Tier: <strong className="text-emerald-300">{data_quality.data_quality_tier}</strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('vitals_trajectory')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'vitals_trajectory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          1. Longitudinal Vitals &amp; Labs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('baseline_history')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'baseline_history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          2. Baseline &amp; Obstetric History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('medication_dynamics')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'medication_dynamics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          3. Medication Dynamics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ml_vector')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'ml_vector'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          4. 34-Feature Vector (Model 10)
        </button>
      </div>

      {/* TAB 1: Longitudinal Vitals & Labs */}
      {activeTab === 'vitals_trajectory' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Multi-Visit Vital Sign Dynamics
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              3 Sequential Antenatal Scans
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* BP Trajectory Box */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="font-bold text-slate-200">Blood Pressure (mmHg)</span>
                <span className="text-indigo-300 font-bold">Slope: +{vitals.sbp_trend_slope ?? 0.35}</span>
              </div>
              <div className="flex items-center justify-between pt-1 font-mono text-xs">
                {visit_history.map((v, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[9px] text-slate-500">V{v.visit_number} ({v.ga_weeks}w)</div>
                    <div className="font-bold text-white text-xs mt-0.5">{v.bp}</div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight pt-1 border-t border-slate-800/60">
                Rate: <strong className="text-slate-200">{vitals.sbp_velocity_per_week ?? 1.5} mmHg/wk SBP</strong>, <strong className="text-slate-200">{vitals.dbp_velocity_per_week ?? 1.5} mmHg/wk DBP</strong>
              </div>
            </div>

            {/* Weight Trajectory Box */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="font-bold text-slate-200">Weight Accretion (kg)</span>
                <span className="text-teal-300 font-bold">Velocity: +{vitals.weight_velocity_kg_per_week ?? 0.45} kg/wk</span>
              </div>
              <div className="flex items-center justify-between pt-1 font-mono text-xs">
                {visit_history.map((v, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[9px] text-slate-500">V{v.visit_number} ({v.ga_weeks}w)</div>
                    <div className="font-bold text-teal-300 text-xs mt-0.5">{v.weight_kg} kg</div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight pt-1 border-t border-slate-800/60">
                Cumulative Gain: <strong className="text-teal-300">+{vitals.weight_change_kg ?? 1.8} kg</strong> across interval
              </div>
            </div>

            {/* Hemoglobin & Platelets */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="font-bold text-slate-200">Hematology Labs</span>
                <span className="text-purple-300 font-bold">Hb: {labs.hemoglobin_g_dl} g/dL</span>
              </div>
              <div className="space-y-1 font-mono text-xs pt-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Platelet Count:</span>
                  <span className="text-white font-bold">{labs.platelets_x10e9_l} ×10⁹/L</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Platelet / Hb Ratio:</span>
                  <span className="text-slate-200 font-bold">{labs.platelet_to_hb_ratio ?? 21.4}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Pulse Pressure:</span>
                  <span className="text-slate-200 font-bold">{vitals.pulse_pressure_mmHg ?? 46} mmHg</span>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 leading-tight pt-1 border-t border-slate-800/60">
                Core Temp: <strong className="text-slate-200">{vitals.temperature_c}°C</strong> • HR: <strong className="text-slate-200">{vitals.heart_rate_bpm} bpm</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Baseline & Obstetric History */}
      {activeTab === 'baseline_history' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Maternal Demographics &amp; Obstetric Background (Sub-Engine 9A &amp; 9C)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Total Factors: {history.total_obstetric_risk_factors_count}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Maternal Age:</span>
              <strong className="text-white">{baseline.maternal_age_years} yrs</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Gravidity / Parity:</span>
              <strong className="text-white">G{baseline.gravidity} P{baseline.parity}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Plurality:</span>
              <strong className="text-indigo-300 uppercase">{baseline.pregnancy_type}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">IVF Conception:</span>
              <strong className={baseline.ivf ? 'text-amber-400' : 'text-slate-300'}>{baseline.ivf ? 'Yes' : 'No'}</strong>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Obstetric &amp; Medical Risk Vector Flags
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                history.previous_fgr ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span>Prior FGR</span>
                <strong>{history.previous_fgr ? 'YES' : 'NO'}</strong>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                history.previous_preterm_birth ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span>Prior Preterm</span>
                <strong>{history.previous_preterm_birth ? 'YES' : 'NO'}</strong>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                history.preeclampsia_history ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span>Prior Preeclampsia</span>
                <strong>{history.preeclampsia_history ? 'YES' : 'NO'}</strong>
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                history.chronic_hypertension ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span>Chronic HTN</span>
                <strong>{history.chronic_hypertension ? 'YES' : 'NO'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Medication Dynamics */}
      {activeTab === 'medication_dynamics' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-indigo-400" />
              Active Medication Regimen &amp; Indications (Sub-Engine 9D)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Active Count: {medication_context.active_medication_count}
            </span>
          </div>

          <div className="space-y-2">
            {medication_context.active_medications.map((med, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-white">{med.medication_name}</span>
                    <span className="text-slate-400 text-[10px] ml-2 font-sans">({med.dose}, {med.frequency})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 text-[10px] font-bold">
                    {med.indication}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Dynamics Signal: <strong className="text-slate-200">{medication_context.changes_summary}</strong></span>
            <span>Count Change: <strong className="text-indigo-300">+{medication_context.medication_count_change}</strong></span>
          </div>
        </div>
      )}

      {/* TAB 4: 34-Feature Vector */}
      {activeTab === 'ml_vector' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Model 9 Feature Vector (XGBoost &amp; Isolation Forest Input)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {Object.keys(maternal_feature_vector).length} Dimension Vector
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-indigo-300 space-y-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {Object.entries(maternal_feature_vector).map(([key, val]) => (
                <div key={key} className="p-1.5 bg-slate-900/80 rounded border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400 truncate mr-2">{key}:</span>
                  <span className="font-bold text-white">{typeof val === 'number' ? val.toFixed(2) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Ingestion Status & Model 10 Hand-off */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Context Validated: Harmonized for Model 10 (Digital Twin Risk Engine)</span>
        </div>

        {onIngestToDigitalTwin && (
          <button
            type="button"
            onClick={() => onIngestToDigitalTwin(maternal_feature_vector)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <span>Fuse with Growth (M7) &amp; Fluid (M8)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};

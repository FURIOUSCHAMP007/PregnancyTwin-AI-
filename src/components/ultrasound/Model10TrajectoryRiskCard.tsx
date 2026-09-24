/**
 * PregnancyTwin AI - MODEL 10: Multimodal Longitudinal Pregnancy Trajectory & Risk Engine Card
 * 
 * Core Clinical Principle:
 * "Do not evaluate pregnancy risk from one isolated measurement.
 * Evaluate the joint trajectory of fetal growth, amniotic fluid, maternal context and data quality across visits."
 * 
 * Machine Learning Stack:
 * - XGBoost Multi-Class Classifier (STABLE / MONITOR / ATTENTION)
 * - Isolation Forest Unsupervised Anomaly Detector
 * - TreeExplainer SHAP Feature Attribution
 * - Gemini Structured Clinical Communication
 */

import React, { useState } from 'react';
import {
  Brain,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Info,
  CheckCircle2,
  Sliders,
  Layers,
  BarChart3,
  Flame,
  ArrowRight,
  Eye,
  Radio,
  FileText
} from 'lucide-react';
import { Model10CompleteTrajectoryOutput } from '../../types';

export interface Model10TrajectoryRiskCardProps {
  trajectoryResult: Model10CompleteTrajectoryOutput | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
  onOpenNotebookModal?: () => void;
  onConfirmDecision?: (trajectoryState: string) => void;
  className?: string;
}

export const Model10TrajectoryRiskCard: React.FC<Model10TrajectoryRiskCardProps> = ({
  trajectoryResult,
  isLoading = false,
  onRecalculate,
  onOpenNotebookModal,
  onConfirmDecision,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'shap_waterfall' | 'group_importance' | 'gemini_narrative' | 'fused_vector'>('shap_waterfall');

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center space-x-3 ${className}`}>
        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-sm font-medium font-mono text-slate-300">
          Model 10 Engine: Fusing Multimodal Trajectories &amp; Computing SHAP Attributions...
        </span>
      </div>
    );
  }

  if (!trajectoryResult) return null;

  const { trajectory, anomaly, explainability, gemini_narrative, data_quality, fused_feature_vector, model_metadata } = trajectoryResult;

  const isAttention = trajectory.state === 'ATTENTION';
  const isMonitor = trajectory.state === 'MONITOR';
  const isStable = trajectory.state === 'STABLE';

  const stateBgColor = isAttention
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
    : isMonitor
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';

  const stateBadgeColor = isAttention
    ? 'bg-rose-500 text-white'
    : isMonitor
    ? 'bg-amber-500 text-slate-950'
    : 'bg-emerald-500 text-slate-950';

  return (
    <div className={`p-5 rounded-2xl bg-slate-900 border-2 ${
      isAttention ? 'border-rose-600/80 shadow-rose-950/40' : (isMonitor ? 'border-amber-600/80 shadow-amber-950/40' : 'border-emerald-600/80 shadow-emerald-950/40')
    } text-slate-100 shadow-2xl space-y-4 ${className}`}>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl shadow-md ${
            isAttention
              ? 'bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-rose-900/40'
              : isMonitor
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-amber-900/40'
              : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-900/40'
          }`}>
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">
                Model 10 Master Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                XGBoost + Isolation Forest + SHAP
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Patient-Grouped Split
              </span>
            </div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5 mt-0.5">
              Multimodal Longitudinal Pregnancy Trajectory &amp; Risk Intelligence
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
              <span>Colab Notebook (26 Cells)</span>
            </button>
          )}

          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition border border-slate-700 cursor-pointer"
              title="Recalculate Model 10 Trajectory State"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Trajectory State Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Left: Primary Trajectory State & Probability Gauge */}
        <div className={`lg:col-span-7 p-4 rounded-xl border ${stateBgColor} flex flex-col justify-between space-y-3`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Primary Longitudinal Trajectory State
              </span>
              <div className="flex items-center space-x-2.5">
                <span className={`px-3 py-1 rounded-lg text-sm font-black font-mono tracking-wider shadow-sm ${stateBadgeColor}`}>
                  {trajectory.state}
                </span>
                <span className="text-xl font-black font-mono text-white">
                  {Math.round(trajectory.primary_probability * 100)}%{' '}
                  <span className="text-xs font-normal text-slate-400 font-sans">Model Probability</span>
                </span>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase block">Confidence Tier</span>
              <span className="font-bold text-white">{trajectory.confidence_tier.replace('_', ' ')}</span>
            </div>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {trajectory.state_description}
          </p>

          {/* Softmax Probability Distribution Bar */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60 font-mono text-[10px]">
            <div className="flex justify-between text-slate-400 pb-0.5">
              <span>Stable: {Math.round(trajectory.probabilities.stable * 100)}%</span>
              <span>Monitor: {Math.round(trajectory.probabilities.monitor * 100)}%</span>
              <span>Attention: {Math.round(trajectory.probabilities.attention * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex">
              <div
                style={{ width: `${trajectory.probabilities.stable * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Stable: ${Math.round(trajectory.probabilities.stable * 100)}%`}
              />
              <div
                style={{ width: `${trajectory.probabilities.monitor * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Monitor: ${Math.round(trajectory.probabilities.monitor * 100)}%`}
              />
              <div
                style={{ width: `${trajectory.probabilities.attention * 100}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Attention: ${Math.round(trajectory.probabilities.attention * 100)}%`}
              />
            </div>
          </div>
        </div>

        {/* Right: Isolation Forest Anomaly Radar & Data Quality Gate */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
          {/* Anomaly Detection Box */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-1.5 ${
            anomaly.is_unusual
              ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                Isolation Forest Anomaly Status
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                anomaly.is_unusual ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {anomaly.status}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-white">
              Score: {anomaly.anomaly_score.toFixed(3)}{' '}
              <span className="text-[10px] font-normal text-slate-400">(Threshold: 0.00)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {anomaly.details}
            </p>
          </div>

          {/* Quality Gate Status Box */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Pre-Inference Quality Gate
              </span>
              <span className="text-emerald-400 font-bold">
                {Math.round(data_quality.completeness_score * 100)}% Complete
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300">
              Quality Tier: <strong className="text-white">{data_quality.status}</strong> • Confidence: <strong className="text-teal-300">{Math.round(data_quality.measurement_confidence * 100)}%</strong>
            </div>
            <span className="text-[9px] text-slate-400">
              Verified inputs from Models 1–9. Ready for clinician decision support.
            </span>
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('shap_waterfall')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'shap_waterfall'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          1. SHAP Feature Attribution
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('group_importance')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'group_importance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          2. Feature Group Aggregation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gemini_narrative')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'gemini_narrative'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          3. Gemini Clinician Narrative
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fused_vector')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'fused_vector'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          4. Complete 36-Feature Vector
        </button>
      </div>

      {/* TAB 1: SHAP Feature Attribution Waterfall */}
      {activeTab === 'shap_waterfall' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              Patient-Specific SHAP Local Feature Attributions
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Base Value: 0.00 • Output Margin: {explainability.shap_sum}
            </span>
          </div>

          <div className="space-y-2">
            {explainability.top_contributors.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{c.label}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {c.featureGroup}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Observed: <strong className="text-slate-200">{c.rawValue}</strong> — {c.clinicalInterpretation}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    c.direction === 'escalating' ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  }`}>
                    {c.contribution > 0 ? `+${c.contribution.toFixed(3)}` : c.contribution.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {c.direction === 'escalating' ? 'Escalating' : 'Protective'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Feature Group Importance Aggregation */}
      {activeTab === 'group_importance' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Multi-Modal Pillar Contribution Summary
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              6 Analytical Feature Groups
            </span>
          </div>

          <div className="space-y-2.5">
            {explainability.group_contributions.map((g, idx) => (
              <div key={idx} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white font-bold capitalize">{g.group.replace('_', ' ')}</span>
                  <span className="text-indigo-300 font-bold">{g.percentage}% Contribution</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${g.percentage}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Top Influencer: {g.topFeature}</span>
                  <span>Abs SHAP Sum: {g.totalContribution.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Gemini Clinician Narrative */}
      {activeTab === 'gemini_narrative' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Gemini Structured Communication Copilot
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              Non-Diagnostic Review Contract
            </span>
          </div>

          <div className="space-y-2 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/60 font-medium text-indigo-200">
              {gemini_narrative.headline}
            </div>

            <p className="text-slate-300 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-sans">
              {gemini_narrative.clinical_communication}
            </p>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Recommended Sonographic Focus Areas:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300 font-sans list-disc list-inside">
                {gemini_narrative.recommended_sonographic_focus.map((rec, i) => (
                  <li key={i} className="text-slate-300">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Complete 36-Feature Vector */}
      {activeTab === 'fused_vector' && (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Fused Invariant Feature Vector (36 Dimensions)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Model 10 Input Matrix
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono text-indigo-300 space-y-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {Object.entries(fused_feature_vector).map(([k, v]) => (
                <div key={k} className="p-1.5 bg-slate-900/80 rounded border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400 truncate mr-2">{k}:</span>
                  <span className="font-bold text-white">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions & Human-in-the-Loop Audit */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Model Accuracy: {model_metadata.test_accuracy_pct}% (Test F1: {model_metadata.test_f1_pct}%) • Clinician Verification Required</span>
        </div>

        {onConfirmDecision && (
          <button
            type="button"
            onClick={() => onConfirmDecision(trajectory.state)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition shadow-sm cursor-pointer ${
              isAttention
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : isMonitor
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>Commit {trajectory.state} Trajectory to Digital Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};

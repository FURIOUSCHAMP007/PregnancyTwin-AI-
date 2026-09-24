/**
 * PregnancyTwin AI - MODEL 7: EFW & Fetal Growth Longitudinal Trajectory Engine Card
 * 
 * Core Clinical Principle:
 * "Do not assess fetal growth from a single measurement alone. Model how fetal growth changes across gestation."
 * 
 * Converts verified biometry (HC, AC, FL) into validated EFW (Hadlock 3-param),
 * calculates normative growth percentiles, first-order velocities (g/wk), second-order
 * accelerations (g/wk²), rolling trajectory features, and consecutive decline tracking.
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Ruler,
  Scale,
  Sparkles,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Clock,
  Sliders
} from 'lucide-react';
import { Model7CompleteGrowthOutput } from '../../types';

export interface Model7GrowthTrajectoryCardProps {
  growthResult: Model7CompleteGrowthOutput | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
  onOpenNotebookModal?: () => void;
  onIngestToDigitalTwin?: (features: any) => void;
  className?: string;
}

export const Model7GrowthTrajectoryCard: React.FC<Model7GrowthTrajectoryCardProps> = ({
  growthResult,
  isLoading = false,
  onRecalculate,
  onOpenNotebookModal,
  onIngestToDigitalTwin,
  className = ''
}) => {
  const [selectedStandard, setSelectedStandard] = useState<'HADLOCK_1991' | 'INTERGROWTH_21ST' | 'WHO_FETAL_GROWTH'>('HADLOCK_1991');
  const [activeTab, setActiveTab] = useState<'trajectory_chart' | 'derivatives_matrix' | 'ml_vector'>('trajectory_chart');

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center space-x-3 ${className}`}>
        <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
        <span className="text-sm font-medium font-mono text-slate-300">
          Model 7: Computing Fetal Weight &amp; Longitudinal Growth Trajectory...
        </span>
      </div>
    );
  }

  if (!growthResult || !growthResult.efw?.value_g) {
    return (
      <div className={`p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-400">
                MODEL 7 — EFW &amp; GROWTH ENGINE
              </span>
              <h3 className="text-sm font-bold text-white">Longitudinal Fetal Growth Trajectory</h3>
            </div>
          </div>
          {onOpenNotebookModal && (
            <button
              onClick={onOpenNotebookModal}
              className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>22-Cell Notebook</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Awaiting verified biometric measurements (HC, AC, FL) from Model 6 to calculate Estimated Fetal Weight and longitudinal growth velocity.
        </p>
      </div>
    );
  }

  const { efw, growth, trajectory, longitudinal_feature_vector, inputs, visit_history } = growthResult;
  const isDeclining = trajectory.trajectory_direction === 'DECLINING' || trajectory.trajectory_direction === 'RAPID_DECLINE';
  const isIncreasing = trajectory.trajectory_direction === 'INCREASING' || trajectory.trajectory_direction === 'RECOVERING';

  return (
    <div
      id="model-7-growth-trajectory-card"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isDeclining
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 ring-1 ring-amber-500/20'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-teal-500/30 ring-1 ring-teal-500/20'
      } ${className}`}
    >
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isDeclining
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                MODEL 7 ENGINE
              </span>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  trajectory.trajectory_direction === 'RAPID_DECLINE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : trajectory.trajectory_direction === 'DECLINING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isDeclining ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                <span>TRAJECTORY: {trajectory.trajectory_direction}</span>
              </span>
              {trajectory.consecutive_declining_visits >= 2 && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-600/50">
                  {trajectory.consecutive_declining_visits} CONSECUTIVE DECLINES
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Estimated Fetal Weight &amp; Longitudinal Growth Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-scan velocity &amp; acceleration derivatives feeding Pregnancy Digital Twin (Hadlock 1985 &amp; 1991 Standards)
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenNotebookModal && (
            <button
              onClick={onOpenNotebookModal}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>22-Cell Notebook</span>
            </button>
          )}

          {onIngestToDigitalTwin && (
            <button
              onClick={() => onIngestToDigitalTwin(longitudinal_feature_vector)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Ingest to Digital Twin</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Cards Row */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/50 border-b border-slate-800">
        
        {/* Metric 1: EFW */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1 text-teal-400 font-bold">
              <Scale className="w-3.5 h-3.5" />
              Estimated Fetal Weight
            </span>
            <span>GA {inputs.gestational_age_weeks}w</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className="text-2xl font-black text-white">{efw.value_g}</span>
              <span className="text-xs font-bold text-slate-400">grams</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Uncertainty: ±{efw.uncertainty_pct}% ({efw.confidence_interval_g[0]}g – {efw.confidence_interval_g[1]}g)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            Formula: {efw.formula_name}
          </div>
        </div>

        {/* Metric 2: Growth Percentile */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-indigo-400 font-bold">Growth Centile</span>
            <span>Z = {growth.z_score}</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span
                className={`text-2xl font-black ${
                  growth.percentile < 10.0
                    ? 'text-rose-400'
                    : growth.percentile > 90.0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {growth.percentile}
                <span className="text-sm font-bold ml-0.5">th</span>
              </span>
              <span className="text-xs text-slate-400">centile</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-300 mt-0.5">
              {growth.centile_category.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            Ref: Hadlock 1991 (Median: {growth.reference_50th_g}g)
          </div>
        </div>

        {/* Metric 3: EFW Velocity */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-teal-400 font-bold">Growth Velocity</span>
            <span>1st Order Δv</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span
                className={`text-2xl font-black ${
                  trajectory.efw_velocity_g_per_week < 140 && inputs.gestational_age_weeks >= 28
                    ? 'text-amber-400'
                    : 'text-teal-300'
                }`}
              >
                {trajectory.efw_velocity_g_per_week > 0 ? `+${trajectory.efw_velocity_g_per_week}` : trajectory.efw_velocity_g_per_week}
              </span>
              <span className="text-xs text-slate-400">g / week</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Daily rate: {trajectory.efw_velocity_g_per_day} g/day (Δt = {trajectory.time_gap_days}d)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            Rolling Vel: {trajectory.rolling_efw_velocity_g_per_week} g/wk
          </div>
        </div>

        {/* Metric 4: Acceleration & Trajectory State */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-pink-400 font-bold">Acceleration</span>
            <span>2nd Order Δa</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span
                className={`text-2xl font-black ${
                  trajectory.efw_acceleration_g_per_week2 < -15.0
                    ? 'text-rose-400'
                    : trajectory.efw_acceleration_g_per_week2 > 0
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                }`}
              >
                {trajectory.efw_acceleration_g_per_week2 > 0 ? `+${trajectory.efw_acceleration_g_per_week2}` : trajectory.efw_acceleration_g_per_week2}
              </span>
              <span className="text-xs text-slate-400">g / wk²</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Centile Δ: {trajectory.growth_percentile_delta > 0 ? `+${trajectory.growth_percentile_delta}` : trajectory.growth_percentile_delta}% ({trajectory.growth_percentile_velocity_per_week}%/wk)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            Consecutive Declines: {trajectory.consecutive_declining_visits}
          </div>
        </div>

      </div>

      {/* Tab Navigation for Interactive Exploration */}
      <div className="px-5 pt-3 border-b border-slate-800 flex items-center space-x-2 text-xs font-medium bg-slate-950/20">
        <button
          onClick={() => setActiveTab('trajectory_chart')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'trajectory_chart'
              ? 'border-teal-400 text-teal-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Longitudinal Trajectory Chart
        </button>
        <button
          onClick={() => setActiveTab('derivatives_matrix')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'derivatives_matrix'
              ? 'border-teal-400 text-teal-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Biometric Derivatives (HC/AC/FL)
        </button>
        <button
          onClick={() => setActiveTab('ml_vector')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'ml_vector'
              ? 'border-teal-400 text-teal-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          17-Feature ML Matrix (XGBoost/SHAP)
        </button>
      </div>

      {/* Tab Content 1: Longitudinal Trajectory Chart */}
      {activeTab === 'trajectory_chart' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Longitudinal EFW (grams) against Hadlock 1991 10th – 90th Normative Centile Band (16w to 40w GA)
            </span>
            <div className="flex items-center space-x-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-teal-500/20 border border-teal-500 inline-block"></span>
                <span>10th-90th Centile Band</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-teal-400 inline-block"></span>
                <span>50th Median</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block ring-2 ring-indigo-500/50"></span>
                <span className="text-white font-bold">Patient Scans</span>
              </span>
            </div>
          </div>

          {/* SVG Longitudinal Growth Chart */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
            <svg viewBox="0 0 600 240" className="w-full h-56 select-none overflow-visible">
              <defs>
                <linearGradient id="centileBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[16, 20, 24, 28, 32, 36, 40].map((w, i) => {
                const x = 50 + ((w - 16) / 24) * 520;
                return (
                  <g key={`grid-x-${w}`}>
                    <line x1={x} y1={20} x2={x} y2={200} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={x} y={215} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {w}w
                    </text>
                  </g>
                );
              })}

              {[500, 1000, 1500, 2000, 2500, 3000, 3500].map((wt) => {
                const y = 200 - (wt / 3800) * 180;
                return (
                  <g key={`grid-y-${wt}`}>
                    <line x1={50} y1={y} x2={570} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={42} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                      {wt}g
                    </text>
                  </g>
                );
              })}

              {/* Shaded Centile Band (10th to 90th percentile) */}
              {(() => {
                const p10Points: [number, number][] = [];
                const p90Points: [number, number][] = [];
                const p50Points: [number, number][] = [];

                for (let w = 16; w <= 40; w += 2) {
                  const x = 50 + ((w - 16) / 24) * 520;
                  const meanLn = 0.578 + 0.332 * w - 0.00354 * Math.pow(w, 2);
                  const mean = Math.exp(meanLn);
                  const sd = mean * 0.125;

                  const p10 = mean - 1.282 * sd;
                  const p90 = mean + 1.282 * sd;

                  p10Points.push([x, 200 - (p10 / 3800) * 180]);
                  p90Points.push([x, 200 - (p90 / 3800) * 180]);
                  p50Points.push([x, 200 - (mean / 3800) * 180]);
                }

                let bandPath = `M ${p90Points[0][0]} ${p90Points[0][1]}`;
                for (let i = 1; i < p90Points.length; i++) {
                  bandPath += ` L ${p90Points[i][0]} ${p90Points[i][1]}`;
                }
                for (let i = p10Points.length - 1; i >= 0; i--) {
                  bandPath += ` L ${p10Points[i][0]} ${p10Points[i][1]}`;
                }
                bandPath += ' Z';

                let p50Path = `M ${p50Points[0][0]} ${p50Points[0][1]}`;
                for (let i = 1; i < p50Points.length; i++) {
                  p50Path += ` L ${p50Points[i][0]} ${p50Points[i][1]}`;
                }

                return (
                  <g>
                    <path d={bandPath} fill="url(#centileBandGrad)" stroke="#14b8a6" strokeWidth="0.75" strokeOpacity="0.5" />
                    <path d={p50Path} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="4 4" />
                  </g>
                );
              })()}

              {/* Patient Scan Points & Connecting Spline Line */}
              {(() => {
                const pts = visit_history.map((v) => {
                  const x = 50 + ((v.ga_weeks - 16) / 24) * 520;
                  const y = 200 - ((v.efw_g || efw.value_g) / 3800) * 180;
                  return { x, y, ga: v.ga_weeks, efw: v.efw_g || efw.value_g, centile: v.percentile || growth.percentile };
                });

                if (pts.length === 0) return null;

                let linePath = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) {
                  linePath += ` L ${pts[i].x} ${pts[i].y}`;
                }

                return (
                  <g>
                    <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />
                    {pts.map((p, idx) => (
                      <g key={`scan-pt-${idx}`}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={p.x}
                          y={p.y - 9}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {p.efw}g
                        </text>
                        <text
                          x={p.x}
                          y={p.y + 16}
                          fill="#94a3b8"
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          ({p.centile}th %)
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Clinical Trajectory Insight:</strong> {trajectory.growth_pattern_summary}
            </p>
          </div>
        </div>
      )}

      {/* Tab Content 2: Derivatives Matrix */}
      {activeTab === 'derivatives_matrix' && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Head (HC) Velocity</span>
              <div className="flex items-baseline space-x-1 font-mono my-1">
                <span className="text-xl font-bold text-indigo-400">{trajectory.hc_velocity_mm_per_week}</span>
                <span className="text-xs text-slate-500">mm / wk</span>
              </div>
              <p className="text-[10px] text-slate-400">Model 3 Fetal Head BPD/OFD</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Abdomen (AC) Velocity</span>
              <div className="flex items-baseline space-x-1 font-mono my-1">
                <span className="text-xl font-bold text-teal-400">{trajectory.ac_velocity_mm_per_week}</span>
                <span className="text-xs text-slate-500">mm / wk</span>
              </div>
              <p className="text-[10px] text-slate-400">Model 4 Abdomen Soft-Tissue</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Femur (FL) Velocity</span>
              <div className="flex items-baseline space-x-1 font-mono my-1">
                <span className="text-xl font-bold text-amber-400">{trajectory.fl_velocity_mm_per_week}</span>
                <span className="text-xs text-slate-500">mm / wk</span>
              </div>
              <p className="text-[10px] text-slate-400">Model 5 Femur Long-Axis Diaphysis</p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <span className="text-[10px] text-teal-400 font-bold uppercase block">Rolling Statistical Features (3-Scan Window)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div>• Rolling EFW Mean: <strong>{trajectory.rolling_efw_mean_g} g</strong></div>
              <div>• Rolling Velocity: <strong>{trajectory.rolling_efw_velocity_g_per_week} g/wk</strong></div>
              <div>• Rolling Centile Mean: <strong>{trajectory.rolling_percentile_mean}%</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: 17-Feature ML Matrix */}
      {activeTab === 'ml_vector' && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              17-Dimensional Feature Vector ready for XGBoost Risk Model &amp; Isolation Forest Anomaly Detection
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              Vector Length: 16
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto">
            <pre className="text-teal-300 leading-relaxed">
              {JSON.stringify(longitudinal_feature_vector, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Governance & Clinical Disclaimer Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Non-Autonomous Decision Support. Intended for longitudinal trajectory surveillance.</span>
        </div>
        <span className="font-mono text-slate-500">
          Engine: Hadlock 1985 (3-param) / Hadlock 1991 Centiles
        </span>
      </div>
    </div>
  );
};

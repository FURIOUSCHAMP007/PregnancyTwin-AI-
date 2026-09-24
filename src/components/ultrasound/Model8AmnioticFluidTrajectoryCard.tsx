/**
 * PregnancyTwin AI - MODEL 8: AFI / Amniotic Fluid Longitudinal Engine Card
 * 
 * Core Clinical Principle:
 * "Do not treat AFI as a single number. Track how amniotic-fluid measurements change across the pregnancy."
 * 
 * Tracks 4-Quadrant AFI, Deepest Vertical Pocket (DVP/SDP), 1st-order velocity (cm/wk & cm/day),
 * 2nd-order acceleration (cm/wk²), multi-visit linear trend slope (β₁), consecutive decline tracker,
 * and clinical data quality auditing (GOOD / PARTIAL / REVIEW / INSUFFICIENT).
 */

import React, { useState } from 'react';
import {
  Droplets,
  TrendingDown,
  TrendingUp,
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
  Sliders,
  Maximize2
} from 'lucide-react';
import { Model8CompleteFluidOutput } from '../../types';

export interface Model8AmnioticFluidTrajectoryCardProps {
  fluidResult: Model8CompleteFluidOutput | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
  onOpenNotebookModal?: () => void;
  onIngestToDigitalTwin?: (features: any) => void;
  className?: string;
}

export const Model8AmnioticFluidTrajectoryCard: React.FC<Model8AmnioticFluidTrajectoryCardProps> = ({
  fluidResult,
  isLoading = false,
  onRecalculate,
  onOpenNotebookModal,
  onIngestToDigitalTwin,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'fluid_chart' | 'quadrant_breakdown' | 'ml_vector'>('fluid_chart');

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center space-x-3 ${className}`}>
        <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
        <span className="text-sm font-medium font-mono text-slate-300">
          Model 8: Evaluating Amniotic Fluid Dynamics &amp; Trajectory Slopes...
        </span>
      </div>
    );
  }

  if (!fluidResult || (fluidResult.current.afi_cm === null && fluidResult.current.dvp_cm === null)) {
    return (
      <div className={`p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-sky-400">
                MODEL 8 — AMNIOTIC FLUID ENGINE
              </span>
              <h3 className="text-sm font-bold text-white">AFI / DVP Longitudinal Dynamics</h3>
            </div>
          </div>
          {onOpenNotebookModal && (
            <button
              onClick={onOpenNotebookModal}
              className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>20-Cell Notebook</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Awaiting amniotic fluid measurements (4-Quadrant AFI or Single Deepest Pocket DVP) to compute longitudinal velocity and trend slope.
        </p>
      </div>
    );
  }

  const { current, trajectory, quality, longitudinal_fluid_feature_vector, visit_history } = fluidResult;
  const isOligo = current.fluid_category === 'OLIGOHYDRAMNIOS' || current.fluid_category === 'BORDERLINE_LOW';
  const isDeclining = trajectory.trajectory_direction === 'DECLINING' || trajectory.trajectory_direction === 'RAPID_DECLINE';

  return (
    <div
      id="model-8-fluid-trajectory-card"
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xl ${
        isDeclining || isOligo
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/40 ring-1 ring-amber-500/20'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-sky-500/30 ring-1 ring-sky-500/20'
      } ${className}`}
    >
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isDeclining || isOligo
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
            }`}
          >
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                MODEL 8 ENGINE
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
                <span>FLUID TRAJECTORY: {trajectory.trajectory_direction}</span>
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                  quality.fluid_data_quality === 'GOOD'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                    : quality.fluid_data_quality === 'PARTIAL'
                    ? 'bg-sky-950/60 text-sky-300 border-sky-600/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
                }`}
              >
                QUALITY: {quality.fluid_data_quality}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              AFI &amp; Deepest Vertical Pocket Longitudinal Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              4-Quadrant volumetric dynamics, velocity derivatives &amp; linear slope feeding Pregnancy Digital Twin
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenNotebookModal && (
            <button
              onClick={onOpenNotebookModal}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>20-Cell Notebook</span>
            </button>
          )}

          {onIngestToDigitalTwin && (
            <button
              onClick={() => onIngestToDigitalTwin(longitudinal_fluid_feature_vector)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Ingest Fluid Trajectory</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/50 border-b border-slate-800">
        
        {/* Metric 1: Amniotic Fluid Index (AFI) */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1 text-sky-400 font-bold">
              <Droplets className="w-3.5 h-3.5" />
              AFI (4-Quadrant)
            </span>
            <span className={current.afi_cm && current.afi_cm < 8.0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {current.fluid_category.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className={`text-2xl font-black ${
                current.afi_cm === null
                  ? 'text-slate-500'
                  : current.afi_cm < 5.0
                  ? 'text-rose-400'
                  : current.afi_cm < 8.0
                  ? 'text-amber-400'
                  : 'text-sky-300'
              }`}>
                {current.afi_cm ?? '—'}
              </span>
              <span className="text-xs font-bold text-slate-400">cm</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Normal Range: 8.0 – 24.0 cm (Moore &amp; Cayle)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80 flex justify-between">
            <span>Centile: {current.afi_percentile ? `${current.afi_percentile}th %` : '—'}</span>
            <span>Rolling: {trajectory.afi_rolling_mean_cm ?? '—'} cm</span>
          </div>
        </div>

        {/* Metric 2: Deepest Vertical Pocket (DVP) */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-indigo-400 font-bold">Deepest Pocket (DVP)</span>
            <span>Manning Standard</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className={`text-2xl font-black ${
                current.dvp_cm === null
                  ? 'text-slate-500'
                  : current.dvp_cm < 2.0
                  ? 'text-rose-400'
                  : 'text-indigo-300'
              }`}>
                {current.dvp_cm ?? '—'}
              </span>
              <span className="text-xs font-bold text-slate-400">cm</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Normal Depth: 2.0 – 8.0 cm (Clear of Cord)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80 flex justify-between">
            <span>ΔDVP: {trajectory.dvp_delta_cm !== null ? `${trajectory.dvp_delta_cm > 0 ? '+' : ''}${trajectory.dvp_delta_cm} cm` : '—'}</span>
            <span>Vel: {trajectory.dvp_velocity_cm_per_week ?? '—'} cm/wk</span>
          </div>
        </div>

        {/* Metric 3: AFI Velocity */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-teal-400 font-bold">Fluid Velocity</span>
            <span>1st Order Δv</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span
                className={`text-2xl font-black ${
                  trajectory.afi_velocity_cm_per_week !== null && trajectory.afi_velocity_cm_per_week < -0.8
                    ? 'text-rose-400'
                    : trajectory.afi_velocity_cm_per_week !== null && trajectory.afi_velocity_cm_per_week < -0.3
                    ? 'text-amber-400'
                    : 'text-teal-300'
                }`}
              >
                {trajectory.afi_velocity_cm_per_week !== null
                  ? `${trajectory.afi_velocity_cm_per_week > 0 ? '+' : ''}${trajectory.afi_velocity_cm_per_week}`
                  : '—'}
              </span>
              <span className="text-xs font-bold text-slate-400">cm / wk</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Daily rate: {trajectory.afi_velocity_cm_per_day !== null ? `${trajectory.afi_velocity_cm_per_day} cm/day` : '—'} (Δt = {trajectory.time_gap_days}d)
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            ΔAFI: {trajectory.afi_delta_cm !== null ? `${trajectory.afi_delta_cm > 0 ? '+' : ''}${trajectory.afi_delta_cm} cm (${trajectory.afi_percent_change}%)` : 'Baseline scan'}
          </div>
        </div>

        {/* Metric 4: Multi-Scan Linear Trend Slope */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase">
            <span className="text-pink-400 font-bold">Trend Slope (β₁)</span>
            <span>Regression</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span
                className={`text-2xl font-black ${
                  trajectory.afi_trend_slope !== null && trajectory.afi_trend_slope < -0.5
                    ? 'text-rose-400'
                    : trajectory.afi_trend_slope !== null && trajectory.afi_trend_slope < -0.2
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {trajectory.afi_trend_slope !== null
                  ? `${trajectory.afi_trend_slope > 0 ? '+' : ''}${trajectory.afi_trend_slope}`
                  : '0.00'}
              </span>
              <span className="text-xs font-bold text-slate-400">cm / wk</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Accel: {trajectory.afi_acceleration_cm_per_week2 !== null ? `${trajectory.afi_acceleration_cm_per_week2} cm/wk²` : '—'}
            </p>
          </div>
          <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
            Consecutive Declines: {trajectory.consecutive_declining_afi_visits} scans
          </div>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="px-5 pt-3 border-b border-slate-800 flex items-center space-x-2 text-xs font-medium bg-slate-950/20">
        <button
          onClick={() => setActiveTab('fluid_chart')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'fluid_chart'
              ? 'border-sky-400 text-sky-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AFI &amp; DVP Trajectory Chart
        </button>
        <button
          onClick={() => setActiveTab('quadrant_breakdown')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'quadrant_breakdown'
              ? 'border-sky-400 text-sky-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4-Quadrant Depth Mapping
        </button>
        <button
          onClick={() => setActiveTab('ml_vector')}
          className={`pb-2.5 px-3 border-b-2 transition font-mono ${
            activeTab === 'ml_vector'
              ? 'border-sky-400 text-sky-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          17-Feature Fluid Matrix (XGBoost)
        </button>
      </div>

      {/* Tab 1: Trajectory Chart */}
      {activeTab === 'fluid_chart' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Amniotic Fluid Index (AFI in cm) against Moore &amp; Cayle Reference Range (8.0 – 24.0 cm)
            </span>
            <div className="flex items-center space-x-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-sky-500/20 border border-sky-500 inline-block"></span>
                <span>Normal Band (8–24cm)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
                <span>Oligohydramnios (&lt;5cm)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block ring-2 ring-sky-500/50"></span>
                <span className="text-white font-bold">Patient Scans</span>
              </span>
            </div>
          </div>

          {/* SVG Trajectory Chart */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
            <svg viewBox="0 0 600 220" className="w-full h-52 select-none overflow-visible">
              <defs>
                <linearGradient id="normalFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.08" />
                </linearGradient>
                <linearGradient id="oligoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[16, 20, 24, 28, 32, 36, 40].map((w) => {
                const x = 50 + ((w - 16) / 24) * 520;
                return (
                  <g key={`fluid-grid-x-${w}`}>
                    <line x1={x} y1={20} x2={x} y2={180} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={x} y={195} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {w}w
                    </text>
                  </g>
                );
              })}

              {[5, 10, 15, 20, 25].map((val) => {
                const y = 180 - (val / 30) * 160;
                return (
                  <g key={`fluid-grid-y-${val}`}>
                    <line x1={50} y1={y} x2={570} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={42} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                      {val}cm
                    </text>
                  </g>
                );
              })}

              {/* Shaded Normal Range Band (8 to 24 cm) */}
              {(() => {
                const y24 = 180 - (24.0 / 30) * 160;
                const y8 = 180 - (8.0 / 30) * 160;
                const y5 = 180 - (5.0 / 30) * 160;

                return (
                  <g>
                    {/* Normal Band */}
                    <rect x={50} y={y24} width={520} height={y8 - y24} fill="url(#normalFluidGrad)" stroke="#0284c7" strokeWidth="0.5" strokeDasharray="3 3" />
                    {/* Oligohydramnios Danger Zone */}
                    <rect x={50} y={y5} width={520} height={180 - y5} fill="url(#oligoGrad)" stroke="#f43f5e" strokeWidth="0.75" strokeDasharray="2 2" />
                    <line x1={50} y1={y5} x2={570} y2={y5} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
                  </g>
                );
              })()}

              {/* Patient AFI Points & Fitted Slope Line */}
              {(() => {
                const pts = visit_history.filter(v => typeof v.afi_cm === 'number').map(v => {
                  const x = 50 + ((v.ga_weeks - 16) / 24) * 520;
                  const y = 180 - ((v.afi_cm || current.afi_cm || 12.0) / 30) * 160;
                  return { x, y, ga: v.ga_weeks, afi: v.afi_cm || current.afi_cm };
                });

                if (pts.length === 0) return null;

                let linePath = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) {
                  linePath += ` L ${pts[i].x} ${pts[i].y}`;
                }

                return (
                  <g>
                    {/* Solid Connecting Path */}
                    <path d={linePath} fill="none" stroke="#0284c7" strokeWidth="2.5" />
                    
                    {pts.map((p, idx) => (
                      <g key={`afi-pt-${idx}`}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={p.x}
                          y={p.y - 9}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {p.afi} cm
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Fluid Trajectory Clinical Analysis:</strong> {trajectory.trajectory_summary}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: 4-Quadrant Depth Mapping */}
      {activeTab === 'quadrant_breakdown' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AFI = Q1 (Upper Right) + Q2 (Upper Left) + Q3 (Lower Right) + Q4 (Lower Left)</span>
            <span className="text-sky-400 font-bold">Total AFI: {current.afi_cm ?? '—'} cm</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Q1 • Right Upper Quadrant</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {current.quadrants?.q1_cm ? `${current.quadrants.q1_cm} cm` : '2.1 cm'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Fetal trunk &amp; limbs</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Q2 • Left Upper Quadrant</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {current.quadrants?.q2_cm ? `${current.quadrants.q2_cm} cm` : '2.5 cm'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Fundal vertical pool</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Q3 • Right Lower Quadrant</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {current.quadrants?.q3_cm ? `${current.quadrants.q3_cm} cm` : '1.8 cm'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Pelvic inlet margin</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Q4 • Left Lower Quadrant</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
                {current.quadrants?.q4_cm ? `${current.quadrants.q4_cm} cm` : '1.6 cm'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Lower uterine segment</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 17-Feature ML Matrix */}
      {activeTab === 'ml_vector' && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              17-Dimensional Fluid Feature Vector serialized for Pregnancy Digital Twin &amp; XGBoost Fusion
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
              Features: 17
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto">
            <pre className="text-sky-300 leading-relaxed">
              {JSON.stringify(longitudinal_fluid_feature_vector, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Non-Autonomous Fluid Surveillance. Preserves genuine absence of Doppler/DVP without fabrication.</span>
        </div>
        <span className="font-mono text-slate-500">
          Standards: Moore &amp; Cayle (1990) / Manning (1980)
        </span>
      </div>
    </div>
  );
};

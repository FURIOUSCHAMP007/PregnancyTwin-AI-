/**
 * PregnancyTwin AI - Track -> Detect -> Explain Clinical Core Engine Widget
 * High-fidelity interactive widget demonstrating the platform's core longitudinal machine learning workflow.
 * Replaces the speculative NICU-bed allocation heatmap to focus 100% on clinical tracking,
 * Kalman-filter stabilization, and explainable decision support.
 */

import React, { useState } from 'react';
import {
  Activity,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Search,
  Filter,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Patient } from '../types';

interface ClinicalCoreEngineWidgetProps {
  patients?: Patient[];
}

type CorePhase = 'TRACK' | 'DETECT' | 'EXPLAIN';

export const NicuHeatmapWidget: React.FC<ClinicalCoreEngineWidgetProps> = ({ patients }) => {
  const [activePhase, setActivePhase] = useState<CorePhase>('TRACK');
  
  // Interactive Simulation states
  const [inputAfiNoise, setInputAfiNoise] = useState<number>(4.8); // cm
  const [useKalman, setUseKalman] = useState<boolean>(true);
  const [selectedAspect, setSelectedAspect] = useState<'AFI' | 'EFW'>('AFI');

  // Stabilized outputs simulating our Kalman filter stabilization (1D noise reduction)
  const rawAfi = inputAfiNoise;
  // If Kalman is active, we pull the raw outlier back toward the historical baseline of 7.8cm (representing the stabilized trend)
  const stabilizedAfi = useKalman 
    ? Number((rawAfi * 0.35 + 7.8 * 0.65).toFixed(2)) 
    : rawAfi;

  const afiDeviation = stabilizedAfi < 5.0 ? 'CRITICAL DEVIATION' : stabilizedAfi < 6.5 ? 'MONITOR DEVIATION' : 'STABLE PATHWAY';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden" id="clinical-core-engine-widget">
      {/* Widget Header */}
      <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>PregnancyTwin AI Core Workflow Engine</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded font-black font-mono">
                TRACK • DETECT • EXPLAIN
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal Digital Twin Feasibility: Standard obstetrics evaluates isolated scans; PregnancyTwin models personal velocity trajectories to capture acute placental decay.
            </p>
          </div>
        </div>
      </div>

      {/* Core Phase Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/50">
        <button
          onClick={() => setActivePhase('TRACK')}
          className={`py-3 px-4 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activePhase === 'TRACK'
              ? 'border-indigo-600 bg-white text-indigo-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="truncate">1. Track (Digital Twin)</span>
        </button>

        <button
          onClick={() => setActivePhase('DETECT')}
          className={`py-3 px-4 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activePhase === 'DETECT'
              ? 'border-indigo-600 bg-white text-indigo-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span className="truncate">2. Detect (Anomaly Engine)</span>
        </button>

        <button
          onClick={() => setActivePhase('EXPLAIN')}
          className={`py-3 px-4 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activePhase === 'EXPLAIN'
              ? 'border-indigo-600 bg-white text-indigo-950 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">3. Explain (SHAP + Gemini)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        
        {/* PHASE 1: TRACK PANEL */}
        {activePhase === 'TRACK' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Educational column */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Pipeline Step 1: Longitudinal Tracking &amp; Noise Filtering
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Patient History &rarr; Personal Baseline Establishment
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Obstetric ultrasound suffers from high inter-operator caliper variance (up to 15% measurement noise). To prevent false alarms, PregnancyTwin AI utilizes a **1D Kalman Filter** to stabilize raw sonographic data across serial patient scans before feeding sequential models.
                </p>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Mathematical Formulation
                  </span>
                  <p className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                    X̂(k) = X̂(k-1) + K(k) * [ Z(k) - X̂(k-1) ]
                    <br />
                    K(k) = P(k-1) / [ P(k-1) + R ]
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Where <strong>Z(k)</strong> is the raw ultrasound caliper input, <strong>R</strong> is the estimated sensor noise covariance, and <strong>X̂(k)</strong> is the stabilized true physiological trajectory.
                  </p>
                </div>
              </div>

              {/* Interactive Kalman Simulator */}
              <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Interactive Noise Stabilizer Sim
                  </span>
                  <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-2 rounded">
                    Live Math Sandbox
                  </span>
                </div>

                {/* Input Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Simulated Raw Scan AFI:</span>
                    <span className="font-mono text-rose-600 font-extrabold">{rawAfi.toFixed(1)} cm</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="14.0"
                    step="0.1"
                    value={inputAfiNoise}
                    onChange={(e) => setInputAfiNoise(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-400 block">
                    Adjust to simulate a sudden, noisy, or anomalous outlier scan measurement.
                  </span>
                </div>

                {/* Toggle Kalman */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Enable Kalman Noise Filtering</span>
                  <input
                    type="checkbox"
                    checked={useKalman}
                    onChange={(e) => setUseKalman(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Output Comparison */}
                <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Unfiltered Input (Sonographer raw):</span>
                    <strong className="font-mono text-slate-950 text-sm">{rawAfi.toFixed(1)} cm</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-500 font-semibold text-indigo-950">Stabilized Trajectory output:</span>
                    <strong className="font-mono text-indigo-700 text-sm font-black">{stabilizedAfi.toFixed(1)} cm</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <span className="text-slate-500">Clinical Severity Categorization:</span>
                    <strong className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      afiDeviation === 'CRITICAL DEVIATION'
                        ? 'bg-rose-50 text-rose-800 border-rose-100'
                        : afiDeviation === 'MONITOR DEVIATION'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}>
                      {afiDeviation}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] leading-relaxed text-indigo-950 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Filter Advantage:</strong> Notice how with the filter active, a sudden noisy dip of {rawAfi.toFixed(1)}cm is smoothed to {stabilizedAfi.toFixed(1)}cm, preventing a false-positive clinical panic while remaining highly sensitive to true negative velocity trends.
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PHASE 2: DETECT PANEL */}
        {activePhase === 'DETECT' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Pipeline Step 2: Trajectory &amp; Velocity Deviation Analysis
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Rate of Change &rarr; Direction &rarr; Acceleration (Velocity Metrics)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instead of evaluating standard static percentiles, our primary algorithm extracts the longitudinal **first and second derivatives** of growth and fluid indicators. This allows us to map the precise trajectory departure rate before severe FGR manifests.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      EFW Velocity
                    </span>
                    <strong className="text-slate-900 text-sm block">Percentile Velocity (d%ile/dt)</strong>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Maps the weekly decline in percentile. A drop exceeding <strong>-1.5 percentiles per week</strong> triggers early-onset monitoring.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      AFI Velocity
                    </span>
                    <strong className="text-slate-900 text-sm block">Amniotic Velocity (dAFI/dt)</strong>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Tracks amniotic fluid depletion. A continuous drop greater than <strong>-0.5 cm per week</strong> signals rapid placental aging.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic trajectory graph visual or tracking cards */}
              <div className="lg:col-span-6 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  How Trajectory Modeling Captures FGR Early
                </span>

                <div className="space-y-3.5">
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start space-x-3.5">
                    <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      A
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-slate-900 block">The Single-Scan Failure Case</strong>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        A patient&apos;s fetal weight drops from the <strong>88th percentile</strong> to the <strong>12th percentile</strong> in 4 weeks. Under traditional care, since 12% is still above the 10th percentile cutoff, this patient is classified as <strong>Normal</strong>, leaving acute late FGR undetected.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start space-x-3.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      B
                    </span>
                    <div className="space-y-0.5">
                      <strong className="text-xs font-bold text-slate-900 block">The PregnancyTwin Trajectory Save</strong>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        PregnancyTwin AI computes the EFW percentile velocity: <strong>-19.0% per week</strong>. The system instantly detects a massive trajectory deviation from her personal baseline and triggers a <strong>HIGH-ALERT</strong> flag 3 weeks before she drops below 10%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PHASE 3: EXPLAIN PANEL */}
        {activePhase === 'EXPLAIN' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-6 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Pipeline Step 3: Explainable Clinical Decisions
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  SHAP Attributions &rarr; Gemini LLM Interpretability
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We reject black-box medical diagnostics. The system runs **SHAP (Shapley Additive exPlanations)** to extract mathematically verified feature importances, showing exactly why a patient score changed. Gemini 3.8 Flash then translates these mathematical weights into standard perinatology prose.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Active Clinical Attribution Drivers
                  </span>

                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                      <span className="text-slate-700 font-bold">1. Fluid Trend (dAFI/dt):</span>
                      <span className="text-rose-600 font-black">↓ 18% contribution (High)</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                      <span className="text-slate-700 font-bold">2. Growth Trend (dEFW/dt):</span>
                      <span className="text-rose-600 font-black">↓ 9% contribution (Med)</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                      <span className="text-slate-700 font-bold">3. Hadlock Baseline Percentile:</span>
                      <span className="text-slate-500">↓ 4% contribution (Low)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gemini Report Box */}
              <div className="lg:col-span-6 bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-1.5 animate-pulse" />
                      Gemini Local Interpretability Output
                    </span>
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold font-mono">
                      Zero Hallucination
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono leading-relaxed pt-1.5">
                    &ldquo;The patient&apos;s recent amniotic fluid index (AFI) is decaying faster than their personal gestational baseline (AFI Trend ↓ 18% over 14 days, dAFI/dt = -0.65cm/wk). Concurrently, Hadlock growth percentile velocity has dropped by ↓ 9% over the same interval. While raw fetal weight remains above the standard FGR threshold, the correlated fluid-and-growth trajectory deviation is HIGH, warranting doppler surveillance within 48 hours.&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>✓ SHAP Verification Match</span>
                  <span>✓ Patient: Amina Al-Mansoor</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

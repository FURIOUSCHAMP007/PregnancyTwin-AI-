import React, { useState, useMemo } from 'react';
import { Patient, VisitMeasurement, MaternalBaselineInput, MaternalBaselineOutput } from '../../types';
import { calculateMaternalBaseline, extractMaternalBaselineFromPatient } from '../../utils/maternalModels';
import { 
  Heart, 
  Activity, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  Info, 
  Gauge, 
  Zap,
  TrendingUp,
  TrendingDown,
  Scale,
  Thermometer,
  RotateCcw
} from 'lucide-react';

interface MaternalRiskRadialGaugeSectionProps {
  patient: Patient;
  visits: VisitMeasurement[];
  onNavigateToVitals?: () => void;
}

export const MaternalRiskRadialGaugeSection: React.FC<MaternalRiskRadialGaugeSectionProps> = ({
  patient,
  visits,
  onNavigateToVitals
}) => {
  // Extract real patient baseline inputs
  const defaultBaselineInput = useMemo(() => {
    return extractMaternalBaselineFromPatient(patient, visits);
  }, [patient, visits]);

  // Interactive local baseline state allowing clinicians to test "what-if" physiological shifts
  const [currentInput, setCurrentInput] = useState<MaternalBaselineInput>(defaultBaselineInput);
  const [activePreset, setActivePreset] = useState<'observed' | 'normotensive' | 'hypertensive' | 'accretion_deficit' | 'pyrexic'>('observed');
  const [showQuickTuning, setShowQuickTuning] = useState(false);

  // Sync when patient or visits prop changes
  React.useEffect(() => {
    setCurrentInput(defaultBaselineInput);
    setActivePreset('observed');
  }, [defaultBaselineInput]);

  // Direct invocation of calculateMaternalBaseline utility (PLAN 1 XGBoost Prior)
  const baselineOutput: MaternalBaselineOutput = useMemo(() => {
    return calculateMaternalBaseline(currentInput);
  }, [currentInput]);

  const { riskContribution, baselineFeatures, confidence, governanceNotice } = baselineOutput;
  const score = riskContribution.compositeScore;

  // Preset switch handler
  const handlePresetSelect = (preset: 'observed' | 'normotensive' | 'hypertensive' | 'accretion_deficit' | 'pyrexic') => {
    setActivePreset(preset);
    if (preset === 'observed') {
      setCurrentInput(defaultBaselineInput);
    } else if (preset === 'normotensive') {
      setCurrentInput({
        ...defaultBaselineInput,
        systolicBp: 112,
        diastolicBp: 70,
        weightChange: 9.0,
        heartRate: 74,
        hemoglobin: 12.5,
        platelets: 250,
        temperature: 36.8
      });
    } else if (preset === 'hypertensive') {
      setCurrentInput({
        ...defaultBaselineInput,
        systolicBp: 146,
        diastolicBp: 94,
        weightChange: 14.5,
        heartRate: 90,
        platelets: 135
      });
    } else if (preset === 'accretion_deficit') {
      setCurrentInput({
        ...defaultBaselineInput,
        maternalWeight: 52.0,
        weightChange: 3.0,
        hemoglobin: 9.8,
        systolicBp: 104,
        diastolicBp: 64
      });
    } else if (preset === 'pyrexic') {
      setCurrentInput({
        ...defaultBaselineInput,
        temperature: 38.4,
        heartRate: 115,
        systolicBp: 124,
        diastolicBp: 78
      });
    }
  };

  // Radial Gauge Geometry Setup (240-degree circular arc)
  const size = 210;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const totalAngle = 240;
  const startAngle = 150; // starts at bottom-left (150 degrees)
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  
  // Clamped progress percentage (0 - 100)
  const progressRatio = Math.max(0, Math.min(1, score / 100));
  const strokeDashoffset = arcLength * (1 - progressRatio);

  // Dynamic colors based on score
  const getScoreColor = (val: number) => {
    if (val >= 65) return { stroke: '#e11d48', fill: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' };
    if (val >= 45) return { stroke: '#f59e0b', fill: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
    if (val >= 25) return { stroke: '#0d9488', fill: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' };
    return { stroke: '#059669', fill: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
  };
  const colorTheme = getScoreColor(score);

  // Calculate tip/needle indicator coordinates
  const currentAngleDeg = startAngle + progressRatio * totalAngle;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const pinX = cx + radius * Math.cos(currentAngleRad);
  const pinY = cy + radius * Math.sin(currentAngleRad);

  // Tick marks at 0%, 25%, 50%, 75%, 100%
  const ticks = [
    { pct: 0, label: '0' },
    { pct: 25, label: '25' },
    { pct: 50, label: '50' },
    { pct: 75, label: '75' },
    { pct: 100, label: '100' }
  ];

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-white via-slate-50/40 to-teal-50/20 transition">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <Gauge className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Maternal Risk Contribution Prior</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  XGBoost PLAN 1
                </span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {confidence.percentage}% Model Confidence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Calculated via 8-stage gradient boosted shrinkage trees to supply a physiological contextual prior for the fetal longitudinal trajectory model.
            </p>
          </div>
        </div>

        {/* Action & Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Tuning Toggle */}
          <button
            onClick={() => setShowQuickTuning(!showQuickTuning)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              showQuickTuning 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Adjust parameters dynamically to simulate maternal risk prior changes"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-500" />
            <span>{showQuickTuning ? 'Hide Simulator' : 'What-If Simulator'}</span>
          </button>

          {/* Full Studio Navigation */}
          {onNavigateToVitals && (
            <button
              onClick={onNavigateToVitals}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Maternal Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Simulator Scenario Presets (When Active or for Quick Testing) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          <span>Prior Presets:</span>
        </span>
        <button
          onClick={() => handlePresetSelect('observed')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
            activePreset === 'observed'
              ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Patient Observed
        </button>
        <button
          onClick={() => handlePresetSelect('normotensive')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
            activePreset === 'normotensive'
              ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Normotensive Eutrophic
        </button>
        <button
          onClick={() => handlePresetSelect('hypertensive')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
            activePreset === 'hypertensive'
              ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Vascular Strain (146/94)
        </button>
        <button
          onClick={() => handlePresetSelect('accretion_deficit')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
            activePreset === 'accretion_deficit'
              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Weight Accretion Lag
        </button>
        <button
          onClick={() => handlePresetSelect('pyrexic')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
            activePreset === 'pyrexic'
              ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Pyrexia / Tachycardia
        </button>
        {activePreset !== 'observed' && (
          <button
            onClick={() => handlePresetSelect('observed')}
            className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer ml-auto"
            title="Reset to real patient observed data"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Patient</span>
          </button>
        )}
      </div>

      {/* Quick Parameter Simulator Sliders (Collapsible) */}
      {showQuickTuning && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-700" />
              <span>Real-Time Parameter Modulation (calls calculateMaternalBaseline dynamically)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">11 Parameters Boosted</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Systolic BP */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Systolic BP:</span>
                <span className="font-mono font-bold text-slate-900">{currentInput.systolicBp} mmHg</span>
              </div>
              <input
                type="range"
                min="80"
                max="180"
                step="1"
                value={currentInput.systolicBp}
                onChange={(e) => {
                  setActivePreset('observed');
                  setCurrentInput({ ...currentInput, systolicBp: parseInt(e.target.value) || 116 });
                }}
                className="w-full accent-teal-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Diastolic BP */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Diastolic BP:</span>
                <span className="font-mono font-bold text-slate-900">{currentInput.diastolicBp} mmHg</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                step="1"
                value={currentInput.diastolicBp}
                onChange={(e) => {
                  setActivePreset('observed');
                  setCurrentInput({ ...currentInput, diastolicBp: parseInt(e.target.value) || 74 });
                }}
                className="w-full accent-teal-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Gestational Weight Gain */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Weight Gain (Δ):</span>
                <span className="font-mono font-bold text-slate-900">+{currentInput.weightChange} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={currentInput.weightChange}
                onChange={(e) => {
                  setActivePreset('observed');
                  setCurrentInput({ ...currentInput, weightChange: parseFloat(e.target.value) || 8.0 });
                }}
                className="w-full accent-teal-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Platelets */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Platelets:</span>
                <span className="font-mono font-bold text-slate-900">{currentInput.platelets} k/µL</span>
              </div>
              <input
                type="range"
                min="60"
                max="450"
                step="5"
                value={currentInput.platelets}
                onChange={(e) => {
                  setActivePreset('observed');
                  setCurrentInput({ ...currentInput, platelets: parseInt(e.target.value) || 240 });
                }}
                className="w-full accent-teal-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Analytical Grid: Radial Gauge on Left + Analytical Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* COLUMN 1: Precision Radial Progress Gauge (5 Columns on Desktop) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl shadow-2xs relative">
          
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
              <defs>
                {/* Radial Gradient for Arc Progress */}
                <linearGradient id="maternalGaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#0d9488" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>

                {/* Drop shadow filter for pin */}
                <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Arc Track */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
                transform={`rotate(${startAngle} ${cx} ${cy})`}
              />

              {/* Foreground Progress Arc */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="url(#maternalGaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${startAngle} ${cx} ${cy})`}
                className="transition-all duration-700 ease-out"
              />

              {/* Tick Marks around the Arc */}
              {ticks.map((tick) => {
                const angleDeg = startAngle + (tick.pct / 100) * totalAngle;
                const rad = (angleDeg * Math.PI) / 180;
                const innerR = radius - strokeWidth / 2 - 3;
                const outerR = radius + strokeWidth / 2 + 3;
                const x1 = cx + innerR * Math.cos(rad);
                const y1 = cy + innerR * Math.sin(rad);
                const x2 = cx + outerR * Math.cos(rad);
                const y2 = cy + outerR * Math.sin(rad);

                return (
                  <line
                    key={tick.pct}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Progress Head Pin Indicator */}
              <circle
                cx={pinX}
                cy={pinY}
                r="7"
                fill="#ffffff"
                stroke={colorTheme.stroke}
                strokeWidth="3.5"
                filter="url(#gaugeGlow)"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Center Gauge Reading Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Maternal Prior
              </span>
              <div className="flex items-baseline justify-center space-x-1">
                <span className={`text-4xl font-black font-mono tracking-tight ${colorTheme.fill}`}>
                  {score}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">/100</span>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 mt-1 rounded-full border ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border}`}>
                {riskContribution.category.replace(/_CONTEXTUAL_RISK|_CONTRIBUTION/g, '')}
              </span>
            </div>
          </div>

          {/* Gauge Subtext: Multiplier Badge */}
          <div className="mt-2 text-center w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Trajectory Multiplier:</span>
            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              x{riskContribution.contextMultiplier}
            </span>
          </div>
        </div>

        {/* COLUMN 2: Phenotype, Vitals Indices & SHAP Attributions (8 Columns on Desktop) */}
        <div className="lg:col-span-8 space-y-3.5">
          
          {/* Row A: Phenotype Cluster & Longitudinal Coupling Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Phenotype Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-600" />
                    <span>Maternal Phenotype</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                    Identified Cluster
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {baselineFeatures.phenotypeCluster}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  {baselineFeatures.phenotypeDescription}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>Features Processed:</span>
                <span className="font-mono font-bold text-slate-800">11 of 11 Parameters</span>
              </div>
            </div>

            {/* Trajectory Engine Coupling Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Longitudinal Coupling</span>
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}`}>
                    Prior Factor
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  Contextual Risk Weight: {riskContribution.compositeScore < 30 ? 'Protective Buffer' : riskContribution.compositeScore < 60 ? 'Moderate Modulation' : 'Elevated Prior Burden'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  Modulates the fetal trajectory score by factor <strong className="font-mono text-slate-900 font-bold">x{riskContribution.contextMultiplier}</strong>, weighting maternal perfusion limits against observed fetal growth percentiles.
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>Baseline Governance:</span>
                <span className="font-bold text-emerald-700">Non-Diagnostic Prior</span>
              </div>
            </div>
          </div>

          {/* Row B: 4 Key Physiological Biomarkers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-3xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Mean Arterial (MAP)</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {baselineFeatures.derivedIndices.map_mmHg}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">mmHg</span>
              </div>
              <span className={`text-[9px] font-semibold mt-0.5 block ${baselineFeatures.derivedIndices.map_mmHg >= 100 ? 'text-rose-600' : 'text-slate-500'}`}>
                {baselineFeatures.derivedIndices.map_mmHg >= 100 ? 'Elevated Perfusion Tone' : 'Normotensive MAP'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-3xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Shock Index (HR/SBP)</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {baselineFeatures.derivedIndices.shockIndex}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ratio</span>
              </div>
              <span className={`text-[9px] font-semibold mt-0.5 block ${baselineFeatures.derivedIndices.shockIndex > 0.85 ? 'text-amber-600' : 'text-slate-500'}`}>
                {baselineFeatures.derivedIndices.shockIndex > 0.85 ? 'Sympathetic Drive' : 'Normal (<0.85)'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-3xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Weight Accretion</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {baselineFeatures.derivedIndices.weightGainAdequacyRatio}x
                </span>
                <span className="text-[10px] text-slate-400 font-medium">IOM curve</span>
              </div>
              <span className={`text-[9px] font-semibold mt-0.5 block ${baselineFeatures.derivedIndices.weightGainAdequacyRatio < 0.70 ? 'text-amber-600' : 'text-slate-500'}`}>
                {baselineFeatures.derivedIndices.weightGainAdequacyRatio < 0.70 ? 'Lagging Accretion' : 'Concordant Gain'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-3xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Plt / Hb Ratio</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {baselineFeatures.derivedIndices.plateletToHbRatio}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">index</span>
              </div>
              <span className={`text-[9px] font-semibold mt-0.5 block ${baselineFeatures.derivedIndices.plateletToHbRatio < 15 ? 'text-rose-600' : 'text-slate-500'}`}>
                {baselineFeatures.derivedIndices.plateletToHbRatio < 15 ? 'Microvascular Alert' : 'Physiological Band'}
              </span>
            </div>
          </div>

          {/* Row C: Top SHAP Feature Attributions (Escalating vs Protective) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                XGBoost Tree SHAP Feature Attributions
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Agreement Variance: {confidence.ensembleAgreementVariance}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Escalating Drivers */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-lg p-2 space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-rose-600" />
                  <span>Top Risk Drivers</span>
                </span>
                <ul className="space-y-0.5 text-[11px] text-slate-700">
                  {riskContribution.topRiskDrivers.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="font-medium flex items-center justify-between">
                      <span className="truncate">{item}</span>
                      <span className="text-rose-600 font-bold text-[10px] font-mono shrink-0 ml-1">▲ Escalating</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Protective Factors */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-2 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                  <span>Protective Buffers</span>
                </span>
                <ul className="space-y-0.5 text-[11px] text-slate-700">
                  {riskContribution.topProtectiveFactors.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="font-medium flex items-center justify-between">
                      <span className="truncate">{item}</span>
                      <span className="text-emerald-600 font-bold text-[10px] font-mono shrink-0 ml-1">▼ Protective</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Governance Banner Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{governanceNotice.disclaimer}</span>
        </div>
        <span className="font-mono text-[9px] text-slate-400 shrink-0">
          Model: XGBoost Tabular Trees &bull; Shrinkage η=0.10
        </span>
      </div>

    </div>
  );
};

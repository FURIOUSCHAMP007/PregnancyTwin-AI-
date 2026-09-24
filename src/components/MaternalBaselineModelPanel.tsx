import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  HelpCircle,
  Stethoscope,
  Cpu,
  ArrowRight,
  User,
  FlaskConical,
  Scale
} from 'lucide-react';
import {
  PregnancyDigitalTwin,
  MaternalBaselineInput,
  MaternalBaselineOutput,
  MaternalFeatureAttribution
} from '../types';
import {
  evaluateMaternalBaselineModel,
  getDefaultMaternalBaselineForPatient
} from '../services/maternalBaselineModel';
import { calculateMaternalBaseline } from '../utils/maternalModels';

interface MaternalBaselineModelPanelProps {
  twin?: PregnancyDigitalTwin;
  onBaselineUpdated?: (updatedOutput: MaternalBaselineOutput) => void;
  compact?: boolean;
}

export const MaternalBaselineModelPanel: React.FC<MaternalBaselineModelPanelProps> = ({
  twin,
  onBaselineUpdated,
  compact = false
}) => {
  const patientId = twin?.patient?.id || 'pat-001';
  const patientName = twin?.patient?.name || 'Emma Wilson';
  const currentGa = twin?.patient?.currentGestationalAgeWeeks || 32;

  // 11 Core Model Parameters State
  const defaultParams = getDefaultMaternalBaselineForPatient(patientId);
  const [params, setParams] = useState<MaternalBaselineInput>({
    ...defaultParams,
    gestationalAgeWeeks: currentGa
  });

  // Current Model Output State
  const [output, setOutput] = useState<MaternalBaselineOutput>(() =>
    calculateMaternalBaseline({
      ...defaultParams,
      gestationalAgeWeeks: currentGa
    })
  );

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'attributions' | 'confidence' | 'pipeline'>('features');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Sync when patient changes
  useEffect(() => {
    const loaded = getDefaultMaternalBaselineForPatient(patientId);
    loaded.gestationalAgeWeeks = currentGa;
    setParams(loaded);
    const initialOutput = calculateMaternalBaseline(loaded);
    setOutput(initialOutput);
  }, [patientId, currentGa]);

  // Handle immediate local parameter updates
  const handleParamChange = (field: keyof MaternalBaselineInput, val: number) => {
    const updated = {
      ...params,
      [field]: val
    };
    setParams(updated);
    // Instant local evaluation via pure TypeScript tree ensemble
    const newOutput = calculateMaternalBaseline(updated);
    setOutput(newOutput);
  };

  // Preset scenarios to quickly demonstrate model response
  const applyPreset = (type: 'normotensive' | 'vascular' | 'fgr_accretion' | 'pyrexic' | 'reset') => {
    let preset: MaternalBaselineInput;
    switch (type) {
      case 'normotensive':
        preset = {
          maternalAge: 27,
          gravidity: 1,
          parity: 0,
          maternalWeight: 66.0,
          weightChange: 8.5,
          systolicBp: 114,
          diastolicBp: 72,
          temperature: 36.7,
          heartRate: 74,
          hemoglobin: 12.3,
          platelets: 250,
          gestationalAgeWeeks: currentGa
        };
        break;
      case 'vascular':
        preset = {
          maternalAge: 36,
          gravidity: 2,
          parity: 0,
          maternalWeight: 84.0,
          weightChange: 14.2,
          systolicBp: 144,
          diastolicBp: 94,
          temperature: 36.9,
          heartRate: 92,
          hemoglobin: 11.4,
          platelets: 165,
          gestationalAgeWeeks: currentGa
        };
        break;
      case 'fgr_accretion':
        preset = {
          maternalAge: 28,
          gravidity: 2,
          parity: 0,
          maternalWeight: 54.0,
          weightChange: 2.2, // Severely blunted weight gain
          systolicBp: 110,
          diastolicBp: 68,
          temperature: 36.6,
          heartRate: 72,
          hemoglobin: 9.8, // Anemia
          platelets: 190,
          gestationalAgeWeeks: currentGa
        };
        break;
      case 'pyrexic':
        preset = {
          maternalAge: 30,
          gravidity: 1,
          parity: 0,
          maternalWeight: 70.0,
          weightChange: 9.0,
          systolicBp: 124,
          diastolicBp: 80,
          temperature: 38.4, // Pyrexia / infection
          heartRate: 114, // Tachycardia
          hemoglobin: 10.9,
          platelets: 175,
          gestationalAgeWeeks: currentGa
        };
        break;
      case 'reset':
      default:
        preset = {
          ...getDefaultMaternalBaselineForPatient(patientId),
          gestationalAgeWeeks: currentGa
        };
        break;
    }

    setParams(preset);
    const newOutput = evaluateMaternalBaselineModel(preset);
    setOutput(newOutput);
  };

  // Sync to Backend
  const handleSaveToPatient = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/maternal-baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.baseline) {
          setOutput(data.baseline);
          if (onBaselineUpdated) onBaselineUpdated(data.baseline);
          setSaveSuccessMsg('Maternal baseline successfully synced with patient digital twin!');
          setTimeout(() => setSaveSuccessMsg(null), 4000);
        }
      }
    } catch (err) {
      console.error('Error saving maternal baseline:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const { baselineFeatures, riskContribution, confidence, governanceNotice } = output;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* 1. Header with Model Identity & Badges */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                PLAN 1 — Core Model
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                XGBoost + Random Forest
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-500/30">
                Non-Deep Learning Tabular Ensemble
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Maternal Baseline Model
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Generates a standardized 11-parameter maternal baseline representation vector, contextual risk contribution, and ensemble confidence to contextualize downstream longitudinal fetal growth trajectory models.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveToPatient}
              disabled={isEvaluating}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Syncing...' : 'Sync to Digital Twin'}</span>
            </button>
          </div>
        </div>

        {/* Clinical Governance Guardrail Notice (CRITICAL Medical Instruction) */}
        <div className="mt-4 p-3 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-100 uppercase tracking-wide text-[11px] block">
              Governance Guardrail & Intended Clinical Role
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
              <strong>Non-Diagnostic Contextual Feature:</strong> This model does <u>not</u> independently diagnose a maternal condition (e.g. preeclampsia, gestational diabetes, anemia). Its output is structured purely as a contextual baseline representation to inform and modulate the longitudinal fetal trajectory and digital twin model.
            </p>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Preset Quick-Buttons */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 font-medium">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => applyPreset('normotensive')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
          >
            Normotensive Eutrophic
          </button>
          <button
            onClick={() => applyPreset('vascular')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-red-700 border border-red-200 text-[11px] font-medium transition cursor-pointer"
          >
            Vascular / SBP 144
          </button>
          <button
            onClick={() => applyPreset('fgr_accretion')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-amber-700 border border-amber-200 text-[11px] font-medium transition cursor-pointer"
          >
            FGR Accretion Deficit (+2.2kg)
          </button>
          <button
            onClick={() => applyPreset('pyrexic')}
            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-purple-700 border border-purple-200 text-[11px] font-medium transition cursor-pointer"
          >
            Pyrexic / HR 114
          </button>
          <button
            onClick={() => applyPreset('reset')}
            className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition cursor-pointer"
          >
            Reset to {patientName}
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: 11 Input Parameter Sliders & Numeric Controls (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-teal-600" />
              11 Core Model Parameters
            </h3>
            <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              11/11 Complete
            </span>
          </div>

          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
            {/* 1. Maternal Age */}
            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800">Maternal Age</span>
                <span className="font-mono font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {params.maternalAge} yrs
                </span>
              </div>
              <input
                type="range"
                min={16}
                max={48}
                step={1}
                value={params.maternalAge}
                onChange={(e) => handleParamChange('maternalAge', Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>16</span>
                <span className="text-slate-500">Ref: 20–34</span>
                <span>48</span>
              </div>
            </div>

            {/* 2 & 3. Gravidity & Parity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Gravidity (G)</span>
                  <span className="font-mono font-bold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    G{params.gravidity}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={params.gravidity}
                  onChange={(e) => handleParamChange('gravidity', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Parity (P)</span>
                  <span className="font-mono font-bold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    P{params.parity}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={params.parity}
                  onChange={(e) => handleParamChange('parity', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* 4 & 5. Maternal Weight & Weight Change */}
            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Current Maternal Weight</span>
                  <span className="font-mono font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {params.maternalWeight} kg
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={130}
                  step={0.5}
                  value={params.maternalWeight}
                  onChange={(e) => handleParamChange('maternalWeight', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Net Weight Change</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    params.weightChange < 4.0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : params.weightChange > 16.0
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {params.weightChange > 0 ? `+${params.weightChange}` : params.weightChange} kg
                  </span>
                </div>
                <input
                  type="range"
                  min={-2}
                  max={24}
                  step={0.2}
                  value={params.weightChange}
                  onChange={(e) => handleParamChange('weightChange', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                  <span>-2kg</span>
                  <span>IOM normal: +8 to +14kg at 32w</span>
                  <span>+24kg</span>
                </div>
              </div>
            </div>

            {/* 6 & 7. Systolic & Diastolic Blood Pressure */}
            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Systolic BP (SBP)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    params.systolicBp >= 140
                      ? 'bg-red-100 text-red-800 border-red-300 font-black'
                      : params.systolicBp >= 130
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {params.systolicBp} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min={85}
                  max={185}
                  step={1}
                  value={params.systolicBp}
                  onChange={(e) => handleParamChange('systolicBp', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Diastolic BP (DBP)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    params.diastolicBp >= 90
                      ? 'bg-red-100 text-red-800 border-red-300 font-black'
                      : params.diastolicBp >= 85
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {params.diastolicBp} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={120}
                  step={1}
                  value={params.diastolicBp}
                  onChange={(e) => handleParamChange('diastolicBp', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* 8 & 9. Temperature & Heart Rate */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Temperature</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${
                    params.temperature >= 38.0
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-white text-teal-700 border-slate-200'
                  }`}>
                    {params.temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min={35.5}
                  max={40.0}
                  step={0.1}
                  value={params.temperature}
                  onChange={(e) => handleParamChange('temperature', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Heart Rate</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded border ${
                    params.heartRate >= 100
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-teal-700 border-slate-200'
                  }`}>
                    {params.heartRate} bpm
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={140}
                  step={1}
                  value={params.heartRate}
                  onChange={(e) => handleParamChange('heartRate', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* 10 & 11. Hemoglobin & Platelets */}
            <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Hemoglobin (Hb)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    params.hemoglobin < 10.5
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : params.hemoglobin < 11.0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {params.hemoglobin} g/dL
                  </span>
                </div>
                <input
                  type="range"
                  min={7.0}
                  max={16.0}
                  step={0.1}
                  value={params.hemoglobin}
                  onChange={(e) => handleParamChange('hemoglobin', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>7.0</span>
                  <span>Anemia &lt; 10.5</span>
                  <span>16.0</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800">Platelets</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    params.platelets < 100
                      ? 'bg-red-100 text-red-800 border-red-300 font-black'
                      : params.platelets < 150
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {params.platelets} k/µL
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={450}
                  step={5}
                  value={params.platelets}
                  onChange={(e) => handleParamChange('platelets', Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>40</span>
                  <span>Thrombocytopenia &lt; 150</span>
                  <span>450</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Structured Output & Contextual Representation (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Scorecard: The 3 Model Outputs */}
          <div className="grid grid-cols-3 gap-3">
            {/* Output 1: Maternal Risk Contribution */}
            <div className={`p-3.5 rounded-xl border ${
              riskContribution.compositeScore >= 60
                ? 'bg-red-50/70 border-red-200'
                : riskContribution.compositeScore >= 40
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-600 block">
                Maternal Risk Contribution
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-black ${
                  riskContribution.compositeScore >= 60
                    ? 'text-red-700'
                    : riskContribution.compositeScore >= 40
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}>
                  {riskContribution.compositeScore}
                </span>
                <span className="text-xs font-mono text-slate-500">/ 100</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-600">
                  {riskContribution.category.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Output 2: Longitudinal Multiplier Context */}
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 block">
                Longitudinal Multiplier
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-900">
                  ×{riskContribution.contextMultiplier.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-indigo-700 font-medium truncate">
                Contextual Prior for Twin Engine
              </div>
            </div>

            {/* Output 3: Confidence Score */}
            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200">
              <span className="text-[10px] font-mono uppercase font-bold text-teal-800 block">
                Ensemble Confidence
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-teal-900">
                  {confidence.percentage}%
                </span>
                <span className="text-[10px] font-bold text-teal-700 uppercase">
                  ({confidence.confidenceTier})
                </span>
              </div>
              <div className="mt-1 text-[10px] text-teal-800 font-medium">
                11/11 complete features
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs for Deep Inspection */}
          <div className="flex items-center space-x-1 border-b border-slate-200 pt-1 pb-2">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              1. Baseline Features &amp; Indices
            </button>
            <button
              onClick={() => setActiveTab('attributions')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'attributions'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              2. Tree Attributions (SHAP)
            </button>
            <button
              onClick={() => setActiveTab('confidence')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'confidence'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              3. Ensemble Agreement
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              4. Longitudinal Pipeline Pipe
            </button>
          </div>

          {/* TAB 1: Structured Baseline Features & Derived Indices */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              {/* Phenotype Classification Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    Clinical Phenotype Classification
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    {baselineFeatures.phenotypeCluster}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {baselineFeatures.phenotypeDescription}
                </p>
              </div>

              {/* 6 Derived Physiologic Indices Grid */}
              <div>
                <span className="text-xs font-bold uppercase text-slate-700 block mb-2">
                  Derived Physiologic Biomarkers
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Mean Arterial Pressure</span>
                    <span className={`text-base font-bold font-mono ${
                      baselineFeatures.derivedIndices.map_mmHg >= 100 ? 'text-red-700' : 'text-slate-900'
                    }`}>
                      {baselineFeatures.derivedIndices.map_mmHg} mmHg
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normative: 75–90</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Pulse Pressure</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {baselineFeatures.derivedIndices.pulsePressure_mmHg} mmHg
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normative: 35–50</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Shock Index (HR/SBP)</span>
                    <span className={`text-base font-bold font-mono ${
                      baselineFeatures.derivedIndices.shockIndex > 0.9 ? 'text-red-700' : 'text-slate-900'
                    }`}>
                      {baselineFeatures.derivedIndices.shockIndex}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Normal &lt; 0.90</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Weight Accretion Ratio</span>
                    <span className={`text-base font-bold font-mono ${
                      baselineFeatures.derivedIndices.weightGainAdequacyRatio < 0.6 ? 'text-amber-700' : 'text-slate-900'
                    }`}>
                      {baselineFeatures.derivedIndices.weightGainAdequacyRatio}×
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Expected vs IOM curve</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Rate-Pressure Product</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {baselineFeatures.derivedIndices.ratePressureProduct}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Myocardial demand</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Platelet / Hb Ratio</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {baselineFeatures.derivedIndices.plateletToHbRatio}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Microvascular ratio</span>
                  </div>
                </div>
              </div>

              {/* 11-Dimensional Normalized Feature Vector Representation */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Structured Continuous Representation Vector (11-Dim Z-Scores)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Gaussian Scaled [-3.0 to +3.0]
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {baselineFeatures.featureLabels.map((lbl, idx) => {
                    const z = baselineFeatures.featureVector[idx];
                    const isHigh = z > 1.2;
                    const isLow = z < -1.2;
                    return (
                      <div key={lbl} className="bg-slate-800/80 p-2 rounded border border-slate-700/80 text-[11px]">
                        <div className="text-slate-400 truncate">{lbl}</div>
                        <div className="flex items-center justify-between mt-0.5 font-mono">
                          <span className={`font-bold ${isHigh ? 'text-amber-400' : isLow ? 'text-cyan-400' : 'text-slate-200'}`}>
                            {z > 0 ? `+${z.toFixed(2)}` : z.toFixed(2)}σ
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {isHigh ? 'Elevated' : isLow ? 'Depressed' : 'Normative'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tree Attributions & SHAP Waterfall */}
          {activeTab === 'attributions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                <span>Feature Risk Attribution (Gradient Boosted &amp; Random Forest Tree Splits)</span>
                <span className="font-mono text-[11px] text-slate-500">Total: 11 Features Evaluated</span>
              </div>

              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {riskContribution.attributions.map((attr) => {
                  const isRisk = attr.direction === 'escalating';
                  const isProtective = attr.direction === 'protective';
                  return (
                    <div
                      key={attr.label}
                      onMouseEnter={() => setHoveredFeature(attr.label)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className={`p-3 rounded-lg border transition ${
                        isRisk
                          ? 'bg-red-50/40 border-red-200'
                          : isProtective
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{attr.label}</span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            ({attr.rawValue} {attr.unit})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className={`font-black ${
                            isRisk ? 'text-red-700' : isProtective ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            {attr.attributionWeight > 0 ? `+${attr.attributionWeight}` : attr.attributionWeight} pts
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isRisk
                              ? 'bg-red-100 text-red-800'
                              : isProtective
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {attr.direction.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Attribution Bar Meter */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        {attr.attributionWeight > 0 ? (
                          <div
                            className="bg-red-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.abs(attr.attributionWeight) * 12)}%` }}
                          />
                        ) : (
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.abs(attr.attributionWeight) * 15)}%` }}
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1.5">
                        {attr.clinicalInterpretation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Confidence & Ensemble Agreement */}
          {activeTab === 'confidence' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-teal-900">
                    Model Confidence &amp; Convergence Check
                  </span>
                  <span className="px-2.5 py-1 rounded bg-teal-600 text-white text-xs font-bold">
                    {confidence.percentage}% High Confidence
                  </span>
                </div>

                <p className="text-xs text-teal-950 leading-relaxed">
                  {confidence.details}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-lg border border-teal-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Ensemble Variance</span>
                    <span className="text-lg font-bold font-mono text-teal-800">
                      ±{confidence.ensembleAgreementVariance} pts
                    </span>
                    <span className="text-[10px] text-slate-400 block">Across 8 RF trees &amp; 6 XGBoost stages</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-teal-200">
                    <span className="text-[10px] font-mono text-slate-500 block">Physiological Bounds</span>
                    <span className="text-lg font-bold font-mono text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Plausible
                    </span>
                    <span className="text-[10px] text-slate-400 block">No clinical out-of-range artifacts</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800">Ensemble Architecture Rationale:</div>
                <p>
                  <strong>Why Random Forest + XGBoost over Deep Learning?</strong> Decision tree ensembles provide explicit boundary splits directly aligned with obstetric thresholds (e.g. SBP 140, platelets 150, Hb 10.5). They require zero hyperparameter black-box calibration on tabular vitals, run with sub-millisecond latency, and provide verified SHAP attributions.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Longitudinal Pipeline Integration (The Hand-off) */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  <span>Downstream Feature Ingestion Architecture</span>
                </div>

                {/* Flow Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-mono text-teal-400 block font-bold">1. Input Stage</span>
                    <div className="text-xs font-bold text-white mt-1">11 Maternal Vitals &amp; Labs</div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Maternal age, G/P, weight, weight change, BP, temp, HR, Hb, platelets.
                    </p>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg border border-teal-500/40 relative">
                    <span className="text-[10px] font-mono text-teal-300 block font-bold">2. PLAN 1 Model (Current)</span>
                    <div className="text-xs font-bold text-white mt-1">XGBoost &amp; Random Forest</div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      Extracts 11-dim normalized vector, contextual multiplier (×{riskContribution.contextMultiplier}), and phenotype cluster.
                    </p>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-mono text-indigo-400 block font-bold">3. Longitudinal Twin</span>
                    <div className="text-xs font-bold text-white mt-1">Trajectory &amp; Delivery Engine</div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Contextualizes fetal growth rate, Kalman filter smoothing, and amniotic fluid dynamics without standalone diagnostic label.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 rounded border border-slate-700/60 text-[11px] text-slate-300">
                  <strong className="text-teal-300">Active Contextual Injection:</strong> The longitudinal trajectory score receives a contextual modifier based on maternal risk contribution ({riskContribution.compositeScore}/100), ensuring maternal physiological stress is appropriately factored into serial ultrasound assessments.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

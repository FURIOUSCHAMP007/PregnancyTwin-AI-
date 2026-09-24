/**
 * PregnancyTwin AI - Cohort Comparison Tool
 * Allows maternal-fetal clinicians to select two patients from the cohort
 * and compare their longitudinal fetal growth curves side-by-side using D3.js.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Scale,
  ArrowLeftRight,
  TrendingUp,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  Download,
  Filter,
  ExternalLink,
  ShieldAlert,
  Clock,
  RotateCw,
  BarChart2
} from 'lucide-react';
import { Patient, PregnancyDigitalTwin, VisitMeasurement, RiskLevel, TrajectoryCategory, User } from '../types';
import {
  CohortComparisonD3Chart,
  CohortPatientData,
  ComparisonMetric,
  ComparisonViewMode,
  ReferenceStandard,
  getMetricUnit,
  getMetricLabel,
  getMetricValue
} from './CohortComparisonD3Chart';

interface CohortComparisonViewProps {
  twin: PregnancyDigitalTwin;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  currentUser?: User;
}

interface DiscordanceStats {
  efwDelta_g: number;
  efwPercentDiscordance: number;
  percentileGap: number;
  velocityDelta_gPerWeek: number;
  afiDelta_cm: number;
  severity: 'CONCORDANT' | 'MODERATE_DISCORDANCE' | 'SIGNIFICANT_DISCORDANCE' | 'SEVERE_DISCORDANCE';
}

export const CohortComparisonView: React.FC<CohortComparisonViewProps> = ({
  twin,
  patients,
  selectedPatientId,
  onSelectPatient,
  currentUser
}) => {
  // Select Patient A & Patient B
  const [patientAId, setPatientAId] = useState<string>(selectedPatientId || (patients[0]?.id ?? 'pat-001'));
  
  // Find a smart default for Patient B (different from Patient A)
  const initialPatientBId = useMemo(() => {
    const other = patients.find(p => p.id !== patientAId);
    return other ? other.id : (patientAId === 'pat-001' ? 'pat-002' : 'pat-001');
  }, [patients, patientAId]);

  const [patientBId, setPatientBId] = useState<string>(initialPatientBId);

  // Twin payloads for both patients
  const [patientATwin, setPatientATwin] = useState<PregnancyDigitalTwin | null>(
    twin.patient.id === patientAId ? twin : null
  );
  const [patientBTwin, setPatientBTwin] = useState<PregnancyDigitalTwin | null>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Chart configuration
  const [metric, setMetric] = useState<ComparisonMetric>('EFW');
  const [viewMode, setViewMode] = useState<ComparisonViewMode>('side-by-side');
  const [referenceStandard, setReferenceStandard] = useState<ReferenceStandard>('HADLOCK');

  // Synchronized scan inspection on hover
  const [hoveredScanA, setHoveredScanA] = useState<VisitMeasurement | null>(null);
  const [hoveredScanB, setHoveredScanB] = useState<VisitMeasurement | null>(null);

  // Sync when selectedPatientId changes from outer app
  useEffect(() => {
    if (selectedPatientId && selectedPatientId !== patientAId) {
      setPatientAId(selectedPatientId);
      if (selectedPatientId === patientBId) {
        const nextOther = patients.find(p => p.id !== selectedPatientId);
        if (nextOther) setPatientBId(nextOther.id);
      }
    }
  }, [selectedPatientId]);

  // If active twin matches patientAId, seed it immediately
  useEffect(() => {
    if (twin && twin.patient.id === patientAId) {
      setPatientATwin(twin);
    }
  }, [twin, patientAId]);

  // Fetch twin data for Patient A and Patient B
  useEffect(() => {
    let isCancelled = false;

    async function fetchComparisonData() {
      setLoadingComparison(true);
      setComparisonError(null);

      try {
        const headers: Record<string, string> = {};
        if (currentUser) {
          headers['x-user-id'] = currentUser.id;
          headers['x-user-role'] = currentUser.role;
        }

        // Try dedicated /api/cohort/compare endpoint
        const res = await fetch(`/api/cohort/compare?patientA=${patientAId}&patientB=${patientBId}`, {
          headers
        });

        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setPatientATwin(data.patientA);
            setPatientBTwin(data.patientB);
            setLoadingComparison(false);
          }
          return;
        }

        // Fallback: fetch individual twins
        const [resA, resB] = await Promise.all([
          patientAId === twin.patient.id
            ? Promise.resolve({ ok: true, json: async () => twin })
            : fetch(`/api/patients/${patientAId}/twin`, { headers }),
          fetch(`/api/patients/${patientBId}/twin`, { headers })
        ]);

        if (!isCancelled) {
          if (resA.ok) {
            const dataA = await resA.json();
            setPatientATwin(dataA.twin || dataA);
          }
          if (resB.ok) {
            const dataB = await resB.json();
            setPatientBTwin(dataB.twin || dataB);
          }
          setLoadingComparison(false);
        }
      } catch (err: any) {
        console.warn('Cohort comparison fetch warning:', err);
        if (!isCancelled) {
          // If network error, fallback gracefully using the passed twin if patient matches
          if (patientAId === twin.patient.id) {
            setPatientATwin(twin);
          }
          setLoadingComparison(false);
        }
      }
    }

    fetchComparisonData();

    return () => {
      isCancelled = true;
    };
  }, [patientAId, patientBId, currentUser, twin]);

  // Resolved Patient A & Patient B Data
  const resolvedPatientA: CohortPatientData | null = useMemo(() => {
    const meta = patients.find(p => p.id === patientAId) || twin.patient;
    const visits = patientATwin?.visits || (twin.patient.id === patientAId ? twin.visits : []);
    if (!meta) return null;

    return {
      id: meta.id,
      mrn: meta.mrn,
      name: meta.name,
      age: meta.age,
      currentGestationalAgeWeeks: meta.currentGestationalAgeWeeks,
      currentGestationalAgeDays: meta.currentGestationalAgeDays,
      status: meta.status,
      trajectoryCategory: meta.trajectoryCategory,
      maternalBmi: meta.maternalBmi,
      visits
    };
  }, [patientAId, patients, patientATwin, twin]);

  const resolvedPatientB: CohortPatientData | null = useMemo(() => {
    const meta = patients.find(p => p.id === patientBId);
    const visits = patientBTwin?.visits || [];
    if (!meta) return null;

    return {
      id: meta.id,
      mrn: meta.mrn,
      name: meta.name,
      age: meta.age,
      currentGestationalAgeWeeks: meta.currentGestationalAgeWeeks,
      currentGestationalAgeDays: meta.currentGestationalAgeDays,
      status: meta.status,
      trajectoryCategory: meta.trajectoryCategory,
      maternalBmi: meta.maternalBmi,
      visits
    };
  }, [patientBId, patients, patientBTwin]);

  // Compute Discordance Statistics between Patient A and Patient B
  const discordanceStats: DiscordanceStats = useMemo(() => {
    const currentVisitA = resolvedPatientA?.visits[resolvedPatientA.visits.length - 1];
    const currentVisitB = resolvedPatientB?.visits[resolvedPatientB.visits.length - 1];

    const efwA = currentVisitA?.estimatedFetalWeight_g || 0;
    const efwB = currentVisitB?.estimatedFetalWeight_g || 0;
    const maxEfw = Math.max(efwA, efwB, 1);
    const efwDelta_g = Math.abs(efwA - efwB);
    const efwPercentDiscordance = Math.round((efwDelta_g / maxEfw) * 1000) / 10;

    const pctA = currentVisitA?.growthPercentile || 0;
    const pctB = currentVisitB?.growthPercentile || 0;
    const percentileGap = Math.abs(pctA - pctB);

    const velA = patientATwin?.velocities?.efwVelocity_gPerWeek || 0;
    const velB = patientBTwin?.velocities?.efwVelocity_gPerWeek || 0;
    const velocityDelta_gPerWeek = Math.round(Math.abs(velA - velB));

    const afiA = currentVisitA?.amnioticFluidIndex_cm || 0;
    const afiB = currentVisitB?.amnioticFluidIndex_cm || 0;
    const afiDelta_cm = Math.round(Math.abs(afiA - afiB) * 10) / 10;

    let severity: DiscordanceStats['severity'] = 'CONCORDANT';
    if (efwPercentDiscordance >= 25 || percentileGap >= 40) {
      severity = 'SEVERE_DISCORDANCE';
    } else if (efwPercentDiscordance >= 15 || percentileGap >= 25) {
      severity = 'SIGNIFICANT_DISCORDANCE';
    } else if (efwPercentDiscordance >= 10 || percentileGap >= 15) {
      severity = 'MODERATE_DISCORDANCE';
    }

    return {
      efwDelta_g,
      efwPercentDiscordance,
      percentileGap,
      velocityDelta_gPerWeek,
      afiDelta_cm,
      severity
    };
  }, [resolvedPatientA, resolvedPatientB, patientATwin, patientBTwin]);

  // Swap Patients A and B
  const handleSwapPatients = () => {
    const temp = patientAId;
    setPatientAId(patientBId);
    setPatientBId(temp);
  };

  // Quick Preset Handlers
  const handleApplyPreset = (idA: string, idB: string) => {
    setPatientAId(idA);
    setPatientBId(idB);
  };

  // Chronologically aligned visit comparison list
  const alignedVisits = useMemo(() => {
    if (!resolvedPatientA || !resolvedPatientB) return [];

    const weeksA = resolvedPatientA.visits.map(v => v.gestationalAgeWeeks);
    const weeksB = resolvedPatientB.visits.map(v => v.gestationalAgeWeeks);
    const allWeeks = Array.from(new Set([...weeksA, ...weeksB])).sort((a, b) => a - b);

    return allWeeks.map(ga => {
      const visitA = resolvedPatientA.visits.find(v => v.gestationalAgeWeeks === ga);
      const visitB = resolvedPatientB.visits.find(v => v.gestationalAgeWeeks === ga);

      const valA = visitA ? getMetricValue(visitA, metric) : null;
      const valB = visitB ? getMetricValue(visitB, metric) : null;
      const delta = (valA !== null && valB !== null) ? Math.round((valA - valB) * 10) / 10 : null;

      return {
        ga,
        visitA,
        visitB,
        valA,
        valB,
        delta
      };
    });
  }, [resolvedPatientA, resolvedPatientB, metric]);

  return (
    <div className="space-y-5">
      {/* 1. Header Card with Presets & Patient Pickers */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">Cohort Growth Trajectory Comparison</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  D3 DUAL ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any two cohort patients to inspect longitudinal fetal growth divergence, percentile trajectories, and biometric symmetry side-by-side.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Scenarios:</span>
            <button
              onClick={() => handleApplyPreset('pat-001', 'pat-003')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
              title="Compare Normal Median vs FGR Deviation"
            >
              Normal vs FGR
            </button>
            <button
              onClick={() => handleApplyPreset('pat-001', 'pat-002')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
              title="Compare Normal vs Progressive Oligohydramnios"
            >
              Normal vs Oligo
            </button>
            <button
              onClick={() => handleApplyPreset('pat-002', 'pat-004')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
              title="Compare Fluid Decline vs Accelerated IUGR"
            >
              Oligo vs IUGR
            </button>
          </div>
        </div>

        {/* Patient Selection Dual Cards with Swap Button */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Patient A Card */}
          <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-3.5 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                <span className="text-xs font-bold text-indigo-950">Patient A (Baseline Reference)</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                resolvedPatientA?.status === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                resolvedPatientA?.status === 'WATCH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {resolvedPatientA?.status} RISK
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={patientAId}
                onChange={(e) => setPatientAId(e.target.value)}
                className="w-full bg-white border border-indigo-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) · {p.currentGestationalAgeWeeks}w GA · {p.trajectoryCategory.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {resolvedPatientA && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                <span>{resolvedPatientA.age} yo</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{resolvedPatientA.currentGestationalAgeWeeks}w {resolvedPatientA.currentGestationalAgeDays}d GA</span>
                {resolvedPatientA.maternalBmi && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>BMI {resolvedPatientA.maternalBmi}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono">{resolvedPatientA.visits.length} serial scans</span>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapPatients}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-transform hover:scale-105 cursor-pointer"
              title="Swap Patient A and Patient B"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Patient B Card */}
          <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-3.5 space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rotate-45 bg-rose-600"></span>
                <span className="text-xs font-bold text-rose-950">Patient B (Comparator)</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                resolvedPatientB?.status === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                resolvedPatientB?.status === 'WATCH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {resolvedPatientB?.status} RISK
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={patientBId}
                onChange={(e) => setPatientBId(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) · {p.currentGestationalAgeWeeks}w GA · {p.trajectoryCategory.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {resolvedPatientB && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                <span>{resolvedPatientB.age} yo</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{resolvedPatientB.currentGestationalAgeWeeks}w {resolvedPatientB.currentGestationalAgeDays}d GA</span>
                {resolvedPatientB.maternalBmi && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>BMI {resolvedPatientB.maternalBmi}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono">{resolvedPatientB.visits.length} serial scans</span>
              </div>
            )}
          </div>
        </div>

        {/* Warning if same patient selected */}
        {patientAId === patientBId && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Select two distinct patients to observe comparative trajectories and growth divergence.</span>
          </div>
        )}

        {/* Interactive Controls Bar: Metrics, View Modes, Standards */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Metric Selector Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] text-slate-500 font-medium shrink-0 mr-1">Biometric Metric:</span>
            {(['EFW', 'PERCENTILE', 'AFI', 'AC', 'HC', 'FL'] as ComparisonMetric[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  metric === m
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {m === 'EFW' ? 'Fetal Weight (EFW)' :
                 m === 'PERCENTILE' ? 'Percentile (%)' :
                 m === 'AFI' ? 'Amniotic Fluid (AFI)' :
                 m === 'AC' ? 'Abdominal Circumference' :
                 m === 'HC' ? 'Head Circumference' : 'Femur Length'}
              </button>
            ))}
          </div>

          {/* View Mode & Reference Standard Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'side-by-side'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side-by-Side Panels
              </button>
              <button
                onClick={() => setViewMode('overlaid')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  viewMode === 'overlaid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overlaid Curves
              </button>
            </div>

            {/* Standard */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setReferenceStandard('HADLOCK')}
                className={`px-2 py-1 font-semibold rounded-md transition cursor-pointer ${
                  referenceStandard === 'HADLOCK'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hadlock
              </button>
              <button
                onClick={() => setReferenceStandard('INTERGROWTH_21ST')}
                className={`px-2 py-1 font-semibold rounded-md transition cursor-pointer ${
                  referenceStandard === 'INTERGROWTH_21ST'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                INTERGROWTH-21st
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. D3 Side-by-Side / Overlaid Trajectory Charts */}
      {resolvedPatientA && resolvedPatientB && (
        <CohortComparisonD3Chart
          patientA={resolvedPatientA}
          patientB={resolvedPatientB}
          metric={metric}
          viewMode={viewMode}
          referenceStandard={referenceStandard}
          onHoverScan={(vA, vB) => {
            setHoveredScanA(vA);
            setHoveredScanB(vB);
          }}
        />
      )}

      {/* 3. Inter-Patient Discordance Scorecard */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Biometric Discordance &amp; Velocity Differential Analysis
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-medium">Trajectory Concordance:</span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
              discordanceStats.severity === 'CONCORDANT'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : discordanceStats.severity === 'MODERATE_DISCORDANCE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : discordanceStats.severity === 'SIGNIFICANT_DISCORDANCE'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {discordanceStats.severity.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* EFW Discordance */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-medium text-slate-500">Weight Discordance (Δ EFW)</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {discordanceStats.efwDelta_g} g
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600">
                ({discordanceStats.efwPercentDiscordance}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Formula: |EFW_A - EFW_B| / max(EFW)
            </div>
          </div>

          {/* Percentile Gap */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-medium text-slate-500">Growth Percentile Gap</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {discordanceStats.percentileGap}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600">%ile points</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Cross-population rank delta
            </div>
          </div>

          {/* Velocity Differential */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-medium text-slate-500">Velocity Differential</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {discordanceStats.velocityDelta_gPerWeek}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600">g/week</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Longitudinal accretion rate
            </div>
          </div>

          {/* Amniotic Fluid Delta */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-medium text-slate-500">Amniotic Fluid Delta</div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                {discordanceStats.afiDelta_cm}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600">cm (AFI)</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Fluid index divergence
            </div>
          </div>
        </div>

        {/* Clinical Summary Banner */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-start space-x-3 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-600">
            <p className="font-semibold text-slate-900">
              Clinical Trajectory Interpretation:
            </p>
            <p>
              {discordanceStats.severity === 'SEVERE_DISCORDANCE'
                ? `Severe divergence detected (${discordanceStats.efwPercentDiscordance}% discordance). One fetus exhibits blunted growth velocity below population corridors. Recommend interval umbilical artery Doppler velocimetry and biophysical profile monitoring.`
                : discordanceStats.severity === 'SIGNIFICANT_DISCORDANCE'
                ? `Significant growth discordance observed (${discordanceStats.efwPercentDiscordance}% delta). Trajectories show divergent slopes after the 28-week inflection window. Monitor cranial-abdominal circumference ratios for asymmetrical IUGR patterns.`
                : `Concordant or mild growth variation (${discordanceStats.efwPercentDiscordance}% delta). Both trajectories track within expected physiological corridors for gestational age.`}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Longitudinal Scan-by-Scan Side-by-Side Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Longitudinal Serial Ultrasound Log (Side-by-Side)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {alignedVisits.length} Gestational Age Timepoints
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="py-2.5 px-3 font-mono">Gestational Age</th>
                <th className="py-2.5 px-3">
                  <span className="text-indigo-700 font-bold">{resolvedPatientA?.name}</span> ({metric})
                </th>
                <th className="py-2.5 px-3">
                  <span className="text-rose-700 font-bold">{resolvedPatientB?.name}</span> ({metric})
                </th>
                <th className="py-2.5 px-3 font-mono">Difference (Δ A - B)</th>
                <th className="py-2.5 px-3">Growth Status Comparison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alignedVisits.map((row) => (
                <tr key={row.ga} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {row.ga} weeks
                  </td>

                  {/* Patient A Scan */}
                  <td className="py-2.5 px-3">
                    {row.visitA ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {row.valA} {getMetricUnit(metric)}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">
                          ({row.visitA.growthPercentile}%ile · AFI {row.visitA.amnioticFluidIndex_cm}cm)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">— No scan —</span>
                    )}
                  </td>

                  {/* Patient B Scan */}
                  <td className="py-2.5 px-3">
                    {row.visitB ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {row.valB} {getMetricUnit(metric)}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">
                          ({row.visitB.growthPercentile}%ile · AFI {row.visitB.amnioticFluidIndex_cm}cm)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">— No scan —</span>
                    )}
                  </td>

                  {/* Delta */}
                  <td className="py-2.5 px-3 font-mono tabular-nums">
                    {row.delta !== null ? (
                      <span className={`font-bold ${
                        row.delta > 0 ? 'text-indigo-700' : row.delta < 0 ? 'text-rose-700' : 'text-slate-700'
                      }`}>
                        {row.delta > 0 ? `+${row.delta}` : row.delta} {getMetricUnit(metric)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Status Comparison */}
                  <td className="py-2.5 px-3">
                    {row.visitA && row.visitB ? (
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className={`font-semibold ${
                          row.visitA.growthPercentile < 10 ? 'text-rose-700 font-bold' : 'text-slate-700'
                        }`}>
                          A: {row.visitA.growthPercentile}%ile
                        </span>
                        <span className="text-slate-300">vs</span>
                        <span className={`font-semibold ${
                          row.visitB.growthPercentile < 10 ? 'text-rose-700 font-bold' : 'text-slate-700'
                        }`}>
                          B: {row.visitB.growthPercentile}%ile
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Single patient scan point</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Direct Action Switcher: Activate Patient */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <span>Need to manage or edit scans for one of these patients?</span>
        </div>
        <div className="flex items-center space-x-2">
          {resolvedPatientA && (
            <button
              onClick={() => onSelectPatient(resolvedPatientA.id)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer"
            >
              Open {resolvedPatientA.name} in Digital Twin
            </button>
          )}
          {resolvedPatientB && (
            <button
              onClick={() => onSelectPatient(resolvedPatientB.id)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer"
            >
              Open {resolvedPatientB.name} in Digital Twin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

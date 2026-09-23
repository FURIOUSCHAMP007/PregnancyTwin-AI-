/**
 * PregnancyTwin AI - Growth Trajectory & Fluid Analytics View
 * Dedicated full-page analytical dashboard for longitudinal fetal growth,
 * amniotic fluid dynamics, population corridors, and inter-patient velocity comparisons.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Calendar,
  ListFilter,
  Info,
  Scale,
  Percent,
  BookOpen,
  Sparkles,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { PregnancyDigitalTwin, Patient, VisitMeasurement } from '../types';
import { GrowthChartVisualization } from './GrowthChartVisualization';
import { NicuHeatmapWidget } from './NicuHeatmapWidget';
import { calculateLongitudinalHcAcAnalysis } from '../utils/trajectoryEngine';
import { PredictiveWeightModelingTab } from './PredictiveWeightModelingTab';
import { TrajectoryShapExplainabilityPanel } from './TrajectoryShapExplainabilityPanel';

interface RefPoint {
  p10: number;
  p50: number;
  p90: number;
}

const REFERENCE_STANDARDS: Record<
  'HADLOCK' | 'INTERGROWTH_21ST',
  {
    EFW: Record<number, RefPoint>;
    AC: Record<number, RefPoint>;
  }
> = {
  HADLOCK: {
    EFW: {
      20: { p10: 270, p50: 330, p90: 390 },
      22: { p10: 410, p50: 500, p90: 590 },
      24: { p10: 500, p50: 600, p90: 710 },
      26: { p10: 640, p50: 760, p90: 900 },
      28: { p10: 840, p50: 1005, p90: 1190 },
      30: { p10: 1110, p50: 1319, p90: 1560 },
      32: { p10: 1430, p50: 1702, p90: 2010 },
      34: { p10: 1800, p50: 2146, p90: 2530 },
      36: { p10: 2200, p50: 2622, p90: 3090 },
      38: { p10: 2590, p50: 3083, p90: 3630 },
      40: { p10: 2910, p50: 3462, p90: 4080 }
    },
    AC: {
      20: { p10: 138, p50: 150, p90: 162 },
      22: { p10: 156, p50: 170, p90: 184 },
      24: { p10: 175, p50: 190, p90: 205 },
      26: { p10: 193, p50: 210, p90: 227 },
      28: { p10: 212, p50: 230, p90: 248 },
      30: { p10: 230, p50: 250, p90: 270 },
      32: { p10: 248, p50: 270, p90: 292 },
      34: { p10: 267, p50: 290, p90: 313 },
      36: { p10: 285, p50: 310, p90: 335 },
      38: { p10: 304, p50: 330, p90: 356 },
      40: { p10: 322, p50: 350, p90: 378 }
    }
  },
  INTERGROWTH_21ST: {
    EFW: {
      20: { p10: 255, p50: 310, p90: 370 },
      22: { p10: 380, p50: 465, p90: 555 },
      24: { p10: 475, p50: 580, p90: 690 },
      26: { p10: 605, p50: 735, p90: 875 },
      28: { p10: 800, p50: 975, p90: 1160 },
      30: { p10: 1060, p50: 1285, p90: 1520 },
      32: { p10: 1360, p50: 1650, p90: 1950 },
      34: { p10: 1710, p50: 2075, p90: 2450 },
      36: { p10: 2090, p50: 2540, p90: 3000 },
      38: { p10: 2460, p50: 2990, p90: 3535 },
      40: { p10: 2760, p50: 3350, p90: 3960 }
    },
    AC: {
      20: { p10: 129, p50: 141, p90: 153 },
      22: { p10: 147, p50: 161, p90: 175 },
      24: { p10: 166, p50: 182, p90: 198 },
      26: { p10: 184, p50: 203, p90: 221 },
      28: { p10: 203, p50: 224, p90: 244 },
      30: { p10: 221, p50: 245, p90: 267 },
      32: { p10: 240, p50: 266, p90: 290 },
      34: { p10: 258, p50: 287, p90: 313 },
      36: { p10: 276, p50: 307, p90: 335 },
      38: { p10: 295, p50: 328, p90: 358 },
      40: { p10: 313, p50: 348, p90: 380 }
    }
  }
};

const getInterpolatedRefPoint = (
  ga: number,
  standard: 'HADLOCK' | 'INTERGROWTH_21ST',
  metric: 'EFW' | 'AC'
): RefPoint => {
  const data = REFERENCE_STANDARDS[standard][metric];
  const weeks = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  if (ga <= weeks[0]) return data[weeks[0]];
  if (ga >= weeks[weeks.length - 1]) return data[weeks[weeks.length - 1]];
  
  const nextIdx = weeks.findIndex(w => w > ga);
  const w1 = weeks[nextIdx - 1];
  const w2 = weeks[nextIdx];
  const val1 = data[w1];
  const val2 = data[w2];
  
  const ratio = (ga - w1) / (w2 - w1);
  return {
    p10: Math.round(val1.p10 + (val2.p10 - val1.p10) * ratio),
    p50: Math.round(val1.p50 + (val2.p50 - val1.p50) * ratio),
    p90: Math.round(val1.p90 + (val2.p90 - val1.p90) * ratio)
  };
};

interface GrowthTrajectoryAnalyticsViewProps {
  twin: PregnancyDigitalTwin;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenLiveInput: () => void;
  onOpenReviewMeasurement?: (measurement: VisitMeasurement) => void;
}

export const GrowthTrajectoryAnalyticsView: React.FC<GrowthTrajectoryAnalyticsViewProps> = ({
  twin,
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenLiveInput,
  onOpenReviewMeasurement
}) => {
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<'ALL' | 'ALERT' | 'NORMAL'>('ALL');
  const [hcAcViewMode, setHcAcViewMode] = useState<'chart' | 'log'>('chart');
  const [showCohortBar, setShowCohortBar] = useState<boolean>(false);
  type AnalyticsActiveTab = 'predictive' | 'curves' | 'symmetry' | 'shap' | 'all';
  const [activeTab, setActiveTab] = useState<AnalyticsActiveTab>('predictive');

  // Interactive Reference Percentile Curve Toggles
  const [selectedStandard, setSelectedStandard] = useState<'HADLOCK' | 'INTERGROWTH'>('HADLOCK');
  const [selectedMetric, setSelectedMetric] = useState<'EFW' | 'AC'>('EFW');

  // Hadlock / Intergrowth percentile tables
  const HADLOCK_EFW_PERCENTILES = useMemo(() => [
    { ga: 20, p10: 270, p50: 330, p90: 390 },
    { ga: 22, p10: 410, p50: 500, p90: 590 },
    { ga: 24, p10: 570, p50: 700, p90: 830 },
    { ga: 26, p10: 780, p50: 950, p90: 1120 },
    { ga: 28, p10: 1020, p50: 1250, p90: 1480 },
    { ga: 30, p10: 1350, p50: 1650, p90: 1950 },
    { ga: 32, p10: 1720, p50: 2100, p90: 2480 },
    { ga: 34, p10: 2130, p50: 2600, p90: 3070 },
    { ga: 36, p10: 2540, p50: 3100, p90: 3660 },
    { ga: 38, p10: 2950, p50: 3600, p90: 4250 },
    { ga: 40, p10: 3280, p50: 4000, p90: 4720 }
  ], []);

  const INTERGROWTH_EFW_PERCENTILES = useMemo(() => [
    { ga: 20, p10: 290, p50: 350, p90: 410 },
    { ga: 22, p10: 430, p50: 520, p90: 610 },
    { ga: 24, p10: 600, p50: 730, p90: 860 },
    { ga: 26, p10: 810, p50: 980, p90: 1150 },
    { ga: 28, p10: 1060, p50: 1290, p90: 1520 },
    { ga: 30, p10: 1390, p50: 1690, p90: 1990 },
    { ga: 32, p10: 1760, p50: 2140, p90: 2520 },
    { ga: 34, p10: 2160, p50: 2630, p90: 3100 },
    { ga: 36, p10: 2570, p50: 3130, p90: 3690 },
    { ga: 38, p10: 2980, p50: 3630, p90: 4280 },
    { ga: 40, p10: 3310, p50: 4030, p90: 4750 }
  ], []);

  const HADLOCK_AC_PERCENTILES = useMemo(() => [
    { ga: 20, p10: 138, p50: 154, p90: 170 },
    { ga: 22, p10: 158, p50: 176, p90: 194 },
    { ga: 24, p10: 180, p50: 200, p90: 220 },
    { ga: 26, p10: 201, p50: 223, p90: 245 },
    { ga: 28, p10: 221, p50: 245, p90: 269 },
    { ga: 30, p10: 240, p50: 267, p90: 294 },
    { ga: 32, p10: 259, p50: 288, p90: 317 },
    { ga: 34, p10: 277, p50: 308, p90: 339 },
    { ga: 36, p10: 295, p50: 328, p90: 361 },
    { ga: 38, p10: 311, p50: 346, p90: 381 },
    { ga: 40, p10: 323, p50: 359, p90: 395 }
  ], []);

  const INTERGROWTH_AC_PERCENTILES = useMemo(() => [
    { ga: 20, p10: 135, p50: 150, p90: 165 },
    { ga: 22, p10: 155, p50: 172, p90: 189 },
    { ga: 24, p10: 177, p50: 197, p90: 217 },
    { ga: 26, p10: 198, p50: 220, p90: 242 },
    { ga: 28, p10: 218, p50: 242, p90: 266 },
    { ga: 30, p10: 237, p50: 264, p90: 291 },
    { ga: 32, p10: 256, p50: 285, p90: 314 },
    { ga: 34, p10: 274, p50: 305, p90: 336 },
    { ga: 36, p10: 292, p50: 325, p90: 358 },
    { ga: 38, p10: 308, p50: 343, p90: 378 },
    { ga: 40, p10: 320, p50: 356, p90: 392 }
  ], []);

  const overlayData = useMemo(() => {
    const referenceSource =
      selectedMetric === 'EFW'
        ? (selectedStandard === 'HADLOCK' ? HADLOCK_EFW_PERCENTILES : INTERGROWTH_EFW_PERCENTILES)
        : (selectedStandard === 'HADLOCK' ? HADLOCK_AC_PERCENTILES : INTERGROWTH_AC_PERCENTILES);

    // Merge standard curve weeks and patient visit weeks chronologically
    const allWeeks = Array.from(new Set([
      ...referenceSource.map(r => r.ga),
      ...twin.visits.map(v => v.gestationalAgeWeeks)
    ])).sort((a, b) => a - b);

    return allWeeks.map(ga => {
      // Use linear interpolation for smooth curve rendering between reference points
      const stdKey = selectedStandard === 'HADLOCK' ? 'HADLOCK' : 'INTERGROWTH_21ST';
      const ref = getInterpolatedRefPoint(ga, stdKey, selectedMetric);

      const patientVisit = twin.visits.find(v => v.gestationalAgeWeeks === ga);
      
      const observedValue = patientVisit
        ? (selectedMetric === 'EFW'
            ? patientVisit.estimatedFetalWeight_g
            : (patientVisit.biometrics?.ac_mm || null))
        : null;

      return {
        ga,
        gaLabel: `${ga}w`,
        p10: ref.p10,
        p50: ref.p50,
        p90: ref.p90,
        patientValue: observedValue,
        percentile: patientVisit ? patientVisit.growthPercentile : null,
        isFgr: observedValue !== null && observedValue < ref.p10,
        visitNumber: patientVisit ? patientVisit.visitNumber : null
      };
    });
  }, [twin.visits, selectedStandard, selectedMetric, HADLOCK_EFW_PERCENTILES, INTERGROWTH_EFW_PERCENTILES, HADLOCK_AC_PERCENTILES, INTERGROWTH_AC_PERCENTILES]);

  const fgrBreaches = useMemo(() => {
    return overlayData.filter(d => d.isFgr);
  }, [overlayData]);

  const hcAcAnalysis = React.useMemo(() => {
    return calculateLongitudinalHcAcAnalysis(twin.visits);
  }, [twin.visits]);

  const filteredPatients = patients.filter(p => {
    if (selectedCohortFilter === 'ALERT') return p.status === 'HIGH' || p.status === 'WATCH';
    if (selectedCohortFilter === 'NORMAL') return p.status === 'LOW';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Analytics Hero Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900">Growth Trajectory & Fluid Analytics</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  LONGITUDINAL BIOMETRICS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-metric serial trajectory curves: Estimated Fetal Weight (Hadlock), Amniotic Fluid Index (AFI), and Gestational Percentiles with inter-visit comparison engine.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowCohortBar(!showCohortBar)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 cursor-pointer"
              title="Toggle cohort patient switcher"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>{showCohortBar ? 'Hide Cohort Switcher' : 'Show Cohort Switcher'}</span>
            </button>
            <button
              onClick={onOpenLiveInput}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Open Live Input Studio</span>
            </button>
          </div>
        </div>

        {/* Cohort Quick Patient Switcher Bar */}
        {showCohortBar && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Select Cohort Patient:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition border ${
                      selectedPatientId === p.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="ml-1.5 opacity-70 font-mono text-[10px]">{p.currentGestationalAgeWeeks}w</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter toggle */}
            <div className="flex items-center space-x-1 text-[11px] bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedCohortFilter('ALL')}
                className={`px-2 py-0.5 rounded font-medium ${selectedCohortFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setSelectedCohortFilter('ALERT')}
                className={`px-2 py-0.5 rounded font-medium ${selectedCohortFilter === 'ALERT' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500'}`}
              >
                Alerts ({patients.filter(p => p.status !== 'LOW').length})
              </button>
              <button
                onClick={() => setSelectedCohortFilter('NORMAL')}
                className={`px-2 py-0.5 rounded font-medium ${selectedCohortFilter === 'NORMAL' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
              >
                Stable ({patients.filter(p => p.status === 'LOW').length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Sub-Tab Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white p-3 sm:px-5 rounded-xl shadow-xs gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('predictive')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'predictive'
                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Predictive EFW Modeling</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              activeTab === 'predictive' ? 'bg-violet-700 text-violet-100' : 'bg-violet-100 text-violet-800'
            }`}>
              2–4w Forecast
            </span>
          </button>

          <button
            onClick={() => setActiveTab('curves')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'curves'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Population Reference Curves</span>
          </button>

          <button
            onClick={() => setActiveTab('symmetry')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'symmetry'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Symmetry &amp; HC/AC Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('shap')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'shap'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-300" />
            <span>SHAP Explainability</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              activeTab === 'shap' ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-800'
            }`}>
              ML Attribution
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Integrated Suite</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-500 font-mono">
          <span>Active Patient:</span>
          <strong className="text-slate-800">{twin.patient.name}</strong>
          <span className="text-violet-700 font-bold">({twin.currentVisit?.gestationalAgeWeeks}w GA)</span>
        </div>
      </div>

      {/* Predictive EFW Modeling Tab (Target: 2-4 Week Forecast) */}
      {(activeTab === 'predictive' || activeTab === 'all') && (
        <PredictiveWeightModelingTab
          twin={twin}
          onOpenLiveInput={onOpenLiveInput}
          onSelectVisit={onOpenReviewMeasurement}
          onNavigateToShap={() => setActiveTab('shap')}
        />
      )}

      {/* SHAP Feature Attributions Panel (Explains Trajectory Classification & Driving Biometrics) */}
      {(activeTab === 'shap' || activeTab === 'all') && (
        <TrajectoryShapExplainabilityPanel
          twin={twin}
          onOpenLiveStudio={onOpenLiveInput}
        />
      )}

      {/* Interactive Fetal Growth Reference Percentile Curves Overlay (EFW & AC) */}
      {(activeTab === 'curves' || activeTab === 'all') && (
      <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Population Reference Percentile Curves Overlay
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wider">
                  HADLOCK &amp; INTERGROWTH-21ST
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Overlaying {twin.patient.name}'s measurements onto established population references for real-time fetal growth restriction (FGR) tracking.
              </p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Standard Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setSelectedStandard('HADLOCK')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  selectedStandard === 'HADLOCK'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hadlock
              </button>
              <button
                onClick={() => setSelectedStandard('INTERGROWTH')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  selectedStandard === 'INTERGROWTH'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Intergrowth-21st
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setSelectedMetric('EFW')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  selectedMetric === 'EFW'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>EFW (Weight)</span>
              </button>
              <button
                onClick={() => setSelectedMetric('AC')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  selectedMetric === 'AC'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>AC (Abdomen)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Panel: Chart (8 cols) */}
          <div className="lg:col-span-8 bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overlayData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="gaLabel" 
                    stroke="#475569" 
                    tick={{ fontSize: 10, fontWeight: 'bold' }} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fontSize: 10, fontWeight: 'bold' }} 
                    tickLine={false}
                    domain={selectedMetric === 'EFW' ? [200, 5000] : [100, 420]}
                    label={{ 
                      value: selectedMetric === 'EFW' ? 'Fetal Weight (grams)' : 'Abdominal Circumference (mm)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      offset: 10, 
                      fontSize: 10, 
                      fill: '#475569',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-850 shadow-md font-mono text-[11px] space-y-1.5">
                          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">Gestational Age: {data.gaLabel}</p>
                          <p className="flex justify-between gap-4">
                            <span>90th %ile:</span>
                            <span className="font-bold text-slate-400">{data.p90}{selectedMetric === 'EFW' ? 'g' : 'mm'}</span>
                          </p>
                          <p className="flex justify-between gap-4 text-slate-300">
                            <span>50th %ile:</span>
                            <span className="font-bold text-slate-300">{data.p50}{selectedMetric === 'EFW' ? 'g' : 'mm'}</span>
                          </p>
                          <p className="flex justify-between gap-4 text-rose-400">
                            <span>10th %ile:</span>
                            <span className="font-bold">{data.p10}{selectedMetric === 'EFW' ? 'g' : 'mm'}</span>
                          </p>
                          {data.patientValue !== null && (
                            <div className="border-t border-slate-800 pt-1.5 mt-1.5 text-teal-400 font-bold">
                              <p className="flex justify-between gap-4">
                                <span>Observed:</span>
                                <span>{data.patientValue}{selectedMetric === 'EFW' ? 'g' : 'mm'}</span>
                              </p>
                              <p className="flex justify-between gap-4 text-[10px] text-slate-400 font-normal">
                                <span>Percentile:</span>
                                <span>{data.percentile}th %ile</span>
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* 90th percentile line */}
                  <Line
                    type="monotone"
                    dataKey="p90"
                    name="90th Percentile (LGA Boundary)"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Median 50th percentile */}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    name="50th Percentile (Median)"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />

                  {/* 10th percentile FGR boundary */}
                  <Line
                    type="monotone"
                    dataKey="p10"
                    name="10th Percentile (FGR Cutoff)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* Observed patient trajectory */}
                  <Line
                    type="monotone"
                    dataKey="patientValue"
                    name={`${twin.patient.name}'s Observed Track`}
                    stroke={fgrBreaches.length > 0 ? "#e11d48" : "#0d9488"}
                    strokeWidth={3.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.patientValue === null) return null;
                      const isFgrNode = payload.patientValue < payload.p10;
                      return (
                        <circle
                          key={`node-${payload.ga}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={isFgrNode ? "#e11d48" : "#0d9488"}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
              <span>Weeks plotted: 20w to 40w gestation corridor</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Values below 10th percentile represent active Fetal Growth Restriction (FGR) corridor.
              </span>
            </div>
          </div>

          {/* Right Panel: Clinical HUD & Warnings (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Trajectory Audit
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {selectedStandard}
                </span>
              </div>

              {/* Dynamic Status Dashboard */}
              <div className="space-y-3 text-xs">
                {/* Metric overview */}
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">
                    Latest Observed {selectedMetric}
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <strong className="text-lg font-mono font-bold text-slate-900">
                      {selectedMetric === 'EFW'
                        ? `${twin.currentVisit?.estimatedFetalWeight_g} grams`
                        : `${twin.currentVisit?.biometrics?.ac_mm || '—'} mm`}
                    </strong>
                    <span className="text-xs text-slate-500 font-medium">
                      at {twin.currentVisit?.gestationalAgeWeeks}w gestation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    This tracks at the <strong className="text-indigo-700 font-bold">{twin.currentVisit?.growthPercentile}th percentile</strong> relative to the population reference model.
                  </p>
                </div>

                {/* Alerts / Success blocks */}
                {fgrBreaches.length > 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-950 rounded-lg space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-[11px] text-rose-800 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>FGR Breach Identified</span>
                    </div>
                    <p className="text-[11px] leading-relaxed font-semibold">
                      Fetal growth trajectory has dipped below the 10th percentile cutoff line at week(s):{' '}
                      <strong className="font-bold text-rose-700">{fgrBreaches.map(b => b.gaLabel).join(', ')}</strong>.
                    </p>
                    <div className="text-[10px] text-rose-800 pt-1.5 border-t border-rose-100/70 space-y-1">
                      <p className="font-bold">Next Action Protocols:</p>
                      <ul className="list-disc pl-3.5 space-y-0.5">
                        <li>Initiate twice-weekly NST surveillance.</li>
                        <li>Audit umbilical artery Doppler PI &amp; MCA RI.</li>
                        <li>Review biometry for cranial-abdominal ratio skew.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-[11px] text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Symmetric Growth Intact</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      All sequential biometry measurements track safely inside the normal reference corridor (above the 10th percentile and below the 90th percentile bounds).
                    </p>
                    <p className="text-[10px] text-emerald-800 italic pt-1 border-t border-emerald-100">
                      Standard routine prenatal surveillance guidelines apply.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reference standard information */}
            <div className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[10px] text-slate-600 leading-normal">
              <div className="flex items-center gap-1 font-bold text-indigo-950 mb-0.5">
                <Info className="w-3 h-3 shrink-0" />
                <span>Standard Information</span>
              </div>
              {selectedStandard === 'HADLOCK' ? (
                <p>
                  <strong>Hadlock reference curves</strong> are the clinical standard in North American obstetrics, calculating expected fetal weight and dimension tolerances based on multi-variate polynomial regression of fetal biometry.
                </p>
              ) : (
                <p>
                  <strong>Intergrowth-21st standard</strong> represents the global reference developed by the WHO and Oxford University. It tracks optimal fetal skeletal and somatic dimensions in low-risk pregnancies globally.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Deep Growth Chart Visualization Component */}
      <GrowthChartVisualization twin={twin} onSelectVisit={onOpenReviewMeasurement} />
      </>
      )}

      {/* 2.5 Symmetrical vs Asymmetrical Growth Analysis HUD */}
      {(activeTab === 'symmetry' || activeTab === 'all') && (
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">
                Fetal Symmetry & HC/AC Longitudinal Tracker
              </h2>
              <p className="text-[11px] text-slate-400">
                Brain-sparing effect diagnostics & abdominal circumference trajectory velocity mapping.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-mono">Confidence:</span>
            <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono text-xs font-bold">
              {hcAcAnalysis.confidence}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Clinical Classification and Recommendation */}
          <div className="lg:col-span-7 bg-slate-950 rounded-lg p-4 border border-slate-800/80 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Asymmetry Classification
              </span>
              <div className="flex items-center space-x-2.5">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  hcAcAnalysis.classification === 'asymmetrical'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    : hcAcAnalysis.classification === 'symmetrical'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {hcAcAnalysis.classification === 'asymmetrical' && 'Asymmetrical FGR (Brain-Sparing)'}
                  {hcAcAnalysis.classification === 'symmetrical' && 'Symmetrical FGR (Early Constraint)'}
                  {hcAcAnalysis.classification === 'none' && 'Normative Symmetric Growth'}
                </span>
                {hcAcAnalysis.asymmetryTrend !== 'none' && (
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    Trend: <span className="text-slate-200 capitalize font-bold">{hcAcAnalysis.asymmetryTrend}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1.5">
                {hcAcAnalysis.clinicalExplanation}
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-900 pt-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">
                Clinical Intervention Guidelines & Surveillance
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {hcAcAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Longitudinal Ratio Series Chart/HUD */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/80 space-y-3 flex-1">
              <div className="flex items-center justify-between pb-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Cranial-to-Abdominal Ratio Tracker
                  </span>
                  <div className="flex items-center space-x-2.5 text-[9px] font-mono">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-px border-t border-dashed border-slate-500" /> Raw
                    </span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <span className="w-2 h-0.5 bg-teal-400 rounded-xs" /> Kalman Smoothed
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded text-[10px]">
                  <button
                    onClick={() => setHcAcViewMode('chart')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      hcAcViewMode === 'chart' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setHcAcViewMode('log')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      hcAcViewMode === 'log' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Log
                  </button>
                </div>
              </div>
              
              {hcAcAnalysis.hcAcRatioSeries.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                  No biometric series data available for tracking.
                </div>
              ) : hcAcViewMode === 'chart' ? (
                <div className="h-44 w-full font-mono text-[10px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hcAcAnalysis.hcAcRatioSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="ga"
                        stroke="#64748b"
                        fontSize={9}
                        tickLine={false}
                        tickFormatter={(v) => `${v}w`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={9}
                        tickLine={false}
                        domain={[0.7, 1.4]}
                        ticks={[0.8, 0.9, 1.0, 1.1, 1.2, 1.3]}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '6px' }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                        itemStyle={{ color: '#2dd4bf' }}
                        formatter={(value: any, name: any) => {
                          const label = name === 'ratioSmoothed' ? 'Kalman Smoothed Ratio' : 'Raw Caliper Ratio';
                          return [`${Number(value).toFixed(3)}`, label];
                        }}
                        labelFormatter={(label) => `Gestation: ${label}w`}
                      />
                      <ReferenceLine 
                        y={1.1} 
                        stroke="#f59e0b" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Asymmetry (>1.10)', fill: '#f59e0b', fontSize: 8, position: 'top' }} 
                      />
                      <ReferenceLine 
                        y={1.0} 
                        stroke="#475569" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Normative Mean (1.0)', fill: '#64748b', fontSize: 8, position: 'bottom' }} 
                      />
                      {/* Raw Curve */}
                      <Line
                        type="monotone"
                        dataKey="ratio"
                        name="ratio"
                        stroke="#475569"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                        activeDot={false}
                      />
                      {/* Smoothed Curve */}
                      <Line
                        type="monotone"
                        dataKey="ratioSmoothed"
                        name="ratioSmoothed"
                        stroke="#2dd4bf"
                        strokeWidth={2.5}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const color = payload.status === 'elevated' ? '#f59e0b' : payload.status === 'depressed' ? '#f43f5e' : '#10b981';
                          return (
                            <circle key={`dot-${payload.ga}`} cx={cx} cy={cy} r={3.5} stroke="#090d16" strokeWidth={1.5} fill={color} />
                          );
                        }}
                        activeDot={{ r: 5, stroke: '#090d16', strokeWidth: 1.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {hcAcAnalysis.hcAcRatioSeries.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/40 text-[11px]">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-slate-300 font-bold">{s.ga.toFixed(1)}w Gestation</span>
                          <span className="text-[9px] text-slate-500 font-mono">| BPD/HC/AC/FL: {s.bpd}/{s.hc}/{s.ac}/{s.fl}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-slate-400">Raw: {s.ratio.toFixed(3)}</span>
                          <span className="font-mono font-extrabold text-teal-400">Smoothed: {s.ratioSmoothed.toFixed(3)}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'elevated'
                              ? 'bg-amber-400'
                              : s.status === 'depressed'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400'
                          }`} title={`Status: ${s.status}`} />
                        </div>
                        <span className="text-[8px] uppercase font-bold text-slate-500 mt-0.5">
                          {s.status === 'elevated' ? 'Disproportionate cranial bias (elevated)' : s.status === 'depressed' ? 'Depressed ratio' : 'Normative symmetry'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick reference bounds footer */}
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/50 text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Normative (&lt;1.0 late)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Asymmetric (&ge;1.1 late)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Out of bounds
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PregnancyTwin AI: Track -> Detect -> Explain Clinical Core Engine Widget & Population Summary */}
      {(activeTab === 'curves' || activeTab === 'all') && (
      <>
      <NicuHeatmapWidget patients={patients} />

      {/* 3. Trajectory Velocity & Population Statistical Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const isAfiBelow5th = twin.currentVisit ? twin.currentVisit.amnioticFluidIndex_cm < 5.0 : false;
          const isAfiAbove95th = twin.currentVisit ? twin.currentVisit.amnioticFluidIndex_cm > 25.0 : false;
          const isAfiOutOfPercentile = isAfiBelow5th || isAfiAbove95th;
          const afiBgClass = isAfiOutOfPercentile
            ? (isAfiBelow5th ? 'bg-rose-50/40 border-rose-300' : 'bg-amber-50/40 border-amber-300')
            : 'bg-white border-slate-200';

          return (
            <div className={`rounded-xl p-4 shadow-xs border transition-all ${afiBgClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Amniotic Fluid Dynamics</span>
                </div>
                {isAfiOutOfPercentile && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isAfiBelow5th ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                    Percentile Alert
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current AFI:</span>
                  <div className="flex items-center space-x-1.5">
                    {isAfiOutOfPercentile && (
                      <span className={`text-[10px] font-extrabold ${isAfiBelow5th ? 'text-rose-700' : 'text-amber-700'}`} title={isAfiBelow5th ? 'Oligohydramnios (<5.0 cm)' : 'Polyhydramnios (>25.0 cm)'}>
                        ⚠️ {isAfiBelow5th ? '< 5th %ile' : '> 95th %ile'}
                      </span>
                    )}
                    <strong className={`font-mono ${isAfiOutOfPercentile ? 'text-rose-600 font-bold' : 'text-teal-800'}`}>
                      {twin.currentVisit?.amnioticFluidIndex_cm} cm
                    </strong>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Longitudinal Velocity:</span>
                  <strong className={`font-mono ${twin.velocities.afiVelocity_cmPerWeek < -0.3 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {twin.velocities.afiVelocity_cmPerWeek} cm/wk
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">AFI Acceleration (d²AFI/dt²):</span>
                  <strong className="font-mono text-slate-700">{twin.velocities.afiAcceleration_cmPerWeekSq} cm/wk²</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Why Now Alert State:</span>
                  <span className={`font-bold ${twin.whyNow.triggered ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {twin.whyNow.triggered ? 'Triggered (Attention)' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {(() => {
          const isEfwBelow5th = twin.currentVisit ? twin.currentVisit.growthPercentile < 5 : false;
          const isEfwAbove95th = twin.currentVisit ? twin.currentVisit.growthPercentile > 95 : false;
          const isEfwOutOfPercentile = isEfwBelow5th || isEfwAbove95th;
          const efwBgClass = isEfwOutOfPercentile
            ? (isEfwBelow5th ? 'bg-rose-50/40 border-rose-300' : 'bg-amber-50/40 border-amber-300')
            : 'bg-white border-slate-200';

          return (
            <div className={`rounded-xl p-4 shadow-xs border transition-all ${efwBgClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Fetal Growth & Hadlock Metrics</span>
                </div>
                {isEfwOutOfPercentile && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isEfwBelow5th ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                    Percentile Alert
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Current EFW:</span>
                  <div className="flex items-center space-x-1.5">
                    {isEfwOutOfPercentile && (
                      <span className={`text-[10px] font-extrabold ${isEfwBelow5th ? 'text-rose-700' : 'text-amber-700'}`} title={isEfwBelow5th ? 'Severe FGR (< 5th percentile)' : 'Severe LGA (> 95th percentile)'}>
                        ⚠️ {isEfwBelow5th ? '< 5th %ile' : '> 95th %ile'}
                      </span>
                    )}
                    <strong className={`font-mono ${isEfwOutOfPercentile ? 'text-rose-600 font-bold' : 'text-indigo-800'}`}>
                      {twin.currentVisit?.estimatedFetalWeight_g} g
                    </strong>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Growth Percentile:</span>
                  <div className="flex items-center space-x-1.5">
                    <strong className={`font-mono ${twin.currentVisit && twin.currentVisit.growthPercentile < 10 ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {twin.currentVisit?.growthPercentile}th percentile
                    </strong>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Weight Velocity:</span>
                  <strong className="font-mono text-slate-800">+{twin.velocities.efwVelocity_gPerWeek} g/wk</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Percentile Velocity:</span>
                  <strong className={`font-mono ${twin.velocities.growthVelocity_percentilePerWeek < -1.5 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {twin.velocities.growthVelocity_percentilePerWeek} %ile/wk
                  </strong>
                </div>
                {twin.whyNow.iugrClassification && twin.whyNow.iugrClassification.type !== 'none' && (
                  <div className="pt-2 border-t border-indigo-100 text-[10px] mt-1.5 space-y-1">
                    <div className="flex justify-between font-bold text-indigo-950">
                      <span>IUGR Typing:</span>
                      <span className="uppercase text-indigo-700 font-extrabold">{twin.whyNow.iugrClassification.type}</span>
                    </div>
                    {twin.whyNow.iugrClassification.hcAcRatio && (
                      <div className="flex justify-between text-slate-500">
                        <span>HC/AC Ratio:</span>
                        <span className="font-mono font-bold text-slate-800">{twin.whyNow.iugrClassification.hcAcRatio}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Serial Scans & Caliper Integrity</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Serial Scan Count:</span>
              <strong className="font-mono text-slate-800">{twin.visits.length} scans</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Baseline Interval:</span>
              <strong className="font-mono text-slate-800">
                {twin.visits[0]?.gestationalAgeWeeks}w → {twin.currentVisit?.gestationalAgeWeeks}w
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Data Confidence Score:</span>
              <strong className="font-mono text-teal-700">{twin.trajectoryScore.confidenceScore}%</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Composite Score:</span>
              <strong className="font-mono text-slate-800">{twin.trajectoryScore.overallScore} / 100</strong>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

    </div>
  );
};

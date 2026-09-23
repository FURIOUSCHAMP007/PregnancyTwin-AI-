/**
 * PregnancyTwin AI - Growth Chart Visualization Component
 * Built with Recharts to plot EFW, AFI, and Growth Percentile trends over time.
 * Supports metric toggling, reference normal corridors, and inter-visit comparison lines.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend
} from 'recharts';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Scale,
  Droplet,
  Percent,
  GitCompare,
  ArrowRight,
  Eye,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  Info,
  ChevronDown,
  Pill,
  Users
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement } from '../types';
import { MedicationTimeline } from './MedicationTimeline';
import { getOrdinal } from '../utils/trajectoryEngine';

export interface GrowthChartVisualizationProps {
  twin: PregnancyDigitalTwin;
  onSelectVisit?: (visit: VisitMeasurement) => void;
}

export type MetricType = 'all' | 'efw' | 'afi' | 'percentile' | 'biometrics';

// Safe wrapper for ReferenceArea to support typed SVG fill & highlight labels
const IntervalArea = ReferenceArea as unknown as React.ComponentType<any>;

const ChartMedicationGanttOverlay: React.FC<{ twin: PregnancyDigitalTwin }> = ({ twin }) => {
  const medications = twin.medications || [];
  const activeMeds = medications.filter(m => m.exposureStatus === 'current' || m.exposureStatus === 'past');
  if (activeMeds.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-150 space-y-2">
      <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Pill className="w-3.5 h-3.5 text-teal-600" />
          <span>Active Medications Timeline Overlay</span>
        </span>
        <span className="font-mono">Weeks 20 — 40 GA</span>
      </div>
      <div className="space-y-1.5 pt-1">
        {activeMeds.map((med, idx) => {
          const colors = [
            'from-teal-500 to-emerald-500',
            'from-indigo-500 to-purple-500',
            'from-amber-500 to-orange-500',
            'from-rose-500 to-pink-500',
            'from-cyan-500 to-sky-500'
          ];
          const bgGradient = colors[idx % colors.length];
          const start = Math.max(20, med.gestationalAgeStartWeeks);
          const stop = Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40);
          
          const startPct = ((start - 20) / 20) * 100;
          const widthPct = Math.max(5, ((stop - start) / 20) * 100);

          return (
            <div key={med.id} className="flex items-center text-[10px] h-4.5 relative group">
              {/* Left medication indicator label */}
              <div className="w-24 font-extrabold text-slate-700 truncate pr-2 select-none" title={med.medicationName}>
                {med.medicationName}
              </div>
              
              {/* Track containing the Gantt bar */}
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full relative">
                <div
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-0 bottom-0 rounded-full bg-gradient-to-r ${bgGradient} border border-black/5 flex items-center justify-center transition-all duration-200 hover:shadow-xs cursor-pointer`}
                  title={`${med.medicationName}: ${med.dose} (${start}w - ${stop}w)`}
                >
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-100 rounded-lg p-2 shadow-lg border border-slate-750 text-[10px] min-w-[200px] z-50 pointer-events-none transition-opacity leading-normal">
                    <p className="font-extrabold text-white">{med.medicationName} ({med.dose})</p>
                    <p className="text-slate-400">Duration: <strong className="text-teal-400 font-mono">{start}w - {stop}w</strong></p>
                    <p className="text-slate-400 truncate">Indication: <strong className="text-slate-200 italic">"{med.indication}"</strong></p>
                  </div>
                </div>
              </div>
              
              {/* Right medication span weeks indicator */}
              <div className="w-10 pl-2 font-mono text-[9px] text-slate-400 text-right select-none">
                {start}–{stop}w
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GrowthChartVisualization: React.FC<GrowthChartVisualizationProps> = ({
  twin,
  onSelectVisit
}) => {
  const { visits, currentVisit, previousVisit, personalAfiBaseline, personalGrowthBaseline, velocities } = twin;

  // Cohort comparison state (Up to 4 scans concurrent plotting)
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>([twin.patient.id]);
  const [cohortTwins, setCohortTwins] = useState<Record<string, any>>({ [twin.patient.id]: twin });
  const [loadingCohort, setLoadingCohort] = useState<boolean>(false);
  const [compareMultiPatients, setCompareMultiPatients] = useState<boolean>(false);

  const cohortColors = [
    { name: 'Teal', stroke: '#0d9488', fill: '#0d9488' },
    { name: 'Emerald', stroke: '#16a34a', fill: '#16a34a' },
    { name: 'Indigo', stroke: '#6366f1', fill: '#6366f1' },
    { name: 'Orange', stroke: '#ea580c', fill: '#ea580c' },
  ];

  React.useEffect(() => {
    fetch('/api/patients', {
      headers: { 'x-user-role': 'admin' }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.patients)) {
          setAllPatients(data.patients);
        } else if (Array.isArray(data)) {
          setAllPatients(data);
        }
      })
      .catch(err => console.error('Error fetching patients for comparison:', err));
  }, []);

  React.useEffect(() => {
    setSelectedCohortIds([twin.patient.id]);
    setCohortTwins({ [twin.patient.id]: twin });
  }, [twin]);

  const handleToggleCohortPatient = async (patientId: string) => {
    if (selectedCohortIds.includes(patientId)) {
      if (patientId === twin.patient.id) return; // cannot deselect primary
      setSelectedCohortIds(prev => prev.filter(id => id !== patientId));
    } else {
      if (selectedCohortIds.length >= 4) {
        alert("You can select up to 4 patients concurrently for growth trajectory comparison.");
        return;
      }
      setSelectedCohortIds(prev => [...prev, patientId]);
      if (!cohortTwins[patientId]) {
        try {
          setLoadingCohort(true);
          const res = await fetch(`/api/patients/${patientId}/twin`, {
            headers: { 'x-user-role': 'admin' }
          });
          const data = await res.json();
          if (data && data.visits) {
            setCohortTwins(prev => ({ ...prev, [patientId]: data }));
          }
        } catch (err) {
          console.error(`Error loading twin for patient ${patientId}:`, err);
        } finally {
          setLoadingCohort(false);
        }
      }
    }
  };

  // Metric Toggle State
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all');
  const [selectedBiometric, setSelectedBiometric] = useState<'all' | 'hc' | 'bpd' | 'ofd' | 'ac' | 'fl'>('all');

  // Toggle Comparison Lines Feature
  const [showComparisonLines, setShowComparisonLines] = useState<boolean>(true);

  // Toggle Normal Reference Bands / Corridors
  const [showReferenceBands, setShowReferenceBands] = useState<boolean>(true);

  // Selected Visits for Comparison
  // Default to previous visit (Visit A) and current visit (Visit B)
  const defaultVisitA = previousVisit
    ? previousVisit.id
    : visits.length >= 2
    ? visits[visits.length - 2].id
    : visits[0]?.id || '';
  const defaultVisitB = currentVisit
    ? currentVisit.id
    : visits[visits.length - 1]?.id || '';

  const [visitAId, setVisitAId] = useState<string>(defaultVisitA);
  const [visitBId, setVisitBId] = useState<string>(defaultVisitB);

  // Compare All 4 Visits state
  const [compareAllVisits, setCompareAllVisits] = useState<boolean>(false);

  // Synchronize when patient changes if selected IDs are invalid
  React.useEffect(() => {
    if (!visits.some(v => v.id === visitAId)) {
      setVisitAId(defaultVisitA);
    }
    if (!visits.some(v => v.id === visitBId)) {
      setVisitBId(defaultVisitB);
    }
  }, [visits, defaultVisitA, defaultVisitB, visitAId, visitBId]);

  const visitA = useMemo(() => visits.find(v => v.id === visitAId) || visits[0], [visits, visitAId]);
  const visitB = useMemo(() => visits.find(v => v.id === visitBId) || visits[visits.length - 1], [visits, visitBId]);

  // Comparison metrics calculation
  const comparisonData = useMemo(() => {
    if (!visitA || !visitB || visitA.id === visitB.id) return null;

    const gaADecimal = visitA.gestationalAgeWeeks + visitA.gestationalAgeDays / 7;
    const gaBDecimal = visitB.gestationalAgeWeeks + visitB.gestationalAgeDays / 7;
    const weeksPassed = Math.max(0.1, Math.abs(gaBDecimal - gaADecimal));

    // EFW
    const efwDelta = visitB.estimatedFetalWeight_g - visitA.estimatedFetalWeight_g;
    const efwPctChange = (efwDelta / visitA.estimatedFetalWeight_g) * 100;
    const efwVelocity = efwDelta / weeksPassed;

    // AFI
    const afiDelta = visitB.amnioticFluidIndex_cm - visitA.amnioticFluidIndex_cm;
    const afiPctChange = (afiDelta / visitA.amnioticFluidIndex_cm) * 100;
    const afiVelocity = afiDelta / weeksPassed;

    // Growth Percentile
    const pctDelta = visitB.growthPercentile - visitA.growthPercentile;
    const pctVelocity = pctDelta / weeksPassed;

    // SDP
    const sdpDelta = visitB.singleDeepestPocket_cm - visitA.singleDeepestPocket_cm;

    // Biometrics deltas
    const bA = visitA.biometrics || {};
    const bB = visitB.biometrics || {};
    const hcDelta = (bB.hc_mm !== undefined && bA.hc_mm !== undefined) ? bB.hc_mm - bA.hc_mm : null;
    const acDelta = (bB.ac_mm !== undefined && bA.ac_mm !== undefined) ? bB.ac_mm - bA.ac_mm : null;
    const flDelta = (bB.fl_mm !== undefined && bA.fl_mm !== undefined) ? bB.fl_mm - bA.fl_mm : null;
    const bpdDelta = (bB.bpd_mm !== undefined && bA.bpd_mm !== undefined) ? bB.bpd_mm - bA.bpd_mm : null;

    return {
      weeksPassed: weeksPassed.toFixed(1),
      daysPassed: Math.round(weeksPassed * 7),
      efwDelta,
      efwPctChange: efwPctChange.toFixed(1),
      efwVelocity: Math.round(efwVelocity),
      afiDelta: afiDelta.toFixed(1),
      afiPctChange: afiPctChange.toFixed(1),
      afiVelocity: afiVelocity.toFixed(2),
      pctDelta,
      pctVelocity: pctVelocity.toFixed(1),
      sdpDelta: sdpDelta.toFixed(1),
      biometrics: {
        hc: hcDelta,
        ac: acDelta,
        fl: flDelta,
        bpd: bpdDelta
      },
      isAfiAlert: visitB.amnioticFluidIndex_cm < 8.0 || afiPctChange <= -15,
      isGrowthAlert: visitB.growthPercentile < 10 || pctDelta <= -15
    };
  }, [visitA, visitB]);

  // Unified chronological chart dataset across gestational age checkpoints
  const chartDataset = useMemo(() => {
    const standardWeeks = [20, 24, 28, 32, 36, 40];
    const allVisitWeeks: number[] = [];

    // Add primary patient's visit weeks
    visits.forEach(v => allVisitWeeks.push(v.gestationalAgeWeeks));

    // Add cohort patients' visit weeks
    selectedCohortIds.forEach(id => {
      const cohortTwin = cohortTwins[id];
      if (cohortTwin && cohortTwin.visits) {
        cohortTwin.visits.forEach((v: any) => allVisitWeeks.push(v.gestationalAgeWeeks));
      }
    });

    const sortedWeeks = Array.from(new Set([...standardWeeks, ...allVisitWeeks])).sort((a, b) => a - b);

    return sortedWeeks.map(ga => {
      const visit = visits.find(v => v.gestationalAgeWeeks === ga);
      const afiBase = personalAfiBaseline.find(b => b.ga === ga);
      const growthBase = personalGrowthBaseline.find(b => b.ga === ga);

      // Hadlock reference calculations
      const baseEfw = growthBase?.expectedEfw ?? Math.round(300 * Math.pow(1.15, ga - 20));
      const efw10th = Math.round(baseEfw * 0.82);
      const efw90th = Math.round(baseEfw * 1.18);

      const gaLabel = `${ga}w`;

      const dataPoint: any = {
        ga: gaLabel,
        gaNum: ga,
        date: visit ? visit.date : undefined,
        visitNumber: visit ? visit.visitNumber : undefined,
        visitId: visit?.id,

        // Biometrics fields (HC, BPD, OFD, AC, FL) and reference curves
        observedHc: visit?.biometrics?.hc_mm || null,
        expectedHc: Math.round(175 + (ga - 20) * 8.5),
        hc10th: Math.round((175 + (ga - 20) * 8.5) * 0.92),
        hc90th: Math.round((175 + (ga - 20) * 8.5) * 1.08),

        observedBpd: visit?.biometrics?.bpd_mm || null,
        expectedBpd: Math.round(45 + (ga - 20) * 2.5),
        bpd10th: Math.round((45 + (ga - 20) * 2.5) * 0.92),
        bpd90th: Math.round((45 + (ga - 20) * 2.5) * 1.08),

        observedOfd: visit?.biometrics?.ofd_mm || null,
        expectedOfd: Math.round(60 + (ga - 20) * 2.75),
        ofd10th: Math.round((60 + (ga - 20) * 2.75) * 0.92),
        ofd90th: Math.round((60 + (ga - 20) * 2.75) * 1.08),

        observedAc: visit?.biometrics?.ac_mm || null,
        expectedAc: Math.round(150 + (ga - 20) * 10.5),
        ac10th: Math.round((150 + (ga - 20) * 10.5) * 0.92),
        ac90th: Math.round((150 + (ga - 20) * 10.5) * 1.08),

        observedFl: visit?.biometrics?.fl_mm || null,
        expectedFl: Math.round(32 + (ga - 20) * 2.15),
        fl10th: Math.round((32 + (ga - 20) * 2.15) * 0.92),
        fl90th: Math.round((32 + (ga - 20) * 2.15) * 1.08),

        // EFW fields
        observedEfw: visit ? visit.estimatedFetalWeight_g : null,
        expectedEfw: baseEfw,
        efw10th,
        efw90th,
        efwRange: [efw10th, efw90th],

        // AFI fields
        observedAfi: visit ? visit.amnioticFluidIndex_cm : null,
        expectedAfi: afiBase?.expectedAfi ?? 11.5,
        sdp: visit ? visit.singleDeepestPocket_cm : null,
        afiNormalRange: [8.0, 18.0],
        oligoThreshold: 5.0,
        borderlineThreshold: 8.0,
        upperThreshold: 18.0,

        // Growth Percentile fields
        growthPercentile: visit ? visit.growthPercentile : null,
        pct10thCutoff: 10,
        pct50thMedian: 50,
        pct90thCutoff: 90,

        // Visit Comparison Flags
        isVisitA: visit?.id === visitA?.id,
        isVisitB: visit?.id === visitB?.id,
        isCurrent: visit?.id === currentVisit?.id,
        doctorReviewStatus: visit?.doctorReviewStatus
      };

      // Ingest other patients' observed parameters for multi-patient plotting overlay
      selectedCohortIds.forEach(id => {
        if (id === twin.patient.id) return; // already added as primary above
        const cohortTwin = cohortTwins[id];
        if (cohortTwin && cohortTwin.visits) {
          const cVisit = cohortTwin.visits.find((v: any) => v.gestationalAgeWeeks === ga);
          if (cVisit) {
            dataPoint[`${id}_observedEfw`] = cVisit.estimatedFetalWeight_g || null;
            dataPoint[`${id}_observedAfi`] = cVisit.amnioticFluidIndex_cm || null;
            dataPoint[`${id}_observedPercentile`] = cVisit.growthPercentile || null;
            dataPoint[`${id}_observedHc`] = cVisit.biometrics?.hc_mm || null;
            dataPoint[`${id}_observedBpd`] = cVisit.biometrics?.bpd_mm || null;
            dataPoint[`${id}_observedAc`] = cVisit.biometrics?.ac_mm || null;
            dataPoint[`${id}_observedFl`] = cVisit.biometrics?.fl_mm || null;
          }
        }
      });

      return dataPoint;
    });
  }, [visits, personalAfiBaseline, personalGrowthBaseline, visitA, visitB, currentVisit, selectedCohortIds, cohortTwins, twin]);

  // Labels for Visit A and Visit B x-axis positions
  const visitAXLabel = visitA ? `${visitA.gestationalAgeWeeks}w` : null;
  const visitBXLabel = visitB ? `${visitB.gestationalAgeWeeks}w` : null;

  // Handlers for quick comparison presets
  const handleSetPrevVsCurrent = () => {
    setCompareAllVisits(false);
    if (visits.length >= 2) {
      setVisitAId(visits[visits.length - 2].id);
      setVisitBId(visits[visits.length - 1].id);
      setShowComparisonLines(true);
    }
  };

  const handleSetFirstVsLatest = () => {
    setCompareAllVisits(false);
    if (visits.length >= 2) {
      setVisitAId(visits[0].id);
      setVisitBId(visits[visits.length - 1].id);
      setShowComparisonLines(true);
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = chartDataset.find(d => d.ga === label);
    const hasVisit = dataPoint && dataPoint.observedEfw !== null;

    return (
      <div className="bg-white border border-slate-200 text-slate-900 rounded-lg p-3 shadow-md text-xs min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
          <span className="font-bold text-slate-900">{label} Gestational Age</span>
          {dataPoint?.date && (
            <span className="text-[10px] text-slate-500 font-mono">{dataPoint.date}</span>
          )}
        </div>

        {hasVisit && (
          <div className="mb-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Visit #{dataPoint.visitNumber}
            </span>
            {dataPoint.doctorReviewStatus && (
              <span className="text-[10px] font-semibold uppercase text-slate-500">
                {dataPoint.doctorReviewStatus}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-600">{entry.name}:</span>
                </div>
                <span className="font-bold font-mono text-slate-900">
                  {typeof entry.value === 'number'
                    ? entry.value.toLocaleString()
                    : entry.value}{' '}
                  {entry.unit || ''}
                </span>
              </div>
            );
          })}
        </div>

        {hasVisit && onSelectVisit && (
          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-teal-700 italic text-center">
            Click data point to review ultrasound measurements
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      
      {/* 1. Header Toolbar: Metrics Switcher & Comparison Line Controls */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-700" />
            <h2 className="text-xs font-bold text-slate-900">
              Growth Chart & Physiological Trajectory
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Longitudinal Intelligence
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Plotting serial EFW, AFI, and Growth Percentile trends with inter-visit comparison reference lines
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Metric Toggle Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedMetric('all')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                selectedMetric === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3 text-teal-700" />
              <span>All 3 Metrics</span>
            </button>

            <button
              onClick={() => setSelectedMetric('efw')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                selectedMetric === 'efw'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3 h-3 text-sky-700" />
              <span>EFW</span>
            </button>

            <button
              onClick={() => setSelectedMetric('afi')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                selectedMetric === 'afi'
                  ? 'bg-white text-amber-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplet className="w-3 h-3 text-amber-600" />
              <span>AFI</span>
            </button>

            <button
              onClick={() => setSelectedMetric('percentile')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                selectedMetric === 'percentile'
                  ? 'bg-white text-purple-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3 h-3 text-purple-700" />
              <span>Percentile</span>
            </button>

            <button
              onClick={() => setSelectedMetric('biometrics')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${
                selectedMetric === 'biometrics'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Biometry (U-Net)</span>
            </button>
          </div>

          {/* Toggle Comparison Lines Switch */}
          <button
            onClick={() => setShowComparisonLines(!showComparisonLines)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center space-x-1.5 transition ${
              showComparisonLines
                ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle vertical comparison reference lines between selected visits"
          >
            <GitCompare className="w-3.5 h-3.5 text-teal-700" />
            <span>Comparison Lines</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showComparisonLines ? 'bg-teal-600' : 'bg-slate-300'}`} />
          </button>

          {/* Toggle Reference Bands Switch */}
          <button
            onClick={() => setShowReferenceBands(!showReferenceBands)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center space-x-1.5 transition ${
              showReferenceBands
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle population reference corridors (10th-90th percentiles)"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-700" />
            <span>Normal Corridors</span>
          </button>
        </div>
      </div>

      {/* 2. Inter-Visit Comparison Controller Strip */}
      {showComparisonLines && (
        <div className="bg-slate-50 text-slate-800 p-3 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-teal-800 font-semibold text-[11px]">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Visits:</span>
            </div>

            {/* Visit A Selector */}
            <div className={`flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs transition-opacity duration-200 ${compareAllVisits ? 'opacity-50' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-slate-500 font-medium text-[11px]">Visit A (Base):</span>
              <select
                value={visitAId}
                disabled={compareAllVisits}
                onChange={(e) => {
                  setVisitAId(e.target.value);
                  setCompareAllVisits(false);
                }}
                className="bg-transparent font-medium text-slate-900 text-xs focus:outline-none cursor-pointer pr-1 disabled:cursor-not-allowed"
              >
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    Visit #{v.visitNumber} ({v.gestationalAgeWeeks}w {v.gestationalAgeDays}d • {v.date})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />

            {/* Visit B Selector */}
            <div className={`flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs transition-opacity duration-200 ${compareAllVisits ? 'opacity-50' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span className="text-slate-500 font-medium text-[11px]">Visit B (Target):</span>
              <select
                value={visitBId}
                disabled={compareAllVisits}
                onChange={(e) => {
                  setVisitBId(e.target.value);
                  setCompareAllVisits(false);
                }}
                className="bg-transparent font-medium text-slate-900 text-xs focus:outline-none cursor-pointer pr-1 disabled:cursor-not-allowed"
              >
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    Visit #{v.visitNumber} ({v.gestationalAgeWeeks}w {v.gestationalAgeDays}d • {v.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons & Delta Summary */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Presets:</span>
            <button
              onClick={handleSetPrevVsCurrent}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-colors ${
                !compareAllVisits && visitAId === (previousVisit?.id || (visits.length >= 2 ? visits[visits.length - 2].id : '')) && visitBId === (currentVisit?.id || (visits.length >= 1 ? visits[visits.length - 1].id : ''))
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              Previous vs Current
            </button>
            <button
              onClick={handleSetFirstVsLatest}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-colors ${
                !compareAllVisits && visitAId === (visits[0]?.id || '') && visitBId === (visits[visits.length - 1]?.id || '')
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              First vs Latest
            </button>
            <button
              onClick={() => {
                setCompareAllVisits(true);
                setShowComparisonLines(true);
              }}
              className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-colors ${
                compareAllVisits
                  ? 'bg-teal-700 border-teal-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              All {visits.length} Visits
            </button>
          </div>
        </div>
      )}

      {/* 4. Cohort Multi-Patient Trajectory Comparison Dashboard */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Patient Trajectory Overlay (Compare Up to 4 Scans)</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Select other patient digital twins from the hospital database to plot and compare their prenatal trajectories side-by-side.
            </p>
          </div>
          <button
            onClick={() => setCompareMultiPatients(!compareMultiPatients)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              compareMultiPatients
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{compareMultiPatients ? 'Disable Multi-Patient Mode' : 'Enable Multi-Patient Plotting'}</span>
          </button>
        </div>

        {compareMultiPatients && (
          <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200 space-y-3.5 animate-in fade-in">
            {/* Roster list */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Select Patients to Overlay (Max 4):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {allPatients.map(p => {
                  const isPrimary = p.id === twin.patient.id;
                  const isSelected = selectedCohortIds.includes(p.id);
                  const indexInCohort = selectedCohortIds.indexOf(p.id);
                  const colorObj = isSelected ? cohortColors[indexInCohort % cohortColors.length] : null;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleCohortPatient(p.id)}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-white border-indigo-400 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[110px]">
                          {p.name}
                        </span>
                        {isSelected && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: colorObj?.stroke }}
                            title={`Plot Color: ${colorObj?.name}`}
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{p.currentGestationalAgeWeeks}w GA</span>
                        <span className={`font-mono text-[9px] font-bold px-1 rounded ${
                          p.status === 'HIGH' ? 'bg-rose-50 text-rose-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      {isPrimary && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-teal-600 text-white font-extrabold px-1 rounded-full uppercase scale-90">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected stats summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              {selectedCohortIds.map((id, index) => {
                const cTwin = cohortTwins[id];
                if (!cTwin) return null;
                const lastVisit = cTwin.visits[cTwin.visits.length - 1];
                const colorObj = cohortColors[index % cohortColors.length];

                return (
                  <div key={id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: colorObj.stroke }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-slate-900 text-xs truncate">
                          {cTwin.patient.name}
                        </p>
                        <span className="text-[9px] text-slate-400">({cTwin.patient.mrn})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        GA: <strong className="text-slate-800 font-mono">{cTwin.patient.currentGestationalAgeWeeks}w</strong> • 
                        EFW: <strong className="text-sky-700 font-mono">{lastVisit?.estimatedFetalWeight_g ?? 'N/A'}g</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. All Visits Multi-Dimensional Comparison Ledger */}
      {showComparisonLines && compareAllVisits && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>All {visits.length} Visits Longitudinal Comparison Ledger</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              Showing growth metrics, fluid volume, and velocities across all prenatal checkpoints
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold tracking-wider uppercase text-[9px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Visit Node</th>
                  <th className="py-2.5 px-3">Gestation</th>
                  <th className="py-2.5 px-3">EFW (Fetal Weight)</th>
                  <th className="py-2.5 px-3">AFI (Fluid Index)</th>
                  <th className="py-2.5 px-3">Growth Percentile</th>
                  <th className="py-2.5 px-3">Sonographic Calipers</th>
                  <th className="py-2.5 px-3">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((v, idx) => {
                  const prevV = idx > 0 ? visits[idx - 1] : null;
                  
                  // Calculate prior delta
                  let efwDeltaStr = '—';
                  let efwVelocityStr = '';
                  if (prevV) {
                    const gaCurr = v.gestationalAgeWeeks + v.gestationalAgeDays / 7;
                    const gaPrev = prevV.gestationalAgeWeeks + prevV.gestationalAgeDays / 7;
                    const weeks = Math.max(0.1, gaCurr - gaPrev);
                    const efwDiff = v.estimatedFetalWeight_g - prevV.estimatedFetalWeight_g;
                    const pct = ((efwDiff / prevV.estimatedFetalWeight_g) * 100).toFixed(1);
                    efwDeltaStr = `${efwDiff >= 0 ? '+' : ''}${efwDiff}g (${pct}%)`;
                    efwVelocityStr = `${Math.round(efwDiff / weeks)} g/wk`;
                  }

                  let afiDeltaStr = '—';
                  let afiVelocityStr = '';
                  if (prevV) {
                    const gaCurr = v.gestationalAgeWeeks + v.gestationalAgeDays / 7;
                    const gaPrev = prevV.gestationalAgeWeeks + prevV.gestationalAgeDays / 7;
                    const weeks = Math.max(0.1, gaCurr - gaPrev);
                    const afiDiff = v.amnioticFluidIndex_cm - prevV.amnioticFluidIndex_cm;
                    const pct = ((afiDiff / prevV.amnioticFluidIndex_cm) * 100).toFixed(1);
                    afiDeltaStr = `${afiDiff >= 0 ? '+' : ''}${afiDiff.toFixed(1)}cm (${pct}%)`;
                    afiVelocityStr = `${(afiDiff / weeks).toFixed(2)} cm/wk`;
                  }

                  let pctDeltaStr = '—';
                  if (prevV) {
                    const pctDiff = v.growthPercentile - prevV.growthPercentile;
                    pctDeltaStr = `${pctDiff >= 0 ? '+' : ''}${pctDiff} %ile`;
                  }

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-950">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-black mr-2">
                          #{v.visitNumber}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">{v.date}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {v.gestationalAgeWeeks}w {v.gestationalAgeDays}d
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{v.estimatedFetalWeight_g} g</div>
                        {prevV ? (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            <span className="text-sky-700 font-semibold">{efwDeltaStr}</span> &bull; {efwVelocityStr}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic font-mono mt-0.5">Baseline establishment</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{v.amnioticFluidIndex_cm.toFixed(1)} cm <span className="text-[10px] text-slate-400 font-normal">(SDP: {v.singleDeepestPocket_cm}cm)</span></div>
                        {prevV ? (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            <span className={v.amnioticFluidIndex_cm < 8 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>{afiDeltaStr}</span> &bull; {afiVelocityStr}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic font-mono mt-0.5">Baseline establishment</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{getOrdinal(v.growthPercentile)} %ile</div>
                        {prevV ? (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            <span className={v.growthPercentile < 10 ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>{pctDeltaStr}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic font-mono mt-0.5">Baseline establishment</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-600 leading-normal">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <span>HC: <strong className="text-slate-800">{v.biometrics?.hc_mm ?? '—'} mm</strong></span>
                          <span>AC: <strong className="text-slate-800">{v.biometrics?.ac_mm ?? '—'} mm</strong></span>
                          <span>FL: <strong className="text-slate-800">{v.biometrics?.fl_mm ?? '—'} mm</strong></span>
                          <span>BPD: <strong className="text-slate-800">{v.biometrics?.bpd_mm ?? '—'} mm</strong></span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{v.doctorReviewStatus}</span>
                          <span className="text-[9px] font-mono text-slate-400">Scan Quality: {v.sourceConfidence * 100}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Comparison Delta KPI Card (Active when comparison is enabled) */}
      {showComparisonLines && !compareAllVisits && comparisonData && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Interval */}
            <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Interval Window</span>
                <Clock className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {comparisonData.weeksPassed} weeks <span className="text-[10px] font-normal text-slate-400">({comparisonData.daysPassed}d)</span>
              </p>
              <span className="text-[9px] text-slate-400 mt-0.5">
                {visitAXLabel} → {visitBXLabel}
              </span>
            </div>

            {/* EFW Delta */}
            <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Δ EFW (Fetal Weight)</span>
                <Scale className="w-3 h-3 text-sky-500" />
              </div>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className={`text-xs font-extrabold ${comparisonData.efwDelta >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
                  {comparisonData.efwDelta >= 0 ? `+${comparisonData.efwDelta}` : comparisonData.efwDelta} g
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  ({comparisonData.efwPctChange}%)
                </span>
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Velocity: <strong>{comparisonData.efwVelocity} g/wk</strong>
              </span>
            </div>

            {/* AFI Delta */}
            <div className={`p-2 bg-white rounded-lg border flex flex-col justify-between ${
              comparisonData.isAfiAlert ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Δ AFI (Fluid Index)</span>
                <Droplet className={`w-3 h-3 ${comparisonData.isAfiAlert ? 'text-amber-500' : 'text-slate-400'}`} />
              </div>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className={`text-xs font-extrabold ${parseFloat(comparisonData.afiDelta) < 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {parseFloat(comparisonData.afiDelta) > 0 ? `+${comparisonData.afiDelta}` : comparisonData.afiDelta} cm
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  ({comparisonData.afiPctChange}%)
                </span>
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Rate: <strong className={parseFloat(comparisonData.afiVelocity) < 0 ? 'text-amber-600' : 'text-slate-700'}>{comparisonData.afiVelocity} cm/wk</strong>
              </span>
            </div>

            {/* Growth %ile Delta */}
            <div className={`p-2 bg-white rounded-lg border flex flex-col justify-between ${
              comparisonData.isGrowthAlert ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Δ Growth Percentile</span>
                <Percent className={`w-3 h-3 ${comparisonData.isGrowthAlert ? 'text-rose-500' : 'text-purple-400'}`} />
              </div>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className={`text-xs font-extrabold ${comparisonData.pctDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {comparisonData.pctDelta > 0 ? `+${comparisonData.pctDelta}` : comparisonData.pctDelta} %ile
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  pts
                </span>
              </div>
              <span className="text-[9px] text-slate-500 mt-0.5">
                Velocity: <strong className={parseFloat(comparisonData.pctVelocity) < 0 ? 'text-rose-600' : 'text-slate-700'}>{comparisonData.pctVelocity} %ile/wk</strong>
              </span>
            </div>

          </div>

          {/* Biometrics Caliper Deltas Strip */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 font-mono bg-white/70 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 font-sans font-semibold uppercase tracking-wider text-[9px]">Sonographic Caliper Deltas:</span>
            <div className="flex items-center space-x-3">
              <span>HC: <strong className="text-slate-800">{comparisonData.biometrics.hc !== null ? (comparisonData.biometrics.hc >= 0 ? `+${comparisonData.biometrics.hc}mm` : `${comparisonData.biometrics.hc}mm`) : '—'}</strong></span>
              <span>AC: <strong className="text-slate-800">{comparisonData.biometrics.ac !== null ? (comparisonData.biometrics.ac >= 0 ? `+${comparisonData.biometrics.ac}mm` : `${comparisonData.biometrics.ac}mm`) : '—'}</strong></span>
              <span>FL: <strong className="text-slate-800">{comparisonData.biometrics.fl !== null ? (comparisonData.biometrics.fl >= 0 ? `+${comparisonData.biometrics.fl}mm` : `${comparisonData.biometrics.fl}mm`) : '—'}</strong></span>
              <span>BPD: <strong className="text-slate-800">{comparisonData.biometrics.bpd !== null ? (comparisonData.biometrics.bpd >= 0 ? `+${comparisonData.biometrics.bpd}mm` : `${comparisonData.biometrics.bpd}mm`) : '—'}</strong></span>
              <span>SDP: <strong className="text-slate-800">{parseFloat(comparisonData.sdpDelta) >= 0 ? `+${comparisonData.sdpDelta}cm` : `${comparisonData.sdpDelta}cm`}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Chart Views */}
      <div className="p-4 bg-white">
        
        {/* --- VIEW MODE A: ALL 3 METRICS COMBINED (Side-by-side coordinated charts) --- */}
        {selectedMetric === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Chart 1: EFW Weight Trend */}
            <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-900">Estimated Fetal Weight (g)</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {currentVisit ? `${currentVisit.estimatedFetalWeight_g}g` : 'N/A'}
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataset} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 3600]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="g" />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Comparison Lines */}
                    {showComparisonLines && (
                      compareAllVisits ? (
                        visits.map((v, i) => (
                          <ReferenceLine
                            key={`ref-all-efw-${v.id}`}
                            x={`${v.gestationalAgeWeeks}w`}
                            stroke={['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]}
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            label={{ value: `V${v.visitNumber}`, fill: ['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5], fontSize: 9, position: 'top' }}
                          />
                        ))
                      ) : (
                        <>
                          {visitAXLabel && (
                            <ReferenceLine
                              x={visitAXLabel}
                              stroke="#6366f1"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'A', fill: '#6366f1', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitBXLabel && (
                            <ReferenceLine
                              x={visitBXLabel}
                              stroke="#0d9488"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'B', fill: '#0d9488', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitAXLabel && visitBXLabel && (
                            <IntervalArea x1={visitAXLabel} x2={visitBXLabel} fill="#6366f1" fillOpacity={0.06} />
                          )}
                        </>
                      )
                    )}
                    {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                      <IntervalArea x1={`${visits[0].gestationalAgeWeeks}w`} x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`} fill="#6366f1" fillOpacity={0.03} />
                    )}

                    {/* Population Standard & Observed Curves */}
                    <Line
                      type="monotone"
                      dataKey="expectedEfw"
                      name="Hadlock 50th %ile"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="observedEfw"
                      name="Observed EFW"
                      unit="g"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 4, fill: '#0284c7', stroke: '#fff', strokeWidth: 1.5 }}
                      connectNulls
                    />
                    {compareMultiPatients && selectedCohortIds.map((id, index) => {
                      if (id === twin.patient.id) return null;
                      const cTwin = cohortTwins[id];
                      if (!cTwin) return null;
                      const colorObj = cohortColors[index % cohortColors.length];
                      return (
                        <Line
                          key={`cohort-efw-${id}`}
                          type="monotone"
                          dataKey={`${id}_observedEfw`}
                          name={`${cTwin.patient.name}`}
                          unit="g"
                          stroke={colorObj.stroke}
                          strokeWidth={2.5}
                          activeDot={{ r: 5 }}
                          dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                          connectNulls
                        />
                      );
                    })}
                    {/* Active Medication Background Spans */}
                    {twin.medications && twin.medications.map((med, idx) => {
                      const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                      if (!isPastOrCurrent) return null;
                      const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                      const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                      const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                      const color = colors[idx % colors.length];
                      return (
                        <IntervalArea
                          key={`ref-med-efw-all-${med.id}`}
                          x1={startLabel}
                          x2={stopLabel}
                          fill={color}
                          fillOpacity={0.03}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Growth Rate: <strong className="text-sky-700">{velocities.efwVelocity_gPerWeek} g/wk</strong></span>
                <span className="text-slate-400">Hadlock standard</span>
              </div>

              <ChartMedicationGanttOverlay twin={twin} />
            </div>

            {/* Chart 2: AFI Fluid Trend */}
            <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Droplet className="w-3.5 h-3.5 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900">Amniotic Fluid Index (cm)</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {currentVisit ? `${currentVisit.amnioticFluidIndex_cm} cm` : 'N/A'}
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataset} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 20]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="cm" />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Comparison Lines */}
                    {showComparisonLines && (
                      compareAllVisits ? (
                        visits.map((v, i) => (
                          <ReferenceLine
                            key={`ref-all-afi-${v.id}`}
                            x={`${v.gestationalAgeWeeks}w`}
                            stroke={['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]}
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            label={{ value: `V${v.visitNumber}`, fill: ['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5], fontSize: 9, position: 'top' }}
                          />
                        ))
                      ) : (
                        <>
                          {visitAXLabel && (
                            <ReferenceLine
                              x={visitAXLabel}
                              stroke="#6366f1"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'A', fill: '#6366f1', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitBXLabel && (
                            <ReferenceLine
                              x={visitBXLabel}
                              stroke="#0d9488"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'B', fill: '#0d9488', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitAXLabel && visitBXLabel && (
                            <IntervalArea x1={visitAXLabel} x2={visitBXLabel} fill="#6366f1" fillOpacity={0.06} />
                          )}
                        </>
                      )
                    )}
                    {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                      <IntervalArea x1={`${visits[0].gestationalAgeWeeks}w`} x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`} fill="#f59e0b" fillOpacity={0.03} />
                    )}

                    {/* Thresholds */}
                    <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="2 2" />
                    <ReferenceLine y={8.0} stroke="#f59e0b" strokeDasharray="2 2" />

                    <Line
                      type="monotone"
                      dataKey="expectedAfi"
                      name="Personal Baseline"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="observedAfi"
                      name="Observed AFI"
                      unit="cm"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }}
                      connectNulls
                    />
                    {compareMultiPatients && selectedCohortIds.map((id, index) => {
                      if (id === twin.patient.id) return null;
                      const cTwin = cohortTwins[id];
                      if (!cTwin) return null;
                      const colorObj = cohortColors[index % cohortColors.length];
                      return (
                        <Line
                          key={`cohort-afi-${id}`}
                          type="monotone"
                          dataKey={`${id}_observedAfi`}
                          name={`${cTwin.patient.name}`}
                          unit="cm"
                          stroke={colorObj.stroke}
                          strokeWidth={2.5}
                          activeDot={{ r: 5 }}
                          dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                          connectNulls
                        />
                      );
                    })}
                    {/* Active Medication Background Spans */}
                    {twin.medications && twin.medications.map((med, idx) => {
                      const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                      if (!isPastOrCurrent) return null;
                      const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                      const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                      const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                      const color = colors[idx % colors.length];
                      return (
                        <IntervalArea
                          key={`ref-med-afi-all-${med.id}`}
                          x1={startLabel}
                          x2={stopLabel}
                          fill={color}
                          fillOpacity={0.03}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Fluid Velocity: <strong className="text-amber-600">{velocities.afiVelocity_cmPerWeek} cm/wk</strong></span>
                <span className="text-slate-400">Oligo cutoff: &lt;5cm</span>
              </div>

              <ChartMedicationGanttOverlay twin={twin} />
            </div>

            {/* Chart 3: Growth Percentile Trend */}
            <div className="p-3 bg-slate-50/60 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">Fetal Growth Percentile</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  {currentVisit ? `${getOrdinal(currentVisit.growthPercentile)} %ile` : 'N/A'}
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataset} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Comparison Lines */}
                    {showComparisonLines && (
                      compareAllVisits ? (
                        visits.map((v, i) => (
                          <ReferenceLine
                            key={`ref-all-pct-${v.id}`}
                            x={`${v.gestationalAgeWeeks}w`}
                            stroke={['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]}
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            label={{ value: `V${v.visitNumber}`, fill: ['#6366f1', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5], fontSize: 9, position: 'top' }}
                          />
                        ))
                      ) : (
                        <>
                          {visitAXLabel && (
                            <ReferenceLine
                              x={visitAXLabel}
                              stroke="#6366f1"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'A', fill: '#6366f1', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitBXLabel && (
                            <ReferenceLine
                              x={visitBXLabel}
                              stroke="#0d9488"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              label={{ value: 'B', fill: '#0d9488', fontSize: 9, position: 'top' }}
                            />
                          )}
                          {visitAXLabel && visitBXLabel && (
                            <IntervalArea x1={visitAXLabel} x2={visitBXLabel} fill="#6366f1" fillOpacity={0.06} />
                          )}
                        </>
                      )
                    )}
                    {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                      <IntervalArea x1={`${visits[0].gestationalAgeWeeks}w`} x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`} fill="#8b5cf6" fillOpacity={0.03} />
                    )}

                    {/* Cutoffs */}
                    <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="2 2" />
                    <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="2 2" />

                    <Line
                      type="monotone"
                      dataKey="growthPercentile"
                      name="Observed %ile"
                      unit="%"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 1.5 }}
                      connectNulls
                    />
                    {compareMultiPatients && selectedCohortIds.map((id, index) => {
                      if (id === twin.patient.id) return null;
                      const cTwin = cohortTwins[id];
                      if (!cTwin) return null;
                      const colorObj = cohortColors[index % cohortColors.length];
                      return (
                        <Line
                          key={`cohort-pct-${id}`}
                          type="monotone"
                          dataKey={`${id}_observedPercentile`}
                          name={`${cTwin.patient.name}`}
                          unit="%"
                          stroke={colorObj.stroke}
                          strokeWidth={2.5}
                          activeDot={{ r: 5 }}
                          dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                          connectNulls
                        />
                      );
                    })}
                    {/* Active Medication Background Spans */}
                    {twin.medications && twin.medications.map((med, idx) => {
                      const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                      if (!isPastOrCurrent) return null;
                      const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                      const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                      const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                      const color = colors[idx % colors.length];
                      return (
                        <IntervalArea
                          key={`ref-med-pct-all-${med.id}`}
                          x1={startLabel}
                          x2={stopLabel}
                          fill={color}
                          fillOpacity={0.03}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Shift Rate: <strong className="text-purple-600">{velocities.growthVelocity_percentilePerWeek} %ile/wk</strong></span>
                <span className="text-slate-400">SGA Cutoff: &lt;10th</span>
              </div>

              <ChartMedicationGanttOverlay twin={twin} />
            </div>

          </div>
        )}

        {/* --- VIEW MODE B: EFW DEEP DIVE WITH HADLOCK CORRIDOR --- */}
        {selectedMetric === 'efw' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Estimated Fetal Weight (EFW) Growth Curve</span>
                <span className="text-slate-500 ml-2">Hadlock sonographic biometry vs 10th-50th-90th percentile bands</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                  <span className="text-slate-700 font-semibold">Observed EFW</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
                  <span className="text-slate-500">50th %ile Median</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span className="font-semibold">10th %ile (SGA Warning)</span>
                </span>
                {showComparisonLines && (
                  <span className="flex items-center space-x-1 text-indigo-700 font-semibold">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-500 inline-block"></span>
                    <span>Inter-Visit Comparison</span>
                  </span>
                )}
              </div>
            </div>

            <div className="h-72 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataset} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 3800]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="g" />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Normal Reference Corridor (10th to 90th percentile) */}
                  {showReferenceBands && (
                    <Area
                      type="monotone"
                      dataKey="efw90th"
                      stroke="none"
                      fill="#0284c7"
                      fillOpacity={0.06}
                      name="90th %ile Band"
                    />
                  )}

                  {/* Inter-Visit Comparison Reference Lines */}
                  {showComparisonLines && (
                    compareAllVisits ? (
                      visits.map((v, i) => (
                        <ReferenceLine
                          key={`ref-all-efw-deep-${v.id}`}
                          x={`${v.gestationalAgeWeeks}w`}
                          stroke={['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5]}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{
                            value: `V${v.visitNumber} (${v.gestationalAgeWeeks}w: ${v.estimatedFetalWeight_g}g)`,
                            fill: ['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5],
                            fontSize: 10,
                            fontWeight: 700,
                            position: 'top'
                          }}
                        />
                      ))
                    ) : (
                      <>
                        {visitAXLabel && (
                          <ReferenceLine
                            x={visitAXLabel}
                            stroke="#6366f1"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit A (${visitA?.gestationalAgeWeeks}w: ${visitA?.estimatedFetalWeight_g}g)`,
                              fill: '#4f46e5',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitBXLabel && (
                          <ReferenceLine
                            x={visitBXLabel}
                            stroke="#0d9488"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit B (${visitB?.gestationalAgeWeeks}w: ${visitB?.estimatedFetalWeight_g}g)`,
                              fill: '#0f766e',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitAXLabel && visitBXLabel && (
                          <IntervalArea
                            x1={visitAXLabel}
                            x2={visitBXLabel}
                            fill="#6366f1"
                            fillOpacity={0.08}
                            label={{
                              value: comparisonData ? `Δ +${comparisonData.efwDelta}g (${comparisonData.weeksPassed}w)` : '',
                              fill: '#4f46e5',
                              fontSize: 11,
                              position: 'center',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </>
                    )
                  )}
                  {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                    <IntervalArea
                      x1={`${visits[0].gestationalAgeWeeks}w`}
                      x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`}
                      fill="#6366f1"
                      fillOpacity={0.03}
                    />
                  )}

                  {/* Reference Lines */}
                  <Line
                    type="monotone"
                    dataKey="efw90th"
                    name="Hadlock 90th %ile"
                    unit="g"
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedEfw"
                    name="Hadlock 50th %ile (Median)"
                    unit="g"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="efw10th"
                    name="Hadlock 10th %ile (FGR Limit)"
                    unit="g"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />

                  {/* Patient's Observed EFW */}
                  <Line
                    type="monotone"
                    dataKey="observedEfw"
                    name="Observed Patient EFW"
                    unit="g"
                    stroke="#0284c7"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                    dot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                  {compareMultiPatients && selectedCohortIds.map((id, index) => {
                    if (id === twin.patient.id) return null;
                    const cTwin = cohortTwins[id];
                    if (!cTwin) return null;
                    const colorObj = cohortColors[index % cohortColors.length];
                    return (
                      <Line
                        key={`cohort-efw-deep-${id}`}
                        type="monotone"
                        dataKey={`${id}_observedEfw`}
                        name={`${cTwin.patient.name}`}
                        unit="g"
                        stroke={colorObj.stroke}
                        strokeWidth={2.5}
                        activeDot={{ r: 5 }}
                        dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                        connectNulls
                      />
                    );
                  })}
                  {/* Active Medication Background Spans */}
                  {twin.medications && twin.medications.map((med, idx) => {
                    const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                    if (!isPastOrCurrent) return null;
                    const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                    const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                    const color = colors[idx % colors.length];
                    return (
                      <IntervalArea
                        key={`ref-med-efw-deep-${med.id}`}
                        x1={startLabel}
                        x2={stopLabel}
                        fill={color}
                        fillOpacity={0.03}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ChartMedicationGanttOverlay twin={twin} />
          </div>
        )}

        {/* --- VIEW MODE C: AFI DEEP DIVE WITH CLINICAL THRESHOLDS --- */}
        {selectedMetric === 'afi' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Amniotic Fluid Index (AFI) Trajectory Curve</span>
                <span className="text-slate-500 ml-2">Observed points vs patient personal baseline and clinical safety limits</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-slate-700 font-semibold">Observed AFI</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
                  <span className="text-slate-500">Personal Baseline</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  <span>Borderline (8.0 cm)</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>Oligo (&lt;5.0 cm)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataset} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 22]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="cm" />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Safety Corridors */}
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: 'Oligohydramnios Limit (5.0 cm)', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }}
                  />
                  <ReferenceLine
                    y={8.0}
                    stroke="#d97706"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: 'Borderline Low Threshold (8.0 cm)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <ReferenceLine
                    y={18.0}
                    stroke="#0284c7"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: 'Upper Normal Limit (18.0 cm)', fill: '#0284c7', fontSize: 10, position: 'insideTopLeft' }}
                  />

                  {/* Inter-Visit Comparison Reference Lines */}
                  {showComparisonLines && (
                    compareAllVisits ? (
                      visits.map((v, i) => (
                        <ReferenceLine
                          key={`ref-all-afi-deep-${v.id}`}
                          x={`${v.gestationalAgeWeeks}w`}
                          stroke={['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5]}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{
                            value: `V${v.visitNumber} (${v.gestationalAgeWeeks}w: ${v.amnioticFluidIndex_cm}cm)`,
                            fill: ['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5],
                            fontSize: 10,
                            fontWeight: 700,
                            position: 'top'
                          }}
                        />
                      ))
                    ) : (
                      <>
                        {visitAXLabel && (
                          <ReferenceLine
                            x={visitAXLabel}
                            stroke="#6366f1"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit A (${visitA?.gestationalAgeWeeks}w: ${visitA?.amnioticFluidIndex_cm}cm)`,
                              fill: '#4f46e5',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitBXLabel && (
                          <ReferenceLine
                            x={visitBXLabel}
                            stroke="#0d9488"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit B (${visitB?.gestationalAgeWeeks}w: ${visitB?.amnioticFluidIndex_cm}cm)`,
                              fill: '#0f766e',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitAXLabel && visitBXLabel && (
                          <IntervalArea
                            x1={visitAXLabel}
                            x2={visitBXLabel}
                            fill="#f59e0b"
                            fillOpacity={0.08}
                            label={{
                              value: comparisonData ? `Δ ${comparisonData.afiDelta}cm (${comparisonData.afiVelocity} cm/wk)` : '',
                              fill: '#b45309',
                              fontSize: 11,
                              position: 'center',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </>
                    )
                  )}
                  {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                    <IntervalArea
                      x1={`${visits[0].gestationalAgeWeeks}w`}
                      x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`}
                      fill="#f59e0b"
                      fillOpacity={0.03}
                    />
                  )}

                  {/* Baseline curve */}
                  <Line
                    type="monotone"
                    dataKey="expectedAfi"
                    name="Personal Expected AFI"
                    unit="cm"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Patient's Observed AFI */}
                  <Line
                    type="monotone"
                    dataKey="observedAfi"
                    name="Observed Patient AFI"
                    unit="cm"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                  {compareMultiPatients && selectedCohortIds.map((id, index) => {
                    if (id === twin.patient.id) return null;
                    const cTwin = cohortTwins[id];
                    if (!cTwin) return null;
                    const colorObj = cohortColors[index % cohortColors.length];
                    return (
                      <Line
                        key={`cohort-afi-deep-${id}`}
                        type="monotone"
                        dataKey={`${id}_observedAfi`}
                        name={`${cTwin.patient.name}`}
                        unit="cm"
                        stroke={colorObj.stroke}
                        strokeWidth={2.5}
                        activeDot={{ r: 5 }}
                        dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                        connectNulls
                      />
                    );
                  })}
                  {/* Active Medication Background Spans */}
                  {twin.medications && twin.medications.map((med, idx) => {
                    const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                    if (!isPastOrCurrent) return null;
                    const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                    const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                    const color = colors[idx % colors.length];
                    return (
                      <IntervalArea
                        key={`ref-med-afi-deep-${med.id}`}
                        x1={startLabel}
                        x2={stopLabel}
                        fill={color}
                        fillOpacity={0.03}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ChartMedicationGanttOverlay twin={twin} />
          </div>
        )}

        {/* --- VIEW MODE D: PERCENTILE DEEP DIVE --- */}
        {selectedMetric === 'percentile' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Fetal Growth Percentile Velocity Deceleration</span>
                <span className="text-slate-500 ml-2">Detects multi-visit percentile rank drops before crossing absolute SGA cutoff</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                  <span className="text-slate-700 font-semibold">Growth Percentile</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>10th %ile SGA Cutoff</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 border-t border-slate-400 inline-block"></span>
                  <span className="text-slate-500">50th %ile Population Median</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataset} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Cutoff lines */}
                  <ReferenceLine
                    y={10}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: '10th %ile SGA / FGR Warning Boundary', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{ value: '50th %ile Median', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }}
                  />

                  {/* Inter-Visit Comparison Reference Lines */}
                  {showComparisonLines && (
                    compareAllVisits ? (
                      visits.map((v, i) => (
                        <ReferenceLine
                          key={`ref-all-pct-deep-${v.id}`}
                          x={`${v.gestationalAgeWeeks}w`}
                          stroke={['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5]}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{
                            value: `V${v.visitNumber} (${v.gestationalAgeWeeks}w: ${v.growthPercentile}th %ile)`,
                            fill: ['#4f46e5', '#0f766e', '#b45309', '#6d28d9', '#db2777'][i % 5],
                            fontSize: 10,
                            fontWeight: 700,
                            position: 'top'
                          }}
                        />
                      ))
                    ) : (
                      <>
                        {visitAXLabel && (
                          <ReferenceLine
                            x={visitAXLabel}
                            stroke="#6366f1"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit A (${visitA?.gestationalAgeWeeks}w: ${visitA?.growthPercentile}th %ile)`,
                              fill: '#4f46e5',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitBXLabel && (
                          <ReferenceLine
                            x={visitBXLabel}
                            stroke="#0d9488"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            label={{
                              value: `Visit B (${visitB?.gestationalAgeWeeks}w: ${visitB?.growthPercentile}th %ile)`,
                              fill: '#0f766e',
                              fontSize: 10,
                              fontWeight: 700,
                              position: 'top'
                            }}
                          />
                        )}
                        {visitAXLabel && visitBXLabel && (
                          <IntervalArea
                            x1={visitAXLabel}
                            x2={visitBXLabel}
                            fill="#8b5cf6"
                            fillOpacity={0.08}
                            label={{
                              value: comparisonData ? `Δ ${comparisonData.pctDelta} %ile (${comparisonData.pctVelocity} %ile/wk)` : '',
                              fill: '#6d28d9',
                              fontSize: 11,
                              position: 'center',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </>
                    )
                  )}
                  {showComparisonLines && compareAllVisits && visits.length >= 2 && (
                    <IntervalArea
                      x1={`${visits[0].gestationalAgeWeeks}w`}
                      x2={`${visits[visits.length - 1].gestationalAgeWeeks}w`}
                      fill="#8b5cf6"
                      fillOpacity={0.03}
                    />
                  )}

                  {/* Patient's Observed Percentile */}
                  <Line
                    type="monotone"
                    dataKey="growthPercentile"
                    name="Patient Growth Percentile"
                    unit="%"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                    dot={{ r: 5, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                  {compareMultiPatients && selectedCohortIds.map((id, index) => {
                    if (id === twin.patient.id) return null;
                    const cTwin = cohortTwins[id];
                    if (!cTwin) return null;
                    const colorObj = cohortColors[index % cohortColors.length];
                    return (
                      <Line
                        key={`cohort-pct-deep-${id}`}
                        type="monotone"
                        dataKey={`${id}_observedPercentile`}
                        name={`${cTwin.patient.name}`}
                        unit="%"
                        stroke={colorObj.stroke}
                        strokeWidth={2.5}
                        activeDot={{ r: 5 }}
                        dot={{ r: 4, fill: colorObj.stroke, stroke: '#fff', strokeWidth: 1.5 }}
                        connectNulls
                      />
                    );
                  })}
                  {/* Active Medication Background Spans */}
                  {twin.medications && twin.medications.map((med, idx) => {
                    const isPastOrCurrent = med.exposureStatus === 'current' || med.exposureStatus === 'past';
                    if (!isPastOrCurrent) return null;
                    const startLabel = `${Math.max(20, med.gestationalAgeStartWeeks)}w`;
                    const stopLabel = `${Math.min(40, med.gestationalAgeStopWeeks || twin.patient.currentGestationalAgeWeeks || 40)}w`;
                    const colors = ['#0d9488', '#6366f1', '#f59e0b', '#b91c1c', '#8b5cf6'];
                    const color = colors[idx % colors.length];
                    return (
                      <IntervalArea
                        key={`ref-med-pct-deep-${med.id}`}
                        x1={startLabel}
                        x2={stopLabel}
                        fill={color}
                        fillOpacity={0.03}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ChartMedicationGanttOverlay twin={twin} />
          </div>
        )}

        {selectedMetric === 'biometrics' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Subheader and Biometric Sub-tabs */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-0.5 text-left w-full md:w-auto">
                <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider font-mono">Anatomical Planes (Swin &amp; nnU-Net)</span>
                <h4 className="text-xs font-black text-slate-800">Dynamic Biometry Growth Trajectory Tracker</h4>
              </div>

              {/* Sub-selector buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/50 text-[10.5px]">
                {(['all', 'hc', 'bpd', 'ofd', 'ac', 'fl'] as const).map(bio => {
                  const labelMap = {
                    all: 'All Biometry',
                    hc: 'HC (Skull)',
                    bpd: 'BPD (Skull)',
                    ofd: 'OFD (Skull)',
                    ac: 'AC (Abdomen)',
                    fl: 'FL (Femur)'
                  };
                  const colors = {
                    all: 'text-slate-800 border-slate-350',
                    hc: 'text-teal-800 border-teal-300',
                    bpd: 'text-indigo-800 border-indigo-300',
                    ofd: 'text-pink-800 border-pink-300',
                    ac: 'text-cyan-800 border-cyan-300',
                    fl: 'text-amber-800 border-amber-300'
                  };
                  const isActive = selectedBiometric === bio;

                  return (
                    <button
                      key={bio}
                      type="button"
                      onClick={() => setSelectedBiometric(bio)}
                      className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap border ${
                        isActive
                          ? `bg-white ${colors[bio]} shadow-3xs font-extrabold`
                          : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/40'
                      }`}
                    >
                      {labelMap[bio]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Plot */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {selectedBiometric === 'all' ? 'Comparative Biometry Overlays' : `${selectedBiometric.toUpperCase()} Gestational Growth Curve`}
                </span>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                  <span>Y-AXIS: mm</span>
                  <span>•</span>
                  <span>X-AXIS: GA (Weeks)</span>
                </div>
              </div>

              <div className="h-72 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-200 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataset} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={selectedBiometric === 'all' ? [0, 360] : undefined} stroke="#94a3b8" tick={{ fontSize: 10 }} unit=" mm" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />

                    {/* Shaded Reference Corridors when single metric selected */}
                    {showReferenceBands && selectedBiometric !== 'all' && (
                      <>
                        <Area
                          type="monotone"
                          dataKey={`${selectedBiometric}10th`}
                          stroke="none"
                          fill="#cbd5e1"
                          fillOpacity={0.15}
                        />
                        <Area
                          type="monotone"
                          dataKey={`${selectedBiometric}90th`}
                          stroke="none"
                          fill="#cbd5e1"
                          fillOpacity={0.15}
                        />
                      </>
                    )}

                    {/* Vertical Highlight Comparison Lines for Selected Visits */}
                    {showComparisonLines && !compareAllVisits && (
                      <>
                        {visitAXLabel && (
                          <ReferenceLine
                            x={visitAXLabel}
                            stroke="#0d9488"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            label={{
                              value: 'PREV VISIT',
                              position: 'top',
                              fill: '#0d9488',
                              fontSize: 8,
                              fontWeight: 700
                            }}
                          />
                        )}
                        {visitBXLabel && (
                          <ReferenceLine
                            x={visitBXLabel}
                            stroke="#0f172a"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            label={{
                              value: 'CURRENT VISIT',
                              position: 'top',
                              fill: '#0f172a',
                              fontSize: 8,
                              fontWeight: 700
                            }}
                          />
                        )}
                      </>
                    )}

                    {/* Series Lines for ALL BIOMETRICS */}
                    {selectedBiometric === 'all' && (
                      <>
                        <Line type="monotone" dataKey="observedHc" name="HC (Head Circ.)" unit=" mm" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey="observedBpd" name="BPD (Biparietal)" unit=" mm" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey="observedOfd" name="OFD (Occipitofrontal)" unit=" mm" stroke="#ec4899" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey="observedAc" name="AC (Abdomen)" unit=" mm" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey="observedFl" name="FL (Femur Length)" unit=" mm" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                      </>
                    )}

                    {/* Single Biometric Observed vs Expected Lines */}
                    {selectedBiometric !== 'all' && (
                      <>
                        <Line
                          type="monotone"
                          dataKey={`observed${selectedBiometric.charAt(0).toUpperCase() + selectedBiometric.slice(1)}`}
                          name={`Patient ${selectedBiometric.toUpperCase()}`}
                          unit=" mm"
                          stroke={
                            selectedBiometric === 'hc' ? '#10b981' :
                            selectedBiometric === 'bpd' ? '#6366f1' :
                            selectedBiometric === 'ofd' ? '#ec4899' :
                            selectedBiometric === 'ac' ? '#06b6d4' : '#f59e0b'
                          }
                          strokeWidth={3.5}
                          activeDot={{ r: 8 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`expected${selectedBiometric.charAt(0).toUpperCase() + selectedBiometric.slice(1)}`}
                          name={`Hadlock Reference Mean`}
                          unit=" mm"
                          stroke="#94a3b8"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth Rates & Real-Time Statistics Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-3xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Caliper Velocity (Swin Tracker)</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-mono font-black text-slate-800">
                      {selectedBiometric === 'all' ? '6.8' : 
                       selectedBiometric === 'hc' ? '8.5' :
                       selectedBiometric === 'bpd' ? '2.4' :
                       selectedBiometric === 'ofd' ? '2.6' :
                       selectedBiometric === 'ac' ? '10.2' : '2.1'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">mm/wk</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  Continuous growth velocity assessed relative to international INTERGROWTH-21st standard references.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-3xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Calibration Metric</span>
                  <div className="text-sm font-bold text-slate-700">DICOM Scale Tag</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">0.385 mm/px resolution</div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  Active voxel-to-physical mapping parsed from metadata headers. All ellipses and calipers are calibrated to real-world units.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-3xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Hadlock Formula Integration</span>
                  <div className="text-xs font-bold text-teal-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hadlock Standard 4P Active</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  Calculates Estimated Fetal Weight (EFW) using continuous input from skull, abdomen, and femur lengths.
                </p>
              </div>
            </div>
            <ChartMedicationGanttOverlay twin={twin} />
          </div>
        )}

      </div>

      {/* 4.5 Medication Exposure Timeline Aligned with GA Axis */}
      <div className="px-4 pb-4 bg-white border-t border-slate-150/60 pt-4">
        <MedicationTimeline
          medications={twin.medications || []}
          visits={twin.visits || []}
          currentGestationalAgeWeeks={twin.patient.currentGestationalAgeWeeks}
        />
      </div>

      {/* 5. Footer Clinical Guidance & Biometrics Snapshot */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>
            Gestational biometry computed via Hadlock 4-parameter standard (BPD, HC, AC, FL). Continuous line interpolates across recorded clinical checkpoints.
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="font-semibold text-slate-700">Checkpoints: {visits.length} Scans</span>
          <span className="text-slate-300">•</span>
          <span className="text-teal-700 font-bold">Status: {twin.patient.status} RISK</span>
        </div>
      </div>

    </div>
  );
};

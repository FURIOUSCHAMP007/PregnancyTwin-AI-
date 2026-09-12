/**
 * PregnancyTwin AI - Dynamic Digital Twin Chart & Visit Comparison Engine
 * Visualizes longitudinal trends for EFW, AFI, and Growth Percentile across patient visits
 * with interactive visit-to-visit comparison and physiological delta scorecards.
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  Droplet,
  Percent,
  Calendar,
  Clock,
  Maximize2
} from 'lucide-react';
import { VisitMeasurement, PregnancyDigitalTwin } from '../types';

interface DigitalTwinChartProps {
  twin: PregnancyDigitalTwin;
  onSelectVisit?: (visit: VisitMeasurement) => void;
}

type ChartViewMode = 'all' | 'afi' | 'efw' | 'percentile';

export const DigitalTwinChart: React.FC<DigitalTwinChartProps> = ({
  twin,
  onSelectVisit
}) => {
  const { visits, currentVisit, previousVisit, personalAfiBaseline, personalGrowthBaseline, velocities } = twin;

  // Selected view mode: All 3 metrics combined or single deep dive
  const [viewMode, setViewMode] = useState<ChartViewMode>('all');

  // Kalman Filter Noise Mitigation Toggle
  const [useKalman, setUseKalman] = useState<boolean>(true);

  // Interactive Visit Comparison State
  // Default: compare previous visit (Visit A) with current visit (Visit B)
  const [visitAId, setVisitAId] = useState<string>(
    previousVisit ? previousVisit.id : (visits.length >= 2 ? visits[visits.length - 2].id : visits[0]?.id || '')
  );
  const [visitBId, setVisitBId] = useState<string>(
    currentVisit ? currentVisit.id : (visits[visits.length - 1]?.id || '')
  );

  const visitA = useMemo(() => visits.find(v => v.id === visitAId) || visits[0], [visits, visitAId]);
  const visitB = useMemo(() => visits.find(v => v.id === visitBId) || visits[visits.length - 1], [visits, visitBId]);

  // Calculate comparison deltas between Visit A and Visit B
  const comparison = useMemo(() => {
    if (!visitA || !visitB || visitA.id === visitB.id) {
      return null;
    }

    const gaDiffWeeks = (visitB.gestationalAgeWeeks + visitB.gestationalAgeDays / 7) -
                        (visitA.gestationalAgeWeeks + visitA.gestationalAgeDays / 7);
    const weeksPassed = Math.max(0.1, Math.abs(gaDiffWeeks));

    const afiDelta = visitB.amnioticFluidIndex_cm - visitA.amnioticFluidIndex_cm;
    const afiPercentChange = ((afiDelta / visitA.amnioticFluidIndex_cm) * 100);
    const afiVelocity = afiDelta / weeksPassed;

    const efwDelta = visitB.estimatedFetalWeight_g - visitA.estimatedFetalWeight_g;
    const efwPercentChange = ((efwDelta / visitA.estimatedFetalWeight_g) * 100);
    const efwVelocity = efwDelta / weeksPassed;

    const percentileDelta = visitB.growthPercentile - visitA.growthPercentile;
    const percentileVelocity = percentileDelta / weeksPassed;

    const sdpDelta = visitB.singleDeepestPocket_cm - visitA.singleDeepestPocket_cm;

    // Biometrics deltas
    const bA = visitA.biometrics || {};
    const bB = visitB.biometrics || {};
    const hcDelta = (bB.hc_mm !== undefined && bA.hc_mm !== undefined) ? bB.hc_mm - bA.hc_mm : null;
    const acDelta = (bB.ac_mm !== undefined && bA.ac_mm !== undefined) ? bB.ac_mm - bA.ac_mm : null;
    const flDelta = (bB.fl_mm !== undefined && bA.fl_mm !== undefined) ? bB.fl_mm - bA.fl_mm : null;
    const bpdDelta = (bB.bpd_mm !== undefined && bA.bpd_mm !== undefined) ? bB.bpd_mm - bA.bpd_mm : null;

    // Clinical interpretation
    let afiAlert = false;
    let afiAlertText = 'Physiological fluid maintenance';
    if (visitB.amnioticFluidIndex_cm < 5.0) {
      afiAlert = true;
      afiAlertText = 'Oligohydramnios (< 5.0 cm)';
    } else if (visitB.amnioticFluidIndex_cm < 8.0 && afiDelta < 0) {
      afiAlert = true;
      afiAlertText = 'Borderline reduced fluid with downward velocity';
    } else if (afiPercentChange <= -20) {
      afiAlert = true;
      afiAlertText = 'Significant >20% fluid drop across interval';
    }

    let growthAlert = false;
    let growthAlertText = 'Concordant fetal growth velocity';
    if (visitB.growthPercentile < 10) {
      growthAlert = true;
      growthAlertText = 'Small for Gestational Age / FGR (< 10th %ile)';
    } else if (percentileDelta <= -15) {
      growthAlert = true;
      growthAlertText = `Growth deceleration: dropped ${Math.abs(percentileDelta)} percentile points`;
    }

    return {
      weeksPassed: weeksPassed.toFixed(1),
      daysPassed: Math.round(weeksPassed * 7),
      afiDelta: afiDelta.toFixed(1),
      afiPercentChange: afiPercentChange.toFixed(1),
      afiVelocity: afiVelocity.toFixed(2),
      afiAlert,
      afiAlertText,
      efwDelta: efwDelta > 0 ? `+${efwDelta}` : `${efwDelta}`,
      efwPercentChange: efwPercentChange.toFixed(1),
      efwVelocity: Math.round(efwVelocity),
      percentileDelta: percentileDelta > 0 ? `+${percentileDelta}` : `${percentileDelta}`,
      percentileVelocity: percentileVelocity.toFixed(1),
      growthAlert,
      growthAlertText,
      sdpDelta: sdpDelta.toFixed(1),
      biometrics: {
        hc: hcDelta,
        ac: acDelta,
        fl: flDelta,
        bpd: bpdDelta
      }
    };
  }, [visitA, visitB]);

  // Quick reset to compare previous vs current
  const handleQuickCompareCurrentPrev = () => {
    if (visits.length >= 2) {
      setVisitAId(visits[visits.length - 2].id);
      setVisitBId(visits[visits.length - 1].id);
    }
  };

  // Prepare unified dataset for charts across all weeks
  const combinedChartData = useMemo(() => {
    // Generate data points by week based on baseline + actual visits
    const gaPoints = [20, 24, 28, 32, 36, 40];
    const visitWeeks = visits.map(v => v.gestationalAgeWeeks);
    const allWeeks = Array.from(new Set([...gaPoints, ...visitWeeks])).sort((a, b) => a - b);

    return allWeeks.map(ga => {
      const visit = visits.find(v => v.gestationalAgeWeeks === ga);
      const afiBase = personalAfiBaseline.find(b => b.ga === ga);
      const growthBase = personalGrowthBaseline.find(b => b.ga === ga);

      return {
        ga: `${ga}w`,
        gaNum: ga,
        date: visit ? visit.date : null,
        // AFI Data
        observedAfi: visit ? visit.amnioticFluidIndex_cm : null,
        kalmanAfi: visit ? visit.kalmanAfi : null,
        expectedAfi: afiBase ? afiBase.expectedAfi : null,
        oligoThreshold: 5.0,
        borderlineThreshold: 8.0,
        normalUpper: 18.0,
        // EFW Data
        observedEfw: visit ? visit.estimatedFetalWeight_g : null,
        expectedEfw50: growthBase ? growthBase.expectedEfw : null,
        efw10th: growthBase ? Math.round(growthBase.expectedEfw * 0.82) : null,
        efw90th: growthBase ? Math.round(growthBase.expectedEfw * 1.18) : null,
        // Percentile Data
        growthPercentile: visit ? visit.growthPercentile : null,
        kalmanPercentile: visit ? visit.kalmanPercentile : null,
        percentile10thCutoff: 10,
        percentile50thRef: 50,
        // Visit Metadata
        visitId: visit?.id,
        isCurrent: visit?.id === currentVisit?.id,
        isPrevious: visit?.id === previousVisit?.id,
        isVisitA: visit?.id === visitAId,
        isVisitB: visit?.id === visitBId,
        reviewStatus: visit?.doctorReviewStatus
      };
    });
  }, [visits, personalAfiBaseline, personalGrowthBaseline, currentVisit, previousVisit, visitAId, visitBId]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-0">
      
      {/* 1. Header Bar with Mode Toggles & Visit Comparison Launcher */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pregnancy Digital Twin Longitudinal Dynamics
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Deterministic Trajectory
            </span>
            <button
              onClick={() => setUseKalman(!useKalman)}
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition flex items-center space-x-1 ${
                useKalman
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title="Filter out sonographer caliper placement error / machine signal noise in real-time"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useKalman ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>1D Kalman Filter: {useKalman ? 'Active' : 'Bypassed'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time tracking of Estimated Fetal Weight (EFW), Amniotic Fluid Index (AFI), and Growth Percentiles with inter-visit delta analytics
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
              viewMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>3-Metric View</span>
          </button>

          <button
            onClick={() => setViewMode('afi')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
              viewMode === 'afi'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-amber-500" />
            <span>AFI (Fluid)</span>
          </button>

          <button
            onClick={() => setViewMode('efw')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
              viewMode === 'efw'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-sky-600" />
            <span>EFW (Weight)</span>
          </button>

          <button
            onClick={() => setViewMode('percentile')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition ${
              viewMode === 'percentile'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-purple-600" />
            <span>Percentile</span>
          </button>
        </div>
      </div>

      {/* 2. Longitudinal Charts Section */}
      <div className="p-4 bg-white">
        {/* --- View Mode: ALL 3 METRICS (Side-by-side or responsive grid) --- */}
        {viewMode === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* 1. AFI Trajectory Mini Chart */}
            <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Droplet className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">AFI Trajectory (cm)</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {currentVisit ? `${currentVisit.amnioticFluidIndex_cm} cm` : 'N/A'}
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 18]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="cm" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="2 2" />
                    <ReferenceLine y={8.0} stroke="#f59e0b" strokeDasharray="2 2" />
                    <Line
                      type="monotone"
                      dataKey="expectedAfi"
                      name="Expected Baseline"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="observedAfi"
                      name={useKalman ? "Raw Observed AFI" : "Observed AFI"}
                      stroke={useKalman ? "#cbd5e1" : "#f59e0b"}
                      strokeWidth={useKalman ? 1.5 : 2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 3, fill: useKalman ? "#cbd5e1" : "#f59e0b", stroke: "#fff", strokeWidth: 1.5 }}
                      connectNulls
                    />
                    {useKalman && (
                      <Line
                        type="monotone"
                        dataKey="kalmanAfi"
                        name="Kalman Filtered AFI"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 1.5 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Velocity: <strong className="text-amber-600">{velocities.afiVelocity_cmPerWeek} cm/wk</strong></span>
                <span className="text-slate-400">Oligo cutoff: &lt;5.0cm</span>
              </div>
            </div>

            {/* 2. EFW Fetal Weight Mini Chart */}
            <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">Estimated Fetal Weight (g)</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {currentVisit ? `${currentVisit.estimatedFetalWeight_g} g` : 'N/A'}
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 3500]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="g" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expectedEfw50"
                      name="50th %ile Ref"
                      stroke="#cbd5e1"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="observedEfw"
                      name="Observed EFW"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 3.5, fill: '#0284c7', stroke: '#fff', strokeWidth: 1.5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Rate: <strong className="text-sky-700">{velocities.efwVelocity_gPerWeek} g/wk</strong></span>
                <span className="text-slate-400">Hadlock Standard</span>
              </div>
            </div>

            {/* 3. Growth Percentile Mini Chart */}
            <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900">Fetal Growth Percentile</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  {currentVisit ? `${currentVisit.growthPercentile}th %ile` : 'N/A'}
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 9 }} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '10px' }}
                    />
                    <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="2 2" label={{ value: '10th (FGR)', fill: '#f43f5e', fontSize: 8, position: 'insideBottomRight' }} />
                    <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="2 2" />
                    <Line
                      type="monotone"
                      dataKey="growthPercentile"
                      name={useKalman ? "Raw Observed Percentile" : "Observed Percentile"}
                      stroke={useKalman ? "#cbd5e1" : "#8b5cf6"}
                      strokeWidth={useKalman ? 1.5 : 2.5}
                      activeDot={{ r: 5 }}
                      dot={{ r: 3, fill: useKalman ? "#cbd5e1" : "#8b5cf6", stroke: "#fff", strokeWidth: 1.5 }}
                      connectNulls
                    />
                    {useKalman && (
                      <Line
                        type="monotone"
                        dataKey="kalmanPercentile"
                        name="Kalman Filtered Percentile"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 1.5 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>Velocity: <strong className="text-purple-600">{velocities.growthVelocity_percentilePerWeek} %ile/wk</strong></span>
                <span className="text-slate-400">Cutoff: &lt;10th SGA</span>
              </div>
            </div>

          </div>
        )}

        {/* --- View Mode: AFI DEEP DIVE --- */}
        {viewMode === 'afi' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Amniotic Fluid Index (AFI) Longitudinal Trajectory</span>
                <span className="text-slate-500 ml-2">Observed points against patient's personalized baseline & clinical alert thresholds</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-slate-600 font-semibold">Observed AFI</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
                  <span className="text-slate-500">Personalized Baseline</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>Oligo (&lt;5cm)</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 20]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="cm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  />
                  <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Oligohydramnios (5.0 cm)', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} />
                  <ReferenceLine y={8.0} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Borderline Low (8.0 cm)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }} />
                  <ReferenceLine y={18.0} stroke="#0284c7" strokeDasharray="3 3" label={{ value: 'Upper Normal (18.0 cm)', fill: '#0284c7', fontSize: 10, position: 'insideTopLeft' }} />
                  
                  <Line
                    type="monotone"
                    dataKey="expectedAfi"
                    name="Personalized Expected AFI"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="observedAfi"
                    name={useKalman ? "Raw Observed AFI" : "Observed AFI"}
                    stroke={useKalman ? "#cbd5e1" : "#f59e0b"}
                    strokeWidth={useKalman ? 2 : 3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4, fill: useKalman ? "#cbd5e1" : "#f59e0b", stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                  {useKalman && (
                    <Line
                      type="monotone"
                      dataKey="kalmanAfi"
                      name="Kalman Filtered AFI (Noise Damped)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      activeDot={{ r: 7 }}
                      dot={{ r: 5, fill: "#6366f1", stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- View Mode: EFW DEEP DIVE --- */}
        {viewMode === 'efw' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Estimated Fetal Weight (EFW) Growth Corridor</span>
                <span className="text-slate-500 ml-2">Hadlock 4-parameter sonographic formula vs 10th-50th-90th percentile standards</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
                  <span className="text-slate-600 font-semibold">Observed EFW</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block"></span>
                  <span className="text-slate-500">50th %ile Reference</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>10th %ile (FGR Limit)</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData} margin={{ top: 15, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 4000]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="g" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="efw90th"
                    name="90th %ile (LGA)"
                    stroke="#e2e8f0"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedEfw50"
                    name="50th %ile Population Baseline"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="efw10th"
                    name="10th %ile (FGR Warning Threshold)"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="observedEfw"
                    name="Observed EFW"
                    stroke="#0284c7"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4.5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- View Mode: PERCENTILE DEEP DIVE --- */}
        {viewMode === 'percentile' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">Fetal Growth Percentile Trajectory Deceleration</span>
                <span className="text-slate-500 ml-2">Assesses physiological percentile velocity drops between consecutive scans</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                  <span className="text-slate-600 font-semibold">Growth Percentile</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>10th Percentile SGA Cutoff</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ga" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  />
                  <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '10th %ile SGA / FGR Threshold', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} />
                  <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: '50th %ile Median', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />
                  
                  <Line
                    type="monotone"
                    dataKey="growthPercentile"
                    name={useKalman ? "Raw Patient Growth %ile" : "Patient Growth %ile"}
                    stroke={useKalman ? "#cbd5e1" : "#8b5cf6"}
                    strokeWidth={useKalman ? 2 : 3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4, fill: useKalman ? "#cbd5e1" : "#8b5cf6", stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls
                  />
                  {useKalman && (
                    <Line
                      type="monotone"
                      dataKey="kalmanPercentile"
                      name="Kalman Filtered %ile (Noise Damped)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      activeDot={{ r: 7 }}
                      dot={{ r: 5, fill: "#6366f1", stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE VISIT-TO-VISIT COMPARISON ENGINE */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-4">
        
        {/* Comparison Header & Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-teal-600" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Inter-Visit Comparative Analysis Engine
              </h4>
              <p className="text-[11px] text-slate-500">
                Direct side-by-side sonographic delta comparison to isolate physiological rate of change
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Visit A Selector */}
            <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Visit A (Base):</span>
              <select
                value={visitAId}
                onChange={(e) => setVisitAId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    Visit {v.visitNumber} ({v.date} • {v.gestationalAgeWeeks}w {v.gestationalAgeDays}d)
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />

            {/* Visit B Selector */}
            <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Visit B (Target):</span>
              <select
                value={visitBId}
                onChange={(e) => setVisitBId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    Visit {v.visitNumber} ({v.date} • {v.gestationalAgeWeeks}w {v.gestationalAgeDays}d)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick compare button */}
            <button
              onClick={handleQuickCompareCurrentPrev}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition shadow-xs"
              title="Compare the most recent visit with the preceding visit"
            >
              Current vs Previous
            </button>
          </div>
        </div>

        {/* Delta Comparison Scorecard */}
        {comparison ? (
          <div className="mt-4 space-y-3">
            
            {/* Top Interval Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Comparing <strong>Visit {visitA.visitNumber}</strong> ({visitA.date}, {visitA.gestationalAgeWeeks}w) with{' '}
                  <strong>Visit {visitB.visitNumber}</strong> ({visitB.date}, {visitB.gestationalAgeWeeks}w)
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="text-slate-500">
                  Elapsed Interval: <strong className="text-slate-800">+{comparison.weeksPassed} weeks</strong> ({comparison.daysPassed} days)
                </span>
              </div>
            </div>

            {/* 4 Core Physiological Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Card 1: AFI Delta */}
              <div className={`p-3 rounded-xl border transition shadow-xs ${
                comparison.afiAlert
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    AFI Delta (Fluid)
                  </span>
                  {comparison.afiAlert ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-extrabold font-mono ${
                      Number(comparison.afiDelta) < 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {Number(comparison.afiDelta) > 0 ? `+${comparison.afiDelta}` : comparison.afiDelta}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">cm</span>
                  </div>
                  <span className={`text-xs font-bold ${
                    Number(comparison.afiPercentChange) < 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {Number(comparison.afiPercentChange) > 0 ? `+${comparison.afiPercentChange}%` : `${comparison.afiPercentChange}%`}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Rate:</span>
                    <strong className={Number(comparison.afiVelocity) < 0 ? 'text-amber-700' : 'text-slate-800'}>
                      {comparison.afiVelocity} cm/wk
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Values:</span>
                    <span>{visitA.amnioticFluidIndex_cm} → {visitB.amnioticFluidIndex_cm} cm</span>
                  </div>
                </div>

                <div className="mt-1.5 text-[10px] font-semibold text-slate-600 italic">
                  {comparison.afiAlertText}
                </div>
              </div>

              {/* Card 2: EFW Weight Delta */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Fetal Weight (EFW) Gain
                  </span>
                  <Scale className="w-3.5 h-3.5 text-sky-600" />
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-extrabold font-mono text-sky-700">
                      {comparison.efwDelta}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">g</span>
                  </div>
                  <span className="text-xs font-bold text-sky-600">
                    +{comparison.efwPercentChange}%
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Growth Velocity:</span>
                    <strong className="text-sky-700">+{comparison.efwVelocity} g/wk</strong>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Values:</span>
                    <span>{visitA.estimatedFetalWeight_g}g → {visitB.estimatedFetalWeight_g}g</span>
                  </div>
                </div>

                <div className="mt-1.5 text-[10px] font-semibold text-slate-500 italic">
                  Physiological fetal mass accumulation
                </div>
              </div>

              {/* Card 3: Growth Percentile Shift */}
              <div className={`p-3 rounded-xl border transition shadow-xs ${
                comparison.growthAlert
                  ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Percentile Velocity
                  </span>
                  {comparison.growthAlert ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-extrabold font-mono ${
                      Number(comparison.percentileDelta) < 0 ? 'text-purple-700' : 'text-slate-800'
                    }`}>
                      {comparison.percentileDelta}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">%ile pts</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {visitA.growthPercentile}th → {visitB.growthPercentile}th
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Velocity:</span>
                    <strong className={Number(comparison.percentileVelocity) < 0 ? 'text-purple-700' : 'text-slate-800'}>
                      {comparison.percentileVelocity} %ile/wk
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Standard:</span>
                    <span>Hadlock 4 Growth Matrix</span>
                  </div>
                </div>

                <div className="mt-1.5 text-[10px] font-semibold text-slate-600 italic">
                  {comparison.growthAlertText}
                </div>
              </div>

              {/* Card 4: Single Deepest Pocket & Biometrics Summary */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Biometric & Pocket Delta
                  </span>
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xs font-semibold text-slate-500">SDP:</span>
                    <span className="text-lg font-bold font-mono text-slate-800">
                      {visitA.singleDeepestPocket_cm} → {visitB.singleDeepestPocket_cm}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({Number(comparison.sdpDelta) > 0 ? `+${comparison.sdpDelta}` : comparison.sdpDelta}cm)
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-mono">
                  <div>HC: {comparison.biometrics.hc !== null ? `+${comparison.biometrics.hc}mm` : '—'}</div>
                  <div>AC: {comparison.biometrics.ac !== null ? `+${comparison.biometrics.ac}mm` : '—'}</div>
                  <div>FL: {comparison.biometrics.fl !== null ? `+${comparison.biometrics.fl}mm` : '—'}</div>
                  <div>BPD: {comparison.biometrics.bpd !== null ? `+${comparison.biometrics.bpd}mm` : '—'}</div>
                </div>

                <div className="mt-1.5 text-[10px] font-semibold text-teal-700 italic">
                  Complete caliper progression documented
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="mt-3 p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            Please select two different visits above to calculate physiological rate of change and comparative deltas.
          </div>
        )}

      </div>

    </div>
  );
};

/**
 * PregnancyTwin AI - Recharts Biometric Historical Trend Line Visualization
 * Displays longitudinal EFW (Estimated Fetal Weight) and AFI (Amniotic Fluid Index)
 * over gestational age, allowing clinicians to visually verify growth trajectories
 * against Hadlock normative corridors and clinical amniotic fluid risk thresholds.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Droplet,
  Scale,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
  Maximize2,
  CheckCircle2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement } from '../types';

interface BiometricTrendLineChartProps {
  twin: PregnancyDigitalTwin;
  selectedVisitId?: string | null;
  onSelectVisitId?: (visitId: string) => void;
  onSelectVisit?: (visit: VisitMeasurement) => void;
}

export type TrendViewMode = 'dual' | 'efw' | 'afi';

// Hadlock 50th percentile weight calculation by gestational age
function getExpected50thEfw(ga: number): number {
  const grams = Math.exp(0.578 + 0.332 * ga - 0.00354 * Math.pow(ga, 2));
  return Math.round(grams);
}

export const BiometricTrendLineChart: React.FC<BiometricTrendLineChartProps> = ({
  twin,
  selectedVisitId,
  onSelectVisitId,
  onSelectVisit
}) => {
  const { patient, visits, currentVisit, velocities, forecast } = twin;
  const [viewMode, setViewMode] = useState<TrendViewMode>('dual');
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showForecastNode, setShowForecastNode] = useState<boolean>(true);

  // Chronologically sorted visits
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const gaA = a.gestationalAgeWeeks + (a.gestationalAgeDays || 0) / 7;
      const gaB = b.gestationalAgeWeeks + (b.gestationalAgeDays || 0) / 7;
      return gaA - gaB;
    });
  }, [visits]);

  // Formatted chart data points
  const chartData = useMemo(() => {
    const points = sortedVisits.map((v, index) => {
      const ga = Number((v.gestationalAgeWeeks + (v.gestationalAgeDays || 0) / 7).toFixed(1));
      const hadlock50 = getExpected50thEfw(ga);
      const hadlock10 = Math.round(hadlock50 * 0.833);
      const hadlock90 = Math.round(hadlock50 * 1.167);

      const prev = index > 0 ? sortedVisits[index - 1] : null;
      const gaDelta = prev ? ga - (prev.gestationalAgeWeeks + (prev.gestationalAgeDays || 0) / 7) : 0;
      const efwDelta = prev ? v.estimatedFetalWeight_g - prev.estimatedFetalWeight_g : 0;
      const afiDelta = prev ? Number((v.amnioticFluidIndex_cm - prev.amnioticFluidIndex_cm).toFixed(1)) : 0;

      return {
        id: v.id,
        visitNumber: v.visitNumber,
        date: v.date,
        ga,
        gaFormatted: `${v.gestationalAgeWeeks}w ${v.gestationalAgeDays || 0}d`,
        gestationalAgeWeeks: v.gestationalAgeWeeks,
        gestationalAgeDays: v.gestationalAgeDays || 0,
        efw: v.estimatedFetalWeight_g,
        growthPercentile: v.growthPercentile,
        afi: Number(v.amnioticFluidIndex_cm.toFixed(1)),
        mvp: v.singleDeepestPocket_cm ? Number(v.singleDeepestPocket_cm.toFixed(1)) : null,
        hadlock50,
        hadlock10,
        hadlock90,
        isCurrent: v.id === currentVisit?.id,
        isSelected: v.id === selectedVisitId,
        sourceConfidence: Math.round((v.sourceConfidence || 0.95) * 100),
        efwDelta,
        afiDelta,
        gaDelta: Number(gaDelta.toFixed(1)),
        isProjected: false
      };
    });

    // Optional projected forecast node
    if (showForecastNode && forecast && forecast.expectedGaWeeks) {
      const lastPoint = points[points.length - 1];
      const forecastGa = forecast.expectedGaWeeks;
      if (lastPoint && forecastGa > lastPoint.ga) {
        const hadlock50 = getExpected50thEfw(forecastGa);
        // Estimate predicted EFW based on velocity or range
        const weeksAhead = forecastGa - lastPoint.ga;
        const estGrowthVelocity = velocities.efwVelocity_gPerWeek > 0 ? velocities.efwVelocity_gPerWeek : 180;
        const predictedEfw = Math.round(lastPoint.efw + estGrowthVelocity * weeksAhead);
        const predictedAfiMid = Number(((forecast.expectedAfiRange[0] + forecast.expectedAfiRange[1]) / 2).toFixed(1));

        points.push({
          id: 'forecast-node',
          visitNumber: points.length + 1,
          date: `Projected (${forecastGa}w)`,
          ga: forecastGa,
          gaFormatted: `${forecastGa}w 0d (Forecast)`,
          gestationalAgeWeeks: forecastGa,
          gestationalAgeDays: 0,
          efw: predictedEfw,
          growthPercentile: Math.round((forecast.expectedGrowthPercentileRange[0] + forecast.expectedGrowthPercentileRange[1]) / 2),
          afi: predictedAfiMid,
          mvp: null,
          hadlock50,
          hadlock10: Math.round(hadlock50 * 0.833),
          hadlock90: Math.round(hadlock50 * 1.167),
          isCurrent: false,
          isSelected: false,
          sourceConfidence: 85,
          efwDelta: predictedEfw - lastPoint.efw,
          afiDelta: Number((predictedAfiMid - lastPoint.afi).toFixed(1)),
          gaDelta: Number(weeksAhead.toFixed(1)),
          isProjected: true
        });
      }
    }

    return points;
  }, [sortedVisits, currentVisit?.id, selectedVisitId, showForecastNode, forecast, velocities]);

  // Gestational Age Domain
  const xDomain = useMemo(() => {
    if (chartData.length === 0) return [20, 40];
    const minGa = Math.floor(Math.min(...chartData.map(d => d.ga)) - 1);
    const maxGa = Math.ceil(Math.max(...chartData.map(d => d.ga)) + 2);
    return [Math.max(16, minGa), Math.min(42, Math.max(38, maxGa))];
  }, [chartData]);

  // EFW Y-Domain
  const efwDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 4000];
    const efwVals = chartData.map(d => d.efw).concat(chartData.map(d => d.hadlock90));
    const min = Math.max(0, Math.floor(Math.min(...efwVals) * 0.85 / 100) * 100);
    const max = Math.ceil(Math.max(...efwVals) * 1.15 / 100) * 100;
    return [min, max];
  }, [chartData]);

  // AFI Y-Domain
  const afiDomain = [0, 26];

  const handlePointClick = (entry: any) => {
    if (!entry || entry.isProjected) return;
    if (onSelectVisitId && entry.id) {
      onSelectVisitId(entry.id);
    }
    if (onSelectVisit) {
      const found = visits.find(v => v.id === entry.id);
      if (found) onSelectVisit(found);
    }
  };

  // Custom Clinical Hover Tooltip
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const isAlertAfi = data.afi < 7.0 || data.afi > 24.0;
    const isAlertGrowth = data.growthPercentile < 15;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs space-y-2.5 min-w-[240px] max-w-[320px]">
        {/* Tooltip Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-bold text-slate-100">{data.gaFormatted}</span>
            {data.isProjected && (
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 px-1.5 py-0.5 rounded font-mono">
                Projected
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {data.date}
          </span>
        </div>

        {/* EFW Section */}
        {(viewMode === 'dual' || viewMode === 'efw') && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                <span className="font-medium">Estimated Fetal Weight:</span>
              </span>
              <strong className="font-mono text-teal-300 text-sm">
                {data.efw.toLocaleString()} g
              </strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4 font-mono">
              <span>Hadlock Percentile:</span>
              <span className={isAlertGrowth ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {data.growthPercentile}th %ile
              </span>
            </div>
            {data.hadlock50 && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pl-4 font-mono">
                <span>Hadlock 50th Mean:</span>
                <span>{data.hadlock50} g ({data.efw >= data.hadlock50 ? '+' : ''}{data.efw - data.hadlock50} g)</span>
              </div>
            )}
          </div>
        )}

        {/* AFI Section */}
        {(viewMode === 'dual' || viewMode === 'afi') && (
          <div className="space-y-1 border-t border-slate-800 pt-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="font-medium">Amniotic Fluid Index (AFI):</span>
              </span>
              <strong className={`font-mono text-sm ${isAlertAfi ? 'text-amber-300' : 'text-indigo-300'}`}>
                {data.afi} cm
              </strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pl-4 font-mono">
              <span>Fluid Classification:</span>
              <span className={data.afi < 5.0 ? 'text-rose-400 font-bold' : data.afi < 8.0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {data.afi < 5.0 ? 'Oligohydramnios (<5cm)' : data.afi < 8.0 ? 'Borderline Low (<8cm)' : data.afi > 24.0 ? 'Polyhydramnios (>24cm)' : 'Normal Volume'}
              </span>
            </div>
            {data.mvp !== null && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pl-4 font-mono">
                <span>Single Deepest Pocket (MVP):</span>
                <span>{data.mvp} cm</span>
              </div>
            )}
          </div>
        )}

        {/* Longitudinal Delta Note */}
        {data.gaDelta > 0 && !data.isProjected && (
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Interval Shift ({data.gaDelta}w):</span>
            <span className="font-mono text-slate-300">
              ΔEFW: +{data.efwDelta}g &bull; ΔAFI: {data.afiDelta >= 0 ? '+' : ''}{data.afiDelta}cm
            </span>
          </div>
        )}

        {/* Action Prompt */}
        {!data.isProjected && (
          <div className="pt-1.5 border-t border-slate-800 text-[9px] text-teal-400 text-center font-mono">
            Click node to inspect scan calipers
          </div>
        )}
      </div>
    );
  };

  // Custom Dot renderer for data nodes
  const renderCustomDot = (props: any, metric: 'efw' | 'afi') => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isSelected = payload.isSelected || payload.id === selectedVisitId;
    const isCurrent = payload.isCurrent;
    const isProjected = payload.isProjected;

    const fillColor = metric === 'efw' ? '#0d9488' : '#6366f1';
    const strokeColor = isSelected ? '#0f172a' : isCurrent ? '#0f766e' : '#ffffff';

    if (isProjected) {
      return (
        <circle
          key={`dot-${metric}-${payload.id}`}
          cx={cx}
          cy={cy}
          r={4}
          fill="none"
          stroke={fillColor}
          strokeWidth={2}
          strokeDasharray="2 2"
        />
      );
    }

    return (
      <g
        key={`dot-${metric}-${payload.id}`}
        onClick={() => handlePointClick(payload)}
        className="cursor-pointer transition-all hover:scale-125"
      >
        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill={fillColor}
            fillOpacity={0.25}
            className="animate-ping"
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 6 : isCurrent ? 5 : 4}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
      </g>
    );
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Top Clinical Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 text-teal-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Longitudinal Biometric Trend Lines (EFW &amp; AFI)</span>
                <span className="text-[10px] font-mono font-medium text-slate-400 lowercase">
                  v. Hadlock Normative Corridors
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Serial sonographic progression across gestational age for {patient.name} &bull; Click any data node to inspect calipers.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Corridor Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Mode Selector */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual Trend (EFW + AFI)
            </button>
            <button
              onClick={() => setViewMode('efw')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                viewMode === 'efw'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EFW Corridors
            </button>
            <button
              onClick={() => setViewMode('afi')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                viewMode === 'afi'
                  ? 'bg-white text-indigo-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AFI Volume
            </button>
          </div>

          {/* Toggle Hadlock / Normal Reference Corridors */}
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showCorridors
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
            title="Toggle normative population bands"
          >
            <Layers className="w-3 h-3 text-slate-500" />
            <span>{showCorridors ? 'Corridors On' : 'Corridors Off'}</span>
          </button>

          {/* Toggle Projected Forecast Node */}
          {forecast && (
            <button
              onClick={() => setShowForecastNode(!showForecastNode)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                showForecastNode
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
              title="Toggle Kalman / XGBoost next scan forecast node"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>{showForecastNode ? 'Forecast On' : 'Forecast Off'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Trajectory Stats Bar (Zero-Pill Typography) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Latest EFW (g)
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {currentVisit ? `${currentVisit.estimatedFetalWeight_g} g` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {currentVisit ? `${currentVisit.growthPercentile}th percentile` : ''}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            EFW Growth Velocity
          </span>
          <span className="font-mono font-bold text-teal-800 text-sm">
            +{velocities.efwVelocity_gPerWeek || 145} g/wk
          </span>
          <span className="text-[10px] text-slate-500 block">
            {velocities.growthVelocity_percentilePerWeek < -1.0 ? 'Decelerating' : 'Concordant'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Latest AFI Volume
          </span>
          <span className={`font-mono font-bold text-sm ${
            (currentVisit?.amnioticFluidIndex_cm || 10) < 7.0 ? 'text-rose-700' : 'text-slate-900'
          }`}>
            {currentVisit ? `${currentVisit.amnioticFluidIndex_cm.toFixed(1)} cm` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            MVP: {currentVisit?.singleDeepestPocket_cm ? `${currentVisit.singleDeepestPocket_cm.toFixed(1)} cm` : '—'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            AFI Shift Velocity
          </span>
          <span className={`font-mono font-bold text-sm ${
            velocities.afiVelocity_cmPerWeek < -0.3 ? 'text-rose-700' : 'text-slate-900'
          }`}>
            {velocities.afiVelocity_cmPerWeek >= 0 ? '+' : ''}{velocities.afiVelocity_cmPerWeek} cm/wk
          </span>
          <span className="text-[10px] text-slate-500 block">
            {velocities.afiVelocity_cmPerWeek < -0.3 ? 'Accelerated drop' : 'Stable volume'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Trajectory Status
          </span>
          <span className="font-bold text-slate-800 text-[11px] block truncate">
            {patient.trajectoryCategory.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Score: {twin.trajectoryScore.overallScore}/100
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Serial Interval
          </span>
          <span className="font-mono text-slate-800 text-[11px] font-bold block">
            {sortedVisits[0]?.gestationalAgeWeeks}w &rarr; {sortedVisits[sortedVisits.length - 1]?.gestationalAgeWeeks}w GA
          </span>
          <span className="text-[10px] text-slate-500 block">
            {sortedVisits.length} Scans Plotted
          </span>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 35, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

            {/* X-Axis: Gestational Age in completed weeks */}
            <XAxis
              dataKey="ga"
              type="number"
              domain={xDomain}
              tickCount={9}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(ga) => `${ga}w`}
              label={{
                value: 'Gestational Age (Completed Weeks)',
                position: 'insideBottom',
                offset: -12,
                fill: '#64748b',
                fontSize: 11,
                fontWeight: 600
              }}
            />

            {/* Left Y-Axis: EFW (g) */}
            {(viewMode === 'dual' || viewMode === 'efw') && (
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={efwDomain}
                stroke="#0d9488"
                tick={{ fontSize: 10, fill: '#0d9488' }}
                tickFormatter={(val) => `${val}g`}
                label={{
                  value: 'Estimated Fetal Weight (g)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#0d9488',
                  fontSize: 11,
                  fontWeight: 600,
                  offset: 0
                }}
              />
            )}

            {/* Right Y-Axis: AFI (cm) */}
            {(viewMode === 'dual' || viewMode === 'afi') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={afiDomain}
                stroke="#6366f1"
                tick={{ fontSize: 10, fill: '#6366f1' }}
                tickFormatter={(val) => `${val}cm`}
                label={{
                  value: 'Amniotic Fluid Index (cm)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#6366f1',
                  fontSize: 11,
                  fontWeight: 600,
                  offset: 0
                }}
              />
            )}

            <Tooltip content={renderCustomTooltip} />

            {/* Normative Reference Lines & Thresholds for AFI */}
            {(viewMode === 'dual' || viewMode === 'afi') && showCorridors && (
              <>
                {/* Oligohydramnios Critical Threshold (5.0 cm) */}
                <ReferenceLine
                  yAxisId="right"
                  y={5.0}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Critical Oligo (<5.0 cm)',
                    position: 'insideBottomRight',
                    fill: '#ef4444',
                    fontSize: 9,
                    fontWeight: 700
                  }}
                />

                {/* Borderline Low Fluid Threshold (8.0 cm) */}
                <ReferenceLine
                  yAxisId="right"
                  y={8.0}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Borderline Low (<8.0 cm)',
                    position: 'insideBottomRight',
                    fill: '#d97706',
                    fontSize: 9
                  }}
                />

                {/* Normal Upper Bound (18.0 cm) */}
                <ReferenceLine
                  yAxisId="right"
                  y={18.0}
                  stroke="#cbd5e1"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              </>
            )}

            {/* Selected Visit GA Marker */}
            {selectedVisitId && (
              (() => {
                const selected = chartData.find(d => d.id === selectedVisitId);
                if (!selected) return null;
                return (
                  <ReferenceLine
                    x={selected.ga}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    label={{
                      value: `Selected: ${selected.gaFormatted}`,
                      position: 'top',
                      fill: '#0f172a',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                );
              })()
            )}

            {/* Hadlock 10th & 90th percentile corridor lines in EFW mode */}
            {viewMode === 'efw' && showCorridors && (
              <>
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hadlock90"
                  name="Hadlock 90th %ile"
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hadlock10"
                  name="Hadlock 10th %ile (FGR Cutoff)"
                  stroke="#f87171"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Hadlock 50th Percentile Population Baseline */}
            {(viewMode === 'dual' || viewMode === 'efw') && showCorridors && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hadlock50"
                name="Hadlock 50th Mean"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1.2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Patient Primary EFW Trend Line */}
            {(viewMode === 'dual' || viewMode === 'efw') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="efw"
                name="Patient EFW (g)"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={(props) => renderCustomDot(props, 'efw')}
                activeDot={{ r: 7, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            )}

            {/* Patient Primary AFI Trend Line */}
            {(viewMode === 'dual' || viewMode === 'afi') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="afi"
                name="Patient AFI (cm)"
                stroke="#6366f1"
                strokeWidth={2.5}
                strokeDasharray={viewMode === 'dual' ? '5 3' : undefined}
                dot={(props) => renderCustomDot(props, 'afi')}
                activeDot={{ r: 7, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            )}

            <Legend
              verticalAlign="top"
              height={36}
              iconSize={10}
              wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Guide & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal-600 inline-block" />
            <strong className="text-slate-700">Patient EFW</strong> (Left Axis)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-600 border-b border-dashed inline-block" />
            <strong className="text-slate-700">Patient AFI</strong> (Right Axis)
          </span>
          {showCorridors && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border-b border-dotted inline-block" />
              <span>Hadlock 50th Corridor</span>
            </span>
          )}
          {showCorridors && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-b border-dotted inline-block" />
              <span>Critical Oligo (&lt;5cm)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
          <span>Interactive Recharts Engine</span>
          <span>&bull;</span>
          <span>{sortedVisits.length} Serial Scans</span>
        </div>
      </div>
    </div>
  );
};

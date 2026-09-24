import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ReferenceArea
} from 'recharts';
import {
  Activity,
  Heart,
  Scale,
  PlusCircle,
  Trash2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement } from '../types';
import { MaternalBaselineModelPanel } from './MaternalBaselineModelPanel';

interface MaternalVitalsLog {
  id: string;
  date: string;
  gestationalAgeWeeks: number;
  systolic: number;
  diastolic: number;
  weightKg: number;
}

interface MaternalVitalsTrackerProps {
  twin: PregnancyDigitalTwin;
  onRefresh?: () => void;
}

// Healthy Gestational Weight Gain guidelines according to pre-pregnancy BMI (ACOG/IOM)
// Underweight (<18.5 BMI): 12.5 - 18 kg
// Normal weight (18.5 - 24.9 BMI): 11.5 - 16 kg
// Overweight (25.0 - 29.9 BMI): 7 - 11.5 kg
// Obese (>=30 BMI): 5 - 9 kg
const getWeightGainGuidelines = (bmi: number) => {
  if (bmi < 18.5) return { min: 12.5, max: 18.0, label: 'Underweight Range (12.5–18.0 kg)' };
  if (bmi < 25.0) return { min: 11.5, max: 16.0, label: 'Normal Range (11.5–16.0 kg)' };
  if (bmi < 30.0) return { min: 7.0, max: 11.5, label: 'Overweight Range (7.0–11.5 kg)' };
  return { min: 5.0, max: 9.0, label: 'Obese Range (5.0–9.0 kg)' };
};

export const MaternalVitalsTracker: React.FC<MaternalVitalsTrackerProps> = ({ twin, onRefresh }) => {
  const { patient, visits } = twin;
  const bmi = patient.maternalBmi || 24.5;
  const guidelines = getWeightGainGuidelines(bmi);

  // Local state for logged weekly vitals
  const [logs, setLogs] = useState<MaternalVitalsLog[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'baseline-model' | 'curves' | 'all'>('baseline-model');

  // Form input states
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logGaWeeks, setLogGaWeeks] = useState<number>(Math.round(patient.currentGestationalAgeWeeks || 28));
  const [logSystolic, setLogSystolic] = useState<number>(118);
  const [logDiastolic, setLogDiastolic] = useState<number>(75);
  const [logWeight, setLogWeight] = useState<number>(70);

  // Default pre-pregnancy weight reference to compute weight gain delta
  const [baselineWeight, setBaselineWeight] = useState<number>(() => {
    // Determine a reasonable pre-pregnancy baseline weight based on height & BMI if available
    // Otherwise fallback to a standard starting weight
    const savedBaseline = localStorage.getItem(`baseline_weight_${patient.id}`);
    if (savedBaseline) return parseFloat(savedBaseline);
    
    // Estimate starting weight (e.g. 62kg default for Emma Wilson, 74kg for Olivia Martinez)
    if (patient.id === 'pat-001') return 60.5;
    if (patient.id === 'pat-002') return 71.0;
    if (patient.id === 'pat-003') return 56.0;
    if (patient.id === 'pat-004') return 68.0;
    if (patient.id === 'pat-005') return 64.5;
    return 65.0;
  });

  // Load / Seed Vitals
  useEffect(() => {
    const storageKey = `maternal_vitals_${patient.id}`;
    const savedLogs = localStorage.getItem(storageKey);
    
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      // Create high-fidelity seed logs matching patient profile visits and historical timelines
      const seedLogs: MaternalVitalsLog[] = [];
      const baseW = baselineWeight;
      
      visits.forEach((visit, index) => {
        // Parse BP e.g. "118/74 mmHg" or fallback
        let systolic = 118;
        let diastolic = 75;
        if (visit.bloodPressure) {
          const cleanBp = visit.bloodPressure.replace(' mmHg', '').trim();
          const parts = cleanBp.split('/');
          if (parts.length === 2) {
            systolic = parseInt(parts[0]) || 118;
            diastolic = parseInt(parts[1]) || 75;
          }
        }

        // Generate weight gain proportionally with Gestational Age weeks (starting at 20w up to current visit)
        // Average healthy gain is ~0.4 kg per week after first trimester
        const gaWeeks = visit.gestationalAgeWeeks + (visit.gestationalAgeDays / 7);
        const wDelta = Math.max(0, gaWeeks - 20) * 0.45;
        
        // Add subtle deviation for high-risk patients
        // For Sophia Brown (pat-003) - flatter weight curve (associated with FGR)
        // For Olivia Martinez (pat-002) - rapid preeclampsia water retention weight gain + higher BP
        let weightFactor = wDelta;
        if (patient.id === 'pat-003') {
          weightFactor = wDelta * 0.25; // extremely low weight gain
        } else if (patient.id === 'pat-002') {
          weightFactor = wDelta * 1.5; // excessive water retention
        }

        seedLogs.push({
          id: `seed-${visit.id}`,
          date: visit.date,
          gestationalAgeWeeks: visit.gestationalAgeWeeks,
          systolic,
          diastolic,
          weightKg: Math.round((baseW + weightFactor) * 10) / 10
        });
      });

      // Sort seed logs by gestational age
      seedLogs.sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
      setLogs(seedLogs);
      localStorage.setItem(storageKey, JSON.stringify(seedLogs));
    }
  }, [patient.id, visits, baselineWeight]);

  // Adjust default weight input based on latest log
  useEffect(() => {
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => b.gestationalAgeWeeks - a.gestationalAgeWeeks);
      setLogWeight(sorted[0].weightKg);
      setLogSystolic(sorted[0].systolic);
      setLogDiastolic(sorted[0].diastolic);
    }
  }, [logs]);

  // Sync baseline weight
  const handleUpdateBaselineWeight = (newWeight: number) => {
    if (newWeight <= 0 || isNaN(newWeight)) return;
    setBaselineWeight(newWeight);
    localStorage.setItem(`baseline_weight_${patient.id}`, newWeight.toString());
    
    // Clear and re-seed with new baseline on next trigger
    localStorage.removeItem(`maternal_vitals_${patient.id}`);
    window.location.reload(); // Refresh to trigger re-seed
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logSystolic <= 0 || logDiastolic <= 0 || logWeight <= 0) return;

    const newLog: MaternalVitalsLog = {
      id: `manual-${Date.now()}`,
      date: logDate,
      gestationalAgeWeeks: Number(logGaWeeks),
      systolic: Number(logSystolic),
      diastolic: Number(logDiastolic),
      weightKg: Math.round(Number(logWeight) * 10) / 10
    };

    // Remove duplicates for the same gestational week to prevent chart clustering
    const updatedLogs = logs.filter(l => l.gestationalAgeWeeks !== newLog.gestationalAgeWeeks);
    updatedLogs.push(newLog);
    updatedLogs.sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);

    setLogs(updatedLogs);
    localStorage.setItem(`maternal_vitals_${patient.id}`, JSON.stringify(updatedLogs));
    
    setSuccessMsg(`Successfully logged maternal vitals for Week ${logGaWeeks}!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem(`maternal_vitals_${patient.id}`, JSON.stringify(updated));
  };

  // Compile combined data for charts (correlating logged maternal vitals with fetal growth visits)
  const chartData = React.useMemo(() => {
    // Generate weekly points from GA 20 to 40
    const points: any[] = [];
    
    for (let wk = 20; wk <= 40; wk++) {
      // Find logged vitals for this week
      const vitalLog = logs.find(l => l.gestationalAgeWeeks === wk);
      
      // Find fetal ultrasound visit closest to this week (exact match or within 1 week range)
      const closestVisit = visits.find(v => v.gestationalAgeWeeks === wk);
      
      // Find general fetal growth trend matching visits
      let fetalPercentile: number | undefined = undefined;
      let efwG: number | undefined = undefined;
      
      if (closestVisit) {
        fetalPercentile = closestVisit.growthPercentile;
        efwG = closestVisit.estimatedFetalWeight_g;
      } else {
        // Try interpolating fetal percentile if we have visits surrounding this week
        const sortedVisits = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
        const prevV = sortedVisits.filter(v => v.gestationalAgeWeeks <= wk).pop();
        const nextV = sortedVisits.find(v => v.gestationalAgeWeeks >= wk);
        
        if (prevV && nextV) {
          const ratio = (wk - prevV.gestationalAgeWeeks) / Math.max(1, nextV.gestationalAgeWeeks - prevV.gestationalAgeWeeks);
          fetalPercentile = Math.round(prevV.growthPercentile + ratio * (nextV.growthPercentile - prevV.growthPercentile));
        } else if (prevV) {
          fetalPercentile = prevV.growthPercentile;
        } else if (nextV) {
          fetalPercentile = nextV.growthPercentile;
        }
      }

      if (vitalLog || closestVisit) {
        const weightDelta = vitalLog ? Math.round((vitalLog.weightKg - baselineWeight) * 10) / 10 : undefined;
        
        points.push({
          gestationalAgeWeeks: wk,
          systolic: vitalLog?.systolic,
          diastolic: vitalLog?.diastolic,
          maternalWeightKg: vitalLog?.weightKg,
          maternalWeightGainKg: weightDelta,
          fetalPercentile: fetalPercentile,
          efw_g: efwG,
          date: vitalLog?.date || closestVisit?.date || `Wk ${wk}`
        });
      }
    }

    return points.sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  }, [logs, visits, baselineWeight]);

  // Compute physiological correlation coefficient (Spearman approx) & generate clinical insights
  const statisticalAnalysis = React.useMemo(() => {
    // filter points that have both blood pressure and fetal percentile
    const alignedPoints = chartData.filter(p => p.systolic !== undefined && p.fetalPercentile !== undefined);
    
    if (alignedPoints.length < 2) {
      return {
        correlationCoeff: 0,
        correlationLabel: 'Insufficient Data',
        correlationDesc: 'Requires at least 2 longitudinal points with aligned maternal vitals and fetal growth scans to construct Spearman correlation indices.',
        riskClass: 'text-slate-500 bg-slate-50 border-slate-200'
      };
    }

    // BP Mean
    const meanBp = alignedPoints.reduce((acc, curr) => acc + curr.systolic, 0) / alignedPoints.length;
    // Fetal Percentile Mean
    const meanFetal = alignedPoints.reduce((acc, curr) => acc + curr.fetalPercentile, 0) / alignedPoints.length;

    // Pearson / Spearman simplified correlation
    let num = 0;
    let den1 = 0;
    let den2 = 0;

    alignedPoints.forEach(p => {
      const devBp = p.systolic - meanBp;
      const devFetal = p.fetalPercentile - meanFetal;
      num += (devBp * devFetal);
      den1 += (devBp * devBp);
      den2 += (devFetal * devFetal);
    });

    const r = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
    const rAbs = Math.abs(r);

    let label = 'No Correlation';
    let desc = '';
    let riskClass = '';

    if (rAbs < 0.2) {
      label = 'Negligible/No Correlation';
      desc = `The maternal systolic blood pressure trajectory shows no structural mathematical correlation with the fetal growth percentile curve (r = ${r.toFixed(2)}). Fetal growth is likely dictated by non-vascular intrinsic mechanisms or stable placental perfusion.`;
      riskClass = 'bg-slate-50 border-slate-200 text-slate-700';
    } else if (r < -0.2) {
      const strength = rAbs > 0.7 ? 'Strong Negative' : 'Moderate Negative';
      label = `${strength} Correlation Detected`;
      desc = `Maternal blood pressure elevation strongly maps to fetal percentile deceleration (r = ${r.toFixed(2)}). As systolic pressures climb, we observe corresponding contractions in fetal growth velocity. This is a classic perinatology marker of uteroplacental insufficiency, chronic vasospasm, and potential ischemic placental decay.`;
      riskClass = 'bg-rose-50 border-rose-200 text-rose-800 font-semibold';
    } else {
      const strength = rAbs > 0.7 ? 'Strong Positive' : 'Moderate Positive';
      label = `${strength} Correlation Detected`;
      desc = `A positive trend exists between maternal perfusion pressure and fetal growth (r = ${r.toFixed(2)}). Blood pressures remain inside physiological bounds, indicating stable uterine blood flow and matching fetal growth rates.`;
      riskClass = 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold';
    }

    return {
      correlationCoeff: r,
      correlationLabel: label,
      correlationDesc: desc,
      riskClass
    };
  }, [chartData]);

  // Check if any logged BP exceeds critical gestational limits (>140 systolic or >90 diastolic)
  const lastLog = logs.length > 0 ? [...logs].sort((a, b) => b.gestationalAgeWeeks - a.gestationalAgeWeeks)[0] : null;
  const isHighBp = lastLog ? (lastLog.systolic >= 140 || lastLog.diastolic >= 90) : false;
  const totalWeightGain = lastLog ? Math.round((lastLog.weightKg - baselineWeight) * 10) / 10 : 0;

  let weightGainStatus = 'On Track';
  let weightGainColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (lastLog) {
    const currentWk = lastLog.gestationalAgeWeeks;
    // Expected gain range up to current week (approx 0.35 - 0.5 kg per week starting around 12w)
    const expectedMin = Math.max(2.0, (currentWk - 12) * 0.35);
    const expectedMax = Math.max(4.0, (currentWk - 12) * 0.55);
    
    if (totalWeightGain < expectedMin) {
      weightGainStatus = 'Suboptimal Gain';
      weightGainColor = 'text-rose-600 bg-rose-50 border-rose-150';
    } else if (totalWeightGain > expectedMax) {
      weightGainStatus = 'Excessive Gain';
      weightGainColor = 'text-amber-600 bg-amber-50 border-amber-150';
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Context Ribbon */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Heart className="w-5 h-5 text-rose-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Maternal Physiology &amp; Baseline Studio
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Structured 11-parameter maternal baseline model (PLAN 1), longitudinal blood pressure dynamics, and gestational weight gain curves.
            </p>
          </div>
        </div>

        {/* View Mode Navigation Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('baseline-model')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'baseline-model'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Baseline Model</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              viewMode === 'baseline-model' ? 'bg-teal-800 text-teal-200' : 'bg-teal-100 text-teal-800'
            }`}>
              PLAN 1
            </span>
          </button>

          <button
            onClick={() => setViewMode('curves')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'curves'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Longitudinal Curves</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'all'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* 1. PLAN 1: Structured Maternal Baseline Model (XGBoost / Random Forest Ensemble) */}
      {(viewMode === 'baseline-model' || viewMode === 'all') && (
        <MaternalBaselineModelPanel
          twin={twin}
          onBaselineUpdated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* 2. Longitudinal Vital Curves, KPIs & Calibration Studio */}
      {(viewMode === 'curves' || viewMode === 'all') && (
        <>

      {/* Primary KPI Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Latest BP */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
          <div className={`p-3 rounded-xl border ${isHighBp ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Latest BP Record</div>
            <div className="text-lg font-black text-slate-900">
              {lastLog ? `${lastLog.systolic}/${lastLog.diastolic}` : '---/---'} <span className="text-[10px] font-semibold text-slate-400">mmHg</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {lastLog ? `Recorded at week ${lastLog.gestationalAgeWeeks}` : 'No records yet'}
            </div>
          </div>
        </div>

        {/* Metric 2: Baseline Weight */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pre-Pregnancy Weight</div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                value={baselineWeight}
                onChange={(e) => handleUpdateBaselineWeight(parseFloat(e.target.value))}
                className="w-16 text-sm font-black text-slate-900 border-b border-slate-200 focus:border-teal-600 focus:outline-none bg-transparent"
              />
              <span className="text-[10px] font-bold text-slate-400">kg</span>
            </div>
            <div className="text-[9px] text-slate-500 font-medium truncate">
              BMI: {bmi.toFixed(1)} &bull; {guidelines.label.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Metric 3: Total Weight Gain */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Weight Gain</div>
            <div className="text-lg font-black text-slate-900">
              {lastLog ? `+${totalWeightGain}` : '+0'} <span className="text-[10px] font-semibold text-slate-400">kg</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${weightGainColor}`}>
              {weightGainStatus}
            </span>
          </div>
        </div>

        {/* Metric 4: Fetal-Maternal Correlation Coeff */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
          <div className={`p-3 rounded-xl border ${statisticalAnalysis.correlationCoeff < -0.4 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Systolic vs. Fetal Growth</div>
            <div className="text-lg font-black text-slate-900">
              r = {statisticalAnalysis.correlationCoeff.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[150px]" title={statisticalAnalysis.correlationLabel}>
              {statisticalAnalysis.correlationLabel}
            </span>
          </div>
        </div>

      </div>

      {/* Correlation Visualizers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart A: Blood Pressure & Fetal Percentile Correlation */}
        <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Maternal Blood Pressure vs Fetal Growth Percentile</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Weekly systemic BP plotted alongside ultrasound fetal growth velocity</p>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gestationalAgeWeeks" stroke="#94a3b8" fontSize={9} tickLine={false} label={{ value: 'Gestational Age (Weeks)', position: 'insideBottom', offset: -5, fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis yAxisId="left" stroke="#ef4444" fontSize={9} tickLine={false} domain={[60, 160]} label={{ value: 'Maternal BP (mmHg)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: '#ef4444', fontWeight: 'bold' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={9} tickLine={false} domain={[0, 100]} label={{ value: 'Fetal Growth Percentile (%)', angle: 90, position: 'insideRight', offset: 10, fontSize: 9, fill: '#0ea5e9', fontWeight: 'bold' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-[10px] border border-slate-800 space-y-1 font-sans">
                          <div className="font-extrabold text-slate-200">Gestation: {data.gestationalAgeWeeks} Weeks</div>
                          <div className="border-t border-slate-800 pt-1 space-y-0.5">
                            {data.systolic && <div className="text-rose-400 font-bold">Maternal BP: {data.systolic}/{data.diastolic} mmHg</div>}
                            {data.fetalPercentile !== undefined && <div className="text-sky-400 font-bold">Fetal Percentile: {data.fetalPercentile}th %ile</div>}
                            {data.efw_g && <div className="text-slate-300">Estimated Fetal Weight: {data.efw_g}g</div>}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                
                {/* Visual reference regions for Gestational Hypertension */}
                <ReferenceLine yAxisId="left" y={140} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'ACOG Hyper Threshold (140)', position: 'insideTopLeft', fill: '#f43f5e', fontSize: 8, fontWeight: 'bold' }} />
                <ReferenceLine yAxisId="left" y={90} stroke="#fda4af" strokeDasharray="3 3" label={{ value: 'Diastolic Limit (90)', position: 'insideBottomLeft', fill: '#f43f5e', fontSize: 8, fontWeight: 'bold' }} />
                <ReferenceLine yAxisId="right" y={15} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: 'FGR Warning Corridor (15%)', position: 'insideRight', fill: '#0284c7', fontSize: 8, fontWeight: 'bold' }} />

                {/* Plot Systolic & Diastolic */}
                <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2.5} name="Systolic BP" activeDot={{ r: 5 }} connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#f87171" strokeWidth={1.5} name="Diastolic BP" strokeDasharray="4 4" connectNulls />
                
                {/* Plot Fetal Percentile */}
                <Line yAxisId="right" type="monotone" dataKey="fetalPercentile" stroke="#0ea5e9" strokeWidth={3} name="Fetal Percentile" activeDot={{ r: 6 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Maternal Weight Gain Corridor vs Fetal Percentile Correlation */}
        <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Gestational Weight Gain vs Fetal Growth Percentile</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Cumulative maternal weight gain corridor co-plotted against fetal growth percentiles</p>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gestationalAgeWeeks" stroke="#94a3b8" fontSize={9} tickLine={false} label={{ value: 'Gestational Age (Weeks)', position: 'insideBottom', offset: -5, fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={9} tickLine={false} domain={[-2, 20]} label={{ value: 'Weight Gain Delta (kg)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: '#10b981', fontWeight: 'bold' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={9} tickLine={false} domain={[0, 100]} label={{ value: 'Fetal Growth Percentile (%)', angle: 90, position: 'insideRight', offset: 10, fontSize: 9, fill: '#0ea5e9', fontWeight: 'bold' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-[10px] border border-slate-800 space-y-1 font-sans">
                          <div className="font-extrabold text-slate-200">Gestation: {data.gestationalAgeWeeks} Weeks</div>
                          <div className="border-t border-slate-800 pt-1 space-y-0.5">
                            {data.maternalWeightKg && <div className="text-emerald-400 font-bold">Maternal Weight: {data.maternalWeightKg} kg</div>}
                            {data.maternalWeightGainKg !== undefined && <div className="text-emerald-300 font-bold">Gain Delta: +{data.maternalWeightGainKg} kg</div>}
                            {data.fetalPercentile !== undefined && <div className="text-sky-400 font-bold">Fetal Percentile: {data.fetalPercentile}th %ile</div>}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                
                {/* Shading representing recommended weight corridor bounds for week GA */}
                <Area yAxisId="left" type="monotone" dataKey={(p) => Math.max(0, (p.gestationalAgeWeeks - 12) * 0.35)} stroke="transparent" fill="#d1fae5" fillOpacity={0.4} name="IOM Rec Low Corridor" />
                <Area yAxisId="left" type="monotone" dataKey={(p) => Math.max(0, (p.gestationalAgeWeeks - 12) * 0.55)} stroke="transparent" fill="#a7f3d0" fillOpacity={0.3} name="IOM Rec High Corridor" />

                <Line yAxisId="left" type="monotone" dataKey="maternalWeightGainKg" stroke="#10b981" strokeWidth={2.5} name="Maternal Gain Delta" activeDot={{ r: 5 }} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="fetalPercentile" stroke="#0ea5e9" strokeWidth={3} name="Fetal Percentile" activeDot={{ r: 6 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Advanced Statistical Correlation Analyst Insight Board */}
      <div className={`p-5 rounded-2xl border ${statisticalAnalysis.riskClass} flex flex-col md:flex-row gap-4 items-start`}>
        <div className="p-3 bg-white/75 border border-black/5 rounded-xl shadow-3xs shrink-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              ⚡ Trajectory Engine: Statistical Correlation &amp; Pathophysiological Insight
            </h4>
            <span className="text-[9px] font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded">
              Active Analytical Resolver
            </span>
          </div>
          <p className="text-xs leading-relaxed font-medium">
            {statisticalAnalysis.correlationDesc}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="text-[10px] bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
              <strong>IOM BMI Category Guidelines:</strong> Gain target {guidelines.min}–{guidelines.max} kg total.
            </div>
            {lastLog && (
              <div className="text-[10px] bg-white/50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
                <strong>Current trajectory rate:</strong> +{(totalWeightGain / Math.max(1, lastLog.gestationalAgeWeeks - 12)).toFixed(2)} kg/wk.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Clinician Entry Workstation + Logging Table */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Clinician Entry Form */}
        <div className="md:col-span-4 bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Log Weekly Vitals Node</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">Capture maternal metrics for the weekly twin trajectory solver.</p>
          </div>

          {successMsg && (
            <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-lg text-[10px] font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAddLog} className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">
                Gestation Week Node
              </label>
              <select
                value={logGaWeeks}
                onChange={(e) => setLogGaWeeks(Number(e.target.value))}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 cursor-pointer focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                {Array.from({ length: 21 }, (_, i) => i + 20).map(wk => (
                  <option key={wk} value={wk}>Week {wk} GA</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">
                  Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={logSystolic}
                  onChange={(e) => setLogSystolic(Number(e.target.value))}
                  placeholder="e.g. 118"
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  min="50"
                  max="220"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">
                  Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={logDiastolic}
                  onChange={(e) => setLogDiastolic(Number(e.target.value))}
                  placeholder="e.g. 75"
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  min="30"
                  max="140"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">
                Maternal Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={logWeight}
                onChange={(e) => setLogWeight(Number(e.target.value))}
                placeholder="e.g. 68.4"
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                min="35"
                max="250"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">
                Date Recorded
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ingest Vitals to Twin</span>
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="md:col-span-8 bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Longitudinal Maternal Vitals Logs
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">Historical weekly checkpoints logged for {patient.name}</p>
            </div>
            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
              {logs.length} Logged Checkpoints
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400">
                  <th className="py-2">Gestation GA</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Blood Pressure</th>
                  <th className="py-2">Weight (kg)</th>
                  <th className="py-2">Gain Delta</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {logs.length > 0 ? (
                  [...logs].sort((a, b) => b.gestationalAgeWeeks - a.gestationalAgeWeeks).map((log) => {
                    const gain = Math.round((log.weightKg - baselineWeight) * 10) / 10;
                    const isLogHypertensive = log.systolic >= 140 || log.diastolic >= 90;
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">Week {log.gestationalAgeWeeks} GA</td>
                        <td className="py-2.5 text-slate-500 font-mono text-[10px]">{log.date}</td>
                        <td className="py-2.5 font-bold">
                          <span className={isLogHypertensive ? 'text-rose-600 font-black' : 'text-slate-800'}>
                            {log.systolic}/{log.diastolic} mmHg
                          </span>
                          {isLogHypertensive && (
                            <span className="ml-1.5 inline-block text-[8px] px-1 bg-rose-50 text-rose-700 border border-rose-100 rounded font-bold uppercase tracking-wider">
                              HYPER
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">{log.weightKg} kg</td>
                        <td className="py-2.5">
                          <span className={gain > 12 ? 'text-amber-600 font-bold' : gain < 3 ? 'text-slate-500' : 'text-emerald-600 font-bold'}>
                            +{gain} kg
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete vital log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 italic">No maternal vitals logged. Add your first week above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  );
};

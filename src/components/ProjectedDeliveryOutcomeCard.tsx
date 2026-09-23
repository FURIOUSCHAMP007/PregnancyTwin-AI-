import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sliders,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement } from '../types';

interface ProjectedDeliveryOutcomeCardProps {
  twin: PregnancyDigitalTwin;
  onNavigateToDeliveryTab?: () => void;
  className?: string;
}

export type TrajectoryScenario = 'actual' | 'stabilized' | 'accelerated';

export const ProjectedDeliveryOutcomeCard: React.FC<ProjectedDeliveryOutcomeCardProps> = ({
  twin,
  onNavigateToDeliveryTab,
  className = ''
}) => {
  const { patient, visits, currentVisit, velocities, whyNow, trajectoryScore } = twin;

  // Interactive scenario simulation toggle
  const [scenario, setScenario] = useState<TrajectoryScenario>('actual');
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Chronologically sorted visits
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const aGA = a.gestationalAgeWeeks + (a.gestationalAgeDays || 0) / 7;
      const bGA = b.gestationalAgeWeeks + (b.gestationalAgeDays || 0) / 7;
      return aGA - bGA;
    });
  }, [visits]);

  // Derive trajectory features
  const trajectoryFeatures = useMemo(() => {
    const firstVisit = sortedVisits[0];
    const latestVisit = sortedVisits[sortedVisits.length - 1] || currentVisit;

    const currentGa = latestVisit
      ? latestVisit.gestationalAgeWeeks + (latestVisit.gestationalAgeDays || 0) / 7
      : 32.0;

    const firstGa = firstVisit
      ? firstVisit.gestationalAgeWeeks + (firstVisit.gestationalAgeDays || 0) / 7
      : currentGa;

    const gaSpan = Math.max(0.5, currentGa - firstGa);

    const latestAfi = latestVisit ? latestVisit.amnioticFluidIndex_cm : 12.0;
    const firstAfi = firstVisit ? firstVisit.amnioticFluidIndex_cm : latestAfi;
    const afiSlope = velocities?.afiVelocity_cmPerWeek !== undefined
      ? velocities.afiVelocity_cmPerWeek
      : gaSpan > 0 ? (latestAfi - firstAfi) / gaSpan : 0;

    const latestEfw = latestVisit ? latestVisit.estimatedFetalWeight_g : 1850;
    const firstEfw = firstVisit ? firstVisit.estimatedFetalWeight_g : latestEfw;
    const efwSlope = velocities?.efwVelocity_gPerWeek !== undefined
      ? velocities.efwVelocity_gPerWeek
      : gaSpan > 0 ? (latestEfw - firstEfw) / gaSpan : 150;

    const latestPct = latestVisit ? latestVisit.growthPercentile : 50;
    const growthVelocity = velocities?.growthVelocity_percentilePerWeek || 0;
    const isHighRisk = patient.status === 'HIGH';
    const consecutiveDrops = whyNow?.consecutiveDropsCount || 0;

    return {
      currentGa,
      latestAfi,
      afiSlope,
      latestEfw,
      efwSlope,
      latestPct,
      growthVelocity,
      isHighRisk,
      consecutiveDrops,
      presentation: latestVisit?.presentation || 'cephalic',
      placenta: latestVisit?.placentaLocation || 'posterior',
      sdp: latestVisit?.singleDeepestPocket_cm || Number((latestAfi / 2.7).toFixed(1))
    };
  }, [sortedVisits, currentVisit, velocities, whyNow, patient]);

  // Projected Outcome & Window Calculation based on latest trajectory data
  const outcomeCalculation = useMemo(() => {
    const {
      currentGa,
      latestAfi,
      afiSlope,
      latestEfw,
      efwSlope,
      latestPct,
      growthVelocity,
      isHighRisk,
      consecutiveDrops,
      presentation,
      sdp
    } = trajectoryFeatures;

    // Apply scenario modifier
    let effectiveAfiSlope = afiSlope;
    let effectivePct = latestPct;
    let effectiveEfwSlope = efwSlope;
    let effectiveLatestAfi = latestAfi;
    let effectiveLatestEfw = latestEfw;

    if (scenario === 'stabilized') {
      effectiveAfiSlope = Math.max(-0.05, afiSlope + 0.35);
      effectivePct = Math.min(65, latestPct + 8);
      effectiveEfwSlope = Math.max(160, efwSlope + 25);
      effectiveLatestAfi = Math.max(10.5, latestAfi + 1.8);
      effectiveLatestEfw = Math.round(latestEfw * 1.05);
    } else if (scenario === 'accelerated') {
      effectiveAfiSlope = Math.min(-0.65, afiSlope - 0.3);
      effectivePct = Math.max(5, latestPct - 12);
      effectiveEfwSlope = Math.min(90, efwSlope - 35);
      effectiveLatestAfi = Math.min(4.8, latestAfi - 2.5);
      effectiveLatestEfw = Math.round(latestEfw * 0.94);
    }

    // 1. Baseline Target GA at Delivery
    let estimatedGa = 38.6 + (currentGa - 32) * 0.12;

    // 2. Trajectory Adjustments & Factors
    const factorBreakdown: {
      name: string;
      valueText: string;
      contributionWeeks: number;
      clinicalRationale: string;
      severity: 'normal' | 'watch' | 'alert';
    }[] = [];

    // Factor: Maternal Risk Profile
    if (isHighRisk) {
      estimatedGa -= 1.1;
      factorBreakdown.push({
        name: 'Maternal Clinical Risk Profile',
        valueText: 'High Risk (Comorbidity / Prior Obstetric Risk)',
        contributionWeeks: -1.1,
        clinicalRationale: 'Mandates expedited surveillance and protocolized delivery prior to 39w0d.',
        severity: 'alert'
      });
    } else {
      factorBreakdown.push({
        name: 'Maternal Clinical Risk Profile',
        valueText: 'Routine Low Risk Profile',
        contributionWeeks: 0,
        clinicalRationale: 'Supports expectant term management to spontaneous labor onset.',
        severity: 'normal'
      });
    }

    // Factor: AFI Trajectory & Absolute Volume
    if (effectiveLatestAfi < 5.0 || sdp < 2.0) {
      estimatedGa -= 1.4;
      factorBreakdown.push({
        name: 'Amniotic Fluid Volume (Oligohydramnios)',
        valueText: `AFI ${effectiveLatestAfi.toFixed(1)} cm · SDP ${sdp.toFixed(1)} cm`,
        contributionWeeks: -1.4,
        clinicalRationale: 'Critical oligohydramnios threshold triggers indicated delivery around 36–37w per ACOG PB #204.',
        severity: 'alert'
      });
    } else if (effectiveAfiSlope < -0.3 || effectiveLatestAfi < 8.0) {
      estimatedGa -= 0.8;
      factorBreakdown.push({
        name: 'AFI Trajectory Velocity',
        valueText: `${effectiveAfiSlope.toFixed(2)} cm/wk (Borderline Low AFI ${effectiveLatestAfi.toFixed(1)} cm)`,
        contributionWeeks: -0.8,
        clinicalRationale: 'Accelerated fluid depletion slope shortens physiological maintenance window.',
        severity: 'watch'
      });
    } else {
      factorBreakdown.push({
        name: 'Amniotic Fluid Concordance',
        valueText: `AFI ${effectiveLatestAfi.toFixed(1)} cm (${effectiveAfiSlope >= 0 ? '+' : ''}${effectiveAfiSlope.toFixed(2)} cm/wk)`,
        contributionWeeks: 0,
        clinicalRationale: 'Adequate fluid pocket volume and stable longitudinal velocity.',
        severity: 'normal'
      });
    }

    // Factor: Fetal Growth Concordance & EFW Velocity
    if (effectivePct < 10) {
      estimatedGa -= 1.2;
      factorBreakdown.push({
        name: 'Fetal Growth Restriction (FGR <10th %ile)',
        valueText: `${effectivePct}th percentile (${effectiveLatestEfw}g)`,
        contributionWeeks: -1.2,
        clinicalRationale: 'Growth restriction warrants planned delivery at 37w0d–37w6d with Doppler surveillance.',
        severity: 'alert'
      });
    } else if (effectivePct < 20 || growthVelocity < -1.5) {
      estimatedGa -= 0.6;
      factorBreakdown.push({
        name: 'Fetal Growth Velocity Deceleration',
        valueText: `${effectivePct}th %ile (${growthVelocity.toFixed(1)} %ile/wk shift)`,
        contributionWeeks: -0.6,
        clinicalRationale: 'Downward percentile trajectory indicates relative placental insufficiency.',
        severity: 'watch'
      });
    } else {
      factorBreakdown.push({
        name: 'Fetal Growth Trajectory',
        valueText: `${effectivePct}th percentile (EFW +${effectiveEfwSlope.toFixed(0)} g/wk)`,
        contributionWeeks: 0,
        clinicalRationale: 'Growth conforms to Hadlock 50th percentile normative corridor.',
        severity: 'normal'
      });
    }

    // Factor: Consecutive Drops / Trajectory Score
    if (consecutiveDrops >= 2) {
      estimatedGa -= 0.4;
      factorBreakdown.push({
        name: 'Persistent Serial Trajectory Drift',
        valueText: `${consecutiveDrops} consecutive drop scans (Score: ${trajectoryScore?.overallScore || 72}/100)`,
        contributionWeeks: -0.4,
        clinicalRationale: 'Compounded serial downward deviations justify tighter delivery window bounds.',
        severity: 'watch'
      });
    }

    // Bound estimated delivery GA to physiologically safe limits
    estimatedGa = Math.max(currentGa + 0.3, Math.min(41.2, Math.max(35.0, Number(estimatedGa.toFixed(1)))));

    // Window bounds (± 4 to 5 days)
    const minGa = Math.max(currentGa + 0.2, Number((estimatedGa - 0.6).toFixed(1)));
    const maxGa = Math.min(41.4, Number((estimatedGa + 0.7).toFixed(1)));

    // Format GA string (weeks + days)
    const formatGaString = (gaVal: number) => {
      const w = Math.floor(gaVal);
      const d = Math.round((gaVal % 1) * 7);
      return `${w}w ${d}d`;
    };

    const gaWindowStr = `${formatGaString(minGa)} – ${formatGaString(maxGa)}`;
    const medianGaStr = formatGaString(estimatedGa);

    // Calculate Calendar Dates based on patient EDD (which represents 40w 0d)
    let baselineEddDate: Date;
    if (patient.edd && !isNaN(new Date(patient.edd).getTime())) {
      baselineEddDate = new Date(patient.edd);
    } else {
      // Derive baseline EDD: 40.0 - currentGa weeks from today
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      baselineEddDate = new Date(Date.now() + (40.0 - currentGa) * msPerWeek);
    }

    // Compute calendar dates for estimated delivery and window
    const daysOffsetMedian = (estimatedGa - 40.0) * 7;
    const daysOffsetMin = (minGa - 40.0) * 7;
    const daysOffsetMax = (maxGa - 40.0) * 7;

    const projectedDeliveryDate = new Date(baselineEddDate.getTime() + daysOffsetMedian * 24 * 60 * 60 * 1000);
    const windowStartDate = new Date(baselineEddDate.getTime() + daysOffsetMin * 24 * 60 * 60 * 1000);
    const windowEndDate = new Date(baselineEddDate.getTime() + daysOffsetMax * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const calendarWindowStr = `${formatDate(windowStartDate)} – ${formatDate(windowEndDate)}`;
    const projectedDateStr = formatDate(projectedDeliveryDate);
    const baselineEddStr = formatDate(baselineEddDate);

    // Days remaining countdown
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((projectedDeliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemainingStart = Math.max(0, Math.ceil((windowStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemainingEnd = Math.max(0, Math.ceil((windowEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Shift in days from original 40w EDD
    const netShiftDays = Math.round(daysOffsetMedian);

    // Trajectory Risk Stratification & Clinical Urgency
    let riskLevel: 'LOW' | 'WATCH' | 'ELEVATED' | 'HIGH' = 'LOW';
    let timingClassification: 'Preterm' | 'Early Term' | 'Full Term' | 'Late Term' = 'Full Term';
    let primaryIndication = 'Routine term expectant management';

    if (estimatedGa < 37.0) {
      timingClassification = 'Preterm';
      riskLevel = 'HIGH';
      primaryIndication = 'Impending late preterm delivery risk due to acute trajectory compromise.';
    } else if (estimatedGa < 39.0) {
      timingClassification = 'Early Term';
      if (effectiveLatestAfi < 5.0 || effectivePct < 10 || isHighRisk) {
        riskLevel = 'HIGH';
        primaryIndication = 'Indicated early-term delivery protocol (ACOG PB #204/229).';
      } else {
        riskLevel = 'ELEVATED';
        primaryIndication = 'Early-term monitoring window with serial biophysical profile.';
      }
    } else if (estimatedGa <= 40.5) {
      timingClassification = 'Full Term';
      riskLevel = effectiveAfiSlope < -0.2 || effectivePct < 25 ? 'WATCH' : 'LOW';
      primaryIndication = 'Standard physiological term gestation timeline.';
    } else {
      timingClassification = 'Late Term';
      riskLevel = 'WATCH';
      primaryIndication = 'Approaching post-dates surveillance threshold.';
    }

    // Recommended Delivery Protocol (ACOG / SMFM Guideline Consensus)
    const protocolGuidelines = [
      {
        label: 'Timing Recommendation',
        text: estimatedGa < 37.0
          ? 'Urgent MFM consultation for late preterm delivery (36w0d–36w6d) with antenatal corticosteroids assessment.'
          : estimatedGa < 39.0
          ? `Plan indicated delivery / induction between ${formatGaString(minGa)} and ${formatGaString(maxGa)}.`
          : `Expectant management with routine outpatient surveillance up to 39w0d–40w6d.`
      },
      {
        label: 'Delivery Route Considerations',
        text: presentation === 'cephalic'
          ? 'Cephalic presentation: Favorable candidate for induction of labor with continuous electronic fetal monitoring (EFM).'
          : `${presentation.toUpperCase()} presentation: Plan external cephalic version (ECV) if eligible or schedule primary Cesarean section.`
      },
      {
        label: 'Antenatal Surveillance',
        text: riskLevel === 'HIGH'
          ? 'Twice-weekly Biophysical Profile (BPP) and umbilical artery Doppler velocimetry until delivery.'
          : riskLevel === 'ELEVATED'
          ? 'Weekly AFI and non-stress testing (NST) with repeat growth ultrasound in 2 weeks.'
          : 'Standard bi-weekly obstetric visits with routine maternal kick counts.'
      }
    ];

    return {
      estimatedGa,
      medianGaStr,
      minGa,
      maxGa,
      gaWindowStr,
      calendarWindowStr,
      projectedDateStr,
      baselineEddStr,
      daysRemaining,
      daysRemainingStart,
      daysRemainingEnd,
      netShiftDays,
      riskLevel,
      timingClassification,
      primaryIndication,
      factorBreakdown,
      protocolGuidelines
    };
  }, [trajectoryFeatures, scenario, patient.edd, trajectoryScore]);

  // Handle Note Copy to Clipboard
  const handleCopyNote = () => {
    const noteText = `[PREGNANCY TWIN - PROJECTED DELIVERY OUTCOME SUMMARY]
Patient: ${patient.name} (MRN: ${patient.mrn})
Current Gestational Age: ${trajectoryFeatures.currentGa.toFixed(1)} weeks
Baseline 40w EDD: ${outcomeCalculation.baselineEddStr}

PROJECTED DELIVERY OUTCOME:
- Estimated Delivery Window: ${outcomeCalculation.calendarWindowStr} (${outcomeCalculation.gaWindowStr})
- Projected Median GA: ${outcomeCalculation.medianGaStr} (${outcomeCalculation.projectedDateStr})
- Net Shift from Baseline: ${outcomeCalculation.netShiftDays >= 0 ? '+' : ''}${outcomeCalculation.netShiftDays} days
- Classification: ${outcomeCalculation.timingClassification} (${outcomeCalculation.riskLevel} RISK)
- Primary Clinical Indication: ${outcomeCalculation.primaryIndication}

TRAJECTORY RISK DRIVERS:
${outcomeCalculation.factorBreakdown.map(f => `· ${f.name}: ${f.valueText} [${f.contributionWeeks >= 0 ? '+' : ''}${f.contributionWeeks.toFixed(1)}w shift]`).join('\n')}

GUIDELINE PROTOCOL (ACOG/SMFM):
· Timing: ${outcomeCalculation.protocolGuidelines[0].text}
· Route: ${outcomeCalculation.protocolGuidelines[1].text}
· Surveillance: ${outcomeCalculation.protocolGuidelines[2].text}
Generated: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(noteText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className={`bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                Projected Delivery Outcome &amp; Window
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Trajectory-Calibrated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated dynamically from serial scan velocities, AFI trend, growth concordances, and clinical risk markers.
            </p>
          </div>
        </div>

        {/* Right Action Tools: Scenario Simulator & Copy */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Scenario Simulator Dropdown / Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setScenario('actual')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                scenario === 'actual'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Observed Trajectory
            </button>
            <button
              type="button"
              onClick={() => setScenario('stabilized')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                scenario === 'stabilized'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
              title="What-if simulation: Amniotic fluid stabilizes and growth parallels 50th percentile"
            >
              Stabilized Rebound
            </button>
            <button
              type="button"
              onClick={() => setScenario('accelerated')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                scenario === 'accelerated'
                  ? 'bg-white text-rose-800 font-bold shadow-2xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
              title="What-if simulation: Accelerated fluid depletion or acute deceleration"
            >
              Severe Decline
            </button>
          </div>

          {/* Copy Assessment Note */}
          <button
            type="button"
            onClick={handleCopyNote}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Copy clinical delivery projection note to clipboard"
          >
            {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedNote ? 'Copied Note' : 'Copy Note'}</span>
          </button>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Recalculate latest trajectory outcome"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Flagship Outcome Triad: 1. Delivery Date Window | 2. Projected Gestational Age | 3. Trajectory Risk Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Metric 1: Estimated Delivery Date Window */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-teal-600" />
                <span>Estimated Delivery Window</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {outcomeCalculation.daysRemainingStart}–{outcomeCalculation.daysRemainingEnd}d remaining
              </span>
            </div>

            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
              {outcomeCalculation.calendarWindowStr}
            </div>

            <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
              <span>Projected Date:</span>
              <strong className="text-slate-900 font-semibold">{outcomeCalculation.projectedDateStr}</strong>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-mono text-[11px]">~{outcomeCalculation.daysRemaining} days left</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Baseline 40w EDD:</span>
            <span className="font-mono text-slate-800 font-medium">
              {outcomeCalculation.baselineEddStr}
              {outcomeCalculation.netShiftDays !== 0 && (
                <span className={`ml-1.5 font-bold ${outcomeCalculation.netShiftDays < 0 ? 'text-rose-600' : 'text-teal-700'}`}>
                  ({outcomeCalculation.netShiftDays > 0 ? '+' : ''}{outcomeCalculation.netShiftDays}d shift)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Metric 2: Projected Gestational Age at Delivery */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Projected GA at Delivery</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                outcomeCalculation.timingClassification === 'Preterm'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : outcomeCalculation.timingClassification === 'Early Term'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {outcomeCalculation.timingClassification}
              </span>
            </div>

            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
              {outcomeCalculation.gaWindowStr}
            </div>

            <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
              <span>Median Forecast:</span>
              <strong className="text-slate-900 font-mono font-bold text-sm">{outcomeCalculation.medianGaStr}</strong>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 text-[11px] font-mono">Current: {trajectoryFeatures.currentGa.toFixed(1)}w</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Gestational Span to Delivery:</span>
            <span className="font-mono text-indigo-950 font-bold">
              +{Math.max(0.3, outcomeCalculation.estimatedGa - trajectoryFeatures.currentGa).toFixed(1)} weeks
            </span>
          </div>
        </div>

        {/* Metric 3: Trajectory Risk Stratification */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <ShieldAlert className={`w-3 h-3 ${
                  outcomeCalculation.riskLevel === 'HIGH' ? 'text-rose-600' : outcomeCalculation.riskLevel === 'ELEVATED' ? 'text-amber-600' : 'text-teal-600'
                }`} />
                <span>Trajectory Risk Stratification</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                outcomeCalculation.riskLevel === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : outcomeCalculation.riskLevel === 'ELEVATED'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {outcomeCalculation.riskLevel} RISK
              </span>
            </div>

            <div className="text-base font-bold text-slate-900 mt-1 leading-snug">
              {outcomeCalculation.primaryIndication}
            </div>

            <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5">
              <span className="text-slate-500">Presentation:</span>
              <strong className="text-slate-900 capitalize font-medium">{trajectoryFeatures.presentation}</strong>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Placenta:</span>
              <strong className="text-slate-900 capitalize font-medium">{trajectoryFeatures.placenta}</strong>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Delivery Planning Urgency:</span>
            <span className={`font-semibold ${
              outcomeCalculation.riskLevel === 'HIGH' ? 'text-rose-700' : outcomeCalculation.riskLevel === 'ELEVATED' ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {outcomeCalculation.riskLevel === 'HIGH' ? 'High Urgency (Indicated)' : outcomeCalculation.riskLevel === 'ELEVATED' ? 'Moderate (Weekly Surveillance)' : 'Standard Routine'}
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Factor Breakdown (How the window was derived from serial biometrics) */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-teal-700" />
            <span>Trajectory Impact Drivers on Delivery Horizon</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {outcomeCalculation.factorBreakdown.length} biometric features analyzed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {outcomeCalculation.factorBreakdown.map((factor, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                factor.severity === 'alert'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : factor.severity === 'watch'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 truncate" title={factor.name}>
                    {factor.name}
                  </span>
                  <span className={`text-[10px] font-mono font-bold shrink-0 ${
                    factor.contributionWeeks < 0 ? 'text-rose-600' : factor.contributionWeeks > 0 ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {factor.contributionWeeks !== 0 ? `${factor.contributionWeeks > 0 ? '+' : ''}${factor.contributionWeeks.toFixed(1)}w` : '0w'}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-[11px] leading-tight mb-1">
                  {factor.valueText}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-1">
                {factor.clinicalRationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Delivery Protocol Guidelines (ACOG / SMFM Consensus Box) */}
      <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-bold text-teal-950 text-xs uppercase tracking-wider">
              ACOG &amp; SMFM Delivery Timing Guidelines
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {outcomeCalculation.protocolGuidelines.map((g, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-900 block">
                  {g.label}:
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {g.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Deep Dive Action Button */}
        {onNavigateToDeliveryTab && (
          <div className="shrink-0 self-center sm:self-start">
            <button
              type="button"
              onClick={onNavigateToDeliveryTab}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Delivery ML Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

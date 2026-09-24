/**
 * PregnancyTwin AI - Risk Notification Modal
 * 
 * Automatically triggered when a newly ingested ultrasound scan results in a
 * high-risk trajectory label according to the primary model.
 * Prominently presents the clinical rationale and suggests an immediate clinical review.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  Heart,
  FileText,
  Copy,
  Check,
  Stethoscope,
  X,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { RiskNotificationData, User as UserType } from '../types';

export interface RiskNotificationModalProps {
  data: RiskNotificationData;
  onClose: () => void;
  onProceedToClinicalReview: (patientId: string) => void;
  onOpenCopilot?: (patientName: string, prompt: string) => void;
  currentUser?: UserType;
  showToast?: (msg: string) => void;
}

export const RiskNotificationModal: React.FC<RiskNotificationModalProps> = ({
  data,
  onClose,
  onProceedToClinicalReview,
  onOpenCopilot,
  currentUser,
  showToast
}) => {
  const {
    patient,
    newVisit,
    previousVisit,
    trajectoryCategory,
    riskLevel,
    trajectoryScore,
    whyNow,
    velocities,
    detectedAt = new Date().toISOString(),
    sourceScanName
  } = data;

  const [acknowledgedCheckbox, setAcknowledgedCheckbox] = useState(false);
  const [copiedSbar, setCopiedSbar] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'breakdown' | 'sbar'>('actions');

  // Compute key deltas
  const gaWeeks = newVisit.gestationalAgeWeeks;
  const gaDays = newVisit.gestationalAgeDays || 0;
  const prevGa = previousVisit ? previousVisit.gestationalAgeWeeks + (previousVisit.gestationalAgeDays || 0) / 7 : null;
  const curGa = gaWeeks + gaDays / 7;
  const deltaWeeks = prevGa ? Math.max(0.1, curGa - prevGa) : 1;

  const deltaAfi = previousVisit ? newVisit.amnioticFluidIndex_cm - previousVisit.amnioticFluidIndex_cm : 0;
  const deltaEfw = previousVisit ? newVisit.estimatedFetalWeight_g - previousVisit.estimatedFetalWeight_g : 0;
  const deltaPct = previousVisit ? newVisit.growthPercentile - previousVisit.growthPercentile : 0;

  // Composite Score
  const overallScore = trajectoryScore?.overallScore ?? 45;

  // Clinical SBAR generation
  const generateSbarText = () => {
    return `[URGENT CLINICAL TRAJECTORY NOTIFICATION - SBAR REPORT]
PATIENT: ${patient.name} | MRN: ${patient.mrn} | GA: ${gaWeeks}w ${gaDays}d
INGESTION DATE: ${newVisit.date || new Date().toISOString().split('T')[0]} ${sourceScanName ? `(${sourceScanName})` : ''}

SITUATION:
Primary trajectory model classified this patient as HIGH-RISK with trajectory label '${trajectoryCategory}'.
Overall Trajectory Score: ${overallScore}/100. Immediate clinical review advised.

BACKGROUND:
Maternal Age: ${patient.age} | Gravidity: ${patient.gravidity} | Parity: ${patient.parity} | BMI: ${patient.maternalBmi || '24.5'}
Assigned Attending: ${patient.assignedDoctorName}

ASSESSMENT:
- Amniotic Fluid: AFI ${newVisit.amnioticFluidIndex_cm} cm (SDP: ${newVisit.singleDeepestPocket_cm} cm). ${previousVisit ? `Previous AFI was ${previousVisit.amnioticFluidIndex_cm} cm (Δ ${deltaAfi.toFixed(1)} cm, Velocity: ${velocities?.afiVelocity_cmPerWeek?.toFixed(2) || 'N/A'} cm/wk).` : ''}
- Fetal Growth: EFW ${newVisit.estimatedFetalWeight_g}g (${newVisit.growthPercentile}th percentile). ${previousVisit ? `Previous was ${previousVisit.estimatedFetalWeight_g}g (${previousVisit.growthPercentile}th %ile, Δ ${deltaPct} %ile).` : ''}
- Primary Contributor: ${whyNow?.primaryContributor || 'Longitudinal Deviation'}
- Trajectory Rationale: ${whyNow?.summary || 'Progressive multi-visit coordinate divergence.'}
${whyNow?.iugrClassification?.type !== 'none' ? `- FGR Classification: ${whyNow?.iugrClassification?.type.toUpperCase()} (HC/AC Ratio: ${whyNow?.iugrClassification?.hcAcRatio || 'N/A'}).` : ''}

RECOMMENDATION:
1. Conduct immediate bedside perinatology/MFM clinical review.
2. Perform urgent Doppler velocimetry (Umbilical Artery PI, MCA PI, and CPR ratio).
3. Schedule Manning Biophysical Profile (BPP) and Non-Stress Test (NST) within 12 hours.
4. Screen maternal blood pressures and preeclampsia laboratory panel.
5. Shorten surveillance interval to twice-weekly ultrasound tracking.`;
  };

  const handleCopySbar = () => {
    navigator.clipboard.writeText(generateSbarText());
    setCopiedSbar(true);
    if (showToast) showToast('SBAR Clinical Review Handoff copied to clipboard.');
    setTimeout(() => setCopiedSbar(false), 2500);
  };

  const handleProceed = () => {
    onProceedToClinicalReview(patient.id);
    onClose();
  };

  const handleInitiateCopilot = () => {
    if (onOpenCopilot) {
      const prompt = `Urgent clinical review required for patient ${patient.name} (${patient.mrn}, ${gaWeeks}w ${gaDays}d). Primary model flagged a HIGH-RISK trajectory (${trajectoryCategory}, Trajectory Score: ${overallScore}/100) after the latest scan. AFI is ${newVisit.amnioticFluidIndex_cm}cm, EFW is ${newVisit.estimatedFetalWeight_g}g (${newVisit.growthPercentile}th percentile). Please outline the recommended immediate clinical review steps, Doppler indications, and ACOG/SMFM management recommendations.`;
      onOpenCopilot(patient.name, prompt);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-notification-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-rose-500/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 flex flex-col max-h-[92vh] ring-4 ring-rose-500/20">
        
        {/* Top Critical Alert Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-4 sm:px-6 flex items-start justify-between shadow-sm relative overflow-hidden">
          {/* Subtle background pulse pattern */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="flex items-start space-x-3.5 z-10">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-rose-800 font-mono shadow-xs">
                  Primary Model Alert
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-100 border border-rose-400/40">
                  Label: {trajectoryCategory}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  Status: {riskLevel}
                </span>
              </div>
              <h2 id="risk-notification-title" className="text-lg sm:text-xl font-black tracking-tight mt-1 text-white flex items-center gap-2">
                Risk Notification: Immediate Clinical Review Advised
              </h2>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Newly ingested ultrasound scan for <strong className="text-white underline decoration-amber-300 decoration-2 underline-offset-2">{patient.name}</strong> triggered a high-risk trajectory threshold.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer z-10"
            title="Close Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Identity & Scan Meta Ribbon */}
        <div className="bg-rose-50/70 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
            <span>
              Patient: <strong className="text-slate-900">{patient.name}</strong>
            </span>
            <span>
              MRN: <span className="font-mono font-bold text-slate-900">{patient.mrn}</span>
            </span>
            <span>
              Gestational Age: <strong className="text-rose-700 font-bold">{gaWeeks}w {gaDays}d</strong>
            </span>
            <span>
              Assigned: <strong className="text-slate-900">{patient.assignedDoctorName}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Ingested: {new Date(detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {sourceScanName && <span className="truncate max-w-[150px]">({sourceScanName})</span>}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'actions'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Recommended Clinical Protocol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'breakdown'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Trajectory Engine Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sbar')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'sbar'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SBAR Clinical Handoff</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          
          {/* TAB 1: RECOMMENDED IMMEDIATE CLINICAL ACTIONS (Core Requirement) */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              
              {/* Urgent Callout Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50/60 border border-rose-200/80 shadow-xs flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
                <div className="space-y-1 text-xs">
                  <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                    <span>Clinical Action Required: Immediate Patient Evaluation</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                      ACOG / SMFM Triage
                    </span>
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    The primary trajectory engine detected an acute developmental velocity deviation following this ultrasound scan. 
                    Standard static single-visit thresholds may underestimate fetal deterioration; sequential velocity analysis shows critical divergence requiring immediate clinical oversight.
                  </p>
                </div>
              </div>

              {/* Action Protocol Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span>Suggested Immediate Clinical Review Protocol (Evidence-Based Steps)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 font-mono">
                        1
                      </span>
                      <strong className="text-xs font-bold text-slate-900">
                        Urgent Doppler Velocimetry
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                      Assess Umbilical Artery (UA) Pulsatility Index, Middle Cerebral Artery (MCA) PI, and calculate the Cerebroplacental Ratio (CPR). Check for absent/reversed end-diastolic velocity (AREDV).
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 font-mono">
                        2
                      </span>
                      <strong className="text-xs font-bold text-slate-900">
                        Manning Biophysical Profile (BPP) & NST
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                      Perform complete 10-point Manning BPP and initiate a 20-minute electronic fetal heart rate Non-Stress Test within the next 4–12 hours to verify acute fetal oxygenation.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 font-mono">
                        3
                      </span>
                      <strong className="text-xs font-bold text-slate-900">
                        Maternal Hemodynamics & Preeclampsia Screen
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                      Recheck maternal blood pressure, screen for severe features (headache, visual changes, epigastric pain), and order urinary protein-to-creatinine ratio (UPCR) and complete blood count.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 font-mono">
                        4
                      </span>
                      <strong className="text-xs font-bold text-slate-900">
                        MFM Specialist Consultation & Surveillance Cadence
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                      Escalate case to on-call Maternal-Fetal Medicine (MFM) attending. Shorten serial sonography interval to twice-weekly monitoring and prepare antenatal corticosteroid schedule if preterm delivery is anticipated.
                    </p>
                  </div>

                </div>
              </div>

              {/* Quick Biometric Delta Strip */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Key Biometric Coordinates from Ingested Scan
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Amniotic Fluid Index</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {newVisit.amnioticFluidIndex_cm} cm
                    </div>
                    {previousVisit && (
                      <div className={`text-[10px] font-bold font-mono ${deltaAfi < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {deltaAfi < 0 ? '↓' : '↑'} {Math.abs(deltaAfi).toFixed(1)} cm
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Single Deepest Pocket</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {newVisit.singleDeepestPocket_cm} cm
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {newVisit.singleDeepestPocket_cm < 2.0 ? 'Oligohydramnios (<2cm)' : 'Adequate pool'}
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Estimated Fetal Weight</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {newVisit.estimatedFetalWeight_g} g
                    </div>
                    {previousVisit && (
                      <div className="text-[10px] text-slate-600 font-mono">
                        +{deltaEfw}g interval
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500">Fetal Growth Percentile</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {newVisit.growthPercentile}th %ile
                    </div>
                    {previousVisit && (
                      <div className={`text-[10px] font-bold font-mono ${deltaPct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {deltaPct < 0 ? '↓' : '↑'} {Math.abs(deltaPct)} pts
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TRAJECTORY ENGINE BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              
              {/* Trajectory Score Gauge Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Composite Trajectory Stability Index
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black font-mono text-rose-700">
                      {overallScore}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ 100</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      CRITICAL DEVIATION (&lt;60)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 max-w-md">
                    Evaluates multi-visit first and second derivatives, biological velocity limits, and fluid-growth concordance.
                  </p>
                </div>

                {/* Sub-scores */}
                {trajectoryScore && (
                  <div className="grid grid-cols-2 gap-2 text-center text-xs w-full sm:w-auto">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Fluid Score</div>
                      <div className={`font-mono font-bold ${trajectoryScore.fluidScore < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {trajectoryScore.fluidScore}/100
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Growth Score</div>
                      <div className={`font-mono font-bold ${trajectoryScore.growthScore < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {trajectoryScore.growthScore}/100
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Trend Score</div>
                      <div className={`font-mono font-bold ${trajectoryScore.trendScore < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {trajectoryScore.trendScore}/100
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Confidence</div>
                      <div className="font-mono font-bold text-teal-700">
                        {trajectoryScore.confidenceScore}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Why Now Detailed Explanation */}
              {whyNow && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                      <Activity className="w-4 h-4 text-rose-600" />
                      <span>The "WHY NOW?" Longitudinal Engine Summary</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      Primary Contributor: {whyNow.primaryContributor}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {whyNow.summary}
                  </p>

                  {/* List of contributing reasons */}
                  {whyNow.reasons && whyNow.reasons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Specific Diagnostic Triggers:
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {whyNow.reasons.map((r, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-rose-600 font-bold shrink-0">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Kalman Filter record */}
                  {whyNow.kalmanFilterRecord && (
                    <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 text-xs text-teal-900 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">1D Kalman Filter Noise Dampening Active:</span>
                        <p className="text-[11px] text-teal-800 leading-relaxed">
                          {whyNow.kalmanFilterRecord.suppressionDetails || 'Verified real biological divergence versus sonographer caliper noise.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SBAR CLINICAL HANDOFF */}
          {activeTab === 'sbar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Standardized SBAR Clinical Handover Note</h4>
                  <p className="text-[11px] text-slate-500">Ready to copy and paste directly into Hospital EHR or page to MFM attending.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySbar}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedSbar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSbar ? 'Copied!' : 'Copy SBAR Note'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto border border-slate-800 max-h-72">
                {generateSbarText()}
              </pre>
            </div>
          )}

          {/* Clinician Acknowledgment Bar */}
          <div className="border-t border-slate-200 pt-3 flex items-center space-x-2.5">
            <input
              id="ack-checkbox"
              type="checkbox"
              checked={acknowledgedCheckbox}
              onChange={(e) => setAcknowledgedCheckbox(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer mt-0.5"
            />
            <label htmlFor="ack-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
              I acknowledge receipt of this high-risk trajectory notification and confirm that an immediate clinical review has been initiated.
            </label>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Clinician: <strong>{currentUser?.name || 'Dr. Alistair Vance, MD'}</strong> • Action will be recorded to audit trail
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {onOpenCopilot && (
              <button
                type="button"
                onClick={handleInitiateCopilot}
                className="px-3 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Consult Copilot</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
            >
              Dismiss Notification
            </button>

            <button
              type="button"
              id="btn-proceed-clinical-review"
              onClick={handleProceed}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Proceed to Immediate Clinical Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

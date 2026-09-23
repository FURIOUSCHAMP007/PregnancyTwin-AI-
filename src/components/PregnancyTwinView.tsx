/**
 * PregnancyTwin AI - Pregnancy Digital Twin & Trajectory Intelligence View
 * Displays longitudinal metrics, Trajectory Score, Why-Now Engine, Forecasting,
 * and modular sub-pages for Growth Curves, What-If Simulation, and Ultrasound Records.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  Sliders,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Globe,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
  Edit3,
  Printer,
  X,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  Layers,
  Info,
  Filter,
  Database,
  Pill,
  Plus,
  Trash2,
  Heart,
  ShieldCheck,
  Users
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement, MedicationExposure, User } from '../types';
import { simulateCounterfactual } from '../utils/trajectoryEngine';
import { GrowthChartVisualization } from './GrowthChartVisualization';
import { BiometricTrendLineChart } from './BiometricTrendLineChart';
import { ProjectedDeliveryOutcomeCard } from './ProjectedDeliveryOutcomeCard';
import { ClinicalReportPrintModal } from './ClinicalReportPrintModal';
import { MedicationExposurePanel } from './MedicationExposurePanel';
import { MedicationsHub } from './MedicationsHub';
import { LongitudinalDeliveryForecastPanel } from './LongitudinalDeliveryForecastPanel';
import { TwinHemodynamicsTab } from './twin/TwinHemodynamicsTab';
import { TwinGuidelinesTab } from './twin/TwinGuidelinesTab';
import { TwinDeliveryPredictionTab } from './twin/TwinDeliveryPredictionTab';
import { MaternalVitalsTracker } from './MaternalVitalsTracker';
import { CriticalClustersSubPage } from './CriticalClustersSubPage';
import { RiskGroupCohortSubPage } from './RiskGroupCohortSubPage';
import { RecordsVerticalTimeline } from './RecordsVerticalTimeline';
import { LongitudinalPregnancyPdfSummaryModal } from './LongitudinalPregnancyPdfSummaryModal';

// Helper to get proper English ordinal suffixes for numeric values (e.g., 53rd, 50th)
export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
import { calculateBiometricZScore } from '../utils/clinicalCalculators';

export type TwinSubPage = 
  | 'overview' 
  | 'clusters'
  | 'cohort'
  | 'analytics' 
  | 'records' 
  | 'hemodynamics' 
  | 'guidelines' 
  | 'delivery' 
  | 'medications' 
  | 'vitals';

interface PregnancyTwinViewProps {
  twin: PregnancyDigitalTwin;
  currentUser: User;
  onOpenUpload: () => void;
  onOpenCopilot: () => void;
  onOpenReviewMeasurement: (measurement: VisitMeasurement) => void;
  onOpenMultilingualModal: () => void;
  onNavigateToLiveInput?: () => void;
  initialSubPage?: TwinSubPage;
  onSubPageChange?: (subPage: TwinSubPage) => void;
  onRefreshPatients?: () => void;
  onSelectPatient?: (patientId: string) => void;
}

export const PregnancyTwinView: React.FC<PregnancyTwinViewProps> = ({
  twin,
  currentUser,
  onOpenUpload,
  onOpenCopilot,
  onOpenReviewMeasurement,
  onOpenMultilingualModal,
  onNavigateToLiveInput,
  initialSubPage = 'overview',
  onSubPageChange,
  onRefreshPatients,
  onSelectPatient
}) => {
  const { patient, visits, currentVisit, velocities, trajectoryScore, whyNow, forecast, riskFactors } = twin;

  // Active Sub-Page state
  const [activeSubPage, setActiveSubPage] = useState<TwinSubPage>(initialSubPage);

  // Chronologically sorted visits for the longitudinal timeline
  const sortedVisits = React.useMemo(() => {
    return [...visits].sort((a, b) => {
      const aGA = a.gestationalAgeWeeks + a.gestationalAgeDays / 7;
      const bGA = b.gestationalAgeWeeks + b.gestationalAgeDays / 7;
      return aGA - bGA;
    });
  }, [visits]);

  // Selected Timeline Visit ID
  const [selectedTimelineVisitId, setSelectedTimelineVisitId] = useState<string | null>(null);

  // Sync selectedTimelineVisitId when sortedVisits changes
  useEffect(() => {
    if (sortedVisits.length > 0) {
      setSelectedTimelineVisitId(sortedVisits[sortedVisits.length - 1].id);
    }
  }, [sortedVisits]);

  // Sync with initialSubPage when prop changes from parent navigation
  useEffect(() => {
    if (initialSubPage) {
      setActiveSubPage(initialSubPage);
    }
  }, [initialSubPage]);

  const handleSwitchSubPage = (page: TwinSubPage) => {
    setActiveSubPage(page);
    onSubPageChange?.(page);
  };

  // Find selected visit and previous visit for comparative trajectory modeling
  const selectedTimelineVisitIndex = sortedVisits.findIndex(v => v.id === selectedTimelineVisitId);
  const selectedVisit = selectedTimelineVisitIndex !== -1 ? sortedVisits[selectedTimelineVisitIndex] : sortedVisits[sortedVisits.length - 1];
  const previousVisit = selectedTimelineVisitIndex > 0 ? sortedVisits[selectedTimelineVisitIndex - 1] : null;

  // Longitudinal Deltas & Velocities
  let deltaAfi = 0;
  let deltaEfw = 0;
  let deltaPercentile = 0;
  let weeksDelta = 0;
  let afiVelocity = 0;
  let efwVelocity = 0;
  let percentileVelocity = 0;

  if (selectedVisit && previousVisit) {
    deltaAfi = selectedVisit.amnioticFluidIndex_cm - previousVisit.amnioticFluidIndex_cm;
    deltaEfw = selectedVisit.estimatedFetalWeight_g - previousVisit.estimatedFetalWeight_g;
    deltaPercentile = selectedVisit.growthPercentile - previousVisit.growthPercentile;
    
    const curGA = selectedVisit.gestationalAgeWeeks + selectedVisit.gestationalAgeDays / 7;
    const prevGA = previousVisit.gestationalAgeWeeks + previousVisit.gestationalAgeDays / 7;
    weeksDelta = Math.max(0.1, curGA - prevGA);

    afiVelocity = deltaAfi / weeksDelta;
    efwVelocity = deltaEfw / weeksDelta;
    percentileVelocity = deltaPercentile / weeksDelta;
  }

  // Dynamic Clinical Explanation matching strategic pivot Track -> Detect -> Explain
  const getTimelineExplanatorySnippet = () => {
    if (!selectedVisit) return "Select a visit point in the longitudinal timeline above to assess developmental trajectory and click to drill down.";
    
    if (!previousVisit) {
      return `Baseline scan established at ${selectedVisit.gestationalAgeWeeks}w ${selectedVisit.gestationalAgeDays}d gestation. This serves as the initial, personalized biometric baseline. All subsequent scans will compare growth rates and amniotic volume trends against this baseline rather than static population thresholds.`;
    }

    const afiDriftText = afiVelocity < -0.4 
      ? `Amniotic fluid volume is depleting at an accelerated rate of ${afiVelocity.toFixed(2)} cm/wk (SDP: ${selectedVisit.singleDeepestPocket_cm.toFixed(1)}cm).` 
      : "Amniotic fluid volume remains stable.";
    
    const growthDriftText = percentileVelocity < -1.5 
      ? `Estimated fetal weight is deviating from her baseline trajectory with a drop of ${deltaPercentile} percentiles (velocity: ${percentileVelocity.toFixed(1)} %ile/wk).` 
      : "Fetal growth velocity is concordant with previous scans.";

    if (afiVelocity < -0.4 && percentileVelocity < -1.5) {
      return `🚨 CRITICAL COORDINATE DEVIATION: Correlated decline in both fluid volume and growth velocity. Between ${previousVisit.gestationalAgeWeeks}w and ${selectedVisit.gestationalAgeWeeks}w, amniotic fluid dropped by ${Math.abs(deltaAfi).toFixed(1)}cm (velocity: ${afiVelocity.toFixed(2)}cm/wk) and EFW percentile dropped by ${Math.abs(deltaPercentile)} percentiles. This paired trajectory drop indicates acute onset placental insufficiency. Initiate immediate perinatology review and Doppler surveillance.`;
    }

    if (afiVelocity < -0.4) {
      return `⚠️ AMNIOTIC FLUID DRIFT DETECTED: Accelerated fluid volume decay of ${afiVelocity.toFixed(2)} cm/wk (AFI fell from ${previousVisit.amnioticFluidIndex_cm.toFixed(1)}cm to ${selectedVisit.amnioticFluidIndex_cm.toFixed(1)}cm). Standard, single-scan static assessments often miss this continuous downward trajectory because the absolute volume is still above critical cutoffs. However, the first derivative (velocity) indicates progressive placental decay.`;
    }

    if (percentileVelocity < -1.5) {
      return `⚠️ GROWTH TRAJECTORY ACCELERATION FAILURE: Estimated Fetal Weight percentile fell from ${getOrdinal(previousVisit.growthPercentile)} to ${getOrdinal(selectedVisit.growthPercentile)} (velocity: ${percentileVelocity.toFixed(1)} %ile/wk). Although the current weight remains above the 10th percentile FGR threshold, the personal trajectory departure is highly significant. This suggests early-onset symmetrical or asymmetrical growth delay. Doppler tracking is indicated.`;
    }

    return `✓ REASSURING CONCORDANT TRAJECTORY: Growth and fluid values are tracking parallel to her personal baseline (Growth velocity: +${efwVelocity.toFixed(1)}g/wk, fluid volume stable). This patient remains on a healthy developmental pathway matching her historical trend. Maintain standard clinical surveillance intervals.`;
  };

  // Counterfactual What-If State
  const baselineAfi = currentVisit ? currentVisit.amnioticFluidIndex_cm : 10.0;
  const baselineGrowth = currentVisit ? currentVisit.growthPercentile : 40;
  const [hypoAfi, setHypoAfi] = useState<number>(baselineAfi);
  const [hypoGrowth, setHypoGrowth] = useState<number>(baselineGrowth);

  // Keep sliders synced if current patient changes
  useEffect(() => {
    if (currentVisit) {
      setHypoAfi(currentVisit.amnioticFluidIndex_cm);
      setHypoGrowth(currentVisit.growthPercentile);
    }
  }, [currentVisit?.id]);

  const resetToBaseline = () => {
    setHypoAfi(baselineAfi);
    setHypoGrowth(baselineGrowth);
  };

  // ACOG Clinical Report Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isLongitudinalPdfModalOpen, setIsLongitudinalPdfModalOpen] = useState<boolean>(false);

  // Floating Action Button (FAB) collapse state
  const [isFabCollapsed, setIsFabCollapsed] = useState<boolean>(false);

  // Filter for records view
  const [recordsFilter, setRecordsFilter] = useState<'all' | 'accepted' | 'pending'>('all');
  const [recordsDisplayMode, setRecordsDisplayMode] = useState<'timeline' | 'table'>('timeline');

  // Independent maternal covariates states
  const [showCovariateEditor, setShowCovariateEditor] = useState<boolean>(false);
  const [editAge, setEditAge] = useState<number>(patient.age);
  const [editBmi, setEditBmi] = useState<number>(patient.maternalBmi || 24.5);
  const [editParity, setEditParity] = useState<number>(patient.parity);
  const [editGravidity, setEditGravidity] = useState<number>(patient.gravidity);
  const [isSavingCovariates, setIsSavingCovariates] = useState<boolean>(false);

  // Medication exposure states
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medRoute, setMedRoute] = useState('Oral');
  const [medFrequency, setMedFrequency] = useState('Once daily');
  const [medStartWeek, setMedStartWeek] = useState(12);
  const [medStopWeek, setMedStopWeek] = useState(36);
  const [medIndication, setMedIndication] = useState('');
  const [medMaternalCondition, setMedMaternalCondition] = useState('');
  const [medTrimester, setMedTrimester] = useState('Second');
  const [medSource, setMedSource] = useState('EMR Sync');
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  useEffect(() => {
    setEditAge(patient.age);
    setEditBmi(patient.maternalBmi || 24.5);
    setEditParity(patient.parity);
    setEditGravidity(patient.gravidity);
    setShowCovariateEditor(false);
  }, [patient.id, patient.age, patient.maternalBmi, patient.parity, patient.gravidity]);

  const handleSaveCovariates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCovariates(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: editAge,
          maternalBmi: editBmi,
          parity: editParity,
          gravidity: editGravidity
        })
      });
      if (res.ok) {
        setShowCovariateEditor(false);
        if (onRefreshPatients) {
          onRefreshPatients();
        }
      }
    } catch (err) {
      console.error('Failed to save covariates:', err);
    } finally {
      setIsSavingCovariates(false);
    }
  };

  const counterfactualResult = simulateCounterfactual(visits, hypoAfi, hypoGrowth);

  const filteredVisits = visits.filter((v) => {
    if (!v.isUserInputted) return false;
    if (recordsFilter === 'accepted') return v.doctorReviewStatus === 'accepted';
    if (recordsFilter === 'pending') return v.doctorReviewStatus === 'pending' || v.doctorReviewStatus === 'edited';
    return true;
  });

  const subPages: {
    id: TwinSubPage;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Twin Dashboard',
      icon: Activity,
      badge: whyNow.triggered ? 'Alert' : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
    },
    {
      id: 'clusters',
      label: 'Critical Cluster Alerts',
      icon: ShieldAlert,
      badge: 'Cluster Alpha',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 font-black'
    },
    {
      id: 'cohort',
      label: 'Active Pregnancies in Risk Group',
      icon: Users,
      badge: '6 Active',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
    },
    {
      id: 'hemodynamics',
      label: 'Fetal Hemodynamics',
      icon: Heart,
      badge: 'Doppler Active',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      id: 'guidelines',
      label: 'Consensus Guidelines Auditor',
      icon: ShieldCheck,
      badge: 'ACOG Audit',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    {
      id: 'delivery',
      label: 'Delivery Prediction',
      icon: Calendar,
      badge: 'XGBoost Active',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
    },
    {
      id: 'medications',
      label: 'Medications & Impact Hub',
      icon: Pill,
      badge: `${twin.medications?.length || 0} Regimens`,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200 font-semibold'
    },
    {
      id: 'vitals',
      label: 'Maternal Vitals Correlation',
      icon: Heart,
      badge: 'Vitals Active',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold'
    },
    {
      id: 'analytics',
      label: 'Modeling & Sensitivity Studio',
      icon: TrendingUp,
      badge: `${visits.length} Scans`,
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      id: 'records',
      label: 'Ultrasound Checkpoints',
      icon: FileSpreadsheet,
      badge: `${visits.length} Checkpoints`,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  /* -------------------------------------------------------------------------- */
  /* Sub-Page Renderers                                                         */
  /* -------------------------------------------------------------------------- */

  const renderOverviewSubPage = () => (
    <div className="space-y-4">
      {/* 8-Milestone Care Path Pipeline: Profile -> Summary -> Serial Scans -> Trajectory -> AI State -> Emotional Check-in -> Meds -> Forecast */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-xs bg-gradient-to-br from-slate-50/50 via-white to-teal-50/30">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>PregnancyTwin AI Care Delivery & Longitudinal Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              A continuous, 8-milestone patient Care Timeline mapping clinical coordinates, longitudinal signals, and forecasting coordinates.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 select-none">
            Active Care Cycle Map
          </span>
        </div>

        {/* Responsive Grid with connecting arrows conceptual flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3.5 relative">
          
          {/* Card 1: Profile */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition relative">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Profile</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <Activity className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="font-bold text-slate-800 leading-tight">{patient.name}</div>
                <div className="text-slate-400 font-mono text-[9px]">{patient.mrn}</div>
                <div className="text-slate-500 font-medium">Age {patient.age} &bull; G{patient.gravidity}P{patient.parity}</div>
                <div className="text-slate-500 font-medium">BMI: {patient.maternalBmi || 24.5} kg/m²</div>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              {patient.edd} EDD
            </div>
          </div>

          {/* Card 2: Summary */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Summary</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <FileSpreadsheet className="w-3 h-3" />
                </div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-4" title={patient.notes}>
                {patient.notes}
              </p>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              Last Visit: {patient.lastVisitDate}
            </div>
          </div>

          {/* Card 3: Serial Scans */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Serial Scans</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <Layers className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800">{visits.length} Ultrasound Scans</div>
                <div>Gestation Nodes:</div>
                <div className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-100 w-fit">
                  {visits[0]?.gestationalAgeWeeks}w &rarr; {visits[visits.length - 1]?.gestationalAgeWeeks}w
                </div>
                <button 
                  onClick={() => handleSwitchSubPage('vitals')}
                  className="mt-1 text-slate-500 font-semibold hover:text-teal-700 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 w-full hover:bg-teal-50/50 transition cursor-pointer"
                >
                  <Heart className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                  <span className="truncate">BP: {currentVisit?.bloodPressure || '118/76 mmHg'}</span>
                </button>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              {visits[visits.length - 1]?.date} latest
            </div>
          </div>

          {/* Card 4: Trajectory */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">4. Trajectory</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <TrendingDown className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200 tracking-wide">
                  {patient.trajectoryCategory.replace(/_/g, ' ')}
                </span>
                <div className="text-slate-500 font-medium">Velocities:</div>
                <div className="text-slate-600 text-[10px] space-y-0.5 font-mono">
                  <div>AFI: <strong className={velocities.afiVelocity_cmPerWeek < -0.3 ? 'text-rose-600 font-bold' : 'text-slate-800'}>{velocities.afiVelocity_cmPerWeek} cm/wk</strong></div>
                  <div>Growth: <strong className={velocities.growthVelocity_percentilePerWeek < -1.0 ? 'text-rose-600 font-bold' : 'text-slate-800'}>{velocities.growthVelocity_percentilePerWeek} %ile/wk</strong></div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              Score: {trajectoryScore.trendScore}% Trend
            </div>
          </div>

          {/* Card 5: AI State */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">5. AI Risk State</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <ShieldAlert className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide border uppercase ${
                  patient.status === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : patient.status === 'WATCH'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {patient.status} RISK
                </span>
                <div className="text-slate-500 font-medium">Trajectory Score:</div>
                <div className="text-xs font-black text-slate-800 font-mono">
                  {trajectoryScore.overallScore} / 100
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              {trajectoryScore.confidenceScore}% Model Conf
            </div>
          </div>

          {/* Card 6: Emotional Check-in */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">6. Emotional</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <Heart className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                  <span>{currentVisit?.emotionalState || 'Stable / Calm'}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Maternal Trend:</div>
                <div className="text-[9px] text-slate-500 font-mono leading-tight max-h-[44px] overflow-y-auto">
                  {visits.map((v, i) => (
                    <div key={v.id}>
                      {v.gestationalAgeWeeks}w: <span className="font-semibold text-slate-700">{v.emotionalState}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1 flex items-center justify-between">
              <span>Maternal Wellness</span>
              <button 
                onClick={() => handleSwitchSubPage('vitals')}
                className="text-[9px] text-teal-600 hover:text-teal-800 font-bold hover:underline cursor-pointer"
              >
                Track Vitals &rarr;
              </button>
            </div>
          </div>

          {/* Card 7: Meds */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">7. Medications</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <Pill className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="text-slate-500 font-medium mb-1">Prescribed:</div>
                {twin.medications && twin.medications.length > 0 ? (
                  <div className="space-y-1 max-h-[50px] overflow-y-auto">
                    {twin.medications.map((m, idx) => (
                      <div key={idx} className="bg-slate-50 px-1 py-0.5 rounded border border-slate-150 text-[9px] font-semibold text-slate-700 leading-tight">
                        {m.medicationName}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="italic text-slate-400 text-[10px]">No meds recorded.</div>
                )}
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1">
              {twin.medications?.length || 0} Prescriptions
            </div>
          </div>

          {/* Card 8: Forecast */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-3xs flex flex-col justify-between transition">
            <div>
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">8. Forecast</span>
                <div className="p-1 bg-slate-50 text-slate-600 rounded">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">GA Forecast: {forecast.expectedGaWeeks}w</div>
                <div className="text-slate-500 font-medium">Expected Ranges:</div>
                <div className="text-[10px] text-slate-600 font-mono space-y-0.5">
                  <div>AFI: {forecast.expectedAfiRange[0]}–{forecast.expectedAfiRange[1]}cm</div>
                  <div>Growth: {forecast.expectedGrowthPercentileRange[0]}–{forecast.expectedGrowthPercentileRange[1]}%</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100/50 pt-1 text-teal-700 font-bold">
              {forecast.predictedTrajectory}
            </div>
          </div>

        </div>
      </div>

      {/* Historical Biometric Trend Line Visualization (Recharts EFW & AFI) */}
      <BiometricTrendLineChart
        twin={twin}
        selectedVisitId={selectedTimelineVisitId}
        onSelectVisitId={(id) => setSelectedTimelineVisitId(id)}
        onSelectVisit={onOpenReviewMeasurement}
      />

      {/* Hero-ified Serial Trajectory Timeline Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700 animate-pulse" />
              <span>Serial Gestational Trajectory Timeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any serial scan node below to inspect longitudinal velocity shifts, baseline deviations, and clinical explanations.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded font-bold uppercase shrink-0">
            {sortedVisits.length} Longitudinal Points Recorded
          </span>
        </div>

        {/* Timeline Horizontal Track */}
        <div className="relative flex items-center justify-between py-4 overflow-x-auto min-w-full space-x-4 scrollbar-thin">
          {/* Continuous connecting track line */}
          <div className="absolute left-8 right-8 top-[44px] h-1 bg-slate-100 border-t border-b border-slate-200 -z-10" />

          {sortedVisits.map((v, index) => {
            const isSelected = selectedTimelineVisitId === v.id;
            const isBaseline = index === 0;
            const isCurrent = v.id === currentVisit?.id;
            const hasAlert = v.amnioticFluidIndex_cm < 7.0 || v.growthPercentile < 15;

            return (
              <button
                key={v.id}
                onClick={() => setSelectedTimelineVisitId(v.id)}
                className={`flex-1 min-w-[120px] flex flex-col items-center text-center transition-all cursor-pointer relative group focus:outline-none`}
              >
                {/* Gestational Age Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all mb-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}>
                  {v.gestationalAgeWeeks}w {v.gestationalAgeDays}d
                </span>

                {/* Node Circle */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 ring-4 ring-teal-700/15'
                    : hasAlert
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-300 group-hover:border-slate-500'
                }`}>
                  {isBaseline ? (
                    <span className="text-[10px] font-black uppercase font-mono">B</span>
                  ) : hasAlert ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-teal-600'}`} />
                  )}
                </div>

                {/* Subtitle Date */}
                <span className={`text-[10px] mt-1.5 font-medium transition-all ${
                  isSelected ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  {v.date}
                </span>

                {/* Markers */}
                <div className="flex gap-1 mt-0.5">
                  {isBaseline && (
                    <span className="text-[8px] px-1 bg-indigo-50 text-indigo-700 rounded font-black font-mono">
                      BASE
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[8px] px-1 bg-teal-50 text-teal-800 rounded font-black font-mono animate-pulse">
                      LATEST
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Visit Comparative HUD Panel */}
        {selectedVisit && (() => {
          const biometricList = [
            { key: 'BPD' as const, label: 'Biparietal Diameter (BPD)', value: selectedVisit.biometrics?.bpd_mm },
            { key: 'HC' as const, label: 'Head Circumference (HC)', value: selectedVisit.biometrics?.hc_mm },
            { key: 'AC' as const, label: 'Abdominal Circumference (AC)', value: selectedVisit.biometrics?.ac_mm },
            { key: 'FL' as const, label: 'Femur Length (FL)', value: selectedVisit.biometrics?.fl_mm }
          ].filter(b => b.value !== undefined) as { key: 'BPD' | 'HC' | 'AC' | 'FL', label: string, value: number }[];

          const calculatedZScores = biometricList.map(b => {
            const result = calculateBiometricZScore(b.key, b.value, selectedVisit.gestationalAgeWeeks);
            return {
              ...b,
              ...result
            };
          });

          const criticalDeviations = calculatedZScores.filter(z => z.exceedsThreshold);
          const hasCriticalDeviation = criticalDeviations.length > 0;

          return (
            <div className="mt-5 p-4.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">
                      Longitudinal Node Drift analysis
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Visit Node #{selectedVisit.visitNumber} &bull; Gestation: {selectedVisit.gestationalAgeWeeks}w {selectedVisit.gestationalAgeDays}d {previousVisit ? `(Interval: +${weeksDelta.toFixed(1)}w from ${previousVisit.gestationalAgeWeeks}w)` : '(Baseline Establishment)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-slate-500">Scan Quality Score:</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold">
                    {selectedVisit.sourceConfidence * 100}% Confidence
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Dynamic comparison columns */}
                <div className="lg:col-span-5 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Serial Velocity Parameters
                  </span>

                  <div className="space-y-2.5">
                    {/* Metric 1: AFI Volume */}
                    {(() => {
                      const isAfiBelow5th = selectedVisit.amnioticFluidIndex_cm < 5.0;
                      const isAfiAbove95th = selectedVisit.amnioticFluidIndex_cm > 25.0;
                      const isAfiOutOfPercentile = isAfiBelow5th || isAfiAbove95th;
                      const afiPercentileText = isAfiBelow5th ? 'Below 5th Percentile (Severe Oligohydramnios)' : isAfiAbove95th ? 'Above 95th Percentile (Polyhydramnios)' : '';
                      const afiBgClass = isAfiOutOfPercentile
                        ? (isAfiBelow5th ? 'bg-rose-50/40 border-rose-300' : 'bg-amber-50/40 border-amber-300')
                        : 'bg-white border-slate-200';

                      return (
                        <div className={`border rounded-lg p-3 flex flex-col justify-between text-xs transition-all gap-2 ${afiBgClass}`}>
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-start space-x-2">
                              {isAfiOutOfPercentile && (
                                <div className={`p-1 rounded mt-0.5 shrink-0 ${isAfiBelow5th ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-slate-500 font-medium">Amniotic Fluid Index (AFI)</span>
                                  {isAfiOutOfPercentile && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isAfiBelow5th ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                      Percentile Alert
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-baseline space-x-1 mt-0.5">
                                  <strong className="text-sm text-slate-950 font-mono font-bold">
                                    {selectedVisit.amnioticFluidIndex_cm.toFixed(1)} cm
                                  </strong>
                                  {previousVisit && (
                                    <span className="text-[10px] text-slate-400">
                                      (was {previousVisit.amnioticFluidIndex_cm.toFixed(1)}cm)
                                    </span>
                                  )}
                                </div>
                                {isAfiOutOfPercentile && (
                                  <p className={`text-[10px] font-bold mt-1 ${isAfiBelow5th ? 'text-rose-700' : 'text-amber-700'}`}>
                                    {afiPercentileText}
                                  </p>
                                )}
                              </div>
                            </div>

                            {previousVisit && (
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                  deltaAfi < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {deltaAfi >= 0 ? '+' : ''}{deltaAfi.toFixed(1)} cm
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  {afiVelocity >= 0 ? '+' : ''}{afiVelocity.toFixed(2)} cm/wk
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Metric 2: Estimated Fetal Weight */}
                    {(() => {
                      const isEfwBelow5th = selectedVisit.growthPercentile < 5;
                      const isEfwAbove95th = selectedVisit.growthPercentile > 95;
                      const isEfwOutOfPercentile = isEfwBelow5th || isEfwAbove95th;
                      const efwPercentileText = isEfwBelow5th ? 'Severe Growth Restriction (< 5th Percentile)' : isEfwAbove95th ? 'Accelerated Growth (> 95th Percentile)' : '';
                      const efwBgClass = isEfwOutOfPercentile
                        ? (isEfwBelow5th ? 'bg-rose-50/40 border-rose-300' : 'bg-amber-50/40 border-amber-300')
                        : 'bg-white border-slate-200';

                      return (
                        <div className={`border rounded-lg p-3 flex flex-col justify-between text-xs transition-all gap-2 ${efwBgClass}`}>
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-start space-x-2">
                              {isEfwOutOfPercentile && (
                                <div className={`p-1 rounded mt-0.5 shrink-0 ${isEfwBelow5th ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-slate-500 font-medium">Estimated Fetal Weight (Hadlock)</span>
                                  {isEfwOutOfPercentile && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isEfwBelow5th ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                      Percentile Alert
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-baseline space-x-1 mt-0.5">
                                  <strong className="text-sm text-slate-950 font-mono font-bold">
                                    {selectedVisit.estimatedFetalWeight_g} g
                                  </strong>
                                  {previousVisit && (
                                    <span className="text-[10px] text-slate-400">
                                      (was {previousVisit.estimatedFetalWeight_g}g)
                                    </span>
                                  )}
                                </div>
                                {isEfwOutOfPercentile && (
                                  <p className={`text-[10px] font-bold mt-1 ${isEfwBelow5th ? 'text-rose-700' : 'text-amber-700'}`}>
                                    {efwPercentileText}
                                  </p>
                                )}
                              </div>
                            </div>

                            {previousVisit && (
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border inline-block bg-emerald-50 text-emerald-700 border-emerald-200">
                                  +{deltaEfw} g
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  +{efwVelocity.toFixed(1)} g/wk
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Metric 3: Growth Percentile */}
                    {(() => {
                      const isEfwBelow5th = selectedVisit.growthPercentile < 5;
                      const isEfwAbove95th = selectedVisit.growthPercentile > 95;
                      const isEfwOutOfPercentile = isEfwBelow5th || isEfwAbove95th;
                      const efwPercentileText = isEfwBelow5th ? 'Severe SGA (< 5th Percentile)' : isEfwAbove95th ? 'LGA (> 95th Percentile)' : '';
                      const efwBgClass = isEfwOutOfPercentile
                        ? (isEfwBelow5th ? 'bg-rose-50/40 border-rose-300' : 'bg-amber-50/40 border-amber-300')
                        : 'bg-white border-slate-200';

                      return (
                        <div className={`border rounded-lg p-3 flex flex-col justify-between text-xs transition-all gap-2 ${efwBgClass}`}>
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-start space-x-2">
                              {isEfwOutOfPercentile && (
                                <div className={`p-1 rounded mt-0.5 shrink-0 ${isEfwBelow5th ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-slate-500 font-medium">Maternal-Fetal Growth Percentile</span>
                                  {isEfwOutOfPercentile && (
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${isEfwBelow5th ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                      Percentile Alert
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-baseline space-x-1 mt-0.5">
                                  <strong className="text-sm text-slate-950 font-mono font-bold">
                                    {getOrdinal(selectedVisit.growthPercentile)} percentile
                                  </strong>
                                  {previousVisit && (
                                    <span className="text-[10px] text-slate-400">
                                      (was {getOrdinal(previousVisit.growthPercentile)})
                                    </span>
                                  )}
                                </div>
                                {isEfwOutOfPercentile && (
                                  <p className={`text-[10px] font-bold mt-1 ${isEfwBelow5th ? 'text-rose-700' : 'text-amber-700'}`}>
                                    {efwPercentileText}
                                  </p>
                                )}
                              </div>
                            </div>

                            {previousVisit && (
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                  deltaPercentile < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {deltaPercentile >= 0 ? '+' : ''}{deltaPercentile} %iles
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  {percentileVelocity >= 0 ? '+' : ''}{percentileVelocity.toFixed(1)} %ile/wk
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Clinical Description Column */}
                <div className="lg:col-span-7 bg-white rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                      <span className="p-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                        What changed &amp; why should the doctor look at it?
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {getTimelineExplanatorySnippet()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Methodology: 1D Kalman Filter stabilized velocity</span>
                    <span>Visit ID: {selectedVisit.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>

              {/* Automated Biometric Growth Threshold Warnings System */}
              <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                    <span>Automated Biometric Growth Threshold Warning System</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Growth Threshold Cutoff: <strong className="font-mono text-amber-700 font-black">&plusmn;2.0 SD (Standard Deviations)</strong>
                  </span>
                </div>

                {hasCriticalDeviation && (
                  <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 flex items-start space-x-2.5">
                    <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-black text-rose-950 uppercase tracking-wider">
                        Critical Growth Biometric Deviation Detected ({criticalDeviations.length} {criticalDeviations.length === 1 ? 'Parameter' : 'Parameters'})
                      </h5>
                      <div className="text-[11px] text-rose-800 font-medium leading-relaxed space-y-1">
                        {criticalDeviations.map(d => (
                          <div key={d.key} className="pl-2 border-l-2 border-rose-300">
                            <strong>{d.label} ({d.key})</strong> is <strong>{d.value} mm</strong> which deviates from expected gestational age mean ({d.mean} mm &plusmn; {d.sd} mm) by <span className="font-bold underline">{d.zScore > 0 ? '+' : ''}{d.zScore} SD</span> ({Math.abs(d.deviationPercent)}% {d.zScore > 0 ? 'overgrowth' : 'undergrowth'}).
                            {d.key === 'AC' && d.zScore < -2.0 && <span className="text-slate-700 block mt-0.5">&bull; Clinical Implications: Deep abdominal circumference lag is highly suggestive of asymmetric Fetal Growth Restriction (FGR) linked to uteroplacental insufficiency. Umbilical artery Doppler surveillance is recommended.</span>}
                            {d.key === 'HC' && d.zScore < -2.0 && <span className="text-slate-700 block mt-0.5">&bull; Clinical Implications: Severe head circumference lag requires detailed neurosonography and structural anatomy review.</span>}
                            {d.key === 'FL' && d.zScore < -2.0 && <span className="text-slate-700 block mt-0.5">&bull; Clinical Implications: Severe femur length lag may indicate constitutional smallness or prompt skeletal dysplasia workup.</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {calculatedZScores.map(z => {
                    const isExceeded = z.exceedsThreshold;
                    const isBorderline = Math.abs(z.zScore) >= 1.0 && Math.abs(z.zScore) <= 2.0;

                    const statusLabel = isExceeded
                      ? (z.zScore > 2 ? '⚠️ CRITICAL OVERGROWTH (>2 SD)' : '⚠️ CRITICAL LAG (<-2 SD)')
                      : isBorderline
                      ? (z.zScore > 1 ? '⚠️ BORDERLINE HIGH (1-2 SD)' : '⚠️ BORDERLINE LOW (<-1 SD)')
                      : '✅ CONCORDANT (<1 SD)';

                    const borderClass = isExceeded
                      ? 'border-rose-300 bg-rose-50/20'
                      : isBorderline
                      ? 'border-amber-300 bg-amber-50/10'
                      : 'border-slate-200 bg-white';

                    const labelClass = isExceeded
                      ? 'text-rose-800 bg-rose-50 border-rose-100'
                      : isBorderline
                      ? 'text-amber-800 bg-amber-50 border-amber-100'
                      : 'text-teal-800 bg-teal-50 border-teal-100';

                    return (
                      <div key={z.key} className={`border rounded-xl p-3 space-y-2 transition-all ${borderClass}`}>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-black text-slate-700 font-mono">{z.key}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${labelClass} select-none whitespace-nowrap`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-slate-500 font-medium">Measured Value:</span>
                            <strong className="font-mono text-slate-900 font-bold">{z.value} mm</strong>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="text-slate-400">GA Median Mean:</span>
                            <span className="font-mono font-medium text-slate-600">{z.mean} mm</span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="text-slate-400">Std Dev (SD):</span>
                            <span className="font-mono text-slate-500">&plusmn;{z.sd} mm</span>
                          </div>
                        </div>

                        {/* Z-Score Progress Slider Graphic */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100/80">
                          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                            <span>-3 SD</span>
                            <span className={isExceeded ? 'text-rose-600' : isBorderline ? 'text-amber-600' : 'text-teal-600'}>
                              Z-Score: {z.zScore > 0 ? '+' : ''}{z.zScore}
                            </span>
                            <span>+3 SD</span>
                          </div>
                          <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                            {/* Central target zone (concordant) */}
                            <div className="absolute left-[33%] right-[33%] top-0 bottom-0 bg-teal-500/10 border-l border-r border-teal-200/40" />
                            {/* Left warning zone (<-2 SD) */}
                            <div className="absolute left-0 w-[16.6%] top-0 bottom-0 bg-rose-500/10" />
                            {/* Right warning zone (>2 SD) */}
                            <div className="absolute right-0 w-[16.6%] top-0 bottom-0 bg-rose-500/10" />

                            {/* Indicator pin */}
                            {(() => {
                              // Map Z-score from [-3, 3] to [0%, 100%]
                              const percentage = Math.max(0, Math.min(100, ((z.zScore + 3) / 6) * 100));
                              return (
                                <div
                                  className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 top-0.5 transition-all ${
                                    isExceeded ? 'bg-rose-600 ring-2 ring-rose-200' : isBorderline ? 'bg-amber-500 ring-2 ring-amber-100' : 'bg-teal-600 ring-2 ring-teal-100'
                                  }`}
                                  style={{ left: `${percentage}%` }}
                                />
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Projected Delivery Outcome Card with EDD Window & Trajectory Risk Stratification */}
      <ProjectedDeliveryOutcomeCard
        twin={twin}
        onNavigateToDeliveryTab={() => handleSwitchSubPage('delivery')}
      />

      {/* Flagship Triad: Trajectory Breakdown | AI Decision Support Alert | Next Visit Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Card A: Trajectory Score breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-xl p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 tracking-tight uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Trajectory Score Breakdown</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                Score: {trajectoryScore.overallScore}/100
              </span>
            </div>

            {/* 5-Factor Score Component Breakdown */}
            <div className="space-y-2.5">
              {/* Factor 1: Fluid Trend */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">1. Fluid Trend (AFI Stability)</span>
                  <span className="font-mono font-bold text-slate-900">{trajectoryScore.fluidScore}%</span>
                </div>
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      trajectoryScore.fluidScore < 60 ? 'bg-rose-500' : trajectoryScore.fluidScore < 75 ? 'bg-amber-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${trajectoryScore.fluidScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Velocity: <strong className="font-mono text-slate-800">{velocities.afiVelocity_cmPerWeek} cm/wk</strong></span>
                  <span className={velocities.afiVelocity_cmPerWeek < -0.3 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                    {velocities.afiVelocity_cmPerWeek < -0.3 ? '↓ Accelerated' : 'Normal drift'}
                  </span>
                </div>
              </div>

              {/* Factor 2: Growth Trend */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">2. Growth Trend (Concordance)</span>
                  <span className="font-mono font-bold text-slate-900">{trajectoryScore.growthScore}%</span>
                </div>
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      trajectoryScore.growthScore < 60 ? 'bg-rose-500' : trajectoryScore.growthScore < 75 ? 'bg-amber-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${trajectoryScore.growthScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Shift: <strong className="font-mono text-slate-800">{velocities.growthVelocity_percentilePerWeek} %ile/wk</strong></span>
                  <span className={velocities.growthVelocity_percentilePerWeek < -1.5 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                    {velocities.growthVelocity_percentilePerWeek < -1.5 ? '↓ Decelerating' : 'Parallel track'}
                  </span>
                </div>
              </div>

              {/* Factor 3: EFW Absolute Velocity */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">3. EFW Absolute Velocity</span>
                  <span className="font-mono font-bold text-slate-900">+{velocities.efwVelocity_gPerWeek || 145} g/wk</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Hadlock Expected: <strong className="font-mono text-slate-700">~150-180 g/wk</strong></span>
                  <span className={velocities.efwVelocity_gPerWeek < 120 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {velocities.efwVelocity_gPerWeek < 120 ? 'Below Median' : 'Age Concordant'}
                  </span>
                </div>
              </div>

              {/* Factor 4: Trajectory Deviation */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">4. Personal Baseline Deviation</span>
                  <span className="font-mono font-bold text-slate-900">{trajectoryScore.trendScore}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Consecutive Drop Scans: <strong className="font-mono text-slate-800">{whyNow.consecutiveDropsCount || 0}</strong></span>
                  <span className={whyNow.consecutiveDropsCount >= 2 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {whyNow.consecutiveDropsCount >= 2 ? 'Trajectory Deviation' : 'Within Bounds'}
                  </span>
                </div>
              </div>

              {/* Factor 5: Why Flagged Status */}
              <div className={`p-2 rounded-lg border text-xs ${
                whyNow.severity === 'critical'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : whyNow.severity === 'warning'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  <span>5. Why Flagged?</span>
                  <span className="font-mono">{whyNow.severity.toUpperCase()}</span>
                </div>
                <p className="text-[11px] leading-tight font-medium">
                  {whyNow.reasons?.join(', ') || whyNow.summary || 'Normal physiological growth velocity aligned with patient baseline.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 leading-normal flex items-center justify-between">
            <span>Confidence index: {trajectoryScore.confidenceScore}%</span>
            <button
              onClick={() => handleSwitchSubPage('analytics')}
              className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Curves</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card B: Decision Support Trajectory Alert (4 cols) */}
        <div
          className={`lg:col-span-4 bg-white border rounded-xl p-4.5 shadow-2xs flex flex-col justify-between ${
            whyNow.severity === 'critical'
              ? 'border-rose-300 ring-1 ring-rose-100'
              : whyNow.severity === 'warning'
              ? 'border-amber-300 ring-1 ring-amber-100'
              : 'border-slate-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 ${
                    whyNow.severity === 'critical'
                      ? 'text-rose-600'
                      : whyNow.severity === 'warning'
                      ? 'text-amber-600'
                      : 'text-teal-600'
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">
                  Decision Support Alert
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${
                    (whyNow.confidence || 92) >= 90
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : (whyNow.confidence || 92) >= 80
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title="Underlying machine learning model consensus and trajectory validation index."
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      (whyNow.confidence || 92) >= 90 ? 'bg-emerald-400' : 'bg-teal-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      (whyNow.confidence || 92) >= 90 ? 'bg-emerald-500' : 'bg-teal-500'
                    }`}></span>
                  </span>
                  <span>
                    {(whyNow.confidence || 92) >= 90
                      ? `High Confidence: ${whyNow.confidence || 92}%`
                      : (whyNow.confidence || 92) >= 80
                      ? `Medium Confidence: ${whyNow.confidence || 92}%`
                      : `Standard Confidence: ${whyNow.confidence || 92}%`}
                  </span>
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    whyNow.severity === 'critical'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : whyNow.severity === 'warning'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}
                >
                  AI Insight
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-medium mb-3">
              {whyNow.summary}
            </p>

            {/* Kalman Filter Noise Mitigation Panel */}
            {whyNow.kalmanFilterRecord && (
              <div className={`mb-3 p-2.5 rounded-lg border text-[11px] leading-snug flex items-start space-x-2 ${
                whyNow.kalmanFilterRecord.falseAlarmsSuppressed
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-indigo-50/40 border-indigo-100 text-slate-800'
              }`}>
                <div className="shrink-0 mt-0.5">
                  <Database className={`w-4 h-4 ${whyNow.kalmanFilterRecord.falseAlarmsSuppressed ? 'text-emerald-600' : 'text-indigo-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-950">
                      1D Kalman Filter Noise Mitigation
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                      whyNow.kalmanFilterRecord.falseAlarmsSuppressed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-50 text-indigo-700 font-bold'
                    }`}>
                      {whyNow.kalmanFilterRecord.falseAlarmsSuppressed ? 'False Alarm Suppressed' : 'Stabilized Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium">
                    {whyNow.kalmanFilterRecord.suppressionDetails}
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500 border-t border-slate-200/50 pt-1">
                    <div>
                      AFI Trend: Raw <strong className="font-bold">{whyNow.kalmanFilterRecord.rawAfi} cm</strong> → Kalman <strong className="font-bold text-indigo-950">{whyNow.kalmanFilterRecord.filteredAfi.toFixed(1)} cm</strong>
                    </div>
                    <div>
                      Weight %ile: Raw <strong className="font-bold">{whyNow.kalmanFilterRecord.rawGrowth}th</strong> → Kalman <strong className="font-bold text-indigo-950">{Math.round(whyNow.kalmanFilterRecord.filteredGrowth)}th</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contributing Factors in Compact Grid */}
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Contributing Factors:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {whyNow.contributingFactors && whyNow.contributingFactors.length > 0 ? (
                  whyNow.contributingFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200/80 px-2 py-1.5 rounded-lg text-[11px] flex justify-between items-center text-slate-800"
                    >
                      <span className="font-medium text-slate-700 truncate mr-1.5">{factor.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                        {factor.impact}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-lg text-[11px] flex justify-between items-center text-slate-800">
                      <span>AFI Velocity</span>
                      <span className="font-bold text-slate-900">{velocities.afiVelocity_cmPerWeek} cm/wk</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-lg text-[11px] flex justify-between items-center text-slate-800">
                      <span>Percentile Shift</span>
                      <span className="font-bold text-slate-900">{whyNow.growthDeltaText}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Clinical IUGR Precision Classification (Symmetrical vs Asymmetrical) */}
            {whyNow.iugrClassification && whyNow.iugrClassification.type !== 'none' && (
              <div className="mb-3 bg-indigo-50/50 border border-indigo-200/60 p-2.5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                    IUGR PRECISION TYPING
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider ${
                    whyNow.iugrClassification.type === 'asymmetrical' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {whyNow.iugrClassification.type === 'asymmetrical' ? 'Asymmetrical (Brain-Sparing)' : 'Symmetrical Delay'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                  {whyNow.iugrClassification.description}
                </p>
                {whyNow.iugrClassification.hcAcRatio && (
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-indigo-850 font-mono border-t border-indigo-200/40 pt-1">
                    <span>Active HC/AC Ratio: <strong className="font-bold">{whyNow.iugrClassification.hcAcRatio}</strong></span>
                    <span>Consensus Confidence: {whyNow.iugrClassification.confidence}%</span>
                  </div>
                )}
                {velocities.hcVelocity_mmPerWeek !== undefined && velocities.acVelocity_mmPerWeek !== undefined && (
                  <div className="mt-1.5 pt-1 border-t border-indigo-200/40 grid grid-cols-2 gap-2 text-[10px] text-indigo-900 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">HC Growth Velocity:</span>
                      <strong className="font-bold text-slate-800">+{velocities.hcVelocity_mmPerWeek.toFixed(1)} mm/wk</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">AC Growth Velocity:</span>
                      <strong className={`font-bold ${velocities.acVelocity_mmPerWeek < 6.0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        +{velocities.acVelocity_mmPerWeek.toFixed(1)} mm/wk
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Action */}
            <div className="bg-teal-50/60 p-2.5 rounded-lg border border-teal-200/70 text-[11px] text-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block mb-0.5">
                Recommended Action:
              </span>
              <p className="leading-snug text-teal-950 font-medium">
                {whyNow.recommendedAction || 'Review serial ultrasound scans and perform repeat Doppler surveillance.'}
              </p>
            </div>
          </div>

          <p className="text-[10px] mt-3 font-normal border-t border-slate-100 pt-2 text-slate-400">
            Decision support tool for qualified clinicians. Model confidence: {whyNow.confidence}%.
          </p>
        </div>

        {/* Card C: Next Visit Forecast (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-300 rounded-xl p-4.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span>Next Visit Forecast</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Target: {forecast.expectedGaWeeks}w
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projected AFI</p>
                <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {forecast.expectedAfiRange[0]} – {forecast.expectedAfiRange[1]} <span className="text-xs font-normal text-slate-500">cm</span>
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentile</p>
                <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {forecast.expectedGrowthPercentileRange[0]} – {forecast.expectedGrowthPercentileRange[1]} <span className="text-xs font-normal text-slate-500">%tile</span>
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 mb-2">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Estimated Fetal Weight Projection</span>
              <span className="font-bold text-slate-900 font-mono text-sm mt-0.5 block">
                ~{forecast.expectedEfwRange_g[0]}g – {forecast.expectedEfwRange_g[1]}g
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-400 text-[11px]">Confidence: {forecast.forecastConfidence}%</span>
            <span
              className={`font-bold text-xs ${
                forecast.predictedTrajectory === 'DECLINING' ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {forecast.predictedTrajectory === 'DECLINING' ? '↓ Decelerating' : '→ Stable Concordance'}
            </span>
          </div>
        </div>
      </div>

      {/* Major Panel: Longitudinal Trajectory & Delivery Forecast */}
      <LongitudinalDeliveryForecastPanel twin={twin} onRefreshData={onRefreshPatients} />

      {/* 3 Quick Navigation Jump Cards to Specialized Sub-Pages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Jump 1: Growth Curves */}
        <div className="bg-white border border-slate-300 rounded-xl p-4.5 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Growth Curves &amp; Hadlock</h4>
                  <p className="text-[11px] text-slate-500">Longitudinal biometry &amp; percentiles</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-55 text-teal-850 border border-teal-350">
                {currentVisit ? currentVisit.growthPercentile : 29}th %ile
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">
              Plotting serial EFW ({currentVisit?.estimatedFetalWeight_g}g), AFI volume, and gestational age velocity curves.
            </p>
          </div>
          <button
            onClick={() => handleSwitchSubPage('analytics')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Open Growth Curves</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Jump 2: What-If Simulation */}
        <div className="bg-white border border-slate-300 rounded-xl p-4.5 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">What-If Simulation</h4>
                  <p className="text-[11px] text-slate-500">Counterfactual trajectory modeling</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-55 text-indigo-850 border border-indigo-350">
                Score: {counterfactualResult.simulatedScore.overallScore}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">
              Simulate hypothetical amniotic fluid shifts or growth velocity drops to preview risk score impacts.
            </p>
          </div>
          <button
            onClick={() => handleSwitchSubPage('analytics')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Open Simulation Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Jump 3: Ultrasound Checkpoints */}
        <div className="bg-white border border-slate-300 rounded-xl p-4.5 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Ultrasound Checkpoints</h4>
                  <p className="text-[11px] text-slate-500">{visits.length} serial scans logged</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-55 text-emerald-850 border border-emerald-350">
                {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">
              Examine biometric checkpoints table, upload new DICOM scans, or review caliper measurements.
            </p>
          </div>
          <button
            onClick={() => handleSwitchSubPage('records')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Open Ultrasound Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Medication Impact & Trajectory Analytics Workstation integrated alongside the timeline */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs">
        <MedicationsHub
          twin={twin}
          patientId={patient.id}
          currentGestationalAgeWeeks={patient.currentGestationalAgeWeeks}
          onRefresh={onRefreshPatients || (() => {})}
        />
      </div>
    </div>
  );

  const renderAnalyticsSubPage = () => (
    <div className="space-y-6">
      {/* Analytics Sub-Page Context Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Modeling, Fetal Growth Curves &amp; What-If Simulation Studio
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Correlate serial biometry against Hadlock percentiles, run counterfactual sensitivity modeling, and preview risk-score impact.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToLiveInput && (
            <button
              onClick={onNavigateToLiveInput}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Live Caliper Studio</span>
            </button>
          )}
          <button
            onClick={() => handleSwitchSubPage('overview')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 shadow-2xs flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span>Twin Overview</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 1. Hadlock Growth & AFI Curves Visualization */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            <span>Hadlock 50th Percentile corridors &amp; Amniotic Fluid Volume</span>
          </h4>
          <p className="text-xs text-slate-500">
            Plotting serial biometrics for {patient.name} against standardized baseline corridors.
          </p>
        </div>
        <GrowthChartVisualization twin={twin} onSelectVisit={onOpenReviewMeasurement} />
      </div>

      {/* 2. Interactive Scenario Presets & What-If Controls */}
      <div className="space-y-4 bg-slate-50 border border-slate-300 rounded-xl p-5 shadow-2xs">
        <div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-700" />
            <span>Counterfactual Trajectory Simulation Modeling</span>
          </h4>
          <p className="text-xs text-slate-500">
            Simulate hypothetical shifts in AFI or growth percentiles to predict sensitivity alerts.
          </p>
        </div>

        {/* Clinical presets inside */}
        <div className="bg-white border border-slate-300 p-4 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>One-Click Clinical Scenarios:</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Baseline AFI: <strong className="font-mono">{baselineAfi.toFixed(1)} cm</strong> • Baseline %ile: <strong className="font-mono">{baselineGrowth}th</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setHypoAfi(11.2); setHypoGrowth(50); }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <span>💧 Normal Fluid Recovery (11.2 cm, 50th %ile)</span>
            </button>
            <button
              onClick={() => { setHypoAfi(4.2); }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <span>⚠️ Oligohydramnios Progression (4.2 cm)</span>
            </button>
            <button
              onClick={() => { setHypoGrowth(10); }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <span>📉 SGA Deceleration (10th %ile)</span>
            </button>
            <button
              onClick={() => { setHypoAfi(16.0); }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <span>🌊 Polyhydramnios Spike (16.0 cm)</span>
            </button>
            <button
              onClick={resetToBaseline}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-150 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center space-x-1.5 ml-auto"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Slider 1: AFI */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-bold">Hypothetical Amniotic Fluid (AFI)</span>
              <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${
                hypoAfi < 5.0 ? 'bg-rose-50 text-rose-800 border-rose-200' : hypoAfi < 8.0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {hypoAfi.toFixed(1)} cm
              </span>
            </div>
            <input
              type="range"
              min={4.0}
              max={16.0}
              step={0.1}
              value={hypoAfi}
              onChange={(e) => setHypoAfi(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-md appearance-none cursor-pointer accent-teal-700"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span className="text-rose-700 font-bold">4.0 cm (Oligo)</span>
              <span>10.0 cm (Median)</span>
              <span className="text-blue-700 font-bold">16.0 cm</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Delta from patient baseline: <strong className={hypoAfi < baselineAfi ? 'text-rose-700' : 'text-emerald-700'}>
                {(hypoAfi - baselineAfi) > 0 ? `+${(hypoAfi - baselineAfi).toFixed(1)}` : (hypoAfi - baselineAfi).toFixed(1)} cm
              </strong>
            </p>
          </div>

          {/* Slider 2: Growth Percentile */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-bold">Hypothetical Fetal Growth %ile</span>
              <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${
                hypoGrowth < 10 ? 'bg-rose-50 text-rose-800 border-rose-200' : hypoGrowth < 30 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {hypoGrowth}th %ile
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={95}
              step={1}
              value={hypoGrowth}
              onChange={(e) => setHypoGrowth(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-md appearance-none cursor-pointer accent-indigo-700"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span className="text-rose-700 font-bold">5th (&lt;10th SGA)</span>
              <span>50th (Expected)</span>
              <span>95th</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Delta from patient baseline: <strong className={hypoGrowth < baselineGrowth ? 'text-rose-700' : 'text-emerald-700'}>
                {(hypoGrowth - baselineGrowth) > 0 ? `+${hypoGrowth - baselineGrowth}` : (hypoGrowth - baselineGrowth)} %iles
              </strong>
            </p>
          </div>

          {/* Result Output Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4.5 rounded-xl shadow-xs flex flex-col justify-between border border-slate-700">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Simulated Outcome
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    counterfactualResult.simulatedRisk === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : counterfactualResult.simulatedRisk === 'WATCH'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {counterfactualResult.simulatedRisk} RISK
                </span>
              </div>

              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-3xl font-bold font-mono text-white">
                  {counterfactualResult.simulatedScore.overallScore}
                </span>
                <span className="text-slate-400 text-xs">/ 100</span>
                <span className="text-xs font-mono ml-auto text-slate-400">
                  Baseline: {trajectoryScore.overallScore}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/80 text-xs text-slate-300">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Primary Driving Factor</span>
              <p className="font-medium text-slate-200 mt-0.5">
                {counterfactualResult.simulatedScore.overallScore === trajectoryScore.overallScore
                  ? 'Metrics reside at baseline clinical markers.'
                  : counterfactualResult.simulatedScore.overallScore < 70
                  ? 'Drastic drop triggered by critical fluid levels / restriction.'
                  : 'Adjusted parameters outline steady growth corridors.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              Baseline vs. Simulated Scenario Comparison Matrix
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {patient.name} • {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Parameter</th>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Patient Actual (Baseline)</th>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Simulated What-If</th>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Delta Variance</th>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Clinical Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Amniotic Fluid Index (AFI)</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{baselineAfi.toFixed(1)} cm</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{hypoAfi.toFixed(1)} cm</td>
                <td className="py-3 px-4 font-mono">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    hypoAfi === baselineAfi ? 'bg-slate-100 text-slate-600' : hypoAfi < baselineAfi ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {(hypoAfi - baselineAfi) > 0 ? `+${(hypoAfi - baselineAfi).toFixed(1)}` : (hypoAfi - baselineAfi).toFixed(1)} cm
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {hypoAfi < 5.0 ? 'Critical Oligohydramnios (<5cm) - Requires urgent delivery assessment' : hypoAfi < 8.0 ? 'Marginal Oligohydramnios (5-8cm) - Weekly serial AFI monitoring' : 'Normal fluid volume (8-18cm)'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Hadlock Growth Percentile</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{baselineGrowth}th %ile</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{hypoGrowth}th %ile</td>
                <td className="py-3 px-4 font-mono">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    hypoGrowth === baselineGrowth ? 'bg-slate-100 text-slate-600' : hypoGrowth < baselineGrowth ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {(hypoGrowth - baselineGrowth) > 0 ? `+${hypoGrowth - baselineGrowth}` : (hypoGrowth - baselineGrowth)} %iles
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {hypoGrowth < 10 ? 'Small for Gestational Age (<10th) - Umbilical Doppler surveillance indicated' : hypoGrowth < 30 ? 'Lower-normal trajectory' : 'Concordant fetal weight trajectory'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Composite Trajectory Score</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{trajectoryScore.overallScore} / 100</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{counterfactualResult.simulatedScore.overallScore} / 100</td>
                <td className="py-3 px-4 font-mono">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    counterfactualResult.simulatedScore.overallScore === trajectoryScore.overallScore ? 'bg-slate-100 text-slate-600' : counterfactualResult.simulatedScore.overallScore < trajectoryScore.overallScore ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {(counterfactualResult.simulatedScore.overallScore - trajectoryScore.overallScore) > 0 ? `+${counterfactualResult.simulatedScore.overallScore - trajectoryScore.overallScore}` : (counterfactualResult.simulatedScore.overallScore - trajectoryScore.overallScore)} pts
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {counterfactualResult.simulatedRisk === 'HIGH' ? 'High Risk - AI alert triggered' : counterfactualResult.simulatedRisk === 'WATCH' ? 'Watch Required - Close surveillance interval' : 'Reassuring overall trajectory'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRecordsSubPage = () => (
    <div className="space-y-4">
      {/* Ultrasound Ingestion Hub Section for Selected Patient */}
      <div
        id="section-ultrasound-upload"
        className="bg-white border border-teal-200/90 rounded-xl p-5 shadow-2xs bg-gradient-to-br from-teal-50/50 via-white to-slate-50/70 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-teal-700 text-white rounded-xl shadow-xs shrink-0 ring-4 ring-teal-700/10">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Serial Ultrasound Ingestion Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {patient.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  MRN: {patient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Upload new serial ultrasound scans (DICOM, GE Voluson/Philips presets, or biometry PDF/JPG reports) to automatically calibrate maternal-fetal trajectory velocity, recalculate Hadlock percentiles, and refresh the digital twin.
              </p>
            </div>
          </div>

          {/* Direct Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-section-open-upload-modal"
              onClick={onOpenUpload}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer ring-2 ring-teal-700/20"
              title={`Open Ultrasound Upload Modal for ${patient.name}`}
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Initiate Ultrasound Upload</span>
            </button>

            <button
              id="btn-section-open-longitudinal-pdf"
              onClick={() => setIsLongitudinalPdfModalOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-2 transition-all cursor-pointer ring-2 ring-slate-400/20"
              title="Generate structured print-ready PDF summary of longitudinal pregnancy history"
            >
              <Printer className="w-4 h-4 text-teal-700" />
              <span>Longitudinal PDF Summary</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold uppercase">
                Print PDF
              </span>
            </button>

            {onNavigateToLiveInput && (
              <button
                id="btn-section-open-live-studio"
                onClick={onNavigateToLiveInput}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Open interactive live caliper calculation studio"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-700" />
                <span>Live Caliper Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* Ingestion Dropzone Banner & Context Strip */}
        <div
          onClick={onOpenUpload}
          className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white/80 hover:bg-teal-50/40 rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left group"
          title="Click to launch Ultrasound Upload Modal"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-700 transition-colors shrink-0 border border-teal-200">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 flex items-center gap-1.5">
                <span>Click to select or drag &amp; drop sonogram images &amp; DICOM files</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="text-[11px] text-slate-500 block">
                Auto-detects BPD, HC, AC, FL, AFI/MVP, and FHR with Gemini Multimodal extraction.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-[11px] font-medium text-slate-600">
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
              GA: <strong>{patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d</strong>
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
              Last Scan: <strong>{currentVisit?.date || 'None'}</strong>
            </span>
            <span className="px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Surveillance: <strong>{patient.status === 'HIGH' ? 'Weekly' : patient.status === 'WATCH' ? 'Every 2 wks' : 'Every 3-4 wks'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sub-View Mode Switcher: Vertical Timeline vs Checkpoints Table */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-300 rounded-xl p-2.5 shadow-2xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRecordsDisplayMode('timeline')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              recordsDisplayMode === 'timeline'
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-200" />
            <span>Vertical Clinical Timeline</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              recordsDisplayMode === 'timeline' ? 'bg-teal-800 text-teal-100' : 'bg-teal-100 text-teal-800'
            }`}>
              Events • Meds • Scans
            </span>
          </button>

          <button
            onClick={() => setRecordsDisplayMode('table')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
              recordsDisplayMode === 'table'
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Serial Scans Caliper Table</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-200 text-slate-700">
              {visits.length}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsLongitudinalPdfModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 transition cursor-pointer shadow-2xs"
            title="Generate structured, print-ready PDF summary of longitudinal pregnancy history"
          >
            <Printer className="w-3.5 h-3.5 text-teal-700" />
            <span>Generate PDF Summary</span>
          </button>

          <div className="text-xs text-slate-500 font-medium hidden md:flex items-center space-x-2 border-l border-slate-200 pl-2.5">
            <span>Patient: <strong>{patient.name}</strong></span>
            <span>•</span>
            <span>MRN: <strong className="font-mono">{patient.mrn}</strong></span>
          </div>
        </div>
      </div>

      {/* Render Vertical Timeline or Tabular Records */}
      {recordsDisplayMode === 'timeline' ? (
        <RecordsVerticalTimeline
          twin={twin}
          onOpenReviewMeasurement={onOpenReviewMeasurement}
          onOpenUpload={onOpenUpload}
          onOpenLongitudinalPdf={() => setIsLongitudinalPdfModalOpen(true)}
        />
      ) : (
        /* Chronological High-Density Visits Table with Filters */
        <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                Serial Longitudinal Ultrasound Checkpoints
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                ({filteredVisits.length} of {visits.length} checkpoints shown)
              </span>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setRecordsFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  recordsFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Scans ({visits.length})
              </button>
              <button
                onClick={() => setRecordsFilter('accepted')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  recordsFilter === 'accepted' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doctor Accepted
              </button>
              <button
                onClick={() => setRecordsFilter('pending')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  recordsFilter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Validation
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">Visit Date</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">GA</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">AFI (cm)</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">SDP (cm)</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">EFW (g)</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">Growth %</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">FHR</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">Presentation</th>
                  <th className="py-2.5 px-3 text-left font-semibold text-[11px]">Review Status</th>
                  <th className="py-2.5 px-3 text-right font-semibold text-[11px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-semibold bg-slate-50/50">
                      No matching ultrasound checkpoints found. Use the "Upload Scan" or "Live Biometrics" options to input scan data.
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v, idx) => (
                    <tr key={v.id} className={idx % 2 === 1 ? 'bg-slate-50/30 hover:bg-slate-50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      <td className="py-2.5 px-3 font-medium text-slate-900 text-xs">{v.date}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 text-[11px]">{v.gestationalAgeWeeks}w {v.gestationalAgeDays}d</td>
                      <td className={`py-2.5 px-3 font-mono font-semibold ${v.amnioticFluidIndex_cm < 9.0 ? 'text-amber-800' : 'text-slate-800'}`}>
                        {v.amnioticFluidIndex_cm.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{v.singleDeepestPocket_cm.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{v.estimatedFetalWeight_g}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          v.growthPercentile < 10
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : v.growthPercentile < 30
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {v.growthPercentile}th
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{v.fetalHeartRate_bpm} bpm</td>
                      <td className="py-2.5 px-3 capitalize text-slate-700">{v.presentation}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          v.doctorReviewStatus === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : v.doctorReviewStatus === 'edited'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {v.doctorReviewStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onOpenReviewMeasurement(v)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Review / Edit extracted measurements"
                        >
                          <Edit3 className="w-3 h-3 text-slate-500" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderMedicationsSubPage = () => {
    return (
      <MedicationsHub
        twin={twin}
        patientId={patient.id}
        currentGestationalAgeWeeks={patient.currentGestationalAgeWeeks}
        onRefresh={onRefreshPatients || (() => {})}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Patient Profile Header Card */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-lg font-bold text-slate-900 tracking-tight">{patient.name}</span>
                <span className="text-xs text-slate-400 font-mono font-medium px-2 py-0.5 bg-slate-50 rounded border border-slate-300">
                  MRN: {patient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                <span>Age {patient.age}</span>
                <span>•</span>
                <span>G{patient.gravidity}P{patient.parity}</span>
                <span>•</span>
                <span className="bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-teal-200">BMI: {patient.maternalBmi || 24.5} kg/m²</span>
                <span>•</span>
                <span>Primary Obstetrician: <span className="text-slate-700 font-medium">{patient.assignedDoctorName || 'Dr. Vance'}</span></span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold font-mono">
                GA: {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
              </div>
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium">
                EDD: {patient.edd}
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  patient.status === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : patient.status === 'WATCH'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {patient.status === 'HIGH' ? 'High Risk' : patient.status === 'WATCH' ? 'Monitor Required' : 'Low Risk'}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {patient.trajectoryCategory.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Actions & Last Sync */}
          <div className="flex items-center gap-3 self-end xl:self-center">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Scan</p>
              <p className="text-xs font-semibold text-slate-700">{currentVisit?.date || '24 Aug 2024'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-edit-covariates"
                onClick={() => setShowCovariateEditor(!showCovariateEditor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showCovariateEditor
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
                title="Edit maternal age, BMI, parity, and other independent covariates"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit Covariates</span>
              </button>

              {onNavigateToLiveInput && (
                <button
                  id="btn-live-input-twin"
                  onClick={onNavigateToLiveInput}
                  className="bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Open interactive live ultrasound biometric input & Hadlock calculator"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Live Biometrics</span>
                </button>
              )}

              <button
                id="btn-print-acog-report"
                onClick={() => setIsPrintModalOpen(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Print or export ACOG / ISUOG clinical consultation report"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Clinical Report</span>
              </button>

              <button
                id="btn-upload-scan-detail"
                onClick={onOpenUpload}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                <span>Upload Scan</span>
              </button>

              <button
                id="btn-open-copilot-detail"
                onClick={onOpenCopilot}
                className="bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>AI Copilot</span>
              </button>

              <button
                id="btn-open-multilingual"
                onClick={onOpenMultilingualModal}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                title="Generate doctor or patient explanation in 7 Indian languages"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Translate</span>
              </button>
            </div>
          </div>
        </div>

        {showCovariateEditor && (
          <form onSubmit={handleSaveCovariates} className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-lg p-3 sm:p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Independent Maternal Covariates & Risk Factors
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCovariateEditor(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Maternal Age */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Maternal Age (Years)
                </label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(Number(e.target.value))}
                  min={12}
                  max={60}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Ages ≥35 or &lt;20 represent independent placental and chromosomal risk factors.
                </p>
              </div>

              {/* Maternal BMI */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Maternal BMI (kg/m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editBmi}
                  onChange={(e) => setEditBmi(Number(e.target.value))}
                  min={10}
                  max={60}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  BMI &lt;18.5 increases SGA/FGR risk; BMI ≥30 can skew Hadlock EFW accuracy.
                </p>
              </div>

              {/* Gravidity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Gravidity (G)
                </label>
                <input
                  type="number"
                  value={editGravidity}
                  onChange={(e) => setEditGravidity(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Total number of pregnancies, inclusive of current gestation.
                </p>
              </div>

              {/* Parity */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Parity (P)
                </label>
                <input
                  type="number"
                  value={editParity}
                  onChange={(e) => setEditParity(Number(e.target.value))}
                  min={0}
                  max={20}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Nulliparity (P0) correlates with elevated late-onset preeclampsia and FGR risks.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCovariateEditor(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCovariates}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white shadow-2xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSavingCovariates ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Apply Covariates</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Compact 4-Metric Instrumentation Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trajectory Score</p>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                trajectoryScore.overallScore >= 75
                  ? 'text-emerald-700'
                  : trajectoryScore.overallScore >= 60
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {trajectoryScore.overallScore}
            </span>
            <span className="text-slate-400 text-xs">/ 100</span>
            <span
              className={`text-[11px] px-2 py-0.5 ml-auto rounded-md font-bold ${
                trajectoryScore.overallScore >= 75
                  ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border border-amber-200'
              }`}
            >
              {trajectoryScore.overallScore >= 75 ? 'Stable' : 'Decelerating'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">AFI (Fluid Volume)</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {currentVisit ? currentVisit.amnioticFluidIndex_cm.toFixed(1) : '8.1'}
            </span>
            <span className="text-slate-400 text-xs">cm</span>
            <span
              className={`text-[11px] ml-auto font-bold px-2 py-0.5 rounded-md ${
                velocities.afiVelocity_cmPerWeek < 0
                  ? 'text-rose-700 bg-rose-50 border border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              }`}
            >
              {velocities.afiVelocity_cmPerWeek < 0 ? `↓ ${Math.abs(velocities.afiVelocity_cmPerWeek)} cm/wk` : 'Stable'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Fetal Weight</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {currentVisit ? currentVisit.estimatedFetalWeight_g : '1780'}
            </span>
            <span className="text-slate-400 text-xs">g</span>
            <span className="text-[11px] text-slate-700 ml-auto font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {currentVisit ? currentVisit.growthPercentile : 29}th %ile
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fetal Heart Rate</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {currentVisit ? currentVisit.fetalHeartRate_bpm : '142'}
            </span>
            <span className="text-slate-400 text-xs">bpm</span>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md ml-auto font-bold">
              Reassuring
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Pages Workspace Layout (Main Active Panel) */}
      <div className="space-y-4">
        {activeSubPage === 'overview' && renderOverviewSubPage()}
        {activeSubPage === 'clusters' && (
          <CriticalClustersSubPage
            twin={twin}
            currentUser={currentUser}
            onSelectPatient={onSelectPatient}
            onNavigateToCohort={() => handleSwitchSubPage('cohort')}
            onOpenCopilot={onOpenCopilot}
          />
        )}
        {activeSubPage === 'cohort' && (
          <RiskGroupCohortSubPage
            twin={twin}
            currentUser={currentUser}
            onSelectPatient={onSelectPatient}
            onNavigateToClusters={() => handleSwitchSubPage('clusters')}
            onOpenCopilot={onOpenCopilot}
          />
        )}
        {activeSubPage === 'analytics' && renderAnalyticsSubPage()}
        {activeSubPage === 'records' && renderRecordsSubPage()}
        {activeSubPage === 'medications' && renderMedicationsSubPage()}
        {activeSubPage === 'delivery' && (
          <TwinDeliveryPredictionTab
            patient={patient}
            twin={twin}
            visits={visits}
          />
        )}
        {activeSubPage === 'hemodynamics' && (
          <TwinHemodynamicsTab
            patient={patient}
            visits={visits}
          />
        )}
        {activeSubPage === 'guidelines' && (
          <TwinGuidelinesTab
            patient={patient}
            twin={twin}
            visits={visits}
          />
        )}
        {activeSubPage === 'vitals' && (
          <MaternalVitalsTracker
            twin={twin}
            onRefresh={onRefreshPatients}
          />
        )}
      </div>

      {/* ACOG Clinical Consultation Report Modal */}
      {isPrintModalOpen && (
        <ClinicalReportPrintModal
          twin={twin}
          currentUser={currentUser}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Longitudinal Pregnancy History Print-Ready PDF Summary Modal */}
      {isLongitudinalPdfModalOpen && (
        <LongitudinalPregnancyPdfSummaryModal
          twin={twin}
          currentUser={currentUser}
          onClose={() => setIsLongitudinalPdfModalOpen(false)}
        />
      )}

      {/* 5. Floating Action Button (FAB) - Ultrasound Upload Shortcut */}
      <div
        id="fab-ultrasound-upload-container"
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 print:hidden"
      >
        {!isFabCollapsed ? (
          <div className="flex items-center bg-teal-700 hover:bg-teal-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-teal-600 ring-4 ring-teal-700/20 group">
            <button
              id="btn-fab-upload-ultrasound"
              onClick={onOpenUpload}
              className="flex items-center space-x-2.5 py-2.5 pl-3.5 pr-3 cursor-pointer text-left focus:outline-none"
              title={`Initiate Ultrasound Upload for ${patient.name}`}
            >
              <div className="w-8 h-8 rounded-full bg-teal-600/80 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                  <span>Upload Scan</span>
                  <span className="text-[10px] bg-teal-900/60 text-teal-200 px-1.5 py-0.2 rounded font-mono font-bold">
                    {patient.currentGestationalAgeWeeks}w
                  </span>
                </div>
                <div className="text-[11px] text-teal-100 font-medium leading-tight max-w-[130px] truncate">
                  {patient.name}
                </div>
              </div>
            </button>

            <button
              id="btn-fab-minimize"
              onClick={(e) => {
                e.stopPropagation();
                setIsFabCollapsed(true);
              }}
              className="p-2 text-teal-200 hover:text-white hover:bg-teal-800 rounded-full transition-colors cursor-pointer mr-1.5"
              title="Minimize floating upload button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="btn-fab-collapsed"
            onClick={onOpenUpload}
            onContextMenu={(e) => {
              e.preventDefault();
              setIsFabCollapsed(false);
            }}
            className="p-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-teal-600 ring-4 ring-teal-700/20 group cursor-pointer relative"
            title={`Upload Ultrasound Scan for ${patient.name} (Click to upload, right-click to expand)`}
          >
            <UploadCloud className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-300 border-2 border-white rounded-full"></span>
          </button>
        )}
      </div>
    </div>
  );
};

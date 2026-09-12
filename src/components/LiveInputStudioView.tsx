/**
 * PregnancyTwin AI - Live Ultrasound & Biometric Input Studio
 * Interactive real-time ultrasound data entry, Hadlock biometric calculator,
 * instant trajectory forecasting, preset scenario simulator, and digital twin ingestion.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Sliders,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
  Heart,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Clock,
  User as UserIcon,
  Stethoscope,
  X,
  Printer,
  Keyboard,
  ShieldAlert,
  UploadCloud,
  HardDrive,
  FileImage,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Patient, VisitMeasurement, User, GrowthStandard, PregnancyDigitalTwin } from '../types';
import { validateFeatureValue, validateAllInputFields, DetailedFieldValidation, MASTER_59_FEATURE_CATALOG } from '../utils/featureReference';
import { calculateVelocities, calculateTrajectoryScore, evaluateWhyNow } from '../utils/trajectoryEngine';
import { smoothLongitudinalVisits } from '../utils/kalmanFilter';
import {
  calculateEfwByStandard,
  calculateFetalGrowthPercentile,
  evaluateDopplerHemodynamics,
  evaluateBpp
} from '../utils/clinicalCalculators';
import { AiUltrasoundScreenOcrModal } from './AiUltrasoundScreenOcrModal';
import { ClinicalReportPrintModal } from './ClinicalReportPrintModal';
import { UltrasoundUploadModal } from './UltrasoundUploadModal';

interface LiveInputStudioViewProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  digitalTwinVisits: VisitMeasurement[];
  onVisitAdded: (patientId: string) => void;
  onNavigateToTwin: () => void;
  onNavigateToCharts: () => void;
  currentUser: User;
  showToast: (msg: string) => void;
}

// Hadlock 4-parameter formula calculation for EFW
function calculateHadlockEfw(hc: number, bpd: number, ac: number, fl: number): number {
  if (!hc || !bpd || !ac || !fl) return 0;
  // Log10(EFW) = 1.3596 - 0.00386*(AC*FL) + 0.0064*(HC) + 0.0061*(BPD) + 0.0424*(AC) + 0.174*(FL)
  // All inputs in cm: HC/10, BPD/10, AC/10, FL/10
  const hc_cm = hc / 10;
  const bpd_cm = bpd / 10;
  const ac_cm = ac / 10;
  const fl_cm = fl / 10;

  const logEfw =
    1.3596 -
    0.00386 * (ac_cm * fl_cm) +
    0.0064 * hc_cm +
    0.0061 * bpd_cm +
    0.0424 * ac_cm +
    0.174 * fl_cm;

  const efw = Math.pow(10, logEfw);
  return Math.round(efw);
}

// Approximate Hadlock 50th percentile weight for given GA
function getExpected50thEfw(weeks: number, days: number): number {
  const ga = weeks + days / 7;
  // Hadlock polynomial fit for 50th percentile weight
  // Grams = exp(0.578 + 0.332*ga - 0.00354*ga^2)
  const grams = Math.exp(0.578 + 0.332 * ga - 0.00354 * Math.pow(ga, 2));
  return Math.round(grams);
}

// Estimate percentile from EFW and GA
function calculatePercentileFromEfw(efw: number, weeks: number, days: number): number {
  const expected50 = getExpected50thEfw(weeks, days);
  if (expected50 <= 0 || efw <= 0) return 50;
  // Standard deviation is roughly 12-14% of mean in late 2nd/3rd trimester
  const sd = expected50 * 0.13;
  const z = (efw - expected50) / sd;
  // Standard normal CDF approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  const pct = Math.round((1 - p) * 100);
  return Math.max(1, Math.min(99, pct));
}

export const LiveInputStudioView: React.FC<LiveInputStudioViewProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  digitalTwinVisits,
  onVisitAdded,
  onNavigateToTwin,
  onNavigateToCharts,
  currentUser,
  showToast
}) => {
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const sortedVisits = useMemo(() => {
    return [...digitalTwinVisits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  }, [digitalTwinVisits]);

  const latestVisit = sortedVisits[sortedVisits.length - 1];

  // Next suggested GA
  const suggestedWeeks = latestVisit ? Math.min(41, latestVisit.gestationalAgeWeeks + 2) : 24;

  // Form State
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState<number>(suggestedWeeks);
  const [gestationalAgeDays, setGestationalAgeDays] = useState<number>(0);
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Calipers
  const [hc, setHc] = useState<number>(295);
  const [bpd, setBpd] = useState<number>(82);
  const [ac, setAc] = useState<number>(272);
  const [fl, setFl] = useState<number>(62);

  // Amniotic fluid
  const [afi, setAfi] = useState<number>(latestVisit ? Math.max(2.5, latestVisit.amnioticFluidIndex_cm - 0.6) : 11.5);
  const [sdp, setSdp] = useState<number>(latestVisit ? Math.max(1.0, latestVisit.singleDeepestPocket_cm - 0.2) : 4.2);

  // Weight & percentile
  const [efw, setEfw] = useState<number>(1820);
  const [growthPercentile, setGrowthPercentile] = useState<number>(38);

  // Vitals & Anatomy
  const [fhr, setFhr] = useState<number>(142);
  const [maternalBpSys, setMaternalBpSys] = useState<number>(118);
  const [maternalBpDia, setMaternalBpDia] = useState<number>(76);
  const [presentation, setPresentation] = useState<'cephalic' | 'breech' | 'transverse' | 'variable'>('cephalic');
  const [placentaLocation, setPlacentaLocation] = useState<'anterior' | 'posterior' | 'fundal' | 'low-lying'>('posterior');
  const [doctorNotes, setDoctorNotes] = useState<string>('Live biometric scan captured. Caliper measurements validated.');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isKalmanActive, setIsKalmanActive] = useState<boolean>(true);

  // Growth Standard (Multi-Ethnic: Hadlock, Intergrowth-21st, WHO)
  const [growthStandard, setGrowthStandard] = useState<GrowthStandard>('HADLOCK');

  // Doppler Velocimetry State
  const [uaPi, setUaPi] = useState<number>(1.02);
  const [mcaPi, setMcaPi] = useState<number>(1.65);
  const [uaRi, setUaRi] = useState<number>(0.65);

  // Manning Biophysical Profile (BPP) 10-point checklist
  const [fetalBreathing, setFetalBreathing] = useState<boolean>(true);
  const [grossBodyMovement, setGrossBodyMovement] = useState<boolean>(true);
  const [fetalTone, setFetalTone] = useState<boolean>(true);
  const [reactiveNst, setReactiveNst] = useState<boolean>(true);

  // Modals for AI OCR Screen Ingestion and ACOG Consult Print
  const [isAiOcrModalOpen, setIsAiOcrModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // System Live Scan Upload state
  const [isSystemUploadModalOpen, setIsSystemUploadModalOpen] = useState<boolean>(false);
  const [inlineScanFile, setInlineScanFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  const [isExtractingInlineScan, setIsExtractingInlineScan] = useState<boolean>(false);
  const [isDraggingScan, setIsDraggingScan] = useState<boolean>(false);
  const [isScanPanelOpen, setIsScanPanelOpen] = useState<boolean>(true);
  const [inlineCaliperData, setInlineCaliperData] = useState<any | null>(null);
  const inlineScanInputRef = React.useRef<HTMLInputElement>(null);

  const handleApplyExtractedBiometrics = (extracted: any) => {
    if (!extracted) return;
    if (typeof extracted.gestational_age_weeks === 'number') {
      setGestationalAgeWeeks(extracted.gestational_age_weeks);
      setGestationalAgeDays(extracted.gestational_age_days || 0);
    }
    if (extracted.biometrics) {
      if (typeof extracted.biometrics.hc_mm === 'number') setHc(Math.round(extracted.biometrics.hc_mm));
      if (typeof extracted.biometrics.bpd_mm === 'number') setBpd(Math.round(extracted.biometrics.bpd_mm));
      if (typeof extracted.biometrics.ac_mm === 'number') setAc(Math.round(extracted.biometrics.ac_mm));
      if (typeof extracted.biometrics.fl_mm === 'number') setFl(Math.round(extracted.biometrics.fl_mm));
    }
    if (typeof extracted.amniotic_fluid_index_cm === 'number') {
      setAfi(parseFloat(extracted.amniotic_fluid_index_cm.toFixed(1)));
    }
    if (typeof extracted.maximum_vertical_pocket_cm === 'number') {
      setSdp(parseFloat(extracted.maximum_vertical_pocket_cm.toFixed(1)));
    }
    if (typeof extracted.estimated_fetal_weight_g === 'number') {
      setEfw(Math.round(extracted.estimated_fetal_weight_g));
    }
    if (typeof extracted.growth_percentile === 'number') {
      setGrowthPercentile(Math.round(extracted.growth_percentile));
    }
    if (typeof extracted.fetal_heart_rate_bpm === 'number') {
      setFhr(Math.round(extracted.fetal_heart_rate_bpm));
    }
    if (extracted.presentation && ['cephalic', 'breech', 'transverse', 'variable'].includes(extracted.presentation)) {
      setPresentation(extracted.presentation);
    }
    if (extracted.placenta_location && ['anterior', 'posterior', 'fundal', 'low-lying'].includes(extracted.placenta_location)) {
      setPlacentaLocation(extracted.placenta_location);
    }
    if (extracted.doppler) {
      if (typeof extracted.doppler.umbilical_artery_pi === 'number') setUaPi(parseFloat(extracted.doppler.umbilical_artery_pi.toFixed(2)));
      if (typeof extracted.doppler.middle_cerebral_artery_pi === 'number') setMcaPi(parseFloat(extracted.doppler.middle_cerebral_artery_pi.toFixed(2)));
    }
    if (extracted.clinical_impression) {
      setDoctorNotes(prev => `${extracted.clinical_impression} (Ingested from system scan)`);
    }
    showToast('Biometric calipers synced into studio sliders & trajectory forecast!');
  };

  const handleInlineFileSelect = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isDicom = file.name.toLowerCase().endsWith('.dcm') || file.type.includes('dicom');
    const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');

    if (!isImage && !isDicom && !isVideo) {
      showToast('Please select a valid ultrasound scan file (JPG, PNG, DICOM .dcm).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setInlineScanFile({
        name: file.name,
        size: file.size,
        type: file.type || 'image/png',
        base64: result
      });
      setInlineCaliperData(null);
      showToast(`Loaded ${file.name} from local system. Click "Extract Calipers" to run Gemini AI.`);
    };
    reader.onerror = () => {
      showToast('Failed to read file from system.');
    };
    reader.readAsDataURL(file);
  };

  const handleRunInlineExtraction = async () => {
    if (!inlineScanFile || !currentPatient) return;
    setIsExtractingInlineScan(true);
    try {
      const res = await fetch('/api/upload-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentPatient.id,
          scanFile: {
            name: inlineScanFile.name,
            size: inlineScanFile.size,
            type: inlineScanFile.type,
            base64: inlineScanFile.base64
          },
          autoExtract: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract scan biometrics');
      setInlineCaliperData(data.extracted);
      handleApplyExtractedBiometrics(data.extracted);
    } catch (err: any) {
      showToast(`Scan extraction error: ${err.message}`);
    } finally {
      setIsExtractingInlineScan(false);
    }
  };

  // Evaluated Doppler Hemodynamics
  const dopplerEval = useMemo(() => {
    return evaluateDopplerHemodynamics(uaPi, mcaPi, uaRi);
  }, [uaPi, mcaPi, uaRi]);

  // Evaluated Manning Biophysical Profile (fluid is auto-synced with SDP >= 2.0cm)
  const bppEval = useMemo(() => {
    return evaluateBpp(
      fetalBreathing,
      grossBodyMovement,
      fetalTone,
      sdp >= 2.0,
      reactiveNst
    );
  }, [fetalBreathing, grossBodyMovement, fetalTone, reactiveNst, sdp]);

  // Auto-calculate EFW from calipers by chosen Growth Standard
  const handleRecalcStandard = (std: GrowthStandard) => {
    setGrowthStandard(std);
    const calculatedEfw = calculateEfwByStandard(std, hc, bpd, ac, fl);
    const calculatedPercentile = calculateFetalGrowthPercentile(calculatedEfw, gestationalAgeWeeks, std);
    setEfw(calculatedEfw);
    setGrowthPercentile(calculatedPercentile);
    showToast(`Growth Standard changed to ${std}: EFW ${calculatedEfw}g (${calculatedPercentile}th %ile)`);
  };

  // Auto-calculate EFW from Hadlock calipers
  const handleAutoCalcHadlock = () => {
    const calculatedEfw = calculateHadlockEfw(hc, bpd, ac, fl);
    setEfw(calculatedEfw);
    const calculatedPercentile = calculatePercentileFromEfw(calculatedEfw, gestationalAgeWeeks, gestationalAgeDays);
    setGrowthPercentile(calculatedPercentile);
    showToast(`Hadlock Calipers Computed: EFW ${calculatedEfw}g (${calculatedPercentile}th %ile)`);
  };

  // Preset Scenario Applicator
  const applyPresetScenario = (scenario: 'oligo-drop' | 'fgr-deviation' | 'normal-growth' | 'poly-spike') => {
    setActiveScenario(scenario);
    if (scenario === 'oligo-drop') {
      const nextWeeks = latestVisit ? latestVisit.gestationalAgeWeeks + 2 : 34;
      setGestationalAgeWeeks(nextWeeks);
      setAfi(4.2);
      setSdp(1.8);
      setHc(298);
      setBpd(84);
      setAc(280);
      setFl(63);
      const w = 2150;
      setEfw(w);
      setGrowthPercentile(calculatePercentileFromEfw(w, nextWeeks, 0));
      setDoctorNotes('Simulated Acute Oligohydramnios event: AFI dropped sharply to 4.2cm. Immediate Doppler and NST indicated.');
      showToast('⚡ Preset Applied: Acute Amniotic Fluid Index Crash (AFI: 4.2cm, SDP: 1.8cm)');
    } else if (scenario === 'fgr-deviation') {
      const nextWeeks = latestVisit ? latestVisit.gestationalAgeWeeks + 2 : 34;
      setGestationalAgeWeeks(nextWeeks);
      setAfi(8.2);
      setSdp(3.4);
      setHc(285);
      setBpd(79);
      setAc(248); // Noticeably low AC
      setFl(58);
      const w = 1580; // <10th percentile
      setEfw(w);
      setGrowthPercentile(7);
      setDoctorNotes('Simulated Fetal Growth Restriction (FGR): AC lag and EFW fallen below the 10th percentile.');
      showToast('⚡ Preset Applied: FGR Growth Deviation (EFW: 1580g, 7th Percentile)');
    } else if (scenario === 'normal-growth') {
      const nextWeeks = latestVisit ? latestVisit.gestationalAgeWeeks + 2 : 32;
      setGestationalAgeWeeks(nextWeeks);
      setAfi(11.8);
      setSdp(4.6);
      setHc(292);
      setBpd(81);
      setAc(270);
      setFl(61);
      const expected = getExpected50thEfw(nextWeeks, 0);
      setEfw(expected);
      setGrowthPercentile(50);
      setDoctorNotes('Simulated Standard Growth: Normative biometrics and normal AFI reassuring.');
      showToast(`⚡ Preset Applied: Steady 50th Percentile Growth (EFW: ${expected}g, AFI: 11.8cm)`);
    } else if (scenario === 'poly-spike') {
      const nextWeeks = latestVisit ? latestVisit.gestationalAgeWeeks + 2 : 34;
      setGestationalAgeWeeks(nextWeeks);
      setAfi(24.8);
      setSdp(9.2);
      const w = 2450;
      setEfw(w);
      setGrowthPercentile(74);
      setDoctorNotes('Simulated Polyhydramnios: AFI increased to 24.8cm. Screen for gestational diabetes.');
      showToast('⚡ Preset Applied: Polyhydramnios Spike (AFI: 24.8cm)');
    }
  };

  // Real-time calculation of prospective scan compared to history
  const prospectiveVisit: VisitMeasurement = useMemo(() => {
    return {
      id: 'prospective-scan',
      visitId: 'prospective-scan',
      patientId: currentPatient?.id || 'pat-001',
      visitNumber: (sortedVisits.length || 0) + 1,
      date: visitDate,
      gestationalAgeWeeks,
      gestationalAgeDays,
      estimatedFetalWeight_g: efw,
      growthPercentile,
      amnioticFluidIndex_cm: afi,
      singleDeepestPocket_cm: sdp,
      fetalHeartRate_bpm: fhr,
      presentation,
      placentaLocation,
      biometrics: { hc_mm: hc, ac_mm: ac, fl_mm: fl, bpd_mm: bpd },
      doppler: {
        umbilicalArteryPi: uaPi,
        umbilicalArteryRi: uaRi,
        middleCerebralArteryPi: mcaPi,
        cerebroplacentalRatio: dopplerEval.cerebroplacentalRatio,
        cprStatus: dopplerEval.cprStatus
      },
      bpp: bppEval,
      growthStandardUsed: growthStandard,
      sourceConfidence: 0.95,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      doctorNotes
    };
  }, [
    currentPatient,
    sortedVisits.length,
    visitDate,
    gestationalAgeWeeks,
    gestationalAgeDays,
    efw,
    growthPercentile,
    afi,
    sdp,
    fhr,
    presentation,
    placentaLocation,
    hc,
    ac,
    fl,
    bpd,
    uaPi,
    uaRi,
    mcaPi,
    dopplerEval,
    bppEval,
    growthStandard,
    doctorNotes
  ]);

  // Combined hypothetical visits series
  const prospectiveVisitsSeries = useMemo(() => {
    const list = [...sortedVisits, prospectiveVisit];
    const sorted = list.sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
    if (isKalmanActive) {
      return smoothLongitudinalVisits(sorted);
    }
    return sorted;
  }, [sortedVisits, prospectiveVisit, isKalmanActive]);

  // Instant real-time velocities & "Why Now?" forecast
  const prospectiveVelocities = useMemo(() => {
    return calculateVelocities(prospectiveVisitsSeries);
  }, [prospectiveVisitsSeries]);

  const prospectiveScore = useMemo(() => {
    return calculateTrajectoryScore(prospectiveVisitsSeries, prospectiveVelocities);
  }, [prospectiveVisitsSeries, prospectiveVelocities]);

  const prospectiveWhyNow = useMemo(() => {
    return evaluateWhyNow(prospectiveVisitsSeries, prospectiveVelocities);
  }, [prospectiveVisitsSeries, prospectiveVelocities]);

  // Fully-formed prospective twin for consultation reports
  const prospectiveTwin: PregnancyDigitalTwin = useMemo(() => {
    return {
      patient: currentPatient,
      visits: prospectiveVisitsSeries,
      currentVisit: prospectiveVisit,
      velocities: prospectiveVelocities,
      trajectoryScore: prospectiveScore,
      whyNow: prospectiveWhyNow,
      forecast: {
        targetGestationalAgeWeeks: Math.min(41, gestationalAgeWeeks + 2),
        expectedAfiRange: [Math.max(2, parseFloat((afi - 1).toFixed(1))), parseFloat((afi + 1).toFixed(1))],
        expectedGrowthPercentileRange: [Math.max(1, growthPercentile - 5), Math.min(99, growthPercentile + 5)],
        expectedEfwRange_g: [efw + 180, efw + 320],
        expectedGaWeeks: Math.min(41, gestationalAgeWeeks + 2)
      },
      riskFactors: currentPatient?.riskFactors || [],
      aiModelConfidence: 0.95
    };
  }, [
    currentPatient,
    prospectiveVisitsSeries,
    prospectiveVisit,
    prospectiveVelocities,
    prospectiveScore,
    prospectiveWhyNow,
    gestationalAgeWeeks,
    afi,
    growthPercentile,
    efw
  ]);

  // Master Range Validation State Engine for all live inputs
  const currentInputsMap = useMemo(() => {
    return {
      gestational_age: gestationalAgeWeeks,
      hc_mm: hc,
      bpd_mm: bpd,
      ac_mm: ac,
      fl_mm: fl,
      efw_g: efw,
      growth_percentile: growthPercentile,
      afi_cm: afi,
      dvp_cm: sdp,
      fetal_heart_rate: fhr,
      bp_systolic: maternalBpSys,
      bp_diastolic: maternalBpDia,
      ua_pi: uaPi,
      mca_pi: mcaPi
    };
  }, [gestationalAgeWeeks, hc, bpd, ac, fl, efw, growthPercentile, afi, sdp, fhr, maternalBpSys, maternalBpDia, uaPi, mcaPi]);

  const validationResults: DetailedFieldValidation[] = useMemo(() => {
    return validateAllInputFields(currentInputsMap);
  }, [currentInputsMap]);

  const invalidValidationFields = useMemo(() => validationResults.filter(v => v.status === 'INVALID'), [validationResults]);
  const reviewValidationFields = useMemo(() => validationResults.filter(v => v.status === 'REVIEW'), [validationResults]);

  // Helper to render inline range badge next to controls
  const renderRangeBadge = (featureId: string, currentValue: number) => {
    const valRes = validateFeatureValue(featureId, currentValue);
    const def = MASTER_59_FEATURE_CATALOG.find(f => f.id === featureId);

    if (valRes.status === 'INVALID') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>Out of Range ({def?.minValid}–{def?.maxValid} {def?.unit})</span>
        </span>
      );
    }

    if (valRes.status === 'REVIEW') {
      return (
        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Review Needed ({def?.reviewMin}–{def?.reviewMax} {def?.unit})</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span>Valid ({def?.minValid}–{def?.maxValid} {def?.unit})</span>
      </span>
    );
  };

  const handleAutoNormalizeFields = () => {
    let normalizedCount = 0;
    validationResults.forEach(item => {
      if (item.status === 'INVALID') {
        const res = validateFeatureValue(item.featureId, item.value);
        normalizedCount++;
        if (item.featureId === 'gestational_age') setGestationalAgeWeeks(res.normalizedValue);
        if (item.featureId === 'hc_mm') setHc(res.normalizedValue);
        if (item.featureId === 'bpd_mm') setBpd(res.normalizedValue);
        if (item.featureId === 'ac_mm') setAc(res.normalizedValue);
        if (item.featureId === 'fl_mm') setFl(res.normalizedValue);
        if (item.featureId === 'efw_g') setEfw(res.normalizedValue);
        if (item.featureId === 'growth_percentile') setGrowthPercentile(res.normalizedValue);
        if (item.featureId === 'afi_cm') setAfi(res.normalizedValue);
        if (item.featureId === 'dvp_cm') setSdp(res.normalizedValue);
        if (item.featureId === 'fetal_heart_rate') setFhr(res.normalizedValue);
        if (item.featureId === 'bp_systolic') setMaternalBpSys(res.normalizedValue);
        if (item.featureId === 'bp_diastolic') setMaternalBpDia(res.normalizedValue);
        if (item.featureId === 'ua_pi') setUaPi(res.normalizedValue);
        if (item.featureId === 'mca_pi') setMcaPi(res.normalizedValue);
      }
    });
    if (normalizedCount > 0) {
      showToast(`Auto-clamped ${normalizedCount} out-of-range field(s) into valid prototype limits.`);
    } else {
      showToast('All parameters already sit inside valid prototype limits!');
    }
  };

  // Real-time Deltas vs last visit
  const deltas = useMemo(() => {
    if (!latestVisit) {
      return { deltaWeeks: 0, deltaAfi: 0, deltaEfw: 0, deltaPct: 0, afiVelocity: 0, efwVelocity: 0 };
    }
    const currentTotalWeeks = gestationalAgeWeeks + gestationalAgeDays / 7;
    const prevTotalWeeks = latestVisit.gestationalAgeWeeks + latestVisit.gestationalAgeDays / 7;
    const deltaWeeks = Math.max(0.1, currentTotalWeeks - prevTotalWeeks);
    const deltaAfi = afi - latestVisit.amnioticFluidIndex_cm;
    const deltaEfw = efw - latestVisit.estimatedFetalWeight_g;
    const deltaPct = growthPercentile - latestVisit.growthPercentile;
    const afiVelocity = deltaAfi / deltaWeeks;
    const efwVelocity = deltaEfw / deltaWeeks;

    return {
      deltaWeeks: deltaWeeks.toFixed(1),
      deltaDays: Math.round(deltaWeeks * 7),
      deltaAfi: deltaAfi.toFixed(1),
      deltaEfw: deltaEfw >= 0 ? `+${deltaEfw}g` : `${deltaEfw}g`,
      deltaPct: deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`,
      afiVelocity: afiVelocity.toFixed(2),
      efwVelocity: Math.round(efwVelocity)
    };
  }, [latestVisit, gestationalAgeWeeks, gestationalAgeDays, afi, efw, growthPercentile]);

  // Real-time Kalman-smoothed values for current inputs
  const kalmanSmoothedValues = useMemo(() => {
    if (!currentPatient) return null;
    const currentProspectiveRaw: VisitMeasurement = {
      id: 'prospective-scan',
      visitId: 'prospective-scan',
      patientId: currentPatient.id,
      visitNumber: (sortedVisits.length || 0) + 1,
      date: visitDate,
      gestationalAgeWeeks,
      gestationalAgeDays,
      estimatedFetalWeight_g: efw,
      growthPercentile,
      amnioticFluidIndex_cm: afi,
      singleDeepestPocket_cm: sdp,
      fetalHeartRate_bpm: fhr,
      presentation,
      placentaLocation,
      biometrics: { hc_mm: hc, ac_mm: ac, fl_mm: fl, bpd_mm: bpd },
      doppler: {
        umbilicalArteryPi: uaPi,
        umbilicalArteryRi: uaRi,
        middleCerebralArteryPi: mcaPi,
        cerebroplacentalRatio: dopplerEval.cerebroplacentalRatio,
        cprStatus: dopplerEval.cprStatus
      },
      bpp: bppEval,
      growthStandardUsed: growthStandard,
      sourceConfidence: 0.95,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      doctorNotes
    };

    const list = [...sortedVisits, currentProspectiveRaw];
    const sorted = list.sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
    // Smooth using our mathematical 2D Kalman engine
    const smoothed = smoothLongitudinalVisits(sorted);
    const lastSmoothed = smoothed.find(v => v.id === 'prospective-scan');

    if (!lastSmoothed) return null;

    return {
      hc: lastSmoothed.biometrics?.hc_mm ?? hc,
      ac: lastSmoothed.biometrics?.ac_mm ?? ac,
      bpd: lastSmoothed.biometrics?.bpd_mm ?? bpd,
      fl: lastSmoothed.biometrics?.fl_mm ?? fl,
      afi: lastSmoothed.amnioticFluidIndex_cm ?? afi,
      efw: lastSmoothed.estimatedFetalWeight_g ?? efw,
    };
  }, [
    currentPatient,
    sortedVisits,
    visitDate,
    gestationalAgeWeeks,
    gestationalAgeDays,
    efw,
    growthPercentile,
    afi,
    sdp,
    fhr,
    presentation,
    placentaLocation,
    hc,
    ac,
    fl,
    bpd,
    uaPi,
    uaRi,
    mcaPi,
    dopplerEval,
    bppEval,
    growthStandard,
    doctorNotes
  ]);

  // Handle Commit / Ingest to Digital Twin
  const handleCommitToTwin = async () => {
    if (!currentPatient) return;

    if (invalidValidationFields.length > 0) {
      const invalidNames = invalidValidationFields.map(f => `${f.name} (${f.value} ${f.unit})`).join(', ');
      showToast(`Range Validation Guard: ${invalidValidationFields.length} field(s) out of valid prototype limits: ${invalidNames}. Please adjust or auto-clamp.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalEfw = efw;
      let finalAfi = afi;
      let finalHc = hc;
      let finalAc = ac;
      let finalFl = fl;
      let finalBpd = bpd;
      let finalPct = growthPercentile;

      if (isKalmanActive) {
        const prospectiveSmoothed = prospectiveVisitsSeries.find(v => v.id === 'prospective-scan');
        if (prospectiveSmoothed) {
          finalEfw = prospectiveSmoothed.estimatedFetalWeight_g;
          finalAfi = prospectiveSmoothed.amnioticFluidIndex_cm;
          finalHc = prospectiveSmoothed.biometrics?.hc_mm ?? finalHc;
          finalAc = prospectiveSmoothed.biometrics?.ac_mm ?? finalAc;
          finalFl = prospectiveSmoothed.biometrics?.fl_mm ?? finalFl;
          finalBpd = prospectiveSmoothed.biometrics?.bpd_mm ?? finalBpd;
          finalPct = prospectiveSmoothed.growthPercentile ?? finalPct;
        }
      }

      const payload = {
        date: visitDate,
        gestationalAgeWeeks,
        gestationalAgeDays,
        estimatedFetalWeight_g: finalEfw,
        growthPercentile: finalPct,
        amnioticFluidIndex_cm: finalAfi,
        singleDeepestPocket_cm: sdp,
        fetalHeartRate_bpm: fhr,
        presentation,
        placentaLocation,
        biometrics: { hc_mm: finalHc, ac_mm: finalAc, fl_mm: finalFl, bpd_mm: finalBpd },
        doppler: {
          umbilicalArteryPi: uaPi,
          umbilicalArteryRi: uaRi,
          middleCerebralArteryPi: mcaPi,
          cerebroplacentalRatio: dopplerEval.cerebroplacentalRatio,
          cprStatus: dopplerEval.cprStatus
        },
        bpp: bppEval,
        growthStandardUsed: growthStandard,
        sourceConfidence: 0.96,
        imageQualityScore: 0.94,
        doctorNotes: isKalmanActive 
          ? `${doctorNotes} (Trajectory stabilized via continuous 2D Kalman smoothing.)`
          : doctorNotes
      };

      const res = await fetch(`/api/patients/${currentPatient.id}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record visit');
      }

      showToast(`Scan Recorded for ${currentPatient.name}! Digital Twin trajectory re-synthesized.`);
      onVisitAdded(currentPatient.id);

      // Increment gestational age for next entry
      setGestationalAgeWeeks(prev => Math.min(41, prev + 2));
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || 'Could not record scan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Hotkeys: Ctrl+Enter (commit), Alt+1..4 (presets), Alt+H (Hadlock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        ((target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCommitToTwin();
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        applyPresetScenario('oligo-drop');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        applyPresetScenario('fgr-deviation');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        applyPresetScenario('normal-growth');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        applyPresetScenario('poly-spike');
      } else if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handleAutoCalcHadlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCommitToTwin]);

  // Delete visit handler
  const handleDeleteVisit = async (visitId: string) => {
    if (!currentPatient) return;
    if (!confirm('Are you sure you want to remove this scan measurement from the digital twin?')) return;
    try {
      const res = await fetch(`/api/patients/${currentPatient.id}/visits/${visitId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        }
      });
      if (res.ok) {
        showToast('Scan measurement removed from longitudinal record.');
        onVisitAdded(currentPatient.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fluid classification badge
  const getFluidClassification = (val: number) => {
    if (val < 5.0) {
      return { text: 'Oligohydramnios (Severe)', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (val < 8.0) {
      return { text: 'Borderline Low Fluid', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (val <= 20.0) {
      return { text: 'Normal Fluid Volume', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { text: 'Polyhydramnios (Elevated)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  };

  const fluidClass = getFluidClassification(afi);

  // Mini Chart data for Live Preview
  const chartData = useMemo(() => {
    return prospectiveVisitsSeries.map(v => ({
      ga: `${v.gestationalAgeWeeks}w`,
      afi: v.amnioticFluidIndex_cm,
      efw: v.estimatedFetalWeight_g,
      pct: v.growthPercentile,
      isProspective: v.id === 'prospective-scan'
    }));
  }, [prospectiveVisitsSeries]);

  return (
    <div className="space-y-6">
      
      {/* 1. Studio Header & Patient Context Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900">Live Ultrasound & Biometric Input Studio</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                  LIVE REAL-TIME ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input live sonographic calipers, fluid pockets, and vitals. Instant Hadlock calculation & trajectory preview before committing to the Digital Twin.
              </p>
            </div>
          </div>

          {/* Patient Selector + Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <label htmlFor="select-patient-studio" className="text-xs text-slate-500 font-medium">Target Patient:</label>
              <select
                id="select-patient-studio"
                value={selectedPatientId}
                onChange={e => onSelectPatient(e.target.value)}
                className="bg-white text-xs font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) — {p.currentGestationalAgeWeeks}w
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-upload-live-scan-system-studio"
              onClick={() => setIsSystemUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Upload live ultrasound scan file directly from local system (DICOM, PNG, JPG, Cine-Loop)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Upload Live Scan</span>
            </button>

            <button
              onClick={() => setIsAiOcrModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Upload sonography screen or choose machine presets (GE, Philips, Mindray) for AI OCR caliper extraction"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>AI Screen OCR Ingest</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Generate printable ACOG/ISUOG Maternal-Fetal Medicine consultation report"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>ACOG Report</span>
            </button>

            <button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>New Patient</span>
            </button>

            <div className="hidden xl:flex items-center space-x-1.5 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Hotkeys:</span>
              <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700 border border-slate-200 shadow-2xs">Ctrl+Enter</kbd>
              <span>Commit</span>
              <span className="text-slate-300">|</span>
              <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700 border border-slate-200 shadow-2xs">Alt+1..4</kbd>
              <span>Presets</span>
              <span className="text-slate-300">|</span>
              <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700 border border-slate-200 shadow-2xs">Alt+H</kbd>
              <span>Hadlock</span>
            </div>
          </div>
        </div>

        {/* Selected Patient Banner Snapshot */}
        {currentPatient && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-900">{currentPatient.name}</span>
              <span className="text-slate-400 font-mono text-[11px]">MRN: {currentPatient.mrn}</span>
              <span className="text-slate-500">Age: {currentPatient.age}y</span>
              <span className="text-slate-500">G{currentPatient.gravidity}P{currentPatient.parity}</span>
              <span className="bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-teal-100">BMI: {currentPatient.maternalBmi || 24.5} kg/m²</span>
              <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                Current GA: {currentPatient.currentGestationalAgeWeeks}w {currentPatient.currentGestationalAgeDays}d
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400">Total Recorded Scans:</span>
              <span className="font-bold text-slate-800 font-mono">{sortedVisits.length} visits</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Assigned:</span>
              <span className="font-medium text-slate-700">{currentPatient.assignedDoctorName}</span>
            </div>
          </div>
        )}
      </div>

      {/* System Live Scan Ingestion Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Upload Live Scans from System
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                  DICOM &bull; PNG &bull; JPG &bull; GEMINI VISION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Directly ingest ultrasound images or cine-frames from your local drive to extract biometrics into the simulator
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSystemUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition flex items-center space-x-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Full PACS & Presets Modal</span>
            </button>
            <button
              onClick={() => setIsScanPanelOpen(!isScanPanelOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isScanPanelOpen ? 'Collapse panel' : 'Expand panel'}
            >
              {isScanPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isScanPanelOpen && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              
              {/* Dropzone & File Ingest (Left 7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingScan(true); }}
                  onDragLeave={() => setIsDraggingScan(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingScan(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleInlineFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDraggingScan
                      ? 'border-teal-500 bg-teal-50/60'
                      : inlineScanFile
                      ? 'border-teal-400 bg-teal-50/30'
                      : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50 bg-white'
                  }`}
                  onClick={() => inlineScanInputRef.current?.click()}
                >
                  <input
                    ref={inlineScanInputRef}
                    type="file"
                    accept="image/*,.dcm,video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleInlineFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {inlineScanFile ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                        <FileImage className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 flex items-center justify-center space-x-1.5">
                          <span>{inlineScanFile.name}</span>
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                            {(inlineScanFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          File loaded from local system. Click below to extract biometrics with Gemini AI or select a new file.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Drop ultrasound scan from your local machine, or click to browse
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supports DICOM snapshots (.dcm), PNG, JPG, and cine-loops up to 50MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extraction action row & preset shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={!inlineScanFile || isExtractingInlineScan}
                      onClick={handleRunInlineExtraction}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition ${
                        !inlineScanFile
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : isExtractingInlineScan
                          ? 'bg-teal-700 text-white animate-pulse'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isExtractingInlineScan ? 'Extracting Calipers with AI...' : 'Extract Biometrics with Gemini'}</span>
                    </button>

                    {inlineScanFile && (
                      <button
                        onClick={() => { setInlineScanFile(null); setInlineCaliperData(null); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200/60 transition"
                      >
                        Clear File
                      </button>
                    )}
                  </div>

                  {/* Quick Machine presets for fast testing if user doesn't have an image on hand */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Sample Live Scans:</span>
                    <button
                      onClick={() => {
                        const sampleUrl = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';
                        fetch(sampleUrl)
                          .then(r => r.blob())
                          .then(blob => {
                            const file = new File([blob], 'GE_Voluson_E10_32w.jpg', { type: 'image/jpeg' });
                            handleInlineFileSelect(file);
                          })
                          .catch(() => {
                            setInlineScanFile({
                              name: 'GE_Voluson_E10_32w.jpg',
                              size: 420000,
                              type: 'image/jpeg',
                              base64: sampleUrl
                            });
                          });
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]"
                    >
                      GE Voluson 32w
                    </button>
                    <button
                      onClick={() => {
                        const sampleUrl = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80';
                        fetch(sampleUrl)
                          .then(r => r.blob())
                          .then(blob => {
                            const file = new File([blob], 'Philips_EPIQ_34w_Oligo.jpg', { type: 'image/jpeg' });
                            handleInlineFileSelect(file);
                          })
                          .catch(() => {
                            setInlineScanFile({
                              name: 'Philips_EPIQ_34w_Oligo.jpg',
                              size: 380000,
                              type: 'image/jpeg',
                              base64: sampleUrl
                            });
                          });
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]"
                    >
                      Philips 34w Oligo
                    </button>
                  </div>
                </div>
              </div>

              {/* Scan Preview & Extraction HUD (Right 5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-3 flex flex-col justify-between border border-slate-800 min-h-[160px]">
                {inlineScanFile ? (
                  <div className="space-y-2.5">
                    <div className="relative rounded-lg overflow-hidden bg-black border border-slate-700 max-h-36 flex items-center justify-center">
                      <img
                        src={inlineScanFile.base64}
                        alt="Ultrasound live scan preview"
                        className="w-full h-36 object-contain opacity-90"
                      />
                      <div className="absolute top-1.5 left-2 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-teal-300 border border-teal-500/30">
                        SYSTEM SCAN: {inlineScanFile.name.slice(0, 24)}
                      </div>
                      <div className="absolute bottom-1.5 right-2 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-300">
                        HUD CALIPERS READY
                      </div>
                    </div>

                    {inlineCaliperData ? (
                      <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-300 flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5 text-teal-400" />
                            <span>Biometrics Extracted</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Confidence: {inlineCaliperData.confidence_score ? `${Math.round(inlineCaliperData.confidence_score * 100)}%` : 'High'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono text-center">
                          <div className="bg-slate-900 p-1 rounded">
                            <span className="text-slate-400 block text-[9px]">BPD</span>
                            <span className="font-bold text-white">{inlineCaliperData.biometrics?.bpd_mm || '--'}mm</span>
                          </div>
                          <div className="bg-slate-900 p-1 rounded">
                            <span className="text-slate-400 block text-[9px]">HC</span>
                            <span className="font-bold text-white">{inlineCaliperData.biometrics?.hc_mm || '--'}mm</span>
                          </div>
                          <div className="bg-slate-900 p-1 rounded">
                            <span className="text-slate-400 block text-[9px]">AC</span>
                            <span className="font-bold text-white">{inlineCaliperData.biometrics?.ac_mm || '--'}mm</span>
                          </div>
                          <div className="bg-slate-900 p-1 rounded">
                            <span className="text-slate-400 block text-[9px]">FL</span>
                            <span className="font-bold text-white">{inlineCaliperData.biometrics?.fl_mm || '--'}mm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/60">
                          <span className="text-slate-300">
                            EFW: <strong className="text-teal-300 font-mono">{inlineCaliperData.estimated_fetal_weight_g || '--'}g</strong> ({inlineCaliperData.growth_percentile || '--'}th %ile)
                          </span>
                          <span className="text-slate-300">
                            AFI: <strong className="text-teal-300 font-mono">{inlineCaliperData.amniotic_fluid_index_cm || '--'}cm</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplyExtractedBiometrics(inlineCaliperData)}
                          className="w-full py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold text-xs transition"
                        >
                          Sync Extracted Calipers to Sliders
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center py-1">
                        Click &ldquo;Extract Biometrics with Gemini&rdquo; to auto-detect calipers from this scan.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                      <FileImage className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">No Scan Loaded</span>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Drag any ultrasound scan from your computer, or click one of the sample machine presets to simulate live ingestion.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive One-Click Scenario Simulation Injectors */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              One-Click Clinical Simulation Presets
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any scenario to immediately populate live inputs and preview deterministic trajectory algorithms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <button
            onClick={() => applyPresetScenario('oligo-drop')}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              activeScenario === 'oligo-drop'
                ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-rose-400">🚨 Acute Oligo Crash</span>
              <span className="text-[10px] font-mono bg-rose-900/50 text-rose-300 px-1.5 py-0.2 rounded">AFI 4.2cm</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulates critical fluid drop &gt;4cm below baseline. Triggers Why Now Alert.
            </p>
          </button>

          <button
            onClick={() => applyPresetScenario('fgr-deviation')}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              activeScenario === 'fgr-deviation'
                ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-amber-400">⚠️ FGR Deviation</span>
              <span className="text-[10px] font-mono bg-amber-900/50 text-amber-300 px-1.5 py-0.2 rounded">7th %ile</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulates abdominal circumference lag and weight falling below 10th percentile.
            </p>
          </button>

          <button
            onClick={() => applyPresetScenario('normal-growth')}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              activeScenario === 'normal-growth'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-emerald-400">✅ Normal Hadlock</span>
              <span className="text-[10px] font-mono bg-emerald-900/50 text-emerald-300 px-1.5 py-0.2 rounded">50th %ile</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Optimal growth increment along standard 50th percentile Hadlock trajectory.
            </p>
          </button>

          <button
            onClick={() => applyPresetScenario('poly-spike')}
            className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
              activeScenario === 'poly-spike'
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-100 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-indigo-400">💧 Polyhydramnios</span>
              <span className="text-[10px] font-mono bg-indigo-900/50 text-indigo-300 px-1.5 py-0.2 rounded">AFI 24.8cm</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Elevated fluid volume above 24cm cutoff for maternal glucose cross-correlation.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Main Grid: Form on Left (60%) vs Live Predictive Radar on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Master Range Validation Inspector Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Master Range Validation & Medical Boundary Engine
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Continuously checks live input parameters against prototype reference ranges and clinical norms.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {invalidValidationFields.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>{invalidValidationFields.length} Out of Range</span>
                  </span>
                ) : reviewValidationFields.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{reviewValidationFields.length} Review Needed</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>14 / 14 Parameters Valid</span>
                  </span>
                )}

                {invalidValidationFields.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoNormalizeFields}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                  >
                    Auto-Clamp Fields
                  </button>
                )}
              </div>
            </div>

            {/* Grid of All Parameter Range Statuses */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {validationResults.map(item => (
                <div
                  key={item.featureId}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition ${
                    item.status === 'INVALID'
                      ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                      : item.status === 'REVIEW'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                    <span className="truncate" title={item.name}>{item.name}</span>
                    <span className="font-mono">{item.value}{item.unit ? ` ${item.unit}` : ''}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Min: {item.minValid}</span>
                    <span>Max: {item.maxValid}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section A: Scan Timing & Gestational Age */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>1. Scan Date & Gestational Age</span>
              </div>
              <div className="flex items-center space-x-2">
                {renderRangeBadge('gestational_age', gestationalAgeWeeks)}
                <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  GA: {gestationalAgeWeeks}w {gestationalAgeDays}d
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="input-scan-date" className="block text-[11px] font-medium text-slate-600 mb-1">Scan Date</label>
                <input
                  id="input-scan-date"
                  type="date"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <label htmlFor="input-ga-weeks">GA Weeks ({gestationalAgeWeeks}w)</label>
                </div>
                <input
                  id="input-ga-weeks"
                  type="range"
                  min={18}
                  max={41}
                  step={1}
                  value={gestationalAgeWeeks}
                  onChange={e => setGestationalAgeWeeks(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>18w</span>
                  <span>28w</span>
                  <span>40w</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <label htmlFor="input-ga-days">GA Days ({gestationalAgeDays}d)</label>
                </div>
                <input
                  id="input-ga-days"
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={gestationalAgeDays}
                  onChange={e => setGestationalAgeDays(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>+0d</span>
                  <span>+3d</span>
                  <span>+6d</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Sonographic Calipers & Multi-Ethnic Growth Standard */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            {/* Kalman Filter Control Panel */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  Kalman Trajectory Smoothing & Stabilization
                </span>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Reduces sonographer caliper hand-shake noise using continuous fetal velocity equations.
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  id="toggle-kalman-smoothing-biometry"
                  onClick={() => {
                    setIsKalmanActive(!isKalmanActive);
                    showToast(!isKalmanActive ? 'Kalman filter activated. Stabilizing growth trajectory.' : 'Kalman filter disabled. Using raw sonographer measurements.');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs ${
                    isKalmanActive
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isKalmanActive ? 'Filter Active (Smoothed)' : 'Filter Inactive (Raw)'}</span>
                </button>
              </div>
            </div>

            {/* Live Comparative Kalman HUD */}
            {isKalmanActive && kalmanSmoothedValues && (
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                    Real-time Kalman Stabilizer Status (R-S ratio: 25:0.5)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Velocity-augmented state tracking
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-center font-mono">
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px]">BPD</span>
                    <span className="text-slate-300">{bpd} mm</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.bpd} mm</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px]">HC</span>
                    <span className="text-slate-300">{hc} mm</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.hc} mm</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px]">AC</span>
                    <span className="text-slate-300">{ac} mm</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.ac} mm</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px]">FL</span>
                    <span className="text-slate-300">{fl} mm</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.fl} mm</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 block text-[9px]">AFI</span>
                    <span className="text-slate-300">{afi.toFixed(1)} cm</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.afi.toFixed(1)} cm</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60 col-span-1">
                    <span className="text-slate-400 block text-[9px]">EFW</span>
                    <span className="text-slate-300">{efw} g</span>
                    <span className="text-teal-400 font-bold block">→ {kalmanSmoothedValues.efw} g</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                <span>2. Fetal Biometry Calipers & Growth Standards</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500 font-medium">Standard:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px] font-bold">
                  {(['HADLOCK', 'INTERGROWTH_21ST', 'WHO'] as GrowthStandard[]).map(std => (
                    <button
                      key={std}
                      type="button"
                      onClick={() => handleRecalcStandard(std)}
                      className={`px-2 py-1 rounded transition ${
                        growthStandard === std
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {std === 'HADLOCK' ? 'Hadlock (1991)' : std === 'INTERGROWTH_21ST' ? 'INTERGROWTH' : 'WHO (2017)'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAutoCalcHadlock}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition"
                  title="Calculate EFW using Hadlock 4-parameter regression formula"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Calc</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* HC */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-hc-mm">HC (Head)</label>
                  <span className="font-mono font-bold text-indigo-700">{hc} mm</span>
                </div>
                <div>{renderRangeBadge('hc_mm', hc)}</div>
                <input
                  id="input-hc-mm"
                  type="range"
                  min={150}
                  max={380}
                  step={1}
                  value={hc}
                  onChange={e => setHc(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">{(hc / 10).toFixed(1)} cm</span>
              </div>

              {/* BPD */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-bpd-mm">BPD (Parietal)</label>
                  <span className="font-mono font-bold text-indigo-700">{bpd} mm</span>
                </div>
                <div>{renderRangeBadge('bpd_mm', bpd)}</div>
                <input
                  id="input-bpd-mm"
                  type="range"
                  min={40}
                  max={110}
                  step={1}
                  value={bpd}
                  onChange={e => setBpd(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">{(bpd / 10).toFixed(1)} cm</span>
              </div>

              {/* AC */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-ac-mm">AC (Abdomen)</label>
                  <span className="font-mono font-bold text-indigo-700">{ac} mm</span>
                </div>
                <div>{renderRangeBadge('ac_mm', ac)}</div>
                <input
                  id="input-ac-mm"
                  type="range"
                  min={130}
                  max={400}
                  step={1}
                  value={ac}
                  onChange={e => setAc(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">{(ac / 10).toFixed(1)} cm</span>
              </div>

              {/* FL */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-fl-mm">FL (Femur)</label>
                  <span className="font-mono font-bold text-indigo-700">{fl} mm</span>
                </div>
                <div>{renderRangeBadge('fl_mm', fl)}</div>
                <input
                  id="input-fl-mm"
                  type="range"
                  min={25}
                  max={80}
                  step={1}
                  value={fl}
                  onChange={e => setFl(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">{(fl / 10).toFixed(1)} cm</span>
              </div>
            </div>
          </div>

          {/* Section 2B: Doppler Hemodynamics & Cerebroplacental Ratio (CPR) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>2B. Doppler Hemodynamics & CPR Ratio</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  dopplerEval.cprStatus === 'critical'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                    : dopplerEval.cprStatus === 'brain_sparing'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                CPR {dopplerEval.cerebroplacentalRatio ?? 'N/A'} — {dopplerEval.cprStatus === 'brain_sparing' ? 'Brain-Sparing' : dopplerEval.cprStatus === 'critical' ? 'Critical' : 'Normal'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Umbilical Artery (UA) PI */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-ua-pi">UA Pulsatility (PI)</label>
                  <span className={`font-mono font-bold ${uaPi > 1.4 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {uaPi.toFixed(2)}
                  </span>
                </div>
                <div>{renderRangeBadge('ua_pi', uaPi)}</div>
                <input
                  id="input-ua-pi"
                  type="range"
                  min={0.1}
                  max={4.0}
                  step={0.02}
                  value={uaPi}
                  onChange={e => setUaPi(parseFloat(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>0.10</span>
                  <span className="text-slate-600">&gt;1.40 Elevated</span>
                  <span>4.00</span>
                </div>
              </div>

              {/* Middle Cerebral Artery (MCA) PI */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                  <label htmlFor="input-mca-pi">MCA Pulsatility (PI)</label>
                  <span className={`font-mono font-bold ${mcaPi < 1.3 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {mcaPi.toFixed(2)}
                  </span>
                </div>
                <div>{renderRangeBadge('mca_pi', mcaPi)}</div>
                <input
                  id="input-mca-pi"
                  type="range"
                  min={0.1}
                  max={4.5}
                  step={0.02}
                  value={mcaPi}
                  onChange={e => setMcaPi(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>0.10</span>
                  <span className="text-slate-600">&lt;1.30 Vasodilation</span>
                  <span>4.50</span>
                </div>
              </div>

              {/* Cerebroplacental Ratio CPR Summary Card */}
              <div className="p-2.5 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                    <span>Cerebroplacental Ratio</span>
                    <span className="font-mono font-bold text-slate-900">{dopplerEval.cerebroplacentalRatio ?? 'N/A'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {dopplerEval.cprStatus === 'critical'
                      ? 'Severe cerebral redistribution. High risk of fetal acidosis. Urgent review.'
                      : dopplerEval.cprStatus === 'brain_sparing'
                      ? 'Compensatory cerebral vasodilation (brain sparing detected).'
                      : 'Normative placental vascular resistance and cerebral perfusion.'}
                  </p>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">ACOG Threshold:</span>
                  <span className="font-bold text-slate-700">CPR ≥ 1.08</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2C: Manning Biophysical Profile (BPP - 10-Point Scoring) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>2C. Manning Biophysical Profile (BPP)</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                  bppEval.totalBppScore >= 8
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : bppEval.totalBppScore >= 6
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                BPP Score: {bppEval.totalBppScore} / 10 ({bppEval.interpretation.toUpperCase()})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {/* Breathing */}
              <button
                type="button"
                onClick={() => setFetalBreathing(prev => !prev)}
                className={`p-2 rounded-lg border text-left transition ${
                  fetalBreathing
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[11px]">Breathing</span>
                  <span className="font-mono text-[10px] font-bold">{fetalBreathing ? '2 pts' : '0 pt'}</span>
                </div>
                <p className="text-[10px] line-clamp-2">≥1 ep ≥30s rhythmic breathing</p>
              </button>

              {/* Movement */}
              <button
                type="button"
                onClick={() => setGrossBodyMovement(prev => !prev)}
                className={`p-2 rounded-lg border text-left transition ${
                  grossBodyMovement
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[11px]">Movements</span>
                  <span className="font-mono text-[10px] font-bold">{grossBodyMovement ? '2 pts' : '0 pt'}</span>
                </div>
                <p className="text-[10px] line-clamp-2">≥3 discrete body/limb movements</p>
              </button>

              {/* Tone */}
              <button
                type="button"
                onClick={() => setFetalTone(prev => !prev)}
                className={`p-2 rounded-lg border text-left transition ${
                  fetalTone
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[11px]">Fetal Tone</span>
                  <span className="font-mono text-[10px] font-bold">{fetalTone ? '2 pts' : '0 pt'}</span>
                </div>
                <p className="text-[10px] line-clamp-2">Active limb extension & return</p>
              </button>

              {/* Amniotic Fluid Volume (Auto-synced with SDP >= 2.0cm) */}
              <div
                className={`p-2 rounded-lg border text-left ${
                  sdp >= 2.0
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-rose-300 bg-rose-50/60 text-rose-900'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[11px]">Fluid (SDP)</span>
                  <span className="font-mono text-[10px] font-bold">{sdp >= 2.0 ? '2 pts' : '0 pt'}</span>
                </div>
                <p className="text-[10px] line-clamp-2">Pocket ≥2cm (Current: {sdp}cm)</p>
              </div>

              {/* Reactive NST */}
              <button
                type="button"
                onClick={() => setReactiveNst(prev => !prev)}
                className={`p-2 rounded-lg border text-left transition ${
                  reactiveNst
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[11px]">Reactive NST</span>
                  <span className="font-mono text-[10px] font-bold">{reactiveNst ? '2 pts' : '0 pt'}</span>
                </div>
                <p className="text-[10px] line-clamp-2">≥2 accels in 20 min</p>
              </button>
            </div>
          </div>

          {/* Section C: Amniotic Fluid Dynamics */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>3. Amniotic Fluid Assessment</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${fluidClass.bg}`}>
                {fluidClass.text}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AFI */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-afi-cm" className="text-xs font-semibold text-slate-700">Amniotic Fluid Index (AFI)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      id="input-afi-cm"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="35.0"
                      value={afi}
                      onChange={e => setAfi(Number(e.target.value))}
                      className="w-16 font-mono font-bold text-right text-xs border border-slate-300 rounded px-1.5 py-0.5 text-teal-800"
                    />
                    <span className="text-xs text-slate-500 font-mono">cm</span>
                  </div>
                </div>
                <div>{renderRangeBadge('afi_cm', afi)}</div>
                <input
                  type="range"
                  min={1.0}
                  max={35.0}
                  step={0.1}
                  value={afi}
                  onChange={e => setAfi(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span className="text-rose-500 font-bold">&lt;5.0 Oligo</span>
                  <span className="text-amber-600 font-semibold">5-8cm Low</span>
                  <span className="text-emerald-600 font-semibold">8-20cm Normal</span>
                  <span className="text-indigo-600">&gt;24cm Poly</span>
                </div>
              </div>

              {/* SDP */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-sdp-cm" className="text-xs font-semibold text-slate-700">Single Deepest Pocket (SDP)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      id="input-sdp-cm"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max={18.0}
                      value={sdp}
                      onChange={e => setSdp(Number(e.target.value))}
                      className="w-16 font-mono font-bold text-right text-xs border border-slate-300 rounded px-1.5 py-0.5 text-teal-800"
                    />
                    <span className="text-xs text-slate-500 font-mono">cm</span>
                  </div>
                </div>
                <div>{renderRangeBadge('dvp_cm', sdp)}</div>
                <input
                  type="range"
                  min={0.5}
                  max={18.0}
                  step={0.1}
                  value={sdp}
                  onChange={e => setSdp(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span className="text-rose-500 font-bold">&lt;2.0cm Oligo</span>
                  <span className="text-emerald-600 font-semibold">2.0 - 8.0cm Normal</span>
                  <span className="text-indigo-600">&gt;8.0cm Poly</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Fetal Weight & Growth Percentile */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>4. Weight & Growth Percentile</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                growthPercentile < 10
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : growthPercentile < 25
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {growthPercentile < 10 ? '🚨 FGR / SGA (<10th %ile)' : growthPercentile < 25 ? '⚠️ Borderline SGA' : '✅ Normal Growth'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* EFW */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-efw-g" className="text-xs font-semibold text-slate-700">Estimated Fetal Weight</label>
                  <div className="flex items-center space-x-1">
                    <input
                      id="input-efw-g"
                      type="number"
                      step="10"
                      min="200"
                      max="5000"
                      value={efw}
                      onChange={e => setEfw(Number(e.target.value))}
                      className="w-20 font-mono font-bold text-right text-xs border border-slate-300 rounded px-1.5 py-0.5 text-indigo-800"
                    />
                    <span className="text-xs text-slate-500 font-mono">g</span>
                  </div>
                </div>
                <div>{renderRangeBadge('efw_g', efw)}</div>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={10}
                  value={efw}
                  onChange={e => setEfw(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>200g</span>
                  <span>Expected: ~{getExpected50thEfw(gestationalAgeWeeks, gestationalAgeDays)}g</span>
                  <span>5000g</span>
                </div>
              </div>

              {/* Percentile */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-growth-pct" className="text-xs font-semibold text-slate-700">Growth Percentile</label>
                  <div className="flex items-center space-x-1">
                    <input
                      id="input-growth-pct"
                      type="number"
                      min="1"
                      max="99"
                      value={growthPercentile}
                      onChange={e => setGrowthPercentile(Number(e.target.value))}
                      className="w-16 font-mono font-bold text-right text-xs border border-slate-300 rounded px-1.5 py-0.5 text-indigo-800"
                    />
                    <span className="text-xs text-slate-500 font-mono">%</span>
                  </div>
                </div>
                <div>{renderRangeBadge('growth_percentile', growthPercentile)}</div>
                <input
                  type="range"
                  min={1}
                  max={99}
                  step={1}
                  value={growthPercentile}
                  onChange={e => setGrowthPercentile(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span className="text-rose-500 font-bold">&lt;10th SGA</span>
                  <span>50th Median</span>
                  <span className="text-indigo-600">&gt;90th LGA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Vitals & Clinical Impression */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>5. Vitals, Anatomy & Clinician Impression</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                  <label htmlFor="input-fhr-bpm">Fetal HR (bpm)</label>
                </div>
                <div>{renderRangeBadge('fetal_heart_rate', fhr)}</div>
                <input
                  id="input-fhr-bpm"
                  type="number"
                  value={fhr}
                  onChange={e => setFhr(Number(e.target.value))}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                  <label htmlFor="input-bp-sys">BP (Sys / Dia)</label>
                </div>
                <div className="flex items-center space-x-1 text-[9px]">
                  {renderRangeBadge('bp_systolic', maternalBpSys)}
                  {renderRangeBadge('bp_diastolic', maternalBpDia)}
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    id="input-bp-sys"
                    type="number"
                    value={maternalBpSys}
                    onChange={e => setMaternalBpSys(Number(e.target.value))}
                    className="w-1/2 text-xs font-mono border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 text-center"
                    placeholder="Sys"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    id="input-bp-dia"
                    type="number"
                    value={maternalBpDia}
                    onChange={e => setMaternalBpDia(Number(e.target.value))}
                    className="w-1/2 text-xs font-mono border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500 text-center"
                    placeholder="Dia"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="select-presentation" className="block text-[11px] font-medium text-slate-600 mb-1">Presentation</label>
                <select
                  id="select-presentation"
                  value={presentation}
                  onChange={e => setPresentation(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-teal-500"
                >
                  <option value="cephalic">Cephalic (Vertex)</option>
                  <option value="breech">Breech</option>
                  <option value="transverse">Transverse</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              <div>
                <label htmlFor="select-placenta" className="block text-[11px] font-medium text-slate-600 mb-1">Placenta Site</label>
                <select
                  id="select-placenta"
                  value={placentaLocation}
                  onChange={e => setPlacentaLocation(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-teal-500"
                >
                  <option value="posterior">Posterior</option>
                  <option value="anterior">Anterior</option>
                  <option value="fundal">Fundal</option>
                  <option value="low-lying">Low-lying</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="input-doctor-notes" className="block text-[11px] font-medium text-slate-600 mb-1">Sonographer / Clinician Notes</label>
              <textarea
                id="input-doctor-notes"
                rows={2}
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500 font-sans"
                placeholder="Enter clinical observations, anatomical visibility, or Doppler impression..."
              />
            </div>
          </div>

          {/* Action Button: Ingest to Digital Twin */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              <span className="font-semibold text-slate-700 block">Commit to In-Memory & Audit Store</span>
              Appends this measurement to <strong className="text-teal-700">{currentPatient?.name}</strong>'s longitudinal twin and recalculates velocities.
            </div>

            <button
              id="btn-commit-live-scan"
              onClick={handleCommitToTwin}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isSubmitting ? 'Ingesting Scan...' : 'Ingest to Digital Twin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Column: Live Deterministic Radar & Real-Time Impact (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Real-time Delta & Velocity Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Live Trajectory Impact Preview</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Interval: +{deltas.deltaWeeks}w ({deltas.deltaDays}d)
              </span>
            </div>

            {/* Deltas Scorecard */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Δ Fluid (AFI)</span>
                <span className={`text-base font-bold font-mono ${
                  parseFloat(deltas.deltaAfi) < -2.0 ? 'text-rose-600' : parseFloat(deltas.deltaAfi) < 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {parseFloat(deltas.deltaAfi) >= 0 ? `+${deltas.deltaAfi}cm` : `${deltas.deltaAfi}cm`}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  {deltas.afiVelocity} cm/wk
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Δ Fetal Weight</span>
                <span className="text-base font-bold font-mono text-indigo-700">
                  {deltas.deltaEfw}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  +{deltas.efwVelocity} g/wk
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Δ Percentile</span>
                <span className={`text-base font-bold font-mono ${
                  parseFloat(deltas.deltaPct) < -10 ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {deltas.deltaPct}
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  {prospectiveVelocities.growthVelocity_percentilePerWeek} %ile/wk
                </span>
              </div>
            </div>

            {/* Instant Trajectory Radar Status */}
            <div className={`p-3.5 rounded-xl border flex flex-col space-y-2 ${
              prospectiveWhyNow.severity === 'critical'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : prospectiveWhyNow.severity === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    prospectiveWhyNow.severity === 'critical' ? 'text-rose-600' : prospectiveWhyNow.severity === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {prospectiveWhyNow.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-white/80 border">
                  {prospectiveWhyNow.severity}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {prospectiveWhyNow.summary}
              </p>
              <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-mono">
                <span>Predicted Trajectory Score:</span>
                <strong>{prospectiveScore.overallScore} / 100</strong>
              </div>
            </div>

            {/* Mini Live Preview Recharts Graph */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Live Trajectory Curve (AFI cm)
                </span>
                <span className="text-[10px] text-teal-600 font-medium">
                  Includes Pending Scan ({gestationalAgeWeeks}w)
                </span>
              </div>
              <div className="h-36 w-full bg-slate-50 rounded-lg p-2 border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ga" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 25]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#fff' }}
                    />
                    <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Oligo (5cm)', fill: '#ef4444', fontSize: 9 }} />
                    <ReferenceLine y={8.0} stroke="#f59e0b" strokeDasharray="2 2" />
                    <Line
                      type="monotone"
                      dataKey="afi"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0d9488' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={onNavigateToTwin}
                className="flex-1 px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition text-center"
              >
                View in Pregnancy Digital Twin →
              </button>
              <button
                onClick={onNavigateToCharts}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold border border-indigo-200 transition text-center"
              >
                Open Full Growth Charts →
              </button>
            </div>
          </div>

          {/* Caliper Reference Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Hadlock Biometry Formula Reference</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Standard clinical formula used in GE Voluson and Philips Epiq sonography workstations:
            </p>
            <div className="bg-slate-50 p-2.5 rounded font-mono text-[10px] text-slate-700 border border-slate-200 overflow-x-auto">
              Log10(EFW) = 1.3596 - 0.00386*(AC*FL) + 0.0064*(HC) + 0.0061*(BPD) + 0.0424*(AC) + 0.174*(FL)
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc pl-4">
              <li><strong>HC / BPD:</strong> Head Circumference & Biparietal Diameter in transverse transthalamic plane.</li>
              <li><strong>AC:</strong> Abdominal Circumference at junction of umbilical vein and portal sinus.</li>
              <li><strong>FL:</strong> Femur Length diaphysis excluding epiphyses.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* 4. Historical Longitudinal Visits Log for Selected Patient */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Longitudinal Ultrasound Visit History ({sortedVisits.length} Recorded Scans)
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of clinical ultrasound measurements ingested for {currentPatient?.name}.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Total Recorded:</span>
            <span className="font-bold text-teal-700 font-mono">{sortedVisits.length} visits</span>
          </div>
        </div>

        {sortedVisits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No scans recorded yet for this patient. Use the Live Input Studio form above to ingest the baseline ultrasound scan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5">Visit #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">GA</th>
                  <th className="p-2.5">AFI (cm)</th>
                  <th className="p-2.5">SDP (cm)</th>
                  <th className="p-2.5">EFW (g)</th>
                  <th className="p-2.5">Percentile</th>
                  <th className="p-2.5">Calipers (HC/AC/FL/BPD)</th>
                  <th className="p-2.5">Clinician Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedVisits.map((v, i) => (
                  <tr key={v.id || i} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-bold font-mono text-slate-700">
                      Visit {v.visitNumber || i + 1}
                    </td>
                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">{v.date}</td>
                    <td className="p-2.5 font-bold font-mono text-slate-900">
                      {v.gestationalAgeWeeks}w {v.gestationalAgeDays || 0}d
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className={`font-bold ${v.amnioticFluidIndex_cm < 5 ? 'text-rose-600' : v.amnioticFluidIndex_cm < 8 ? 'text-amber-600' : 'text-teal-700'}`}>
                        {v.amnioticFluidIndex_cm} cm
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{v.singleDeepestPocket_cm} cm</td>
                    <td className="p-2.5 font-mono font-bold text-indigo-700">{v.estimatedFetalWeight_g} g</td>
                    <td className="p-2.5 font-mono">
                      <span className={`font-bold ${v.growthPercentile < 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {v.growthPercentile}th
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-500">
                      {v.biometrics?.hc_mm || '—'} / {v.biometrics?.ac_mm || '—'} / {v.biometrics?.fl_mm || '—'} / {v.biometrics?.bpd_mm || '—'}
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {v.doctorReviewStatus || 'Accepted'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteVisit(v.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete scan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. New Patient Modal */}
      {isNewPatientModalOpen && (
        <NewPatientModal
          onClose={() => setIsNewPatientModalOpen(false)}
          onPatientCreated={(newPat) => {
            setIsNewPatientModalOpen(false);
            showToast(`Patient ${newPat.name} enrolled successfully!`);
            onVisitAdded(newPat.id);
            onSelectPatient(newPat.id);
          }}
          currentUser={currentUser}
        />
      )}

      {/* 5. System Ultrasound Upload Modal */}
      {isSystemUploadModalOpen && currentPatient && (
        <UltrasoundUploadModal
          patient={currentPatient}
          onClose={() => setIsSystemUploadModalOpen(false)}
          onExtractionSuccess={() => {
            showToast('Scan uploaded from system and ingested into patient record!');
            onVisitAdded(currentPatient.id);
          }}
          onSendToStudio={(extracted) => {
            handleApplyExtractedBiometrics(extracted);
            showToast('Extracted biometrics loaded into live sliders & Hadlock calculator!');
          }}
        />
      )}

      {/* 6. AI Ultrasound Screen Caliper OCR Modal */}
      {isAiOcrModalOpen && (
        <AiUltrasoundScreenOcrModal
          onClose={() => setIsAiOcrModalOpen(false)}
          onApplyExtractedData={(data) => {
            if (data.gestationalAgeWeeks) setGestationalAgeWeeks(data.gestationalAgeWeeks);
            if (data.gestationalAgeDays !== undefined) setGestationalAgeDays(data.gestationalAgeDays);
            if (data.hc_mm) setHc(Math.round(data.hc_mm));
            if (data.bpd_mm) setBpd(Math.round(data.bpd_mm));
            if (data.ac_mm) setAc(Math.round(data.ac_mm));
            if (data.fl_mm) setFl(Math.round(data.fl_mm));
            if (data.afi_cm) setAfi(parseFloat(data.afi_cm.toFixed(1)));
            if (data.sdp_cm) setSdp(parseFloat(data.sdp_cm.toFixed(1)));
            if (data.efw_g) setEfw(Math.round(data.efw_g));
            if (data.growthPercentile) setGrowthPercentile(Math.round(data.growthPercentile));
            if (data.fhr_bpm) setFhr(Math.round(data.fhr_bpm));
            if (data.umbilicalArteryPi) setUaPi(parseFloat(data.umbilicalArteryPi.toFixed(2)));
            if (data.middleCerebralArteryPi) setMcaPi(parseFloat(data.middleCerebralArteryPi.toFixed(2)));
            if (data.notes) setDoctorNotes(prev => `${prev}\n[AI Screen OCR]: ${data.notes}`);
            showToast('AI Ultrasound OCR Calipers & Velocities applied to live studio!');
          }}
        />
      )}

      {/* 7. ACOG / ISUOG Clinical Consultation Report Modal */}
      {isPrintModalOpen && (
        <ClinicalReportPrintModal
          twin={prospectiveTwin}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};

// Modal for Enrolling a New Patient Live
interface NewPatientModalProps {
  onClose: () => void;
  onPatientCreated: (p: Patient) => void;
  currentUser: User;
}

const NewPatientModal: React.FC<NewPatientModalProps> = ({ onClose, onPatientCreated, currentUser }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(29);
  const [maternalBmi, setMaternalBmi] = useState<number>(24.5);
  const [mrn, setMrn] = useState(`MRN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [gravidity, setGravidity] = useState<number>(2);
  const [parity, setParity] = useState<number>(1);
  const [currentGaWeeks, setCurrentGaWeeks] = useState<number>(24);
  const [currentGaDays, setCurrentGaDays] = useState<number>(0);
  const [lmp, setLmp] = useState<string>(new Date(Date.now() - 168 * 86400000).toISOString().split('T')[0]);
  const [edd, setEdd] = useState<string>(new Date(Date.now() + 112 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Enrolled via Live Ultrasound Studio.');
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const payload: any = {
        name,
        age,
        maternalBmi,
        mrn,
        gravidity,
        parity,
        currentGestationalAgeWeeks: currentGaWeeks,
        currentGestationalAgeDays: currentGaDays,
        lmp,
        edd,
        notes,
        assignedDoctorId: currentUser.id,
        assignedDoctorName: currentUser.name
      };

      if (includeBaseline) {
        payload.initialVisit = {
          gestationalAgeWeeks: currentGaWeeks,
          gestationalAgeDays: currentGaDays,
          estimatedFetalWeight_g: getExpected50thEfw(currentGaWeeks, currentGaDays),
          growthPercentile: 50,
          amnioticFluidIndex_cm: 12.5,
          singleDeepestPocket_cm: 4.6,
          fetalHeartRate_bpm: 144,
          biometrics: { hc_mm: 222, ac_mm: 198, fl_mm: 43, bpd_mm: 60 }
        };
      }

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create patient');
      const data = await res.json();
      onPatientCreated(data.patient);
    } catch (err: any) {
      alert(err.message || 'Error creating patient');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center border border-teal-200 text-teal-700">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enrol New Patient into Live Twin Stream</h3>
              <p className="text-[11px] text-slate-500">Establishes longitudinal pregnancy digital twin profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="modal-patient-name" className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
              <input
                id="modal-patient-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-mrn" className="block text-xs font-semibold text-slate-700 mb-1">MRN (Medical Record #)</label>
              <input
                id="modal-patient-mrn"
                type="text"
                value={mrn}
                onChange={e => setMrn(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-age" className="block text-xs font-semibold text-slate-700 mb-1">Maternal Age (years)</label>
              <input
                id="modal-patient-age"
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-bmi" className="block text-xs font-semibold text-slate-700 mb-1">Maternal BMI (kg/m²)</label>
              <input
                id="modal-patient-bmi"
                type="number"
                step="0.1"
                value={maternalBmi}
                onChange={e => setMaternalBmi(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-gravidity" className="block text-xs font-semibold text-slate-700 mb-1">Gravidity (G)</label>
              <input
                id="modal-patient-gravidity"
                type="number"
                min="1"
                value={gravidity}
                onChange={e => setGravidity(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-parity" className="block text-xs font-semibold text-slate-700 mb-1">Parity (P)</label>
              <input
                id="modal-patient-parity"
                type="number"
                min="0"
                value={parity}
                onChange={e => setParity(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-ga-weeks" className="block text-xs font-semibold text-slate-700 mb-1">Gestational Age (Weeks)</label>
              <input
                id="modal-patient-ga-weeks"
                type="number"
                min="18"
                max="41"
                value={currentGaWeeks}
                onChange={e => setCurrentGaWeeks(Number(e.target.value))}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor="modal-patient-edd" className="block text-xs font-semibold text-slate-700 mb-1">EDD (Estimated Delivery)</label>
              <input
                id="modal-patient-edd"
                type="date"
                value={edd}
                onChange={e => setEdd(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
            <input
              id="cb-baseline"
              type="checkbox"
              checked={includeBaseline}
              onChange={e => setIncludeBaseline(e.target.checked)}
              className="accent-teal-600 w-4 h-4 rounded"
            />
            <label htmlFor="cb-baseline" className="text-xs text-slate-700 font-medium cursor-pointer">
              Auto-generate baseline scan (Visit 1 at {currentGaWeeks}w) with normative Hadlock biometrics
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition"
            >
              {isSaving ? 'Creating Patient...' : 'Enrol Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

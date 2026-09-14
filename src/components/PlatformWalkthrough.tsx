/**
 * PregnancyTwin AI - Interactive Clinical Platform Walkthrough
 * Comprehensive, guided multi-track tour with interactive step execution,
 * evidence-based clinical pearls, keyboard shortcuts, and spotlight cues.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  Activity,
  Pill,
  Sliders,
  TrendingUp,
  Database,
  LineChart,
  Sparkles,
  Shield,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  BookOpen,
  Info,
  ArrowRight,
  Stethoscope,
  Clock,
  Layers,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AppTab } from './AppNavigation';
import { TwinSubPage } from './PregnancyTwinView';

export type TourMode = 'CLINICAL' | 'AI_SENSITIVITY' | 'EMERGENCY' | 'FULL';

export interface TourStepDefinition {
  id: string;
  stepNumber: number;
  title: string;
  category: string;
  tab: AppTab;
  subPage?: TwinSubPage;
  patientId?: string;
  icon: React.ElementType;
  description: string;
  clinicalPearl: {
    heading: string;
    text: string;
    citation: string;
  };
  keyTags: string[];
  interactiveActionLabel?: string;
  interactiveAction?: () => void;
  modes: TourMode[];
  badgeColor: string;
  contextCues?: {
    CLINICAL?: string;
    AI_SENSITIVITY?: string;
    EMERGENCY?: string;
    FULL?: string;
  };
}

interface PlatformWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AppTab) => void;
  onSelectPatient: (patientId: string) => void;
  onSetTwinSubPage?: (subPage: TwinSubPage) => void;
  onOpenCopilot: () => void;
  onCloseCopilot?: () => void;
  onOpenUpload: () => void;
  onOpenKnowledge: () => void;
  showToast: (message: string) => void;
}

// Gentle Web Audio synthesizer for unobtrusive clinical feedback
const playStepChime = (enabled: boolean) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (e) {
    // Audio contexts might be blocked until user gesture, safely ignore
  }
};

export const PlatformWalkthrough: React.FC<PlatformWalkthroughProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectPatient,
  onSetTwinSubPage,
  onOpenCopilot,
  onCloseCopilot,
  onOpenUpload,
  onOpenKnowledge,
  showToast
}) => {
  const [selectedMode, setSelectedMode] = useState<TourMode>('FULL');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPearlExpanded, setIsPearlExpanded] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [spotlightDimmer, setSpotlightDimmer] = useState<boolean>(false);
  const [dockPosition, setDockPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  // Master definition of all 9 clinical tour steps mapped to Clinical Core, Sensitivity Studio, and Emergency Response
  const allTourSteps: TourStepDefinition[] = [
    {
      id: 'step-dashboard',
      stepNumber: 1,
      title: 'Command Central & Longitudinal Triage',
      category: 'Triage Overview',
      tab: 'home',
      icon: Home,
      description:
        'PregnancyTwin AI shifts clinical monitoring from isolated ultrasound snapshots to continuous velocity trajectories. The central triage engine categorizes patients into High, Watch, and Low risk cohorts based on rates of biometrical change.',
      clinicalPearl: {
        heading: 'Overcoming Snapshot Diagnostic Blindspots',
        text: 'Standard static cutoff values miss over 40% of late-onset Fetal Growth Restriction (FGR). Continuous velocity tracking detects early deceleration weeks before abdominal circumference drops below the 10th percentile.',
        citation: 'ACOG Practice Bulletin No. 227 & SMFM Fetal Growth Restriction Guidance'
      },
      keyTags: ['Urgent Review Queue', 'Near-Term Deliveries', 'Quick-Summary Sidebar'],
      interactiveActionLabel: 'Inspect Patient Roster',
      interactiveAction: () => {
        onNavigateTab('home');
        showToast('Viewing Central Clinical Dashboard with high-risk priority queue.');
      },
      modes: ['FULL', 'CLINICAL', 'EMERGENCY'],
      badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      contextCues: {
        CLINICAL: '🩺 [Patient Monitoring Mode] Focus on the risk sorting queue. Notice how the velocity column highlights patients needing urgent scan schedules.',
        EMERGENCY: '🚨 [Alert Investigation Mode] Locate Amina Al-Mansoor flagged under "High Risk" due to acute trajectory decay. Prepare to open her twin.',
        FULL: '💡 [Comprehensive Tour Mode] This is your central dashboard. Start here to triage your overall patient list.'
      }
    },
    {
      id: 'step-digital-twin',
      stepNumber: 2,
      title: 'Patient Digital Twin & Velocity Deceleration',
      category: 'Longitudinal Twin',
      tab: 'clinical',
      subPage: 'overview',
      patientId: 'pat-002',
      icon: Activity,
      description:
        'Meet Amina Al-Mansoor (32w 2d). Her twin model tracks biometry across consecutive visits (GA 22w → 24w → 26w → 32w). Between 26w and 32w, her growth velocity dropped from the 45th to the 8th percentile, accompanied by an amniotic fluid drop to 1.8 cm.',
      clinicalPearl: {
        heading: 'Rate of Change (d(EFW)/dt) as an Early Biomarker',
        text: 'Fetal growth deceleration crossing two or more quartile bands is strongly correlated with placental vascular insufficiency and adverse perinatal outcomes, even when absolute weight temporarily stays above the 10th percentile cutoff.',
        citation: 'ISUOG Practice Guidelines: Diagnosis and Management of Small-for-Gestational-Age Fetuses'
      },
      keyTags: ['Hadlock Normatives', 'Velocity Flattening Alert', 'Amniotic SDP Drop'],
      interactiveActionLabel: 'Compare with Concordant Patient A',
      interactiveAction: () => {
        onSelectPatient('pat-001');
        showToast('Switched to Patient A (Elena Rostova): Demonstrating normal longitudinal concordance.');
      },
      modes: ['FULL', 'CLINICAL', 'AI_SENSITIVITY', 'EMERGENCY'],
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      contextCues: {
        CLINICAL: '🩺 [Patient Monitoring Mode] Compare Amina\'s static EFW (currently 8th percentile) against her prior trajectory (45th percentile). This is severe deceleration.',
        AI_SENSITIVITY: '🧪 [Sensitivity Studio Mode] Observe how the Hadlock percentile curves bend downward. This acts as the baseline for counterfactual simulations.',
        EMERGENCY: '🚨 [Alert Investigation Mode] Inspect the red alert badge. The severe dip in both SDP and EFW velocity indicates a state of immediate placental insufficiency.',
        FULL: '💡 [Comprehensive Tour Mode] The Pregnancy Digital Twin consolidates multi-visit sonographic parameters into a single continuous visualization.'
      }
    },
    {
      id: 'step-medications',
      stepNumber: 3,
      title: 'Maternal Pharmacotherapy & Exposure Timeline',
      category: 'Medication Analytics',
      tab: 'clinical',
      subPage: 'medications',
      patientId: 'pat-002',
      icon: Pill,
      description:
        'Maternal therapeutic exposures exert critical, time-dependent effects on maternal vascular resistance and fetal perfusion. This timeline maps maternal regimens (Low-Dose Aspirin, Nifedipine, Betamethasone) across Gestational Weeks 12–40 with dose intensity encoding.',
      clinicalPearl: {
        heading: 'Chronological Windows of Pharmacological Efficacy',
        text: 'Aspirin initiation prior to 16 weeks of gestation significantly attenuates preeclampsia and placental insufficiency risk, whereas late initiation after 28 weeks demonstrates negligible vascular remodeling effect.',
        citation: 'US Preventive Services Task Force (USPSTF) Aspirin Guidance'
      },
      keyTags: ['Weeks 12-40 Timeline', 'Dose Intensity Chips', 'Pinned Regimen Inspector'],
      interactiveActionLabel: 'Inspect Active Regimens',
      interactiveAction: () => {
        onNavigateTab('clinical');
        if (onSetTwinSubPage) onSetTwinSubPage('medications');
        showToast('Viewing Multi-Regimen Timeline for Amina Al-Mansoor.');
      },
      modes: ['FULL', 'CLINICAL'],
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      contextCues: {
        CLINICAL: '🩺 [Patient Monitoring Mode] Review the exposure timing of Betamethasone. Ensure administration aligns with optimal gestational weeks for fetal lung maturity.',
        FULL: '💡 [Comprehensive Tour Mode] Track exact medication onset, dose adjustments, and overlap intervals alongside biometric progress.'
      }
    },
    {
      id: 'step-simulation',
      stepNumber: 4,
      title: 'Counterfactual "What-If" Intervention Simulator',
      category: 'Simulation Engine',
      tab: 'clinical',
      subPage: 'analytics',
      patientId: 'pat-002',
      icon: Sliders,
      description:
        'Simulate clinical outcomes before writing prescriptions! Adjust the "Intervention GA" slider (e.g., intervening at 24w vs 28w) and modulate therapeutic intensity to project counterfactual growth curves and amniotic volume recovery in real time.',
      clinicalPearl: {
        heading: 'In-Silico Counterfactual Trajectory Modeling',
        text: 'Dynamic simulation models quantify expected weight delta (+/- grams) and amniotic fluid index stabilization, helping multidisciplinary teams optimize the therapeutic window.',
        citation: 'Society for Maternal-Fetal Medicine (SMFM) Consult Series'
      },
      keyTags: ['Counterfactual Forecasting', 'Intervention GA Slider', 'Projected EFW Delta'],
      interactiveActionLabel: 'Scroll to Simulator Controls',
      interactiveAction: () => {
        onNavigateTab('clinical');
        if (onSetTwinSubPage) onSetTwinSubPage('analytics');
        showToast('Navigated to What-If Intervention Simulator.');
      },
      modes: ['FULL', 'AI_SENSITIVITY'],
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      contextCues: {
        AI_SENSITIVITY: '🧪 [Sensitivity Studio Mode] Use the sliders below to simulate a hypothetical 24-week intervention. Observe the projected improvement in Hadlock percentile growth trajectory.',
        FULL: '💡 [Comprehensive Tour Mode] The counterfactual simulator uses SHAP methodologies to forecast the effect of clinical timing on fetal outcome.'
      }
    },
    {
      id: 'step-association',
      stepNumber: 5,
      title: 'Association Insight & D3 Correlation Matrix',
      category: 'D3 Multi-Biometrics',
      tab: 'clinical',
      subPage: 'analytics',
      patientId: 'pat-002',
      icon: LineChart,
      description:
        'Obstetric parameters interact dynamically. The Association Insight Panel uses interactive D3 regression modeling to plot amniotic fluid index (SDP) vs Estimated Fetal Weight (EFW) percentiles, with overlay chips denoting maternal drug timing windows.',
      clinicalPearl: {
        heading: 'Fetal Fluid-Weight Coupling',
        text: 'A positive linear correlation between SDP and EFW velocity deceleration reflects compromised fetal renal perfusion secondary to placental redistribution in severe growth restriction.',
        citation: 'American Journal of Obstetrics & Gynecology (AJOG) Longitudinal Studies'
      },
      keyTags: ['D3 Scatter & Trendlines', 'Pearson & Spearman Coefficients', 'Medication Windows'],
      interactiveActionLabel: 'Highlight Correlation Panel',
      interactiveAction: () => {
        onNavigateTab('clinical');
        if (onSetTwinSubPage) onSetTwinSubPage('analytics');
        showToast('Viewing D3 Multi-Biometric Association Analysis.');
      },
      modes: ['FULL', 'AI_SENSITIVITY'],
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      contextCues: {
        AI_SENSITIVITY: '🧪 [Sensitivity Studio Mode] Examine the D3 scatter plot. Notice the direct positive correlation between estimated fetal weight and amniotic fluid volume shifts.',
        FULL: '💡 [Comprehensive Tour Mode] Analyze linear relationships and regression lines across all biometric measurements with Pearson correlations.'
      }
    },
    {
      id: 'step-live-input',
      stepNumber: 6,
      title: 'Live Ultrasound Ingestion & Automated Biometry',
      category: 'Ultrasound Studio',
      tab: 'live-input',
      icon: Database,
      description:
        'Rapidly ingest ultrasound scans into the digital twin. Sonographers can type biometric parameters (BPD, HC, AC, FL) or upload ultrasound DICOM images. The system instantly evaluates Hadlock formulas and appends new points to the trajectory.',
      clinicalPearl: {
        heading: 'Hadlock 4-Parameter Regression Formula',
        text: 'Log10(EFW) = 1.3596 - 0.00386(AC*FL) + 0.0064(HC) + 0.00061(BPD*AC) + 0.0424(AC) + 0.174(FL). Automated calculation prevents manual transcription errors and provides instant percentile feedback.',
        citation: 'Hadlock FP et al. Estimation of fetal weight using biometry, Am J Obstet Gynecol'
      },
      keyTags: ['DICOM Image Ingestion', 'Instant Hadlock Calculation', 'Offline Sync Queue'],
      interactiveActionLabel: 'Open Ultrasound Upload Modal',
      interactiveAction: () => {
        onOpenUpload();
        showToast('Opened Ultrasound Scan Ingestion Modal.');
      },
      modes: ['FULL', 'CLINICAL'],
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      contextCues: {
        CLINICAL: '🩺 [Patient Monitoring Mode] Click "Open Ultrasound" to see how raw sonographic biometry automatically updates formulas without manual transcribing.',
        FULL: '💡 [Comprehensive Tour Mode] Enter new biometric metrics or upload scans to append new coordinates onto the patient trajectory curve instantly.'
      }
    },
    {
      id: 'step-analytics',
      stepNumber: 7,
      title: 'Population Trajectory Analytics & Cohorts',
      category: 'Cohort Distribution',
      tab: 'analytics',
      patientId: 'pat-002',
      icon: TrendingUp,
      description:
        'Zoom out from single twins to cohort-wide distributions. Analyze population percentiles (3rd, 10th, 50th, 90th, 97th) and assess systematic velocity shifts across patient demographics and gestational age cohorts.',
      clinicalPearl: {
        heading: 'Institutional Benchmarking & Outlier Detection',
        text: 'Population curves reveal cohort skewing, providing early detection of regional nutritional or environmental factors that influence gestational growth patterns.',
        citation: 'World Health Organization (WHO) Fetal Growth Charts'
      },
      keyTags: ['Percentile Distribution Curves', 'Risk Stratification', 'Cohort Velocity Gradients'],
      interactiveActionLabel: 'Explore Population Curves',
      interactiveAction: () => {
        onNavigateTab('analytics');
        showToast('Switched to Population Growth Trajectory Analytics.');
      },
      modes: ['FULL', 'AI_SENSITIVITY'],
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      contextCues: {
        AI_SENSITIVITY: '🧪 [Sensitivity Studio Mode] Benchmark individual patient velocities against the broader WHO/Hadlock cohort population curves.',
        FULL: '💡 [Comprehensive Tour Mode] View population percentiles to evaluate how this patient matches regional or institutional distributions.'
      }
    },
    {
      id: 'step-copilot',
      stepNumber: 8,
      title: 'AI Clinical Copilot & Evidence Synthesis',
      category: 'AI Decision Support',
      tab: 'clinical',
      subPage: 'overview',
      patientId: 'pat-002',
      icon: Sparkles,
      description:
        'The multimodal AI Decision Support Copilot ingests the entire longitudinal twin: biometrics, Doppler parameters, and medication history. It synthesizes findings against clinical protocols to recommend scan intervals and delivery timing.',
      clinicalPearl: {
        heading: 'Augmented Decision Support, Not Autonomous Prescribing',
        text: 'All AI-generated recommendations are supported by transparent reasoning and protocol citations, preserving doctor-in-the-loop oversight for all clinical decisions.',
        citation: 'ACOG Committee Opinion: Ethical Considerations in Clinical Artificial Intelligence'
      },
      keyTags: ['Multimodal Trajectory Reasoning', 'ACOG / SMFM Guideline Citations', 'Doctor-in-the-Loop'],
      interactiveActionLabel: 'Open AI Copilot Drawer',
      interactiveAction: () => {
        onOpenCopilot();
        showToast('Opened AI Clinical Copilot Decision Support Drawer.');
      },
      modes: ['FULL', 'EMERGENCY'],
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      contextCues: {
        EMERGENCY: '🚨 [Alert Investigation Mode] Click the Copilot button. Query Gemini for clinical protocols regarding imminent delivery timing for late-onset FGR.',
        FULL: '💡 [Comprehensive Tour Mode] Use the conversational side drawer to query peer-reviewed obstetrics guidelines customized to this digital twin.'
      }
    },
    {
      id: 'step-security',
      stepNumber: 9,
      title: 'Security, Cryptography & HIPAA Governance',
      category: 'HIPAA & Governance',
      tab: 'admin',
      icon: Shield,
      description:
        'Maternal and fetal health records demand ironclad privacy. Explore our live security posture: active TLS 1.3 cryptographic handshakes, AES-256 patient data encryption, immutable audit trails, and role-based access control (RBAC).',
      clinicalPearl: {
        heading: 'Zero-Trust Clinical Security Architecture',
        text: 'Strict separation of duty ensures clinicians only access authorized patient rosters, while every automated calculation and AI consultation is logged for clinical governance.',
        citation: 'HIPAA Security Rule (45 CFR Part 160 and Part 164)'
      },
      keyTags: ['TLS 1.3 Cryptography', 'AES-256 Record Encryption', 'Immutable Audit Trails'],
      interactiveActionLabel: 'View Security Posture Logs',
      interactiveAction: () => {
        if (onCloseCopilot) onCloseCopilot();
        onNavigateTab('admin');
        showToast('Viewing Security Posture & HIPAA Governance Audit Log.');
      },
      modes: ['FULL', 'EMERGENCY'],
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      contextCues: {
        EMERGENCY: '🚨 [Alert Investigation Mode] Verify that all escalated clinical decisions are recorded in the immutable audit trail for full compliance.',
        FULL: '💡 [Comprehensive Tour Mode] Monitor real-time cipher suites, API token authentications, and the active database session status log.'
      }
    }
  ];

  // Filter steps according to the active mode
  const currentSteps = allTourSteps.filter((step) => step.modes.includes(selectedMode));
  const currentStep = currentSteps[currentStepIndex] || currentSteps[0];
  const progressPercent = Math.round(((currentStepIndex + 1) / currentSteps.length) * 100);

  // Apply step actions whenever currentStep changes
  const applyStepNavigation = useCallback(
    (step: TourStepDefinition) => {
      onNavigateTab(step.tab);
      if (step.patientId) {
        onSelectPatient(step.patientId);
      }
      if (step.subPage && onSetTwinSubPage) {
        onSetTwinSubPage(step.subPage);
      }
      if (step.id === 'step-copilot') {
        onOpenCopilot();
      } else if (onCloseCopilot) {
        onCloseCopilot();
      }
    },
    [onNavigateTab, onSelectPatient, onSetTwinSubPage, onOpenCopilot, onCloseCopilot]
  );

  // Step progression handlers
  const handleNext = useCallback(() => {
    if (currentStepIndex < currentSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      applyStepNavigation(currentSteps[nextIndex]);
      playStepChime(soundEnabled);
    } else {
      onClose();
      showToast('Platform Walkthrough completed! You are ready to explore PregnancyTwin AI.');
    }
  }, [currentStepIndex, currentSteps, applyStepNavigation, soundEnabled, onClose, showToast]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      applyStepNavigation(currentSteps[prevIndex]);
      playStepChime(soundEnabled);
    }
  }, [currentStepIndex, currentSteps, applyStepNavigation, soundEnabled]);

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    applyStepNavigation(currentSteps[index]);
    playStepChime(soundEnabled);
  };

  const handleModeChange = (mode: TourMode) => {
    setSelectedMode(mode);
    setCurrentStepIndex(0);
    const newSteps = allTourSteps.filter((s) => s.modes.includes(mode));
    if (newSteps.length > 0) {
      applyStepNavigation(newSteps[0]);
    }
    const trackNames = {
      CLINICAL: 'Clinical Core (Patient Monitoring)',
      AI_SENSITIVITY: 'AI Sensitivity Studio (Analytics & Modeling)',
      EMERGENCY: 'Emergency Response (Alert Investigation)',
      FULL: 'Comprehensive Tour'
    };
    showToast(`Switched to ${trackNames[mode]} track.`);
  };

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === 'm') {
        setIsMinimized((prev) => !prev);
      } else if (e.key.toLowerCase() === 's') {
        setSoundEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Initial trigger when tour opens
  useEffect(() => {
    if (isOpen && currentStep) {
      applyStepNavigation(currentStep);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;

  return (
    <>
      {/* Optional Focus Spotlight Dimmer (non-blocking if toggled) */}
      {spotlightDimmer && !isMinimized && (
        <div
          onClick={() => setSpotlightDimmer(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40 transition-opacity duration-300 pointer-events-auto"
          title="Click backdrop to dismiss focus dimmer"
        />
      )}

      {/* Minimized Dock Bar */}
      {isMinimized ? (
        <div
          className={`fixed ${
            dockPosition === 'bottom-right' ? 'bottom-5 right-5' : 'bottom-5 left-5'
          } z-50 bg-slate-900/95 border border-teal-500/40 text-white rounded-2xl shadow-2xl p-2.5 flex items-center space-x-3 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ring-1 ring-teal-500/20`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600/90 flex items-center justify-center text-white">
              <StepIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-teal-400">
                  Tour Active ({currentStepIndex + 1}/{currentSteps.length})
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{progressPercent}%</span>
              </div>
              <div className="text-xs font-bold text-slate-100 max-w-[180px] truncate">
                {currentStep.title}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
              title="Previous Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white"
              title="Next Step"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400"
              title="Expand Walkthrough Card"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
              title="Exit Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Walkthrough Dialog Card */
        <div
          className={`fixed ${
            dockPosition === 'bottom-right' ? 'bottom-5 right-5' : 'bottom-5 left-5'
          } z-50 w-[94vw] sm:w-[480px] bg-slate-900 border border-slate-700/80 text-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10`}
          role="dialog"
          aria-label="Platform Guided Tour"
        >
          {/* Top Rainbow/Teal Progress Indicator */}
          <div className="h-1.5 bg-slate-800 w-full relative">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Header Bar */}
          <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
                <StepIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                    Platform Walkthrough
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentStep.badgeColor}`}>
                    {currentStep.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Step {currentStepIndex + 1} of {currentSteps.length} • {progressPercent}% Completed
                </div>
              </div>
            </div>

            {/* Header Utility Controls */}
            <div className="flex items-center space-x-1 text-slate-400">
              {/* Sound toggle */}
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  showToast(soundEnabled ? 'Audio chime muted' : 'Audio chime active');
                }}
                className={`p-1.5 rounded-lg hover:text-white transition-colors ${
                  soundEnabled ? 'text-teal-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800'
                }`}
                title={soundEnabled ? 'Sound: Active (Press S to mute)' : 'Sound: Muted (Press S to unmute)'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Spotlight Dimmer toggle */}
              <button
                onClick={() => setSpotlightDimmer(!spotlightDimmer)}
                className={`p-1.5 rounded-lg hover:text-white transition-colors ${
                  spotlightDimmer ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'hover:bg-slate-800'
                }`}
                title="Toggle Focus Spotlight Dimmer"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              {/* Dock Position Switcher */}
              <button
                onClick={() =>
                  setDockPosition(dockPosition === 'bottom-right' ? 'bottom-left' : 'bottom-right')
                }
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-[10px] font-bold font-mono"
                title={`Docked to ${dockPosition}. Click to switch.`}
              >
                {dockPosition === 'bottom-right' ? '⚓ R' : '⚓ L'}
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                title="Minimize Tour (Press M)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {/* Exit */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition-colors"
                title="Close Tour (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tour Track Selector Tabs */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-1.5 text-[11px] shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tour Track Selection</span>
              <span className="text-[10px] text-teal-450 font-mono font-bold bg-teal-950/40 px-1.5 py-0.2 rounded border border-teal-800">
                {selectedMode === 'FULL' ? 'Comprehensive' : selectedMode === 'CLINICAL' ? 'Clinical Core' : selectedMode === 'AI_SENSITIVITY' ? 'AI Sensitivity Studio' : 'Emergency Response'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => handleModeChange('FULL')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                  selectedMode === 'FULL'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                Comprehensive (9)
              </button>
              <button
                onClick={() => handleModeChange('CLINICAL')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                  selectedMode === 'CLINICAL'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                Clinical Core (4)
              </button>
              <button
                onClick={() => handleModeChange('AI_SENSITIVITY')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                  selectedMode === 'AI_SENSITIVITY'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                Sensitivity Studio (4)
              </button>
              <button
                onClick={() => handleModeChange('EMERGENCY')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                  selectedMode === 'EMERGENCY'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                Emergency Response (4)
              </button>
            </div>
          </div>

          {/* Main Content Body */}
          <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
            {/* Step Title & Key Badges */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <span className="text-teal-400 font-mono">{currentStepIndex + 1}.</span>
                  <span>{currentStep.title}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {currentStep.description}
              </p>
            </div>

            {/* Dynamic Context-Specific Navigation Cue */}
            {currentStep.contextCues && (
              <div className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed font-semibold transition-all ${
                selectedMode === 'CLINICAL' 
                  ? 'bg-teal-950/30 border-teal-500/25 text-teal-200'
                  : selectedMode === 'AI_SENSITIVITY'
                  ? 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                  : selectedMode === 'EMERGENCY'
                  ? 'bg-rose-950/35 border-rose-500/25 text-rose-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300'
              }`}>
                {currentStep.contextCues[selectedMode] || currentStep.contextCues.FULL || currentStep.description}
              </div>
            )}

            {/* Feature Highlight Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {currentStep.keyTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] text-teal-300 font-medium"
                >
                  <span className="w-1 h-1 rounded-full bg-teal-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Interactive Contextual Action Trigger */}
            {currentStep.interactiveAction && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-medium">Contextual Demonstration:</span>
                </div>
                <button
                  onClick={() => currentStep.interactiveAction?.()}
                  className="px-2.5 py-1 rounded-lg bg-teal-600/90 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                >
                  <span>{currentStep.interactiveActionLabel || 'Try This View'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Expandable Clinical Pearl Accordion */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden text-xs">
              <button
                onClick={() => setIsPearlExpanded(!isPearlExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer text-slate-300"
              >
                <div className="flex items-center space-x-2 text-[11px] font-bold text-teal-400">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Clinical Pearl & Evidence Rationale</span>
                </div>
                {isPearlExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isPearlExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 text-[11px] text-slate-300 border-t border-slate-800/80 animate-in fade-in duration-150">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <span>{currentStep.clinicalPearl.heading}</span>
                  </h5>
                  <p className="leading-relaxed text-slate-300 font-normal">
                    {currentStep.clinicalPearl.text}
                  </p>
                  <div className="pt-1 text-[10px] text-teal-400/90 font-mono italic flex items-center gap-1">
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate">{currentStep.clinicalPearl.citation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clickable Step Progression Breadcrumbs */}
          <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 py-0.5 shrink-0 max-w-[300px] overflow-x-hidden">
              {currentSteps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleJumpToStep(idx)}
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-teal-400 text-slate-950 ring-2 ring-teal-300 scale-105 shadow-xs'
                        : isPast
                        ? 'bg-teal-950/40 text-teal-400 border border-teal-500/30 hover:bg-teal-900/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={`${idx + 1}. ${step.title}`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>~{Math.max(1, Math.round((currentSteps.length - currentStepIndex) * 0.4))}m left</span>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer px-1.5 py-1"
              >
                Skip Tour
              </button>
              <button
                onClick={() => {
                  handleJumpToStep(0);
                  showToast('Walkthrough restarted from Step 1.');
                }}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                title="Restart Tour from Step 1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Back & Next / Finish Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center space-x-1.5 py-1.5 px-4 bg-teal-600 hover:bg-teal-500 text-[11px] font-bold text-white rounded-lg transition-all shadow-md hover:shadow-teal-500/20 cursor-pointer"
              >
                <span>
                  {currentStepIndex === currentSteps.length - 1 ? 'Finish Tour' : 'Next Step'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

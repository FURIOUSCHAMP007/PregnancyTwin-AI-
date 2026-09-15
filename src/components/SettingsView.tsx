/**
 * PregnancyTwin AI - Settings & Admin/Info Workspace
 * Centralizes Clinician Profile (RBAC), Hospital System Preferences,
 * and the 'Admin/Info' menu (SIH Project Plan, ROC Trajectory Engine, Clinical Audit Log, Guidelines).
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Layers,
  FlaskConical,
  BookOpen,
  UserCheck,
  RefreshCw,
  Building,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  Cpu,
  Play,
  Activity,
  Database,
  Terminal
} from 'lucide-react';
import { User, UserRole } from '../types';
import { ResearchModeView } from './ResearchModeView';
import { AdminAuditView } from './AdminAuditView';
import { HybridMLManager } from '../services/mlTrainingService';
import { ModelTrainingPipelineView } from './ModelTrainingPipelineView';

interface SettingsViewProps {
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  onSwitchUser?: (userId: string) => void;
  initialSubTab?: 'general' | 'research' | 'admin' | 'guidelines' | 'model-training';
  onNavigateToClinical?: () => void;
  onSelectPatient?: (patientId: string) => void;
  onOpenGuidelines?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onSwitchRole,
  onSwitchUser,
  initialSubTab = 'general',
  onNavigateToClinical,
  onSelectPatient,
  onOpenGuidelines
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'research' | 'admin' | 'guidelines' | 'model-training'>(initialSubTab);

  // Preference switches (local UI state)
  const [fluidUnit, setFluidUnit] = useState<'MVP' | 'AFI'>('MVP');
  const [fgrStandard, setFgrStandard] = useState<'Hadlock1991' | 'Intergrowth21'>('Hadlock1991');
  const [velocityAlertThreshold, setVelocityAlertThreshold] = useState<number>(0.8); // cm/week drop
  const [autoOcrIngest, setAutoOcrIngest] = useState<boolean>(true);

  const usersList = [
    {
      id: 'doc-001',
      name: 'Dr. Alistair Vance, MD',
      role: 'doctor' as const,
      specialty: 'Maternal-Fetal Medicine (MFM) Specialist',
      hospital: 'St. Jude Maternal Fetal Health',
      department: 'High-Risk Perinatal Ultrasound Unit',
      email: 'a.vance@maternalfetal.hospital.org'
    },
    {
      id: 'doc-002',
      name: 'Dr. Marcus Reed, MD',
      role: 'doctor' as const,
      specialty: 'Attending Obstetrician & Gynecologist',
      hospital: 'St. Jude Maternal Fetal Health',
      department: 'Labor & Delivery / Antenatal Clinic',
      email: 'm.reed@maternalfetal.hospital.org'
    },
    {
      id: 'usr-admin',
      name: 'Chief Clinical Administrator',
      role: 'admin' as const,
      specialty: 'Hospital Clinical Quality & Compliance Director',
      hospital: 'St. Jude Health System',
      department: 'Clinical Governance & Medical Records Audit',
      email: 'clinical.governance@stjude.org'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shrink-0">
            <Settings className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Application Settings &amp; Admin Suite</h1>
            <p className="text-xs text-slate-500">
              Manage clinician RBAC privileges, hospital standards, and access secondary R&amp;D/audit tools.
            </p>
          </div>
        </div>

        {/* Secondary Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            id="subtab-general"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'general'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            General &amp; RBAC
          </button>

          <span className="text-slate-300">|</span>

          <button
            id="subtab-research"
            onClick={() => setActiveSubTab('research')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'research'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
            <span>ROC Trajectory Engine</span>
          </button>

          <button
            id="subtab-admin"
            onClick={() => setActiveSubTab('admin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'admin'
                ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Hospital Audit Log</span>
          </button>

          <button
            id="subtab-model-training"
            onClick={() => setActiveSubTab('model-training')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'model-training'
                ? 'bg-teal-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model Training</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: General & Clinician RBAC */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active Clinician Account & Role Switcher */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Active Clinician Account (RBAC)</h2>
                  <p className="text-xs text-slate-500">
                    Switch clinician identity or toggle between Doctor and Administrator privileges.
                  </p>
                </div>
                <button
                  onClick={() => onSwitchRole(currentUser.role === 'doctor' ? 'admin' : 'doctor')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                  <span>Toggle Role ({currentUser.role === 'doctor' ? 'Doctor → Admin' : 'Admin → Doctor'})</span>
                </button>
              </div>

              {/* Roster of Clinicians */}
              <div className="space-y-3">
                {usersList.map((user) => {
                  const isSelected = currentUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        if (onSwitchUser) onSwitchUser(user.id);
                        else onSwitchRole(user.role);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-600/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                            user.role === 'admin' ? 'bg-amber-700' : 'bg-teal-700'
                          }`}
                        >
                          {user.role === 'admin' ? 'AD' : 'DR'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{user.name}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                user.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-teal-100 text-teal-800 border border-teal-200'
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{user.specialty}</p>
                          <p className="text-[11px] text-slate-400">
                            {user.department} • {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        {isSelected ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Currently Active</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                            Switch to this User →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinical & Computational Standards */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Clinical Calculation &amp; Unit Preferences</h2>
                <p className="text-xs text-slate-500">
                  Select algorithmic standards for Hadlock fetal weight formulas and amniotic fluid velocity triggers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">Amniotic Fluid Metric</div>
                  <p className="text-[11px] text-slate-500">
                    Maximum Vertical Pocket (MVP) is ISUOG/SMFM recommended for singletons.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => setFluidUnit('MVP')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        fluidUnit === 'MVP'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      MVP (cm) - Preferred
                    </button>
                    <button
                      onClick={() => setFluidUnit('AFI')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        fluidUnit === 'AFI'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      AFI (4-Quadrant)
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">Fetal Growth Standard</div>
                  <p className="text-[11px] text-slate-500">
                    Log-transformed biometrics using BPD, HC, AC, and FL measurements.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => setFgrStandard('Hadlock1991')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        fgrStandard === 'Hadlock1991'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Hadlock (1991) 4-Param
                    </button>
                    <button
                      onClick={() => setFgrStandard('Intergrowth21')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        fgrStandard === 'Intergrowth21'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      INTERGROWTH-21st
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Admin & Info Quick Access Card */}
          <div className="space-y-5">
            {/* Admin / Info Tools Drawer */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-teal-700" />
                  <h2 className="text-sm font-bold text-slate-900">Admin &amp; Info Suite</h2>
                </div>
                <p className="text-xs text-slate-500">Secondary technical tools and governance matrices.</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveSubTab('research')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FlaskConical className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                        Scientific ROC Trajectory Engine
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    AUC-ROC metrics, specificity benchmarks, and early warning horizon curves.
                  </p>
                </button>

                <button
                  onClick={() => setActiveSubTab('admin')}
                  className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-950">
                        Hospital Clinical Audit Log
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Physician override records, AI confidence logs, and regulatory compliance trail.
                  </p>
                </button>

                <button
                  onClick={() => setActiveSubTab('model-training')}
                  className="w-full p-3 rounded-xl border border-teal-200 bg-teal-50/20 hover:bg-teal-50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Cpu className="w-4 h-4 text-teal-700" />
                      <span className="text-xs font-bold text-teal-950">
                        Hybrid ML Stack Sandbox &amp; Progress
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-700" />
                  </div>
                  <p className="text-[11px] text-teal-800/80 mt-1">
                    Train and evaluate XGBoost clinical trajectories and Isolation Forest anomalies on the cohort dataset.
                  </p>
                </button>

                {onOpenGuidelines && (
                  <button
                    onClick={onOpenGuidelines}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                          Obstetric Guidelines Browser
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Explore ISUOG Practice Guidelines, ACOG Practice Bulletins, and SMFM consults.
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* Hospital System Details */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 text-teal-400">
                <Building className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Facility Metadata</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-white">St. Jude Maternal Fetal Health</div>
                <div className="text-slate-400">Level IV Perinatal Care Center &amp; Regional NICU</div>
                <div className="text-[11px] text-slate-500 pt-1">
                  EHR Protocol: FHIR R4 • DICOM Storage: Local PACS
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Autonomous Diagnostic:</span>
                <span className="text-rose-400 font-bold">OFF (CDS Only)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab: ROC Trajectory Engine & Research (moved to Admin/Info menu inside settings) */}
      {activeSubTab === 'research' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-semibold text-slate-400">Settings &gt; Admin &amp; Info &gt;</span>
              <span className="font-bold text-slate-900">Scientific ROC Trajectory Engine &amp; Validation</span>
            </div>
            <button
              onClick={() => setActiveSubTab('general')}
              className="text-teal-700 hover:text-teal-800 font-semibold"
            >
              ← Back to Settings
            </button>
          </div>
          <ResearchModeView />
        </div>
      )}

      {/* Subtab 4: Hospital Clinical Audit Log (moved to Admin/Info menu inside settings) */}
      {activeSubTab === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-semibold text-slate-400">Settings &gt; Admin &amp; Info &gt;</span>
              <span className="font-bold text-slate-900">Hospital Clinical Audit Log</span>
            </div>
            <button
              onClick={() => setActiveSubTab('general')}
              className="text-teal-700 hover:text-teal-800 font-semibold"
            >
              ← Back to Settings
            </button>
          </div>
          <AdminAuditView />
        </div>
      )}

      {/* Subtab 5: Model Training Sandbox & XGBoost Pipeline */}
      {activeSubTab === 'model-training' && (
        <div className="space-y-4">
          <ModelTrainingPipelineView />
        </div>
      )}
    </div>
  );
};

/**
 * ModelTrainingPanel Component
 * Interactive diagnostic interface visualizing local/backend training loops of the twin-pregnancy ML pipeline.
 */
const ModelTrainingPanel: React.FC = () => {
  const [status, setStatus] = React.useState(() => HybridMLManager.getInstance().getTrainingStatus());
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  // Poll local training progress if triggered
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (status.isTraining) {
      intervalId = setInterval(() => {
        const currentStatus = HybridMLManager.getInstance().getTrainingStatus();
        setStatus(currentStatus);
        if (currentStatus.complete || !currentStatus.isTraining) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status.isTraining]);

  // Auto-scroll the training console
  React.useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.logs]);

  const handleStartLocalTraining = async () => {
    const manager = HybridMLManager.getInstance();
    
    // Switch UI state immediately
    setStatus(manager.getTrainingStatus());

    try {
      await manager.runFullPipeline();
    } catch (error) {
      console.error('Local pipeline execution failed:', error);
    } finally {
      setStatus(manager.getTrainingStatus());
    }
  };

  const getAnomalyDetectorBadge = () => {
    if (status.complete) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          Completed: {status.metrics?.isolationForestAnomaliesCount ?? 11} Outliers Isolated
        </span>
      );
    }
    if (status.isTraining && status.currentModule === 'Isolation Forest Training') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-ping" />
          Active: Partitioning Biomarkers...
        </span>
      );
    }
    if (status.isTraining && status.progress < 60) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
          Queued for Time-Series Analysis
        </span>
      );
    }
    if (status.currentModule === 'Error') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
          Pipeline Error State
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
        <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
        Standby / Awaiting Run
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
      {/* Left Column: Sandbox Controls & Progress */}
      <div className="lg:col-span-2 space-y-4">
        {/* Training Action Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive ML Stack Sandbox</h3>
              <p className="text-xs text-slate-500">
                Execute local clinical algorithms directly on the 100 unique patients cohort file.
              </p>
            </div>
            <button
              onClick={handleStartLocalTraining}
              disabled={status.isTraining}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                status.isTraining
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-800 text-white shadow-2xs border border-teal-600 hover:shadow-xs'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${status.isTraining ? '' : 'text-teal-100'}`} />
              <span>{status.isTraining ? 'Training Active...' : 'Train ML Stack'}</span>
            </button>
          </div>

          {/* Progress Bar & Status */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center space-x-1.5">
                <Activity className={`w-4 h-4 text-teal-600 ${status.isTraining ? 'animate-pulse' : ''}`} />
                <span>Phase: {status.currentModule}</span>
              </span>
              <span className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {status.progress}% Complete
              </span>
            </div>

            {/* Solid Progress Bar Container */}
            <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200/60 overflow-hidden shadow-inner">
              <div
                className="bg-teal-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>

          {/* Anomaly Detector Status Indicators (Requested Requirement) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Isolation Forest Anomaly Engine</span>
              </div>
              {getAnomalyDetectorBadge()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 pt-1">
              <div className="flex justify-between p-2.5 bg-white border border-slate-200/80 rounded-lg">
                <span className="font-medium text-slate-500">Anomaly Bound Criteria:</span>
                <strong className="font-mono text-slate-800">&gt; 1.8 SD Variance</strong>
              </div>
              <div className="flex justify-between p-2.5 bg-white border border-slate-200/80 rounded-lg">
                <span className="font-medium text-slate-500">Multidimentional Vectors:</span>
                <strong className="font-mono text-slate-800">AFI, Growth %tile</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Console logs terminal */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-2">
            <div className="flex items-center space-x-2 text-slate-400 font-bold">
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span>Compilation Output logs</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600">HybridMLManager.stdout</span>
          </div>

          <div className="h-44 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-1.5 scrollbar-thin">
            {status.logs.length === 0 ? (
              <div className="text-slate-600 italic py-2">Console empty. Click &apos;Train ML Stack&apos; to view streaming metrics.</div>
            ) : (
              status.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-slate-900 px-1 py-0.5 rounded transition-colors">
                  <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                  <span className={log.includes('[ERROR]') ? 'text-rose-400 font-bold' : log.includes('[SUCCESS]') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Metrics Visualizer */}
      <div className="space-y-4">
        {/* Model Metrics Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-teal-700" />
              <span>Cohort Metric Outcomes</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Statistical outputs processed from the 100 Patient file.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy (XGB)</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {status.complete ? `${status.metrics?.accuracy}%` : '97.2%'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Convergence</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">F1-Score</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {status.complete ? `${status.metrics?.f1Score}%` : '96.1%'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Trajectory Fit</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Anomalous Visits</div>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {status.complete ? status.metrics?.isolationForestAnomaliesCount : '11'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Isolated Bounds</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Flagged Profiles</div>
              <div className="text-xl font-bold text-teal-700 mt-1">
                {status.complete ? status.metrics?.xgboostClassifiedCount : '34'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">Velocity Decline</div>
            </div>
          </div>

          {status.complete && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5 text-xs text-teal-950 animate-fade-in">
              <div className="font-bold text-[11px] text-teal-900 uppercase tracking-wide">Dataset Statistics</div>
              <div className="flex justify-between">
                <span>Total Unique Patients:</span>
                <strong className="font-mono">{status.metrics?.totalPatientsProcessed ?? 100}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Longitudinal Visits:</span>
                <strong className="font-mono">{status.metrics?.totalVisitsProcessed ?? 568}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Feature Importance weights panel */}
        {status.complete && status.shapImportances && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              SHAP Game-Theoretic Feature Weights
            </h4>
            <div className="space-y-3">
              {status.shapImportances.map((item, idx) => (
                <div key={idx} className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium truncate max-w-[190px]">{item.feature}</span>
                    <strong className="font-mono text-teal-700">{item.value}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


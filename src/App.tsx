/**
 * PregnancyTwin AI - Core Application Container
 * Longitudinal Pregnancy Monitoring & Clinical Decision Support Platform
 */

import React, { useEffect, useState } from 'react';
import { AppTab } from './components/AppNavigation';
import { AppSidebar } from './components/AppSidebar';
import { SettingsView } from './components/SettingsView';
import { PatientList } from './components/PatientList';
import { PatientSidebar } from './components/PatientSidebar';
import { RestPatientDisplay } from './components/RestPatientDisplay';
import { PregnancyTwinView, TwinSubPage } from './components/PregnancyTwinView';
import { UltrasoundUploadModal } from './components/UltrasoundUploadModal';
import { DoctorInTheLoopModal } from './components/DoctorInTheLoopModal';
import { GeminiCopilotDrawer } from './components/GeminiCopilotDrawer';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { LiveInputStudioView } from './components/LiveInputStudioView';
import { GrowthTrajectoryAnalyticsView } from './components/GrowthTrajectoryAnalyticsView';
import { HomePageView } from './components/HomePageView';
import { MedicationsHub } from './components/MedicationsHub';
import { PlatformWalkthrough } from './components/PlatformWalkthrough';
import { RiskNotificationModal } from './components/RiskNotificationModal';
import {
  Patient,
  PregnancyDigitalTwin,
  User,
  UserRole,
  VisitMeasurement,
  MeasurementStatus,
  RiskNotificationData
} from './types';
import { getOfflineQueue, syncOfflineQueue } from './utils/offlineSync';
import { AlertTriangle, Sparkles, Loader2, CheckCircle2, Zap, ArrowRight, Sliders, TrendingUp, Home, ChevronRight, Play, X, ChevronLeft, HelpCircle, Shield, Info, Activity, Database, RefreshCw, Download } from 'lucide-react';

export default function App() {
  // Function to parse the initial hash on load
  const getInitialRoute = () => {
    const hash = window.location.hash || '#/home';
    const pathPart = hash.startsWith('#/') ? hash.substring(2) : hash.startsWith('#') ? hash.substring(1) : '';
    const [path, queryString] = pathPart.split('?');
    
    let tab: AppTab = 'home';
    if (path) {
      const p = path.toLowerCase();
      const validTabs: AppTab[] = [
        'home', 'clinical', 'live-input', 'analytics', 'medications', 'simulation', 
        'records', 'settings', 'research', 'admin'
      ];
      if (validTabs.includes(p as AppTab)) {
        tab = p as AppTab;
      }
    }

    const params = new URLSearchParams(queryString || '');
    const patientId = params.get('patient') || 'pat-002';
    
    let subPage: TwinSubPage = 'overview';
    const sp = params.get('subpage');
    if (sp && ['overview', 'analytics', 'records', 'hemodynamics', 'guidelines', 'delivery', 'medications', 'vitals', 'clusters', 'cohort'].includes(sp)) {
      subPage = sp as TwinSubPage;
    }

    return { tab, patientId, subPage };
  };

  const initialRoute = getInitialRoute();

  // Current user state (RBAC)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'doc-001',
    name: 'Dr. Alistair Vance, MD',
    role: 'doctor',
    email: 'a.vance@maternalfetal.hospital.org',
    hospital: 'St. Jude Maternal Fetal Health'
  });

  // Navigation tab - Default to parsed initial hash
  const [activeTab, setActiveTab] = useState<AppTab>(initialRoute.tab);
  const [isAppNavCollapsed, setIsAppNavCollapsed] = useState<boolean>(false);

  // Patients and selected digital twin
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialRoute.patientId); // Default to Amina Al-Mansoor
  const [digitalTwin, setDigitalTwin] = useState<PregnancyDigitalTwin | null>(null);
  const [loadingTwin, setLoadingTwin] = useState<boolean>(true);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [clinicalViewMode, setClinicalViewMode] = useState<'split' | 'table'>('split');
  const [twinSubPage, setTwinSubPage] = useState<TwinSubPage>(initialRoute.subPage);
  const [highRiskNotificationData, setHighRiskNotificationData] = useState<RiskNotificationData | null>(null);

  // Synchronize state changes to URL Hash
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPatientId) {
      params.set('patient', selectedPatientId);
    }
    if (twinSubPage) {
      params.set('subpage', twinSubPage);
    }
    const queryStr = params.toString();
    const newHash = `#/${activeTab}${queryStr ? '?' + queryStr : ''}`;
    
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [activeTab, selectedPatientId, twinSubPage]);

  // Handle URL Hash changes (back/forward navigation & initial load)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/home';
      const pathPart = hash.startsWith('#/') ? hash.substring(2) : hash.startsWith('#') ? hash.substring(1) : '';
      const [path, queryString] = pathPart.split('?');
      
      let tab: AppTab = 'home';
      if (path) {
        const p = path.toLowerCase();
        const validTabs: AppTab[] = [
          'home', 'clinical', 'live-input', 'analytics', 'medications', 'simulation', 
          'records', 'settings', 'research', 'admin'
        ];
        if (validTabs.includes(p as AppTab)) {
          tab = p as AppTab;
        }
      }

      const params = new URLSearchParams(queryString || '');
      const patientId = params.get('patient') || 'pat-002';
      
      let subPage: TwinSubPage = 'overview';
      const sp = params.get('subpage');
      if (sp && ['overview', 'analytics', 'records', 'hemodynamics', 'guidelines', 'delivery', 'medications', 'vitals', 'clusters', 'cohort'].includes(sp)) {
        subPage = sp as TwinSubPage;
      }

      // Update states only if they differ to prevent infinite renders
      setActiveTab((prev) => (prev !== tab ? tab : prev));
      setSelectedPatientId((prev) => (prev !== patientId ? patientId : prev));
      setTwinSubPage((prev) => (prev !== subPage ? subPage : prev));
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadPatientId, setUploadPatientId] = useState<string>('pat-002');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState<boolean>(false);
  const [reviewingMeasurement, setReviewingMeasurement] = useState<VisitMeasurement | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Walkthrough state
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);

  // Online/Offline & Sync states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queueSize, setQueueSize] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    setQueueSize(getOfflineQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Synchronizing offline measurements...');
      handleTriggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Low clinical connectivity detected. Offline mode is active.');
    };

    const handleSyncUpdate = (e: any) => {
      setQueueSize(e.detail?.queueSize ?? getOfflineQueue().length);
    };

    const handleSyncComplete = (e: any) => {
      setQueueSize(0);
      showToast(`Successfully synchronized ${e.detail?.syncedCount || 0} measurements!`);
      fetchPatients();
      if (selectedPatientId) {
        fetchTwin(selectedPatientId);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pregnancy-twin-sync-update', handleSyncUpdate);
    window.addEventListener('pregnancy-twin-sync-complete', handleSyncComplete);

    // Auto-attempt sync if online on load
    if (navigator.onLine && getOfflineQueue().length > 0) {
      handleTriggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pregnancy-twin-sync-update', handleSyncUpdate);
      window.removeEventListener('pregnancy-twin-sync-complete', handleSyncComplete);
    };
  }, [selectedPatientId]);

  const handleTriggerSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue();
      if (!res.success) {
        showToast(res.error || 'Sync paused. Will retry when connection stabilizes.');
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    } finally {
      setIsSyncing(false);
      setQueueSize(getOfflineQueue().length);
    }
  };

  const startWalkthrough = () => {
    setIsWalkthroughOpen(true);
    showToast("Starting PregnancyTwin AI Guided Platform Tour!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch patients respecting RBAC
  const fetchPatients = async (userId = currentUser.id, userRole = currentUser.role) => {
    setLoadingPatients(true);
    try {
      const res = await fetch('/api/patients', {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole
        }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.patients || [];
      setPatients(list);

      // If currently selected patient is not accessible, select the first available patient
      if (list.length > 0 && !list.some((p: Patient) => p.id === selectedPatientId)) {
        setSelectedPatientId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch Digital Twin respecting RBAC
  const fetchTwin = async (patientId: string, userId = currentUser.id, userRole = currentUser.role) => {
    if (!patientId || patientId.trim() === '' || patientId === 'undefined' || patientId === 'null') {
      console.warn('fetchTwin skipped: invalid patientId', patientId);
      setDigitalTwin(null);
      setLoadingTwin(false);
      return;
    }
    setLoadingTwin(true);
    setRbacError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/twin`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole
        }
      });

      if (!res.ok) {
        let errMsg = `Error ${res.status}: Failed to retrieve clinical digital twin.`;
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          }
        } catch (_) {}
        
        setRbacError(errMsg);
        setDigitalTwin(null);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Response is not JSON.");
      }

      const data = await res.json();
      if (data && data.twin) {
        setDigitalTwin(data.twin);
      } else if (data && data.patient) {
        setDigitalTwin(data);
      } else {
        setDigitalTwin(null);
      }
    } catch (err: any) {
      console.error('Failed to load twin:', err);
      setRbacError(`Network/Parsing Error: ${err.message || 'Failed to retrieve twin.'}`);
      setDigitalTwin(null);
    } finally {
      setLoadingTwin(false);
    }
  };

  useEffect(() => {
    fetchPatients(currentUser.id, currentUser.role);
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchTwin(selectedPatientId, currentUser.id, currentUser.role);
    }
  }, [selectedPatientId, currentUser.id, currentUser.role]);

  // User Switcher (Doctor 1 vs Doctor 2 vs Administrator)
  const handleSwitchUser = async (userId: string) => {
    const userMap: Record<string, User> = {
      'doc-001': {
        id: 'doc-001',
        name: 'Dr. Alistair Vance, MD',
        role: 'doctor',
        email: 'a.vance@maternalfetal.hospital.org',
        hospital: 'St. Jude Maternal Fetal Health'
      },
      'doc-002': {
        id: 'doc-002',
        name: 'Dr. Marcus Reed, MD',
        role: 'doctor',
        email: 'm.reed@generalobstetrics.hospital.org',
        hospital: 'St. Jude Maternal Fetal Health'
      },
      'usr-admin': {
        id: 'usr-admin',
        name: 'Chief Clinical Administrator',
        role: 'admin',
        email: 'admin@pregnancy-twin.hospital.org',
        hospital: 'St. Jude Maternal Fetal Health'
      }
    };

    const nextUser = userMap[userId] || userMap['doc-001'];
    setCurrentUser(nextUser);
    if (nextUser.role === 'doctor' && activeTab === 'admin') {
      setActiveTab('clinical');
    }
    showToast(`Switched active user to: ${nextUser.name} (${nextUser.role.toUpperCase()})`);
  };

  // Role switch handler
  const handleSwitchRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      handleSwitchUser('usr-admin');
    } else {
      handleSwitchUser('doc-001');
    }
  };

  // Doctor review save
  const handleSaveReview = async (
    measurementId: string,
    status: MeasurementStatus,
    edits?: Partial<VisitMeasurement>,
    notes?: string
  ) => {
    try {
      const res = await fetch(
        `/api/patients/${selectedPatientId}/visits/${measurementId}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            edits,
            notes,
            doctorName: currentUser.name
          })
        }
      );
      if (res.ok) {
        showToast('Clinical measurement verification saved to audit log.');
        fetchTwin(selectedPatientId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const highRiskCount = patients.filter((p) => p.status === 'HIGH' || p.status === 'WATCH').length;
  const currentPatient = patients.find((p) => p.id === selectedPatientId);
  const uploadPatient = patients.find((p) => p.id === uploadPatientId) || currentPatient;

  const handleOpenUpload = (patientId?: string) => {
    if (patientId) setUploadPatientId(patientId);
    setIsUploadOpen(true);
  };

  const handleExportPDF = () => {
    const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
    const reportTitle = `PregnancyTwin AI Clinical Summary - ${activePatient ? activePatient.name : 'Cohort Summary'}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const patientVisits = digitalTwin?.visits || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; line-height: 1.5; }
          h1 { font-size: 20px; color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 16px; }
          .header-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
          .field-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .field-value { font-size: 14px; font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #0f766e; color: white; text-align: left; padding: 8px 12px; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .disclaimer { margin-top: 24px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e; }
        </style>
      </head>
      <body>
        <h1>PregnancyTwin AI — Clinical Data Summary Report</h1>
        <div class="header-grid">
          <div><div class="field-label">Patient Name</div><div class="field-value">${activePatient?.name || 'Cohort Overall'}</div></div>
          <div><div class="field-label">MRN</div><div class="field-value">${activePatient?.mrn || 'N/A'}</div></div>
          <div><div class="field-label">Maternal Age</div><div class="field-value">${activePatient?.age || 28} years</div></div>
          <div><div class="field-label">Gestational Age</div><div class="field-value">${activePatient?.currentGestationalAgeWeeks || 32}w 0d</div></div>
          <div><div class="field-label">Risk Profile</div><div class="field-value">${activePatient?.status || 'LOW'} RISK</div></div>
          <div><div class="field-label">Trajectory Category</div><div class="field-value">${activePatient?.trajectoryCategory || 'STABLE'}</div></div>
        </div>

        <h3>Longitudinal Biometry & Amniotic Fluid Index (AFI) Serial Scans</h3>
        <table>
          <thead>
            <tr>
              <th>Visit #</th>
              <th>Date</th>
              <th>GA (Weeks)</th>
              <th>EFW (g)</th>
              <th>Hadlock Growth %</th>
              <th>AFI (cm)</th>
              <th>Review Status</th>
            </tr>
          </thead>
          <tbody>
            ${patientVisits.length > 0 ? patientVisits.map(v => `
              <tr>
                <td>Visit ${v.visitNumber}</td>
                <td>${v.date}</td>
                <td>${v.gestationalAgeWeeks}w</td>
                <td>${v.estimatedFetalWeight_g}g</td>
                <td>${v.growthPercentile}%</td>
                <td>${v.amnioticFluidIndex_cm} cm</td>
                <td>${(v.doctorReviewStatus || 'Accepted').toUpperCase()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">
                  Serial biometric measurements available in dataset 2.5kdata_enhanced.json.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="disclaimer">
          <strong>Medical Notice:</strong> This clinical summary is generated by PregnancyTwin AI decision-support platform for research and clinician review. It is not an autonomous medical diagnosis and requires clinical review by a licensed healthcare practitioner.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex font-sans selection:bg-teal-500 selection:text-white overflow-hidden">
      
      {/* Persistent Left Side Navigation Bar */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onSwitchUser={handleSwitchUser}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenUpload={() => handleOpenUpload(selectedPatientId)}
        highRiskCount={highRiskCount}
        activePatientName={digitalTwin?.patient?.name}
        hasTrajectoryAlert={digitalTwin?.whyNow?.triggered}
        alertSummary={digitalTwin?.whyNow?.summary}
        onStartWalkthrough={startWalkthrough}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeSubPage={twinSubPage}
        onSelectSubPage={setTwinSubPage}
        visitsCount={digitalTwin?.visits?.length}
      />

      {/* Main Content Body Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

        {/* Toast popup */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-teal-900 border border-teal-700 text-teal-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
            <span>{toastMessage}</span>
          </div>
        )}

      {/* Offline Connectivity & Sync Queue Banner */}
      {(!isOnline || queueSize > 0) && (
        <div className={`border-b text-xs py-2.5 px-4 shadow-sm transition-all duration-300 ${
          !isOnline 
            ? 'bg-amber-500 border-amber-600 text-amber-950 font-medium' 
            : 'bg-emerald-600 border-emerald-700 text-emerald-50 font-medium'
        }`}>
          <div className="w-full max-w-[1720px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-white animate-pulse' : 'bg-white'}`} />
              <span className="leading-relaxed">
                {!isOnline ? (
                  <>
                    <strong className="font-bold">Offline Sync Active:</strong> Low-connectivity or rural setting detected. Scans and reviews are queued locally and will automatically synchronize once network stability returns.
                  </>
                ) : (
                  <>
                    <strong className="font-bold">Clinical Connection Restored:</strong> {queueSize} local biometric ultrasound updates are ready to synchronize.
                  </>
                )}
              </span>
            </div>
            
            {queueSize > 0 && (
              <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
                <span className="bg-black/15 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                  {queueSize} updates pending sync
                </span>
                {isOnline && (
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-teal-900 font-bold rounded-lg shadow-xs transition-colors disabled:opacity-55 cursor-pointer text-[11px]"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-teal-700" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 text-teal-600" />
                        <span>Sync Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Trajectory Attention Alert Banner if viewing patient with alert */}
        {digitalTwin && digitalTwin.whyNow?.triggered && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-950 shadow-2xs">
            <div className="w-full max-w-[1720px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0 border border-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
                <span className="leading-snug">
                  <strong className="font-bold text-amber-900">Trajectory Clinical Alert: </strong>
                  {digitalTwin?.patient?.name} — {digitalTwin?.whyNow?.summary}
                </span>
              </div>
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold transition-colors self-start sm:self-auto shrink-0 text-xs border border-amber-300 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-800" />
                <span>Investigate Alert</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* 1. Home Dashboard View */}
        {activeTab === 'home' && (
          <HomePageView
            currentUser={currentUser}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onNavigateTab={(tab) => {
              if (tab === 'simulation') {
                setTwinSubPage('analytics');
                setActiveTab('clinical');
              } else if (tab === 'records') {
                setTwinSubPage('records');
                setActiveTab('clinical');
              } else {
                setActiveTab(tab);
              }
            }}
            onNavigateToTwinSubPage={(subPage) => {
              setTwinSubPage(subPage);
              setActiveTab('clinical');
            }}
            onOpenUpload={handleOpenUpload}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onOpenGuidelines={() => setIsKnowledgeOpen(true)}
            isOnline={isOnline}
            queueSize={queueSize}
            isSyncing={isSyncing}
            onTriggerSync={handleTriggerSync}
          />
        )}

        {/* 2. Clinical Digital Twin Explorer & Sub-Pages */}
        {(activeTab === 'clinical' || activeTab === 'simulation' || activeTab === 'records') && (
          <div className="space-y-3.5">
            
            {/* Sleek Clinical Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-300 rounded-xl px-3.5 py-2 shadow-2xs">
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>
                    {activeTab === 'simulation' || (activeTab === 'clinical' && twinSubPage === 'analytics')
                      ? 'Modeling & Sensitivity Studio'
                      : activeTab === 'records' || (activeTab === 'clinical' && twinSubPage === 'records')
                      ? 'Serial Ultrasound Checkpoints & Hub'
                      : 'Twin Overview & Medications'}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 hidden md:inline">
                  {activeTab === 'simulation' || (activeTab === 'clinical' && twinSubPage === 'analytics')
                    ? 'Dynamic growth trajectories, sensitivity engine, and counterfactual modeling'
                    : activeTab === 'records' || (activeTab === 'clinical' && twinSubPage === 'records')
                    ? 'DICOM biometry ingestion & clinician validation checkpoints'
                    : 'Longitudinal twin dashboard & clinical timeline'}
                </span>
              </div>

              {/* View Action Controls */}
              <div className="flex items-center space-x-2 text-xs self-end sm:self-auto">
                <button
                  id="btn-export-pdf"
                  onClick={handleExportPDF}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs border border-slate-700 animate-in fade-in"
                  title="Download clinical summary report (PDF)"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" />
                  <span>Export to PDF</span>
                </button>
              </div>
            </div>

            {/* Split View with Hidden Sidebar & Horizontal REST 5-Case Display */}
            {clinicalViewMode === 'split' ? (
              <div className="space-y-4 w-full">
                {/* Full-Width: Digital Twin Deep View */}
                <div className="w-full min-w-0 space-y-4">
                  {rbacError ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-800 text-xs shadow-xs space-y-2">
                      <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                      <h3 className="text-sm font-bold text-rose-900">Role-Based Access Control Restriction</h3>
                      <p className="max-w-md mx-auto">{rbacError}</p>
                      <p className="text-[11px] text-slate-500">
                        Switch to Administrator role or select a patient assigned to your roster.
                      </p>
                    </div>
                  ) : loadingTwin ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center space-x-2 text-slate-500 text-xs shadow-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
                      <span>Synthesizing Pregnancy Digital Twin trajectory...</span>
                    </div>
                  ) : digitalTwin ? (
                    <PregnancyTwinView
                      twin={digitalTwin}
                      currentUser={currentUser}
                      initialSubPage={
                        activeTab === 'simulation'
                          ? 'analytics'
                          : activeTab === 'records'
                          ? 'records'
                          : twinSubPage
                      }
                      onSubPageChange={(p) => setTwinSubPage(p)}
                      onOpenUpload={() => {
                        setUploadPatientId(digitalTwin?.patient?.id || '');
                        setIsUploadOpen(true);
                      }}
                      onOpenCopilot={() => setIsCopilotOpen(true)}
                      onOpenReviewMeasurement={(m) => setReviewingMeasurement(m)}
                      onOpenMultilingualModal={() => setIsCopilotOpen(true)}
                      onNavigateToLiveInput={() => setActiveTab('live-input')}
                      onSelectPatient={setSelectedPatientId}
                      onRefreshPatients={() => {
                        fetchPatients(currentUser.id, currentUser.role);
                        fetchTwin(selectedPatientId, currentUser.id, currentUser.role);
                      }}
                    />
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-xl shadow-sm">
                      Select a patient from the sidebar to view their digital twin.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Full-Width Cohort Table View */
              <div className="space-y-4">
                <PatientList
                  patients={patients}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={(id) => setSelectedPatientId(id)}
                  currentUser={currentUser}
                  totalHospitalPatients={6}
                  onOpenUpload={(id) => {
                    setUploadPatientId(id);
                    setIsUploadOpen(true);
                  }}
                  onNavigateToLiveInput={(id) => {
                    setSelectedPatientId(id);
                    setActiveTab('live-input');
                  }}
                  showToast={showToast}
                />

                {digitalTwin && (
                  <PregnancyTwinView
                    currentUser={currentUser}
                    twin={digitalTwin}
                    onSelectPatient={setSelectedPatientId}
                    initialSubPage={
                      activeTab === 'records'
                        ? 'records'
                        : (activeTab === ('simulation' as any)
                        ? 'analytics'
                        : twinSubPage)
                    }
                    onSubPageChange={(p) => setTwinSubPage(p)}
                    onOpenUpload={() => {
                      setUploadPatientId(digitalTwin?.patient?.id || '');
                      setIsUploadOpen(true);
                    }}
                    onOpenCopilot={() => setIsCopilotOpen(true)}
                    onOpenReviewMeasurement={(m) => setReviewingMeasurement(m)}
                    onOpenMultilingualModal={() => setIsCopilotOpen(true)}
                    onNavigateToLiveInput={() => setActiveTab('live-input')}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'live-input' && (
          <LiveInputStudioView
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            digitalTwinVisits={digitalTwin?.visits || []}
            onVisitAdded={(patientId, highRiskData) => {
              fetchPatients();
              fetchTwin(patientId);
              if (highRiskData) {
                setHighRiskNotificationData(highRiskData);
                setSelectedPatientId(patientId);
                setActiveTab('clinical');
              }
            }}
            onNavigateToTwin={() => setActiveTab('clinical')}
            onNavigateToCharts={() => setActiveTab('analytics')}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'analytics' && digitalTwin && (
          <GrowthTrajectoryAnalyticsView
            twin={digitalTwin}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onOpenLiveInput={() => setActiveTab('live-input')}
            onOpenReviewMeasurement={(m) => setReviewingMeasurement(m)}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsHub
            twin={digitalTwin}
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              fetchTwin(id);
            }}
            onMedicationsChanged={() => {
              fetchPatients();
              fetchTwin(selectedPatientId);
            }}
            onNavigateToLiveInput={() => setActiveTab('live-input')}
          />
        )}

        {/* 5. Settings & Admin/Info Suite (Research ROC, Audit Log, Guidelines) */}
        {(activeTab === 'settings' || activeTab === 'research' || activeTab === 'admin') && (
          <SettingsView
            key={activeTab}
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            onSwitchUser={handleSwitchUser}
            initialSubTab={
              activeTab === 'admin'
                ? 'admin'
                : activeTab === 'research'
                ? 'model-training'
                : 'general'
            }
            onNavigateToClinical={() => setActiveTab('clinical')}
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveTab('clinical');
            }}
            onOpenGuidelines={() => setIsKnowledgeOpen(true)}
          />
        )}
      </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              <strong className="text-slate-700">PregnancyTwin AI</strong> — Clinical Decision Support Platform
            </span>
            <span className="text-slate-400">
              For professional clinical decision-support. Does not replace autonomous clinical judgment.
            </span>
          </div>
        </footer>
      </div>

      {/* Modals and Drawers */}
      {isUploadOpen && uploadPatient && (
        <UltrasoundUploadModal
          patient={uploadPatient}
          onClose={() => setIsUploadOpen(false)}
          onExtractionSuccess={(highRiskData) => {
            fetchPatients();
            fetchTwin(uploadPatient.id);
            if (highRiskData) {
              setHighRiskNotificationData(highRiskData);
              setSelectedPatientId(uploadPatient.id);
              setActiveTab('clinical');
              showToast(`⚠️ HIGH-RISK TRAJECTORY DETECTED: Immediate clinical review advised for ${uploadPatient.name}!`);
            } else {
              showToast('Ultrasound scan successfully extracted and ingested into Digital Twin!');
            }
          }}
          onHighRiskDetected={(highRiskData) => {
            setHighRiskNotificationData(highRiskData);
            setSelectedPatientId(uploadPatient.id);
            setActiveTab('clinical');
          }}
          onSendToStudio={(extracted) => {
            setSelectedPatientId(uploadPatient.id);
            setActiveTab('live-input');
            showToast('Ultrasound biometrics loaded into Live Input Studio!');
          }}
        />
      )}

      {/* Primary Model High-Risk Trajectory Notification Modal */}
      {highRiskNotificationData && (
        <RiskNotificationModal
          data={highRiskNotificationData}
          currentUser={currentUser}
          showToast={showToast}
          onClose={() => setHighRiskNotificationData(null)}
          onProceedToClinicalReview={(patientId) => {
            setSelectedPatientId(patientId);
            setActiveTab('clinical');
            setTwinSubPage('overview');
            setHighRiskNotificationData(null);
            showToast(`Initiated immediate clinical review for ${highRiskNotificationData.patient.name}.`);
          }}
          onOpenCopilot={(patientName, prompt) => {
            setSelectedPatientId(highRiskNotificationData.patient.id);
            setIsCopilotOpen(true);
            setHighRiskNotificationData(null);
            showToast('AI Clinical Copilot opened with high-risk clinical review context.');
          }}
        />
      )}

      {reviewingMeasurement && (
        <DoctorInTheLoopModal
          measurement={reviewingMeasurement}
          onClose={() => setReviewingMeasurement(null)}
          onSaveReview={handleSaveReview}
        />
      )}

      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentPatient={currentPatient}
        currentUser={currentUser}
      />

      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />

      {/* Floating Guided Tour Launcher */}
      {!isWalkthroughOpen && (
        <button
          onClick={startWalkthrough}
          id="btn-guided-tour-launcher"
          className="fixed bottom-6 right-6 z-40 bg-slate-900/95 hover:bg-slate-850 text-white font-bold text-xs py-2.5 px-4 rounded-full shadow-2xl border border-teal-500/40 hover:border-teal-400 flex items-center space-x-2.5 cursor-pointer group hover:scale-[1.03] transition-all backdrop-blur-md ring-1 ring-teal-500/20"
          title="Start Interactive Clinical Platform Tour (9 Guided Steps)"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
          </span>
          <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20 group-hover:scale-110 transition-transform" />
          <span className="tracking-wide text-slate-100">Interactive Tour</span>
          <span className="text-[10px] font-mono bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded-full border border-teal-800 font-bold">
            9 Steps
          </span>
        </button>
      )}

      {/* Enhanced Multi-Track Platform Walkthrough */}
      <PlatformWalkthrough
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        onSetTwinSubPage={(sp) => setTwinSubPage(sp)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onCloseCopilot={() => setIsCopilotOpen(false)}
        onOpenUpload={() => handleOpenUpload(selectedPatientId)}
        onOpenKnowledge={() => setIsKnowledgeOpen(true)}
        showToast={showToast}
      />

      </div>
    </div>
  );
}

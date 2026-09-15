/**
 * PregnancyTwin AI - Home Page View (Clinical Dashboard & Platform Overview)
 * Designed for clinicians to immediately understand the Digital Twin + longitudinal trajectory concept.
 */

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Activity,
  Sparkles,
  TrendingUp,
  UploadCloud,
  CheckCircle2,
  Database,
  ChevronRight,
  User as UserIcon,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Users
} from 'lucide-react';
import { Patient, User } from '../types';
import { AppTab } from './AppNavigation';

interface HomePageViewProps {
  currentUser: User;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToTwinSubPage?: (subPage: 'clusters' | 'cohort') => void;
  onOpenUpload: (patientId?: string) => void;
  onOpenCopilot: () => void;
  onOpenGuidelines: () => void;
  isOnline?: boolean;
  queueSize?: number;
  isSyncing?: boolean;
  onTriggerSync?: () => Promise<void> | void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  currentUser,
  patients,
  selectedPatientId,
  onSelectPatient,
  onNavigateTab,
  onNavigateToTwinSubPage,
  onOpenUpload,
  onOpenCopilot,
  onOpenGuidelines
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search filter
  const matchingPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Alert notifications list derived from patient statuses
  const alertNotifications = patients
    .filter(p => p.status === 'HIGH' || p.status === 'WATCH')
    .map(p => ({
      id: p.id,
      text: `${p.name} (${p.status}): Trajectory deviation detected. Click to review.`,
      time: 'Just now'
    }));

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById('section-how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-16 max-w-7xl mx-auto">
      
      {/* ========================================== */}
      {/* 1. TOP HEADER                              */}
      {/* ========================================== */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>PregnancyTwin AI</span>
            <span className="text-[10px] bg-teal-950 text-teal-300 font-extrabold px-1.5 py-0.5 rounded border border-teal-800">
              AI
            </span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
            AI-Powered Longitudinal Maternal–Fetal Monitoring
          </p>
        </div>

        {/* Search, Notifications, Doctor Profile */}
        <div className="flex flex-wrap items-center gap-3 md:self-center">
          {/* Interactive Search */}
          <div className="relative">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 w-64 shadow-2xs focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search patient database..."
                className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Dropdown search results */}
            {showSearchResults && searchQuery && (
              <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-lg w-72 z-50 p-2 max-h-60 overflow-y-auto animate-slide-in">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Results ({matchingPatients.length})</span>
                  <button 
                    onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                    className="hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                </div>
                {matchingPatients.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {matchingPatients.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPatient(p.id);
                          onNavigateTab('clinical');
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.mrn} • {p.currentGestationalAgeWeeks}w</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">No matching clinical records.</div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 relative cursor-pointer"
              title="Clinical Trajectory Alerts"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {alertNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-lg w-80 z-50 p-3 space-y-2 animate-slide-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Clinical Trajectory Alerts</span>
                  <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-100 font-bold px-1.5 py-0.2 rounded-full">
                    {alertNotifications.length} active
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alertNotifications.map((notif, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectPatient(notif.id);
                        onNavigateTab('clinical');
                        setShowNotifications(false);
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] text-slate-700 leading-normal border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer"
                    >
                      <p className="font-medium">{notif.text}</p>
                      <span className="text-[9px] text-slate-400 block mt-1">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Doctor Info */}
          <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 font-bold">
            <UserIcon className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
            <span>{currentUser.name}</span>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* 2. HERO / PROJECT OVERVIEW                 */}
      {/* ========================================== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <span className="px-3 py-1 rounded-full bg-teal-950 text-teal-300 text-[10px] font-black uppercase tracking-widest border border-teal-900/60 inline-block">
            Antenatal Digital Twin Engine
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            From Pregnancy Snapshots to a Continuous Pregnancy Trajectory
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            PregnancyTwin AI builds a patient-specific longitudinal view of maternal and fetal health, combining pregnancy measurements, medication exposure, and clinical data to identify meaningful changes and provide explainable AI insights for clinician review.
          </p>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            PregnancyTwin AI creates a patient-specific digital twin by bringing together ultrasound measurements, clinical reports, maternal information, medication exposure, and longitudinal pregnancy data. It analyzes how these factors change across visits, identifies meaningful trajectory deviations, and provides explainable AI insights for clinician review.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <button
              onClick={() => onNavigateTab('clinical')}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center space-x-2"
            >
              <span>Explore Patient Timeline</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleScrollToHowItWorks}
              className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider transition-all border border-white/20 cursor-pointer flex items-center space-x-2"
            >
              <span>View How It Works</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. "WHAT DOES PREGNANCYTWIN AI DO?"        */}
      {/* ========================================== */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
          Key Functionality
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5.5 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shadow-3xs">
              📊
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Track</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Builds a longitudinal pregnancy timeline from multiple prenatal visits.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5.5 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shadow-3xs">
              📈
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Analyze</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Studies changes in fetal growth, amniotic fluid, and other available measurements over time.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5.5 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shadow-3xs">
              💊
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Contextualize</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maps medication exposure and relevant maternal factors onto the pregnancy timeline.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5.5 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shadow-3xs">
              ✦
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Explain</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Uses AI to explain model findings and highlight the factors contributing to an alert.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.5. CLINICAL DIGITAL TWINS POPULATION SUB-PAGES NAVIGATOR              */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-950/90 px-2.5 py-0.5 rounded-full border border-teal-700">
                Clinical Digital Twins
              </span>
              <span className="text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                2 Sub-Pages Available
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Population Risk Stratification &amp; Cluster Triage
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              <strong>Cluster Alpha</strong> (Late 3rd Trimester Multi-Factor Decay, 32–35w) and the <strong>6 Active Pregnancies</strong> in this high-risk cohort have been transitioned into dedicated sub-pages in Clinical Digital Twins for longitudinal hemodynamic correlation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTwinSubPage ? onNavigateToTwinSubPage('clusters') : onNavigateTab('clinical')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Critical Cluster Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToTwinSubPage ? onNavigateToTwinSubPage('cohort') : onNavigateTab('clinical')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 border border-slate-600 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>Active Pregnancies (6)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. CENTRAL VISUAL (PREGNANCY DIGITAL TWIN) */}
      {/* ========================================== */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">
            Conceptual Engine Flow
          </span>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Pregnancy Digital Twin Trajectory
          </h3>
        </div>

        {/* Horizontal Timeline */}
        <div className="relative flex flex-col md:flex-row justify-between items-stretch max-w-4xl mx-auto gap-6 mb-8 pt-4">
          {/* Connecting Line (Only on desktop) */}
          <div className="absolute top-[3.25rem] left-[15%] right-[15%] h-0.5 bg-slate-200 hidden md:block" />

          {/* 24 Weeks */}
          <div className="relative z-10 flex flex-col items-center text-center flex-1">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center border-4 border-slate-100 shadow-sm shrink-0">
              24w
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide mt-2">24 Weeks</span>
            <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 w-full text-xs text-slate-600 space-y-1.5 shadow-3xs">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wide">Ultrasound Scan</div>
              <div className="flex justify-between"><span>Est. Fetal Weight (EFW):</span> <strong className="font-mono text-slate-900">680g</strong></div>
              <div className="flex justify-between"><span>Amniotic Fluid Index:</span> <strong className="font-mono text-slate-900">12.4 cm</strong></div>
              <div className="flex justify-between"><span>Hadlock Growth %ile:</span> <strong className="font-mono text-slate-900">50th</strong></div>
            </div>
          </div>

          {/* 28 Weeks */}
          <div className="relative z-10 flex flex-col items-center text-center flex-1">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center border-4 border-slate-100 shadow-sm shrink-0">
              28w
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide mt-2">28 Weeks</span>
            <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 w-full text-xs text-slate-600 space-y-1.5 shadow-3xs">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wide">Ultrasound Scan</div>
              <div className="flex justify-between"><span>Est. Fetal Weight (EFW):</span> <strong className="font-mono text-slate-900">1150g</strong></div>
              <div className="flex justify-between"><span>Amniotic Fluid Index:</span> <strong className="font-mono text-slate-900">10.2 cm</strong></div>
              <div className="flex justify-between"><span>Hadlock Growth %ile:</span> <strong className="font-mono text-slate-900">45th</strong></div>
            </div>
          </div>

          {/* 32 Weeks */}
          <div className="relative z-10 flex flex-col items-center text-center flex-1">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-mono font-bold text-xs flex items-center justify-center border-4 border-white shadow-md shrink-0">
              32w
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide mt-2">32 Weeks</span>
            <div className="mt-3 bg-white border border-teal-200 rounded-2xl p-4 w-full text-xs text-slate-600 space-y-1.5 shadow-2xs ring-2 ring-teal-500/5">
              <div className="font-bold text-teal-800 border-b border-teal-100 pb-1 text-[11px] uppercase tracking-wide">Ultrasound Scan</div>
              <div className="flex justify-between"><span>Est. Fetal Weight (EFW):</span> <strong className="font-mono text-slate-900">1550g</strong></div>
              <div className="flex justify-between"><span>Amniotic Fluid Index:</span> <strong className="font-mono text-slate-900">8.9 cm</strong></div>
              <div className="flex justify-between"><span>Hadlock Growth %ile:</span> <strong className="font-mono text-slate-900">39th</strong></div>
            </div>
          </div>
        </div>

        {/* Overlay Medication bar */}
        <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Maternal Medication exposure Timeline Overlay</span>
            <span className="text-indigo-600">Active Overlaps Matrix</span>
          </div>
          <div className="relative h-3.5 bg-slate-200/80 rounded-full overflow-hidden flex items-center">
            <div className="absolute left-[12.5%] right-[25%] h-full bg-gradient-to-r from-teal-500 to-indigo-500 opacity-85" />
            <span className="absolute w-full text-center text-[9px] text-slate-800 font-extrabold tracking-wide uppercase z-10">
              Continuous Medication timeline alignment
            </span>
          </div>
        </div>

        {/* Downward Flow to insights */}
        <div className="flex flex-col items-center space-y-4 max-w-sm mx-auto pt-4">
          <div className="w-0.5 h-6 bg-slate-300" />
          
          <div className="bg-slate-900 text-white rounded-2xl py-3 px-6 border border-slate-800 text-center text-xs font-black uppercase tracking-wider w-full shadow-xs flex items-center justify-center space-x-2">
            <span>🔄 Trajectory Analysis Engine</span>
          </div>

          <div className="w-0.5 h-6 bg-slate-300" />

          <div className="bg-indigo-600 text-indigo-50 rounded-2xl py-3 px-6 border border-indigo-500 text-center text-xs font-black uppercase tracking-wider w-full shadow-md flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span>✦ AI / ML Insights</span>
          </div>

          <div className="w-0.5 h-6 bg-slate-300" />

          <div className="bg-teal-700 text-teal-50 rounded-2xl py-3 px-6 border border-teal-600 text-center text-xs font-black uppercase tracking-wider w-full shadow-xs flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
            <span>Doctor Review &amp; Validation</span>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 5, 6, 7. BENTO GRID STATS & STATUSES       */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 5. Dashboard Snapshot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Pregnancy Overview</span>
            </h3>
            
            <table className="w-full text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="text-left pb-2">Metric</th>
                  <th className="text-right pb-2">Current</th>
                  <th className="text-left pb-2 pl-4">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                <tr>
                  <td className="py-2.5 text-slate-800">Gestational Age</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">32w 4d</td>
                  <td className="py-2.5 pl-4 text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-800">EFW (Est. Fetal Weight)</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">1550 g</td>
                  <td className="py-2.5 pl-4 text-emerald-600 font-black text-sm">↗</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-800">AFI (Amniotic Fluid)</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">8.9</td>
                  <td className="py-2.5 pl-4 text-rose-600 font-black text-sm">↘</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-800">Growth Percentile</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">39th</td>
                  <td className="py-2.5 pl-4 text-rose-600 font-black text-sm">↘</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-800">Active Medications</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">2</td>
                  <td className="py-2.5 pl-4 text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. AI Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Current Trajectory Status</span>
            </h3>
            
            <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200">
              MONITOR
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Recent measurements show a change from the patient's previous trajectory. The model's primary contributing factors are displayed below for clinician review.
            </p>
          </div>
          
          <button
            onClick={onOpenCopilot}
            className="mt-6 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200/80 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>View Explanation</span>
          </button>
        </div>

        {/* 7. Medication Impact Preview */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              💊 Medication Timeline
            </h3>
            <div className="text-xs text-slate-500 font-bold">2 Active Medications</div>
            
            {/* Visual Exposure Grid */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-[10px] text-slate-500 space-y-3 shadow-3xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold">
                <span>24w</span>
                <span>28w</span>
                <span>32w</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-sans font-semibold text-slate-700">Medication A</span>
                    <span className="text-[9px] text-slate-400">25w–31w</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[70%] ml-[15%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-sans font-semibold text-slate-700">Medication B</span>
                    <span className="text-[9px] text-slate-400">29w–32w</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[35%] ml-[65%]" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal font-medium">
              <strong className="text-slate-700">Exposure overlaps with:</strong> Recent longitudinal measurement period
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('clinical')}
            className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>View Medication Impact</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

      </section>

      {/* ========================================== */}
      {/* 8. HOW IT WORKS                            */}
      {/* ========================================== */}
      <section id="section-how-it-works" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="text-center space-y-1.5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Diagnostic Methodology
          </h3>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            ONE PREGNANCY. ONE LONGITUDINAL VIEW.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto pt-2">
          {[
            { label: 'Patient Data', icon: Database, bg: 'bg-slate-50 text-slate-700 border-slate-200/80' },
            { label: 'AI Extraction', icon: UploadCloud, bg: 'bg-teal-50 text-teal-700 border-teal-100' },
            { label: 'Digital Twin', icon: Activity, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { label: 'Trajectory Analysis', icon: TrendingUp, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            { label: 'ML + Explainability', icon: Sparkles, bg: 'bg-purple-50 text-purple-700 border-purple-100' },
            { label: 'Clinician Review', icon: CheckCircle2, bg: 'bg-rose-50 text-rose-700 border-rose-100' },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.label}>
              <div className={`flex flex-col items-center text-center p-4 rounded-2xl border ${step.bg} w-full md:w-36 shadow-3xs hover:scale-102 transition-all`}>
                <step.icon className="w-6 h-6 mb-2 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider leading-tight">{step.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="hidden md:block text-slate-300 font-bold text-base select-none">
                  ➔
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* 9. TECHNOLOGY STRIP                        */}
      {/* ========================================== */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-sm text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
          <span>Google Gemini</span>
          <span className="text-slate-800 font-bold hidden sm:inline">•</span>
          <span>Computer Vision</span>
          <span className="text-slate-800 font-bold hidden sm:inline">•</span>
          <span>XGBoost</span>
          <span className="text-slate-800 font-bold hidden sm:inline">•</span>
          <span>SHAP</span>
          <span className="text-slate-800 font-bold hidden sm:inline">•</span>
          <span>Firebase</span>
          <span className="text-slate-800 font-bold hidden sm:inline">•</span>
          <span>Google Cloud</span>
        </div>
        <p className="text-xs text-slate-300 font-medium tracking-wide">
          Built with a hybrid AI architecture combining structured ML with Google AI.
        </p>
      </section>

    </div>
  );
};

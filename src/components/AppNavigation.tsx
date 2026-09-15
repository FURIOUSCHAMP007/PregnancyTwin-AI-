/**
 * PregnancyTwin AI - Unified Top-Bar Navigation
 * Consolidates redundant sidebar navigation and top-header elements into a single,
 * highly focused, clutter-free horizontal top navigation bar.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Shield,
  Sparkles,
  UploadCloud,
  ChevronDown,
  RefreshCw,
  Check,
  Menu,
  X,
  Pill,
  Play,
  Cpu
} from 'lucide-react';
import { User, UserRole } from '../types';
import { getOfflineQueue, getSyncedCount } from '../utils/offlineSync';

export type AppTab =
  | 'home'
  | 'clinical'
  | 'live-input'
  | 'analytics'
  | 'medications'
  | 'simulation'
  | 'records'
  | 'settings'
  | 'research'
  | 'admin';

interface AppNavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  onSwitchUser?: (userId: string) => void;
  onOpenCopilot: () => void;
  onOpenUpload: () => void;
  onOpenKnowledge: () => void;
  highRiskCount: number;
  activePatientName?: string;
  hasTrajectoryAlert?: boolean;
  alertSummary?: string;
  onStartWalkthrough?: () => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onSwitchRole,
  onSwitchUser,
  onOpenCopilot,
  onOpenUpload,
  onOpenKnowledge,
  highRiskCount,
  activePatientName,
  hasTrajectoryAlert,
  alertSummary,
  onStartWalkthrough
}) => {
  const isDashboardActive = activeTab === 'home';
  const isClinicalActive = activeTab === 'clinical' || activeTab === 'records' || activeTab === 'simulation';
  const isLiveInputActive = activeTab === 'live-input';
  const isInsightsActive = activeTab === 'analytics';
  const isMedicationsActive = activeTab === 'medications';
  const isResearchActive = activeTab === 'research';
  const isSettingsActive = activeTab === 'settings' || activeTab === 'admin';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Offline and synced data tracking for the visual bar chart summary
  const [queueSize, setQueueSize] = useState<number>(0);
  const [syncedCount, setSyncedCount] = useState<number>(0);

  useEffect(() => {
    // Initial fetch of levels
    setQueueSize(getOfflineQueue().length);
    setSyncedCount(getSyncedCount());

    const handleSyncUpdate = () => {
      setQueueSize(getOfflineQueue().length);
      setSyncedCount(getSyncedCount());
    };

    window.addEventListener('pregnancy-twin-sync-update', handleSyncUpdate);
    window.addEventListener('pregnancy-twin-sync-complete', handleSyncUpdate);

    return () => {
      window.removeEventListener('pregnancy-twin-sync-update', handleSyncUpdate);
      window.removeEventListener('pregnancy-twin-sync-complete', handleSyncUpdate);
    };
  }, []);

  const usersList = [
    { id: 'doc-001', name: 'Dr. Alistair Vance, MD', role: 'doctor' as const, label: 'Dr. Vance (MFM Specialist)' },
    { id: 'doc-002', name: 'Dr. Marcus Reed, MD', role: 'doctor' as const, label: 'Dr. Reed (Obstetrician)' },
    { id: 'usr-admin', name: 'Chief Clinical Administrator', role: 'admin' as const, label: 'Hospital Administrator' }
  ];

  const handleTabClick = (tab: AppTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-200 min-h-16 w-full shadow-md shrink-0">
      <div className="w-full h-full min-h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 overflow-x-hidden">
        
        {/* Left Section: Brand Logo & Title + Navigation */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <button
            onClick={() => handleTabClick('home')}
            className="flex items-center space-x-2 text-left group cursor-pointer focus:outline-none shrink-0"
            title="PregnancyTwin AI Home Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs transition-colors">
              PT
            </div>
            <div className="leading-tight">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors tracking-tight">
                  PregnancyTwin
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  AI
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium hidden sm:block">Maternal-Fetal Clinical AI</p>
            </div>
          </button>

          {/* Center Section: Main Desktop Navigation (Scrollable strip on tight viewports) */}
          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto no-scrollbar py-1 max-w-[650px] xl:max-w-none">
            {/* Overview */}
            <button
              onClick={() => handleTabClick('home')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isDashboardActive
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Home Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-teal-300" />
              <span>Dashboard</span>
            </button>

            {/* Clinical Twins */}
            <button
              onClick={() => handleTabClick('clinical')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isClinicalActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Patient Digital Twins"
            >
              <Activity className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span>Clinical Twins</span>
              {highRiskCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  {highRiskCount}
                </span>
              )}
            </button>

            {/* Live Ingestion */}
            <button
              onClick={() => handleTabClick('live-input')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isLiveInputActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Live Ultrasound Ingestion Studio"
            >
              <UploadCloud className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span>Live Ingestion</span>
            </button>

            {/* Growth Analytics */}
            <button
              onClick={() => handleTabClick('analytics')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isInsightsActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Hadlock Percentiles & Growth Analytics"
            >
              <LineChart className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span className="hidden xl:inline">Growth Analytics</span>
              <span className="xl:hidden">Analytics</span>
            </button>

            {/* Medications */}
            <button
              onClick={() => handleTabClick('medications')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isMedicationsActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Maternal Pharmacotherapy & Medications Studio"
            >
              <Pill className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span>Meds</span>
            </button>

            {/* ML Pipeline & XGBoost Training */}
            <button
              onClick={() => handleTabClick('research')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isResearchActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="PregnancyTwin AI Hybrid ML Pipeline & XGBoost Baseline"
            >
              <Cpu className="w-3.5 h-3.5 shrink-0 text-teal-400" />
              <span className="hidden xl:inline">ML Pipeline</span>
              <span className="xl:hidden">ML</span>
            </button>

            {/* System & Security */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSettingsActive
                  ? 'bg-slate-800 text-teal-300 border border-slate-700/80 shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="System Settings & Security Status"
            >
              <Shield className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="hidden xl:inline">System & Security</span>
              <span className="xl:hidden">System</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Core Controls & Active User Profile Dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 text-slate-300 shrink-0">
          
          {/* Offline Status Stacked Bar Widget */}
          <div className="hidden 2xl:flex items-center space-x-2.5 bg-slate-950/40 border border-slate-800/80 px-2.5 py-1 rounded-xl text-xs select-none font-sans" title={`Data Synchronization Status: ${syncedCount} Synced vs ${queueSize} Unsynced (Offline queued)`}>
            <div className="flex flex-col text-left space-y-0.5">
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Sync</span>
                <span className={`h-1.5 w-1.5 rounded-full ${queueSize > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <div className="flex items-center space-x-1 leading-none">
                <span className="font-bold text-slate-100 text-[10px]">{syncedCount} S</span>
                <span className="text-slate-600">/</span>
                <span className={`font-bold text-[10px] ${queueSize > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>{queueSize} U</span>
              </div>
            </div>
            {/* Small bar chart */}
            <div className="flex items-end space-x-1 h-5 w-7 shrink-0">
              <div className="relative group flex-1 bg-slate-800 rounded-t-[2px] h-full overflow-hidden flex items-end">
                <div 
                  className="w-full bg-emerald-500 rounded-t-[2px] transition-all duration-500"
                  style={{ height: `${Math.max(15, Math.min(100, (syncedCount / (syncedCount + queueSize || 1)) * 100))}%` }}
                />
              </div>
              <div className="relative group flex-1 bg-slate-800 rounded-t-[2px] h-full overflow-hidden flex items-end">
                <div 
                  className={`w-full rounded-t-[2px] transition-all duration-500 ${queueSize > 0 ? 'bg-amber-500' : 'bg-slate-700'}`}
                  style={{ height: `${Math.max(5, Math.min(100, (queueSize / (syncedCount + queueSize || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fetal Growth Tracker - Selected Patient Context */}
          {activePatientName && (isClinicalActive || isInsightsActive || isLiveInputActive) && (
            <div className="hidden 2xl:flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-950/40 text-[11px] border border-slate-800/80 max-w-[130px] truncate">
              <span className="text-slate-500">Twin:</span>
              <strong className="font-bold text-slate-200 truncate">{activePatientName}</strong>
            </div>
          )}

          {/* Contextual Alert Indicator */}
          {hasTrajectoryAlert && (
            <button
              onClick={onOpenCopilot}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold transition-colors cursor-pointer animate-pulse shrink-0"
              title="Velocity Trigger Detected: Click to Consult AI"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="max-w-[100px] truncate">{alertSummary || 'Alert'}</span>
            </button>
          )}

          {/* Action 1: Upload Ultrasound Scan */}
          <button
            onClick={onOpenUpload}
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/70 transition-colors cursor-pointer shrink-0"
            title="Upload Scan (DICOM, PDF, report)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Upload Scan</span>
          </button>

          {/* Action 2: Platform Tour Guide */}
          {onStartWalkthrough && (
            <button
              onClick={onStartWalkthrough}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-teal-500/40 bg-teal-950/40 transition-colors cursor-pointer shrink-0"
              title="Start Interactive Platform Tour"
            >
              <Play className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Tour</span>
            </button>
          )}

          {/* Action 3: AI Copilot Support */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Consult AI Decision Support Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200 shrink-0" />
            <span className="hidden md:inline">AI Decision Support</span>
            <span className="md:hidden">AI</span>
          </button>

          {/* Visual Divider */}
          <span className="h-5 w-px bg-slate-800 hidden sm:inline" />

          {/* Consolidated Clinician Selector Dropdown */}
          <div className="relative shrink-0">
            <div
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
              title="Click to switch clinician or toggle role"
            >
              <div
                className={`w-7 h-7 rounded bg-teal-700 border border-teal-600 hover:bg-teal-600 text-white text-xs font-bold shrink-0 flex items-center justify-center ${
                  currentUser.role === 'admin' ? 'bg-amber-700 border-amber-600 hover:bg-amber-600' : ''
                }`}
              >
                {currentUser.role === 'admin' ? 'AD' : 'DR'}
              </div>
              <div className="hidden xl:block text-left text-[11px] leading-tight">
                <div className="font-bold text-slate-200 max-w-[110px] truncate">
                  {currentUser.name.replace('Dr. ', '')}
                </div>
                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-teal-400">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Clinician switch dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-850 pb-1.5 mb-1">
                  <span>Switch Clinician</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchRole(currentUser.role === 'doctor' ? 'admin' : 'doctor');
                    }}
                    className="text-teal-400 hover:text-teal-300 flex items-center space-x-1 cursor-pointer font-bold"
                    title="Toggle Doctor/Admin Role"
                  >
                    <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                    <span>Toggle Role</span>
                  </button>
                </div>
                {usersList.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (onSwitchUser) onSwitchUser(u.id);
                        else onSwitchRole(u.role);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-950 text-teal-300 font-bold border border-teal-800'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div
                          className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-amber-900 text-amber-200'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {u.role === 'admin' ? 'AD' : 'DR'}
                        </div>
                        <span className="truncate">{u.label}</span>
                      </div>
                      {isCurrent && <Check className="w-3 h-3 text-teal-400 shrink-0" />}
                    </button>
                  );
                })}

                {onStartWalkthrough && (
                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onStartWalkthrough();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center space-x-2 text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer font-bold"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span>Start Platform Tour</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <div className="lg:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Toggle Mobile Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl p-3 space-y-1 z-40 animate-slide-in">
          {/* Overview */}
          <button
            onClick={() => handleTabClick('home')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isDashboardActive ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-teal-400" />
            <span>Project Overview</span>
          </button>

          {/* Clinical Twins */}
          <button
            onClick={() => handleTabClick('clinical')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
              isClinicalActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Clinical Twins</span>
            </div>
            {highRiskCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300">
                {highRiskCount} alert{highRiskCount > 1 ? 's' : ''}
              </span>
            )}
          </button>

          {/* Live Ingestion */}
          <button
            onClick={() => handleTabClick('live-input')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isLiveInputActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-teal-400" />
            <span>Live Ingestion</span>
          </button>

          {/* Growth Analytics */}
          <button
            onClick={() => handleTabClick('analytics')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isInsightsActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LineChart className="w-4 h-4 text-teal-400" />
            <span>Growth Analytics</span>
          </button>

          {/* Medications */}
          <button
            onClick={() => handleTabClick('medications')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isMedicationsActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Pill className="w-4 h-4 text-teal-400" />
            <span>Medications</span>
          </button>

          {/* ML Pipeline */}
          <button
            onClick={() => handleTabClick('research')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isResearchActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>ML Pipeline</span>
          </button>

          {/* System & Security */}
          <button
            onClick={() => handleTabClick('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              isSettingsActive ? 'bg-slate-800 text-teal-300 font-bold border border-slate-750' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>System & Security</span>
          </button>

          {/* Interactive Tour (Mobile) */}
          {onStartWalkthrough && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onStartWalkthrough();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-xs"
              >
                <Play className="w-4 h-4 text-white" />
                <span>Start Platform Tour</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

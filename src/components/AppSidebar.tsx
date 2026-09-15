import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Radio,
  LineChart,
  Pill,
  Cpu,
  Shield,
  Sparkles,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Play,
  User as UserIcon,
  AlertTriangle,
  Database,
  Check,
  ChevronDown,
  RefreshCw,
  Heart,
  ShieldCheck,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  ShieldAlert,
  Users
} from 'lucide-react';
import { User, UserRole } from '../types';
import { AppTab } from './AppNavigation';
import { TwinSubPage } from './PregnancyTwinView';
import { getOfflineQueue, getSyncedCount } from '../utils/offlineSync';

interface AppSidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  onSwitchUser?: (userId: string) => void;
  onOpenCopilot: () => void;
  onOpenUpload: () => void;
  highRiskCount: number;
  activePatientName?: string;
  hasTrajectoryAlert?: boolean;
  alertSummary?: string;
  onStartWalkthrough?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeSubPage?: TwinSubPage;
  onSelectSubPage?: (subPage: TwinSubPage) => void;
  visitsCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onSwitchRole,
  onSwitchUser,
  onOpenCopilot,
  onOpenUpload,
  highRiskCount,
  activePatientName,
  hasTrajectoryAlert,
  alertSummary,
  onStartWalkthrough,
  isCollapsed = false,
  onToggleCollapse,
  activeSubPage,
  onSelectSubPage,
  visitsCount = 5
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);

  // Sync state tracking
  const [queueSize, setQueueSize] = useState<number>(0);
  const [syncedCount, setSyncedCount] = useState<number>(0);

  useEffect(() => {
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

  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const isDashboardActive = activeTab === 'home';
  const isClinicalActive = activeTab === 'clinical' || activeTab === 'records' || activeTab === 'simulation';
  const isLiveInputActive = activeTab === 'live-input';
  const isAnalyticsActive = activeTab === 'analytics';
  const isMedicationsActive = activeTab === 'medications';
  const isResearchActive = activeTab === 'research';
  const isSettingsActive = activeTab === 'settings' || activeTab === 'admin';

  const navItems = [
    {
      id: 'home' as AppTab,
      label: 'Overview Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      isActive: isDashboardActive,
      badge: null,
      color: 'text-teal-400'
    },
    {
      id: 'clinical' as AppTab,
      label: 'Clinical Digital Twins',
      shortLabel: 'Twins',
      icon: Activity,
      isActive: isClinicalActive,
      badge: highRiskCount > 0 ? `${highRiskCount} Alert${highRiskCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
      color: 'text-teal-400'
    },
    {
      id: 'live-input' as AppTab,
      label: 'Live Input Studio',
      shortLabel: 'Live Input',
      icon: Radio,
      isActive: isLiveInputActive,
      badge: null,
      color: 'text-emerald-400'
    },
    {
      id: 'analytics' as AppTab,
      label: 'Growth Analytics',
      shortLabel: 'Analytics',
      icon: LineChart,
      isActive: isAnalyticsActive,
      badge: null,
      color: 'text-sky-400'
    },
    {
      id: 'medications' as AppTab,
      label: 'Medications Studio',
      shortLabel: 'Meds',
      icon: Pill,
      isActive: isMedicationsActive,
      badge: null,
      color: 'text-indigo-400'
    },
    {
      id: 'research' as AppTab,
      label: 'ML Pipeline & XGBoost',
      shortLabel: 'ML Pipeline',
      icon: Cpu,
      isActive: isResearchActive,
      badge: null,
      color: 'text-purple-400'
    },
    {
      id: 'settings' as AppTab,
      label: 'System & Security',
      shortLabel: 'Security',
      icon: Shield,
      isActive: isSettingsActive,
      badge: null,
      color: 'text-amber-400'
    }
  ];

  const availableRoles: { role: UserRole; label: string }[] = [
    { role: 'doctor', label: 'Doctor (MFM Specialist)' },
    { role: 'admin', label: 'System Administrator' }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0 left-0 shadow-xl select-none overflow-hidden`}
    >
      {/* Top Section: Brand + Collapse Toggle */}
      <div className="flex flex-col border-b border-slate-800/80">
        <div className="h-16 px-3.5 flex items-center justify-between">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center space-x-2.5 text-left group cursor-pointer focus:outline-none overflow-hidden ${
              collapsed ? 'justify-center w-full' : ''
            }`}
            title="PregnancyTwin AI Home"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs transition-colors shrink-0">
              PT
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center space-x-1 font-extrabold text-sm tracking-tight text-white">
                  <span>PregnancyTwin</span>
                  <span className="text-[10px] bg-teal-950 text-teal-300 font-mono px-1 py-0.2 rounded border border-teal-800">
                    AI
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium truncate">Maternal-Fetal Clinical AI</p>
              </div>
            )}
          </button>

          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Collapse Navigation Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand Toggle when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border-t border-slate-800/60 transition-colors cursor-pointer"
            title="Expand Navigation Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Middle Section: Scrollable Navigation Menu */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
        
        {/* Navigation Section Title */}
        {!collapsed && (
          <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                item.isActive
                  ? 'bg-teal-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? 'text-white' : item.color}`} />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor} shrink-0 ml-1`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip on Collapsed Hover */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}

        {/* Trajectory Alert Widget (if active alert) */}
        {hasTrajectoryAlert && !collapsed && (
          <div className="pt-3 px-1">
            <button
              onClick={onOpenCopilot}
              className="w-full text-left p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 border border-amber-800 text-amber-200 space-y-1 transition-colors cursor-pointer animate-pulse"
            >
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Clinical Alert</span>
              </div>
              <p className="text-[11px] leading-tight font-medium text-amber-100 line-clamp-2">
                {alertSummary || 'Velocity Drop Detected'}
              </p>
              <div className="text-[10px] text-teal-300 font-bold underline pt-0.5">
                Investigate in AI Copilot &rarr;
              </div>
            </button>
          </div>
        )}

        {/* Active Twin Context Box & Navigation Menu */}
        {activePatientName && !collapsed && (
          <div className="pt-3 px-1">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
              {/* Consolidated Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="font-bold text-slate-100 text-[11px] truncate">{activePatientName}</span>
                </div>
                <span className="text-[9px] text-teal-400 font-bold shrink-0 bg-teal-950/60 border border-teal-900/60 px-1.5 py-0.2 rounded">
                  32w 4d
                </span>
              </div>

              {/* Navigation Menu Links */}
              <div className="space-y-0.5">
                {[
                  {
                    id: 'overview' as TwinSubPage,
                    label: 'Twin Dashboard',
                    icon: Activity,
                    badge: hasTrajectoryAlert ? 'Alert' : undefined,
                  },
                  {
                    id: 'clusters' as TwinSubPage,
                    label: 'Critical Cluster Alerts',
                    icon: ShieldAlert,
                    badge: 'Cluster Alpha',
                  },
                  {
                    id: 'cohort' as TwinSubPage,
                    label: 'Active Pregnancies in Risk Group',
                    icon: Users,
                    badge: '6 Active',
                  },
                  {
                    id: 'hemodynamics' as TwinSubPage,
                    label: 'Fetal Hemodynamics',
                    icon: Heart,
                    badge: 'Doppler Active',
                  },
                  {
                    id: 'guidelines' as TwinSubPage,
                    label: 'Consensus Guidelines Auditor',
                    icon: ShieldCheck,
                    badge: 'ACOG Audit',
                  },
                  {
                    id: 'delivery' as TwinSubPage,
                    label: 'Delivery Prediction',
                    icon: Calendar,
                    badge: 'XGBoost Active',
                  },
                  {
                    id: 'medications' as TwinSubPage,
                    label: 'Medications Hub',
                    icon: Pill,
                    badge: 'Active Regimens',
                  },
                  {
                    id: 'analytics' as TwinSubPage,
                    label: 'Modeling & Sensitivity',
                    icon: TrendingUp,
                    badge: `${visitsCount} Scans`,
                  },
                  {
                    id: 'records' as TwinSubPage,
                    label: 'Ultrasound Checkpoints',
                    icon: FileSpreadsheet,
                    badge: `${visitsCount} Scans`,
                  }
                ].map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeTab === 'clinical' && activeSubPage === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSelectTab('clinical');
                        onSelectSubPage?.(sub.id);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.25 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer border ${
                        isSubActive
                          ? 'bg-teal-900/50 border-teal-800 text-teal-300 font-bold'
                          : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-teal-400' : 'text-slate-500'}`} />
                        <span className="truncate">{sub.label}</span>
                      </div>
                      {sub.badge && (
                        <span className="text-[7.5px] font-black uppercase tracking-wider px-1 bg-slate-850 text-slate-400 border border-slate-800 rounded select-none shrink-0 scale-90">
                          {sub.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Database Sync Status Widget */}
        {!collapsed && (
          <div className="pt-2 px-1">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center space-x-1">
                  <Database className="w-3 h-3 text-teal-400" />
                  <span>Database Sync</span>
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${queueSize > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-bold">{syncedCount} Synced</span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${queueSize > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-500'}`}>
                  {queueSize} Queued
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        {!collapsed && (
          <div className="pt-4 px-1 space-y-2 border-t border-slate-800/80 mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
              Quick Actions
            </div>

            <button
              onClick={onOpenCopilot}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200 shrink-0" />
              <span>AI Decision Support</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Upload Scan</span>
            </button>

            {onStartWalkthrough && (
              <button
                onClick={onStartWalkthrough}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 text-xs font-semibold border border-teal-800/60 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Start Interactive Tour</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: User Profile & Role Selector */}
      <div className="border-t border-slate-800/80 p-2 bg-slate-950/40 relative">
        <button
          onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
          className={`w-full flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Switch Doctor / User Role"
        >
          <div className="w-8 h-8 rounded-full bg-teal-900 text-teal-200 border border-teal-700 font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser.role === 'doctor' ? 'DR' : 'AD'}
          </div>

          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-teal-400 font-medium capitalize truncate">
                {currentUser.role === 'doctor' ? 'MFM Specialist' : currentUser.role}
              </div>
            </div>
          )}

          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </button>

        {/* Role Menu Popover */}
        {isRoleMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
              Switch Role Context
            </div>
            {availableRoles.map((r) => (
              <button
                key={r.role}
                onClick={() => {
                  onSwitchRole(r.role);
                  setIsRoleMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  currentUser.role === r.role
                    ? 'bg-teal-950 text-teal-300 font-bold border border-teal-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{r.label}</span>
                {currentUser.role === r.role && <Check className="w-3.5 h-3.5 text-teal-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

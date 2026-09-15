/**
 * PregnancyTwin AI - Streamlined Clinical Navigation Header
 * Focused on core clinical workflows with an intuitive "More & Settings" dropdown menu.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Shield,
  BookOpen,
  FlaskConical,
  Sparkles,
  RefreshCw,
  UploadCloud,
  Home,
  LineChart,
  ScanLine,
  Layers,
  ChevronDown,
  Check,
  UserCheck,
  MoreVertical,
  Sliders
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  onSwitchUser?: (userId: string) => void;
  activeTab: 'home' | 'clinical' | 'live-input' | 'analytics' | 'research' | 'admin';
  onSelectTab: (tab: 'home' | 'clinical' | 'live-input' | 'analytics' | 'research' | 'admin') => void;
  onOpenKnowledge: () => void;
  onOpenCopilot: () => void;
  onOpenUpload?: () => void;
  highRiskCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  onSwitchUser,
  activeTab,
  onSelectTab,
  onOpenKnowledge,
  onOpenCopilot,
  onOpenUpload,
  highRiskCount
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const usersList = [
    { id: 'doc-001', name: 'Dr. Alistair Vance, MD', role: 'doctor' as const, label: 'Dr. Vance (MFM Specialist)' },
    { id: 'doc-002', name: 'Dr. Marcus Reed, MD', role: 'doctor' as const, label: 'Dr. Reed (Obstetrician)' },
    { id: 'usr-admin', name: 'Chief Clinical Administrator', role: 'admin' as const, label: 'Administrator (Hospital-wide)' }
  ];

  // Close menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  // Is active tab one of the secondary items?
  const isSecondaryActive = activeTab === 'research' || activeTab === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-200 shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <button 
          id="btn-nav-brand"
          onClick={() => onSelectTab('home')} 
          className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer shrink-0"
          title="Return to Home Dashboard"
        >
          <div className="w-8 h-8 bg-teal-600 group-hover:bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-xs transition-colors">
            PT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
                PregnancyTwin AI
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800">
                Decision Support
              </span>
            </div>
            <p className="text-[10px] tracking-wide text-slate-400 font-medium hidden md:block">
              Maternal-Fetal Longitudinal Trajectory
            </p>
          </div>
        </button>

        {/* Center: Streamlined Top-Level Clinical Tabs (Only Core Workflows) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-home"
            onClick={() => onSelectTab('home')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            id="tab-clinical"
            onClick={() => onSelectTab('clinical')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'clinical'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Patients &amp; Twin</span>
            {highRiskCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" title={`${highRiskCount} High Risk Alert`} />
            )}
          </button>

          <button
            id="tab-live-input"
            onClick={() => onSelectTab('live-input')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'live-input'
                ? 'bg-teal-900/60 text-teal-300 border border-teal-700/70 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5 text-teal-400" />
            <span>Live Scan &amp; Input</span>
          </button>

          <button
            id="tab-analytics"
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white border border-slate-700 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Growth Curves</span>
          </button>
        </nav>

        {/* Right: Primary Clinical Action & Clean More/Settings Menu */}
        <div className="flex items-center space-x-2">
          
          {/* Critical Clinical Action: AI Decision Support Copilot */}
          <button
            id="btn-open-copilot-header"
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Open Gemini AI Clinical Decision Support Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span className="hidden sm:inline">AI Decision Support</span>
            <span className="sm:hidden">AI Copilot</span>
          </button>

          {/* Unified "More & Settings" Dropdown (Consolidates Guidelines, Upload, R&D, Audit, and RBAC) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              id="btn-nav-more-menu"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isMoreOpen || isSecondaryActive
                  ? 'bg-slate-800 text-white border-slate-700 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-800'
              }`}
              title="More Clinical Tools, Plans & Clinician Settings"
            >
              <span className="hidden sm:inline">More</span>
              <MoreVertical className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isMoreOpen && (
              <div 
                id="popover-more-menu"
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 py-2 text-slate-200 overflow-hidden"
              >
                {/* Section 1: Secondary Clinical Tools */}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Clinical Tools &amp; Resources
                </div>

                {onOpenUpload && (
                  <button
                    id="menu-item-upload"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenUpload();
                    }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center space-x-2.5 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Upload Ultrasound Scan</div>
                      <div className="text-[10px] text-slate-400">DICOM, Report image, or Biometry PDF</div>
                    </div>
                  </button>
                )}

                <button
                  id="menu-item-guidelines"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenKnowledge();
                  }}
                  className="w-full px-3 py-2 text-left text-xs flex items-center space-x-2.5 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Obstetric Guidelines</div>
                    <div className="text-[10px] text-slate-400">ISUOG, ACOG, and SMFM protocols</div>
                  </div>
                </button>

                <div className="my-1.5 border-t border-slate-800" />

                {/* Section 2: Architecture, Scientific Engine & Hospital Audit */}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  System Architecture &amp; R&amp;D
                </div>

                <button
                  id="menu-item-research"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onSelectTab('research');
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center space-x-2.5 hover:bg-slate-800 transition-colors cursor-pointer ${
                    activeTab === 'research' ? 'bg-slate-800/80 text-teal-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-semibold">ROC Trajectory Engine</div>
                    <div className="text-[10px] text-slate-400">Scientific validation &amp; benchmark metrics</div>
                  </div>
                </button>

                <button
                  id="menu-item-admin"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onSelectTab('admin');
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center space-x-2.5 hover:bg-slate-800 transition-colors cursor-pointer ${
                    activeTab === 'admin' ? 'bg-amber-950/60 text-amber-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Hospital Clinical Audit</div>
                    <div className="text-[10px] text-slate-400">Governance &amp; physician override logs</div>
                  </div>
                </button>

                <div className="my-1.5 border-t border-slate-800" />

                {/* Section 3: Clinician Profile & Role Switcher */}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Clinician Role (RBAC)</span>
                  <button
                    onClick={() => onSwitchRole(currentUser.role === 'doctor' ? 'admin' : 'doctor')}
                    className="text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1 cursor-pointer"
                    title="Toggle Doctor / Administrator Role"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Toggle</span>
                  </button>
                </div>

                <div className="px-2 space-y-1">
                  {usersList.map((u) => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (onSwitchUser) onSwitchUser(u.id);
                          else onSwitchRole(u.role);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent ? 'bg-teal-950/80 text-teal-300 font-bold border border-teal-800/80' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${
                            u.role === 'admin' ? 'bg-amber-900 text-amber-200' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {u.role === 'admin' ? 'AD' : 'DR'}
                          </div>
                          <span className="truncate">{u.label}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Clinician Avatar / Profile Pill */}
          <div 
            className="flex items-center space-x-1.5 pl-1.5 border-l border-slate-800"
            title={`Active User: ${currentUser.name} (${currentUser.role})`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold ${
              currentUser.role === 'admin' ? 'bg-amber-700' : 'bg-slate-800 text-teal-300 border border-slate-700'
            }`}>
              {currentUser.role === 'admin' ? 'AD' : 'DR'}
            </div>
            <span className="text-xs font-semibold text-slate-300 hidden xl:inline max-w-[120px] truncate">
              {currentUser.name.split(' ')[1] || currentUser.name}
            </span>
          </div>

        </div>
      </div>

      {/* Mobile Subnav (Strictly 4 Core Tabs + More) */}
      <div className="md:hidden flex items-center justify-between overflow-x-auto space-x-1 bg-slate-950 px-2 py-1.5 border-t border-slate-800 text-xs">
        <button
          onClick={() => onSelectTab('home')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'home' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('clinical')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'clinical' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Twins
        </button>
        <button
          onClick={() => onSelectTab('live-input')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'live-input' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Live Input
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'analytics' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Curves
        </button>
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium flex items-center space-x-1 ${
            isSecondaryActive ? 'bg-slate-800 text-teal-300 font-bold' : 'text-slate-400'
          }`}
        >
          <span>More</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};

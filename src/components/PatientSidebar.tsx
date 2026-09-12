/**
 * PregnancyTwin AI - Streamlined Patient Cohort Sidebar
 * Collapsible, high-density patient navigation for clinical workflows
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Activity,
  Sliders,
  UploadCloud,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Shield,
  Sparkles,
  Layers,
  Clock,
  Calendar,
  Zap,
  Scale,
  HeartPulse,
  Baby,
  Stethoscope,
  Info,
  User as UserIcon
} from 'lucide-react';
import { Patient, RiskLevel, User, VisitMeasurement } from '../types';
import { INITIAL_VISITS } from '../data/mockData';

interface PatientSidebarProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenUpload: (patientId: string) => void;
  onNavigateToLiveInput?: (patientId: string) => void;
  currentUser?: User;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  visitsRecord?: Record<string, VisitMeasurement[]>;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenUpload,
  onNavigateToLiveInput,
  currentUser,
  isCollapsed = false,
  onToggleCollapse,
  visitsRecord
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | RiskLevel>('ALL');

  // Quick-Summary hover state
  const [hoveredPatient, setHoveredPatient] = useState<{
    patient: Patient;
    rect: DOMRect;
  } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (patient: Patient, element: HTMLElement) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    const rect = element.getBoundingClientRect();
    // Snappy 90ms debounce to prevent flashing when cursor is moving rapidly
    hoverTimerRef.current = setTimeout(() => {
      setHoveredPatient({ patient, rect });
    }, 90);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredPatient(null);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      (p.assignedDoctorName && p.assignedDoctorName.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusDot = (status: RiskLevel) => {
    switch (status) {
      case 'HIGH':
        return 'bg-rose-500 ring-2 ring-rose-200';
      case 'WATCH':
        return 'bg-amber-500 ring-2 ring-amber-200';
      case 'LOW':
      default:
        return 'bg-emerald-500 ring-2 ring-emerald-200';
    }
  };

  const getStatusBadge = (status: RiskLevel) => {
    switch (status) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            HIGH
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            WATCH
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            NORMAL
          </span>
        );
    }
  };

  const getTrajectorySummary = (cat: string) => {
    switch (cat) {
      case 'FLUID_DECLINE':
        return { label: 'Fluid Drop (5.4→3.1cm)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'GROWTH_DEVIATION':
        return { label: 'Growth Decel (42%→18%)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'ACCELERATED_DECLINE':
        return { label: 'Multi-Factor Decline', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      default:
        return { label: 'Normative Concordant', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const getTrimesterText = (weeks: number) => {
    if (weeks < 13) return '1st Trimester (0–12w)';
    if (weeks < 28) return '2nd Trimester (13–27w)';
    return '3rd Trimester (28–40w)';
  };

  const getPatientLastVisit = (patientId: string): VisitMeasurement | null => {
    const visits = visitsRecord?.[patientId] || INITIAL_VISITS[patientId];
    if (visits && visits.length > 0) {
      return visits[visits.length - 1];
    }
    return null;
  };

  const getTriageGuidance = (status: RiskLevel) => {
    switch (status) {
      case 'HIGH':
        return {
          title: 'HIGH ALERT • URGENT REVIEW',
          action: 'Immediate trajectory investigation & Doppler biometry evaluation indicated.',
          badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/60',
          dot: 'bg-rose-500 animate-pulse',
          containerBorder: 'border-rose-500/40'
        };
      case 'WATCH':
        return {
          title: 'WATCH STATUS • SURVEILLANCE',
          action: 'Shortened scan interval recommended; track amniotic fluid & fetal growth velocity.',
          badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
          dot: 'bg-amber-500',
          containerBorder: 'border-amber-500/40'
        };
      case 'LOW':
      default:
        return {
          title: 'NORMAL ROUTINE • CONCORDANT',
          action: 'Standard antenatal protocol; biometry and fluid volumes within normative bounds.',
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60',
          dot: 'bg-emerald-500',
          containerBorder: 'border-emerald-500/40'
        };
    }
  };

  const getAgeRiskContext = (age: number) => {
    if (age >= 40) {
      return {
        label: 'Very Advanced Maternal Age',
        category: 'VAMA (≥40)',
        isRisk: true,
        riskTier: 'HIGH',
        pillBg: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
        textClass: 'text-rose-400 font-bold',
        clinicalPearl: 'Very Advanced Maternal Age (≥40y) correlates with elevated risk for aneuploidy, gestational hypertension, and uteroplacental vascular resistance.'
      };
    }
    if (age >= 35) {
      return {
        label: 'Advanced Maternal Age',
        category: 'AMA (≥35)',
        isRisk: true,
        riskTier: 'WATCH',
        pillBg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
        textClass: 'text-amber-400 font-bold',
        clinicalPearl: 'Advanced Maternal Age (≥35y) warrants heightened vigilance for preeclampsia, gestational diabetes, and fetal growth deceleration.'
      };
    }
    if (age <= 19) {
      return {
        label: 'Adolescent Pregnancy',
        category: 'Adolescent (≤19)',
        isRisk: true,
        riskTier: 'WATCH',
        pillBg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
        textClass: 'text-amber-400 font-bold',
        clinicalPearl: 'Adolescent maternal age is an independent risk factor for preterm delivery, hypertensive spectrum disorders, and fetal growth restriction.'
      };
    }
    return {
      label: 'Optimal Reproductive Age',
      category: 'Standard Age (20–34)',
      isRisk: false,
      riskTier: 'LOW',
      pillBg: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
      textClass: 'text-slate-300 font-medium',
      clinicalPearl: 'Standard maternal baseline demographic risk profile.'
    };
  };

  // If collapsed: render sleek icon rail
  if (isCollapsed) {
    return (
      <div className="w-14 bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center space-y-3 shadow-2xs shrink-0 self-stretch min-h-[480px]">
        {onToggleCollapse && (
          <button
            id="btn-expand-patient-sidebar"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Expand Patient Roster Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-teal-700" />
          </button>
        )}

        <div className="w-8 h-px bg-slate-200 my-1" />

        <div className="flex-1 flex flex-col space-y-2.5 w-full items-center">
          {patients.map((p) => {
            const isSelected = p.id === selectedPatientId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                onMouseEnter={(e) => handleMouseEnter(p, e.currentTarget)}
                onMouseLeave={handleMouseLeave}
                className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-400 ring-offset-1'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title={`${p.name} (GA: ${p.currentGestationalAgeWeeks}w ${p.currentGestationalAgeDays}d • ${p.status} Alert)`}
              >
                <span>{p.name.charAt(0)}</span>
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getStatusDot(p.status)}`} />
              </button>
            );
          })}
        </div>

        {/* Global Quick-Summary Tooltip Portal (Collapsed Mode) */}
        {renderQuickSummaryPortal()}
      </div>
    );
  }

  // Expanded Sidebar View
  return (
    <aside className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs shrink-0 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Patient Roster
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
            {filteredPatients.length}
          </span>
        </div>

        {onToggleCollapse && (
          <button
            id="btn-collapse-patient-sidebar"
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer hidden lg:block"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Benchmark Presets: Quick 1-click cohort jumps */}
      <div className="p-2.5 border-b border-slate-200 bg-slate-50/40">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Clinical Trajectory Benchmarks</span>
          <span className="text-[9px] text-teal-700 font-medium font-mono">Hover for Triage</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          {(() => {
            const ptA = patients.find(p => p.id === 'pat-001');
            const ptB = patients.find(p => p.id === 'pat-002');
            const ptC = patients.find(p => p.id === 'pat-003');

            return (
              <>
                <button
                  onClick={() => onSelectPatient('pat-001')}
                  onMouseEnter={(e) => ptA && handleMouseEnter(ptA, e.currentTarget)}
                  onMouseLeave={handleMouseLeave}
                  className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedPatientId === 'pat-001'
                      ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 font-bold shadow-2xs ring-1 ring-emerald-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Patient A: Normal Longitudinal Concordance"
                >
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-semibold">Pt A</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Normal</div>
                </button>

                <button
                  onClick={() => onSelectPatient('pat-002')}
                  onMouseEnter={(e) => ptB && handleMouseEnter(ptB, e.currentTarget)}
                  onMouseLeave={handleMouseLeave}
                  className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedPatientId === 'pat-002'
                      ? 'bg-rose-50/90 text-rose-950 border-rose-300 font-bold shadow-2xs ring-1 ring-rose-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Patient B: Oligohydramnios fluid drop"
                >
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate font-semibold">Pt B</span>
                  </div>
                  <div className="text-[10px] text-rose-700 font-medium">Fluid Drop</div>
                </button>

                <button
                  onClick={() => onSelectPatient('pat-003')}
                  onMouseEnter={(e) => ptC && handleMouseEnter(ptC, e.currentTarget)}
                  onMouseLeave={handleMouseLeave}
                  className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedPatientId === 'pat-003'
                      ? 'bg-amber-50/90 text-amber-950 border-amber-300 font-bold shadow-2xs ring-1 ring-amber-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Patient C: Fetal Growth Restriction velocity deceleration"
                >
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate font-semibold">Pt C</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">Growth FGR</div>
                </button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Search and Risk Filters */}
      <div className="p-2.5 border-b border-slate-200 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            id="input-sidebar-search"
            type="text"
            placeholder="Search patient, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-md text-xs border border-slate-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto text-[11px]">
          {(['ALL', 'HIGH', 'WATCH', 'LOW'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                filter === f
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'LOW' ? 'Normal' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Patient Maternal Weight Trend Sparkline */}
      {(() => {
        const selectedPatient = patients.find(p => p.id === selectedPatientId);
        if (!selectedPatient) return null;

        const visits = visitsRecord?.[selectedPatientId] || INITIAL_VISITS[selectedPatientId] || [];
        if (visits.length === 0) return null;

        // Last 5 visits in chronological order (visits are already sorted chronologically)
        const last5Visits = visits.slice(-5);
        
        // Fictional realistic weight calculator based on baseline BMI & GA progression
        const getWeightForVisit = (p: Patient, v: VisitMeasurement): number => {
          const heightSq = 2.72; // Proxy for height (~1.65m)
          const bmi = p.maternalBmi || 22.0;
          const startingWeight = bmi * heightSq;
          const gaWeeks = v.gestationalAgeWeeks + (v.gestationalAgeDays / 7);
          let weightGain = 0;
          if (gaWeeks <= 12) {
            weightGain = (gaWeeks / 12) * 1.5;
          } else {
            weightGain = 1.5 + (gaWeeks - 12) * 0.45;
          }
          const patientFluctuation = p.id === 'pat-002' ? 1.2 : p.id === 'pat-003' ? -0.8 : p.id === 'pat-004' ? 2.5 : 0;
          const visitFluctuation = Math.sin(v.visitNumber * 1.7) * 0.4;
          return Math.round((startingWeight + weightGain + patientFluctuation + visitFluctuation) * 10) / 10;
        };

        const weightData = last5Visits.map(v => ({
          visitNumber: v.visitNumber,
          date: v.date,
          gestationalAge: `${v.gestationalAgeWeeks}w${v.gestationalAgeDays}d`,
          weight: getWeightForVisit(selectedPatient, v)
        }));

        const weights = weightData.map(d => d.weight);
        const latestWeight = weights[weights.length - 1];
        const earliestWeight = weights[0];
        const weightDelta = Math.round((latestWeight - earliestWeight) * 10) / 10;
        const deltaSign = weightDelta >= 0 ? '+' : '';

        const minWeight = Math.min(...weights) - 0.5;
        const maxWeight = Math.max(...weights) + 0.5;
        const range = maxWeight - minWeight || 1;

        // Sparkline SVG metrics
        const width = 140;
        const height = 30;
        const padding = 3;

        const points = weightData.map((d, index) => {
          const x = padding + (index / (weightData.length - 1 || 1)) * (width - 2 * padding);
          const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
          return `${x},${y}`;
        }).join(' ');

        const areaPoints = [
          `${padding},${height}`,
          ...weightData.map((d, index) => {
            const x = padding + (index / (weightData.length - 1 || 1)) * (width - 2 * padding);
            const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
            return `${x},${y}`;
          }),
          `${width - padding},${height}`
        ].join(' ');

        return (
          <div className="p-2.5 border-b border-slate-200 bg-teal-50/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5 text-teal-600" />
                <span>Maternal Weight trend</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono font-semibold">
                Selected Patient ({weightData.length} scans)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white/70 rounded-lg p-2 border border-slate-100 shadow-3xs">
              <div className="space-y-0.5">
                <div className="text-sm font-black font-mono text-slate-900 leading-none">
                  {latestWeight} <span className="text-[9px] font-bold text-slate-500">kg</span>
                </div>
                <div className="text-[10px] flex items-center gap-1 font-medium text-slate-500">
                  <span className={`font-bold ${weightDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {deltaSign}{weightDelta} kg
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[9px] font-semibold text-slate-600">{selectedPatient.name.split(' ')[0]}</span>
                </div>
              </div>

              {/* Sparkline SVG */}
              <div className="relative group/sparkline" title="Hover plot points to inspect clinical records">
                <svg width={width} height={height} className="overflow-visible">
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill Area */}
                  <polygon
                    points={areaPoints}
                    fill="url(#weightGrad)"
                  />
                  
                  {/* Stroke Line */}
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />

                  {/* Nodes / Dots */}
                  {weightData.map((d, index) => {
                    const x = padding + (index / (weightData.length - 1 || 1)) * (width - 2 * padding);
                    const y = height - padding - ((d.weight - minWeight) / range) * (height - 2 * padding);
                    const isLatest = index === weightData.length - 1;
                    return (
                      <g key={index} className="cursor-pointer group/dot">
                        <circle
                          cx={x}
                          cy={y}
                          r={isLatest ? "3" : "2"}
                          fill={isLatest ? "#0d9488" : "#ffffff"}
                          stroke="#0d9488"
                          strokeWidth="1.2"
                        />
                        <title>
                          Visit #{d.visitNumber}: {d.weight} kg on {d.date} ({d.gestationalAge})
                        </title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Timeline Sparkline Limits */}
            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              <span>{weightData[0]?.gestationalAge}</span>
              <span>→</span>
              <span>{weightData[weightData.length - 1]?.gestationalAge}</span>
            </div>
          </div>
        );
      })()}

      {/* Patient Cards List with Quick-Summary Hover Triggers */}
      <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
        {filteredPatients.map((patient) => {
          const isSelected = patient.id === selectedPatientId;
          const trajectory = getTrajectorySummary(patient.trajectoryCategory);

          return (
            <div
              key={patient.id}
              id={`sidebar-patient-${patient.id}`}
              onClick={() => onSelectPatient(patient.id)}
              onMouseEnter={(e) => handleMouseEnter(patient, e.currentTarget)}
              onMouseLeave={handleMouseLeave}
              className={`group p-3 transition-colors cursor-pointer text-left relative ${
                isSelected
                  ? 'bg-teal-50/80 ring-1 ring-teal-500/30'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                    patient.status === 'HIGH'
                      ? 'bg-rose-100 text-rose-800'
                      : patient.status === 'WATCH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {patient.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                      <span>{patient.mrn}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-slate-700">{patient.age}y</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-1 rounded text-[9px]">
                        GA: {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {getStatusBadge(patient.status)}
                </div>
              </div>

              {/* Trajectory Category pill & Triage Quick Cue */}
              <div className="mt-2 flex items-center justify-between">
                <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${trajectory.color}`}>
                  {trajectory.label}
                </span>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {/* Subtle Quick-Summary indicator pill visible on hover */}
                  <span className="text-[9px] font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mr-1 hidden sm:flex">
                    <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                    <span>Quick Triage</span>
                  </span>

                  {onNavigateToLiveInput && (
                    <button
                      onClick={() => onNavigateToLiveInput(patient.id)}
                      className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                      title="Open Live Input Studio"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenUpload(patient.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
                    title="Upload Ultrasound File"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-xs">
            No matching patients found.
          </div>
        )}
      </div>

      {/* Clinician Roster Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 truncate">
          <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span className="truncate">{currentUser?.name || 'Dr. Vance'}</span>
        </div>
        <span className="font-semibold text-slate-600 shrink-0">
          {currentUser?.role === 'admin' ? 'Admin View' : 'My Roster'}
        </span>
      </div>

      {/* Global Quick-Summary Tooltip Portal (Expanded Mode) */}
      {renderQuickSummaryPortal()}
    </aside>
  );

  /**
   * Helper function to render the floating Quick-Summary Hover-Card Portal.
   * Uses React Portal into document.body to ensure 0 clipping from sidebar overflow.
   */
  function renderQuickSummaryPortal() {
    if (!hoveredPatient || typeof document === 'undefined') return null;

    const { patient, rect } = hoveredPatient;
    const lastVisit = getPatientLastVisit(patient.id);
    const guidance = getTriageGuidance(patient.status);
    const ageContext = getAgeRiskContext(patient.age);
    const weeksToTerm = Math.max(0, 40 - patient.currentGestationalAgeWeeks);

    const cardWidth = 380;
    const estimatedHeight = 440;

    // Viewport bound calculation
    let left = rect.right + 12;
    if (left + cardWidth > window.innerWidth - 16) {
      if (rect.left - cardWidth - 12 > 16) {
        left = rect.left - cardWidth - 12;
      } else {
        left = Math.max(16, window.innerWidth - cardWidth - 16);
      }
    }

    let top = rect.top - 8;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - estimatedHeight - 16);
    }
    if (top < 16) {
      top = 16;
    }

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          width: `${cardWidth}px`,
          zIndex: 99999,
        }}
        className="bg-slate-950 text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-700 text-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none space-y-3 text-left ring-1 ring-white/10"
      >
        {/* Top Header with Triage Pill & Last Scan Date */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-[10px] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Triage Quick-Summary</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Scan: {patient.lastVisitDate}
          </span>
        </div>

        {/* Patient Identity & Demographics */}
        <div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center space-x-2 truncate">
              <h4 className="font-extrabold text-sm text-white truncate max-w-[210px]">
                {patient.name}
              </h4>
              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${ageContext.pillBg}`}>
                {patient.age}y
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold shrink-0">
              {patient.mrn}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-2 pt-1">
            <span className="font-medium text-slate-200">
              Age: <strong className="text-white font-bold">{patient.age}y</strong> ({ageContext.label})
            </span>
            <span>•</span>
            <span>G{patient.gravidity} P{patient.parity}</span>
            {patient.maternalBmi && (
              <>
                <span>•</span>
                <span>BMI: {patient.maternalBmi}</span>
              </>
            )}
          </div>
        </div>

        {/* Primary Triage Core Box: Maternal Age, Gestational Age & Alert Status */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5 items-start">
            
            {/* 1. Maternal Age Focus (Demographic Risk Context) */}
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-cyan-400" />
                <span>Maternal Age</span>
              </span>
              <div className="text-base font-black font-mono text-white leading-tight">
                {patient.age} <span className="text-xs font-normal text-slate-400">yrs</span>
              </div>
              <p className={`text-[10px] ${ageContext.textClass} leading-tight`}>
                {ageContext.category}
              </p>
            </div>

            {/* 2. Gestational Age (GA) Focus */}
            <div className="space-y-0.5">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>Gestational Age</span>
              </span>
              <div className="text-base font-black font-mono text-teal-300 leading-tight">
                {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                {getTrimesterText(patient.currentGestationalAgeWeeks)}
              </p>
            </div>

            {/* 3. Alert Status Focus */}
            <div className="space-y-0.5 text-right">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-end gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Alert Status</span>
              </span>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wide mt-0.5 ml-auto">
                <span className={`w-2 h-2 rounded-full ${guidance.dot}`} />
                <span className={patient.status === 'HIGH' ? 'text-rose-400 font-extrabold' : patient.status === 'WATCH' ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                  {patient.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-tight">
                {weeksToTerm}w to term
              </p>
            </div>
          </div>

          {/* Demographic Clinical Risk Context Banner (When AMA or Adolescent) */}
          {ageContext.isRisk && (
            <div className="text-[10px] px-2.5 py-1.5 rounded-lg border bg-slate-950/80 border-slate-800 flex items-start space-x-2 text-slate-300">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-amber-300">{ageContext.label}: </strong>
                <span>{ageContext.clinicalPearl}</span>
              </div>
            </div>
          )}

          {/* Actionable Triage Recommendation */}
          <div className={`text-[10px] p-2 rounded-lg border font-medium ${guidance.badgeBg}`}>
            <div className="font-bold flex items-center gap-1 mb-0.5">
              <Activity className="w-3 h-3" />
              <span>{guidance.title}</span>
            </div>
            <p className="leading-snug opacity-90">{guidance.action}</p>
          </div>
        </div>

        {/* Trajectory & Clinical Indication */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider font-bold">Trajectory Behavior</span>
            <span className="text-teal-300 font-semibold">{patient.trajectoryCategory.replace('_', ' ')}</span>
          </div>
          {patient.notes && (
            <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 leading-relaxed italic">
              "{patient.notes}"
            </p>
          )}
        </div>

        {/* Last Ultrasound Vital Measurements (if recorded) */}
        {lastVisit && (
          <div className="space-y-1.5 pt-0.5">
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Latest Sonographic Checkpoint (Visit #{lastVisit.visitNumber})
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">EFW Weight</span>
                <span className="font-mono font-bold text-white">
                  {lastVisit.estimatedFetalWeight_g}g ({lastVisit.growthPercentile}%)
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Amniotic SDP</span>
                <span className="font-mono font-bold text-teal-300">
                  {lastVisit.singleDeepestPocket_cm} cm
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Fetal HR</span>
                <span className="font-mono font-bold text-white">
                  {lastVisit.fetalHeartRate_bpm} bpm
                </span>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Presentation</span>
                <span className="font-medium text-white capitalize">
                  {lastVisit.presentation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Assigned Clinician & Selection Prompt */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
          <div className="flex items-center space-x-1 truncate max-w-[210px]">
            <Stethoscope className="w-3 h-3 text-teal-500 shrink-0" />
            <span className="truncate">{patient.assignedDoctorName}</span>
          </div>
          <span className="text-teal-400 font-semibold shrink-0">Click to Inspect Twin</span>
        </div>
      </div>,
      document.body
    );
  }
};

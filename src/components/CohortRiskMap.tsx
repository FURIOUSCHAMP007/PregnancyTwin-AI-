/**
 * PregnancyTwin AI - Clinic Cohort Risk Map & Population Cluster Detector
 * Provides perinatologists and obstetricians with a real-time heat map of patient risk levels,
 * gestational-age tranches, and pathophysiology clusters across the clinic's population.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Info,
  Layers,
  Flame,
  Grid3X3,
  SlidersHorizontal,
  Stethoscope,
  Maximize2,
  FileSpreadsheet,
  X,
  Clock,
  Heart,
  ShieldAlert,
  HelpCircle,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';
import { Patient } from '../types';
import { AppTab } from './AppNavigation';
import {
  CLINIC_COHORT_POPULATION,
  HIGH_RISK_CLUSTERS,
  GESTATIONAL_TRANCHES,
  CLINICAL_PHENOTYPES,
  CohortPatient,
  CohortCluster,
  HeatMapCell,
  GestationalAgeTranche,
  ClinicalPhenotype,
  buildCohortHeatMatrix
} from '../data/cohortData';

interface CohortRiskMapProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenCopilot?: () => void;
}

type ViewMode = 'HEAT_MAP' | 'SCATTER_VELOCITY' | 'CLUSTER_TRIAGE';

export const CohortRiskMap: React.FC<CohortRiskMapProps> = ({
  patients: activePatients,
  selectedPatientId,
  onSelectPatient,
  onNavigateTab,
  onOpenCopilot
}) => {
  // Navigation & View state
  const [viewMode, setViewMode] = useState<ViewMode>('HEAT_MAP');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Cell or Cluster state for drilldown
  const [selectedCell, setSelectedCell] = useState<{
    tranche: GestationalAgeTranche;
    phenotype: ClinicalPhenotype;
  } | null>({
    tranche: '32-35w',
    phenotype: 'ACCELERATED_DECLINE'
  });

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>('cluster-late-decay');
  const [patientModal, setPatientModal] = useState<CohortPatient | null>(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

  // Filter population based on selected doctor, risk tier, and search query
  const filteredPopulation = useMemo(() => {
    return CLINIC_COHORT_POPULATION.filter(p => {
      // Doctor filter
      if (selectedDoctor !== 'ALL' && p.assignedDoctorName !== selectedDoctor) {
        return false;
      }
      // Risk tier filter
      if (selectedRiskTier !== 'ALL' && p.status !== selectedRiskTier) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesMrn = p.mrn.toLowerCase().includes(q);
        const matchesNotes = p.recentNotes.toLowerCase().includes(q);
        const matchesAlert = p.primaryAlertFactor.toLowerCase().includes(q);
        if (!matchesName && !matchesMrn && !matchesNotes && !matchesAlert) {
          return false;
        }
      }
      return true;
    });
  }, [selectedDoctor, selectedRiskTier, searchQuery]);

  // Compute 5x5 Heat Map Matrix
  const heatMatrix = useMemo(() => {
    return buildCohortHeatMatrix(filteredPopulation);
  }, [filteredPopulation]);

  // Population Analytics
  const stats = useMemo(() => {
    const total = filteredPopulation.length;
    const highRisk = filteredPopulation.filter(p => p.status === 'HIGH').length;
    const watchRisk = filteredPopulation.filter(p => p.status === 'WATCH').length;
    const lowRisk = filteredPopulation.filter(p => p.status === 'LOW').length;
    
    const avgRiskScore = total > 0
      ? Math.round(filteredPopulation.reduce((sum, p) => sum + p.riskScore, 0) / total)
      : 0;

    const avgGaWeeks = total > 0
      ? (filteredPopulation.reduce((sum, p) => sum + p.gestationalAgeWeeks, 0) / total).toFixed(1)
      : '0';

    return {
      total,
      highRisk,
      highRiskPct: total > 0 ? Math.round((highRisk / total) * 100) : 0,
      watchRisk,
      watchRiskPct: total > 0 ? Math.round((watchRisk / total) * 100) : 0,
      lowRisk,
      lowRiskPct: total > 0 ? Math.round((lowRisk / total) * 100) : 0,
      avgRiskScore,
      avgGaWeeks
    };
  }, [filteredPopulation]);

  // Active Cluster details if selected
  const activeCluster = useMemo(() => {
    if (!selectedClusterId) return null;
    return HIGH_RISK_CLUSTERS.find(c => c.id === selectedClusterId) || null;
  }, [selectedClusterId]);

  // Patients in currently selected cell or cluster
  const drilldownPatients = useMemo(() => {
    if (selectedCell) {
      return filteredPopulation.filter(
        p => p.gaTranche === selectedCell.tranche && p.clinicalPhenotype === selectedCell.phenotype
      );
    }
    if (selectedClusterId && activeCluster) {
      return filteredPopulation.filter(p => activeCluster.patientIds.includes(p.id));
    }
    return filteredPopulation.slice(0, 8);
  }, [selectedCell, selectedClusterId, activeCluster, filteredPopulation]);

  // Doctors list for filter
  const doctorsList = useMemo(() => {
    const docs = new Set(CLINIC_COHORT_POPULATION.map(p => p.assignedDoctorName));
    return Array.from(docs);
  }, []);

  // Data for bi-axial scatter plot: Growth Velocity vs AFI
  const scatterData = useMemo(() => {
    return filteredPopulation.map(p => ({
      id: p.id,
      name: p.name,
      mrn: p.mrn,
      gaWeeks: p.gestationalAgeWeeks,
      growthVelocity: p.growthVelocity, // x-axis
      latestAfi: p.latestAfi,           // y-axis
      riskScore: p.riskScore,           // z-axis for size
      status: p.status,
      phenotype: p.clinicalPhenotype,
      patientRef: p
    }));
  }, [filteredPopulation]);

  const handleSelectCell = (tranche: GestationalAgeTranche, phenotype: ClinicalPhenotype) => {
    setSelectedCell({ tranche, phenotype });
    // Check if this matches a known cluster
    const cluster = HIGH_RISK_CLUSTERS.find(
      c => c.gaTranche === tranche && c.clinicalPhenotype === phenotype
    );
    setSelectedClusterId(cluster ? cluster.id : null);
  };

  const handleSelectCluster = (cluster: CohortCluster) => {
    setSelectedClusterId(cluster.id);
    setSelectedCell({
      tranche: cluster.gaTranche,
      phenotype: cluster.clinicalPhenotype
    });
  };

  const handleDrilldownInspect = (patient: CohortPatient) => {
    onSelectPatient(patient.id);
    onNavigateTab('clinical');
  };

  return (
    <section 
      id="cohort-risk-map" 
      className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* ========================================================= */}
      {/* HEADER & VIEW TOGGLES                                     */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200/60">
              Population Health Intelligence
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              • Clinic Population Surveillance
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Cohort Risk Heat Map &amp; Cluster Detector</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Multidimensional risk surveillance across the clinic's obstetric population. Correlates gestational windows with trajectory phenotypes to detect high-risk clusters before acute decompensation.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs font-bold">
            <button
              onClick={() => setViewMode('HEAT_MAP')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'HEAT_MAP'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Heat Map Matrix</span>
            </button>

            <button
              onClick={() => setViewMode('SCATTER_VELOCITY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'SCATTER_VELOCITY'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bi-Axial Scatter</span>
            </button>

            <button
              onClick={() => setViewMode('CLUSTER_TRIAGE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CLUSTER_TRIAGE'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cluster Triage ({HIGH_RISK_CLUSTERS.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowMethodologyModal(true)}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            title="View Perinatology Clinical Methodology"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPULATION METRICS RIBBON                                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Clinic Population
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">pregnancies</span>
          </div>
          <span className="text-[9px] text-slate-400 block font-mono">Active Perinatology Service</span>
        </div>

        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center justify-between">
            <span>Critical High Risk</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-900 font-mono">{stats.highRisk}</span>
            <span className="text-[11px] font-bold text-rose-700 font-mono">({stats.highRiskPct}%)</span>
          </div>
          <span className="text-[9px] text-rose-600 block font-medium">Acute Surveillance Zone</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Elevated Watch
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-950 font-mono">{stats.watchRisk}</span>
            <span className="text-[11px] font-bold text-amber-700 font-mono">({stats.watchRiskPct}%)</span>
          </div>
          <span className="text-[9px] text-amber-600 block font-medium">Close Doppler Protocol</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Stable Concordant
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-950 font-mono">{stats.lowRisk}</span>
            <span className="text-[11px] font-bold text-emerald-700 font-mono">({stats.lowRiskPct}%)</span>
          </div>
          <span className="text-[9px] text-emerald-600 block font-medium">Physiological Baseline</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Mean Gestational Age
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 font-mono">{stats.avgGaWeeks}</span>
            <span className="text-[11px] text-slate-500 font-medium">weeks</span>
          </div>
          <span className="text-[9px] text-slate-400 block font-mono">Mid-to-Late Trimester</span>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3.5 space-y-1 shadow-3xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block flex items-center justify-between">
            <span>High-Risk Clusters</span>
            <Sparkles className="w-3 h-3 text-indigo-600" />
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-950 font-mono">{HIGH_RISK_CLUSTERS.length}</span>
            <span className="text-[11px] text-indigo-700 font-semibold">identified</span>
          </div>
          <span className="text-[9px] text-indigo-600 block font-medium">Algorithmic Detection</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & SEARCH TOOLBAR                                   */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Doctor Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-3xs">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Clinician:</span>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Clinicians (Entire Clinic)</option>
              {doctorsList.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-3xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Tier:</span>
            <select
              value={selectedRiskTier}
              onChange={(e) => setSelectedRiskTier(e.target.value)}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">Critical High Risk Only</option>
              <option value="WATCH">Elevated Watch Only</option>
              <option value="LOW">Stable Concordant Only</option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, MRN, notes..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-3xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* HIGH-PRIORITY ACTIVE CLUSTER ALERT BANNER                */}
      {/* ========================================================= */}
      <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-800 bg-rose-200/70 px-2 py-0.2 rounded border border-rose-300">
                Critical Cluster Detected
              </span>
              <span className="text-xs font-black text-rose-950">
                Cluster Alpha: Late 3rd Trimester Multi-Factor Decay (32–35w)
              </span>
            </div>
            <p className="text-xs text-rose-900/90 leading-relaxed font-medium">
              <strong>6 patients</strong> are currently exhibiting concurrent severe oligohydramnios (mean AFI 5.1 cm) and rapid Hadlock percentile collapse (&lt;10th %ile). High risk of acute placental insufficiency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSelectCluster(HIGH_RISK_CLUSTERS[0])}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Focus This Cluster</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('CLUSTER_TRIAGE')}
            className="px-3 py-2 bg-white hover:bg-rose-100/50 text-rose-900 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <span>View All Clusters</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN VIEW 1: 5x5 HEAT MAP MATRIX                          */}
      {/* ========================================================= */}
      {viewMode === 'HEAT_MAP' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <span>Interactive Matrix: Click any cell to inspect its pregnancy cohort</span>
            </div>

            {/* Heat Intensity Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Heat Index:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600 border border-rose-700 shadow-3xs" />
                <span>Critical Risk (&ge;80)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500 border border-orange-600 shadow-3xs" />
                <span>High Watch (65–79)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500 shadow-3xs" />
                <span>Moderate (45–64)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-3xs" />
                <span>Stable (&lt;45)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-50 border border-dashed border-slate-300" />
                <span className="text-slate-400 font-normal">None</span>
              </div>
            </div>
          </div>

          {/* Matrix Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200">
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider w-[240px]">
                    Clinical Risk Phenotype \ GA Tranche
                  </th>
                  {GESTATIONAL_TRANCHES.map(tranche => (
                    <th key={tranche.id} className="p-3 text-center border-l border-slate-200/80">
                      <div className="font-extrabold text-xs text-slate-900">{tranche.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{tranche.weeks}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{tranche.subLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CLINICAL_PHENOTYPES.map((pheno, rowIndex) => {
                  const rowCells = heatMatrix[rowIndex];
                  return (
                    <tr key={pheno.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Row Label */}
                      <td className="p-3.5 border-r border-slate-200/80 bg-slate-50/30">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${pheno.dotColor} shrink-0`} />
                          <span className="font-extrabold text-xs text-slate-900">
                            {pheno.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">
                          {pheno.description}
                        </p>
                      </td>

                      {/* 5 Tranche Cells */}
                      {rowCells.map((cell) => {
                        const isSelected =
                          selectedCell?.tranche === cell.gaTranche &&
                          selectedCell?.phenotype === cell.phenotype;

                        // Heat styling
                        let cellBg = 'bg-slate-50/30 text-slate-400 border border-dashed border-slate-200/70';
                        let countBadge = 'bg-slate-100 text-slate-500';
                        let isPulse = false;

                        if (cell.count > 0) {
                          switch (cell.heatLevel) {
                            case 'critical':
                              cellBg = 'bg-rose-500 text-white border border-rose-600 shadow-xs hover:bg-rose-600';
                              countBadge = 'bg-white/20 text-white font-black';
                              isPulse = true;
                              break;
                            case 'high':
                              cellBg = 'bg-orange-500 text-white border border-orange-600 shadow-xs hover:bg-orange-600';
                              countBadge = 'bg-white/20 text-white font-black';
                              break;
                            case 'watch':
                              cellBg = 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200';
                              countBadge = 'bg-amber-200/80 text-amber-900 font-bold';
                              break;
                            case 'stable':
                              cellBg = 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100';
                              countBadge = 'bg-emerald-100 text-emerald-800 font-bold';
                              break;
                          }
                        }

                        return (
                          <td 
                            key={cell.gaTranche}
                            onClick={() => handleSelectCell(cell.gaTranche, cell.phenotype)}
                            className="p-2 border-l border-slate-100 text-center align-middle"
                          >
                            <button
                              className={`w-full h-20 rounded-xl p-2 flex flex-col items-center justify-between transition-all cursor-pointer relative ${cellBg} ${
                                isSelected ? 'ring-2 ring-indigo-600 ring-offset-2 scale-[1.02] z-10' : ''
                              }`}
                            >
                              {/* Cluster badge indicator */}
                              {cell.clusterId && (
                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-indigo-600 text-[8px] text-white flex items-center justify-center font-black shadow-xs ring-1 ring-white">
                                  ★
                                </span>
                              )}

                              {cell.count > 0 ? (
                                <>
                                  <div className="flex items-center justify-between w-full px-1">
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${countBadge}`}>
                                      {cell.count} {cell.count === 1 ? 'case' : 'cases'}
                                    </span>
                                    {isPulse && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    )}
                                  </div>

                                  <div className="my-auto">
                                    <div className="text-xl font-black font-mono tracking-tight leading-none">
                                      {cell.count}
                                    </div>
                                    <div className={`text-[9px] font-bold mt-0.5 tracking-wide ${
                                      cell.heatLevel === 'critical' || cell.heatLevel === 'high' ? 'text-white/80' : 'text-slate-500'
                                    }`}>
                                      Risk Score: {cell.avgRiskScore}/100
                                    </div>
                                  </div>

                                  {/* Small patient name preview */}
                                  <div className={`text-[8px] truncate max-w-[90px] w-full font-medium ${
                                    cell.heatLevel === 'critical' || cell.heatLevel === 'high' ? 'text-white/90' : 'text-slate-600'
                                  }`}>
                                    {cell.patients[0]?.name.split(' ')[0]}
                                    {cell.count > 1 ? ` +${cell.count - 1}` : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="m-auto text-[10px] text-slate-300 font-mono">
                                  —
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN VIEW 2: BI-AXIAL SCATTER VELOCITY MAP                */}
      {/* ========================================================= */}
      {viewMode === 'SCATTER_VELOCITY' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Bi-Axial Velocity Scatter: Amniotic Fluid Index (cm) vs. Fetal Growth Percentile Velocity (%ile/wk)
              </span>
              <p className="text-[11px] text-slate-500">
                Segmented into 4 perinatological quadrants. High-risk cluster resides in the Critical Lower-Left Quadrant.
              </p>
            </div>

            {/* Quadrant Legend */}
            <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Critical Zone (Low AFI + FGR)
              </span>
              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Deceleration Watch
              </span>
              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Concordant Safe Zone
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 h-96 relative">
            {/* Background quadrant watermark labels */}
            <div className="absolute top-6 right-6 text-[10px] font-black uppercase text-emerald-800/40 pointer-events-none">
              Quadrant I: Optimal Concordance
            </div>
            <div className="absolute bottom-6 right-6 text-[10px] font-black uppercase text-amber-800/40 pointer-events-none">
              Quadrant II: Isolated Oligohydramnios
            </div>
            <div className="absolute top-6 left-16 text-[10px] font-black uppercase text-amber-800/40 pointer-events-none">
              Quadrant III: Isolated FGR Deceleration
            </div>
            <div className="absolute bottom-6 left-16 text-[10px] font-black uppercase text-rose-800/60 pointer-events-none animate-pulse">
              Quadrant IV: Critical Dual Failure Zone
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="growthVelocity" 
                  name="Growth Velocity" 
                  unit="%/wk"
                  domain={[-6, 1]}
                  label={{ value: 'Hadlock Percentile Velocity (%ile / week)', position: 'insideBottom', offset: -10, fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="latestAfi" 
                  name="AFI" 
                  unit=" cm"
                  domain={[3, 18]}
                  label={{ value: 'Amniotic Fluid Index (cm)', angle: -90, position: 'insideLeft', fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
                />
                <ZAxis type="number" dataKey="riskScore" range={[60, 240]} name="Risk Score" />

                {/* Clinical Quadrant Reference Lines */}
                <ReferenceLine x={-1.5} stroke="#cbd5e1" strokeDasharray="3 3" />
                <ReferenceLine y={7.0} stroke="#cbd5e1" strokeDasharray="3 3" />

                {/* Shaded Critical Danger Zone Area */}
                <ReferenceArea 
                  x1={-6} 
                  x2={-1.5} 
                  y1={3} 
                  y2={7.0} 
                  fill="#fecdd3" 
                  fillOpacity={0.35} 
                />

                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs border border-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-extrabold text-sm">{p.name}</span>
                          <span className="font-mono text-[10px] text-teal-400 font-bold">{p.mrn}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          GA: <strong className="text-white font-mono">{p.gaWeeks}w</strong> • Status: <strong className="text-rose-400">{p.status}</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                          <div>AFI: <strong className="text-white font-mono">{p.latestAfi} cm</strong></div>
                          <div>Velocity: <strong className="text-white font-mono">{p.growthVelocity} %/wk</strong></div>
                          <div>Risk Index: <strong className="text-white font-mono">{p.riskScore}/100</strong></div>
                        </div>
                        <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                          Click point to inspect Digital Twin
                        </div>
                      </div>
                    );
                  }}
                />

                <Scatter 
                  name="Clinic Population" 
                  data={scatterData} 
                  onClick={(entry: any) => setPatientModal(entry?.patientRef || entry?.payload?.patientRef || null)}
                  className="cursor-pointer"
                >
                  {scatterData.map((entry) => {
                    let fill = '#10b981'; // green
                    if (entry.status === 'HIGH') fill = '#e11d48'; // red
                    else if (entry.status === 'WATCH') fill = '#f59e0b'; // amber
                    return <Cell key={entry.id} fill={fill} stroke="#ffffff" strokeWidth={1.5} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN VIEW 3: CLUSTER TRIAGE BOARD                         */}
      {/* ========================================================= */}
      {viewMode === 'CLUSTER_TRIAGE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Ranked High-Risk Clusters across Clinic Population ({HIGH_RISK_CLUSTERS.length} Active Groups)
            </span>
            <span className="text-slate-400 text-[11px]">
              Classified by clinical urgency and intervention timeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HIGH_RISK_CLUSTERS.map((cluster) => {
              const isSelected = selectedClusterId === cluster.id;
              
              let urgencyBadge = 'bg-rose-50 text-rose-800 border-rose-200';
              let borderAccent = 'border-slate-200 hover:border-slate-300';
              if (cluster.urgency === 'CRITICAL_24H') {
                urgencyBadge = 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse';
                borderAccent = 'border-rose-300 bg-rose-50/20';
              } else if (cluster.urgency === 'URGENT_72H') {
                urgencyBadge = 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
                borderAccent = 'border-orange-200 bg-orange-50/10';
              } else {
                urgencyBadge = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
              }

              return (
                <div
                  key={cluster.id}
                  onClick={() => handleSelectCluster(cluster)}
                  className={`bg-white border rounded-2xl p-5 space-y-3.5 transition-all shadow-3xs cursor-pointer ${borderAccent} ${
                    isSelected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {cluster.codeName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${urgencyBadge}`}>
                          {cluster.urgencyLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {cluster.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 font-mono">
                        {cluster.patientCount} <span className="text-xs font-normal text-slate-500">cases</span>
                      </div>
                      <div className="text-[10px] text-rose-600 font-bold font-mono">
                        Avg Risk: {cluster.avgRiskScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Pathophysiology */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {cluster.pathophysiology}
                  </p>

                  {/* Recommended Action */}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended SMFM / ACOG Action:
                    </span>
                    <p className="text-[11px] text-slate-800 font-semibold leading-relaxed">
                      {cluster.recommendedGuidelineAction}
                    </p>
                  </div>

                  {/* Patient Roster chips */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cluster.patientIds.length} patients enrolled</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCluster(cluster);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                    >
                      <span>Inspect Roster</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PATIENT DRILLDOWN PANEL FOR SELECTED CELL / CLUSTER       */}
      {/* ========================================================= */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Cohort Drilldown
              </span>
              {selectedCell && (
                <span className="text-xs font-bold text-slate-700">
                  {GESTATIONAL_TRANCHES.find(t => t.id === selectedCell.tranche)?.label} ({selectedCell.tranche}) • {CLINICAL_PHENOTYPES.find(p => p.id === selectedCell.phenotype)?.label}
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Active Pregnancies in this Risk Group ({drilldownPatients.length})
            </h3>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Click any patient to inspect their full Digital Twin trajectory &amp; ultrasound logs
          </div>
        </div>

        {/* Patient Cards Grid */}
        {drilldownPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {drilldownPatients.map(patient => {
              let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (patient.status === 'HIGH') {
                statusBadge = 'bg-rose-50 text-rose-800 border-rose-200 font-black';
              } else if (patient.status === 'WATCH') {
                statusBadge = 'bg-amber-50 text-amber-900 border-amber-200 font-bold';
              }

              return (
                <div
                  key={patient.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 hover:text-teal-700 transition cursor-pointer"
                          onClick={() => setPatientModal(patient)}
                        >
                          {patient.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {patient.mrn} • Age {patient.age} • G{patient.gravidity}P{patient.parity}
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge}`}>
                        {patient.status}
                      </span>
                    </div>

                    {/* Vitals metrics chips */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-center font-mono text-[10px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block">GA</span>
                        <strong className="text-slate-900 font-bold">{patient.gestationalAgeWeeks}w</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">AFI</span>
                        <strong className={`font-bold ${patient.latestAfi < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {patient.latestAfi} cm
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Hadlock %</span>
                        <strong className={`font-bold ${patient.latestGrowthPercentile < 15 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {patient.latestGrowthPercentile}%
                        </strong>
                      </div>
                    </div>

                    {/* Alert Description */}
                    <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                      <strong className="text-slate-700 font-bold">Key Signal:</strong> {patient.primaryAlertFactor}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPatientModal(patient)}
                      className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleDrilldownInspect(patient)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Digital Twin</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs space-y-1">
            <p>No active pregnancy records in this tranche matching current filters.</p>
            <p className="text-[11px] text-slate-500">Try selecting another cell in the heat map or resetting your doctor filter.</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* PATIENT DETAIL MODAL / DRAWER                             */}
      {/* ========================================================= */}
      {patientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    Patient Clinical Profile
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{patientModal.mrn}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">{patientModal.name}</h3>
                <p className="text-xs text-slate-500">
                  Gestational Age: <strong className="text-slate-800 font-mono">{patientModal.gestationalAgeWeeks}w {patientModal.gestationalAgeDays}d</strong> • Clinician: {patientModal.assignedDoctorName}
                </p>
              </div>

              <button
                onClick={() => setPatientModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-sans">Hadlock Percentile</span>
                <strong className="text-base font-black text-slate-900">{patientModal.latestGrowthPercentile}%</strong>
                <span className="text-[9px] text-rose-600 block mt-0.5 font-sans font-medium">{patientModal.growthVelocity} %/wk</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-sans">Amniotic Fluid Index</span>
                <strong className="text-base font-black text-slate-900">{patientModal.latestAfi} cm</strong>
                <span className="text-[9px] text-rose-600 block mt-0.5 font-sans font-medium">{patientModal.afiVelocity} cm/wk</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-sans">Est. Fetal Weight</span>
                <strong className="text-base font-black text-slate-900">{patientModal.latestEfw} g</strong>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">Hadlock 4P</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block font-sans">Maternal BP</span>
                <strong className="text-base font-black text-slate-900">{patientModal.bloodPressure}</strong>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">Mean Arterial</span>
              </div>
            </div>

            {/* Pathophysiology & Notes */}
            <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-800 block">Clinical Summary &amp; Longitudinal Signal:</span>
              <p className="text-slate-600 leading-relaxed">{patientModal.recentNotes}</p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Risk Assessment Index:</span>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {patientModal.riskScore}/100 Risk Score
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPatientModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPatientModal(null);
                  handleDrilldownInspect(patientModal);
                }}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Digital Twin Dashboard</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CLINICAL METHODOLOGY MODAL                                */}
      {/* ========================================================= */}
      {showMethodologyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  Clinical Guidelines
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Perinatology Cohort Heat Mapping Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Standard prenatal obstetric workflows evaluate ultrasound biometry and amniotic fluid snapshots in isolation. The <strong>PregnancyTwin AI Cohort Risk Map</strong> applies longitudinal velocity modeling to cluster patients according to dual-pathway deceleration:
              </p>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  Key Algorithmic Thresholds (ACOG / SMFM):
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 font-medium">
                  <li>
                    <strong>Critical Placental Insufficiency Zone:</strong> Concomitant amniotic fluid index decay (&lt; -0.7 cm/week or AFI &lt; 6.5 cm) combined with fetal weight percentile drop crossing &gt;2 quartiles.
                  </li>
                  <li>
                    <strong>Gestational Tranche Segmentation:</strong> Groups pregnancies into 5 critical pathophysiological phases, isolating pre-term viability windows from term delivery timing decisions.
                  </li>
                  <li>
                    <strong>Cluster Urgency Scoring:</strong> Computes continuous composite risk scores (0–100) weighting gestational hypertension, Hadlock percentile acceleration, and Doppler vascular resistance.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Reference: ACOG Practice Bulletin No. 227 (Fetal Growth Restriction) &amp; SMFM Consult Series #52.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

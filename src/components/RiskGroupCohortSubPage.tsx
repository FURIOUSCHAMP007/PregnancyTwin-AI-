import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Stethoscope,
  Clock,
  Heart,
  FileSpreadsheet,
  X,
  Info
} from 'lucide-react';
import { PregnancyDigitalTwin, User } from '../types';
import {
  CLINIC_COHORT_POPULATION,
  GESTATIONAL_TRANCHES,
  CLINICAL_PHENOTYPES,
  HIGH_RISK_CLUSTERS,
  CohortPatient,
  GestationalAgeTranche,
  ClinicalPhenotype
} from '../data/cohortData';

interface RiskGroupCohortSubPageProps {
  twin: PregnancyDigitalTwin;
  currentUser: User;
  onSelectPatient?: (patientId: string) => void;
  onNavigateToClusters?: () => void;
  onOpenCopilot?: () => void;
}

export const RiskGroupCohortSubPage: React.FC<RiskGroupCohortSubPageProps> = ({
  twin,
  currentUser,
  onSelectPatient,
  onNavigateToClusters,
  onOpenCopilot
}) => {
  // Filter states
  const [selectedTranche, setSelectedTranche] = useState<GestationalAgeTranche | 'ALL'>('32-35w');
  const [selectedPhenotype, setSelectedPhenotype] = useState<ClinicalPhenotype | 'ALL'>('ACCELERATED_DECLINE');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patientModal, setPatientModal] = useState<CohortPatient | null>(null);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return CLINIC_COHORT_POPULATION.filter(p => {
      if (selectedTranche !== 'ALL' && p.gaTranche !== selectedTranche) return false;
      if (selectedPhenotype !== 'ALL' && p.clinicalPhenotype !== selectedPhenotype) return false;
      if (selectedDoctor !== 'ALL' && p.assignedDoctorName !== selectedDoctor) return false;
      if (selectedRiskTier !== 'ALL' && p.status !== selectedRiskTier) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.primaryAlertFactor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedTranche, selectedPhenotype, selectedDoctor, selectedRiskTier, searchQuery]);

  // Specific cohort statistics
  const cohortStats = useMemo(() => {
    const total = filteredPatients.length;
    const highRisk = filteredPatients.filter(p => p.status === 'HIGH').length;
    const avgAfi = total > 0
      ? (filteredPatients.reduce((sum, p) => sum + p.latestAfi, 0) / total).toFixed(1)
      : '0.0';
    const avgGrowth = total > 0
      ? Math.round(filteredPatients.reduce((sum, p) => sum + p.latestGrowthPercentile, 0) / total)
      : 0;
    const avgGa = total > 0
      ? (filteredPatients.reduce((sum, p) => sum + p.gestationalAgeWeeks, 0) / total).toFixed(1)
      : '0';

    return { total, highRisk, avgAfi, avgGrowth, avgGa };
  }, [filteredPatients]);

  const doctorsList = Array.from(new Set(CLINIC_COHORT_POPULATION.map(p => p.assignedDoctorName)));

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & RISK GROUP SUMMARY                        */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-200">
                Cohort Registry Drilldown
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Maternal-Fetal Clinical Population
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              <span>Active Pregnancies in this Risk Group ({filteredPatients.length})</span>
            </h2>

            <p className="text-xs text-slate-500 max-w-3xl">
              Currently focusing on patients in the <strong className="text-slate-800 font-semibold">Late 3rd Trimester (32–35w)</strong> cohort categorized under <strong className="text-slate-800 font-semibold">Accelerated Multi-Factor Decay</strong>. Select any patient to load their full Digital Twin trajectory.
            </p>
          </div>

          {/* Sibling Sub-Page Navigation Button */}
          {onNavigateToClusters && (
            <button
              id="btn-goto-critical-clusters"
              onClick={onNavigateToClusters}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Inspect Critical Cluster Alerts</span>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}
        </div>

        {/* Aggregate Key Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total in Group</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{cohortStats.total} Pregnancies</div>
            <div className="text-[10px] text-slate-500 font-medium">Filtered cohort</div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">High Risk Status</div>
            <div className="text-base sm:text-lg font-black text-rose-900 mt-0.5">{cohortStats.highRisk} / {cohortStats.total}</div>
            <div className="text-[10px] text-rose-700 font-medium">Require daily BPP/NST</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Amniotic Fluid</div>
            <div className="text-base sm:text-lg font-black text-rose-700 mt-0.5">{cohortStats.avgAfi} cm</div>
            <div className="text-[10px] text-slate-500 font-medium">Normal &gt; 8.0 cm</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Growth %ile</div>
            <div className="text-base sm:text-lg font-black text-rose-700 mt-0.5">{cohortStats.avgGrowth}th %ile</div>
            <div className="text-[10px] text-slate-500 font-medium">Hadlock FGR cutoff &lt;10th</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Gestational Age</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{cohortStats.avgGa} weeks</div>
            <div className="text-[10px] text-slate-500 font-medium">Late preterm window</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. INTERACTIVE CONTROLS & TRANCHE / PHENOTYPE SELECTORS  */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tranche Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Tranche:</span>
            </span>
            <button
              onClick={() => setSelectedTranche('32-35w')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedTranche === '32-35w'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              32–35w (Active Risk Group)
            </button>
            <button
              onClick={() => setSelectedTranche('28-31w')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedTranche === '28-31w'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              28–31w Early 3rd
            </button>
            <button
              onClick={() => setSelectedTranche('23-27w')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedTranche === '23-27w'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              23–27w Mid 2nd
            </button>
            <button
              onClick={() => setSelectedTranche('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedTranche === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tranches
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Phenotype & Doctor Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Phenotype:</span>
            <select
              value={selectedPhenotype}
              onChange={(e) => setSelectedPhenotype(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Phenotypes</option>
              <option value="ACCELERATED_DECLINE">Accelerated Multi-Factor Decay</option>
              <option value="FLUID_DECLINE">Severe Oligohydramnios / Fluid Decay</option>
              <option value="GROWTH_DEVIATION">Fetal Growth Restriction (FGR)</option>
              <option value="VASCULAR_STRESS">Placental Vascular Resistance</option>
              <option value="STABLE">Concordant Physiological Growth</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Physician:</span>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Attending Physicians</option>
              {doctorsList.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>

          {(selectedTranche !== '32-35w' || selectedPhenotype !== 'ACCELERATED_DECLINE' || selectedDoctor !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTranche('32-35w');
                setSelectedPhenotype('ACCELERATED_DECLINE');
                setSelectedDoctor('ALL');
                setSearchQuery('');
              }}
              className="text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer ml-auto text-[11px]"
            >
              Reset to Primary 6 Active Pregnancies
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ACTIVE PREGNANCIES PATIENT CARDS GRID                  */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Showing {filteredPatients.length} active clinical patients</span>
          <span>Click any card or &quot;Select Twin&quot; to inspect longitudinal coordinates</span>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => {
              const isCurrentTwin = twin.patient.id === patient.id;
              let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (patient.status === 'HIGH') {
                statusBadge = 'bg-rose-100 text-rose-800 border-rose-300 font-black';
              } else if (patient.status === 'WATCH') {
                statusBadge = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
              }

              return (
                <div
                  key={patient.id}
                  className={`bg-white border rounded-2xl p-5 space-y-4 shadow-xs transition-all flex flex-col justify-between ${
                    isCurrentTwin
                      ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  {/* Card Header: Patient Identity & Status Badge */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3
                            onClick={() => setPatientModal(patient)}
                            className="text-sm font-black text-slate-900 hover:text-teal-700 transition cursor-pointer"
                          >
                            {patient.name}
                          </h3>
                          {isCurrentTwin && (
                            <span className="text-[9px] font-black uppercase bg-teal-700 text-white px-1.5 py-0.2 rounded">
                              Current Twin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {patient.mrn} &bull; Age {patient.age} &bull; G{patient.gravidity}P{patient.parity}
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${statusBadge}`}>
                        {patient.status}
                      </span>
                    </div>

                    {/* Gestational Age Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Gestational Age</span>
                        <strong className="text-slate-900 font-mono">
                          {patient.gestationalAgeWeeks}w {patient.gestationalAgeDays}d
                        </strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${Math.min(100, (patient.gestationalAgeWeeks / 40) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Core Ultrasound Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Metric 1: AFI */}
                      <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          AFI (Fluid)
                        </span>
                        <div className="flex items-baseline justify-between">
                          <strong className="text-sm font-black text-rose-700">
                            {patient.latestAfi} cm
                          </strong>
                          <span className="text-[10px] text-rose-600 font-mono font-bold flex items-center">
                            <TrendingDown className="w-3 h-3 inline" />
                            {patient.afiVelocity}/w
                          </span>
                        </div>
                      </div>

                      {/* Metric 2: Growth %ile */}
                      <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Hadlock %ile
                        </span>
                        <div className="flex items-baseline justify-between">
                          <strong className="text-sm font-black text-rose-700">
                            {patient.latestGrowthPercentile}th
                          </strong>
                          <span className="text-[10px] text-rose-600 font-mono font-bold flex items-center">
                            <TrendingDown className="w-3 h-3 inline" />
                            {patient.growthVelocity}%/w
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Vitals & Physician */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Est. Fetal Weight:</span>
                        <strong className="font-mono text-slate-800">{patient.latestEfw} g</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Blood Pressure:</span>
                        <strong className="font-mono text-slate-800">{patient.bloodPressure}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Attending:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[130px]">{patient.assignedDoctorName}</span>
                      </div>
                    </div>

                    {/* Primary Alert Factor */}
                    <div className="p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug">
                      <strong className="font-bold block text-[10px] uppercase tracking-wider text-amber-800">
                        Alert Signal:
                      </strong>
                      {patient.primaryAlertFactor}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setPatientModal(patient)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Quick Drilldown
                    </button>

                    {onSelectPatient && (
                      <button
                        onClick={() => onSelectPatient(patient.id)}
                        className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                          isCurrentTwin
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-teal-700 hover:bg-teal-800 text-white shadow-3xs'
                        }`}
                      >
                        {isCurrentTwin ? 'Active Twin' : 'Select Twin'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No patients matched this filter</h4>
            <p className="text-xs text-slate-500">Try adjusting your tranche or phenotype selection.</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. PATIENT INSPECTION MODAL                                */}
      {/* ========================================================= */}
      {patientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{patientModal.name}</h3>
                <div className="text-xs text-slate-400 font-mono">
                  {patientModal.mrn} &bull; Age {patientModal.age} &bull; {patientModal.gestationalAgeWeeks}w {patientModal.gestationalAgeDays}d
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {patientModal.status} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Amniotic Fluid Index</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{patientModal.latestAfi} cm</div>
                <div className="text-[10px] text-slate-500">Rate: {patientModal.afiVelocity} cm/wk</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Hadlock Percentile</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{patientModal.latestGrowthPercentile}th %ile</div>
                <div className="text-[10px] text-slate-500">Rate: {patientModal.growthVelocity}%/wk</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Estimated Fetal Weight</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{patientModal.latestEfw} g</div>
                <div className="text-[10px] text-slate-500">BP: {patientModal.bloodPressure}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Attending Clinician</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{patientModal.assignedDoctorName}</div>
                <div className="text-[10px] text-slate-500">{patientModal.trajectoryCategory}</div>
              </div>
            </div>

            <div className="text-xs space-y-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900">Primary Alert Factor:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">{patientModal.primaryAlertFactor}</p>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl">
              <span className="font-bold text-slate-700">Clinical Notes:</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">{patientModal.recentNotes}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPatientModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              {onSelectPatient && (
                <button
                  onClick={() => {
                    const id = patientModal.id;
                    setPatientModal(null);
                    onSelectPatient(id);
                  }}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Load Digital Twin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

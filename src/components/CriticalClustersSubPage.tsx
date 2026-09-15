import React, { useState } from 'react';
import {
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  Activity,
  AlertTriangle,
  Heart,
  Users,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Stethoscope,
  Info,
  ExternalLink
} from 'lucide-react';
import { PregnancyDigitalTwin, User } from '../types';
import {
  HIGH_RISK_CLUSTERS,
  CLINIC_COHORT_POPULATION,
  CohortCluster,
  CohortPatient
} from '../data/cohortData';

interface CriticalClustersSubPageProps {
  twin: PregnancyDigitalTwin;
  currentUser: User;
  onSelectPatient?: (patientId: string) => void;
  onNavigateToCohort?: () => void;
  onOpenCopilot?: () => void;
}

export const CriticalClustersSubPage: React.FC<CriticalClustersSubPageProps> = ({
  twin,
  currentUser,
  onSelectPatient,
  onNavigateToCohort,
  onOpenCopilot
}) => {
  const [selectedCluster, setSelectedCluster] = useState<CohortCluster>(HIGH_RISK_CLUSTERS[0]);
  const [selectedPatientModal, setSelectedPatientModal] = useState<CohortPatient | null>(null);

  // Cluster Alpha is the prime critical cluster
  const primaryCluster = HIGH_RISK_CLUSTERS[0]; // Late 3rd Trimester Multi-Factor Decay (32–35w)
  
  // Resolve patients in the active cluster
  const clusterPatients = CLINIC_COHORT_POPULATION.filter(p =>
    selectedCluster.patientIds.includes(p.id)
  );

  // Check if current twin matches Cluster Alpha parameters
  const currentGa = twin.patient.currentGestationalAgeWeeks;
  const currentAfi = twin.currentVisit?.amnioticFluidIndex_cm ?? 0;
  const currentGrowth = twin.currentVisit?.growthPercentile ?? 50;
  const isTwinInCluster = (currentGa >= 32 && currentGa <= 35) && (currentAfi < 6.0 || currentGrowth < 10);

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & CRITICAL CLUSTER ALERT BANNER             */}
      {/* ========================================================= */}
      <div className="bg-rose-50 border-2 border-rose-300/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-800 bg-rose-200/80 px-2.5 py-0.5 rounded-full border border-rose-300">
                  Critical Cluster Detected
                </span>
                <span className="text-[10px] font-mono font-bold bg-white text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                  Active in Clinical Population
                </span>
                <span className="text-[10px] font-mono font-bold bg-rose-700 text-white px-2 py-0.5 rounded">
                  Urgency: 24h Action Window
                </span>
              </div>
              
              <h2 className="text-base sm:text-lg font-black text-rose-950 tracking-tight">
                Cluster Alpha: Late 3rd Trimester Multi-Factor Decay (32–35w)
              </h2>

              <p className="text-xs text-rose-900/90 leading-relaxed font-medium max-w-3xl">
                <strong>6 active pregnancies</strong> in the maternal-fetal registry are exhibiting concurrent severe oligohydramnios (mean AFI 5.1 cm) and rapid Hadlock percentile collapse (&lt;10th %ile). This indicates acute, late-onset placental insufficiency requiring immediate multidisciplinary triage.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            {onNavigateToCohort && (
              <button
                id="btn-goto-risk-cohort"
                onClick={onNavigateToCohort}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View 6 Active Pregnancies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenCopilot && (
              <button
                id="btn-copilot-cluster"
                onClick={onOpenCopilot}
                className="px-4 py-2 bg-white hover:bg-rose-100/60 text-rose-900 border border-rose-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                <span>Consult Copilot on Cluster</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Digital Twin Context Indicator */}
        <div className="pt-3 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-900">Current Patient Twin:</span>
            <span className="font-semibold text-rose-950">{twin.patient.name} ({twin.patient.currentGestationalAgeWeeks}w {twin.patient.currentGestationalAgeDays}d)</span>
            <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
              isTwinInCluster ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {isTwinInCluster ? 'Cluster Alpha Criterion Met' : 'Adjacent Trajectory'}
            </span>
          </div>
          <div className="text-[11px] text-rose-800 font-medium">
            Protocol: Inpatient BPP/NST &bull; Doppler Velocity Q48H &bull; Steroid Readiness
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MULTI-FACTOR DECAY PATHOPHYSIOLOGY MECHANISM            */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
              <Activity className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Late 3rd Trimester Multi-Factor Decay Mechanics
              </h3>
              <p className="text-xs text-slate-500">
                Biophysical pathway triggering simultaneous biometry collapse and amniotic fluid resorption.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            Phenotype: ACCELERATED_DECLINE
          </span>
        </div>

        {/* 4-Step Biophysical Cascade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Cascade Step 1 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                Stage 1: 32–33w
              </span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Microvascular Resistance</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Placental syncytiotrophoblast micro-infarcts increase umbilical artery pulsatility index (UA PI &gt; 95th %ile).
            </p>
            <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
              Velocity: UA RI &gt; 0.74
            </div>
          </div>

          {/* Cascade Step 2 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                Stage 2: 33–34w
              </span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Amniotic Fluid Resorption</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Renal hypoperfusion diminishes fetal micturition. Amniotic fluid index collapses at a rate of -0.85 cm/week.
            </p>
            <div className="text-[10px] font-mono text-rose-700 font-bold bg-white p-1.5 rounded border border-rose-200">
              Mean AFI: 5.1 cm (&lt; 5.0 = Oligo)
            </div>
          </div>

          {/* Cascade Step 3 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                Stage 3: 34w+
              </span>
              <Heart className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Brain-Sparing Vasodilation</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Middle cerebral artery (MCA) vasodilation preserves cerebral oxygenation while somatic growth grinds to a halt.
            </p>
            <div className="text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
              CPR (UA PI / MCA PI) &lt; 1.0
            </div>
          </div>

          {/* Cascade Step 4 */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-rose-700 px-2 py-0.5 rounded">
                Action Mandate
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <h4 className="text-xs font-bold text-rose-950">ACOG Triage Window</h4>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              Immediate inpatient admission for daily computerized BPP/NST. Prepare antenatal corticosteroids if &lt;34w.
            </p>
            <div className="text-[10px] font-mono text-rose-800 font-bold bg-white p-1.5 rounded border border-rose-200">
              Target Delivery: 34w0d–35w6d
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. HIGH-RISK POPULATION CLUSTERS TRIAGE SUITE             */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>All Detected High-Risk Population Clusters</span>
            </h3>
            <p className="text-xs text-slate-500">
              Stratified by clinical urgency, gestational-age window, and collective pathophysiology.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Click any cluster below to inspect member patients
          </span>
        </div>

        {/* Cluster Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {HIGH_RISK_CLUSTERS.map(cluster => {
            const isSelected = selectedCluster.id === cluster.id;
            let urgencyColor = 'bg-rose-100 text-rose-800 border-rose-200';
            let cardBorder = isSelected ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/40' : 'border-slate-200 hover:border-slate-300 bg-white';
            
            if (cluster.urgency === 'URGENT_72H') {
              urgencyColor = 'bg-amber-100 text-amber-900 border-amber-200';
            } else if (cluster.urgency === 'MONITOR_7D') {
              urgencyColor = 'bg-blue-100 text-blue-900 border-blue-200';
            }

            return (
              <button
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                      {cluster.codeName}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${urgencyColor}`}>
                      {cluster.urgencyLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 leading-snug">
                    {cluster.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {cluster.pathophysiology}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">
                    {cluster.patientCount} Patients
                  </span>
                  <span className="font-mono text-[10px] text-rose-700 font-bold">
                    Risk: {cluster.avgRiskScore}/100
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Cluster Details & Patients */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  {selectedCluster.title}
                </span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded">
                  {selectedCluster.gaTranche} Tranche
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                <strong>Recommended Guideline Action:</strong> {selectedCluster.recommendedGuidelineAction}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Ref: {selectedCluster.acogReference}
            </div>
          </div>

          {/* Member Patients in this Cluster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Patients in this Cluster ({clusterPatients.length}):
              </span>
              {onNavigateToCohort && selectedCluster.id === 'cluster-late-decay' && (
                <button
                  onClick={onNavigateToCohort}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Risk Group Sub-Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {clusterPatients.map(p => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.mrn} &bull; {p.gestationalAgeWeeks}w {p.gestationalAgeDays}d &bull; AFI: {p.latestAfi} cm
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedPatientModal(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                      title="Quick inspection"
                    >
                      Inspect
                    </button>
                    {onSelectPatient && (
                      <button
                        onClick={() => onSelectPatient(p.id)}
                        className="px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded cursor-pointer"
                        title="Load into Digital Twin"
                      >
                        Select Twin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CLINICAL ESCALATION PATHWAY CHECKLIST                  */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <Stethoscope className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Cluster Alpha Clinical Escalation Protocol
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>1. Fetal Surveillance Frequency</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Daily computerized non-stress test (NST) with biophysical profile (BPP) score. Umbilical artery and middle cerebral artery Doppler studies every 48 to 72 hours.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>2. Antenatal Corticosteroids</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              If gestation is between 32w 0d and 33w 6d, administer Betamethasone 12 mg IM (2 doses 24 hours apart) for fetal lung maturation readiness.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>3. Delivery Decision Framework</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              If absent or reversed end-diastolic velocity (AREDV) occurs, expedite delivery via cesarean. Otherwise, planned induction at 34w 0d to 35w 6d per SMFM guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Inspection Modal */}
      {selectedPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPatientModal.name}</h3>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedPatientModal.mrn} &bull; Age {selectedPatientModal.age} &bull; {selectedPatientModal.gestationalAgeWeeks}w {selectedPatientModal.gestationalAgeDays}d
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {selectedPatientModal.status} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Amniotic Fluid Index</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{selectedPatientModal.latestAfi} cm</div>
                <div className="text-[10px] text-slate-500">Rate: {selectedPatientModal.afiVelocity} cm/wk</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Hadlock Percentile</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{selectedPatientModal.latestGrowthPercentile}th %ile</div>
                <div className="text-[10px] text-slate-500">Rate: {selectedPatientModal.growthVelocity}%/wk</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Estimated Fetal Weight</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">{selectedPatientModal.latestEfw} g</div>
                <div className="text-[10px] text-slate-500">BP: {selectedPatientModal.bloodPressure}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Attending Clinician</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedPatientModal.assignedDoctorName}</div>
                <div className="text-[10px] text-slate-500">{selectedPatientModal.trajectoryCategory}</div>
              </div>
            </div>

            <div className="text-xs space-y-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900">Primary Alert Factor:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">{selectedPatientModal.primaryAlertFactor}</p>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl">
              <span className="font-bold text-slate-700">Clinical Notes:</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">{selectedPatientModal.recentNotes}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              {onSelectPatient && (
                <button
                  onClick={() => {
                    const id = selectedPatientModal.id;
                    setSelectedPatientModal(null);
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

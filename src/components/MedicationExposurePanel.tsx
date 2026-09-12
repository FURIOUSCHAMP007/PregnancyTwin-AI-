import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  ShieldAlert,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle,
  RefreshCw,
  X,
  ChevronRight,
  User,
  FileText,
  BarChart3,
  Info,
  Sliders,
  UserCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { MedicationExposure, VisitMeasurement } from '../types';
import {
  evaluateMedicationTemporalAssociation,
  calculateMedicationShapContributions,
  engineerMedicationFeatures
} from '../utils/trajectoryEngine';

interface MedicationExposurePanelProps {
  patientId: string;
  medications: MedicationExposure[];
  visits: VisitMeasurement[];
  currentGestationalAgeWeeks: number;
  onRefresh: () => void;
}

export const MedicationExposurePanel: React.FC<MedicationExposurePanelProps> = ({
  patientId,
  medications = [],
  visits = [],
  currentGestationalAgeWeeks,
  onRefresh
}) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('Once daily');
  const [startWeek, setStartWeek] = useState<number>(12);
  const [stopWeek, setStopWeek] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState('');
  const [indication, setIndication] = useState('');
  const [maternalCondition, setMaternalCondition] = useState('');
  const [trimester, setTrimester] = useState<'1st' | '2nd' | '3rd' | 'all'>('2nd');
  const [exposureStatus, setExposureStatus] = useState<'current' | 'past'>('current');
  const [source, setSource] = useState<'prescription' | 'report' | 'patient history'>('prescription');
  const [confidence, setConfidence] = useState<'Verified' | 'Extracted' | 'Patient-entered'>('Extracted');
  const [prescriber, setPrescriber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editingPrescriber, setEditingPrescriber] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Local patient metadata fallback for SHAP covariates calculation
  const [patientMeta, setPatientMeta] = useState({
    id: patientId,
    age: 29,
    maternalBmi: 24.5,
    currentGestationalAgeWeeks: currentGestationalAgeWeeks
  });

  // Fetch patient profile covariates if visits exist
  useEffect(() => {
    if (patientId) {
      fetch(`/api/patients/${patientId}/twin`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Received non-JSON response from server.");
          }
          return res.json();
        })
        .then(data => {
          if (data && data.patient) {
            setPatientMeta({
              id: patientId,
              age: data.patient.age || 29,
              maternalBmi: data.patient.maternalBmi || 24.5,
              currentGestationalAgeWeeks: data.patient.currentGestationalAgeWeeks || currentGestationalAgeWeeks
            });
          }
        })
        .catch(err => console.warn('Failed to fetch patient metadata for SHAP:', err.message));
    }
  }, [patientId, currentGestationalAgeWeeks, medications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    const errors: string[] = [];

    // 1. Name validation
    if (!name.trim()) {
      errors.push("Medication Brand Name cannot be blank.");
    }

    // 2. Dosage validation
    if (!dosage.trim()) {
      errors.push("Prescribed Dose cannot be blank.");
    }

    // 3. Indication validation
    if (!indication.trim()) {
      errors.push("Underlying Indication cannot be blank.");
    }

    // 4. Gestational Age Weeks validation
    if (startWeek < 1 || startWeek > 42) {
      errors.push("Gestational Age Start Week must be between 1 and 42.");
    }

    if (stopWeek !== '') {
      if (stopWeek < 1 || stopWeek > 42) {
        errors.push("Gestational Age Stop Week must be between 1 and 42.");
      }
      if (stopWeek < startWeek) {
        errors.push("Gestational Age Stop Week cannot be earlier than Start Week.");
      }
    }

    // 5. Calendar Dates validation
    if (startDate && stopDate) {
      const startDateTime = new Date(startDate).getTime();
      const stopDateTime = new Date(stopDate).getTime();
      if (isNaN(startDateTime) || isNaN(stopDateTime)) {
        errors.push("Invalid calendar date entered.");
      } else if (stopDateTime < startDateTime) {
        errors.push("Calendar Stop Date cannot be earlier than Calendar Start Date.");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: name,
          activeIngredient: activeIngredient || name,
          dose: dosage,
          route,
          frequency,
          startDate,
          stopDate: stopDate || undefined,
          gestationalAgeStartWeeks: Number(startWeek),
          gestationalAgeStopWeeks: stopWeek ? Number(stopWeek) : undefined,
          trimester,
          indication,
          maternalCondition: maternalCondition || indication,
          source,
          confidence,
          prescriber,
          exposureStatus
        })
      });

      if (res.ok) {
        setName('');
        setActiveIngredient('');
        setDosage('');
        setIndication('');
        setMaternalCondition('');
        setStartWeek(12);
        setStopWeek('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setStopDate('');
        setExposureStatus('current');
        setPrescriber('');
        setConfidence('Extracted');
        setShowForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to log medication exposure:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (medId: string) => {
    if (!window.confirm('Are you sure you want to delete this medication exposure record?')) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  const handleDiscontinue = async (medId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestationalAgeStopWeeks: currentGestationalAgeWeeks,
          exposureStatus: 'past'
        })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to discontinue medication:', err);
    }
  };

  const handleUpdateConfidence = async (medId: string, value: 'Verified' | 'Extracted' | 'Patient-entered') => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confidence: value })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update confidence:', err);
    }
  };

  const handleUpdatePrescriber = async (medId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriber: editingPrescriber })
      });
      if (res.ok) {
        setEditingMedId(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update prescriber:', err);
    }
  };

  // Perform Level 2: Temporal analysis matching medications and ultrasound trajectories
  const temporalAssociations = evaluateMedicationTemporalAssociation(visits, medications);

  // Perform Level 3: SHAP Feature Contributions containing engineered medication factors
  const shapContributions = calculateMedicationShapContributions(visits, medications, patientMeta);

  // Format Recharts trajectory data
  const sortedVisits = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  const chartData = sortedVisits.map(v => ({
    week: `w${v.gestationalAgeWeeks}`,
    gaWeek: v.gestationalAgeWeeks,
    afi: v.amnioticFluidIndex_cm,
    afiSmoothed: v.kalmanAfi || v.amnioticFluidIndex_cm,
    growth: v.growthPercentile,
    growthSmoothed: v.kalmanPercentile || v.growthPercentile
  }));

  // Build Medication Gantt Grid Timeline points (weeks 12 to 40)
  const timelineWeeks = Array.from({ length: 15 }, (_, i) => 12 + i * 2); // [12, 14, 16, ..., 40]

  return (
    <div className="space-y-6" id="medication-exposure-panel">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-800" />
            <span>Medication Impact &amp; Trajectory Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Level 1 Verification, Level 2 Temporal Correlation, and Level 3 SHAP Multi-Factor explainability.
          </p>
        </div>

        <button
          type="button"
          id="btn-add-med-exposure"
          onClick={() => setShowForm(!showForm)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer ${
            showForm
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-850 hover:bg-emerald-900 text-white'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Log Drug Exposure</span>
            </>
          )}
        </button>
      </div>

      {/* Add Exposure Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-250 rounded-xl p-5 sm:p-6 animate-fadeIn space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <Clock className="w-4 h-4 text-emerald-800" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Log Fetal Medication Exposure Checkpoint
            </h4>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-xs text-rose-800 space-y-1 animate-fadeIn">
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Please resolve the following validation issues:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="font-medium">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Group 1: Medication Details */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-2.5">
              1. Medication Identity & Strength
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Medication Brand Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aldomet, Co-Plavix"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Active Generic Ingredient
                </label>
                <input
                  type="text"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  placeholder="e.g. Methyldopa, Aspirin"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Prescribed Dose
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 250 mg, 81 mg"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Route &amp; Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                  >
                    <option value="Oral">Oral (PO)</option>
                    <option value="Subcutaneous">SC</option>
                    <option value="Intravenous">IV</option>
                    <option value="Vaginal">Vaginal</option>
                  </select>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">3x daily</option>
                    <option value="At bedtime">At bedtime</option>
                    <option value="As needed (PRN)">PRN</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Temporal Timeline & Dates */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-2.5">
              2. Temporal Alignment &amp; Dates
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Gestational Age Start (Weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={startWeek}
                  onChange={(e) => setStartWeek(Number(e.target.value))}
                  placeholder="Start week"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Gestational Age Stop (Weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={stopWeek}
                  onChange={(e) => setStopWeek(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Leave blank if ongoing"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Calendar Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Calendar Stop Date
                </label>
                <input
                  type="date"
                  value={stopDate}
                  onChange={(e) => setStopDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Clinical Context */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-2.5">
              3. Clinical Indication &amp; Context
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Underlying Indication
                </label>
                <input
                  type="text"
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  placeholder="e.g. Prophylaxis for preeclampsia, high uterine Doppler values"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Maternal Clinical Condition
                </label>
                <input
                  type="text"
                  value={maternalCondition}
                  onChange={(e) => setMaternalCondition(e.target.value)}
                  placeholder="e.g. Chronic Hypertension, Type 2 Diabetes Mellitus"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Group 4: Prescriber & Metadata */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-2.5">
              4. Verification Source &amp; Status
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Trimester
                </label>
                <select
                  value={trimester}
                  onChange={(e) => setTrimester(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  <option value="1st">1st Trimester</option>
                  <option value="2nd">2nd Trimester</option>
                  <option value="3rd">3rd Trimester</option>
                  <option value="all">Full Term / Overlapping</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Exposure Status
                </label>
                <select
                  value={exposureStatus}
                  onChange={(e) => setExposureStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  <option value="current">Current Active</option>
                  <option value="past">Past Exposure / Concluded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Data Source Type
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  <option value="prescription">Official Rx Prescription</option>
                  <option value="report">Patient Extracted Report</option>
                  <option value="patient history">Verbal Patient History</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Prescribers / Clinician Name
                </label>
                <input
                  type="text"
                  value={prescriber}
                  onChange={(e) => setPrescriber(e.target.value)}
                  placeholder="e.g. Dr. Chen, Ob/Gyn Specialist"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Verification Confidence
                </label>
                <select
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                >
                  <option value="Verified">Verified Clinical Scan</option>
                  <option value="Extracted">AI Extracted Report</option>
                  <option value="Patient-entered">Patient Reported History</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-250">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Log Exposure Checkpoint</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Clinical Warning Callout */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs leading-relaxed flex gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-amber-950 block">Maternal Pharmacotherapy Correlation Directive:</span>
          <p className="text-slate-700 text-[11px] mt-0.5">
            Temporal aligning of drug administration timelines against serial ultrasound biometry is designed for secondary association and diagnostic reference only. Under FDA &amp; MotherToBaby guidelines, clinical deceleration curves can be triggered by progressive underlying disease severity (e.g. preeclampsia with high uterine arterial resistance) and must not be unilaterally attributed to pharmacological toxicity or active ingredients.
          </p>
        </div>
      </div>

      {/* Four Connected Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL 1: PREGNANCY TRAJECTORY (AFI & Growth Charts) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-800" />
              <span>Panel 1: Pregnancy Trajectory Baseline</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              N = {visits.length} scans
            </span>
          </div>

          {visits.length < 2 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-medium">
              Awaiting sequential follow-up scans to plot trajectory velocity curves.
            </div>
          ) : (
            <div className="space-y-4">
              {/* AFI Chart */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Amniotic Fluid Index (AFI) Curve (cm)
                </span>
                <div className="h-44 w-full mt-1.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[2, 22]} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                      <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Oligohydramnios (<5cm)', fill: '#ef4444', fontSize: 8, position: 'insideBottomRight' }} />
                      <ReferenceLine y={8.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Borderline (<8cm)', fill: '#f59e0b', fontSize: 8, position: 'insideBottomRight' }} />
                      <Line name="Raw AFI" type="monotone" dataKey="afi" stroke="#94a3b8" strokeWidth={1.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line name="Kalman Filtered" type="monotone" dataKey="afiSmoothed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Growth Percentile Chart */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Fetal Growth Percentile (Hadlock Formula)
                </span>
                <div className="h-44 w-full mt-1.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                      <ReferenceLine y={10.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'FGR/SGA Danger (<10th %ile)', fill: '#ef4444', fontSize: 8, position: 'insideBottomRight' }} />
                      <Area name="Kalman Percentile" type="monotone" dataKey="growthSmoothed" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line name="Raw Percentile" type="monotone" dataKey="growth" stroke="#94a3b8" strokeWidth={1.2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: MEDICATION TIMELINE (Gantt-Style Matrix) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-800" />
                <span>Panel 2: Fetal Medication Timeline</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                Weeks 12 - 40
              </span>
            </div>

            {medications.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-400 font-medium">
                No active or historical medication records recorded for this gestational digital twin.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timeline scale header */}
                <div className="grid grid-cols-15 text-[9px] font-bold text-slate-400 border-b border-slate-100 pb-1 font-mono">
                  {timelineWeeks.map(w => (
                    <div key={w} className="text-center truncate">
                      w{w}
                    </div>
                  ))}
                </div>

                <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                  {medications.map((med) => {
                    const startW = med.gestationalAgeStartWeeks || 12;
                    const stopW = med.gestationalAgeStopWeeks || currentGestationalAgeWeeks;
                    
                    // Map GA start/stop to percentage-based grid slots for styled divs
                    const totalGridSpan = 40 - 12; // 28 weeks range
                    const startPercent = Math.max(0, Math.min(100, ((startW - 12) / totalGridSpan) * 100));
                    const widthPercent = Math.max(5, Math.min(100 - startPercent, ((stopW - startW) / totalGridSpan) * 100));

                    return (
                      <div key={med.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">{med.medicationName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            w{startW} - {med.gestationalAgeStopWeeks ? `w${med.gestationalAgeStopWeeks}` : 'Ongoing'} ({med.dose})
                          </span>
                        </div>

                        {/* Visual Timeline Pill */}
                        <div className="h-6 bg-slate-50 border border-slate-100 rounded-md relative overflow-hidden">
                          {/* Shaded Exposure block */}
                          <div
                            className={`absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-1.5 text-[8.5px] font-bold text-white transition-all ${
                              med.exposureStatus === 'current'
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-850 shadow-3xs'
                                : 'bg-slate-400 border-slate-500'
                            }`}
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`
                            }}
                          >
                            <span className="truncate">{med.medicationName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-medium flex justify-between">
            <span>Grid scale represents gestational age alignment.</span>
            <span className="text-emerald-800 font-bold">● Active Exposure</span>
          </div>
        </div>

        {/* PANEL 3: MEDICATION-TRAJECTORY ASSOCIATION (Level 1 Verification, Level 2 Temporal Correlation) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-800" />
              <span>Panel 3: Medication-Trajectory Association Engine</span>
            </h4>
            <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px] border border-teal-150">
              Levels 1 &amp; 2 Intelligence
            </span>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-medium">
              Log drug exposures above to initiate temporal correlation analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temporalAssociations.map((assoc) => {
                const isWatch = assoc.correlationSeverity === 'watch';
                const isImprove = assoc.correlationSeverity === 'improve';
                const severityStyle = isWatch
                  ? 'bg-amber-50 border-amber-250 text-amber-950'
                  : isImprove
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800';

                return (
                  <div key={assoc.medicationId} className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 ${severityStyle}`}>
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Pill className={`w-3.5 h-3.5 ${isWatch ? 'text-amber-700' : 'text-slate-600'}`} />
                          <span className="text-xs font-bold">{assoc.medicationName} ({assoc.dose})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isWatch ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Start: w{assoc.gestationalAgeStartWeeks}
                        </span>
                      </div>

                      {/* Level 1: Verification Controls */}
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] bg-white/40 p-2 rounded-lg border border-black/5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                            Level 1 Confidence Verification
                          </label>
                          <select
                            value={assoc.confidence}
                            onChange={(e) => handleUpdateConfidence(assoc.medicationId, e.target.value as any)}
                            className="bg-white/80 border border-slate-200 rounded-md px-1 py-0.5 text-[10.5px] font-bold text-slate-800 w-full focus:outline-none"
                          >
                            <option value="Verified">Verified Scan</option>
                            <option value="Extracted">AI Extracted</option>
                            <option value="Patient-entered">Patient Reported</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                            Prescribing Clinician
                          </label>
                          {editingMedId === assoc.medicationId ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingPrescriber}
                                onChange={(e) => setEditingPrescriber(e.target.value)}
                                className="bg-white border border-slate-200 rounded-md px-1 py-0.5 text-[10.5px] text-slate-800 w-full focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePrescriber(assoc.medicationId)}
                                className="bg-emerald-800 text-white font-bold p-1 rounded hover:bg-emerald-900 text-[9px] cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 mt-1">
                              <span className="truncate">{assoc.prescriber || 'Not entered'}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMedId(assoc.medicationId);
                                  setEditingPrescriber(assoc.prescriber || '');
                                }}
                                className="text-emerald-800 hover:underline text-[9.5px] font-bold cursor-pointer shrink-0"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Level 2: Temporal Correlation Analysis */}
                      <div className="mt-3.5 space-y-2">
                        <span className="text-[9.5px] font-extrabold uppercase text-slate-600 tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-800" />
                          <span>Level 2 Temporal Metrics</span>
                        </span>

                        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono font-bold text-slate-700 bg-white/20 p-2 rounded border border-black/5">
                          <div>
                            <p className="text-[9px] text-slate-500 font-sans">AFI shift (pre vs post)</p>
                            <p className="text-slate-900 mt-0.5">
                              {assoc.beforeAfi ? `${assoc.beforeAfi}cm` : 'N/A'} → {assoc.duringAfi ? `${assoc.duringAfi}cm` : 'N/A'}
                            </p>
                            {assoc.beforeAfi && (
                              <span className={`text-[9.5px] ${assoc.afiDelta < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'}`}>
                                ({assoc.afiDelta >= 0 ? '+' : ''}{assoc.afiDelta} cm)
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-[9px] text-slate-500 font-sans">Growth shift (pre vs post)</p>
                            <p className="text-slate-900 mt-0.5">
                              {assoc.beforeGrowth ? `${assoc.beforeGrowth}th` : 'N/A'} → {assoc.duringGrowth ? `${assoc.duringGrowth}th` : 'N/A'}
                            </p>
                            {assoc.beforeGrowth && (
                              <span className={`text-[9.5px] ${assoc.growthDelta < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700'}`}>
                                ({assoc.growthDelta >= 0 ? '+' : ''}{assoc.growthDelta} %iles)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Narrative Signal Summary */}
                        <div className="text-[11px] font-medium leading-relaxed mt-2.5 text-slate-700 bg-white/50 p-2.5 rounded-lg border border-black/5 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-800 mt-0.5 shrink-0" />
                          <div>
                            <strong>Trajectory Signal Correlation:</strong> {assoc.correlationText}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-black/5 mt-2">
                      <button
                        type="button"
                        onClick={() => handleDiscontinue(assoc.medicationId)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 cursor-pointer shadow-3xs"
                      >
                        Discontinue Rx
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(assoc.medicationId)}
                        className="text-rose-700 hover:bg-rose-50 rounded-md px-2 py-1 border border-rose-200 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL 4: EXPLAINABILITY (SHAP Feature Contributions) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-800" />
              <span>Panel 4: AI Model Feature Contributions (XGBoost SHAP values)</span>
            </h4>
            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-150">
              Level 3 Explainability
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual SHAP Bar Chart */}
            <div className="lg:col-span-7 space-y-3.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                XGBoost Feature Weight Influence (Absolute impact value)
              </span>

              <div className="space-y-3">
                {shapContributions.map((shap, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{shap.feature}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {shap.direction === 'negative' ? '-' : '+'}{shap.importance}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bar Track */}
                      <div className="h-2.5 bg-slate-100 rounded-full flex-1 overflow-hidden relative border border-slate-150">
                        <div
                          className={`h-full rounded-full transition-all ${
                            shap.direction === 'negative'
                              ? 'bg-gradient-to-r from-rose-500 to-rose-700'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-700'
                          }`}
                          style={{ width: `${shap.importance}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono w-14 truncate">
                        {shap.description.split(':')[1]?.trim() || shap.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Clinician-Readable Explanation */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-tight">
                  <Sparkles className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Interactive Twin Explanation</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  <strong>Clinician SHAP Directive:</strong> The SHAP visualization demonstrates what features the underlying XGBoost pipeline weighted most heavily in calculating the pregnancy trajectory scores and risk statuses. 
                </p>

                <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-[10.5px] leading-snug text-slate-700 font-medium space-y-1.5">
                  <div className="text-emerald-950 font-bold">Longitudinal Association Findings:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>
                      AFI Velocity represents a {shapContributions.find(c => c.feature.includes('AFI'))?.importance || 35}% influence on model predictions.
                    </li>
                    {medications.length > 0 && (
                      <li>
                        Active drug exposures added an active feature covariate contributing {shapContributions.find(c => c.feature.includes('Medication'))?.importance || 10}% influence.
                      </li>
                    )}
                    <li>
                      Maternal covariates (Age {patientMeta.age}y, BMI {patientMeta.maternalBmi} kg/m²) represent baseline model calibrations.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-start gap-1.5 text-[10px] text-slate-400 font-semibold uppercase leading-tight">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>SHAP explains statistical weight inside the trajectory score; it does not establish medical causation.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

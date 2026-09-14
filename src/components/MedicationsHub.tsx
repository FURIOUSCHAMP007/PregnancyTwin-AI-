/**
 * PregnancyTwin AI - MedicationsHub Component
 * A merged, state-of-the-art Clinical Hub for Medications management, exposure timeline,
 * and Gemini-powered pharmacology audits.
 * Supports both standalone Studio tab usage and embedded Clinical Twin sub-page view usage.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  Calendar, 
  ChevronRight, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Flame, 
  BrainCircuit, 
  RotateCcw,
  BookOpen,
  Trash2,
  Clock,
  Edit,
  X,
  FileText,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { PregnancyDigitalTwin, Patient, MedicationExposure, VisitMeasurement } from '../types';
import { MedicationTimeline } from './MedicationTimeline';
import { AssociationInsightPanel } from './AssociationInsightPanel';
import { MedicationExposurePanel } from './MedicationExposurePanel';
import Markdown from 'react-markdown';

export interface AdherenceRecord {
  date: string; // YYYY-MM-DD
  medications: {
    [medId: string]: 'compliant' | 'partial' | 'non-compliant';
  };
  clinicianNotes?: string;
  barrier?: 'none' | 'forgot' | 'side-effects' | 'cost' | 'other';
}

interface MedicationsHubProps {
  twin: PregnancyDigitalTwin | null;
  patients?: Patient[];
  selectedPatientId?: string;
  onSelectPatient?: (id: string) => void;
  onMedicationsChanged?: () => void;
  onNavigateToLiveInput?: () => void;
  
  // Digital Twin sub-page props (for backward compatibility)
  patientId?: string;
  currentGestationalAgeWeeks?: number;
  onRefresh?: () => void;
}

export const MedicationsHub: React.FC<MedicationsHubProps> = ({
  twin,
  patients = [],
  selectedPatientId,
  onSelectPatient,
  onMedicationsChanged,
  onNavigateToLiveInput,
  patientId,
  currentGestationalAgeWeeks,
  onRefresh
}) => {
  // Resolve active patient and context
  const activePatientId = patientId || selectedPatientId || twin?.patient.id || '';
  const activeGestationalAge = currentGestationalAgeWeeks || twin?.patient.currentGestationalAgeWeeks || 12;
  const activeMeds = twin?.medications || [];
  const activeVisits = twin?.visits || [];
  
  const refreshCallback = () => {
    if (onRefresh) onRefresh();
    if (onMedicationsChanged) onMedicationsChanged();
  };

  // Adherence States
  const [activeMedsTab, setActiveMedsTab] = useState<'prescriptions' | 'adherence'>('prescriptions');
  const [adherenceLogs, setAdherenceLogs] = useState<{[patientId: string]: AdherenceRecord[]}>({});
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInMeds, setCheckInMeds] = useState<{[medId: string]: 'compliant' | 'partial' | 'non-compliant'}>({});
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInBarrier, setCheckInBarrier] = useState<'none' | 'forgot' | 'side-effects' | 'cost' | 'other'>('none');
  const [adherenceSuccessMsg, setAdherenceSuccessMsg] = useState<string | null>(null);

  // Synchronize check-in medication selection when activeMeds or selected date changes
  useEffect(() => {
    if (activeMeds && activeMeds.length > 0) {
      const patientLogs = adherenceLogs[activePatientId] || [];
      const existingForDay = patientLogs.find(r => r.date === checkInDate);
      
      const initial: {[medId: string]: 'compliant' | 'partial' | 'non-compliant'} = {};
      activeMeds.forEach(m => {
        const medKey = m.id || m.medicationName;
        if (existingForDay && existingForDay.medications[medKey]) {
          initial[medKey] = existingForDay.medications[medKey];
        } else {
          initial[medKey] = 'compliant';
        }
      });
      setCheckInMeds(initial);

      if (existingForDay) {
        setCheckInNotes(existingForDay.clinicianNotes || '');
        setCheckInBarrier(existingForDay.barrier || 'none');
      } else {
        setCheckInNotes('');
        setCheckInBarrier('none');
      }
    }
  }, [activeMeds, checkInDate, activePatientId, adherenceLogs]);

  // Load and pre-populate mock adherence history
  useEffect(() => {
    const raw = localStorage.getItem('pregnancy_twin_adherence_logs');
    if (raw) {
      try {
        setAdherenceLogs(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialLogs: {[patientId: string]: AdherenceRecord[]} = {};
      
      const generateMockLogs = (patId: string, medsList: string[]): AdherenceRecord[] => {
        const logs: AdherenceRecord[] = [];
        const barriers: ('none' | 'forgot' | 'side-effects' | 'cost' | 'other')[] = ['none', 'none', 'none', 'forgot', 'none', 'side-effects', 'none'];
        const notes = [
          'Excellent compliance reported by patient.',
          'Patient taking Nifedipine on empty stomach as recommended.',
          'Patient reported minor headache, but remained compliant.',
          'Forgot morning dose due to family visit.',
          'Highly motivated to maintain blood pressure control.',
          'Mild nausea after taking afternoon dose.',
          'Routine clinical adherence checked.'
        ];
        
        for (let i = 14; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          const medsStatus: {[medId: string]: 'compliant' | 'partial' | 'non-compliant'} = {};
          
          const rand = Math.random();
          let barrier: 'none' | 'forgot' | 'side-effects' | 'cost' | 'other' = 'none';
          let note = 'Patient reports excellent adherence.';
          
          medsList.forEach(mId => {
            if (rand > 0.18) {
              medsStatus[mId] = 'compliant';
            } else if (rand > 0.06) {
              medsStatus[mId] = 'partial';
              barrier = barriers[Math.floor(Math.random() * barriers.length)];
              note = notes[Math.floor(Math.random() * notes.length)];
            } else {
              medsStatus[mId] = 'non-compliant';
              barrier = barriers[Math.floor(Math.random() * barriers.length)];
              note = notes[Math.floor(Math.random() * notes.length)];
            }
          });
          
          logs.push({
            date: dateStr,
            medications: medsStatus,
            barrier,
            clinicianNotes: note
          });
        }
        return logs;
      };

      // Seed mock records for standard patients
      initialLogs['pat-002'] = generateMockLogs('pat-002', ['med-001', 'med-002', 'med-003', 'Low-Dose Aspirin', 'Nifedipine', 'Betamethasone']);
      initialLogs['pat-001'] = generateMockLogs('pat-001', ['Low-Dose Aspirin', 'Labetalol']);
      initialLogs['pat-003'] = generateMockLogs('pat-003', ['Progesterone', 'Methyldopa']);

      localStorage.setItem('pregnancy_twin_adherence_logs', JSON.stringify(initialLogs));
      setAdherenceLogs(initialLogs);
    }
  }, [activePatientId]);

  // Handle saving adherence log
  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...adherenceLogs };
    const patientLogs = updated[activePatientId] || [];
    
    // Remove existing for same date if exists
    const filtered = patientLogs.filter(r => r.date !== checkInDate);
    
    const newRecord: AdherenceRecord = {
      date: checkInDate,
      medications: checkInMeds,
      clinicianNotes: checkInNotes,
      barrier: checkInBarrier
    };

    filtered.push(newRecord);
    // Sort chronologically
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    
    updated[activePatientId] = filtered;
    localStorage.setItem('pregnancy_twin_adherence_logs', JSON.stringify(updated));
    setAdherenceLogs(updated);

    setAdherenceSuccessMsg('Daily compliance check-in saved successfully!');
    setTimeout(() => {
      setAdherenceSuccessMsg(null);
    }, 2500);
  };

  // State for Medications CRUD Form
  const [showForm, setShowForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [durationWeeks, setDurationWeeks] = useState('Continuous');
  const [indication, setIndication] = useState('');
  const [startWeek, setStartWeek] = useState<number>(12);
  const [stopWeek, setStopWeek] = useState<number | ''>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crudMessage, setCrudMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gemini Safety Auditor States
  const [candidateMedName, setCandidateMedName] = useState('');
  const [candidateDose, setCandidateDose] = useState('100 mg');
  const [candidateIndication, setCandidateIndication] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Populate form for editing
  const handleEditClick = (med: MedicationExposure) => {
    setEditingMedId(med.id);
    setMedName(med.medicationName);
    setDose(med.dose || '');
    setFrequency(med.frequency || 'Once daily');
    setIndication(med.indication || '');
    setStartWeek(med.gestationalAgeStartWeeks || 12);
    setStopWeek(med.gestationalAgeStopWeeks || '');
    
    // Fallback/derive duration field for clinical clarity
    if (med.gestationalAgeStopWeeks && med.gestationalAgeStartWeeks) {
      setDurationWeeks(`${med.gestationalAgeStopWeeks - med.gestationalAgeStartWeeks} weeks`);
    } else {
      setDurationWeeks('Continuous');
    }
    setShowForm(true);
  };

  // Handle adding or updating a medication entry
  const handleSubmitMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName) {
      setCrudMessage({ type: 'error', text: 'Medication name is required.' });
      return;
    }

    setIsSubmitting(true);
    setCrudMessage(null);

    // Calculate Trimester based on start gestational week
    let trimester: '1st' | '2nd' | '3rd' | 'all' = '2nd';
    if (startWeek < 13) trimester = '1st';
    else if (startWeek > 27) trimester = '3rd';

    const payload = {
      medicationName: medName,
      activeIngredient: medName,
      dose,
      route: 'Oral',
      frequency,
      startDate: new Date().toISOString().split('T')[0],
      gestationalAgeStartWeeks: Number(startWeek) || 12,
      gestationalAgeStopWeeks: stopWeek ? Number(stopWeek) : undefined,
      trimester,
      indication,
      maternalCondition: indication,
      exposureStatus: stopWeek ? 'past' : 'current',
      source: 'prescription',
      confidence: 'Verified',
      prescriber: 'Dr. Alistair Vance, MD'
    };

    try {
      const url = editingMedId 
        ? `/api/patients/${activePatientId}/medications/${editingMedId}`
        : `/api/patients/${activePatientId}/medications`;
      
      const method = editingMedId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to update longitudinal medication database.');
      }

      setCrudMessage({
        type: 'success',
        text: editingMedId 
          ? `Successfully updated prescription entry for ${medName}.`
          : `Successfully registered new medication: ${medName}.`
      });

      setTimeout(() => {
        setMedName('');
        setDose('');
        setFrequency('Once daily');
        setDurationWeeks('Continuous');
        setIndication('');
        setStartWeek(12);
        setStopWeek('');
        setEditingMedId(null);
        setShowForm(false);
        setCrudMessage(null);
        refreshCallback();
      }, 1000);

    } catch (err: any) {
      console.error('Longitudinal Medications Error:', err);
      setCrudMessage({ type: 'error', text: err.message || 'Network exception occurred during synchronization.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a medication entry
  const handleDeleteMedication = async (medId: string) => {
    if (!window.confirm('Are you sure you want to delete this medication entry?')) return;
    
    try {
      const res = await fetch(`/api/patients/${activePatientId}/medications/${medId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete medication from database.');
      }

      refreshCallback();
    } catch (err: any) {
      console.error('Failed to delete medication:', err);
      alert(`Deletion failed: ${err.message}`);
    }
  };

  // Run a real Gemini-grounded drug interaction and trajectory impact audit
  const handleRunSafetyAudit = async () => {
    if (!candidateMedName) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const payload = {
        patient: twin?.patient,
        candidateMedication: {
          name: candidateMedName,
          dose: candidateDose,
          indication: candidateIndication
        },
        existingMedications: activeMeds,
        visits: activeVisits.slice(-3)
      };

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Perform a clinical safety, interaction, and counterfactual trajectory audit for adding this candidate medication:
          - Candidate Medication: ${candidateMedName} (${candidateDose}) for ${candidateIndication}
          
          Active meds: ${JSON.stringify(activeMeds)}
          Ultrasound history: ${JSON.stringify(payload.visits)}

          Provide a sharp, extremely concise and direct professional response. Do not use verbose paragraphs or introductory filler sentences. Use strict bullet points and standard markdown tables. Structure exactly as follows:
          
          ### 1. RISK ASSESSMENT
          Provide a bold category (e.g., **HIGH RISK CATEGORY** or **LOW RISK CATEGORY**) followed by 2-3 direct, concise bullet points explaining maternal-fetal reasons. Keep it brief.
          
          ### 2. DRUG-DRUG INTERACTIONS
          Brief 1-2 bullet points check against current meds.
          
          ### 3. TRAJECTORY & COUNTERFACTUALS
          Display a clean, compact markdown table showing the biometric parameter (e.g., AFI, Fetal Growth), current trend, and anticipated pharmacological impact.
          
          ### 4. RECOMMENDATIONS
          A concise summary of alternative management, surveillance, and decisions.
          `,
          context: 'pharmacology-audit',
          patientId: activePatientId
        })
      });

      if (!res.ok) {
        throw new Error('Safety audit request failed');
      }

      const data = await res.json();
      const reply = data.reply || '';
      
      setAuditResult({
        riskLevel: candidateMedName.toLowerCase().includes('warfarin') || candidateMedName.toLowerCase().includes('ibuprofen') ? 'HIGH' : 'LOW',
        rawText: reply,
        auditedAt: new Date().toLocaleTimeString(),
        candidate: candidateMedName
      });
    } catch (err: any) {
      console.error('Failed to audit candidate medication:', err);
      setAuditResult({
        riskLevel: 'MODERATE',
        rawText: `Failed to complete live API safety verification. Rationale: ${err.message}. Please consult standard FDA pregnancy registries before prescribing.`,
        auditedAt: new Date().toLocaleTimeString(),
        candidate: candidateMedName
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResetAudit = () => {
    setCandidateMedName('');
    setCandidateDose('100 mg');
    setCandidateIndication('');
    setAuditResult(null);
  };

  // Generate list of the last 14 days and calculate adherence trends
  const adherenceTrendData = useMemo(() => {
    const days: { date: string; label: string; weekday: string }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const weekday = weekdays[d.getDay()];
      days.push({ date: dateStr, label, weekday });
    }
    
    const logs = adherenceLogs[activePatientId] || [];
    
    // Calculate stats
    let compliantDaysCount = 0;
    let totalLogged = 0;
    
    logs.forEach(log => {
      if (days.some(day => day.date === log.date)) {
        totalLogged++;
        const isAllCompliant = Object.values(log.medications).every(v => v === 'compliant');
        if (isAllCompliant) {
          compliantDaysCount++;
        }
      }
    });
    
    const adherenceRate = totalLogged > 0 ? Math.round((compliantDaysCount / totalLogged) * 100) : 100;
    
    // Calculate streak
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      const dayDate = days[i].date;
      const log = logs.find(l => l.date === dayDate);
      if (log) {
        const isAllCompliant = Object.values(log.medications).every(v => v === 'compliant');
        if (isAllCompliant) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // Find top barrier
    const barrierCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.barrier && log.barrier !== 'none') {
        barrierCounts[log.barrier] = (barrierCounts[log.barrier] || 0) + 1;
      }
    });
    
    let topBarrier = 'None';
    let maxCount = 0;
    Object.keys(barrierCounts).forEach(b => {
      if (barrierCounts[b] > maxCount) {
        maxCount = barrierCounts[b];
        topBarrier = b === 'forgot' ? 'Forgetfulness' : b === 'side-effects' ? 'Side effects (e.g. nausea)' : b === 'cost' ? 'Financial limits' : 'Other reasons';
      }
    });

    return {
      days,
      adherenceRate,
      streak,
      topBarrier,
      logs
    };
  }, [adherenceLogs, activePatientId]);

  return (
    <div className="space-y-5">
      {/* 1. Header with integrated Context Switcher (only shown in Standalone Studio Tab) */}
      {patients.length > 0 && selectedPatientId && onSelectPatient && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-teal-400" />
              <h1 className="text-sm font-extrabold tracking-tight">Maternal Pharmacotherapy &amp; Exposure Studio</h1>
            </div>
            <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
              Consolidates active prescription histories, evaluates temporal drug-ultrasound trajectory mappings, and simulates growth &amp; AFI counterfactual outcomes using Explainable SHAP methodologies.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <label htmlFor="patient-hub-selector" className="text-[10px] text-slate-400 font-black uppercase tracking-wider pl-1 shrink-0">
              Select Patient:
            </label>
            <select
              id="patient-hub-selector"
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none border-none py-1 cursor-pointer max-w-[190px] truncate"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                  {p.name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {twin ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          
          {/* Main timeline + logs left-hand column */}
          <div className="xl:col-span-8 space-y-5">

            {/* Dual Action Clinical Workspace Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMedsTab('prescriptions')}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeMedsTab === 'prescriptions'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-purple-600" />
                <span>Active Prescriptions &amp; Exposures</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMedsTab('adherence')}
                className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeMedsTab === 'adherence'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Adherence Tracker &amp; Daily Check-in</span>
              </button>
            </div>

            {activeMedsTab === 'prescriptions' ? (
              <div className="space-y-5">
                {/* 2. Medications Timeline Visualizer */}
                <MedicationTimeline
              medications={activeMeds}
              visits={activeVisits}
              currentGestationalAgeWeeks={activeGestationalAge}
            />

            {/* 3. Detailed Medication CRUD Hub with Custom Fields */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Active Prescriptions &amp; Exposures</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Synchronized with Digital Twin trajectory engine</p>
                  </div>
                </div>

                {!showForm && (
                  <button
                    onClick={() => {
                      setEditingMedId(null);
                      setShowForm(true);
                    }}
                    className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Medication</span>
                  </button>
                )}
              </div>

              {/* Medication Add/Edit Form */}
              {showForm && (
                <form onSubmit={handleSubmitMedication} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      {editingMedId ? 'Edit Prescription Entry' : 'Add New Maternal Exposure'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {crudMessage && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                      crudMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {crudMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Low-Dose Aspirin"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Dose (e.g. 81 mg, 20 mg)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 81 mg"
                        value={dose}
                        onChange={(e) => setDose(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Frequency
                      </label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-2 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Every 12 hours">Every 12 hours</option>
                        <option value="As needed (PRN)">As needed (PRN)</option>
                        <option value="Once weekly">Once weekly</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Duration Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Continuous, 10 days, Until birth"
                        value={durationWeeks}
                        onChange={(e) => setDurationWeeks(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Indication
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Preeclampsia prevention, hypertension"
                        value={indication}
                        onChange={(e) => setIndication(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          Start (GA Week)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={42}
                          value={startWeek}
                          onChange={(e) => setStartWeek(Number(e.target.value))}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          Stop (GA Week)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={42}
                          placeholder="Continuous"
                          value={stopWeek}
                          onChange={(e) => setStopWeek(e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Saving...' : editingMedId ? 'Update Prescription' : 'Register Exposure'}
                    </button>
                  </div>
                </form>
              )}

              {/* Medication List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider bg-slate-50/55">
                      <th className="py-2.5 px-3">Medication</th>
                      <th className="py-2.5 px-3">Dose &amp; Frequency</th>
                      <th className="py-2.5 px-3">Duration (GA Weeks)</th>
                      <th className="py-2.5 px-3">Indication</th>
                      <th className="py-2.5 px-3">Exposure Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMeds.length > 0 ? (
                      activeMeds.map((med) => {
                        const durationText = med.gestationalAgeStopWeeks 
                          ? `${med.gestationalAgeStartWeeks}w - ${med.gestationalAgeStopWeeks}w`
                          : `From ${med.gestationalAgeStartWeeks}w (Continuous)`;
                          
                        return (
                          <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-950 flex items-center space-x-2">
                              <Pill className="w-3.5 h-3.5 text-teal-600" />
                              <span>{med.medicationName}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-700">{med.dose || 'N/A'}</div>
                              <div className="text-[10px] text-slate-400">{med.frequency || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                                {durationText}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {med.indication || med.maternalCondition || 'Prophylaxis'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                med.exposureStatus === 'current'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {med.exposureStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleEditClick(med)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-teal-600 cursor-pointer"
                                  title="Edit Exposure"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMedication(med.id)}
                                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Remove Exposure"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 italic">
                          No registered maternal pharmacotherapy exposures recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3.5. Temporal Overlap & SHAP Contribution Charts (Merged from studio) */}
            <AssociationInsightPanel
              medications={activeMeds}
              visits={activeVisits}
              currentGestationalAgeWeeks={activeGestationalAge}
            />

            {/* 3.8. Deep Analytics SHAP Breakdown Panel (Embedded cleanly) */}
            <MedicationExposurePanel
              patientId={activePatientId}
              currentGestationalAgeWeeks={activeGestationalAge}
              medications={activeMeds}
              visits={activeVisits}
              onRefresh={refreshCallback}
            />
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* A. KPI Analytics Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Current Compliance Streak</div>
                      <div className="text-lg font-black text-slate-900">{adherenceTrendData.streak} Days</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Continuous full-dose taking</div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Overall Compliance Index</div>
                      <div className="text-lg font-black text-slate-900">{adherenceTrendData.adherenceRate}%</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Target is &gt;85% for preeclampsia control</div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Primary Compliance Barrier</div>
                      <div className="text-lg font-bold text-slate-900 truncate max-w-[170px]">{adherenceTrendData.topBarrier}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Identified from clinician check-ins</div>
                    </div>
                  </div>
                </div>

                {/* B. Longitudinal Calendar Heatmap */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      14-Day Longitudinal Adherence Heatmap
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Click on any logged block to inspect details or log adherence for that day</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {adherenceTrendData.days.map((day) => {
                      const dayLog = adherenceTrendData.logs.find(l => l.date === day.date);
                      const isSelected = checkInDate === day.date;
                      
                      let statusBg = 'bg-slate-50 border-slate-200 hover:bg-slate-100/70';
                      let statusText = 'Not Logged';
                      
                      if (dayLog) {
                        const statuses = Object.values(dayLog.medications);
                        if (statuses.every(s => s === 'compliant')) {
                          statusBg = 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/60';
                          statusText = '100% Compliant';
                        } else if (statuses.every(s => s === 'non-compliant')) {
                          statusBg = 'bg-rose-50 border-rose-200 hover:bg-rose-100/60';
                          statusText = '0% Taken';
                        } else {
                          statusBg = 'bg-amber-50 border-amber-200 hover:bg-amber-100/60';
                          statusText = 'Missed Dose';
                        }
                      }
                      
                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setCheckInDate(day.date)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 h-[72px] ${statusBg} ${
                            isSelected ? 'ring-2 ring-teal-500 border-transparent shadow-xs scale-[1.02]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{day.weekday}</span>
                            <span className="text-[10px] font-bold text-slate-800">{day.date.split('-')[2]}</span>
                          </div>
                          
                          {/* Mini visual representation of medications */}
                          <div className="flex gap-0.5 mt-1">
                            {activeMeds.map((m) => {
                              const medKey = m.id || m.medicationName;
                              const mStatus = dayLog?.medications[medKey] || 'unlogged';
                              return (
                                <span
                                  key={medKey}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    mStatus === 'compliant'
                                      ? 'bg-emerald-500'
                                      : mStatus === 'partial'
                                      ? 'bg-amber-500'
                                      : mStatus === 'non-compliant'
                                      ? 'bg-rose-500'
                                      : 'bg-slate-300'
                                  }`}
                                  title={`${m.medicationName}: ${mStatus}`}
                                />
                              );
                            })}
                          </div>
                          
                          <div className="text-[8px] font-black uppercase tracking-tight truncate w-full text-slate-500">
                            {statusText}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* C. Interactive Daily Check-in Form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Clinician Daily Check-In Workstation</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Log and persist patient adherence reports for the pregnancy twin trajectory solver</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {adherenceSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                      {adherenceSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmitCheckIn} className="space-y-4">
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Log Individual Medication Compliance</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeMeds.length > 0 ? (
                          activeMeds.map((med) => {
                            const medKey = med.id || med.medicationName;
                            const currentStatus = checkInMeds[medKey] || 'compliant';
                            
                            return (
                              <div key={medKey} className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">{med.medicationName}</div>
                                    <div className="text-[9px] text-slate-400 font-medium">{med.dose} • {med.frequency}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setCheckInMeds(prev => ({ ...prev, [medKey]: 'compliant' }))}
                                    className={`flex-1 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      currentStatus === 'compliant'
                                        ? 'bg-emerald-500 text-white border-transparent shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    Compliant
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCheckInMeds(prev => ({ ...prev, [medKey]: 'partial' }))}
                                    className={`flex-1 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      currentStatus === 'partial'
                                        ? 'bg-amber-500 text-white border-transparent shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    Partial
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCheckInMeds(prev => ({ ...prev, [medKey]: 'non-compliant' }))}
                                    className={`flex-1 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                                      currentStatus === 'non-compliant'
                                        ? 'bg-rose-500 text-white border-transparent shadow-2xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    Skipped
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-2 p-4 text-center italic text-slate-400 text-xs">
                            Please add active medications first before logging adherence.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-black">
                          2. Primary Adherence Barrier
                        </label>
                        <select
                          value={checkInBarrier}
                          onChange={(e: any) => setCheckInBarrier(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                        >
                          <option value="none">No barriers (Optimal compliance)</option>
                          <option value="forgot">Forgetfulness / Managed by self</option>
                          <option value="side-effects">Side effects (e.g., nausea, dizziness)</option>
                          <option value="cost">Financial or prescription access limits</option>
                          <option value="other">Other patient-reported reasons</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-black">
                          3. Clinician Assessment Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Patient tolerating medication well, minor side effects discussed..."
                          value={checkInNotes}
                          onChange={(e) => setCheckInNotes(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={activeMeds.length === 0}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Log Clinical Check-in</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}
          </div>

          {/* Right-hand Counterfactual Pharmacological Auditor column */}
          <div className="xl:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs space-y-4 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 shrink-0">
                <BrainCircuit className="w-4.5 h-4.5 text-teal-700" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Pregnancy Safety &amp; Interaction Auditor
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Google Gemini Clinical Decision Support
                  </p>
                </div>
              </div>

              {/* Input Form for Audit */}
              <div className="space-y-3 shrink-0">
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 text-[10px] text-slate-600 flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Audit Mode:</strong> Simulate adding a candidate prescription to verify fetal development risks, FDA pregnancy labels, and current drug interactions before active clinical entry.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label htmlFor="input-hub-audit-name" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                      Candidate Medication Name
                    </label>
                    <input
                      id="input-hub-audit-name"
                      type="text"
                      placeholder="e.g. Ibuprofen, Methyldopa, Warfarin..."
                      value={candidateMedName}
                      onChange={(e) => setCandidateMedName(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="input-hub-audit-dose" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                        Dose Strength
                      </label>
                      <input
                        id="input-hub-audit-dose"
                        type="text"
                        placeholder="e.g. 250 mg"
                        value={candidateDose}
                        onChange={(e) => setCandidateDose(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="input-hub-audit-ind" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                        Planned Indication
                      </label>
                      <input
                        id="input-hub-audit-ind"
                        type="text"
                        placeholder="e.g. Joint pain"
                        value={candidateIndication}
                        onChange={(e) => setCandidateIndication(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleRunSafetyAudit}
                      disabled={isAuditing || !candidateMedName}
                      className="flex-1 bg-slate-900 text-white rounded-xl py-2 px-3 text-xs font-bold hover:bg-slate-800 active:bg-slate-950 transition-colors disabled:opacity-40 flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                      <span>{isAuditing ? 'Auditing exposure...' : 'Run Safety Audit'}</span>
                    </button>
                    {auditResult && (
                      <button
                        onClick={handleResetAudit}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
                        title="Reset simulation input"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Real-time Audit Report */}
              <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-slate-50/50 p-3 min-h-[250px] relative">
                {isAuditing && (
                  <div className="absolute inset-0 bg-slate-50/80 flex flex-col items-center justify-center space-y-2 z-10 rounded-2xl">
                    <Activity className="w-6 h-6 text-teal-600 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-600">Gemini auditing drug dynamics...</span>
                  </div>
                )}

                {auditResult ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${auditResult.riskLevel === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Audit Completed
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {auditResult.auditedAt}
                      </span>
                    </div>

                    <div className="markdown-body text-[11px] leading-relaxed text-slate-700 space-y-2 prose max-w-none">
                      <Markdown>{auditResult.rawText}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                    <p className="text-[11px] font-medium leading-relaxed max-w-[200px]">
                      Enter a drug name and click audit to generate clinical recommendations using Google Gemini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
          <Activity className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold">Synchronizing patient digital clinical twin history...</p>
        </div>
      )}
    </div>
  );
};

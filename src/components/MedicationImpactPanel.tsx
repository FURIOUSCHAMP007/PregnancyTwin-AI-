/**
 * PregnancyTwin AI - MedicationImpactPanel Component
 * Displays active medications as an interactive list/table and provides simple, elegant input fields
 * for drug name, dose, frequency, start/stop dates, and indication.
 * Fully connected to the patient data schema via secure API endpoints to enable real-time longitudinal tracking.
 */

import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  UserCheck, 
  Sparkles,
  Edit,
  X
} from 'lucide-react';
import { MedicationExposure, VisitMeasurement } from '../types';

interface MedicationImpactPanelProps {
  patientId: string;
  medications: MedicationExposure[];
  visits: VisitMeasurement[];
  currentGestationalAgeWeeks: number;
  onRefresh: () => void;
}

export const MedicationImpactPanel: React.FC<MedicationImpactPanelProps> = ({
  patientId,
  medications = [],
  visits = [],
  currentGestationalAgeWeeks,
  onRefresh
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Form Fields
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState('');
  const [indication, setIndication] = useState('');
  
  // Secondary Fields matching schema
  const [route, setRoute] = useState('Oral');
  const [gestationalAgeStartWeeks, setGestationalAgeStartWeeks] = useState<number>(12);
  const [gestationalAgeStopWeeks, setGestationalAgeStopWeeks] = useState<number | ''>('');
  const [maternalCondition, setMaternalCondition] = useState('');
  const [exposureStatus, setExposureStatus] = useState<'current' | 'past'>('current');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Reset
  const resetForm = () => {
    setMedicationName('');
    setDose('');
    setFrequency('Once daily');
    setStartDate(new Date().toISOString().split('T')[0]);
    setStopDate('');
    setIndication('');
    setRoute('Oral');
    setGestationalAgeStartWeeks(12);
    setGestationalAgeStopWeeks('');
    setMaternalCondition('');
    setExposureStatus('current');
    setEditingMedId(null);
    setShowForm(false);
  };

  // Populate form for editing
  const handleEditClick = (med: MedicationExposure) => {
    setEditingMedId(med.id);
    setMedicationName(med.medicationName);
    setDose(med.dose || '');
    setFrequency(med.frequency || 'Once daily');
    setStartDate(med.startDate || new Date().toISOString().split('T')[0]);
    setStopDate(med.stopDate || '');
    setIndication(med.indication || '');
    setRoute(med.route || 'Oral');
    setGestationalAgeStartWeeks(med.gestationalAgeStartWeeks || 12);
    setGestationalAgeStopWeeks(med.gestationalAgeStopWeeks || '');
    setMaternalCondition(med.maternalCondition || '');
    setExposureStatus(med.exposureStatus || 'current');
    setShowForm(true);
  };

  // Handles adding or updating a medication entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName) {
      setMessage({ type: 'error', text: 'Medication name is required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Calculate start trimester based on starting gestational week
    let trimester: '1st' | '2nd' | '3rd' | 'all' = '2nd';
    if (gestationalAgeStartWeeks < 13) trimester = '1st';
    else if (gestationalAgeStartWeeks > 27) trimester = '3rd';

    const payload = {
      medicationName,
      activeIngredient: medicationName, // default to drug name
      dose,
      route,
      frequency,
      startDate,
      stopDate: stopDate || undefined,
      gestationalAgeStartWeeks: Number(gestationalAgeStartWeeks) || 12,
      gestationalAgeStopWeeks: gestationalAgeStopWeeks ? Number(gestationalAgeStopWeeks) : undefined,
      trimester,
      indication,
      maternalCondition: maternalCondition || indication,
      exposureStatus,
      source: 'prescription',
      confidence: 'Verified',
      prescriber: 'Dr. Alistair Vance, MD'
    };

    try {
      const url = editingMedId 
        ? `/api/patients/${patientId}/medications/${editingMedId}`
        : `/api/patients/${patientId}/medications`;
      
      const method = editingMedId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to update longitudinal medication schema.');
      }

      const data = await res.json();
      setMessage({
        type: 'success',
        text: editingMedId 
          ? `Successfully updated prescription entry for ${medicationName}.`
          : `Successfully registered new clinical exposure: ${medicationName}.`
      });

      // Clear form & trigger system-wide patient data synchronization
      setTimeout(() => {
        resetForm();
        onRefresh();
      }, 1000);

    } catch (err: any) {
      console.error('Longitudinal Medications Error:', err);
      setMessage({ type: 'error', text: err.message || 'Network exception occurred during synchronization.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles removing a medication entry
  const handleDelete = async (medId: string) => {
    if (!window.confirm('Confirm removal of this active medication entry from the digital twin timeline?')) return;
    
    try {
      const res = await fetch(`/api/patients/${patientId}/medications/${medId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete medication from database.');
      }

      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete medication:', err);
      alert(`Deletion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Panel Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <Pill className="w-4 h-4 text-teal-800" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900">
              Maternal Medication Impact Panel
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              Longitudinal Pharmacotherapy Tracker
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-900 text-white rounded-xl py-1.5 px-3 text-xs font-bold hover:bg-slate-800 active:bg-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medication</span>
          </button>
        )}
      </div>

      {/* Medication Entry / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 animate-slide-down">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{editingMedId ? 'Edit Prescription Record' : 'Record New Medication Exposure'}</span>
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200/50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            
            {/* Medication Name */}
            <div className="md:col-span-4 space-y-1">
              <label htmlFor="med-name" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Drug Name *
              </label>
              <input
                id="med-name"
                type="text"
                placeholder="e.g. Labetalol, Aspirin"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            {/* Dosage */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="med-dose" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Dose Strength *
              </label>
              <input
                id="med-dose"
                type="text"
                placeholder="e.g. 100 mg, 81 mg"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            {/* Frequency */}
            <div className="md:col-span-5 space-y-1">
              <label htmlFor="med-freq" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Frequency *
              </label>
              <select
                id="med-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="Once daily">Once daily (QD)</option>
                <option value="Twice daily">Twice daily (BID)</option>
                <option value="Three times daily">Three times daily (TID)</option>
                <option value="Once weekly">Once weekly</option>
                <option value="As needed">As needed (PRN)</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="med-start-date" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Exposure Start Date
              </label>
              <input
                id="med-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Stop Date */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="med-stop-date" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Exposure Stop Date (Optional)
              </label>
              <input
                id="med-stop-date"
                type="date"
                value={stopDate}
                onChange={(e) => setStopDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Gestational Weeks Start */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="med-start-week" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Start Week GA *
              </label>
              <input
                id="med-start-week"
                type="number"
                min="0"
                max="42"
                value={gestationalAgeStartWeeks}
                onChange={(e) => setGestationalAgeStartWeeks(Number(e.target.value))}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            {/* Gestational Weeks Stop */}
            <div className="md:col-span-3 space-y-1">
              <label htmlFor="med-stop-week" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Stop Week GA
              </label>
              <input
                id="med-stop-week"
                type="number"
                min="0"
                max="42"
                placeholder="Active"
                value={gestationalAgeStopWeeks}
                onChange={(e) => setGestationalAgeStopWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Clinical Indication */}
            <div className="md:col-span-6 space-y-1">
              <label htmlFor="med-indication" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Clinical Indication *
              </label>
              <input
                id="med-indication"
                type="text"
                placeholder="e.g. Gestational Hypertension, Preeclampsia risk"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            {/* Maternal Target Condition */}
            <div className="md:col-span-6 space-y-1">
              <label htmlFor="med-maternal-cond" className="block text-[9px] uppercase tracking-wider text-slate-500 font-black">
                Maternal Underlying Condition
              </label>
              <input
                id="med-maternal-cond"
                type="text"
                placeholder="e.g. Chronic Hypertension, Type 2 Diabetes"
                value={maternalCondition}
                onChange={(e) => setMaternalCondition(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons & Feedback message */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
            <div>
              {message && (
                <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                  message.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2 px-4 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-900 text-white rounded-xl py-2 px-4 text-xs font-bold hover:bg-slate-800 active:bg-slate-950 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Syncing...' : editingMedId ? 'Save Prescription' : 'Register Exposure'}
              </button>
            </div>
          </div>

        </form>
      )}

      {/* List of Active Medications */}
      <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
        {medications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-150 text-[9px] uppercase tracking-wider font-black text-slate-500">
                  <th className="py-3 px-4">Medication Name</th>
                  <th className="py-3 px-4">Dose &amp; Frequency</th>
                  <th className="py-3 px-4">Indication</th>
                  <th className="py-3 px-4 font-mono">Exposure Window</th>
                  <th className="py-3 px-4 text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {medications.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <div>
                          <span className="font-extrabold text-slate-950 block">{med.medicationName}</span>
                          <span className="text-[10px] text-slate-400 font-mono capitalize">{med.exposureStatus} • {med.route}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px] inline-block mb-0.5">{med.dose}</span>
                        <span className="text-[10px] text-slate-400 block">{med.frequency}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-800">{med.indication}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex flex-col">
                        <span>{med.startDate ? new Date(med.startDate).toLocaleDateString() : 'N/A'} {med.stopDate ? `→ ${new Date(med.stopDate).toLocaleDateString()}` : '(Active)'}</span>
                        <span className="text-[10px] text-teal-600 font-sans font-bold">Week {med.gestationalAgeStartWeeks} {med.gestationalAgeStopWeeks ? `to ${med.gestationalAgeStopWeeks}` : 'onward'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right pr-5">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(med)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit prescription parameter"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete medication entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-1.5">
            <Pill className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No Longitudinal Medications Registered</p>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Click "Add Medication" to document exposures and synchronize with developmental velocities.</p>
          </div>
        )}
      </div>

    </div>
  );
};

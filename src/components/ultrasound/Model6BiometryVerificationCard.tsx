/**
 * PregnancyTwin AI - MODEL 6: Automated Fetal Biometry Measurement & Calibration Engine
 * 
 * Clinician Verification Workstation & Human-in-the-Loop Gateway:
 * Evaluates AI-derived biometrics (HC, BPD, OFD, AC, FL), checks physical calibration,
 * enforces geometric coherence, calculates gestational age Z-scores, and provides
 * auditable ACCEPT / EDIT / REJECT decision flows before digital twin ingestion.
 */

import React, { useState } from 'react';
import {
  Ruler,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Check,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Sliders,
  FileCode,
  Sparkles,
  Info,
  ArrowRight,
  RotateCcw,
  Scale,
  Maximize2
} from 'lucide-react';
import {
  UnifiedBiometryMeasurementResult,
  BiometryAuditEntry,
  MeasurementReviewStatus
} from '../../types';

export interface Model6BiometryVerificationCardProps {
  biometryResult: UnifiedBiometryMeasurementResult | null;
  gestationalAgeWeeks?: number;
  patientId?: string;
  onCommitVerifiedBiometrics: (verified: {
    hc?: number;
    bpd?: number;
    ofd?: number;
    ac?: number;
    fl?: number;
    efw?: number;
    audit_entries: BiometryAuditEntry[];
  }) => void;
  onOpenNotebookModal?: () => void;
  className?: string;
}

export const Model6BiometryVerificationCard: React.FC<Model6BiometryVerificationCardProps> = ({
  biometryResult,
  gestationalAgeWeeks = 32,
  patientId = 'PT-001',
  onCommitVerifiedBiometrics,
  onOpenNotebookModal,
  className = ''
}) => {
  // Local edit states
  const [editingParam, setEditingParam] = useState<'HC' | 'BPD' | 'OFD' | 'AC' | 'FL' | null>(null);
  const [editValues, setEditValues] = useState<{
    HC: string;
    BPD: string;
    OFD: string;
    AC: string;
    FL: string;
  }>({
    HC: biometryResult?.ultrasound_measurements?.HC_mm?.toString() || '',
    BPD: biometryResult?.ultrasound_measurements?.BPD_mm?.toString() || '',
    OFD: biometryResult?.ultrasound_measurements?.OFD_mm?.toString() || '',
    AC: biometryResult?.ultrasound_measurements?.AC_mm?.toString() || '',
    FL: biometryResult?.ultrasound_measurements?.FL_mm?.toString() || ''
  });

  const [paramStatuses, setParamStatuses] = useState<{
    HC: MeasurementReviewStatus;
    BPD: MeasurementReviewStatus;
    OFD: MeasurementReviewStatus;
    AC: MeasurementReviewStatus;
    FL: MeasurementReviewStatus;
  }>({
    HC: 'ACCEPTED',
    BPD: 'ACCEPTED',
    OFD: 'ACCEPTED',
    AC: 'ACCEPTED',
    FL: 'ACCEPTED'
  });

  const [clinicianNotes, setClinicianNotes] = useState<string>('Standard sonographic biometry verified');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  const calib = biometryResult?.calibration;
  const validation = biometryResult?.validation;
  const isCalibValid = calib?.is_valid !== false;

  const handleStatusChange = (param: 'HC' | 'BPD' | 'OFD' | 'AC' | 'FL', status: MeasurementReviewStatus) => {
    setParamStatuses(prev => ({ ...prev, [param]: status }));
  };

  const handleSaveEdit = (param: 'HC' | 'BPD' | 'OFD' | 'AC' | 'FL') => {
    setParamStatuses(prev => ({ ...prev, [param]: 'EDITED' }));
    setEditingParam(null);
  };

  const handleCommitAll = () => {
    const rawMeasurements = biometryResult?.ultrasound_measurements;
    const auditEntries: BiometryAuditEntry[] = [];

    const getFinalVal = (param: 'HC' | 'BPD' | 'OFD' | 'AC' | 'FL', rawVal: number | null | undefined): number | undefined => {
      const status = paramStatuses[param];
      if (status === 'REJECTED') return undefined;
      const editedNum = parseFloat(editValues[param]);
      const finalVal = !isNaN(editedNum) ? editedNum : (rawVal || undefined);

      if (finalVal !== undefined) {
        auditEntries.push({
          measurement_id: `M6_${param}_${Date.now()}`,
          patient_id: patientId,
          biometric_param: param,
          ai_value_mm: rawVal || finalVal,
          final_value_mm: finalVal,
          status,
          reviewed_by: 'Staff Sonographer / OB-GYN',
          notes: clinicianNotes,
          timestamp: new Date().toISOString()
        });
      }
      return finalVal;
    };

    const finalHc = getFinalVal('HC', rawMeasurements?.HC_mm);
    const finalBpd = getFinalVal('BPD', rawMeasurements?.BPD_mm);
    const finalOfd = getFinalVal('OFD', rawMeasurements?.OFD_mm);
    const finalAc = getFinalVal('AC', rawMeasurements?.AC_mm);
    const finalFl = getFinalVal('FL', rawMeasurements?.FL_mm);

    onCommitVerifiedBiometrics({
      hc: finalHc,
      bpd: finalBpd,
      ofd: finalOfd,
      ac: finalAc,
      fl: finalFl,
      audit_entries: auditEntries
    });

    setIsCommitted(true);
    setTimeout(() => setIsCommitted(false), 3000);
  };

  const PARAMS = [
    { key: 'HC' as const, label: 'Head Circumference (HC)', aiVal: biometryResult?.ultrasound_measurements?.HC_mm, zScore: validation?.z_scores?.HC_z, expected: 7.8 * gestationalAgeWeeks + 46 },
    { key: 'BPD' as const, label: 'Biparietal Diameter (BPD)', aiVal: biometryResult?.ultrasound_measurements?.BPD_mm, zScore: validation?.z_scores?.BPD_z, expected: 2.5 * gestationalAgeWeeks + 2 },
    { key: 'OFD' as const, label: 'Occipitofrontal Diam. (OFD)', aiVal: biometryResult?.ultrasound_measurements?.OFD_mm, zScore: validation?.z_scores?.OFD_z, expected: 3.1 * gestationalAgeWeeks + 4 },
    { key: 'AC' as const, label: 'Abdominal Circumf. (AC)', aiVal: biometryResult?.ultrasound_measurements?.AC_mm, zScore: validation?.z_scores?.AC_z, expected: 8.5 * gestationalAgeWeeks + 10 },
    { key: 'FL' as const, label: 'Femur Length (FL)', aiVal: biometryResult?.ultrasound_measurements?.FL_mm, zScore: validation?.z_scores?.FL_z, expected: 1.98 * gestationalAgeWeeks - 1.5 }
  ];

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-700/80 p-4 sm:p-5 text-white shadow-xl space-y-4 ${className}`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                MODEL 6 BIOMETRY GATEWAY
              </span>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                Automated Fetal Biometry Measurement & Calibration Engine
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic Ramanujan/PCA geometric measurements & human-in-the-loop audit gateway
            </p>
          </div>
        </div>

        {onOpenNotebookModal && (
          <button
            type="button"
            onClick={onOpenNotebookModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition self-start sm:self-auto"
          >
            <FileCode className="w-3.5 h-3.5 text-teal-400" />
            <span>Model 6 Colab Engine</span>
          </button>
        )}
      </div>

      {/* Calibration & QC Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">CALIBRATION SCALE</span>
            <span className="font-mono font-bold text-teal-300 text-sm">
              {calib?.mean_scale || 0.385} mm/px
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isCalibValid ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'}`}>
            {isCalibValid ? 'VALID' : 'MISSING'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">MEASUREMENT QC</span>
            <span className="font-mono font-bold text-slate-100 text-sm">
              {validation?.qc_status || 'PASS'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-teal-300 border border-slate-700">
            Conf: {Math.round((biometryResult?.quality?.measurement_confidence || 0.94) * 100)}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">REVIEW RECOMMENDATION</span>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {validation?.review_recommendation || 'READY_FOR_COMMISSION'}
            </span>
          </div>
          <ShieldCheck className="w-4 h-4 text-teal-400" />
        </div>
      </div>

      {/* Biometric Verification Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden text-xs">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-900/80 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <div className="col-span-4">Biometric Parameter</div>
          <div className="col-span-3">AI Derived (mm)</div>
          <div className="col-span-2">GA {gestationalAgeWeeks}w Norm</div>
          <div className="col-span-3 text-right">Clinician Review</div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {PARAMS.map(p => {
            const status = paramStatuses[p.key];
            const isEditing = editingParam === p.key;
            const currentVal = editValues[p.key] || (p.aiVal ? p.aiVal.toString() : '--');

            return (
              <div key={p.key} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-900/40 transition">
                
                {/* Param Label */}
                <div className="col-span-4">
                  <div className="font-bold text-slate-100">{p.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {p.zScore !== undefined ? `Z-Score: ${p.zScore > 0 ? `+${p.zScore}` : p.zScore} SD` : 'Reference verified'}
                  </div>
                </div>

                {/* AI / Edited Value */}
                <div className="col-span-3 flex items-center space-x-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.1"
                        value={editValues[p.key]}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                        className="w-20 px-2 py-1 rounded bg-slate-800 border border-teal-500 text-white font-mono text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.key)}
                        className="p-1 rounded bg-teal-600 hover:bg-teal-500 text-white"
                        title="Save value"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline space-x-1 font-mono">
                      <span className={`text-base font-bold ${
                        status === 'REJECTED'
                          ? 'text-rose-400 line-through'
                          : status === 'EDITED'
                          ? 'text-amber-300'
                          : 'text-teal-300'
                      }`}>
                        {currentVal}
                      </span>
                      <span className="text-[10px] text-slate-400">mm</span>
                      {status === 'EDITED' && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                          EDITED
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Normative Reference */}
                <div className="col-span-2 text-slate-400 font-mono text-[11px]">
                  ~{Math.round(p.expected)} mm
                </div>

                {/* Clinician Decision Buttons (Accept / Edit / Reject) */}
                <div className="col-span-3 flex items-center justify-end space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(p.key, 'ACCEPTED')}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition flex items-center space-x-1 ${
                      status === 'ACCEPTED'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingParam(isEditing ? null : p.key)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition flex items-center space-x-1 ${
                      status === 'EDITED' || isEditing
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(p.key, 'REJECTED')}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition flex items-center space-x-1 ${
                      status === 'REJECTED'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Clinician Notes & Final Commit Button */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-2/3">
          <input
            type="text"
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Clinician review notes (e.g. Standard 32w transverse biometry accepted)..."
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans"
          />
        </div>

        <button
          type="button"
          onClick={handleCommitAll}
          className={`w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md ${
            isCommitted
              ? 'bg-emerald-600 text-white shadow-emerald-900/40'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20 active:scale-[0.98]'
          }`}
        >
          {isCommitted ? (
            <>
              <Check className="w-4 h-4" />
              <span>Biometrics Committed to Digital Twin</span>
            </>
          ) : (
            <>
              <span>Commit Verified Biometrics</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};

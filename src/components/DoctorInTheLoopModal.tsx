/**
 * PregnancyTwin AI - Doctor-In-The-Loop Review & Calibration Modal
 * Allows clinicians to accept, edit, or reject automated AI measurements
 */

import React, { useState } from 'react';
import { X, CheckCircle2, Edit2, AlertOctagon, ShieldCheck, Camera } from 'lucide-react';
import { VisitMeasurement, MeasurementStatus } from '../types';

interface DoctorInTheLoopModalProps {
  measurement: VisitMeasurement | null;
  onClose: () => void;
  onSaveReview: (
    measurementId: string,
    status: MeasurementStatus,
    edits?: Partial<VisitMeasurement>,
    doctorNotes?: string
  ) => void;
}

export const DoctorInTheLoopModal: React.FC<DoctorInTheLoopModalProps> = ({
  measurement,
  onClose,
  onSaveReview
}) => {
  if (!measurement) return null;

  const [status, setStatus] = useState<MeasurementStatus>(measurement.doctorReviewStatus || 'accepted');
  const [afi, setAfi] = useState<number>(measurement.amnioticFluidIndex_cm);
  const [sdp, setSdp] = useState<number>(measurement.singleDeepestPocket_cm);
  const [efw, setEfw] = useState<number>(measurement.estimatedFetalWeight_g);
  const [growthPct, setGrowthPct] = useState<number>(measurement.growthPercentile);
  const [notes, setNotes] = useState<string>(measurement.doctorNotes || '');

  const handleSave = () => {
    onSaveReview(
      measurement.id,
      status,
      {
        amnioticFluidIndex_cm: afi,
        singleDeepestPocket_cm: sdp,
        estimatedFetalWeight_g: efw,
        growthPercentile: growthPct
      },
      notes
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Doctor-in-the-Loop Clinical Verification</h3>
              <p className="text-[11px] text-slate-500">
                Review & calibrate extracted sonographic parameters for Visit {measurement.visitNumber} ({measurement.gestationalAgeWeeks}w)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs">
          
          {/* Ultrasound Plane & Caliper Simulation View */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 font-semibold flex items-center">
                <Camera className="w-3.5 h-3.5 mr-1 text-teal-600" />
                Amniotic Fluid & Caliper Measurement Plane
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Quality: {Math.round((measurement.imageQualityScore || 0.92) * 100)}% (Good Contrast)
              </span>
            </div>

            {/* Visual Caliper SVG Overlay */}
            <div className="relative w-full h-36 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-90" />
              
              {/* Sonographic grain texture simulator */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />

              {/* Fetal pocket visualization */}
              <div className="relative z-10 w-48 h-20 rounded-full border border-teal-500/40 bg-teal-950/40 flex flex-col items-center justify-center">
                <span className="text-[10px] text-teal-300 font-mono font-medium">Single Deepest Pocket (SDP)</span>
                <span className="text-xs font-bold text-white font-mono">{sdp.toFixed(1)} cm</span>
                <div className="w-24 h-0.5 bg-teal-400 my-1 relative">
                  <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full border border-teal-200 bg-teal-400" />
                  <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full border border-teal-200 bg-teal-400" />
                </div>
                <span className="text-[9px] text-slate-400">Vertical Depth Caliper #1</span>
              </div>
            </div>
          </div>

          {/* Action Selection Buttons */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Clinician Verification Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('accepted')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  status === 'accepted'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept (Verified)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('edited')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  status === 'edited'
                    ? 'bg-teal-50 text-teal-800 border-teal-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Calibrate / Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  status === 'rejected'
                    ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Reject Scan</span>
              </button>
            </div>
          </div>

          {/* Editable Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-[11px]">AFI (cm)</label>
              <input
                type="number"
                step="0.1"
                value={afi}
                disabled={status === 'accepted'}
                onChange={(e) => {
                  setAfi(parseFloat(e.target.value) || 0);
                  setStatus('edited');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-[11px]">SDP / MVP (cm)</label>
              <input
                type="number"
                step="0.1"
                value={sdp}
                disabled={status === 'accepted'}
                onChange={(e) => {
                  setSdp(parseFloat(e.target.value) || 0);
                  setStatus('edited');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-[11px]">EFW (grams)</label>
              <input
                type="number"
                step="10"
                value={efw}
                disabled={status === 'accepted'}
                onChange={(e) => {
                  setEfw(parseInt(e.target.value, 10) || 0);
                  setStatus('edited');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1 text-[11px]">Growth %ile</label>
              <input
                type="number"
                step="1"
                min="1"
                max="99"
                value={growthPct}
                disabled={status === 'accepted'}
                onChange={(e) => {
                  setGrowthPct(parseInt(e.target.value, 10) || 1);
                  setStatus('edited');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Doctor Notes input */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1 text-[11px]">Clinician Verification Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Manual caliper verification confirmed. Lower quadrant pockets were clearly depicted..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none text-xs"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Recorded to Firestore audit log upon confirmation
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
            >
              Save Verification
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

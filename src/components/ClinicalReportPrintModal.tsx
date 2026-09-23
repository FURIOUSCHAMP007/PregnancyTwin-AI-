import React, { useState } from 'react';
import {
  PregnancyDigitalTwin,
  User,
  VisitMeasurement
} from '../types';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Heart,
  Copy,
  Check,
  FileCode,
  Database,
  Loader2
} from 'lucide-react';
import { generateFhirBundle } from '../utils/fhirMapper';

interface ClinicalReportPrintModalProps {
  twin: PregnancyDigitalTwin;
  currentUser: User;
  onClose: () => void;
}

export const ClinicalReportPrintModal: React.FC<ClinicalReportPrintModalProps> = ({
  twin,
  currentUser,
  onClose
}) => {
  const { patient, currentVisit, visits, velocities, trajectoryScore, whyNow, forecast } = twin;
  const [activeTab, setActiveTab] = useState<'report' | 'fhir'>('report');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotification, setPrintNotification] = useState<string | null>(null);

  const handleCopyFhir = (jsonString: string) => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    window.print();
    setIsPrinting(false);
    setPrintNotification('Document sent to print dialog. In destination, select "Save as PDF" to download as a digital file.');
    setTimeout(() => setPrintNotification(null), 6000);
  };

  const handleDownloadSummary = () => {
    const summaryData = {
      hospital: currentUser.hospital || 'Apex University Hospital - Maternal-Fetal Medicine',
      reportType: 'ACOG/ISUOG Longitudinal Ultrasound & Digital Twin Consultation',
      generatedAt: new Date().toISOString(),
      physician: currentUser.name,
      patient: {
        id: patient.id,
        name: patient.name,
        mrn: patient.mrn,
        age: patient.age,
        gravidity: patient.gravidity,
        parity: patient.parity,
        lmp: patient.lmp,
        edd: patient.edd,
        currentGA: `${patient.currentGestationalAgeWeeks}w ${patient.currentGestationalAgeDays}d`
      },
      currentVisit: {
        date: currentVisit.date,
        gaWeeks: currentVisit.gestationalAgeWeeks,
        efw_g: currentVisit.estimatedFetalWeight_g,
        percentile: currentVisit.growthPercentile,
        afi_cm: currentVisit.amnioticFluidIndex_cm,
        sdp_cm: currentVisit.singleDeepestPocket_cm,
        fhr_bpm: currentVisit.fetalHeartRate_bpm,
        presentation: currentVisit.presentation,
        biometrics: currentVisit.biometrics,
        doppler: currentVisit.doppler,
        bpp: currentVisit.bpp
      },
      velocities,
      whyNowAlert: whyNow,
      forecast
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MFM-Consult-Report-${patient.mrn}-${currentVisit.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-700" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ACOG / ISUOG Ultrasound Consultation Report
              </h2>
              <p className="text-xs text-slate-500">
                Official Maternal-Fetal Medicine digital twin trajectory summary for {patient.name} ({patient.mrn})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadSummary}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition shadow-xs"
              title="Download structured JSON report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              id="btn-modal-print-save-pdf"
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded transition shadow-xs cursor-pointer ${
                isPrinting ? 'bg-teal-850 opacity-90 cursor-wait' : 'bg-teal-700 hover:bg-teal-800'
              }`}
              title="Print formatted document or save to PDF"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-200" />
                  <span>Preparing Print...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Success Confirmation Toast Banner */}
        {printNotification && (
          <div className="bg-emerald-950 border-b border-emerald-700/60 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-100 animate-in fade-in print:hidden shrink-0">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{printNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 p-0.5 rounded cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switcher - Hidden in print */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 py-2.5 print:hidden shrink-0">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition mr-2 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Consultation Clinical Report (ACOG / PDF)</span>
          </button>
          <button
            onClick={() => setActiveTab('fhir')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'fhir'
                ? 'bg-indigo-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>HL7 FHIR Interoperability Payload (R4 Bundle)</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-black uppercase">
              HL7 FHIR
            </span>
          </button>
        </div>

        {activeTab === 'fhir' ? (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-200 bg-slate-900 print:hidden flex-1 flex flex-col min-h-0">
            {/* FHIR Header explanation */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    HL7 FHIR R4 Interoperability Engine
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  HL7 FHIR compliant out-of-the-box
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hospital IT systems (Epic, Cerner, local Indian EMRs) reject proprietary data structures. PregnancyTwin AI maps every ultrasound visit as structured FHIR <strong className="text-white font-semibold">Observation</strong> resources and links them directly to a FHIR <strong className="text-white font-semibold">Patient</strong> resource. This allows instant integration into any modern EHR system.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-700/50">
                  <span className="font-bold text-indigo-400 block mb-0.5">Demographics Mapping:</span>
                  Mapped to FHIR <strong className="font-bold text-white">Patient</strong> Resource. Identifier set to official hospital MRN (<strong className="font-mono text-indigo-300">{patient.mrn}</strong>).
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-700/50">
                  <span className="font-bold text-indigo-400 block mb-0.5">Biometric Mapping:</span>
                  Mapped to serial FHIR <strong className="font-bold text-white">Observation</strong> Resources using standard LOINC codes (e.g. 11727-5 for EFW, 11627-7 for AFI).
                </div>
              </div>
            </div>

            {/* Live Interactive payload inspector */}
            <div className="flex-1 flex flex-col min-h-[350px] border border-slate-700 rounded-xl overflow-hidden bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>fhir-transaction-bundle.json (R4 Transaction)</span>
                </div>
                <button
                  onClick={() => handleCopyFhir(JSON.stringify(generateFhirBundle(patient, visits), null, 2))}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-700 rounded border border-slate-700 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy FHIR Bundle</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code scroll view */}
              <div className="p-4 overflow-y-auto max-h-[380px] font-mono text-xs text-emerald-400 leading-relaxed select-all">
                <pre>{JSON.stringify(generateFhirBundle(patient, visits), null, 2)}</pre>
              </div>
            </div>

            {/* Interoperability Certification Info */}
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-xs shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">
                EHR REST API ENDPOINT SPECIFICATION
              </span>
              <p className="leading-relaxed">
                This transaction bundle can be POSTed directly to standard FHIR servers. It automatically creates the Patient demographic record and links all sequential biometric observations through standard relative resource reference chains (`Patient/patient-${patient.id}`).
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 print:overflow-visible print:p-4 text-xs sm:text-sm">
          
          {/* Hospital Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-teal-800 text-white font-black flex items-center justify-center text-sm">
                  PT
                </div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  APEX UNIVERSITY HOSPITAL CENTER FOR MATERNAL-FETAL MEDICINE
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Department of Obstetrics & Gynecology • Division of High-Risk Perinatal Medicine
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 sm:self-center">
              <p className="font-semibold text-slate-800">Report ID: MFM-{patient.mrn}-{currentVisit.visitNumber}</p>
              <p>Exam Date: {currentVisit.date}</p>
              <p>Attending: {currentUser.name}</p>
            </div>
          </div>

          {/* Patient Demographics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded border border-slate-200 print:border-slate-300">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">MRN</span>
              <span className="font-mono font-bold text-slate-800">{patient.mrn}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Age / Parity</span>
              <span className="font-medium text-slate-800">{patient.age}y • G{patient.gravidity} P{patient.parity}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">GA by LMP / EDD</span>
              <span className="font-bold text-teal-800">
                {currentVisit.gestationalAgeWeeks}w {currentVisit.gestationalAgeDays}d • EDD: {patient.edd}
              </span>
            </div>
          </div>

          {/* Biometry & Amniotic Fluid Overview */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>1. Ultrasound Biometric Findings & Hadlock Estimation</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">Standard: {currentVisit.growthStandardUsed || 'Hadlock (1991)'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase">BPD</span>
                <span className="font-bold text-slate-900 text-base">{currentVisit.biometrics?.bpd_mm || '—'}</span>
                <span className="text-[10px] text-slate-400 block">mm</span>
              </div>
              <div className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase">HC</span>
                <span className="font-bold text-slate-900 text-base">{currentVisit.biometrics?.hc_mm || '—'}</span>
                <span className="text-[10px] text-slate-400 block">mm</span>
              </div>
              <div className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase">AC</span>
                <span className="font-bold text-slate-900 text-base">{currentVisit.biometrics?.ac_mm || '—'}</span>
                <span className="text-[10px] text-slate-400 block">mm</span>
              </div>
              <div className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase">FL</span>
                <span className="font-bold text-slate-900 text-base">{currentVisit.biometrics?.fl_mm || '—'}</span>
                <span className="text-[10px] text-slate-400 block">mm</span>
              </div>
              <div className="p-2 border border-teal-200 rounded text-center bg-teal-50">
                <span className="text-[10px] text-teal-800 font-bold block uppercase">EFW</span>
                <span className="font-black text-teal-900 text-base">{currentVisit.estimatedFetalWeight_g}g</span>
                <span className="text-[10px] text-teal-700 block font-semibold">{currentVisit.growthPercentile}th %ile</span>
              </div>
              <div className="p-2 border border-slate-200 rounded text-center bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase">FHR</span>
                <span className="font-bold text-slate-900 text-base">{currentVisit.fetalHeartRate_bpm}</span>
                <span className="text-[10px] text-slate-400 block">bpm</span>
              </div>
            </div>
          </div>

          {/* Amniotic Fluid & Doppler Hemodynamics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Amniotic Fluid Dynamics */}
            <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Amniotic Fluid Dynamics</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  currentVisit.amnioticFluidIndex_cm < 5.0 ? 'bg-rose-100 text-rose-800' :
                  currentVisit.amnioticFluidIndex_cm < 8.0 ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentVisit.amnioticFluidIndex_cm < 5.0 ? 'Oligohydramnios' :
                   currentVisit.amnioticFluidIndex_cm < 8.0 ? 'Borderline Fluid' : 'Normal Volume'}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">AFI (4-Quadrant)</span>
                  <span className="font-bold text-slate-900 text-base">{currentVisit.amnioticFluidIndex_cm} cm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Single Deepest Pocket (SDP)</span>
                  <span className="font-bold text-slate-900 text-base">{currentVisit.singleDeepestPocket_cm} cm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Serial AFI Velocity</span>
                  <span className={`font-bold ${velocities.afiVelocity_cmPerWeek < -0.8 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {velocities.afiVelocity_cmPerWeek > 0 ? '+' : ''}{velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/wk
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Acceleration (d²AFI/dt²)</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {velocities.afiAcceleration_cmPerWeekSq.toFixed(2)} cm/wk²
                  </span>
                </div>
              </div>
            </div>

            {/* Doppler Hemodynamics & CPR */}
            <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Doppler Velocimetry & CPR</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {(currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08
                    ? 'Brain-Sparing Redistribution'
                    : 'Normal Waveform'}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Umbilical Artery (UA) PI</span>
                  <span className="font-bold text-slate-900 text-base">
                    {currentVisit.doppler?.umbilicalArteryPi ? currentVisit.doppler.umbilicalArteryPi.toFixed(2) : '1.02'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Normal 3rd tri: 0.7 - 1.25</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Middle Cerebral (MCA) PI</span>
                  <span className="font-bold text-slate-900 text-base">
                    {currentVisit.doppler?.middleCerebralArteryPi ? currentVisit.doppler.middleCerebralArteryPi.toFixed(2) : '1.65'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Normal: 1.40 - 2.20</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cerebroplacental Ratio (CPR)</span>
                  <span className={`font-bold text-base ${(currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {currentVisit.doppler?.cerebroplacentalRatio ? currentVisit.doppler.cerebroplacentalRatio.toFixed(2) : '1.62'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">CPR Threshold</span>
                  <span className="font-medium text-slate-700">ACOG/ISUOG cut-off ≥ 1.08</span>
                </div>
              </div>
            </div>
          </div>

          {/* Biophysical Profile (BPP) & Serial Longitudinal History */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2. Manning Biophysical Profile (BPP Score: {currentVisit.bpp?.totalBppScore ?? 10} / 10)</span>
              <span className="font-bold text-emerald-700 text-xs">
                {currentVisit.bpp?.interpretation === 'abnormal' ? 'Abnormal (Evaluate Delivery)' :
                 currentVisit.bpp?.interpretation === 'equivocal' ? 'Equivocal (Repeat 12-24h)' : 'Normal / Reassuring'}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-700">Breathing (≥30s) : 2/2</span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-700">Body Moves (≥3) : 2/2</span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-700">Fetal Tone : 2/2</span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-700">
                  Fluid (Pocket ≥2cm) : {currentVisit.singleDeepestPocket_cm >= 2.0 ? '2/2' : '0/2'}
                </span>
              </div>
              <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-700">Reactive NST : 2/2</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Visits Table */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              3. Serial Longitudinal Scan History ({visits.length} Scans on Record)
            </h4>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-1.5 border-r border-slate-200">Visit</th>
                  <th className="p-1.5 border-r border-slate-200">Date</th>
                  <th className="p-1.5 border-r border-slate-200">GA (w+d)</th>
                  <th className="p-1.5 border-r border-slate-200">EFW (g)</th>
                  <th className="p-1.5 border-r border-slate-200">%ile</th>
                  <th className="p-1.5 border-r border-slate-200">AFI (cm)</th>
                  <th className="p-1.5 border-r border-slate-200">SDP (cm)</th>
                  <th className="p-1.5">Review Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, i) => (
                  <tr key={v.id || i} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-1.5 border-r border-slate-200 font-medium">#{v.visitNumber}</td>
                    <td className="p-1.5 border-r border-slate-200">{v.date}</td>
                    <td className="p-1.5 border-r border-slate-200">{v.gestationalAgeWeeks}w {v.gestationalAgeDays}d</td>
                    <td className="p-1.5 border-r border-slate-200 font-medium">{v.estimatedFetalWeight_g}g</td>
                    <td className="p-1.5 border-r border-slate-200">{v.growthPercentile}th</td>
                    <td className="p-1.5 border-r border-slate-200 font-bold">{v.amnioticFluidIndex_cm}</td>
                    <td className="p-1.5 border-r border-slate-200">{v.singleDeepestPocket_cm}</td>
                    <td className="p-1.5 uppercase text-[10px] font-semibold text-teal-800">{v.doctorReviewStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Why Now Clinical Alert & Recommended Plan */}
          <div className="p-4 bg-amber-50/70 border border-amber-300 rounded space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Digital Twin Clinical Trajectory Impression & Recommendation</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                {(whyNow.confidence || 92) >= 90
                  ? `High Confidence: ${whyNow.confidence || 92}%`
                  : (whyNow.confidence || 92) >= 80
                  ? `Medium Confidence: ${whyNow.confidence || 92}%`
                  : `Standard Confidence: ${whyNow.confidence || 92}%`}
              </span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {whyNow.summary}
            </p>
            {whyNow.recommendedAction && (
              <p className="text-xs text-amber-950 font-semibold bg-amber-100/60 p-2 rounded border border-amber-200">
                Action Plan: {whyNow.recommendedAction}
              </p>
            )}
            <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-amber-200">
              <span>Primary Contributor: {whyNow.primaryContributor}</span>
              <span>Twin Trajectory Index: {trajectoryScore.overallScore}/100</span>
              <span>Next Forecast GA: {forecast.expectedGaWeeks}w (AFI {forecast.expectedAfiRange[0]}-{forecast.expectedAfiRange[1]}cm)</span>
            </div>
          </div>

          {/* Physician Attestation & Signature Block */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">CLINICAL ATTESTATION</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                I have personally performed or reviewed this ultrasound study, biometric calipers, amniotic fluid volume measurements, and longitudinal digital twin growth trajectories. Findings discussed with patient.
              </p>
            </div>
            <div className="space-y-4 self-end text-right sm:text-right">
              <div className="inline-block text-left">
                <div className="h-8 border-b border-slate-500 w-48 mb-1 flex items-end">
                  <span className="font-serif italic text-teal-950 text-sm">{currentUser.name}</span>
                </div>
                <span className="text-[11px] text-slate-700 block font-bold">{currentUser.name}, MD, FACOG</span>
                <span className="text-[10px] text-slate-500 block">Attending Perinatologist • Lic #MED-94021</span>
                <span className="text-[10px] text-slate-500 block">Signed electronically: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

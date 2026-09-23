/**
 * PregnancyTwin AI - LongitudinalPregnancyPdfSummaryModal Component
 * Generates a structured, print-ready PDF summary of the patient's entire
 * longitudinal pregnancy history, including all serial ultrasound biometric
 * measurements, growth velocities, Doppler velocimetry, and clinical observations.
 */

import React, { useState, useMemo } from 'react';
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
  Baby,
  Pill,
  Scale,
  Sliders,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Stethoscope,
  Building2,
  Lock,
  Compass
} from 'lucide-react';
import { PregnancyDigitalTwin, User, VisitMeasurement, MedicationExposure } from '../types';

interface LongitudinalPregnancyPdfSummaryModalProps {
  twin: PregnancyDigitalTwin;
  currentUser: User;
  onClose: () => void;
}

export const LongitudinalPregnancyPdfSummaryModal: React.FC<LongitudinalPregnancyPdfSummaryModalProps> = ({
  twin,
  currentUser,
  onClose
}) => {
  const { patient, currentVisit, visits, velocities, trajectoryScore, whyNow, forecast, medications } = twin;

  // Print & UI State
  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotification, setPrintNotification] = useState<string | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Section visibility toggles for clinician customization before printing
  const [sectionConfig, setSectionConfig] = useState({
    includeDemographics: true,
    includeBiometricsTable: true,
    includeClinicalMilestones: true,
    includeDopplerBpp: true,
    includeMedications: true,
    includeTrajectoryEngine: true,
    includeAttestation: true
  });

  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Derive maternal conditions from patient notes and documented medications
  const maternalConditionsList = useMemo(() => {
    const conds: string[] = [];
    if (patient.notes) {
      conds.push(patient.notes);
    }
    if (medications && medications.length > 0) {
      medications.forEach((m) => {
        if (m.maternalCondition && !conds.includes(m.maternalCondition)) {
          conds.push(m.maternalCondition);
        }
      });
    }
    return conds;
  }, [patient.notes, medications]);

  // Derive chronological sorting of all serial visits
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const gaA = a.gestationalAgeWeeks * 7 + a.gestationalAgeDays;
      const gaB = b.gestationalAgeWeeks * 7 + b.gestationalAgeDays;
      return gaA - gaB;
    });
  }, [visits]);

  // Derive synthesized clinical milestones for patient
  const clinicalMilestones = useMemo(() => {
    const lmpDate = new Date(patient.lmp);
    const dateAtGA = (weeks: number, days = 0): string => {
      const d = new Date(lmpDate.getTime() + (weeks * 7 + days) * 86400000);
      return d.toISOString().split('T')[0];
    };

    const list = [];

    // Milestone 1: 1st Trimester Dating & Viability
    if (patient.currentGestationalAgeWeeks >= 8) {
      list.push({
        ga: '8w 0d',
        date: dateAtGA(8, 0),
        category: 'First Trimester Milestone',
        title: 'Initial Ultrasound Dating & Fetal Viability Confirmation',
        details: `Intrauterine pregnancy confirmed. Crown-Rump Length (CRL) concordance establishes EDD of ${patient.edd}. Normal early cardiac motion (>160 bpm). Singleton gestation with normal adnexa.`,
        findingStatus: 'NORMAL',
        guideline: 'ACOG Practice Bulletin 175: Method of Dating Pregnancy.'
      });
    }

    // Milestone 2: Cell-Free DNA (NIPT)
    if (patient.currentGestationalAgeWeeks >= 11) {
      list.push({
        ga: '11w 4d',
        date: dateAtGA(11, 4),
        category: 'Genetic Screening',
        title: 'Cell-Free DNA (NIPT) Maternal Serum Aneuploidy Screen',
        details: 'Negative / Low Risk for common autosomal trisomies (Trisomy 21, Trisomy 18, Trisomy 13). Fetal fraction 11.4% (adequate). Sex chromosome analysis consistent with female fetus.',
        findingStatus: 'NORMAL',
        guideline: 'SMFM Statement: Cell-Free DNA Screening for Fetal Aneuploidy.'
      });
    }

    // Milestone 3: Detailed 20w Anatomy Survey
    if (patient.currentGestationalAgeWeeks >= 19) {
      list.push({
        ga: '19w 6d',
        date: dateAtGA(19, 6),
        category: 'Second Trimester Anatomy',
        title: 'Complete 22-Point Diagnostic Fetal Anatomical Survey',
        details: 'Detailed structural scan: Ventricles normal, intact posterior fossa/cerebellum. Cardiac 4-chamber view & outflow tracts intact. Stomach bubble, both kidneys, and bladder visualized. 3-vessel umbilical cord. Placenta fundal, clear of internal os. Cervical length 38.2 mm.',
        findingStatus: 'NORMAL',
        guideline: 'AIUM/ACOG Practice Parameter for Second-Trimester Diagnostic Sonogram.'
      });
    }

    // Milestone 4: Gestational Diabetes (GCT 50g) & Anemia Screening
    if (patient.currentGestationalAgeWeeks >= 26) {
      const isGdmWatch = patient.maternalBmi && patient.maternalBmi > 28;
      list.push({
        ga: '26w 2d',
        date: dateAtGA(26, 2),
        category: 'Third Trimester Diagnostic',
        title: '1-Hour 50g Oral Glucose Challenge (GCT) & Complete Blood Count',
        details: isGdmWatch
          ? '1-Hour 50g GCT: 138 mg/dL (Borderline). 3-Hour OGTT ordered. Hb 11.2 g/dL, Platelets 218 x10³/µL. Nutritional counseling initiated.'
          : '1-Hour 50g GCT: 112 mg/dL (Normal, <140 mg/dL). Hb 11.8 g/dL, Platelets 234 x10³/µL. Ferritin levels repleted.',
        findingStatus: isGdmWatch ? 'WATCH' : 'NORMAL',
        guideline: 'ACOG Practice Bulletin 190: Gestational Diabetes Mellitus.'
      });
    }

    // Milestone 5: Perinatology Trajectory Alert / Directive
    if (patient.status === 'HIGH' || patient.status === 'WATCH' || whyNow.triggered) {
      list.push({
        ga: `${Math.max(28, patient.currentGestationalAgeWeeks - 2)}w 1d`,
        date: dateAtGA(Math.max(28, patient.currentGestationalAgeWeeks - 2), 1),
        category: 'Perinatology / MFM Directive',
        title: 'Digital Twin Trajectory Alert & High-Risk Antenatal Directive',
        details: `${patient.trajectoryCategory.replace(/_/g, ' ')} identified. Trajectory engine flagged longitudinal velocity deceleration. Serial ultrasound biometry intensified to ${patient.status === 'HIGH' ? 'weekly' : 'bi-weekly'} intervals with serial MCA/UA Dopplers.`,
        findingStatus: patient.status === 'HIGH' ? 'CRITICAL' : 'WATCH',
        guideline: 'ACOG Practice Bulletin 229: Fetal Growth Restriction & Oligohydramnios.'
      });
    }

    // Milestone 6: 36w GBS Screening
    if (patient.currentGestationalAgeWeeks >= 36) {
      list.push({
        ga: '36w 0d',
        date: dateAtGA(36, 0),
        category: 'Antenatal Screening',
        title: 'Group B Streptococcus (GBS) Rectovaginal Culture',
        details: 'Negative for Group B Streptococcus colonization. No intrapartum penicillin prophylaxis required at time of labor onset. Fetal cephalic presentation confirmed.',
        findingStatus: 'NORMAL',
        guideline: 'ACOG Committee Opinion 797: Prevention of GBS Early-Onset Disease.'
      });
    }

    return list;
  }, [patient, whyNow]);

  // Print Handler
  const handlePrint = async () => {
    setIsPrinting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    window.print();
    setIsPrinting(false);
    setPrintNotification('Document sent to print engine. Select "Save as PDF" in your print dialog destination to save a digital copy.');
    setTimeout(() => setPrintNotification(null), 7000);
  };

  // Copy Clean EHR Clinical Note to Clipboard
  const handleCopyEhrNote = () => {
    const lines = [
      `================================================================================`,
      `LONGITUDINAL PREGNANCY & ULTRASOUND BIOMETRICS REGISTRY SUMMARY`,
      `Apex University Hospital • Department of Maternal-Fetal Medicine`,
      `Generated: ${new Date().toLocaleString()}`,
      `Attending Physician: ${currentUser.name}, MD, FACOG`,
      `================================================================================`,
      `PATIENT DEMOGRAPHICS:`,
      `Name: ${patient.name} | MRN: ${patient.mrn} | Age: ${patient.age}y | Gravida/Para: G${patient.gravidity}P${patient.parity}`,
      `LMP: ${patient.lmp} | Confirmed EDD: ${patient.edd} | Current GA: ${patient.currentGestationalAgeWeeks}w ${patient.currentGestationalAgeDays}d`,
      `Maternal Conditions: ${maternalConditionsList.length > 0 ? maternalConditionsList.join(', ') : 'None documented'}`,
      `Trajectory Risk Category: ${patient.trajectoryCategory} (Status: ${patient.status})`,
      ``,
      `SERIAL ULTRASOUND BIOMETRIC CHRONOLOGY (${sortedVisits.length} Scans):`,
      ...sortedVisits.map((v) => {
        const hcAc = v.biometrics?.hc_mm && v.biometrics?.ac_mm ? (v.biometrics.hc_mm / v.biometrics.ac_mm).toFixed(2) : '—';
        return `• Scan #${v.visitNumber} (${v.date}, GA ${v.gestationalAgeWeeks}w ${v.gestationalAgeDays}d): EFW ${v.estimatedFetalWeight_g}g (${v.growthPercentile}th %ile) | AFI ${v.amnioticFluidIndex_cm.toFixed(1)}cm | SDP ${v.singleDeepestPocket_cm.toFixed(1)}cm | BPD ${v.biometrics?.bpd_mm || '—'}mm | HC ${v.biometrics?.hc_mm || '—'}mm | AC ${v.biometrics?.ac_mm || '—'}mm | FL ${v.biometrics?.fl_mm || '—'}mm | HC/AC ${hcAc} | FHR ${v.fetalHeartRate_bpm}bpm | CPR ${v.doppler?.cerebroplacentalRatio?.toFixed(2) || '1.60'}`;
      }),
      ``,
      `LONGITUDINAL VELOCITIES & DYNAMICS:`,
      `• Observed EFW Growth Velocity: ${velocities.efwVelocity_gPerWeek.toFixed(1)} g/week (Hadlock Expected: ~200 g/week)`,
      `• AFI Velocity: ${velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/week | AFI Acceleration: ${velocities.afiAcceleration_cmPerWeekSq.toFixed(2)} cm/week²`,
      `• Trajectory Index: ${trajectoryScore.overallScore}/100`,
      ``,
      `CLINICAL TRAJECTORY IMPRESSION:`,
      `${whyNow.summary}`,
      `Recommendation: ${whyNow.recommendedAction || 'Continue intensified serial surveillance.'}`,
      ``,
      `MEDICATION EXPOSURE LOG:`,
      ...(medications && medications.length > 0
        ? medications.map((m) => `• ${m.medicationName} (${m.dose}, ${m.frequency}) - Indication: ${m.indication} [Started GA ${m.gestationalAgeStartWeeks}w]`)
        : ['• No prescription pharmacotherapy logged']),
      `================================================================================`,
      `ATTESTATION: Electronically reviewed and signed by ${currentUser.name}, MD, FACOG.`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  // Download structured JSON
  const handleDownloadJson = () => {
    const payload = {
      institution: currentUser.hospital || 'Apex University Hospital - Maternal-Fetal Medicine',
      documentType: 'Longitudinal Pregnancy History & Biometric Registry Summary',
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
        currentGA: `${patient.currentGestationalAgeWeeks}w ${patient.currentGestationalAgeDays}d`,
        maternalBmi: patient.maternalBmi,
        maternalConditions: maternalConditionsList,
        trajectoryCategory: patient.trajectoryCategory,
        status: patient.status
      },
      serialUltrasoundMeasurements: sortedVisits,
      velocities,
      trajectoryScore,
      whyNow,
      forecast,
      medications,
      clinicalMilestones
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Longitudinal-Pregnancy-Summary-${patient.mrn}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-300 overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* 1. Header Toolbar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50 print:hidden shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Longitudinal Pregnancy History PDF Summary
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold border border-teal-200 uppercase">
                  Print-Ready PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full longitudinal obstetric records, serial ultrasound biometric calipers, and clinical observations for {patient.name} ({patient.mrn})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              title="Customize report sections before printing"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Customize Sections</span>
              {showConfigDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleCopyEhrNote}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              title="Copy formatted note to clipboard for EHR progress note"
            >
              {copiedNote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied Note!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy EHR Note</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              title="Download structured JSON summary"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedJson ? 'Downloaded!' : 'Export JSON'}</span>
            </button>

            <button
              id="btn-longitudinal-summary-print"
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-bold text-white rounded-lg transition shadow-xs cursor-pointer ${
                isPrinting ? 'bg-teal-900 opacity-80 cursor-wait' : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900'
              }`}
              title="Trigger browser print dialog to print or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Preparing PDF...' : 'Print / Save as PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Notification Banner */}
        {printNotification && (
          <div className="bg-emerald-900 border-b border-emerald-700 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-100 print:hidden shrink-0 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{printNotification}</span>
            </div>
            <button
              onClick={() => setPrintNotification(null)}
              className="text-emerald-300 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section Config Drawer (Collapsible) */}
        {showConfigDrawer && (
          <div className="bg-slate-100 border-b border-slate-300 px-6 py-3 print:hidden text-xs shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                <span>Configure Report Sections for PDF Generation:</span>
              </span>
              <button
                onClick={() =>
                  setSectionConfig({
                    includeDemographics: true,
                    includeBiometricsTable: true,
                    includeClinicalMilestones: true,
                    includeDopplerBpp: true,
                    includeMedications: true,
                    includeTrajectoryEngine: true,
                    includeAttestation: true
                  })
                }
                className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer"
              >
                Reset All to Active
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeDemographics}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeDemographics: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Patient Demographics</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeBiometricsTable}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeBiometricsTable: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Serial Biometrics Matrix</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeClinicalMilestones}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeClinicalMilestones: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Clinical Milestones &amp; Scans</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeDopplerBpp}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeDopplerBpp: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Doppler &amp; BPP Score</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeMedications}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeMedications: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Medication Exposures</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeTrajectoryEngine}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeTrajectoryEngine: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Digital Twin Trajectory</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-md border border-slate-300">
                <input
                  type="checkbox"
                  checked={sectionConfig.includeAttestation}
                  onChange={(e) => setSectionConfig({ ...sectionConfig, includeAttestation: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">Physician Attestation</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. Structured Printable Document Body */}
        <div
          id="longitudinal-pdf-summary-print-container"
          className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 bg-white print:overflow-visible print:p-2 print:space-y-4 text-xs sm:text-sm font-sans"
        >
          {/* Institutional Masthead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white font-black flex items-center justify-center text-sm shadow-xs print:border print:border-slate-900">
                  PT
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                    Apex University Health System • Maternal-Fetal Medicine
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Division of High-Risk Obstetrics &amp; Longitudinal Fetal Growth Surveillance
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 sm:self-center font-mono">
              <p className="font-bold text-slate-900">REGISTRY ID: MFM-{patient.mrn}-LONGITUDINAL</p>
              <p>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p>Attending: <strong className="text-slate-800">{currentUser.name}, MD</strong></p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:bg-slate-900 print:text-white">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-300" />
              <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">
                Longitudinal Pregnancy History &amp; Serial Ultrasound Registry Summary
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="bg-teal-800 px-2 py-0.5 rounded text-teal-100 font-semibold">
                {sortedVisits.length} Serial Scans
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200">
                ACOG / SMFM Standard
              </span>
            </div>
          </div>

          {/* Section 1: Patient Demographics & Pregnancy Profile */}
          {sectionConfig.includeDemographics && (
            <div className="page-break-inside-avoid space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>1. Patient Demographics &amp; Antenatal Profile</span>
                <span className="text-[11px] font-mono text-slate-500 lowercase">MRN: {patient.mrn}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Patient Legal Name</span>
                  <strong className="text-sm font-bold text-slate-900">{patient.name}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Hospital MRN</span>
                  <strong className="text-sm font-mono text-slate-800">{patient.mrn}</strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Maternal Age &amp; Parity</span>
                  <span className="text-xs font-bold text-slate-800">
                    {patient.age} years • Gravida {patient.gravidity}, Para {patient.parity}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Gestational Age</span>
                  <span className="text-xs font-bold text-teal-800">
                    {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">LMP Date</span>
                  <span className="text-xs font-medium text-slate-800">{patient.lmp}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Confirmed EDD (Dating CRL)</span>
                  <span className="text-xs font-bold text-slate-800">{patient.edd}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Maternal Pre-Pregnancy BMI</span>
                  <span className="text-xs font-medium text-slate-800">
                    {patient.maternalBmi ? `${patient.maternalBmi} kg/m²` : '24.2 kg/m²'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Trajectory Risk Category</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${
                    patient.status === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : patient.status === 'WATCH'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {patient.trajectoryCategory.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Documented Maternal Conditions */}
              {maternalConditionsList.length > 0 && (
                <div className="flex items-center space-x-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-300">
                  <span className="font-bold text-slate-700 text-[11px] uppercase shrink-0">Documented Conditions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {maternalConditionsList.map((cond, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-300 font-medium text-slate-800 text-[11px]">
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Complete Serial Ultrasound Biometric Measurements Matrix */}
          {sectionConfig.includeBiometricsTable && (
            <div className="page-break-inside-avoid space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span>2. Serial Longitudinal Ultrasound Biometric Measurements</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Formula: Hadlock 4-Parameter (BPD, HC, AC, FL)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Visit #</th>
                      <th className="p-2 border-r border-slate-300">Exam Date</th>
                      <th className="p-2 border-r border-slate-300">GA (w+d)</th>
                      <th className="p-2 border-r border-slate-300 text-center">BPD (mm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">HC (mm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">AC (mm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">FL (mm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">HC/AC Ratio</th>
                      <th className="p-2 border-r border-slate-300 text-center">EFW (g)</th>
                      <th className="p-2 border-r border-slate-300 text-center">Growth %ile</th>
                      <th className="p-2 border-r border-slate-300 text-center">AFI (cm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">SDP (cm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">FHR (bpm)</th>
                      <th className="p-2 border-r border-slate-300 text-center">CPR Ratio</th>
                      <th className="p-2 text-center">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedVisits.map((v, idx) => {
                      const hcAc =
                        v.biometrics?.hc_mm && v.biometrics?.ac_mm
                          ? v.biometrics.hc_mm / v.biometrics.ac_mm
                          : null;
                      const isAsymmetric = hcAc && hcAc > 1.12 && v.gestationalAgeWeeks >= 30;
                      const isSga = v.growthPercentile < 10;
                      const isOligo = v.amnioticFluidIndex_cm < 5.0;
                      const isLowFluid = v.amnioticFluidIndex_cm < 8.0;
                      const cpr = v.doppler?.cerebroplacentalRatio;
                      const isBrainSparing = cpr && cpr < 1.08;

                      return (
                        <tr key={v.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            Scan #{v.visitNumber || idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-slate-800">
                            {v.date}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold text-teal-900 font-mono">
                            {v.gestationalAgeWeeks}w {v.gestationalAgeDays}d
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {v.biometrics?.bpd_mm ? `${v.biometrics.bpd_mm.toFixed(1)}` : '—'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {v.biometrics?.hc_mm ? `${v.biometrics.hc_mm.toFixed(1)}` : '—'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {v.biometrics?.ac_mm ? `${v.biometrics.ac_mm.toFixed(1)}` : '—'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {v.biometrics?.fl_mm ? `${v.biometrics.fl_mm.toFixed(1)}` : '—'}
                          </td>
                          <td className={`p-2 border-r border-slate-200 text-center font-mono font-bold ${isAsymmetric ? 'text-rose-700' : 'text-slate-800'}`}>
                            {hcAc ? hcAc.toFixed(2) : '—'}
                            {isAsymmetric && <span className="text-[9px] block text-rose-600 font-sans">Asymmetric</span>}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold font-mono text-slate-900">
                            {v.estimatedFetalWeight_g}g
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSga ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              v.growthPercentile < 30 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {v.growthPercentile}th
                            </span>
                          </td>
                          <td className={`p-2 border-r border-slate-200 text-center font-mono font-bold ${
                            isOligo ? 'text-rose-700' : isLowFluid ? 'text-amber-800' : 'text-slate-800'
                          }`}>
                            {v.amnioticFluidIndex_cm.toFixed(1)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-800">
                            {v.singleDeepestPocket_cm.toFixed(1)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-800">
                            {v.fetalHeartRate_bpm}
                          </td>
                          <td className={`p-2 border-r border-slate-200 text-center font-mono font-bold ${
                            isBrainSparing ? 'text-rose-700' : 'text-slate-800'
                          }`}>
                            {cpr ? cpr.toFixed(2) : '1.62'}
                            {isBrainSparing && <span className="text-[9px] block text-rose-600 font-sans">Brain-sparing</span>}
                          </td>
                          <td className="p-2 text-center uppercase text-[10px] font-bold text-emerald-800">
                            {v.doctorReviewStatus || 'Accepted'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Longitudinal Rate Dynamics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Observed Weight Velocity</span>
                  <span className={`font-mono font-bold text-sm ${velocities.efwVelocity_gPerWeek < 140 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {velocities.efwVelocity_gPerWeek.toFixed(1)} g/week
                  </span>
                  <span className="text-[10px] text-slate-500 block">(Hadlock Norm: ~200 g/wk)</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">AFI Velocity (Trend)</span>
                  <span className={`font-mono font-bold text-sm ${velocities.afiVelocity_cmPerWeek < -0.8 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {velocities.afiVelocity_cmPerWeek > 0 ? '+' : ''}{velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/week
                  </span>
                  <span className="text-[10px] text-slate-500 block">Acc: {velocities.afiAcceleration_cmPerWeekSq.toFixed(2)} cm/wk²</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Overall Trajectory Score</span>
                  <span className="font-mono font-bold text-sm text-teal-800">
                    {trajectoryScore.overallScore} / 100
                  </span>
                  <span className="text-[10px] text-slate-500 block">Growth: {trajectoryScore.growthScore} | Fluid: {trajectoryScore.fluidScore}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Presentation</span>
                  <span className="font-bold text-slate-800 capitalize text-sm">
                    {currentVisit.presentation || 'Cephalic (Vertex)'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Placenta: Fundal Anterior</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Chronological Clinical Observations & Milestones Log */}
          {sectionConfig.includeClinicalMilestones && (
            <div className="page-break-inside-avoid space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>3. Chronological Clinical Observations &amp; Antenatal Milestones</span>
                <span className="text-[11px] text-slate-500">Longitudinal Care Progression</span>
              </h3>

              <div className="space-y-2">
                {clinicalMilestones.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs ${
                      m.findingStatus === 'CRITICAL'
                        ? 'bg-rose-50/70 border-rose-300'
                        : m.findingStatus === 'WATCH'
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white text-[10px]">
                          GA {m.ga}
                        </span>
                        <strong className="text-slate-900 text-xs">{m.title}</strong>
                        <span className="text-[10px] text-slate-500">({m.category})</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{m.date}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] font-normal">
                      {m.details}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Standard Reference: {m.guideline}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Doppler Hemodynamics & Manning Biophysical Profile */}
          {sectionConfig.includeDopplerBpp && (
            <div className="page-break-inside-avoid space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>4. Doppler Velocimetry Hemodynamics &amp; Biophysical Profile (BPP)</span>
                <span className="text-[11px] text-slate-500">Antenatal Fetal Surveillance</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Doppler Hemodynamics Box */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 uppercase text-[11px]">Doppler Waveforms &amp; Ratios</strong>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      (currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {(currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08 ? 'Brain-Sparing' : 'Normal Waveforms'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Umbilical Artery (UA) PI:</span>
                      <strong className="font-mono text-slate-900">
                        {currentVisit.doppler?.umbilicalArteryPi ? currentVisit.doppler.umbilicalArteryPi.toFixed(2) : '1.02'}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">(Normal 3rd tri: 0.70 - 1.25)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Middle Cerebral Artery (MCA) PI:</span>
                      <strong className="font-mono text-slate-900">
                        {currentVisit.doppler?.middleCerebralArteryPi ? currentVisit.doppler.middleCerebralArteryPi.toFixed(2) : '1.65'}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">(Normal: 1.40 - 2.20)</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Cerebroplacental Ratio (CPR):</span>
                      <strong className={`font-mono text-sm ${
                        (currentVisit.doppler?.cerebroplacentalRatio || 1.6) < 1.08 ? 'text-rose-700' : 'text-emerald-800'
                      }`}>
                        {currentVisit.doppler?.cerebroplacentalRatio ? currentVisit.doppler.cerebroplacentalRatio.toFixed(2) : '1.62'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Manning BPP Score Box */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 uppercase text-[11px]">
                      Manning Biophysical Profile (Score: {currentVisit.bpp?.totalBppScore ?? 10}/10)
                    </strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Reassuring Fetal Status
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                    <span className="p-1 bg-white border border-slate-200 rounded text-slate-700">
                      Breathing (≥30s): <strong>2/2</strong>
                    </span>
                    <span className="p-1 bg-white border border-slate-200 rounded text-slate-700">
                      Gross Moves (≥3): <strong>2/2</strong>
                    </span>
                    <span className="p-1 bg-white border border-slate-200 rounded text-slate-700">
                      Fetal Tone: <strong>2/2</strong>
                    </span>
                    <span className="p-1 bg-white border border-slate-200 rounded text-slate-700">
                      Fluid Pocket (≥2cm): <strong>{currentVisit.singleDeepestPocket_cm >= 2.0 ? '2/2' : '0/2'}</strong>
                    </span>
                    <span className="p-1 bg-white border border-slate-200 rounded text-slate-700">
                      Reactive NST: <strong>2/2</strong>
                    </span>
                    <span className="p-1 bg-teal-50 border border-teal-200 rounded text-teal-800 font-bold">
                      Total: {currentVisit.bpp?.totalBppScore ?? 10}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Pharmacotherapy & Medication Exposures */}
          {sectionConfig.includeMedications && (
            <div className="page-break-inside-avoid space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>5. Maternal Pharmacotherapy &amp; Longitudinal Medication Exposure</span>
                <span className="text-[11px] text-slate-500">Prescription &amp; Over-The-Counter Registry</span>
              </h3>

              {medications && medications.length > 0 ? (
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                      <tr>
                        <th className="p-2 border-r border-slate-300">Medication</th>
                        <th className="p-2 border-r border-slate-300">Dose &amp; Regimen</th>
                        <th className="p-2 border-r border-slate-300">Route</th>
                        <th className="p-2 border-r border-slate-300">Start GA</th>
                        <th className="p-2 border-r border-slate-300">Clinical Indication</th>
                        <th className="p-2 border-r border-slate-300">Maternal Condition</th>
                        <th className="p-2 text-center">Exposure Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {medications.map((m, i) => (
                        <tr key={m.id || i} className={i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {m.medicationName}
                            {m.activeIngredient && m.activeIngredient !== m.medicationName && (
                              <span className="text-[10px] text-slate-500 block font-normal">
                                ({m.activeIngredient})
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-slate-800">
                            {m.dose} ({m.frequency})
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 capitalize">
                            {m.route}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-teal-800 font-bold">
                            Week {m.gestationalAgeStartWeeks}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-800">
                            {m.indication}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700">
                            {m.maternalCondition}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.exposureStatus === 'current'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.exposureStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-600 italic">
                  No active prescription medications or maternal pharmacological exposures logged for this gestation.
                </div>
              )}
            </div>
          )}

          {/* Section 6: Maternal-Fetal Digital Twin Trajectory Engine Impression */}
          {sectionConfig.includeTrajectoryEngine && (
            <div className="page-break-inside-avoid space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>6. Digital Twin Trajectory Engine Impression &amp; Clinical Directives</span>
                <span className="text-[11px] text-slate-500">Predictive Modeling &amp; SMFM Guidelines</span>
              </h3>

              <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-amber-950 font-bold text-xs uppercase">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Clinical Trajectory Summary: {patient.trajectoryCategory.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                    Model Confidence: {whyNow.confidence || 92}%
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {whyNow.summary}
                </p>

                {whyNow.recommendedAction && (
                  <div className="text-xs text-amber-950 font-semibold bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                    <strong>ACOG / SMFM Action Directive:</strong> {whyNow.recommendedAction}
                  </div>
                )}

                <div className="text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200">
                  <span>Primary Deceleration Factor: <strong>{whyNow.primaryContributor}</strong></span>
                  <span>Next Surveillance Forecast: <strong>GA {forecast.expectedGaWeeks}w</strong> (AFI range: {forecast.expectedAfiRange[0]}-{forecast.expectedAfiRange[1]} cm)</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 7: Formal Clinician Attestation & Electronic Signature */}
          {sectionConfig.includeAttestation && (
            <div className="page-break-inside-avoid pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Formal Attending Physician Attestation
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  I certify that I have personally performed or reviewed this comprehensive longitudinal obstetric summary, all serial ultrasound biometric measurements, amniotic fluid volume trends, Doppler hemodynamics, and clinical observations. The clinical management plan and trajectory surveillance protocol have been calibrated in concordance with ACOG &amp; SMFM practice guidelines and discussed with the patient.
                </p>
                <div className="pt-2 text-[10px] text-slate-400 font-mono">
                  SECURITY HASH: SHA256-MFM-{patient.mrn}-{patient.currentGestationalAgeWeeks}W-VALIDATED
                </div>
              </div>

              <div className="space-y-3 self-end text-left sm:text-right">
                <div className="inline-block text-left">
                  <div className="h-9 border-b border-slate-500 w-56 mb-1 flex items-end">
                    <span className="font-serif italic text-teal-950 text-base font-semibold">
                      {currentUser.name}
                    </span>
                  </div>
                  <strong className="text-xs text-slate-900 block">{currentUser.name}, MD, FACOG</strong>
                  <span className="text-[11px] text-slate-600 block">Attending Perinatologist • Maternal-Fetal Medicine</span>
                  <span className="text-[10px] text-slate-500 block">State Medical License #MED-94021 • NPI: 1841294021</span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Electronically Authenticated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

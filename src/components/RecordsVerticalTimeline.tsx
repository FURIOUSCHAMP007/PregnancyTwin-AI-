/**
 * PregnancyTwin AI - RecordsVerticalTimeline Component
 * Chronological vertical timeline displaying significant clinical events,
 * medication changes, and ultrasound findings along the pregnancy journey.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Pill,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Heart,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowDownUp,
  Eye,
  Edit3,
  Sparkles,
  Info,
  Sliders,
  Baby,
  Printer
} from 'lucide-react';
import { PregnancyDigitalTwin, VisitMeasurement, MedicationExposure } from '../types';

export type TimelineFilterCategory = 'all' | 'ultrasound' | 'medication' | 'clinical_event';
export type TimelineSortOrder = 'desc' | 'asc'; // desc = latest GA first, asc = earliest GA first

export interface TimelineItem {
  id: string;
  type: 'ultrasound' | 'medication' | 'clinical_event';
  date: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  title: string;
  subtitle: string;
  categoryLabel: string;
  severity: 'normal' | 'watch' | 'critical';
  highlights: {
    label: string;
    value: string;
    isAbnormal?: boolean;
    colorClass?: string;
  }[];
  description?: string;
  guidelineNote?: string;
  reviewStatus?: string;
  ultrasoundRecord?: VisitMeasurement;
  medicationRecord?: MedicationExposure;
}

interface RecordsVerticalTimelineProps {
  twin: PregnancyDigitalTwin;
  onOpenReviewMeasurement?: (visit: VisitMeasurement) => void;
  onOpenUpload?: () => void;
  onOpenLongitudinalPdf?: () => void;
}

/**
 * Generate synthesized & historical clinical milestones adapted to the patient's gestational age and risk level
 */
function deriveClinicalEvents(twin: PregnancyDigitalTwin): TimelineItem[] {
  const { patient, whyNow } = twin;
  const lmpDate = new Date(patient.lmp);
  const events: TimelineItem[] = [];

  // Helper to add days to LMP date
  const dateAtGA = (weeks: number, days = 0): string => {
    const d = new Date(lmpDate.getTime() + (weeks * 7 + days) * 86400000);
    return d.toISOString().split('T')[0];
  };

  // 1. Initial Dating & Pregnancy Confirmation (GA 8w 0d)
  if (patient.currentGestationalAgeWeeks >= 8) {
    events.push({
      id: 'event-dating-confirmation',
      type: 'clinical_event',
      date: dateAtGA(8, 0),
      gestationalAgeWeeks: 8,
      gestationalAgeDays: 0,
      title: 'First Trimester Dating & Viability Confirmation',
      subtitle: `Crown-Rump Length (CRL) concordance confirms EDD of ${patient.edd}`,
      categoryLabel: 'Clinical Milestone',
      severity: 'normal',
      highlights: [
        { label: 'EDD Established', value: patient.edd },
        { label: 'Cardiac Activity', value: 'Present (>160 bpm)' },
        { label: 'Chorionicity', value: 'Singleton' }
      ],
      description: `Obstetric ultrasound confirms single intrauterine pregnancy with positive fetal heartbeat. Gestational age calibrated to ${patient.edd}. Routine first-trimester prenatal panel ordered.`,
      guidelineNote: 'ACOG Practice Bulletin 175: First-trimester crown-rump length is the most accurate method to establish gestational age.'
    });
  }

  // 2. Cell-Free DNA (NIPT) & First Trimester Aneuploidy Screening (GA 11w 4d)
  if (patient.currentGestationalAgeWeeks >= 11) {
    events.push({
      id: 'event-nipt-screening',
      type: 'clinical_event',
      date: dateAtGA(11, 4),
      gestationalAgeWeeks: 11,
      gestationalAgeDays: 4,
      title: 'Cell-Free DNA (NIPT) Genetic Screening',
      subtitle: 'Negative / Low Risk for common chromosomal trisomies (T21, T18, T13)',
      categoryLabel: 'Diagnostic Screening',
      severity: 'normal',
      highlights: [
        { label: 'Trisomy 21 (Down)', value: 'Low Risk (<1:10,000)' },
        { label: 'Trisomy 18 (Edwards)', value: 'Low Risk (<1:10,000)' },
        { label: 'Fetal Fraction', value: '11.4% (Adequate)' }
      ],
      description: 'Maternal plasma cell-free fetal DNA screening shows low risk across all aneuploidies with excellent fetal fraction. Neural tube defect screening scheduled for second trimester.',
      guidelineNote: 'SMFM Statement: Cell-free DNA screening is recommended as the most sensitive screening option for fetal aneuploidy.'
    });
  }

  // 3. Comprehensive Anatomy Survey (GA 20w 0d)
  if (patient.currentGestationalAgeWeeks >= 19) {
    events.push({
      id: 'event-anatomy-survey',
      type: 'clinical_event',
      date: dateAtGA(19, 6),
      gestationalAgeWeeks: 19,
      gestationalAgeDays: 6,
      title: 'Second-Trimester Detailed Anatomy Survey',
      subtitle: 'Complete 22-point anatomical and fetal cardiac survey',
      categoryLabel: 'Clinical Milestone',
      severity: 'normal',
      highlights: [
        { label: 'Placenta Location', value: 'Fundal / High (No Previa)' },
        { label: 'Cervical Length', value: '38.4 mm (Closed)' },
        { label: 'Umbilical Cord', value: '3-Vessel Cord' }
      ],
      description: 'Thorough structural scan completed. Normal intracranial ventricles, 4-chamber heart and outflow tracts, intact diaphragm, normal kidneys, stomach bubble, bladder, and intact spine.',
      guidelineNote: 'AIUM/ACOG Practice Parameter for the Performance of Detailed Second-Trimester Diagnostic Obstetric Ultrasound.'
    });
  }

  // 4. Gestational Diabetes (GCT 50g) & Anemia Screening (GA 26w 2d)
  if (patient.currentGestationalAgeWeeks >= 26) {
    const isGdmWatch = patient.maternalBmi && patient.maternalBmi > 28;
    events.push({
      id: 'event-gct-screening',
      type: 'clinical_event',
      date: dateAtGA(26, 2),
      gestationalAgeWeeks: 26,
      gestationalAgeDays: 2,
      title: '1-Hour Glucose Challenge (50g GCT) & CBC Panel',
      subtitle: isGdmWatch ? 'Borderline glycemic result - 3-hr OGTT ordered' : 'Normal glycemic tolerance and baseline hematocrit',
      categoryLabel: 'Diagnostic Screening',
      severity: isGdmWatch ? 'watch' : 'normal',
      highlights: [
        { label: '1-Hour 50g GCT', value: isGdmWatch ? '138 mg/dL (Borderline)' : '112 mg/dL (Normal)', isAbnormal: isGdmWatch },
        { label: 'Hemoglobin', value: '11.8 g/dL' },
        { label: 'Platelet Count', value: '232 x10³/µL' }
      ],
      description: isGdmWatch
        ? '50g 1-hour glucose challenge test demonstrated borderline result. Follow-up nutritional counseling initiated with targeted blood sugar monitoring.'
        : 'Routine 26-28 week glucose screening within normal limits (< 140 mg/dL). No indication of gestational diabetes. Stable hemoglobin and platelet count.',
      guidelineNote: 'ACOG Practice Bulletin 190: Universal screening for gestational diabetes mellitus at 24 to 28 weeks of gestation.'
    });
  }

  // 5. Maternal-Fetal Medicine (MFM) Consult / Alert (GA ~ 30w - 34w)
  if (patient.status === 'HIGH' || patient.status === 'WATCH' || whyNow.triggered) {
    events.push({
      id: 'event-mfm-alert',
      type: 'clinical_event',
      date: dateAtGA(Math.max(28, patient.currentGestationalAgeWeeks - 2), 1),
      gestationalAgeWeeks: Math.max(28, patient.currentGestationalAgeWeeks - 2),
      gestationalAgeDays: 1,
      title: 'Perinatology / MFM Trajectory Surveillance Directive',
      subtitle: patient.status === 'HIGH' ? 'Critical trajectory alert: Serial Dopplers & weekly biometry initiated' : 'Close surveillance protocol for decelerating biometry or fluid trend',
      categoryLabel: 'Clinical Alert',
      severity: patient.status === 'HIGH' ? 'critical' : 'watch',
      highlights: [
        { label: 'Surveillance Interval', value: patient.status === 'HIGH' ? 'Weekly Scans' : 'Bi-Weekly Scans', isAbnormal: true },
        { label: 'Doppler Velocimetry', value: 'Umbilical Artery & MCA' },
        { label: 'Consultant', value: patient.assignedDoctorName || 'Dr. Alistair Vance, MD' }
      ],
      description: `Multidisciplinary review confirmed ${patient.trajectoryCategory.replace(/_/g, ' ')}. Recommended protocol: serial ultrasound evaluation every 1-2 weeks, Biophysical Profile (BPP) testing, and strict fetal kick count logging.`,
      guidelineNote: 'ACOG Practice Bulletin 229: Fetal Growth Restriction & Oligohydramnios management algorithms.'
    });
  }

  // 6. Third Trimester Group B Streptococcus (GBS) Screening (GA >= 36w)
  if (patient.currentGestationalAgeWeeks >= 36) {
    events.push({
      id: 'event-gbs-swab',
      type: 'clinical_event',
      date: dateAtGA(36, 0),
      gestationalAgeWeeks: 36,
      gestationalAgeDays: 0,
      title: 'Group B Streptococcus (GBS) Screening',
      subtitle: 'Vaginorectal swab screening for intrapartum antibiotic prophylaxis',
      categoryLabel: 'Diagnostic Screening',
      severity: 'normal',
      highlights: [
        { label: 'GBS Culture', value: 'Negative / Non-Colonized' },
        { label: 'Fetal Presentation', value: 'Cephalic (Vertex)' },
        { label: 'Cervical Assessment', value: 'Posterior, closed' }
      ],
      description: 'Routine 36-week screening completed. Negative for Group B Streptococcus. No intrapartum penicillin prophylaxis required upon presentation in labor.',
      guidelineNote: 'ACOG Committee Opinion 797: Prevention of Group B Streptococcal Early-Onset Disease in Newborns.'
    });
  }

  return events;
}

export const RecordsVerticalTimeline: React.FC<RecordsVerticalTimelineProps> = ({
  twin,
  onOpenReviewMeasurement,
  onOpenUpload,
  onOpenLongitudinalPdf
}) => {
  const { patient, visits, medications } = twin;

  const [activeCategory, setActiveCategory] = useState<TimelineFilterCategory>('all');
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  // 1. Process and Map Ultrasound Visits
  const ultrasoundItems: TimelineItem[] = useMemo(() => {
    return visits.map((v) => {
      const isOligo = v.amnioticFluidIndex_cm < 5.0 || v.singleDeepestPocket_cm < 2.0;
      const isLowFluid = v.amnioticFluidIndex_cm < 8.0;
      const isSevereFgr = v.growthPercentile < 5;
      const isSga = v.growthPercentile < 10;
      const isAsymmetric = v.biometrics?.hc_mm && v.biometrics?.ac_mm && (v.biometrics.hc_mm / v.biometrics.ac_mm > 1.12);

      let severity: 'normal' | 'watch' | 'critical' = 'normal';
      if (isOligo || isSevereFgr) {
        severity = 'critical';
      } else if (isLowFluid || isSga || isAsymmetric) {
        severity = 'watch';
      }

      const highlights: TimelineItem['highlights'] = [
        {
          label: 'EFW',
          value: `${v.estimatedFetalWeight_g}g (${v.growthPercentile}th %ile)`,
          isAbnormal: isSga,
          colorClass: isSga ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-800 bg-slate-50 border-slate-200'
        },
        {
          label: 'AFI / SDP',
          value: `${v.amnioticFluidIndex_cm.toFixed(1)} cm / ${v.singleDeepestPocket_cm.toFixed(1)} cm`,
          isAbnormal: isLowFluid,
          colorClass: isOligo ? 'text-rose-700 bg-rose-50 border-rose-200' : isLowFluid ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-800 bg-slate-50 border-slate-200'
        },
        {
          label: 'FHR',
          value: `${v.fetalHeartRate_bpm} bpm`,
          isAbnormal: v.fetalHeartRate_bpm < 110 || v.fetalHeartRate_bpm > 165
        },
        {
          label: 'Presentation',
          value: v.presentation ? v.presentation.toUpperCase() : 'CEPHALIC'
        }
      ];

      // Add Doppler if present
      if (v.doppler?.cerebroplacentalRatio) {
        const isBrainSparing = v.doppler.cerebroplacentalRatio < 1.08;
        highlights.push({
          label: 'CPR Ratio',
          value: `${v.doppler.cerebroplacentalRatio.toFixed(2)} (${isBrainSparing ? 'Brain-Sparing' : 'Normal'})`,
          isAbnormal: isBrainSparing,
          colorClass: isBrainSparing ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
        });
      }

      let summary = `Serial sonogram checkpoint at ${v.gestationalAgeWeeks}w ${v.gestationalAgeDays}d. Fetal weight estimated at ${v.estimatedFetalWeight_g}g (${v.growthPercentile}th percentile) with amniotic fluid index of ${v.amnioticFluidIndex_cm.toFixed(1)} cm.`;
      if (isOligo) {
        summary += ' Critical oligohydramnios threshold noted.';
      } else if (isSga) {
        summary += ' Fetal weight tracks below the 10th percentile cutoff (SGA/FGR).';
      }

      return {
        id: `us-${v.id}`,
        type: 'ultrasound',
        date: v.date,
        gestationalAgeWeeks: v.gestationalAgeWeeks,
        gestationalAgeDays: v.gestationalAgeDays,
        title: `Ultrasound Checkpoint #${v.visitNumber || 1}`,
        subtitle: `GA ${v.gestationalAgeWeeks}w ${v.gestationalAgeDays}d • ${v.presentation || 'Cephalic'} • ${v.estimatedFetalWeight_g}g`,
        categoryLabel: 'Ultrasound Examination',
        severity,
        highlights,
        description: summary,
        reviewStatus: v.doctorReviewStatus || 'accepted',
        ultrasoundRecord: v,
        guidelineNote: isSga ? 'SMFM FGR Checklist: Doppler interrogation of umbilical artery recommended at each serial scan.' : undefined
      };
    });
  }, [visits]);

  // 2. Process and Map Medication Changes & Exposures
  const medicationItems: TimelineItem[] = useMemo(() => {
    return (medications || []).map((m) => {
      const isCurrent = m.exposureStatus === 'current';
      return {
        id: `med-${m.id}`,
        type: 'medication',
        date: m.startDate,
        gestationalAgeWeeks: m.gestationalAgeStartWeeks,
        gestationalAgeDays: 0,
        title: `Medication Initiated: ${m.medicationName}`,
        subtitle: `${m.dose} • ${m.route} • ${m.frequency}`,
        categoryLabel: 'Pharmacotherapy',
        severity: isCurrent ? 'normal' : 'normal',
        highlights: [
          { label: 'Active Drug', value: m.activeIngredient || m.medicationName },
          { label: 'Dosage / Regimen', value: `${m.dose} (${m.frequency})` },
          { label: 'Indication', value: m.indication },
          { label: 'Status', value: isCurrent ? 'Active Treatment' : 'Discontinued' }
        ],
        description: `Prescribed for ${m.indication}. Maternal condition: ${m.maternalCondition}. Started during the ${m.trimester} trimester (GA ~${m.gestationalAgeStartWeeks}w). Documented from verified ${m.source}.`,
        guidelineNote: 'ACOG Practice Guidelines on Maternal Pharmacotherapy & Teratogenic Safety.',
        medicationRecord: m
      };
    });
  }, [medications]);

  // 3. Process Clinical Milestones
  const clinicalItems = useMemo(() => deriveClinicalEvents(twin), [twin]);

  // 4. Combined & Sorted Timeline Items
  const allTimelineItems = useMemo(() => {
    let combined = [...ultrasoundItems, ...medicationItems, ...clinicalItems];

    // Filter by Category
    if (activeCategory !== 'all') {
      combined = combined.filter((item) => item.type === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      combined = combined.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.highlights.some(
            (h) => h.label.toLowerCase().includes(q) || h.value.toLowerCase().includes(q)
          )
      );
    }

    // Sort Chronologically
    combined.sort((a, b) => {
      const gaA = a.gestationalAgeWeeks * 7 + a.gestationalAgeDays;
      const gaB = b.gestationalAgeWeeks * 7 + b.gestationalAgeDays;
      return sortOrder === 'desc' ? gaB - gaA : gaA - gaB;
    });

    return combined;
  }, [ultrasoundItems, medicationItems, clinicalItems, activeCategory, searchQuery, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    allTimelineItems.forEach((item) => {
      next[item.id] = true;
    });
    setExpandedItemIds(next);
  };

  const collapseAll = () => {
    setExpandedItemIds({});
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Timeline Header & Summary Ribbon */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Longitudinal Pregnancy Clinical Records Timeline
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {allTimelineItems.length} Events Logged
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified chronological timeline spanning serial ultrasound examinations, pharmacotherapy titrations, and clinical milestones.
              </p>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-teal-50/70 border border-teal-200 text-teal-900 flex items-center space-x-2">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>
                <strong>{ultrasoundItems.length}</strong> Ultrasound Checkpoints
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-purple-50/70 border border-purple-200 text-purple-900 flex items-center space-x-2">
              <Pill className="w-3.5 h-3.5 text-purple-600" />
              <span>
                <strong>{medicationItems.length}</strong> Medications Logged
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>
                <strong>{clinicalItems.length}</strong> Clinical Milestones
              </span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Filter Bar & Search */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              All Records ({ultrasoundItems.length + medicationItems.length + clinicalItems.length})
            </button>

            <button
              onClick={() => setActiveCategory('ultrasound')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                activeCategory === 'ultrasound'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-teal-800 border-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Ultrasound Scans ({ultrasoundItems.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('medication')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                activeCategory === 'medication'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-purple-800 border-slate-200'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Medications ({medicationItems.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory('clinical_event')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                activeCategory === 'clinical_event'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-blue-800 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Milestones &amp; Alerts ({clinicalItems.length})</span>
            </button>
          </div>

          {/* Controls: Search, Sort Order & Expand/Collapse */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AFI, drug, biometrics..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 sm:w-56"
              />
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition cursor-pointer"
              title="Toggle Chronological Sorting Order"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === 'desc' ? 'Latest First' : 'Earliest First'}</span>
            </button>

            <button
              onClick={() => (Object.keys(expandedItemIds).length > 0 ? collapseAll() : expandAll())}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition cursor-pointer"
            >
              {Object.keys(expandedItemIds).length > 0 ? 'Collapse All' : 'Expand All'}
            </button>

            {onOpenLongitudinalPdf && (
              <button
                id="btn-timeline-open-longitudinal-pdf"
                onClick={onOpenLongitudinalPdf}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold transition cursor-pointer shadow-2xs text-xs"
                title="Generate structured, print-ready PDF summary of longitudinal pregnancy history"
              >
                <Printer className="w-3.5 h-3.5 text-teal-200" />
                <span>PDF Summary</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. The Vertical Timeline Tree */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {allTimelineItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 space-y-2">
            <Info className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No records match the active filter or search query.</p>
            <p className="text-[11px] text-slate-400">Clear filters or try searching for a different keyword.</p>
          </div>
        ) : (
          allTimelineItems.map((item) => {
            const isExpanded = !!expandedItemIds[item.id];

            // Determine styling based on type and severity
            let nodeIcon = <Activity className="w-3.5 h-3.5" />;
            let nodeColor = 'bg-teal-600 text-white ring-4 ring-teal-100';
            let cardBorder = 'border-slate-200 hover:border-teal-300';
            let categoryBadgeClass = 'bg-teal-50 text-teal-800 border-teal-200';

            if (item.type === 'medication') {
              nodeIcon = <Pill className="w-3.5 h-3.5" />;
              nodeColor = 'bg-purple-600 text-white ring-4 ring-purple-100';
              cardBorder = 'border-slate-200 hover:border-purple-300';
              categoryBadgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
            } else if (item.type === 'clinical_event') {
              if (item.severity === 'critical') {
                nodeIcon = <AlertTriangle className="w-3.5 h-3.5" />;
                nodeColor = 'bg-rose-600 text-white ring-4 ring-rose-100';
                cardBorder = 'border-rose-300 hover:border-rose-400 bg-rose-50/20';
                categoryBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
              } else if (item.severity === 'watch') {
                nodeIcon = <ShieldAlert className="w-3.5 h-3.5" />;
                nodeColor = 'bg-amber-500 text-white ring-4 ring-amber-100';
                cardBorder = 'border-amber-300 hover:border-amber-400 bg-amber-50/20';
                categoryBadgeClass = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
              } else {
                nodeIcon = <CheckCircle2 className="w-3.5 h-3.5" />;
                nodeColor = 'bg-blue-600 text-white ring-4 ring-blue-100';
                cardBorder = 'border-slate-200 hover:border-blue-300';
                categoryBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
              }
            } else if (item.type === 'ultrasound' && item.severity === 'critical') {
              nodeColor = 'bg-rose-600 text-white ring-4 ring-rose-100';
              cardBorder = 'border-rose-300 hover:border-rose-400 bg-rose-50/10';
              categoryBadgeClass = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
            }

            return (
              <div key={item.id} className="relative group">
                
                {/* Timeline Spine Node Indicator */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 z-10 ${nodeColor}`}
                >
                  {nodeIcon}
                </div>

                {/* Timeline Card Content */}
                <div
                  className={`bg-white border rounded-xl p-4 transition-all shadow-2xs ${cardBorder}`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Gestational Age Badge */}
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                          GA {item.gestationalAgeWeeks}w {item.gestationalAgeDays || 0}d
                        </span>

                        {/* Category Label */}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${categoryBadgeClass}`}>
                          {item.categoryLabel}
                        </span>

                        {/* Calendar Date */}
                        <span className="text-xs text-slate-400 flex items-center space-x-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.date}</span>
                        </span>

                        {/* Review Status (if ultrasound) */}
                        {item.reviewStatus && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                            item.reviewStatus === 'accepted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {item.reviewStatus}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                        <span>{item.title}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    </div>

                    {/* Actions on Card Header */}
                    <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                      {item.type === 'ultrasound' && item.ultrasoundRecord && onOpenReviewMeasurement && (
                        <button
                          onClick={() => onOpenReviewMeasurement(item.ultrasoundRecord!)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-semibold transition cursor-pointer"
                          title="Open Caliper Review Modal"
                        >
                          <Edit3 className="w-3 h-3 text-teal-600" />
                          <span>Review Calipers</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {item.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-left ${
                            h.colorClass ||
                            (h.isAbnormal
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : 'bg-slate-50/70 border-slate-200/80 text-slate-800')
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            {h.label}
                          </span>
                          <span className="font-mono font-bold text-xs mt-0.5 block truncate">
                            {h.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2.5 animate-fadeIn">
                      {item.description && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                            Clinical Summary &amp; Narrative Note
                          </span>
                          <p className="text-slate-700 text-xs mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {item.description}
                          </p>
                        </div>
                      )}

                      {/* Additional Ultrasound Calipers Table if Ultrasound */}
                      {item.type === 'ultrasound' && item.ultrasoundRecord && item.ultrasoundRecord.biometrics && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
                            Standard Biometric Calipers (Hadlock 4-Parameter Model)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                            <div className="bg-white p-1.5 rounded border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">HC (Head)</span>
                              <strong className="text-slate-800">{item.ultrasoundRecord.biometrics.hc_mm || 'N/A'} mm</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">AC (Abdomen)</span>
                              <strong className="text-slate-800">{item.ultrasoundRecord.biometrics.ac_mm || 'N/A'} mm</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">FL (Femur)</span>
                              <strong className="text-slate-800">{item.ultrasoundRecord.biometrics.fl_mm || 'N/A'} mm</strong>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">BPD (Diameter)</span>
                              <strong className="text-slate-800">{item.ultrasoundRecord.biometrics.bpd_mm || 'N/A'} mm</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Clinical Guideline Directive Context */}
                      {item.guidelineNote && (
                        <div className="flex items-start space-x-2 text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Guideline Context:</strong> {item.guidelineNote}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

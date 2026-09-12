/**
 * PregnancyTwin AI - Seed Data & Clinical Baseline Store
 * Contains the 3 canonical SIH fictional demo patients + guidelines + sample ultrasound reports
 */

import { Patient, VisitMeasurement, User, ClinicalGuideline, AuditLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'doc-001',
    name: 'Dr. Alistair Vance, MD',
    email: 'a.vance@maternalfetal.hospital.org',
    role: 'doctor',
    hospital: 'St. Jude Maternal-Fetal Medicine Center',
    specialty: 'Obstetrician & Gynecologist, MFM Fellow',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-002',
    name: 'Dr. Marcus Reed, MD',
    email: 'm.reed@maternalfetal.hospital.org',
    role: 'doctor',
    hospital: 'St. Jude Maternal-Fetal Medicine Center',
    specialty: 'Perinatologist, High-Risk Obstetrics',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'admin-001',
    name: 'Chief Clinical Admin (SIH Audit)',
    email: 'admin@pregnancytwin.ai',
    role: 'admin',
    hospital: 'Apex Health Systems Central Review',
    specialty: 'Clinical Governance & AI Quality Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    mrn: 'MRN-44901-A',
    name: 'Sarah Chen (Demo Patient A)',
    age: 29,
    gravidity: 1,
    parity: 0,
    lmp: '2026-01-20',
    edd: '2026-10-27',
    currentGestationalAgeWeeks: 32,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'LOW',
    trajectoryCategory: 'STABLE',
    lastVisitDate: '2026-08-31',
    notes: 'Patient A — Normal: Growth velocity ↑, Amniotic fluid stable across serial visits. Trajectory Risk: LOW.',
    maternalBmi: 22.4
  },
  {
    id: 'pat-002',
    mrn: 'MRN-88124-B',
    name: 'Amina Al-Mansoor (Demo Patient B)',
    age: 31,
    gravidity: 2,
    parity: 1,
    lmp: '2026-01-18',
    edd: '2026-10-25',
    currentGestationalAgeWeeks: 32,
    currentGestationalAgeDays: 2,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'HIGH',
    trajectoryCategory: 'FLUID_DECLINE',
    lastVisitDate: '2026-09-02',
    notes: 'Patient B — Declining Fluid: Serial sonography detects progressive fluid trajectory drop (SDP: 5.4 → 4.6 → 3.8 → 3.1 cm). Trajectory Risk: HIGH.',
    maternalBmi: 28.1
  },
  {
    id: 'pat-003',
    mrn: 'MRN-92041-C',
    name: 'Priya Sharma (Demo Patient C)',
    age: 27,
    gravidity: 1,
    parity: 0,
    lmp: '2026-01-16',
    edd: '2026-10-23',
    currentGestationalAgeWeeks: 32,
    currentGestationalAgeDays: 4,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'HIGH',
    trajectoryCategory: 'GROWTH_DEVIATION',
    lastVisitDate: '2026-09-03',
    notes: 'Patient C — Growth Concern: Hadlock percentile plummeted (42% → 31% → 18%) across serial visits. Trajectory Risk: HIGH.',
    maternalBmi: 19.8
  },
  {
    id: 'pat-004',
    mrn: 'MRN-31089-D',
    name: 'Elena Rostova',
    age: 34,
    gravidity: 3,
    parity: 2,
    lmp: '2026-02-15',
    edd: '2026-11-22',
    currentGestationalAgeWeeks: 28,
    currentGestationalAgeDays: 1,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'WATCH',
    trajectoryCategory: 'FLUID_DECLINE',
    lastVisitDate: '2026-08-28',
    notes: 'Advanced maternal age, borderline fluid velocity reduction (-0.28 cm/week). Close surveillance recommended.',
    maternalBmi: 24.6
  },
  {
    id: 'pat-005',
    mrn: 'MRN-55102-E',
    name: 'Maria Santos',
    age: 30,
    gravidity: 2,
    parity: 1,
    lmp: '2026-01-12',
    edd: '2026-10-19',
    currentGestationalAgeWeeks: 33,
    currentGestationalAgeDays: 1,
    assignedDoctorId: 'doc-002',
    assignedDoctorName: 'Dr. Marcus Reed, MD',
    status: 'WATCH',
    trajectoryCategory: 'GROWTH_DEVIATION',
    lastVisitDate: '2026-09-01',
    notes: 'Assigned to Dr. Reed. Demonstrating abdominal circumference percentile deceleration at 33w.',
    maternalBmi: 31.2
  },
  {
    id: 'pat-006',
    mrn: 'MRN-67439-F',
    name: 'Fatima Zahra',
    age: 26,
    gravidity: 1,
    parity: 0,
    lmp: '2026-01-24',
    edd: '2026-10-31',
    currentGestationalAgeWeeks: 31,
    currentGestationalAgeDays: 4,
    assignedDoctorId: 'doc-002',
    assignedDoctorName: 'Dr. Marcus Reed, MD',
    status: 'LOW',
    trajectoryCategory: 'STABLE',
    lastVisitDate: '2026-08-30',
    notes: 'Assigned to Dr. Reed. Normal concordant twin-trajectory biometry and amniotic fluid volume.',
    maternalBmi: 21.8
  }
];

export const INITIAL_VISITS: Record<string, VisitMeasurement[]> = {
  'pat-001': [
    {
      id: 'vis-001-1',
      visitId: 'vis-001-1',
      patientId: 'pat-001',
      visitNumber: 1,
      date: '2026-07-06',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 650,
      growthPercentile: 45,
      amnioticFluidIndex_cm: 10.2,
      singleDeepestPocket_cm: 4.8,
      fetalHeartRate_bpm: 144,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 220, ac_mm: 195, fl_mm: 43, bpd_mm: 61 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-06'
    },
    {
      id: 'vis-001-2',
      visitId: 'vis-001-2',
      patientId: 'pat-001',
      visitNumber: 2,
      date: '2026-08-03',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1150,
      growthPercentile: 47,
      amnioticFluidIndex_cm: 10.5,
      singleDeepestPocket_cm: 4.9,
      fetalHeartRate_bpm: 140,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 258, ac_mm: 238, fl_mm: 53, bpd_mm: 72 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.94,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-03'
    },
    {
      id: 'vis-001-3',
      visitId: 'vis-001-3',
      patientId: 'pat-001',
      visitNumber: 3,
      date: '2026-08-31',
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1790,
      growthPercentile: 44,
      amnioticFluidIndex_cm: 10.1,
      singleDeepestPocket_cm: 4.7,
      fetalHeartRate_bpm: 138,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 295, ac_mm: 278, fl_mm: 62, bpd_mm: 82 },
      sourceConfidence: 0.96,
      imageQualityScore: 0.95,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-31'
    }
  ],

  'pat-002': [
    {
      id: 'vis-002-1',
      visitId: 'vis-002-1',
      patientId: 'pat-002',
      visitNumber: 1,
      date: '2026-07-08',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 2,
      estimatedFetalWeight_g: 660,
      growthPercentile: 48,
      amnioticFluidIndex_cm: 11.4,
      singleDeepestPocket_cm: 5.4,
      fetalHeartRate_bpm: 146,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 222, ac_mm: 198, fl_mm: 44, bpd_mm: 62 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-08'
    },
    {
      id: 'vis-002-2',
      visitId: 'vis-002-2',
      patientId: 'pat-002',
      visitNumber: 2,
      date: '2026-08-05',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 2,
      estimatedFetalWeight_g: 1100,
      growthPercentile: 44,
      amnioticFluidIndex_cm: 9.8,
      singleDeepestPocket_cm: 4.6,
      fetalHeartRate_bpm: 142,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 255, ac_mm: 232, fl_mm: 52, bpd_mm: 71 },
      sourceConfidence: 0.91,
      imageQualityScore: 0.89,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-05'
    },
    {
      id: 'vis-002-3',
      visitId: 'vis-002-3',
      patientId: 'pat-002',
      visitNumber: 3,
      date: '2026-08-19',
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 2,
      estimatedFetalWeight_g: 1390,
      growthPercentile: 42,
      amnioticFluidIndex_cm: 8.8,
      singleDeepestPocket_cm: 3.8,
      fetalHeartRate_bpm: 141,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 272, ac_mm: 251, fl_mm: 56, bpd_mm: 75 },
      sourceConfidence: 0.90,
      imageQualityScore: 0.88,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-19'
    },
    {
      id: 'vis-002-4',
      visitId: 'vis-002-4',
      patientId: 'pat-002',
      visitNumber: 4,
      date: '2026-09-02',
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 2,
      estimatedFetalWeight_g: 1680,
      growthPercentile: 39,
      amnioticFluidIndex_cm: 7.9,
      singleDeepestPocket_cm: 3.1,
      fetalHeartRate_bpm: 140,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 290, ac_mm: 270, fl_mm: 60, bpd_mm: 80 },
      sourceConfidence: 0.89,
      imageQualityScore: 0.86,
      doctorReviewStatus: 'pending',
      doctorNotes: 'SDP plummeted across 4 scans (5.4 -> 4.6 -> 3.8 -> 3.1 cm); AFI dropped below 8.0 cm (7.9 cm).'
    }
  ],

  'pat-003': [
    {
      id: 'vis-003-1',
      visitId: 'vis-003-1',
      patientId: 'pat-003',
      visitNumber: 1,
      date: '2026-07-10',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 4,
      estimatedFetalWeight_g: 680,
      growthPercentile: 42,
      amnioticFluidIndex_cm: 10.2,
      singleDeepestPocket_cm: 4.6,
      fetalHeartRate_bpm: 148,
      presentation: 'breech',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 224, ac_mm: 202, fl_mm: 45, bpd_mm: 63 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-10'
    },
    {
      id: 'vis-003-2',
      visitId: 'vis-003-2',
      patientId: 'pat-003',
      visitNumber: 2,
      date: '2026-08-07',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 4,
      estimatedFetalWeight_g: 980,
      growthPercentile: 31,
      amnioticFluidIndex_cm: 10.0,
      singleDeepestPocket_cm: 4.4,
      fetalHeartRate_bpm: 144,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 252, ac_mm: 225, fl_mm: 50, bpd_mm: 70 },
      sourceConfidence: 0.92,
      imageQualityScore: 0.90,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-07'
    },
    {
      id: 'vis-003-3',
      visitId: 'vis-003-3',
      patientId: 'pat-003',
      visitNumber: 3,
      date: '2026-09-03',
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 4,
      estimatedFetalWeight_g: 1350,
      growthPercentile: 18,
      amnioticFluidIndex_cm: 9.8,
      singleDeepestPocket_cm: 4.2,
      fetalHeartRate_bpm: 139,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 280, ac_mm: 246, fl_mm: 56, bpd_mm: 76 },
      sourceConfidence: 0.91,
      imageQualityScore: 0.88,
      doctorReviewStatus: 'pending',
      doctorNotes: 'Fetal growth deceleration: Hadlock percentile fell sharply from 42% -> 31% -> 18% across 8 weeks (EFW 680g -> 980g -> 1350g).'
    }
  ],

  'pat-004': [
    {
      id: 'vis-004-1',
      visitId: 'vis-004-1',
      patientId: 'pat-004',
      visitNumber: 1,
      date: '2026-07-31',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 640,
      growthPercentile: 42,
      amnioticFluidIndex_cm: 10.8,
      singleDeepestPocket_cm: 4.8,
      fetalHeartRate_bpm: 142,
      presentation: 'cephalic',
      placentaLocation: 'fundal',
      biometrics: { hc_mm: 219, ac_mm: 194, fl_mm: 43, bpd_mm: 60 },
      sourceConfidence: 0.90,
      imageQualityScore: 0.88,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-31'
    },
    {
      id: 'vis-004-2',
      visitId: 'vis-004-2',
      patientId: 'pat-004',
      visitNumber: 2,
      date: '2026-08-28',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 1110,
      growthPercentile: 40,
      amnioticFluidIndex_cm: 9.7,
      singleDeepestPocket_cm: 4.2,
      fetalHeartRate_bpm: 138,
      presentation: 'cephalic',
      placentaLocation: 'fundal',
      biometrics: { hc_mm: 254, ac_mm: 230, fl_mm: 52, bpd_mm: 71 },
      sourceConfidence: 0.92,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-28'
    }
  ],

  'pat-005': [
    {
      id: 'vis-005-1',
      visitId: 'vis-005-1',
      patientId: 'pat-005',
      visitNumber: 1,
      date: '2026-07-07',
      gestationalAgeWeeks: 25,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 780,
      growthPercentile: 50,
      amnioticFluidIndex_cm: 12.1,
      singleDeepestPocket_cm: 5.4,
      fetalHeartRate_bpm: 146,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 232, ac_mm: 208, fl_mm: 46, bpd_mm: 64 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-07-07'
    },
    {
      id: 'vis-005-2',
      visitId: 'vis-005-2',
      patientId: 'pat-005',
      visitNumber: 2,
      date: '2026-08-04',
      gestationalAgeWeeks: 29,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 1240,
      growthPercentile: 42,
      amnioticFluidIndex_cm: 11.2,
      singleDeepestPocket_cm: 5.0,
      fetalHeartRate_bpm: 142,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 268, ac_mm: 242, fl_mm: 55, bpd_mm: 74 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-08-04'
    },
    {
      id: 'vis-005-3',
      visitId: 'vis-005-3',
      patientId: 'pat-005',
      visitNumber: 3,
      date: '2026-09-01',
      gestationalAgeWeeks: 33,
      gestationalAgeDays: 1,
      estimatedFetalWeight_g: 1720,
      growthPercentile: 32,
      amnioticFluidIndex_cm: 10.5,
      singleDeepestPocket_cm: 4.7,
      fetalHeartRate_bpm: 139,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 301, ac_mm: 274, fl_mm: 63, bpd_mm: 83 },
      sourceConfidence: 0.91,
      imageQualityScore: 0.89,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-09-01',
      doctorNotes: 'Abdominal circumference trajectory slowing; monitor Hadlock curve closely.'
    }
  ],

  'pat-006': [
    {
      id: 'vis-006-1',
      visitId: 'vis-006-1',
      patientId: 'pat-006',
      visitNumber: 1,
      date: '2026-07-20',
      gestationalAgeWeeks: 25,
      gestationalAgeDays: 4,
      estimatedFetalWeight_g: 810,
      growthPercentile: 48,
      amnioticFluidIndex_cm: 11.8,
      singleDeepestPocket_cm: 5.2,
      fetalHeartRate_bpm: 145,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 236, ac_mm: 212, fl_mm: 47, bpd_mm: 65 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-07-20'
    },
    {
      id: 'vis-006-2',
      visitId: 'vis-006-2',
      patientId: 'pat-006',
      visitNumber: 2,
      date: '2026-08-30',
      gestationalAgeWeeks: 31,
      gestationalAgeDays: 4,
      estimatedFetalWeight_g: 1690,
      growthPercentile: 47,
      amnioticFluidIndex_cm: 11.5,
      singleDeepestPocket_cm: 5.1,
      fetalHeartRate_bpm: 141,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 292, ac_mm: 272, fl_mm: 61, bpd_mm: 81 },
      sourceConfidence: 0.96,
      imageQualityScore: 0.94,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-08-30',
      doctorNotes: 'Optimal growth concordant with physiological standard.'
    }
  ]
};

export const CLINICAL_GUIDELINES: ClinicalGuideline[] = [
  {
    id: 'guide-001',
    title: 'ISUOG Practice Guidelines: Amniotic Fluid Assessment',
    organization: 'ISUOG',
    category: 'Amniotic Fluid',
    summary: 'Consensus recommendation prioritizing Single Deepest Pocket (SDP) or Amniotic Fluid Index (AFI) in third-trimester surveillance. Serial measurements are strongly advised over single isolated cutoffs.',
    keyThresholds: [
      'Normal AFI: 8.0 cm to 18.0 cm (or 5.0 to 24.0 cm population reference)',
      'Oligohydramnios: AFI < 5.0 cm or SDP < 2.0 cm',
      'Polyhydramnios: AFI > 24.0 cm or SDP > 8.0 cm',
      'Longitudinal delta: > 20% decline across two sequential visits warrants Doppler assessment'
    ],
    referenceUrl: 'https://doi.org/10.1002/uog.13327'
  },
  {
    id: 'guide-002',
    title: 'ACOG Practice Bulletin No. 227: Fetal Growth Restriction (FGR)',
    organization: 'ACOG',
    category: 'Fetal Growth Restriction',
    summary: 'Clinical management of suspected fetal growth restriction. Distinguishes small-for-gestational-age (SGA) from pathological FGR via abdominal circumference velocity and umbilical artery Doppler waveforms.',
    keyThresholds: [
      'Severe FGR: EFW < 3rd percentile for gestational age',
      'Moderate FGR: EFW between 3rd and 10th percentile with abnormal Doppler or AC growth flattening',
      'Velocity Threshold: Growth percentile decline > 20 percentile points between scans 3+ weeks apart'
    ],
    referenceUrl: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2020/02/fetal-growth-restriction'
  },
  {
    id: 'guide-003',
    title: 'SMFM Consult Series #52: Evaluation and Management of Oligohydramnios',
    organization: 'SMFM',
    category: 'Amniotic Fluid',
    summary: 'Society for Maternal-Fetal Medicine recommendations on isolated vs complicated oligohydramnios. Highlights maternal hydration, fetal renal perfusion, and membrane integrity.',
    keyThresholds: [
      'Isolated oligohydramnios: Delivery generally recommended at 36w0d - 37w6d',
      'Follow-up interval: Twice-weekly nonstress testing and weekly biophysical profile / fluid volume checks'
    ]
  },
  {
    id: 'guide-004',
    title: 'Fetal Biometry Benchmark: Multi-Centre Ultrasound Benchmark (FP + HC18 + UCLH)',
    organization: 'Nature Scientific Reports',
    category: 'Ultrasound Biometry & CV',
    summary: 'A unified multicentre benchmark combining FP, HC18, and UCLH cohorts containing 4,513 fetal ultrasound images from 1,904 subjects across 4 clinical sites and 7 ultrasound devices. Specifically designed to test cross-device caliper generalization for BPD, OFD, HC, AC, and FL.',
    keyThresholds: [
      'Anatomical coverage: Fetal head (HC18), standard abdominal circumference plane (FP), and femur length diaphysis (UCLH)',
      'Cross-machine generalizability: Evaluated across GE Voluson, Philips EPIQ, Mindray Resona, and Canon Aplio systems',
      'Evaluation metrics: Mean Absolute Error (mm) for biometric calipers, Dice coefficient for anatomical plane contours'
    ],
    referenceUrl: 'https://www.nature.com/articles/s41598'
  },
  {
    id: 'guide-005',
    title: 'SIH26196 Hybrid Dataset Strategy & MIMIC-IV Delimitation Guidelines',
    organization: 'SIH Clinical AI Working Group',
    category: 'Digital Twin & Trajectory',
    summary: 'Scientific rationale establishing the separation between cross-sectional ultrasound benchmarks (CV module) and controlled synthetic longitudinal cohorts (Digital Twin trajectory engine). Clarifies why MIMIC-IV is delimited as supplementary EHR structural reference rather than primary fetal timeline.',
    keyThresholds: [
      'Ultrasound limitation: Public image datasets are cross-sectional single snapshots; they lack longitudinal serial visits for the same patient',
      'Synthetic cohort scale: 500 to 2,000 controlled pregnancies with 4 to 8 serial visits, tracking ΔEFW and ΔAFI velocities',
      'MIMIC-IV delimitation: Critical-care/ICU EHR requiring CITI credentialing; lacks routine fetal ultrasound biometric series'
    ]
  }
];

export const SAMPLE_REPORT_TEMPLATES = [
  {
    title: 'Sample A: Stable 32-Week Routine Scan (Sarah Chen)',
    text: `CLINICAL ULTRASOUND REPORT
PATIENT: Sarah Chen | MRN-44901-A | DOB: 1997-04-12
EXAM: Obstetric Ultrasound Third Trimester (Detailed Biometry & Fluid)
DATE: 2026-08-31 | GESTATIONAL AGE: 32 weeks 0 days

FINDINGS:
Single intrauterine pregnancy in cephalic presentation.
Fetal cardiac activity is present and regular at 138 bpm.
Placenta is posterior, clear of internal os, grade 1 maturity.

BIOMETRY:
Biparietal Diameter (BPD): 82 mm (32w 1d)
Head Circumference (HC): 295 mm (32w 2d)
Abdominal Circumference (AC): 278 mm (31w 6d)
Femur Length (FL): 62 mm (32w 0d)
Estimated Fetal Weight (Hadlock): 1790 grams (44th percentile).

AMNIOTIC FLUID:
Amniotic Fluid Index (AFI): 10.1 cm
Single Deepest Pocket (SDP): 4.7 cm
Normal clear fluid volume. No debris or oligohydramnios.

IMPRESSION:
Appropriate fetal growth concordant with 32w gestational age. Normal amniotic fluid volume. Stable longitudinal progression.`
  },
  {
    title: 'Sample B: Fluid Decline 32-Week Scan (Amina Al-Mansoor)',
    text: `OBSTETRIC ULTRASOUND EVALUATION
PATIENT: Amina Al-Mansoor | MRN-88124-B
INDICATION: Follow-up serial fluid evaluation at 32 weeks 2 days
DATE: 2026-09-02

OBSERVATIONS:
Fetus is in cephalic presentation, spine left. Fetal heart rate regular at 140 bpm.
Placenta anterior, clear of os, grade 2 maturity with mild lacunae.

FETAL MEASUREMENTS:
BPD: 80 mm | HC: 290 mm | AC: 270 mm | FL: 60 mm
Estimated Fetal Weight: 1680 g (39th percentile).

AMNIOTIC FLUID EVALUATION:
Amniotic Fluid Index (AFI): 7.9 cm (Reduced from previous 9.8 cm and initial 11.4 cm)
Single Deepest Vertical Pocket: 3.1 cm
All 4 quadrants visualized. Clear subjectively reduced pocket depths in lower quadrants.

IMPRESSION:
Borderline reduced amniotic fluid index (7.9 cm), representing an active downward trajectory across three consecutive evaluations. Growth velocity remains currently preserved at 39th percentile.`
  },
  {
    title: 'Sample C: Fetal Growth Deceleration Scan (Priya Sharma)',
    text: `SONOGRAPHIC CONSULTATION - FETAL BIOMETRY
PATIENT: Priya Sharma | MRN-92041-C
GA BY DATES: 32 weeks 4 days | DATE OF SCAN: 2026-09-03
REASON FOR STUDY: Suspected growth deceleration

SCAN DETAILS:
Fetal heart rate: 139 bpm. Cephalic presentation. Posterior placenta.

BIOMETRIC ANALYSIS:
BPD: 78 mm (31w 2d)
HC: 284 mm (31w 0d)
AC: 254 mm (29w 4d) - Note significant lag of 3 weeks
FL: 58 mm (30w 2d)
Calculated EFW (Hadlock 4): 1420 grams
Growth Percentile: 27th percentile (Marked drop from 41st percentile at 28w and 52nd percentile at 24w).

FLUID STATUS:
Amniotic Fluid Index: 9.8 cm
Maximum Vertical Pocket: 4.3 cm (Normal fluid volume).

IMPRESSION:
Disproportionate abdominal circumference lag resulting in substantial fetal growth percentile drop (52nd -> 41st -> 27th). Recommend umbilical artery Doppler velocimetry and follow-up in 2 weeks.`
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-03 09:15:22',
    userId: 'doc-001',
    userName: 'Dr. Alistair Vance, MD',
    userRole: 'doctor',
    action: 'REVIEW_ALERT',
    patientId: 'pat-002',
    patientName: 'Amina Al-Mansoor',
    details: 'Acknowledged Critical Fluid Decline Trajectory alert (-25% AFI drop, current AFI 7.9 cm).'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-03 08:42:10',
    userId: 'doc-001',
    userName: 'Dr. Alistair Vance, MD',
    userRole: 'doctor',
    action: 'EXTRACT_REPORT',
    patientId: 'pat-003',
    patientName: 'Priya Sharma',
    details: 'Gemini structured output extraction verified for 32w4d biometry report.'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-02 16:30:00',
    userId: 'admin-001',
    userName: 'Chief Clinical Admin',
    userRole: 'admin',
    action: 'SYSTEM_AUDIT',
    details: 'Completed weekly governance check. Model trajectory calibration evaluated with 0.93 AUC on test cohorts.'
  }
];

export const INITIAL_MEDICATIONS: any[] = [
  {
    id: 'med-001',
    patientId: 'pat-001',
    medicationName: 'Low-Dose Aspirin',
    activeIngredient: 'Aspirin',
    dose: '81 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-05-15',
    gestationalAgeStartWeeks: 12,
    trimester: '1st',
    indication: 'Preeclampsia prophylaxis',
    maternalCondition: 'High risk of preeclampsia',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-002',
    patientId: 'pat-001',
    medicationName: 'Labetalol Hydrochloride',
    activeIngredient: 'Labetalol',
    dose: '100 mg',
    route: 'Oral',
    frequency: 'Twice daily',
    startDate: '2026-07-28',
    gestationalAgeStartWeeks: 24,
    trimester: '2nd',
    indication: 'Gestational Hypertension management',
    maternalCondition: 'Gestational Hypertension',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-003',
    patientId: 'pat-002',
    medicationName: 'Labetalol Hydrochloride',
    activeIngredient: 'Labetalol',
    dose: '200 mg',
    route: 'Oral',
    frequency: 'Twice daily',
    startDate: '2026-06-10',
    gestationalAgeStartWeeks: 20,
    trimester: '2nd',
    indication: 'Chronic Hypertension control',
    maternalCondition: 'Chronic Hypertension',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-004',
    patientId: 'pat-002',
    medicationName: 'Lantus Solostar',
    activeIngredient: 'Insulin Glargine',
    dose: '12 Units',
    route: 'Subcutaneous',
    frequency: 'Once nightly at bedtime',
    startDate: '2026-07-15',
    gestationalAgeStartWeeks: 25,
    trimester: '2nd',
    indication: 'Gestational Diabetes mellitus (GDM) control',
    maternalCondition: 'Gestational Diabetes Mellitus',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-005',
    patientId: 'pat-003',
    medicationName: 'Endometrin Vaginal Insert',
    activeIngredient: 'Progesterone',
    dose: '100 mg',
    route: 'Vaginal',
    frequency: 'Twice daily',
    startDate: '2026-05-20',
    stopDate: '2026-08-15',
    gestationalAgeStartWeeks: 16,
    gestationalAgeStopWeeks: 28,
    trimester: '2nd',
    indication: 'Prevention of recurrent spontaneous preterm birth',
    maternalCondition: 'History of preterm labor',
    exposureStatus: 'past',
    source: 'prescription'
  },
  {
    id: 'med-006',
    patientId: 'pat-003',
    medicationName: 'Methyldopa',
    activeIngredient: 'Methyldopa',
    dose: '250 mg',
    route: 'Oral',
    frequency: 'Three times daily',
    startDate: '2026-06-15',
    stopDate: '2026-07-25',
    gestationalAgeStartWeeks: 20,
    gestationalAgeStopWeeks: 26,
    trimester: '2nd',
    indication: 'Chronic Hypertension management',
    maternalCondition: 'Chronic Hypertension',
    exposureStatus: 'past',
    source: 'report'
  }
];


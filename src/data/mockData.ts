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
    mrn: 'PT-001',
    name: 'Emma Wilson',
    age: 28,
    gravidity: 1,
    parity: 0,
    lmp: '2026-01-19',
    edd: '2026-10-26',
    currentGestationalAgeWeeks: 36,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'LOW',
    trajectoryCategory: 'STABLE',
    lastVisitDate: '2026-09-28',
    notes: 'Low-risk stable singleton pregnancy. Longitudinal summary: Growth stable + AFI stable + consistent visits → Stable trajectory. Confident first-time mother.',
    maternalBmi: 22.4
  },
  {
    id: 'pat-002',
    mrn: 'PT-002',
    name: 'Olivia Martinez',
    age: 29,
    gravidity: 2,
    parity: 1,
    lmp: '2026-01-12',
    edd: '2026-10-19',
    currentGestationalAgeWeeks: 34,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'WATCH',
    trajectoryCategory: 'FLUID_DECLINE',
    lastVisitDate: '2026-09-07',
    notes: 'Moderate-risk singleton pregnancy. Key Signal: Progressive AFI decline (14.2 → 12.0 → 9.4 → 7.9 cm). Increasing maternal concern regarding fluid levels.',
    maternalBmi: 26.5
  },
  {
    id: 'pat-003',
    mrn: 'PT-003',
    name: 'Sophia Brown',
    age: 28,
    gravidity: 2,
    parity: 0,
    lmp: '2026-01-12',
    edd: '2026-10-19',
    currentGestationalAgeWeeks: 34,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Alistair Vance, MD',
    status: 'WATCH',
    trajectoryCategory: 'GROWTH_DEVIATION',
    lastVisitDate: '2026-09-07',
    notes: 'Moderate-risk singleton pregnancy. Key Signal: Progressive reduction in growth percentile (48% → 37% → 22% → 11%) despite stable AFI. High maternal concern.',
    maternalBmi: 19.8
  },
  {
    id: 'pat-004',
    mrn: 'PT-004',
    name: 'Isabella Taylor',
    age: 34,
    gravidity: 3,
    parity: 1,
    lmp: '2026-01-05',
    edd: '2026-10-12',
    currentGestationalAgeWeeks: 34,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-002',
    assignedDoctorName: 'Dr. Marcus Reed, MD',
    status: 'HIGH',
    trajectoryCategory: 'ACCELERATED_DECLINE',
    lastVisitDate: '2026-08-31',
    notes: 'High-risk singleton pregnancy. Key Signal: Multi-factor trajectory change (Growth ↓ + AFI ↓ + BP ↑). Gestational hypertension and fetal stress. High emotional stress.',
    maternalBmi: 29.2
  },
  {
    id: 'pat-005',
    mrn: 'PT-005',
    name: 'Amelia Davis',
    age: 31,
    gravidity: 2,
    parity: 1,
    lmp: '2026-01-05',
    edd: '2026-10-12',
    currentGestationalAgeWeeks: 36,
    currentGestationalAgeDays: 0,
    assignedDoctorId: 'doc-002',
    assignedDoctorName: 'Dr. Marcus Reed, MD',
    status: 'WATCH',
    trajectoryCategory: 'FLUID_DECLINE',
    lastVisitDate: '2026-09-07',
    notes: 'Moderate-risk singleton pregnancy. Key Signal: Irregular visits + growth percentile decline + mild AFI decline. Higher uncertainty due to the 8-week gap between scans 2 and 3.',
    maternalBmi: 24.1
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
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 650,
      growthPercentile: 52,
      amnioticFluidIndex_cm: 13.6,
      singleDeepestPocket_cm: 5.1,
      fetalHeartRate_bpm: 146,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 220, ac_mm: 198, fl_mm: 44, bpd_mm: 59 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.94,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-06',
      emotionalState: 'Excited',
      bloodPressure: '116/72 mmHg',
      doctorNotes: 'Excited first-time mother. Stable scan biometry. Normal amniotic fluid volume and cardiac activity.'
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
      growthPercentile: 55,
      amnioticFluidIndex_cm: 13.2,
      singleDeepestPocket_cm: 4.9,
      fetalHeartRate_bpm: 144,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 258, ac_mm: 238, fl_mm: 53, bpd_mm: 72 },
      sourceConfidence: 0.96,
      imageQualityScore: 0.95,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-03',
      emotionalState: 'Reassured',
      bloodPressure: '118/74 mmHg',
      doctorNotes: 'Reassured of normal development. Fetal growth concordant. Fluid volume stable.'
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
      growthPercentile: 53,
      amnioticFluidIndex_cm: 12.8,
      singleDeepestPocket_cm: 4.8,
      fetalHeartRate_bpm: 142,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 295, ac_mm: 278, fl_mm: 62, bpd_mm: 82 },
      sourceConfidence: 0.96,
      imageQualityScore: 0.95,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-31',
      emotionalState: 'Confident',
      bloodPressure: '120/75 mmHg',
      doctorNotes: 'Patient feels confident. Cardiac activity rhythm normal. High-confidence longitudinal stability.'
    },
    {
      id: 'vis-001-4',
      visitId: 'vis-001-4',
      patientId: 'pat-001',
      visitNumber: 4,
      date: '2026-09-28',
      gestationalAgeWeeks: 36,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 2650,
      growthPercentile: 50,
      amnioticFluidIndex_cm: 12.1,
      singleDeepestPocket_cm: 4.6,
      fetalHeartRate_bpm: 143,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 326, ac_mm: 316, fl_mm: 70, bpd_mm: 90 },
      sourceConfidence: 0.97,
      imageQualityScore: 0.96,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-09-28',
      emotionalState: 'Happy / Ready',
      bloodPressure: '118/76 mmHg',
      doctorNotes: 'Patient is happy and ready. Growth remains stable at the 50th percentile. Amniotic fluid index stable at 12.1 cm.'
    }
  ],

  'pat-002': [
    {
      id: 'vis-002-1',
      visitId: 'vis-002-1',
      patientId: 'pat-002',
      visitNumber: 1,
      date: '2026-06-29',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 670,
      growthPercentile: 58,
      amnioticFluidIndex_cm: 14.2,
      singleDeepestPocket_cm: 5.3,
      fetalHeartRate_bpm: 148,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 222, ac_mm: 201, fl_mm: 44, bpd_mm: 60 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-06-29',
      emotionalState: 'Calm',
      bloodPressure: '118/76 mmHg',
      doctorNotes: 'Patient is calm. Baseline amniotic fluid index adequate at 14.2 cm. Normal biometrics.'
    },
    {
      id: 'vis-002-2',
      visitId: 'vis-002-2',
      patientId: 'pat-002',
      visitNumber: 2,
      date: '2026-07-27',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1080,
      growthPercentile: 54,
      amnioticFluidIndex_cm: 12.0,
      singleDeepestPocket_cm: 4.6,
      fetalHeartRate_bpm: 145,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 255, ac_mm: 232, fl_mm: 52, bpd_mm: 71 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-27',
      emotionalState: 'Slightly concerned',
      bloodPressure: '122/78 mmHg',
      doctorNotes: 'AFI decline noted (14.2 to 12.0 cm). Moderate fluid drop. Patient slightly concerned, recommended increased hydration.'
    },
    {
      id: 'vis-002-3',
      visitId: 'vis-002-3',
      patientId: 'pat-002',
      visitNumber: 3,
      date: '2026-08-24',
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1720,
      growthPercentile: 43,
      amnioticFluidIndex_cm: 9.4,
      singleDeepestPocket_cm: 4.2,
      fetalHeartRate_bpm: 142,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 294, ac_mm: 275, fl_mm: 62, bpd_mm: 81 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-24',
      emotionalState: 'Anxious',
      bloodPressure: '124/80 mmHg',
      doctorNotes: 'AFI continued decline to 9.4 cm. Patient is anxious. Recommend weekly non-stress testing (NST) and SDP tracking.'
    },
    {
      id: 'vis-002-4',
      visitId: 'vis-002-4',
      patientId: 'pat-002',
      visitNumber: 4,
      date: '2026-09-07',
      gestationalAgeWeeks: 34,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 2030,
      growthPercentile: 39,
      amnioticFluidIndex_cm: 7.9,
      singleDeepestPocket_cm: 3.7,
      fetalHeartRate_bpm: 141,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 310, ac_mm: 290, fl_mm: 65, bpd_mm: 85 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.90,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-09-07',
      emotionalState: 'Seeking reassurance',
      bloodPressure: '126/82 mmHg',
      doctorNotes: 'AFI dropped below 8.0 cm cutoff (7.9 cm). Progressive fluid trajectory decline. Patient is seeking significant reassurance. Biophysical profile is 8/8.'
    }
  ],

  'pat-003': [
    {
      id: 'vis-003-1',
      visitId: 'vis-003-1',
      patientId: 'pat-003',
      visitNumber: 1,
      date: '2026-06-15',
      gestationalAgeWeeks: 22,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 470,
      growthPercentile: 48,
      amnioticFluidIndex_cm: 13.5,
      singleDeepestPocket_cm: 5.0,
      fetalHeartRate_bpm: 150,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 198, ac_mm: 176, fl_mm: 37, bpd_mm: 53 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-06-15',
      emotionalState: 'Confident',
      bloodPressure: '115/70 mmHg',
      doctorNotes: 'Patient feels confident. Growth is optimal at 48th percentile. Normal amniotic fluid.'
    },
    {
      id: 'vis-003-2',
      visitId: 'vis-003-2',
      patientId: 'pat-003',
      visitNumber: 2,
      date: '2026-07-13',
      gestationalAgeWeeks: 26,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 760,
      growthPercentile: 37,
      amnioticFluidIndex_cm: 13.1,
      singleDeepestPocket_cm: 4.8,
      fetalHeartRate_bpm: 148,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 235, ac_mm: 210, fl_mm: 47, bpd_mm: 65 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-07-13',
      emotionalState: 'Curious',
      bloodPressure: '118/72 mmHg',
      doctorNotes: 'Deceleration in growth velocity from 48th to 37th percentile. Patient is curious. Monitor biometry.'
    },
    {
      id: 'vis-003-3',
      visitId: 'vis-003-3',
      patientId: 'pat-003',
      visitNumber: 3,
      date: '2026-08-10',
      gestationalAgeWeeks: 30,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1250,
      growthPercentile: 22,
      amnioticFluidIndex_cm: 12.6,
      singleDeepestPocket_cm: 4.7,
      fetalHeartRate_bpm: 145,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 278, ac_mm: 251, fl_mm: 56, bpd_mm: 76 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-08-10',
      emotionalState: 'Worried',
      bloodPressure: '120/75 mmHg',
      doctorNotes: 'Fetal growth percentile decelerated further to 22nd percentile. Patient is worried. Advise nutritional review and Doppler evaluation.'
    },
    {
      id: 'vis-003-4',
      visitId: 'vis-003-4',
      patientId: 'pat-003',
      visitNumber: 4,
      date: '2026-09-07',
      gestationalAgeWeeks: 34,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1850,
      growthPercentile: 11,
      amnioticFluidIndex_cm: 11.8,
      singleDeepestPocket_cm: 4.5,
      fetalHeartRate_bpm: 143,
      presentation: 'cephalic',
      placentaLocation: 'anterior',
      biometrics: { hc_mm: 310, ac_mm: 274, fl_mm: 65, bpd_mm: 86 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Vance',
      reviewedAt: '2026-09-07',
      emotionalState: 'Highly concerned',
      bloodPressure: '122/76 mmHg',
      doctorNotes: 'Growth percentile has plummeted to 11th percentile (borderline FGR). AFI remains stable at 11.8 cm. Patient is highly concerned. Doppler indices (UA PI, MCA PI) normal.'
    }
  ],

  'pat-004': [
    {
      id: 'vis-004-1',
      visitId: 'vis-004-1',
      patientId: 'pat-004',
      visitNumber: 1,
      date: '2026-06-22',
      gestationalAgeWeeks: 24,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 620,
      growthPercentile: 45,
      amnioticFluidIndex_cm: 13.8,
      singleDeepestPocket_cm: 5.2,
      fetalHeartRate_bpm: 147,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 220, ac_mm: 196, fl_mm: 43, bpd_mm: 60 },
      sourceConfidence: 0.92,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-06-22',
      emotionalState: 'Reassured',
      bloodPressure: '124/78 mmHg',
      doctorNotes: 'Patient feels reassured. Normal baseline. Growth at 45th percentile and AFI stable.'
    },
    {
      id: 'vis-004-2',
      visitId: 'vis-004-2',
      patientId: 'pat-004',
      visitNumber: 2,
      date: '2026-07-20',
      gestationalAgeWeeks: 28,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 930,
      growthPercentile: 32,
      amnioticFluidIndex_cm: 11.5,
      singleDeepestPocket_cm: 4.4,
      fetalHeartRate_bpm: 144,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 253, ac_mm: 228, fl_mm: 51, bpd_mm: 70 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-07-20',
      emotionalState: 'Concerned',
      bloodPressure: '132/84 mmHg',
      doctorNotes: 'Patient is concerned. Borderline gestational hypertension (BP 132/84 mmHg). Fetal growth decelerating to 32nd percentile. Initiated low-dose aspirin prophylaxis.'
    },
    {
      id: 'vis-004-3',
      visitId: 'vis-004-3',
      patientId: 'pat-004',
      visitNumber: 3,
      date: '2026-08-17',
      gestationalAgeWeeks: 32,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1420,
      growthPercentile: 18,
      amnioticFluidIndex_cm: 9.1,
      singleDeepestPocket_cm: 3.9,
      fetalHeartRate_bpm: 141,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 290, ac_mm: 262, fl_mm: 60, bpd_mm: 80 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-08-17',
      emotionalState: 'Stressed',
      bloodPressure: '142/90 mmHg',
      doctorNotes: 'Patient is highly stressed. BP increased to 142/90 mmHg. Growth percentile dropped to 18th, and AFI to 9.1 cm. Commenced oral Labetalol for hypertension.'
    },
    {
      id: 'vis-004-4',
      visitId: 'vis-004-4',
      patientId: 'pat-004',
      visitNumber: 4,
      date: '2026-08-31',
      gestationalAgeWeeks: 34,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1670,
      growthPercentile: 9,
      amnioticFluidIndex_cm: 7.6,
      singleDeepestPocket_cm: 3.5,
      fetalHeartRate_bpm: 139,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 303, ac_mm: 268, fl_mm: 65, bpd_mm: 83 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.92,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-08-31',
      emotionalState: 'Fearful / Seeking support',
      bloodPressure: '148/94 mmHg',
      doctorNotes: 'AFI is now 7.6 cm (oligohydramnios trend) and EFW percentile plummeted to 9th (Fetal Growth Restriction). Maternal BP 148/94 mmHg. Multiple high-risk factors. Patient is fearful and seeking support.'
    }
  ],

  'pat-005': [
    {
      id: 'vis-005-1',
      visitId: 'vis-005-1',
      patientId: 'pat-005',
      visitNumber: 1,
      date: '2026-05-18',
      gestationalAgeWeeks: 20,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 360,
      growthPercentile: 50,
      amnioticFluidIndex_cm: 13.4,
      singleDeepestPocket_cm: 5.0,
      fetalHeartRate_bpm: 151,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 180, ac_mm: 154, fl_mm: 33, bpd_mm: 48 },
      sourceConfidence: 0.95,
      imageQualityScore: 0.93,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-05-18',
      emotionalState: 'Positive',
      bloodPressure: '114/70 mmHg',
      doctorNotes: 'Patient is positive. Normal baseline at 20 weeks anatomy scan.'
    },
    {
      id: 'vis-005-2',
      visitId: 'vis-005-2',
      patientId: 'pat-005',
      visitNumber: 2,
      date: '2026-06-22',
      gestationalAgeWeeks: 25,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 700,
      growthPercentile: 48,
      amnioticFluidIndex_cm: 12.9,
      singleDeepestPocket_cm: 4.8,
      fetalHeartRate_bpm: 148,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 228, ac_mm: 202, fl_mm: 45, bpd_mm: 62 },
      sourceConfidence: 0.94,
      imageQualityScore: 0.91,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-06-22',
      emotionalState: 'Busy / Overwhelmed',
      bloodPressure: '116/72 mmHg',
      doctorNotes: 'Patient feels busy and overwhelmed. Growth is stable. Re-scheduled next follow-up.'
    },
    {
      id: 'vis-005-3',
      visitId: 'vis-005-3',
      patientId: 'pat-005',
      visitNumber: 3,
      date: '2026-08-17',
      gestationalAgeWeeks: 33,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 1780,
      growthPercentile: 29,
      amnioticFluidIndex_cm: 10.2,
      singleDeepestPocket_cm: 4.2,
      fetalHeartRate_bpm: 143,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 300, ac_mm: 275, fl_mm: 62, bpd_mm: 82 },
      sourceConfidence: 0.92,
      imageQualityScore: 0.89,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-08-17',
      emotionalState: 'Guilty / Worried',
      bloodPressure: '120/75 mmHg',
      doctorNotes: 'Significant 8-week gap since last scan (25w to 33w). Patient feels guilty and worried. Deceleration in fetal growth percentile to 29% and AFI to 10.2 cm. Higher uncertainty due to the missing serial datapoints.'
    },
    {
      id: 'vis-005-4',
      visitId: 'vis-005-4',
      patientId: 'pat-005',
      visitNumber: 4,
      date: '2026-09-07',
      gestationalAgeWeeks: 36,
      gestationalAgeDays: 0,
      estimatedFetalWeight_g: 2180,
      growthPercentile: 24,
      amnioticFluidIndex_cm: 9.5,
      singleDeepestPocket_cm: 4.0,
      fetalHeartRate_bpm: 140,
      presentation: 'cephalic',
      placentaLocation: 'posterior',
      biometrics: { hc_mm: 322, ac_mm: 300, fl_mm: 68, bpd_mm: 88 },
      sourceConfidence: 0.93,
      imageQualityScore: 0.90,
      doctorReviewStatus: 'accepted',
      reviewedBy: 'Dr. Reed',
      reviewedAt: '2026-09-07',
      emotionalState: 'Seeking reassurance',
      bloodPressure: '118/74 mmHg',
      doctorNotes: 'Short 3-week follow-up. Fetal growth percentile has settled at 24th, with a stable fluid index at 9.5 cm. High clinical uncertainty remains from the prior gap. Reassure patient.'
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
    medicationName: 'Prenatal Vitamin + Folic Acid',
    activeIngredient: 'Multivitamin, Folic Acid',
    dose: '1 tablet',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-03-01',
    gestationalAgeStartWeeks: 6,
    trimester: '1st',
    indication: 'Routine prenatal nutritional supplementation',
    maternalCondition: 'Healthy pregnancy',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-002',
    patientId: 'pat-001',
    medicationName: 'Ferrous Sulfate',
    activeIngredient: 'Iron',
    dose: '325 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-08-31',
    gestationalAgeStartWeeks: 32,
    trimester: '3rd',
    indication: 'Anemia prevention and hemoglobulin support',
    maternalCondition: 'Hemodilution',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-003',
    patientId: 'pat-002',
    medicationName: 'Prenatal Vitamin',
    activeIngredient: 'Multivitamin',
    dose: '1 tablet',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-02-15',
    gestationalAgeStartWeeks: 8,
    trimester: '1st',
    indication: 'Routine fetal development support',
    maternalCondition: 'Healthy pregnancy',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-004',
    patientId: 'pat-002',
    medicationName: 'Calcium Carbonate',
    activeIngredient: 'Calcium',
    dose: '500 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-07-27',
    gestationalAgeStartWeeks: 28,
    trimester: '2nd',
    indication: 'Bone density and fluid balance support',
    maternalCondition: 'Reducing amniotic fluid risk support',
    exposureStatus: 'current',
    source: 'report'
  },
  {
    id: 'med-005',
    patientId: 'pat-003',
    medicationName: 'Prenatal Multivitamin',
    activeIngredient: 'Multivitamin',
    dose: '1 tablet',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-02-20',
    gestationalAgeStartWeeks: 8,
    trimester: '1st',
    indication: 'Dietary supplement',
    maternalCondition: 'Routine pregnancy care',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-006',
    patientId: 'pat-003',
    medicationName: 'Ferrous Gluconate',
    activeIngredient: 'Iron',
    dose: '324 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-07-13',
    gestationalAgeStartWeeks: 26,
    trimester: '2nd',
    indication: 'Iron deficiency prophylaxis',
    maternalCondition: 'Fetal growth monitoring support',
    exposureStatus: 'current',
    source: 'report'
  },
  {
    id: 'med-007',
    patientId: 'pat-004',
    medicationName: 'Low-Dose Aspirin',
    activeIngredient: 'Aspirin',
    dose: '81 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-07-20',
    gestationalAgeStartWeeks: 28,
    trimester: '2nd',
    indication: 'Preeclampsia prophylaxis',
    maternalCondition: 'Gestational Hypertension and elevated risk',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-008',
    patientId: 'pat-004',
    medicationName: 'Labetalol Hydrochloride',
    activeIngredient: 'Labetalol',
    dose: '100 mg',
    route: 'Oral',
    frequency: 'Twice daily',
    startDate: '2026-08-17',
    gestationalAgeStartWeeks: 32,
    trimester: '3rd',
    indication: 'Hypertensive crisis prevention and pressure control',
    maternalCondition: 'Gestational Hypertension',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-009',
    patientId: 'pat-005',
    medicationName: 'Prenatal Vitamins',
    activeIngredient: 'Multivitamin',
    dose: '1 tablet',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-02-10',
    gestationalAgeStartWeeks: 8,
    trimester: '1st',
    indication: 'Fetal nutrition and neural tube development support',
    maternalCondition: 'Routine pregnancy',
    exposureStatus: 'current',
    source: 'prescription'
  },
  {
    id: 'med-010',
    patientId: 'pat-005',
    medicationName: 'Ferrous Sulfate',
    activeIngredient: 'Iron',
    dose: '325 mg',
    route: 'Oral',
    frequency: 'Once daily',
    startDate: '2026-06-22',
    gestationalAgeStartWeeks: 25,
    trimester: '2nd',
    indication: 'Red blood cell counts support',
    maternalCondition: 'Pregnancy',
    exposureStatus: 'current',
    source: 'prescription'
  }
];


/**
 * PregnancyTwin AI - Types & Data Models
 * Full schema for Longitudinal Pregnancy Digital Twin & Decision Support Platform
 */

export type UserRole = 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospital: string;
  specialty?: string;
  avatarUrl?: string;
}

export type TrajectoryCategory = 'STABLE' | 'FLUID_DECLINE' | 'GROWTH_DEVIATION' | 'ACCELERATED_DECLINE';
export type RiskLevel = 'LOW' | 'WATCH' | 'HIGH';
export type MeasurementStatus = 'pending' | 'accepted' | 'edited' | 'rejected';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  age: number;
  gravidity: number;
  parity: number;
  lmp: string; // Last Menstrual Period
  edd: string; // Estimated Date of Delivery
  currentGestationalAgeWeeks: number;
  currentGestationalAgeDays: number;
  assignedDoctorId: string;
  assignedDoctorName: string;
  status: RiskLevel;
  trajectoryCategory: TrajectoryCategory;
  lastVisitDate: string;
  notes?: string;
  maternalBmi?: number; // Maternal Body Mass Index (BMI) as a critical covariate for FGR risk
}

export type GrowthStandard = 'HADLOCK' | 'INTERGROWTH_21ST' | 'WHO';

export interface DopplerMeasurements {
  umbilicalArteryPi?: number; // Umbilical Artery Pulsatility Index (normal ~0.8 - 1.2 in 3rd tri)
  umbilicalArteryRi?: number; // Umbilical Artery Resistive Index
  middleCerebralArteryPi?: number; // MCA PI
  cerebroplacentalRatio?: number; // CPR = MCA PI / UA PI (normal >= 1.08)
  cprStatus?: 'normal' | 'brain_sparing' | 'critical';
}

export interface BiophysicalProfile {
  fetalBreathing: boolean; // >= 1 episode >= 30 sec (2 pts)
  grossBodyMovement: boolean; // >= 3 discrete movements (2 pts)
  fetalTone: boolean; // >= 1 episode extension with return to flexion (2 pts)
  amnioticFluidVolume: boolean; // >= 1 pocket >= 2x1 cm (2 pts)
  reactiveNst: boolean; // >= 2 accelerations >= 15 bpm for 15s in 20 min (2 pts)
  totalBppScore: number; // 0 - 10
  interpretation: 'normal' | 'equivocal' | 'abnormal';
}

export interface BiometricMeasurements {
  hc_mm?: number; // Head Circumference
  ac_mm?: number; // Abdominal Circumference
  fl_mm?: number; // Femur Length
  bpd_mm?: number; // Biparietal Diameter
  ofd_mm?: number; // Occipitofrontal Diameter
}

export interface VisitMeasurement {
  id: string;
  visitId: string;
  patientId: string;
  visitNumber: number;
  date: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  
  // Primary Metrics
  estimatedFetalWeight_g: number;
  growthPercentile: number;
  amnioticFluidIndex_cm: number; // AFI (cm)
  singleDeepestPocket_cm: number; // SDP / MVP (cm)
  fetalHeartRate_bpm: number;
  presentation: 'cephalic' | 'breech' | 'transverse' | 'variable';
  placentaLocation: 'anterior' | 'posterior' | 'fundal' | 'low-lying';
  
  biometrics: BiometricMeasurements;
  doppler?: DopplerMeasurements;
  bpp?: BiophysicalProfile;
  growthStandardUsed?: GrowthStandard;
  
  // Data extraction metadata
  sourceConfidence: number; // 0.0 - 1.0
  imageQualityScore?: number; // 0.0 - 1.0
  doctorReviewStatus: MeasurementStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  doctorNotes?: string;
  isUserInputted?: boolean;
  emotionalState?: string;
  bloodPressure?: string;
  
  // Algorithmic Kalman Filter outputs
  kalmanAfi?: number;
  kalmanPercentile?: number;
}

export interface UltrasoundReport {
  id: string;
  patientId: string;
  visitId: string;
  reportText: string;
  imageUrl?: string;
  imagePlane?: 'transverse_abdomen' | 'biparietal_diameter' | 'amniotic_pocket' | 'femur_diaphysis';
  imageQualityAssessment?: {
    quality: 'good' | 'adequate' | 'suboptimal';
    score: number;
    issuesDetected: string[];
  };
  extractedJson: Partial<VisitMeasurement>;
  uploadedAt: string;
}

export interface SyntheticLongitudinalRecord {
  patient_id: string;
  visit_number: number;
  visit_date: string;
  gestational_age: string;
  gestational_age_weeks: number;
  maternal_age: number;
  gravidity: number;
  parity: number;
  hc_mm: number;
  ac_mm: number;
  fl_mm: number;
  bpd_mm: number;
  efw_g: number;
  afi_cm: number;
  sdp_cm: number;
  fhr_bpm: number;
  growth_percentile: number;
  fluid_percentile: number;
  previous_efw_g?: number;
  previous_afi_cm?: number;
  growth_velocity_g_per_week?: number;
  fluid_velocity_cm_per_week?: number;
  trajectory_score: number;
  risk_state: 'Stable' | 'Monitor' | 'Attention';
}

export interface TrajectoryVelocity {
  afiVelocity_cmPerWeek: number; // ΔAFI / Δt
  growthVelocity_percentilePerWeek: number; // ΔGrowth% / Δt
  efwVelocity_gPerWeek: number;
  afiAcceleration_cmPerWeekSq: number; // Second derivative
  hcVelocity_mmPerWeek?: number;
  acVelocity_mmPerWeek?: number;
  hcAcRatioVelocity_perWeek?: number;
}

export interface TrajectoryScore {
  overallScore: number; // 0 - 100
  growthScore: number; // 0 - 100
  fluidScore: number; // 0 - 100
  trendScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  isResearchPrototype: boolean;
}

export interface ContributingFactor {
  label: string;
  direction: 'down' | 'up' | 'neutral';
  impact: 'high' | 'moderate' | 'low';
}

export interface IugrClassification {
  type: 'symmetrical' | 'asymmetrical' | 'none';
  confidence: number; // 0 - 100
  hcAcRatio?: number;
  description?: string;
}

export interface KalmanFilterRecord {
  noiseDampened: boolean;
  rawAfi: number;
  filteredAfi: number;
  rawGrowth: number;
  filteredGrowth: number;
  falseAlarmsSuppressed: boolean;
  suppressionDetails?: string;
}

export interface WhyNowAlert {
  triggered: boolean;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  summary: string;
  reasons: string[];
  afiDeltaText: string;
  growthDeltaText: string;
  consecutiveDropsCount: number;
  confidence: number;
  baselineDeviation_cm: number;
  primaryContributor: 'Fluid Trajectory' | 'Growth Trajectory' | 'Combined Dynamics';
  contributingFactors?: ContributingFactor[];
  recommendedAction?: string;
  sdpSequenceText?: string;
  iugrClassification?: IugrClassification;
  kalmanFilterRecord?: KalmanFilterRecord;
}

export interface NextVisitForecast {
  expectedGaWeeks: number;
  expectedAfiRange: [number, number]; // [min, max]
  expectedGrowthPercentileRange: [number, number];
  expectedEfwRange_g: [number, number];
  predictedTrajectory: 'STABLE' | 'DECLINING' | 'RECOVERING';
  forecastConfidence: number; // 0 - 100%
  disclaimer: string;
}

export interface MedicationExposure {
  id: string;
  patientId: string;
  medicationName: string;
  activeIngredient?: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  stopDate?: string;
  gestationalAgeStartWeeks: number;
  gestationalAgeStopWeeks?: number;
  trimester: '1st' | '2nd' | '3rd' | 'all';
  indication: string;
  maternalCondition: string;
  exposureStatus: 'current' | 'past';
  source: 'prescription' | 'report' | 'patient history';
  confidence?: 'Verified' | 'Extracted' | 'Patient-entered';
  prescriber?: string;
}

export interface PregnancyDigitalTwin {
  patient: Patient;
  visits: VisitMeasurement[];
  currentVisit: VisitMeasurement;
  previousVisit?: VisitMeasurement;
  medications: MedicationExposure[]; // Longitudinal medication exposure history
  
  // Baseline curves
  personalAfiBaseline: { ga: number; expectedAfi: number }[];
  personalGrowthBaseline: { ga: number; expectedEfw: number }[];
  
  // Derived Intelligence
  velocities: TrajectoryVelocity;
  trajectoryScore: TrajectoryScore;
  whyNow: WhyNowAlert;
  forecast: NextVisitForecast;
  
  riskFactors: {
    factor: string;
    weight: number;
    description: string;
    direction: 'negative' | 'neutral' | 'positive';
  }[];
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  gestationalAge: string;
  severity: 'critical' | 'warning' | 'info';
  category: TrajectoryCategory;
  title: string;
  details: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  patientId?: string;
  patientName?: string;
  performedByName?: string;
  details: string;
}

export type AuditLogEntry = AuditLog;

export interface ClinicalGuideline {
  id: string;
  title: string;
  organization: 'ISUOG' | 'ACOG' | 'SMFM' | 'WHO' | 'Nature Scientific Reports' | 'SIH Clinical AI Working Group';
  category: 'Amniotic Fluid' | 'Fetal Growth Restriction' | 'Biometry' | 'Doppler' | 'Ultrasound Biometry & CV' | 'Digital Twin & Trajectory';
  summary: string;
  keyThresholds: string[];
  referenceUrl?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  functionCalled?: string;
  functionResult?: any;
  sourcesGrounded?: string[];
  confidence?: number;
  multilingual?: {
    language: string;
    translatedContent: string;
  };
}

export type AppTab = 'home' | 'clinical' | 'live-input' | 'analytics' | 'simulation' | 'records' | 'settings' | 'research' | 'admin' | 'medications';

export interface UltrasoundCalibration {
  calibration_method: string;
  pixel_spacing: number;
  pixels_per_mm?: number;
  known_distance_mm?: number;
  pixel_distance?: number;
  scale_source?: string;
  available: boolean;
  last_calibrated_at?: string;
  reference_points?: {
    point1: [number, number];
    point2: [number, number];
    delta_x_px?: number;
    delta_y_px?: number;
  };
}

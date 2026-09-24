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

  // PLAN 1: Maternal Baseline Model representation
  maternalBaseline?: MaternalBaselineOutput;
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

export interface RiskNotificationData {
  patient: Patient;
  newVisit: VisitMeasurement;
  previousVisit?: VisitMeasurement;
  trajectoryCategory: TrajectoryCategory;
  riskLevel: RiskLevel;
  trajectoryScore?: TrajectoryScore;
  whyNow?: WhyNowAlert;
  velocities?: TrajectoryVelocity;
  detectedAt?: string;
  sourceScanName?: string;
  clinicalActions?: string[];
}

export interface UltrasoundQualityResult {
  success: boolean;
  model_name: string;
  model_version: string;
  quality_class: 'GOOD' | 'REVIEW' | 'POOR';
  quality_score: number;
  proceed: boolean;
  decision: 'PROCEED' | 'HUMAN_REVIEW' | 'STOP_RECAPTURE';
  quality_reason: string;
  next_stage: string;
  technical_metrics: {
    sharpness: number;
    contrast: number;
    brightness: number;
    snr_db: number;
    artifact_level: 'none' | 'minimal' | 'moderate' | 'severe';
    anatomical_visibility: 'adequate' | 'suboptimal' | 'insufficient';
  };
  thresholds: {
    good: number;
    review: number;
  };
}

// ============================================================
// MODEL 2: ULTRASOUND VIEW / PLANE CLASSIFICATION AI TYPES
// (Swin Transformer Hierarchical Vision Pipeline)
// ============================================================

export type UltrasoundViewClass = 'HEAD' | 'ABDOMEN' | 'FEMUR' | 'OTHER' | 'UNKNOWN';

export interface UltrasoundViewPrediction {
  view: UltrasoundViewClass;
  confidence: number;
  label: string;
}

export interface UltrasoundViewResult {
  success: boolean;
  model_name: string;
  model_version: string;
  view_class: UltrasoundViewClass;
  confidence: number;
  is_uncertain: boolean;
  uncertainty_threshold: number;
  downstream_route: string;
  downstream_model: 'HEAD_UNET' | 'ABDOMEN_UNET' | 'FEMUR_UNET' | 'NONE' | 'MANUAL_REVIEW';
  target_biometrics: string[];
  anatomical_plane_description: string;
  top3: UltrasoundViewPrediction[];
  all_probabilities: Record<UltrasoundViewClass, number>;
  swin_features?: {
    patch_resolution: string;
    window_stages: number;
    hierarchical_levels: number;
    embedding_dimension: number;
    attention_focus_area: string;
  };
}

// ============================================================
// MODEL 3: FETAL HEAD SEGMENTATION AI (U-Net / nnU-Net) & MEASUREMENT ENGINE
// ============================================================

export interface HeadSegmentationQualityControl {
  status: 'ACCEPT' | 'REVIEW' | 'REJECT';
  contour_continuity: number; // 0.0 - 1.0 (e.g. 0.96)
  mask_area_ratio: number;     // e.g. 0.28 of ROI
  plausibility_check: 'PASSED' | 'BORDERLINE' | 'FAILED';
  reasons: string[];
}

export interface FetalHeadContourPoint {
  x: number;
  y: number;
}

export interface FetalHeadEllipseFit {
  center_x: number;
  center_y: number;
  semi_major_axis_px: number;
  semi_minor_axis_px: number;
  angle_deg: number;
  rmse_pixels: number;
}

export interface UltrasoundHeadSegmentationResult {
  model: 'head_segmentation';
  model_name: string;
  model_version: string;
  architecture: 'U-Net' | 'nnU-Net';
  status: 'success' | 'failed' | 'model_not_deployed';
  segmentation_available: boolean;
  segmentation_confidence: number; // e.g. 0.942
  mask_svg_path?: string;          // SVG contour path for crisp vector rendering
  mask_base64?: string;
  contour_points?: FetalHeadContourPoint[];
  ellipse_fit?: FetalHeadEllipseFit;
  quality_control: HeadSegmentationQualityControl;
  metrics: {
    dice_score: number;
    iou_score: number;
    precision: number;
    recall: number;
  };
  inference_time_ms: number;
}

export interface UltrasoundHeadMeasurementResult {
  HC_mm: number;
  BPD_mm: number;
  OFD_mm: number;
  measurement_confidence: number;
  segmentation_confidence: number;
  calibration_verified: boolean;
  calibration_scale_mm_per_px: number;
  clinician_verification_required: boolean;
  fit_residuals_rms: number;
  outlier_check: {
    is_outlier: boolean;
    gestational_age_weeks?: number;
    expected_hc_mm?: number;
    z_score?: number;
    status: 'NORMAL_RANGE' | 'MILD_DISCREPANCY' | 'OUTLIER_FLAGGED';
  };
  caliper_endpoints: {
    bpd_p1: [number, number];
    bpd_p2: [number, number];
    ofd_p1: [number, number];
    ofd_p2: [number, number];
  };
  measured_at: string;
}

// ============================================================
// MODEL 4: FETAL ABDOMEN SEGMENTATION AI & AC MEASUREMENT TYPES
// ============================================================

export interface FetalAbdomenContourPoint {
  x: number;
  y: number;
}

export interface FetalAbdomenEllipseFit {
  center_x: number;
  center_y: number;
  semi_major_axis_px: number; // anteroposterior or transverse semi-axis
  semi_minor_axis_px: number;
  angle_deg: number;
  circularity_index: number;  // 0.0 - 1.0 (ideal abdomen is ~0.90 - 0.98 round)
  rmse_pixels: number;
}

export interface AbdomenSegmentationQualityControl {
  status: 'PASS' | 'REVIEW' | 'FAIL';
  contour_continuity: number; // 0.0 - 1.0 (threshold >= 0.88 for PASS)
  mask_area_ratio: number;    // expected 0.20 - 0.40 of scan ROI
  circularity_score: number;  // assesses non-deformed abdominal perimeter
  stomach_bubble_detected?: boolean;
  portal_vein_detected?: boolean;
  plausibility_check: 'PASSED' | 'BORDERLINE' | 'FAILED';
  reasons: string[];
}

export interface UltrasoundAbdomenSegmentationResult {
  model: 'fetal_abdomen_segmentation';
  model_name: string;
  model_version: string;
  architecture: 'U-Net' | 'nnU-Net' | 'Attention U-Net';
  status: 'success' | 'failed' | 'model_not_deployed';
  segmentation_available: boolean;
  segmentation_confidence: number; // e.g. 0.938
  mask_svg_path?: string;          // SVG polygon path for crisp vector rendering
  mask_base64?: string;
  contour_points?: FetalAbdomenContourPoint[];
  ellipse_fit?: FetalAbdomenEllipseFit;
  quality_control: AbdomenSegmentationQualityControl;
  metrics: {
    dice_score: number;
    iou_score: number;
    precision: number;
    recall: number;
    hausdorff_distance_95_mm?: number;
  };
  inference_time_ms: number;
}

export interface UltrasoundAbdomenMeasurementResult {
  AC_mm: number;
  measurement_confidence: number;
  segmentation_confidence: number;
  calibration_verified: boolean;
  calibration_scale_mm_per_px: number;
  clinician_verification_required: boolean;
  fit_residuals_rms: number;
  outlier_check: {
    is_outlier: boolean;
    gestational_age_weeks?: number;
    expected_ac_mm?: number;
    z_score?: number;
    status: 'NORMAL_RANGE' | 'MILD_DISCREPANCY' | 'OUTLIER_FLAGGED';
  };
  caliper_axes?: {
    ap_p1: [number, number]; // Anteroposterior diameter points
    ap_p2: [number, number];
    trans_p1: [number, number]; // Transverse abdominal diameter points
    trans_p2: [number, number];
  };
  measured_at: string;
}

// ============================================================
// MODEL 5: FETAL FEMUR SEGMENTATION AI & FL MEASUREMENT TYPES
// ============================================================

export interface FetalFemurContourPoint {
  x: number;
  y: number;
}

export interface FetalFemurLongAxis {
  center_x: number;
  center_y: number;
  length_pixels: number;
  angle_deg: number;
  aspect_ratio: number;
  pca_explained_variance_ratio: number;
  endpoint_a: [number, number]; // Proximal diaphysis endpoint
  endpoint_b: [number, number]; // Distal diaphysis endpoint
}

export interface FemurSegmentationQualityControl {
  status: 'PASS' | 'REVIEW' | 'FAIL';
  contour_continuity: number;
  aspect_ratio: number;
  acoustic_shadow_detected: boolean;
  blunt_diaphysis_ends: boolean;
  plausibility_check: 'PASSED' | 'BORDERLINE' | 'FAILED';
  reasons: string[];
}

export interface UltrasoundFemurSegmentationResult {
  model: 'fetal_femur_segmentation';
  model_name: string;
  model_version: string;
  architecture: 'U-Net' | 'nnU-Net' | 'Attention U-Net';
  status: 'success' | 'failed' | 'model_not_deployed';
  segmentation_available: boolean;
  segmentation_confidence: number; // e.g. 0.946
  mask_svg_path?: string;          // SVG polygon path for vector mask
  centerline_svg_path?: string;    // SVG dashed centerline path
  contour_points?: FetalFemurContourPoint[];
  long_axis?: FetalFemurLongAxis;
  quality_control: FemurSegmentationQualityControl;
  metrics: {
    dice_score: number;
    iou_score: number;
    precision: number;
    recall: number;
    hausdorff_distance_95_mm?: number;
  };
  inference_time_ms: number;
}

export interface UltrasoundFemurMeasurementResult {
  FL_mm: number;
  measurement_confidence: number;
  segmentation_confidence: number;
  calibration_verified: boolean;
  calibration_scale_mm_per_px: number;
  clinician_verification_required: boolean;
  length_pixels: number;
  caliper_endpoints: {
    endpoint_a: [number, number];
    endpoint_b: [number, number];
  };
  outlier_check: {
    is_outlier: boolean;
    gestational_age_weeks?: number;
    expected_fl_mm?: number;
    z_score?: number;
    status: 'NORMAL_RANGE' | 'MILD_DISCREPANCY' | 'OUTLIER_FLAGGED';
  };
  measured_at: string;
}

// ============================================================
// MODEL 6: AUTOMATED FETAL BIOMETRY MEASUREMENT & CALIBRATION ENGINE
// ============================================================

export type MeasurementReviewStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'EDITED' | 'REJECTED';

export interface BiometryAuditEntry {
  measurement_id: string;
  patient_id: string;
  visit_id?: string;
  biometric_param: 'HC' | 'BPD' | 'OFD' | 'AC' | 'FL' | 'ALL';
  ai_value_mm: number;
  final_value_mm: number;
  status: MeasurementReviewStatus;
  reviewed_by: string;
  user_role?: string;
  notes?: string;
  timestamp: string;
}

export interface BiometryValidationReport {
  qc_status: 'PASS' | 'PASS_WITH_WARNING' | 'REVIEW_REQUIRED' | 'FAIL';
  review_recommendation: 'READY_FOR_COMMISSION' | 'NORMAL_MONITORING' | 'CLINICIAN_REVIEW_ADVISED' | 'RECALIBRATION_REQUIRED';
  z_scores: {
    HC_z?: number;
    AC_z?: number;
    FL_z?: number;
    BPD_z?: number;
    OFD_z?: number;
  };
  hc_ac_ratio?: number;
  plausibility_flags: string[];
  is_plausible: boolean;
}

export interface UnifiedBiometryMeasurementResult {
  model: 'model_6_biometry_measurement_engine';
  view_evaluated: 'HEAD' | 'ABDOMEN' | 'FEMUR' | 'MULTI_VIEW' | 'UNKNOWN';
  ultrasound_measurements: {
    HC_mm: number | null;
    BPD_mm: number | null;
    OFD_mm: number | null;
    AC_mm: number | null;
    FL_mm: number | null;
  };
  calibration: {
    is_valid: boolean;
    status: 'VALID' | 'CALIBRATION_REQUIRED' | 'SCALE_OUT_OF_BOUNDS';
    message: string;
    scale_x: number | null;
    scale_y: number | null;
    mean_scale: number | null;
    is_anisotropic: boolean;
  };
  validation: BiometryValidationReport;
  geometric_consistency?: {
    is_consistent: boolean;
    discrepancy_pct: number;
    status: string;
  };
  quality: {
    calibration_status: string;
    measurement_qc: string;
    measurement_confidence: number; // 0.0 - 1.0
  };
  review: {
    status: MeasurementReviewStatus;
    recommendation: string;
    clinician_notes?: string;
    verified_at?: string;
  };
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

// ============================================================
// MODEL 7: EFW & FETAL GROWTH ENGINE TYPES
// ============================================================

export type EFWFormulaType = 'HADLOCK_4_PARAM' | 'HADLOCK_3_PARAM' | 'HADLOCK_AC_FL' | 'INTERGROWTH_21ST' | 'WHO_FORMULA';
export type GrowthReferenceStandard = 'HADLOCK_1991' | 'INTERGROWTH_21ST' | 'WHO_FETAL_GROWTH';
export type TrajectoryDirection = 'STABLE' | 'INCREASING' | 'DECLINING' | 'RAPID_DECLINE' | 'ACCELERATING' | 'RECOVERING';

export interface Model7GrowthVisitInput {
  visit_id?: string;
  visit_date?: string;
  gestational_age_days: number;
  gestational_age_weeks: number;
  HC_mm?: number;
  AC_mm?: number;
  FL_mm?: number;
  BPD_mm?: number;
  OFD_mm?: number;
  EFW_g?: number;
  growth_percentile?: number;
  quality_score?: number;
  clinician_verified?: boolean;
}

export interface Model7EFWResult {
  value_g: number;
  formula: EFWFormulaType;
  formula_name: string;
  version: string;
  status: 'CALCULATED' | 'MISSING_MEASUREMENTS' | 'UNRELIABLE';
  uncertainty_pct: number; // e.g. ±7.5%
  confidence_interval_g: [number, number];
  measurements_used: {
    HC_mm?: number;
    AC_mm?: number;
    FL_mm?: number;
    BPD_mm?: number;
    OFD_mm?: number;
  };
}

export interface Model7GrowthPercentileResult {
  percentile: number;
  z_score: number;
  reference_standard: GrowthReferenceStandard;
  reference_mean_g: number;
  reference_sd_g: number;
  centile_category: 'FGR_SUSPECTED' | 'SMALL_FOR_GESTATIONAL_AGE' | 'APPROPRIATE_FOR_GESTATIONAL_AGE' | 'LARGE_FOR_GESTATIONAL_AGE';
  reference_5th_g: number;
  reference_10th_g: number;
  reference_50th_g: number;
  reference_90th_g: number;
  reference_95th_g: number;
}

export interface Model7TrajectoryResult {
  time_gap_days: number;
  efw_change_g: number;
  efw_percent_change: number;
  efw_velocity_g_per_day: number;
  efw_velocity_g_per_week: number;
  efw_acceleration_g_per_week2: number;
  hc_velocity_mm_per_week: number;
  ac_velocity_mm_per_week: number;
  fl_velocity_mm_per_week: number;
  growth_percentile_delta: number;
  growth_percentile_velocity_per_week: number;
  trajectory_direction: TrajectoryDirection;
  consecutive_declining_visits: number;
  rolling_efw_mean_g: number;
  rolling_efw_velocity_g_per_week: number;
  rolling_percentile_mean: number;
  growth_pattern_summary: string;
}

export interface Model7CompleteGrowthOutput {
  model: 'model_7_efw_growth_engine';
  patient_id?: string;
  evaluated_at: string;
  inputs: {
    gestational_age_days: number;
    gestational_age_weeks: number;
    HC_mm?: number;
    AC_mm?: number;
    FL_mm?: number;
    BPD_mm?: number;
    OFD_mm?: number;
    calibration_status?: string;
    clinician_verified?: boolean;
  };
  efw: Model7EFWResult;
  growth: Model7GrowthPercentileResult;
  trajectory: Model7TrajectoryResult;
  longitudinal_feature_vector: {
    EFW_g: number;
    growth_percentile: number;
    EFW_delta_g: number;
    EFW_percent_change: number;
    EFW_velocity: number;
    EFW_acceleration: number;
    HC_velocity: number;
    AC_velocity: number;
    FL_velocity: number;
    growth_percentile_delta: number;
    growth_percentile_velocity: number;
    trajectory_direction_encoded: number;
    consecutive_declining_visits: number;
    time_gap_days: number;
    rolling_efw_mean: number;
    rolling_velocity_mean: number;
    rolling_percentile_mean: number;
  };
  visit_history: Array<{
    ga_weeks: number;
    ga_days: number;
    date: string;
    efw_g: number;
    percentile: number;
    hc_mm?: number;
    ac_mm?: number;
    fl_mm?: number;
    velocity_g_per_week?: number;
  }>;
  governance: {
    is_diagnostic: false;
    intended_use: string;
    disclaimer: string;
  };
}

// ============================================================
// MODEL 8: AFI / AMNIOTIC FLUID LONGITUDINAL ENGINE TYPES
// ============================================================

export type FluidDataQualityStatus = 'GOOD' | 'PARTIAL' | 'REVIEW' | 'INSUFFICIENT';
export type FluidTrajectoryDirection = 'STABLE' | 'INCREASING' | 'DECLINING' | 'RAPID_DECLINE' | 'RECOVERING';
export type FluidCategory = 'NORMAL_FLUID' | 'BORDERLINE_LOW' | 'OLIGOHYDRAMNIOS' | 'POLYHYDRAMNIOS';

export interface Model8FluidVisitInput {
  visit_id?: string;
  visit_date?: string;
  gestational_age_days: number;
  gestational_age_weeks: number;
  afi_cm?: number | null;
  dvp_cm?: number | null;
  q1_cm?: number | null;
  q2_cm?: number | null;
  q3_cm?: number | null;
  q4_cm?: number | null;
  ultrasound_quality?: number;
  measurement_confidence?: number;
}

export interface Model8FluidCurrent {
  afi_cm: number | null;
  dvp_cm: number | null;
  quadrants?: {
    q1_cm?: number | null;
    q2_cm?: number | null;
    q3_cm?: number | null;
    q4_cm?: number | null;
  };
  fluid_category: FluidCategory;
  reference_standard: string;
  afi_percentile: number | null;
  reference_range: {
    afi_min_cm: number;
    afi_max_cm: number;
    dvp_min_cm: number;
    dvp_max_cm: number;
  };
}

export interface Model8FluidTrajectory {
  previous_afi_cm: number | null;
  afi_delta_cm: number | null;
  afi_percent_change: number | null;
  afi_velocity_cm_per_day: number | null;
  afi_velocity_cm_per_week: number | null;
  afi_acceleration_cm_per_week2: number | null;
  afi_rolling_mean_cm: number | null;
  afi_rolling_median_cm: number | null;
  afi_trend_slope: number | null;
  consecutive_declining_afi_visits: number;
  previous_dvp_cm: number | null;
  dvp_delta_cm: number | null;
  dvp_percent_change: number | null;
  dvp_velocity_cm_per_week: number | null;
  dvp_acceleration_cm_per_week2: number | null;
  dvp_rolling_mean_cm: number | null;
  dvp_trend_slope: number | null;
  trajectory_direction: FluidTrajectoryDirection;
  time_gap_days: number;
  trajectory_summary: string;
}

export interface Model8FluidQuality {
  afi_available: boolean;
  dvp_available: boolean;
  doppler_available: boolean; // Preserved as false if absent (no fabrication)
  measurement_confidence: number;
  ultrasound_quality: number;
  fluid_data_quality: FluidDataQualityStatus;
  notes: string[];
}

export interface Model8CompleteFluidOutput {
  model: 'model_8_amniotic_fluid_engine';
  patient_id?: string;
  evaluated_at: string;
  current: Model8FluidCurrent;
  trajectory: Model8FluidTrajectory;
  quality: Model8FluidQuality;
  longitudinal_fluid_feature_vector: {
    afi_cm: number | null;
    dvp_cm: number | null;
    previous_afi: number | null;
    afi_delta: number | null;
    afi_percent_change: number | null;
    afi_velocity: number | null;
    afi_acceleration: number | null;
    afi_rolling_mean: number | null;
    afi_trend_slope: number | null;
    consecutive_declining_afi_visits: number;
    dvp_delta: number | null;
    dvp_velocity: number | null;
    dvp_acceleration: number | null;
    time_gap_days: number;
    afi_measurement_confidence: number;
    dvp_measurement_confidence: number;
    fluid_data_quality_encoded: number;
    trajectory_direction_encoded: number;
  };
  visit_history: Array<{
    ga_weeks: number;
    ga_days: number;
    date: string;
    afi_cm: number | null;
    dvp_cm: number | null;
    velocity_cm_per_week?: number | null;
  }>;
  governance: {
    is_diagnostic: false;
    intended_use: string;
    disclaimer: string;
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

// ============================================================
// PLAN 1: MATERNAL BASELINE MODEL TYPES & STRUCTURED SCHEMAS
// (Ensemble XGBoost / Random Forest Contextual Representation)
// ============================================================

export interface MaternalBaselineInput {
  maternalAge: number;          // Maternal age (years, e.g. 15 - 50)
  gravidity: number;            // Total number of pregnancies (>= 1)
  parity: number;               // Past viable deliveries (>= 0)
  maternalWeight: number;       // Current maternal weight in kg
  weightChange: number;         // Total net gestational weight change (kg from pre-pregnancy baseline)
  systolicBp: number;           // Systolic blood pressure (mmHg)
  diastolicBp: number;          // Diastolic blood pressure (mmHg)
  temperature: number;          // Core body temperature (°C)
  heartRate: number;            // Resting heart rate (beats per minute)
  hemoglobin: number;           // Hemoglobin concentration (g/dL)
  platelets: number;            // Platelet count (k/µL or ×10^9/L)
  gestationalAgeWeeks?: number; // Contextual gestational age at evaluation
  recordedDate?: string;        // Date of measurement
}

export interface MaternalFeatureAttribution {
  featureKey: keyof MaternalBaselineInput | string;
  label: string;
  rawValue: number;
  unit: string;
  referenceNormal: string;
  normalizedZScore: number;     // Standardized feature score (-3.0 to +3.0)
  attributionWeight: number;    // Tree attribution / SHAP contribution weight (-10.0 to +10.0)
  direction: 'escalating' | 'protective' | 'neutral';
  clinicalInterpretation: string;
}

export interface MaternalBaselineFeatures {
  featureVector: number[];      // 11-dimensional normalized continuous vector
  featureLabels: string[];      // Corresponding labels
  derivedIndices: {
    map_mmHg: number;               // Mean Arterial Pressure = (2*DBP + SBP)/3
    pulsePressure_mmHg: number;     // SBP - DBP
    shockIndex: number;             // HR / SBP (hemodynamic stability)
    ratePressureProduct: number;    // (HR * SBP) / 100
    weightGainAdequacyRatio: number;// Observed weight gain vs IOM expected baseline ratio
    plateletToHbRatio: number;      // Platelets / Hb (microangiopathy index)
  };
  phenotypeCluster: 'Normotensive Eutrophic' | 'Vascular / Hemodynamic Strain' | 'Suboptimal Accretion / Anemic' | 'Inflammatory / Hypermetabolic' | 'Metabolic Fluid Retention';
  phenotypeDescription: string;
}

export interface MaternalRiskContribution {
  compositeScore: number;       // 0 - 100 continuous contextual risk contribution
  category: 'MINIMAL_CONTRIBUTION' | 'MILD_CONTEXTUAL_RISK' | 'MODERATE_CONTEXTUAL_RISK' | 'SIGNIFICANT_CONTEXTUAL_RISK';
  contextMultiplier: number;    // Multiplier for downstream longitudinal trajectory models (0.90 to 1.45)
  attributions: MaternalFeatureAttribution[];
  topRiskDrivers: string[];
  topProtectiveFactors: string[];
}

export interface MaternalBaselineConfidence {
  score: number;                // 0.0 - 1.0 confidence score
  percentage: number;           // 0 - 100%
  dataCompleteness: number;     // e.g. 11/11 (1.0)
  missingFeaturesCount: number;
  physiologicalPlausibility: boolean;
  ensembleAgreementVariance: number; // Low variance between Random Forest and Boosted trees indicates high confidence
  confidenceTier: 'HIGH' | 'MODERATE' | 'LOW';
  details: string;
}

export interface MaternalBaselineOutput {
  modelType: 'XGBoost_RandomForest_Ensemble';
  modelVersion: string;
  evaluatedAt: string;
  inputParameters: MaternalBaselineInput;
  baselineFeatures: MaternalBaselineFeatures;
  riskContribution: MaternalRiskContribution;
  confidence: MaternalBaselineConfidence;
  governanceNotice: {
    isDiagnostic: false;
    intendedUse: string;
    clinicalRole: string;
    disclaimer: string;
  };
}

// ============================================================
// MODEL 9: MATERNAL & CLINICAL CONTEXT ENGINE TYPES
// ============================================================

export interface Model9DemographicsBaseline {
  maternal_age_years: number;
  gravidity: number;
  parity: number;
  pregnancy_type: 'singleton' | 'multiple' | 'twin_dichorionic' | 'twin_monochorionic';
  ivf: boolean;
  multiple_pregnancy: boolean;
}

export interface Model9VitalsContext {
  systolic_bp: number;
  diastolic_bp: number;
  maternal_weight_kg: number;
  heart_rate_bpm: number;
  temperature_c: number;
  // Longitudinal Vital Derivatives
  previous_systolic_bp?: number | null;
  previous_diastolic_bp?: number | null;
  sbp_delta?: number | null;
  dbp_delta?: number | null;
  sbp_velocity_per_week?: number | null;
  dbp_velocity_per_week?: number | null;
  sbp_trend_slope?: number | null;
  dbp_trend_slope?: number | null;
  previous_weight_kg?: number | null;
  weight_change_kg?: number | null;
  weight_velocity_kg_per_week?: number | null;
  weight_rolling_mean_kg?: number | null;
  hr_delta?: number | null;
  hr_velocity_per_week?: number | null;
  mean_arterial_pressure_mmHg?: number;
  pulse_pressure_mmHg?: number;
}

export interface Model9LabsContext {
  hemoglobin_g_dl: number | null;
  platelets_x10e9_l: number | null;
  previous_hemoglobin_g_dl?: number | null;
  hemoglobin_delta?: number | null;
  hemoglobin_velocity_per_week?: number | null;
  previous_platelets_x10e9_l?: number | null;
  platelet_delta?: number | null;
  platelet_velocity_per_week?: number | null;
  platelet_to_hb_ratio?: number | null;
}

export interface Model9PregnancyHistoryContext {
  previous_fgr: boolean;
  previous_preterm_birth: boolean;
  previous_stillbirth: boolean;
  preeclampsia_history: boolean;
  chronic_hypertension: boolean;
  pregestational_diabetes: boolean;
  gestational_diabetes_history: boolean;
  smoking: boolean;
  total_obstetric_risk_factors_count: number;
}

export interface Model9MedicationItem {
  id?: string;
  medication_name: string;
  dose: string;
  frequency: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  indication: string;
  active: boolean;
  adherence_pct?: number;
}

export interface Model9MedicationDynamicsContext {
  active_medication_count: number;
  total_medication_count: number;
  medication_count_change: number;
  new_medication_flag: boolean;
  medication_discontinued_flag: boolean;
  active_medications: Model9MedicationItem[];
  changes_summary?: string;
}

export interface Model9ClinicalEventItem {
  event_id: string;
  event_date: string;
  gestational_age_weeks: number;
  event_type: 'HOSPITALIZATION' | 'CLINICAL_CONCERN' | 'NEW_DIAGNOSIS' | 'EMERGENCY_VISIT' | 'PROCEDURE' | 'EXTRA_ULTRASOUND' | 'LAB_EVENT';
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
  extracted_via?: 'GEMINI_LLM_OCR' | 'CLINICIAN_ENTRY' | 'EHR_INTEGRATION';
}

export interface Model9TemporalContext {
  gestational_age_weeks: number;
  gestational_age_days: number;
  visit_number: number;
  time_gap_days: number;
  missing_visit_flag: boolean;
  long_visit_gap_flag: boolean;
  visit_date?: string;
}

export interface Model9DataQualityContext {
  maternal_data_completeness: number; // 0.0 - 1.0
  clinical_data_completeness: number;
  visit_completeness: number;
  missing_core_measurements: string[];
  missingness_flags: {
    missing_hb: boolean;
    missing_platelets: boolean;
    missing_bp: boolean;
    missing_weight: boolean;
    missing_medications: boolean;
  };
  data_quality_tier: 'COMPLETE' | 'SATISFACTORY' | 'PARTIAL' | 'INSUFFICIENT';
}

export interface Model9FeatureVector {
  // Baseline demographics
  maternal_age_years: number;
  gravidity: number;
  parity: number;
  is_multiple_pregnancy: number;
  is_ivf: number;
  // Vitals & derivatives
  systolic_bp: number;
  diastolic_bp: number;
  sbp_delta: number;
  dbp_delta: number;
  sbp_velocity: number;
  sbp_trend_slope: number;
  maternal_weight_kg: number;
  weight_change_kg: number;
  weight_velocity: number;
  heart_rate_bpm: number;
  temperature_c: number;
  // Labs
  hemoglobin_g_dl: number;
  platelets_x10e9_l: number;
  hemoglobin_delta: number;
  platelet_delta: number;
  // History binary flags
  previous_fgr: number;
  previous_preterm_birth: number;
  previous_stillbirth: number;
  preeclampsia_history: number;
  chronic_hypertension: number;
  smoking: number;
  // Medication context
  active_medication_count: number;
  medication_count_change: number;
  new_medication_flag: number;
  // Temporal & Quality
  gestational_age_weeks: number;
  visit_number: number;
  time_gap_days: number;
  completeness_score: number;
}

export interface Model9CompleteMaternalContextOutput {
  model: 'model_9_maternal_clinical_context_engine';
  patient_id: string;
  evaluated_at: string;
  baseline: Model9DemographicsBaseline;
  vitals: Model9VitalsContext;
  labs: Model9LabsContext;
  history: Model9PregnancyHistoryContext;
  medication_context: Model9MedicationDynamicsContext;
  clinical_events: Model9ClinicalEventItem[];
  temporal: Model9TemporalContext;
  data_quality: Model9DataQualityContext;
  maternal_feature_vector: Model9FeatureVector;
  visit_history: Array<{
    visit_number: number;
    ga_weeks: number;
    date: string;
    bp: string;
    weight_kg: number;
    hb_g_dl?: number | null;
    medications_count: number;
  }>;
  governance: {
    is_diagnostic: false;
    intended_use: string;
    disclaimer: string;
  };
}

// ============================================================
// MODEL 10: MULTIMODAL LONGITUDINAL PREGNANCY TRAJECTORY & RISK ENGINE
// ============================================================

export type Model10TrajectoryState = 'STABLE' | 'MONITOR' | 'ATTENTION';
export type Model10AnomalyStatus = 'NORMAL' | 'UNUSUAL' | 'OUTLIER';

export interface Model10ProbabilityDistribution {
  stable: number;    // e.g. 0.21
  monitor: number;   // e.g. 0.63
  attention: number; // e.g. 0.16
}

export interface Model10ShapContributor {
  feature: string;
  label: string;
  rawValue: number | string;
  contribution: number; // SHAP value (positive increases attention/monitor, negative promotes stable)
  direction: 'escalating' | 'protective' | 'neutral';
  featureGroup: 'growth' | 'fluid' | 'maternal' | 'temporal' | 'history' | 'quality';
  clinicalInterpretation: string;
}

export interface Model10FeatureGroupContribution {
  group: 'fetal_growth' | 'amniotic_fluid' | 'maternal_context' | 'temporal_pacing' | 'clinical_history' | 'data_quality';
  totalContribution: number;
  percentage: number;
  topFeature: string;
}

export interface Model10AnomalyResult {
  status: Model10AnomalyStatus;
  anomaly_score: number; // e.g. -0.18
  threshold: number;     // e.g. 0.00
  is_unusual: boolean;
  isolation_depth_mean: number;
  details: string;
}

export interface Model10DataQualityAudit {
  status: 'GOOD' | 'ACCEPTABLE' | 'REVIEW_REQUIRED' | 'POOR';
  completeness_score: number; // 0.0 - 1.0
  measurement_confidence: number;
  missing_core_measurements: string[];
  warnings: string[];
  proceed_with_inference: boolean;
}

export interface Model10FusedFeatureVector {
  // Biometry
  hc_mm: number;
  bpd_mm: number;
  ofd_mm: number;
  ac_mm: number;
  fl_mm: number;
  // Growth
  efw_g: number;
  growth_percentile: number;
  efw_delta_g: number;
  efw_velocity: number;
  efw_acceleration: number;
  growth_percentile_delta: number;
  growth_percentile_velocity: number;
  consecutive_declining_growth_visits: number;
  // Fluid
  afi_cm: number;
  dvp_cm: number;
  afi_delta_cm: number;
  afi_velocity: number;
  afi_acceleration: number;
  afi_trend_slope: number;
  consecutive_declining_afi_visits: number;
  // Maternal
  maternal_age_years: number;
  systolic_bp: number;
  diastolic_bp: number;
  sbp_delta: number;
  sbp_velocity: number;
  sbp_trend_slope: number;
  maternal_weight_kg: number;
  weight_change_kg: number;
  weight_velocity: number;
  heart_rate_bpm: number;
  temperature_c: number;
  hemoglobin_g_dl: number;
  platelets_x10e9_l: number;
  // History
  previous_fgr: number;
  previous_preterm_birth: number;
  previous_stillbirth: number;
  preeclampsia_history: number;
  chronic_hypertension: number;
  smoking: number;
  is_multiple_pregnancy: number;
  is_ivf: number;
  // Medication
  active_medication_count: number;
  medication_count_change: number;
  new_medication_flag: number;
  // Temporal & Quality
  gestational_age_weeks: number;
  visit_number: number;
  time_gap_days: number;
  completeness_score: number;
}

export interface Model10CompleteTrajectoryOutput {
  model: 'model_10_multimodal_trajectory_risk_engine';
  patient_id: string;
  evaluated_at: string;
  trajectory: {
    state: Model10TrajectoryState;
    primary_probability: number;
    probabilities: Model10ProbabilityDistribution;
    state_description: string;
    confidence_tier: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'BORDERLINE';
  };
  anomaly: Model10AnomalyResult;
  explainability: {
    top_contributors: Model10ShapContributor[];
    group_contributions: Model10FeatureGroupContribution[];
    base_value: number;
    shap_sum: number;
  };
  gemini_narrative: {
    headline: string;
    clinical_communication: string;
    longitudinal_trajectory_summary: string;
    data_quality_context: string;
    recommended_sonographic_focus: string[];
  };
  data_quality: Model10DataQualityAudit;
  fused_feature_vector: Model10FusedFeatureVector;
  model_metadata: {
    algorithm: string;
    version: string;
    split_strategy: string;
    test_accuracy_pct: number;
    test_f1_pct: number;
    validation_f1_pct: number;
  };
  governance: {
    is_diagnostic: false;
    intended_use: string;
    clinical_role: string;
    disclaimer: string;
  };
}


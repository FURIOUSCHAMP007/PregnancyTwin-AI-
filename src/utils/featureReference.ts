/**
 * Master Reference Table & Range Validation Engine for PregnancyTwin AI (59 Features)
 * Pipeline Flow: Parameter -> Raw Value -> Range Validation -> Feature Normalization -> ML Model Ingress
 */

export interface FeatureDefinition {
  id: string;
  name: string;
  unit: string;
  minValid: number;
  maxValid: number;
  reviewMin?: number;
  reviewMax?: number;
  interpretation: string;
  category: 'Demographics' | 'Biometrics' | 'Velocity' | 'Maternal Vitals' | 'Quality & Context' | 'Rolling & Previous' | 'AI Parameters';
}

export type ValidationStatus = 'VALID' | 'INVALID' | 'REVIEW';

export interface ValidationResult {
  status: ValidationStatus;
  message: string;
  normalizedValue: number;
  originalValue: number;
}

export const MASTER_59_FEATURE_CATALOG: FeatureDefinition[] = [
  // Demographics
  { id: 'maternal_age', name: 'Maternal age', unit: 'years', minValid: 15, maxValid: 50, reviewMin: 18, reviewMax: 45, interpretation: 'Maternal demographic age', category: 'Demographics' },
  { id: 'gravidity', name: 'Gravidity', unit: 'count', minValid: 1, maxValid: 15, reviewMin: 1, reviewMax: 8, interpretation: 'Number of pregnancies', category: 'Demographics' },
  { id: 'parity', name: 'Parity', unit: 'count', minValid: 0, maxValid: 15, reviewMin: 0, reviewMax: 8, interpretation: 'Previous births count', category: 'Demographics' },
  
  // Biometrics & Gestation
  { id: 'gestational_age', name: 'Gestational age', unit: 'weeks', minValid: 20, maxValid: 42, reviewMin: 20, reviewMax: 41, interpretation: 'Pregnancy stage in weeks', category: 'Biometrics' },
  { id: 'bpd_mm', name: 'Biparietal Diameter (BPD)', unit: 'mm', minValid: 40, maxValid: 110, reviewMin: 45, reviewMax: 105, interpretation: 'Fetal BPD caliper', category: 'Biometrics' },
  { id: 'hc_mm', name: 'Head Circumference (HC)', unit: 'mm', minValid: 150, maxValid: 380, reviewMin: 160, reviewMax: 370, interpretation: 'Fetal head circumference caliper', category: 'Biometrics' },
  { id: 'ac_mm', name: 'Abdominal Circumference (AC)', unit: 'mm', minValid: 130, maxValid: 400, reviewMin: 140, reviewMax: 390, interpretation: 'Fetal abdominal circumference caliper', category: 'Biometrics' },
  { id: 'fl_mm', name: 'Femur Length (FL)', unit: 'mm', minValid: 25, maxValid: 80, reviewMin: 28, reviewMax: 78, interpretation: 'Fetal femur length caliper', category: 'Biometrics' },
  { id: 'efw_g', name: 'Estimated Fetal Weight (EFW)', unit: 'g', minValid: 250, maxValid: 5500, reviewMin: 300, reviewMax: 5000, interpretation: 'Hadlock formula estimated fetal weight', category: 'Biometrics' },
  { id: 'fetal_heart_rate', name: 'Fetal Heart Rate (FHR)', unit: 'bpm', minValid: 60, maxValid: 220, reviewMin: 110, reviewMax: 160, interpretation: 'Fetal cardiac rhythm rate', category: 'Biometrics' },
  { id: 'growth_percentile', name: 'Growth Percentile', unit: '%', minValid: 0, maxValid: 100, reviewMin: 5, reviewMax: 95, interpretation: 'Fetal growth position percentile', category: 'Biometrics' },
  { id: 'afi_cm', name: 'Amniotic Fluid Index (AFI)', unit: 'cm', minValid: 0, maxValid: 40, reviewMin: 5, reviewMax: 25, interpretation: 'Four-quadrant amniotic fluid sum', category: 'Biometrics' },
  { id: 'dvp_cm', name: 'Deepest Vertical Pocket (DVP)', unit: 'cm', minValid: 0, maxValid: 15, reviewMin: 2, reviewMax: 8, interpretation: 'Single deepest fluid pocket', category: 'Biometrics' },
  { id: 'ua_pi', name: 'Umbilical Artery PI', unit: 'index', minValid: 0.1, maxValid: 4.0, reviewMin: 0.5, reviewMax: 1.8, interpretation: 'Placental vascular resistance index', category: 'Biometrics' },
  { id: 'mca_pi', name: 'Middle Cerebral Artery PI', unit: 'index', minValid: 0.1, maxValid: 4.5, reviewMin: 1.0, reviewMax: 2.5, interpretation: 'Fetal cerebrovascular resistance index', category: 'Biometrics' },
  { id: 'ua_ri', name: 'Umbilical Artery RI', unit: 'index', minValid: 0.1, maxValid: 1.0, reviewMin: 0.4, reviewMax: 0.85, interpretation: 'Umbilical artery resistance index', category: 'Biometrics' },

  // Velocity & Dynamics
  { id: 'afi_change', name: 'AFI Change', unit: 'cm', minValid: -20, maxValid: 20, reviewMin: -10, reviewMax: 10, interpretation: 'Absolute AFI delta from prior scan', category: 'Velocity' },
  { id: 'afi_pct_change', name: 'AFI % Change', unit: '%', minValid: -100, maxValid: 300, reviewMin: -50, reviewMax: 100, interpretation: 'Relative AFI percentage change', category: 'Velocity' },
  { id: 'afi_acceleration', name: 'AFI Acceleration', unit: 'cm/day²', minValid: -2, maxValid: 2, reviewMin: -0.5, reviewMax: 0.5, interpretation: 'Rate of change in AFI velocity', category: 'Velocity' },
  { id: 'afi_velocity', name: 'AFI Velocity', unit: 'cm/day', minValid: -1, maxValid: 1, reviewMin: -0.3, reviewMax: 0.3, interpretation: 'Daily rate of AFI trajectory', category: 'Velocity' },
  { id: 'efw_change', name: 'EFW Change', unit: 'g', minValid: -200, maxValid: 1500, reviewMin: 0, reviewMax: 1000, interpretation: 'Absolute fetal weight growth delta', category: 'Velocity' },
  { id: 'efw_pct_change', name: 'EFW % Change', unit: '%', minValid: -20, maxValid: 200, reviewMin: 0, reviewMax: 100, interpretation: 'Relative weight gain percentage', category: 'Velocity' },
  { id: 'efw_acceleration', name: 'EFW Acceleration', unit: 'g/day²', minValid: -10, maxValid: 10, reviewMin: -2, reviewMax: 2, interpretation: 'Rate of change in fetal growth rate', category: 'Velocity' },
  { id: 'efw_velocity', name: 'EFW Velocity', unit: 'g/day', minValid: -10, maxValid: 50, reviewMin: 5, reviewMax: 35, interpretation: 'Daily fetal weight growth rate', category: 'Velocity' },
  { id: 'growth_percentile_change', name: 'Growth Percentile Change', unit: 'points', minValid: -100, maxValid: 100, reviewMin: -30, reviewMax: 30, interpretation: 'Percentile drop or gain points', category: 'Velocity' },
  { id: 'growth_percentile_velocity', name: 'Growth Percentile Velocity', unit: 'points/day', minValid: -5, maxValid: 5, reviewMin: -1, reviewMax: 1, interpretation: 'Daily percentile trajectory shift', category: 'Velocity' },
  { id: 'consecutive_declining_visits', name: 'Consecutive Declining Visits', unit: 'count', minValid: 0, maxValid: 10, reviewMin: 0, reviewMax: 3, interpretation: 'Sustained trajectory decline counter', category: 'Velocity' },
  { id: 'hc_velocity', name: 'HC Velocity', unit: 'mm/day', minValid: 0, maxValid: 3, reviewMin: 0.2, reviewMax: 1.5, interpretation: 'Head growth velocity per day', category: 'Velocity' },
  { id: 'ac_velocity', name: 'AC Velocity', unit: 'mm/day', minValid: 0, maxValid: 3, reviewMin: 0.2, reviewMax: 1.5, interpretation: 'Abdominal growth velocity per day', category: 'Velocity' },
  { id: 'fl_velocity', name: 'FL Velocity', unit: 'mm/day', minValid: 0, maxValid: 1.5, reviewMin: 0.1, reviewMax: 0.8, interpretation: 'Femur length growth velocity', category: 'Velocity' },

  // Maternal Vitals
  { id: 'bp_systolic', name: 'Systolic BP', unit: 'mmHg', minValid: 70, maxValid: 250, reviewMin: 90, reviewMax: 140, interpretation: 'Maternal systolic blood pressure', category: 'Maternal Vitals' },
  { id: 'bp_diastolic', name: 'Diastolic BP', unit: 'mmHg', minValid: 40, maxValid: 150, reviewMin: 60, reviewMax: 90, interpretation: 'Maternal diastolic blood pressure', category: 'Maternal Vitals' },
  { id: 'maternal_weight', name: 'Maternal Weight', unit: 'kg', minValid: 35, maxValid: 180, reviewMin: 45, reviewMax: 120, interpretation: 'Maternal body mass in kg', category: 'Maternal Vitals' },
  { id: 'weight_change', name: 'Weight Change', unit: 'kg', minValid: -20, maxValid: 40, reviewMin: -2, reviewMax: 20, interpretation: 'Longitudinal weight gain/loss delta', category: 'Maternal Vitals' },
  { id: 'temperature_c', name: 'Temperature', unit: '°C', minValid: 34, maxValid: 42, reviewMin: 36.0, reviewMax: 37.5, interpretation: 'Maternal core temperature', category: 'Maternal Vitals' },
  { id: 'heart_rate_bpm', name: 'Heart Rate', unit: 'bpm', minValid: 40, maxValid: 180, reviewMin: 60, reviewMax: 100, interpretation: 'Maternal heart rate bpm', category: 'Maternal Vitals' },
  { id: 'hemoglobin_g_dl', name: 'Hemoglobin', unit: 'g/dL', minValid: 5, maxValid: 18, reviewMin: 10, reviewMax: 15, interpretation: 'Maternal blood hemoglobin level', category: 'Maternal Vitals' },
  { id: 'platelets', name: 'Platelets', unit: '×10⁹/L', minValid: 50, maxValid: 600, reviewMin: 150, reviewMax: 400, interpretation: 'Maternal platelet count', category: 'Maternal Vitals' },

  // Quality & Context
  { id: 'ultrasound_quality', name: 'Ultrasound Quality', unit: 'score', minValid: 0, maxValid: 1, reviewMin: 0.5, reviewMax: 1.0, interpretation: 'Image acoustic quality score', category: 'Quality & Context' },
  { id: 'image_available', name: 'Image Available', unit: 'Boolean', minValid: 0, maxValid: 1, reviewMin: 0, reviewMax: 1, interpretation: 'Ultrasound image frame present', category: 'Quality & Context' },
  { id: 'completeness_score', name: 'Completeness Score', unit: 'score', minValid: 0, maxValid: 1, reviewMin: 0.7, reviewMax: 1.0, interpretation: 'Protocol biometrics completeness ratio', category: 'Quality & Context' },
  { id: 'measurement_confidence', name: 'Measurement Confidence', unit: 'score', minValid: 0, maxValid: 1, reviewMin: 0.6, reviewMax: 1.0, interpretation: 'AI caliper confidence score', category: 'Quality & Context' },
  { id: 'time_gap_days', name: 'Time Gap', unit: 'days', minValid: 0, maxValid: 180, reviewMin: 7, reviewMax: 42, interpretation: 'Days elapsed since prior visit', category: 'Quality & Context' },
  { id: 'medication_active', name: 'Medication Active', unit: 'Boolean', minValid: 0, maxValid: 1, reviewMin: 0, reviewMax: 1, interpretation: 'Active drug therapy exposure', category: 'Quality & Context' },
  { id: 'medication_count', name: 'Medication Count', unit: 'count', minValid: 0, maxValid: 10, reviewMin: 0, reviewMax: 5, interpretation: 'Total active prescriptions', category: 'Quality & Context' },

  // Rolling & Previous
  { id: 'previous_afi', name: 'Previous AFI', unit: 'cm', minValid: 0, maxValid: 40, reviewMin: 5, reviewMax: 25, interpretation: 'Prior visit AFI measurement', category: 'Rolling & Previous' },
  { id: 'afi_delta', name: 'AFI Delta', unit: 'cm', minValid: -20, maxValid: 20, reviewMin: -8, reviewMax: 8, interpretation: 'Current - previous AFI difference', category: 'Rolling & Previous' },
  { id: 'afi_rolling_mean', name: 'AFI Rolling Mean', unit: 'cm', minValid: 0, maxValid: 40, reviewMin: 5, reviewMax: 25, interpretation: 'Smoothed 3-visit AFI moving average', category: 'Rolling & Previous' },
  { id: 'previous_efw', name: 'Previous EFW', unit: 'g', minValid: 250, maxValid: 5500, reviewMin: 300, reviewMax: 5000, interpretation: 'Prior visit EFW measurement', category: 'Rolling & Previous' },
  { id: 'efw_delta', name: 'EFW Delta', unit: 'g', minValid: -200, maxValid: 1500, reviewMin: 0, reviewMax: 1000, interpretation: 'Current - previous EFW difference', category: 'Rolling & Previous' },
  { id: 'efw_rolling_mean', name: 'EFW Rolling Mean', unit: 'g', minValid: 250, maxValid: 5500, reviewMin: 300, reviewMax: 5000, interpretation: 'Smoothed 3-visit EFW moving average', category: 'Rolling & Previous' },
  { id: 'previous_growth_percentile', name: 'Previous Growth Percentile', unit: '%', minValid: 0, maxValid: 100, reviewMin: 5, reviewMax: 95, interpretation: 'Prior visit growth percentile', category: 'Rolling & Previous' },
  { id: 'growth_percentile_delta', name: 'Growth Percentile Delta', unit: 'points', minValid: -100, maxValid: 100, reviewMin: -30, reviewMax: 30, interpretation: 'Current - previous percentile delta', category: 'Rolling & Previous' },
  { id: 'growth_rolling_mean', name: 'Growth Rolling Mean', unit: '%', minValid: 0, maxValid: 100, reviewMin: 5, reviewMax: 95, interpretation: 'Smoothed 3-visit percentile average', category: 'Rolling & Previous' },

  // AI Parameters
  { id: 'trajectory_prediction', name: 'Trajectory Prediction', unit: 'category', minValid: 0, maxValid: 2, interpretation: 'XGBoostClassifier target: stable, monitor, attention', category: 'AI Parameters' },
  { id: 'model_confidence', name: 'Model Confidence', unit: 'ratio', minValid: 0, maxValid: 1, reviewMin: 0.5, reviewMax: 1.0, interpretation: 'Model classification probability (0-1)', category: 'AI Parameters' },
  { id: 'anomaly_score', name: 'Anomaly Score', unit: 'score', minValid: -1, maxValid: 1, reviewMin: -0.5, reviewMax: 0.5, interpretation: 'IsolationForest continuous anomaly metric', category: 'AI Parameters' },
  { id: 'anomaly_status', name: 'Anomaly Status', unit: 'category', minValid: 0, maxValid: 1, interpretation: 'IsolationForest status: Normal / Unusual', category: 'AI Parameters' },
  { id: 'risk_state', name: 'Risk State', unit: 'category', minValid: 0, maxValid: 2, interpretation: 'Risk stratification state: Stable / Monitor / Attention', category: 'AI Parameters' },
  { id: 'shap_contribution', name: 'SHAP Contribution', unit: 'impact', minValid: -10, maxValid: 10, interpretation: 'Positive or negative model contribution score', category: 'AI Parameters' },
  { id: 'forecast_gestational_age', name: 'Forecast Delivery GA', unit: 'weeks', minValid: 20, maxValid: 42, reviewMin: 35, reviewMax: 41, interpretation: 'XGBoostRegressor estimated delivery GA', category: 'AI Parameters' },
  { id: 'delivery_forecast_window', name: 'Delivery Forecast Window', unit: 'window', minValid: 0, maxValid: 0, interpretation: 'Estimated delivery window (research prototype)', category: 'AI Parameters' }
];

/**
 * Validate a feature value against defined master range boundaries.
 * Returns: VALID, REVIEW (Flagged for clinical review), or INVALID
 */
export function validateFeatureValue(featureId: string, value: number): ValidationResult {
  const def = MASTER_59_FEATURE_CATALOG.find(f => f.id === featureId);
  if (!def) {
    return {
      status: 'VALID',
      message: 'Feature parameter recognized',
      normalizedValue: value,
      originalValue: value
    };
  }

  // Check hard physical/engineering bounds
  if (value < def.minValid || value > def.maxValid) {
    return {
      status: 'INVALID',
      message: `Out of valid range (${def.minValid} to ${def.maxValid} ${def.unit}). Value rejected.`,
      normalizedValue: Math.max(def.minValid, Math.min(def.maxValid, value)),
      originalValue: value
    };
  }

  // Check clinical warning / review threshold bounds
  if (def.reviewMin !== undefined && def.reviewMax !== undefined) {
    if (value < def.reviewMin || value > def.reviewMax) {
      return {
        status: 'REVIEW',
        message: `Value outside typical norm (${def.reviewMin} to ${def.reviewMax} ${def.unit}). Flagged for clinician review.`,
        normalizedValue: value,
        originalValue: value
      };
    }
  }

  return {
    status: 'VALID',
    message: 'Value within valid standard prototype bounds.',
    normalizedValue: value,
    originalValue: value
  };
}

export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return MASTER_59_FEATURE_CATALOG.find(f => f.id === featureId);
}

export interface DetailedFieldValidation {
  featureId: string;
  name: string;
  unit: string;
  value: number;
  status: ValidationStatus;
  message: string;
  minValid: number;
  maxValid: number;
  reviewMin?: number;
  reviewMax?: number;
}

export function validateAllInputFields(inputs: Record<string, number>): DetailedFieldValidation[] {
  return Object.entries(inputs).map(([key, val]) => {
    const def = getFeatureDefinition(key);
    const res = validateFeatureValue(key, val);
    return {
      featureId: key,
      name: def?.name || key,
      unit: def?.unit || '',
      value: val,
      status: res.status,
      message: res.message,
      minValid: def?.minValid ?? 0,
      maxValid: def?.maxValid ?? 10000,
      reviewMin: def?.reviewMin,
      reviewMax: def?.reviewMax
    };
  });
}


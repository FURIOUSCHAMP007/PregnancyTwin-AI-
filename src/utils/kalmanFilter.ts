/**
 * PregnancyTwin AI - Kalman Filter Trajectory Smoothing Engine
 * 
 * Implements a 2D Kalman filter algorithm (state: size, velocity) designed 
 * specifically to smooth noisy sonographic caliper and amniotic fluid measurements.
 * It uses the time interval between sequential clinical scans (gestational age in weeks)
 * as the dynamic step size, modeling steady fetal development and filtering out
 * high-variance user-input shakes or sonographer calibration discrepancies.
 */

export interface KalmanState {
  size: number;      // Estimated true physical size (mm, cm, or grams)
  velocity: number;  // Estimated rate of change (mm/week, cm/week, or g/week)
  p11: number;       // Variance of size estimate
  p12: number;       // Covariance of size and velocity
  p22: number;       // Variance of velocity estimate
}

export interface BiometricFilters {
  hc: KalmanState;
  ac: KalmanState;
  bpd: KalmanState;
  fl: KalmanState;
  afi: KalmanState;
  efw: KalmanState;
}

/**
 * Initializes a Kalman state for a given biometric parameter
 * @param initialSize First measured value
 * @param estimatedVelocity Expected growth velocity per week (default)
 */
export function createInitialKalmanState(initialSize: number, estimatedVelocity: number = 0): KalmanState {
  return {
    size: initialSize,
    velocity: estimatedVelocity,
    // Start with relatively high uncertainty so the filter adapts quickly to the first few data points
    p11: 100.0,
    p12: 0.0,
    p22: 10.0,
  };
}

/**
 * Performs a single Kalman filter predict-and-update step
 * 
 * @param state Previous Kalman state
 * @param measurement Current raw biometric measurement
 * @param deltaWeeks Time gap in gestational weeks since last measurement
 * @param processNoiseAcceleration Acceleration variance (q) - small means steady growth
 * @param measurementNoise Variance of sonographer sensor/caliper noise (R)
 */
export function updateKalmanState(
  state: KalmanState,
  measurement: number,
  deltaWeeks: number,
  processNoiseAcceleration: number = 0.5,
  measurementNoise: number = 25.0
): KalmanState {
  // Guard against zero/negative time steps to avoid numerical instability
  const dt = Math.max(0.05, deltaWeeks);

  // 1. PREDICT STEP
  // State transition: s_pred = s + dt * v; v_pred = v
  const sizePred = state.size + dt * state.velocity;
  const velocityPred = state.velocity;

  // Process Noise Covariance (Continuous White Noise Acceleration model)
  // Q = q * [ dt^3/3, dt^2/2; dt^2/2, dt ]
  const q11 = (processNoiseAcceleration * Math.pow(dt, 3)) / 3;
  const q12 = (processNoiseAcceleration * Math.pow(dt, 2)) / 2;
  const q22 = processNoiseAcceleration * dt;

  // Predict covariance: P_pred = F * P * F^T + Q
  const p11Pred = state.p11 + 2 * dt * state.p12 + Math.pow(dt, 2) * state.p22 + q11;
  const p12Pred = state.p12 + dt * state.p22 + q12;
  const p22Pred = state.p22 + q22;

  // 2. UPDATE STEP
  // Measurement matrix H = [1, 0]
  // Innovation (residual)
  const innovation = measurement - sizePred;

  // Innovation covariance S = H * P_pred * H^T + R
  const S = p11Pred + measurementNoise;

  // Kalman Gain K = P_pred * H^T / S
  const k1 = p11Pred / S;
  const k2 = p12Pred / S;

  // Updated state estimates
  const sizeUpdated = sizePred + k1 * innovation;
  const velocityUpdated = velocityPred + k2 * innovation;

  // Updated covariance matrix: P = (I - K*H) * P_pred
  const p11Updated = (1 - k1) * p11Pred;
  const p12Updated = (1 - k1) * p12Pred;
  const p22Updated = p22Pred - k2 * p12Pred;

  return {
    size: parseFloat(sizeUpdated.toFixed(2)),
    velocity: parseFloat(velocityUpdated.toFixed(3)),
    p11: p11Updated,
    p12: p12Updated,
    p22: p22Updated,
  };
}

/**
 * Filters a full longitudinal sequence of noisy visits to yield smoothed values.
 * 
 * @param visits Sequence of VisitMeasurements sorted chronologically by gestationalAge
 * @returns Array of smoothed measurements corresponding to each visit
 */
export function smoothLongitudinalVisits(visits: any[]): any[] {
  if (visits.length === 0) return [];

  const sorted = [...visits].sort((a, b) => {
    const aWeeks = a.gestationalAgeWeeks + (a.gestationalAgeDays || 0) / 7;
    const bWeeks = b.gestationalAgeWeeks + (b.gestationalAgeDays || 0) / 7;
    return aWeeks - bWeeks;
  });

  const smoothed: any[] = [];
  
  // Standard clinical noises (R) and process uncertainties (q) for biometrics
  const CONFIG = {
    hc:  { R: 16.0, q: 0.8,  vel: 12.0 }, // HC mm
    ac:  { R: 25.0, q: 1.0,  vel: 12.0 }, // AC mm
    bpd: { R: 4.0,  q: 0.2,  vel: 3.0  }, // BPD mm
    fl:  { R: 2.0,  q: 0.1,  vel: 2.5  }, // FL mm
    afi: { R: 1.5,  q: 0.15, vel: -0.1 }, // AFI cm (declines slowly)
    efw: { R: 4900.0, q: 400.0, vel: 150.0 } // EFW grams
  };

  // Initialize filters
  const first = sorted[0];
  let hcState = createInitialKalmanState(first.biometrics?.hc_mm || 200, CONFIG.hc.vel);
  let acState = createInitialKalmanState(first.biometrics?.ac_mm || 180, CONFIG.ac.vel);
  let bpdState = createInitialKalmanState(first.biometrics?.bpd_mm || 50, CONFIG.bpd.vel);
  let flState = createInitialKalmanState(first.biometrics?.fl_mm || 35, CONFIG.fl.vel);
  let afiState = createInitialKalmanState(first.amnioticFluidIndex_cm || 12, CONFIG.afi.vel);
  let efwState = createInitialKalmanState(first.estimatedFetalWeight_g || 400, CONFIG.efw.vel);

  // Push the first visit (used as baseline init)
  smoothed.push({
    ...first,
    rawBiometrics: { ...first.biometrics },
    rawEfw: first.estimatedFetalWeight_g,
    rawAfi: first.amnioticFluidIndex_cm,
    isSmoothedByKalman: true,
  });

  let prevAge = first.gestationalAgeWeeks + (first.gestationalAgeDays || 0) / 7;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currentAge = current.gestationalAgeWeeks + (current.gestationalAgeDays || 0) / 7;
    const dt = Math.max(0.1, currentAge - prevAge);

    // Update state variables with new measurements
    hcState = updateKalmanState(hcState, current.biometrics?.hc_mm || 200, dt, CONFIG.hc.q, CONFIG.hc.R);
    acState = updateKalmanState(acState, current.biometrics?.ac_mm || 180, dt, CONFIG.ac.q, CONFIG.ac.R);
    bpdState = updateKalmanState(bpdState, current.biometrics?.bpd_mm || 50, dt, CONFIG.bpd.q, CONFIG.bpd.R);
    flState = updateKalmanState(flState, current.biometrics?.fl_mm || 35, dt, CONFIG.fl.q, CONFIG.fl.R);
    afiState = updateKalmanState(afiState, current.amnioticFluidIndex_cm || 12, dt, CONFIG.afi.q, CONFIG.afi.R);
    efwState = updateKalmanState(efwState, current.estimatedFetalWeight_g || 400, dt, CONFIG.efw.q, CONFIG.efw.R);

    // Enforce Biological Monotonicity constraints: Structural dimensions of a growing fetus must not decrease.
    // Ensure estimated size stays at least equal to the previous smoothed estimation.
    const prevSmoothed = smoothed[smoothed.length - 1];
    if (prevSmoothed) {
      hcState.size = parseFloat(Math.max(prevSmoothed.biometrics?.hc_mm || 0, hcState.size).toFixed(2));
      acState.size = parseFloat(Math.max(prevSmoothed.biometrics?.ac_mm || 0, acState.size).toFixed(2));
      bpdState.size = parseFloat(Math.max(prevSmoothed.biometrics?.bpd_mm || 0, bpdState.size).toFixed(2));
      flState.size = parseFloat(Math.max(prevSmoothed.biometrics?.fl_mm || 0, flState.size).toFixed(2));
      efwState.size = parseFloat(Math.max(prevSmoothed.estimatedFetalWeight_g || 0, efwState.size).toFixed(2));

      // Growth velocities for physical structures must remain non-negative over long intervals
      hcState.velocity = parseFloat(Math.max(0, hcState.velocity).toFixed(3));
      acState.velocity = parseFloat(Math.max(0, acState.velocity).toFixed(3));
      bpdState.velocity = parseFloat(Math.max(0, bpdState.velocity).toFixed(3));
      flState.velocity = parseFloat(Math.max(0, flState.velocity).toFixed(3));
      efwState.velocity = parseFloat(Math.max(0, efwState.velocity).toFixed(3));
    }

    // Anatomical ratio validation constraint: BPD must be strictly less than HC
    if (bpdState.size >= hcState.size) {
      bpdState.size = parseFloat((hcState.size * 0.28).toFixed(2));
    }

    smoothed.push({
      ...current,
      amnioticFluidIndex_cm: Math.round(afiState.size * 10) / 10,
      estimatedFetalWeight_g: Math.round(efwState.size),
      biometrics: {
        hc_mm: Math.round(hcState.size),
        ac_mm: Math.round(acState.size),
        bpd_mm: Math.round(bpdState.size),
        fl_mm: Math.round(flState.size),
      },
      rawBiometrics: { ...current.biometrics },
      rawEfw: current.estimatedFetalWeight_g,
      rawAfi: current.amnioticFluidIndex_cm,
      isSmoothedByKalman: true,
      kalmanStates: {
        hc: hcState,
        ac: acState,
        bpd: bpdState,
        fl: flState,
        afi: afiState,
        efw: efwState,
      }
    });

    prevAge = currentAge;
  }

  return smoothed;
}

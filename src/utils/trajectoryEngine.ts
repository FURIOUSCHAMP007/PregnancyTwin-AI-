/**
 * PregnancyTwin AI - Trajectory & Risk Intelligence Engine
 * Deterministic calculations for serial ultrasound measurements
 */

import {
  VisitMeasurement,
  TrajectoryVelocity,
  TrajectoryScore,
  WhyNowAlert,
  NextVisitForecast,
  TrajectoryCategory,
  RiskLevel,
  MedicationExposure
} from '../types';
import { smoothLongitudinalVisits } from './kalmanFilter';

/**
 * Calculates longitudinal velocities and accelerations across visits
 */
export function calculateVelocities(visits: VisitMeasurement[]): TrajectoryVelocity {
  if (visits.length < 2) {
    return {
      afiVelocity_cmPerWeek: 0,
      growthVelocity_percentilePerWeek: 0,
      efwVelocity_gPerWeek: 0,
      afiAcceleration_cmPerWeekSq: 0
    };
  }

  const sorted = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  const current = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const deltaWeeks = Math.max(0.5, current.gestationalAgeWeeks - prev.gestationalAgeWeeks);
  const deltaAfi = current.amnioticFluidIndex_cm - prev.amnioticFluidIndex_cm;
  const deltaGrowth = current.growthPercentile - prev.growthPercentile;
  const deltaEfw = current.estimatedFetalWeight_g - prev.estimatedFetalWeight_g;

  const afiVelocity = parseFloat((deltaAfi / deltaWeeks).toFixed(2));
  const growthVelocity = parseFloat((deltaGrowth / deltaWeeks).toFixed(2));
  const efwVelocity = parseFloat((deltaEfw / deltaWeeks).toFixed(1));

  let afiAcceleration = 0;
  if (sorted.length >= 3) {
    const prev2 = sorted[sorted.length - 3];
    const prevDeltaWeeks = Math.max(0.5, prev.gestationalAgeWeeks - prev2.gestationalAgeWeeks);
    const prevAfiVelocity = (prev.amnioticFluidIndex_cm - prev2.amnioticFluidIndex_cm) / prevDeltaWeeks;
    const avgInterval = (deltaWeeks + prevDeltaWeeks) / 2;
    afiAcceleration = parseFloat(((afiVelocity - prevAfiVelocity) / avgInterval).toFixed(3));
  }

  let hcVelocity = 0;
  let acVelocity = 0;
  let hcAcRatioVelocity = 0;

  if (current.biometrics?.hc_mm && prev.biometrics?.hc_mm) {
    hcVelocity = parseFloat(((current.biometrics.hc_mm - prev.biometrics.hc_mm) / deltaWeeks).toFixed(2));
  }
  if (current.biometrics?.ac_mm && prev.biometrics?.ac_mm) {
    acVelocity = parseFloat(((current.biometrics.ac_mm - prev.biometrics.ac_mm) / deltaWeeks).toFixed(2));
  }
  if (current.biometrics?.hc_mm && current.biometrics?.ac_mm && prev.biometrics?.hc_mm && prev.biometrics?.ac_mm) {
    const currentRatio = current.biometrics.hc_mm / current.biometrics.ac_mm;
    const prevRatio = prev.biometrics.hc_mm / prev.biometrics.ac_mm;
    hcAcRatioVelocity = parseFloat(((currentRatio - prevRatio) / deltaWeeks).toFixed(3));
  }

  return {
    afiVelocity_cmPerWeek: afiVelocity,
    growthVelocity_percentilePerWeek: growthVelocity,
    efwVelocity_gPerWeek: efwVelocity,
    afiAcceleration_cmPerWeekSq: afiAcceleration,
    hcVelocity_mmPerWeek: hcVelocity,
    acVelocity_mmPerWeek: acVelocity,
    hcAcRatioVelocity_perWeek: hcAcRatioVelocity
  };
}

/**
 * Generates personalized Expected AFI Baseline curve for a patient
 * Based on maternal physiology where AFI peaks around 24-28w (~12-14cm) and gradually tapers to ~10cm by term
 */
export function generatePersonalAfiBaseline(visits: VisitMeasurement[]) {
  const initialAfi = visits.length > 0 ? visits[0].amnioticFluidIndex_cm : 11.0;
  const baselineCurve: { ga: number; expectedAfi: number; p5: number; p95: number }[] = [];

  for (let ga = 20; ga <= 40; ga += 2) {
    // Standard normative curve offset by patient's individualized calibration
    const normative = 14.5 - Math.pow(ga - 26, 2) * 0.035;
    const offset = initialAfi - (14.5 - Math.pow(24 - 26, 2) * 0.035);
    const expected = parseFloat(Math.max(7.0, Math.min(16.0, normative + (offset * 0.5))).toFixed(1));
    baselineCurve.push({
      ga,
      expectedAfi: expected,
      p5: 5.0,
      p95: 24.0
    });
  }
  return baselineCurve;
}

/**
 * Generates Hadlock 50th percentile fetal weight curve
 */
export function generateGrowthBaseline() {
  const curve: { ga: number; p10: number; p50: number; p90: number }[] = [];
  // Hadlock formula approximations for EFW (g)
  const efwTable: Record<number, { p10: number; p50: number; p90: number }> = {
    20: { p10: 280, p50: 330, p90: 380 },
    22: { p10: 430, p50: 500, p90: 570 },
    24: { p10: 580, p50: 670, p90: 760 },
    26: { p10: 780, p50: 910, p90: 1040 },
    28: { p10: 1050, p50: 1210, p90: 1390 },
    30: { p10: 1380, p50: 1590, p90: 1810 },
    32: { p10: 1750, p50: 2020, p90: 2300 },
    34: { p10: 2160, p50: 2500, p90: 2840 },
    36: { p10: 2580, p50: 2980, p90: 3380 },
    38: { p10: 2950, p50: 3400, p90: 3850 },
    40: { p10: 3200, p50: 3680, p90: 4180 },
  };

  for (let ga = 20; ga <= 40; ga += 2) {
    if (efwTable[ga]) {
      curve.push({ ga, ...efwTable[ga] });
    }
  }
  return curve;
}

/**
 * Computes the composite Pregnancy Trajectory Score (0-100)
 * Evaluates growth trajectory, fluid dynamics, trend velocity, and input data confidence
 */
export function calculateTrajectoryScore(
  visits: VisitMeasurement[],
  velocities: TrajectoryVelocity,
  medications?: MedicationExposure[]
): TrajectoryScore {
  if (visits.length === 0) {
    return {
      overallScore: 85,
      growthScore: 85,
      fluidScore: 85,
      trendScore: 85,
      confidenceScore: 90,
      isResearchPrototype: true
    };
  }

  const latest = visits[visits.length - 1];

  // 1. Fluid Score (0-100): normal AFI is 8.0 - 18.0 cm. Oligohydramnios < 5.0 cm.
  let fluidScore = 85;
  if (latest.amnioticFluidIndex_cm >= 10.0 && latest.amnioticFluidIndex_cm <= 18.0) {
    fluidScore = 90;
  } else if (latest.amnioticFluidIndex_cm >= 8.0) {
    fluidScore = 75;
  } else if (latest.amnioticFluidIndex_cm >= 5.0) {
    fluidScore = 55;
  } else {
    fluidScore = 30; // Oligohydramnios
  }

  // Deduct for negative velocity
  if (velocities.afiVelocity_cmPerWeek < -0.4) {
    fluidScore = Math.max(25, fluidScore - 18);
  } else if (velocities.afiVelocity_cmPerWeek < -0.2) {
    fluidScore = Math.max(35, fluidScore - 10);
  }

  // 2. Growth Score (0-100): 10th - 90th percentile is standard normal
  let growthScore = 85;
  if (latest.growthPercentile >= 40 && latest.growthPercentile <= 75) {
    growthScore = 92;
  } else if (latest.growthPercentile >= 25) {
    growthScore = 80;
  } else if (latest.growthPercentile >= 10) {
    growthScore = 60; // Borderline SGA
  } else {
    growthScore = 35; // FGR / SGA (< 10th percentile)
  }

  // Deduct for sharp growth velocity drop
  if (velocities.growthVelocity_percentilePerWeek < -2.0) {
    growthScore = Math.max(30, growthScore - 20);
  } else if (velocities.growthVelocity_percentilePerWeek < -1.0) {
    growthScore = Math.max(40, growthScore - 10);
  }

  // 2.5 Medication pharmacotherapy risk deductions
  let medDeductionFluid = 0;
  let medDeductionGrowth = 0;

  if (medications && medications.length > 0) {
    const active = medications.filter(m => m.exposureStatus === 'current' || m.exposureStatus === 'past');
    active.forEach(med => {
      const name = med.medicationName.toLowerCase();
      // NSAIDs can reduce fetal renal perfusion and reduce amniotic fluid (oligohydramnios)
      if (name.includes('ibuprofen') || name.includes('advil') || name.includes('naproxen') || name.includes('nsaid')) {
        medDeductionFluid += 15;
      }
      // Warfarin / other direct anticoagulants can pose significant hemorrhage risks
      if (name.includes('warfarin') || name.includes('coumadin')) {
        medDeductionGrowth += 20;
      }
      // ACE inhibitors cause severe renal dysgenesis and oligo
      if (name.includes('lisinopril') || name.includes('losartan') || name.includes('enalapril')) {
        medDeductionFluid += 25;
        medDeductionGrowth += 15;
      }
    });
  }

  fluidScore = Math.max(10, fluidScore - medDeductionFluid);
  growthScore = Math.max(10, growthScore - medDeductionGrowth);

  // 3. Trend Score (0-100): Evaluates stability vs deterioration across multiple points
  let trendScore = 88;
  if (visits.length >= 3) {
    const v1 = visits[visits.length - 3];
    const v2 = visits[visits.length - 2];
    const v3 = visits[visits.length - 1];

    const fluidDroppingTwice = v3.amnioticFluidIndex_cm < v2.amnioticFluidIndex_cm && v2.amnioticFluidIndex_cm < v1.amnioticFluidIndex_cm;
    const growthDroppingTwice = v3.growthPercentile < v2.growthPercentile && v2.growthPercentile < v1.growthPercentile;

    if (fluidDroppingTwice && growthDroppingTwice) {
      trendScore = 42;
    } else if (fluidDroppingTwice) {
      trendScore = 54;
    } else if (growthDroppingTwice) {
      trendScore = 50;
    } else {
      trendScore = 90;
    }
  }

  // 4. Confidence Score: based on measurement quality and ultrasound confidence
  const avgConfidence = visits.reduce((sum, v) => sum + (v.sourceConfidence || 0.9), 0) / visits.length;
  const confidenceScore = Math.round(avgConfidence * 100);

  // Overall Weighted Score
  const overall = Math.round(
    growthScore * 0.35 +
    fluidScore * 0.35 +
    trendScore * 0.20 +
    confidenceScore * 0.10
  );

  return {
    overallScore: Math.min(100, Math.max(10, overall)),
    growthScore: Math.round(growthScore),
    fluidScore: Math.round(fluidScore),
    trendScore: Math.round(trendScore),
    confidenceScore: Math.min(100, Math.max(60, confidenceScore)),
    isResearchPrototype: true
  };
}

/**
 * Signature Feature: The "WHY NOW?" Engine
 * Compares latest visit against historical trajectory rather than just static cutoff.
 */
export function evaluateWhyNow(
  visits: VisitMeasurement[],
  velocities: TrajectoryVelocity
): WhyNowAlert {
  if (visits.length < 2) {
    return {
      triggered: false,
      severity: 'info',
      title: 'Baseline Scan Established',
      summary: 'Initial baseline scan recorded. Trajectory trend engine will activate upon next sequential scan.',
      reasons: ['Initial baseline recorded', 'Awaiting second longitudinal visit to establish velocity'],
      afiDeltaText: 'N/A',
      growthDeltaText: 'N/A',
      consecutiveDropsCount: 0,
      confidence: 92,
      baselineDeviation_cm: 0,
      primaryContributor: 'Fluid Trajectory'
    };
  }

  const sorted = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  const current = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  // 1D Kalman Filter on serial biometrics to eliminate noise from manual sonographer caliper placement
  const afiList = sorted.map(v => v.amnioticFluidIndex_cm);
  const growthList = sorted.map(v => v.growthPercentile);
  
  // Q=0.15 (physiological change rate limits), R=1.20 (operator/machine noise)
  const kalmanAfiList = applyKalmanFilter(afiList, 0.15, 1.20);
  const kalmanGrowthList = applyKalmanFilter(growthList, 0.20, 1.50);

  const currentFilteredAfi = kalmanAfiList[kalmanAfiList.length - 1];
  const prevFilteredAfi = kalmanAfiList[kalmanAfiList.length - 2];

  const currentFilteredGrowth = kalmanGrowthList[kalmanGrowthList.length - 1];
  const prevFilteredGrowth = kalmanGrowthList[kalmanGrowthList.length - 2];

  const afiDiff = currentFilteredAfi - prevFilteredAfi;
  const afiPctChange = Math.round((afiDiff / prevFilteredAfi) * 100);
  const growthDiff = currentFilteredGrowth - prevFilteredGrowth;

  // Detect if Kalman Filter prevented a false-positive alarm
  const rawAfiAlert = current.amnioticFluidIndex_cm < 8.0;
  const kalmanAfiAlert = currentFilteredAfi < 8.0;
  const rawGrowthAlert = current.growthPercentile < 15;
  const kalmanGrowthAlert = currentFilteredGrowth < 15;

  const falseAlarmsSuppressed = (rawAfiAlert && !kalmanAfiAlert) || (rawGrowthAlert && !kalmanGrowthAlert);
  let suppressionDetails = '';
  if (rawAfiAlert && !kalmanAfiAlert) {
    suppressionDetails += `Damped artificial drop in Amniotic Fluid Index (Raw: ${current.amnioticFluidIndex_cm}cm, Kalman: ${currentFilteredAfi.toFixed(1)}cm). `;
  }
  if (rawGrowthAlert && !kalmanGrowthAlert) {
    suppressionDetails += `Smoothed sonographer caliper deviation in fetal weight percentile (Raw: ${current.growthPercentile}th, Kalman: ${Math.round(currentFilteredGrowth)}th). `;
  }

  const kalmanFilterRecord: import('../types').KalmanFilterRecord = {
    noiseDampened: true,
    rawAfi: current.amnioticFluidIndex_cm,
    filteredAfi: currentFilteredAfi,
    rawGrowth: current.growthPercentile,
    filteredGrowth: currentFilteredGrowth,
    falseAlarmsSuppressed,
    suppressionDetails: falseAlarmsSuppressed ? suppressionDetails.trim() : 'Fetal trajectory conforms to biological constraints.'
  };

  // Check consecutive drops in AFI, SDP, and Growth
  let consecutiveFluidDrops = 0;
  let consecutiveGrowthDrops = 0;
  let consecutiveSdpDrops = 0;

  for (let i = kalmanAfiList.length - 1; i >= 1; i--) {
    if (kalmanAfiList[i] < kalmanAfiList[i - 1]) {
      consecutiveFluidDrops++;
    } else {
      break;
    }
  }

  for (let i = sorted.length - 1; i >= 1; i--) {
    if (sorted[i].singleDeepestPocket_cm < sorted[i - 1].singleDeepestPocket_cm) {
      consecutiveSdpDrops++;
    } else {
      break;
    }
  }

  for (let i = kalmanGrowthList.length - 1; i >= 1; i--) {
    if (kalmanGrowthList[i] < kalmanGrowthList[i - 1]) {
      consecutiveGrowthDrops++;
    } else {
      break;
    }
  }

  const sdpValues = sorted.map(v => v.singleDeepestPocket_cm.toFixed(1));
  const sdpSequenceText = sdpValues.join(' → ') + ' cm';

  const reasons: string[] = [];
  const contributingFactors: import('../types').ContributingFactor[] = [];
  let severity: 'info' | 'warning' | 'critical' = 'info';
  let triggered = false;
  let primaryContributor: 'Fluid Trajectory' | 'Growth Trajectory' | 'Combined Dynamics' = 'Fluid Trajectory';

  // Format Delta texts
  const afiDeltaSymbol = afiDiff < 0 ? '↓' : afiDiff > 0 ? '↑' : '→';
  const afiDeltaText = `${prev.amnioticFluidIndex_cm.toFixed(1)} cm → ${current.amnioticFluidIndex_cm.toFixed(1)} cm (${afiDeltaSymbol} ${Math.abs(afiPctChange)}%)`;

  const growthDeltaSymbol = growthDiff < 0 ? '↓' : growthDiff > 0 ? '↑' : '→';
  const growthDeltaText = `${prev.growthPercentile}th → ${current.growthPercentile}th (${growthDeltaSymbol} ${Math.abs(growthDiff)} percentile pts)`;

  // Evaluate Fluid Alerts (SDP / AFI serial decline)
  if ((consecutiveFluidDrops >= 2 || consecutiveSdpDrops >= 2) && (afiPctChange <= -12 || current.amnioticFluidIndex_cm < 8.5 || current.singleDeepestPocket_cm < 3.5)) {
    triggered = true;
    severity = (current.amnioticFluidIndex_cm < 8.0 || current.singleDeepestPocket_cm < 3.0) ? 'critical' : 'warning';
    
    if (consecutiveSdpDrops >= 2) {
      reasons.push(`SDP decreased progressively across serial visits (${sdpSequenceText})`);
      contributingFactors.push({
        label: `↓ SDP declining over ${sorted.length} visits (${sdpSequenceText})`,
        direction: 'down',
        impact: 'high'
      });
    }

    reasons.push(`AFI decreased by ${Math.abs(afiPctChange)}% from previous scan (${velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/week velocity)`);
    contributingFactors.push({
      label: `↓ AFI rate of decline (${velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/wk)`,
      direction: 'down',
      impact: 'high'
    });

    primaryContributor = 'Fluid Trajectory';
  }

  // Evaluate Growth Alerts (Hadlock / AC deceleration)
  if (consecutiveGrowthDrops >= 2 || growthDiff <= -10) {
    triggered = true;
    severity = (current.growthPercentile < 15 || growthDiff <= -18) ? 'critical' : severity;
    reasons.push(`Growth percentile plummeted from ${sorted[0].growthPercentile}th to ${current.growthPercentile}th percentile across serial scans`);
    if (consecutiveGrowthDrops >= 2) {
      reasons.push(`Persistent downward fetal growth trajectory across ${consecutiveGrowthDrops} consecutive scans`);
    }

    contributingFactors.push({
      label: `↓ Fetal growth percentile drop (${sorted[0].growthPercentile}% → ${current.growthPercentile}%)`,
      direction: 'down',
      impact: 'high'
    });

    contributingFactors.push({
      label: `↓ Growth velocity deceleration (${velocities.growthVelocity_percentilePerWeek.toFixed(1)} %ile/wk)`,
      direction: 'down',
      impact: 'high'
    });

    if (current.biometrics?.ac_mm && prev.biometrics?.ac_mm) {
      contributingFactors.push({
        label: `↓ Abdominal Circumference (AC: ${prev.biometrics.ac_mm}mm → ${current.biometrics.ac_mm}mm) trajectory lag`,
        direction: 'down',
        impact: 'moderate'
      });
    }

    primaryContributor = (consecutiveFluidDrops >= 2 || consecutiveSdpDrops >= 2) ? 'Combined Dynamics' : 'Growth Trajectory';
  }

  // Single visit sudden anomaly
  if (current.amnioticFluidIndex_cm < 8.0 && !triggered) {
    triggered = true;
    severity = 'warning';
    reasons.push(`Current AFI (${current.amnioticFluidIndex_cm} cm) is below normal threshold (8.0 cm)`);
    contributingFactors.push({
      label: `↓ AFI below physiological threshold (8.0 cm)`,
      direction: 'down',
      impact: 'moderate'
    });
  }

  // Symmetrical vs Asymmetrical IUGR / FGR classification using HC/AC ratio tracking
  let iugrClassification: import('../types').IugrClassification = {
    type: 'none',
    confidence: 0
  };

  if (current.growthPercentile < 25 || growthDiff <= -8 || (velocities.acVelocity_mmPerWeek !== undefined && velocities.acVelocity_mmPerWeek < 6.0 && velocities.acVelocity_mmPerWeek !== 0)) {
    if (current.biometrics?.hc_mm && current.biometrics?.ac_mm) {
      const hc = current.biometrics.hc_mm;
      const ac = current.biometrics.ac_mm;
      const ratio = hc / ac;
      
      const hcVel = velocities.hcVelocity_mmPerWeek || 0;
      const acVel = velocities.acVelocity_mmPerWeek || 0;
      
      // Asymmetrical FGR (Brain-Sparing):
      // 1. Current ratio is elevated (ratio >= 1.13)
      // 2. OR Longitudinal velocity deviation: AC growth velocity drops significantly (< 6.0 mm/wk) while HC velocity remains relatively preserved (>= 3.5 mm/wk)
      const isAsymmetricalByRatio = ratio >= 1.13;
      const isAsymmetricalByVelocity = acVel < 6.0 && hcVel >= 3.5 && velocities.acVelocity_mmPerWeek !== 0;
      const isAsymmetrical = isAsymmetricalByRatio || isAsymmetricalByVelocity;
      
      iugrClassification = {
        type: isAsymmetrical ? 'asymmetrical' : 'symmetrical',
        confidence: Math.round(92 - (current.sourceConfidence * 10)),
        hcAcRatio: parseFloat(ratio.toFixed(3)),
        description: isAsymmetrical
          ? `Asymmetrical Deviation: Brain-Sparing Effect detected. Prominent head size relative to abdominal circumference (HC/AC: ${ratio.toFixed(2)}). Longitudinal velocity analysis reveals Abdominal growth (AC velocity: ${acVel.toFixed(1)}mm/wk) is decelerating significantly while Head circumference (HC velocity: ${hcVel.toFixed(1)}mm/wk) remains stable on its population curve. This strongly indicates placental starvation.`
          : `Symmetrical Delay: Proportional reduction in both Head (HC: ${hc}mm) and Abdomen (AC: ${ac}mm). Longitudinal velocities are uniformly scaled down (HC velocity: ${hcVel.toFixed(1)}mm/wk, AC velocity: ${acVel.toFixed(1)}mm/wk). HC/AC ratio is proportional (${ratio.toFixed(2)}). Suggests early-gestation baseline or constitutional factor.`
      };
      
      // Push specific reasoning
      reasons.push(`Longitudinal biometrics: HC velocity ${hcVel.toFixed(1)}mm/wk vs AC velocity ${acVel.toFixed(1)}mm/wk`);
      reasons.push(`HC/AC Ratio at ${ratio.toFixed(2)} is classified as ${isAsymmetrical ? 'Asymmetrical Deviation: Brain-Sparing Effect detected' : 'Symmetrical FGR'}`);
      
      contributingFactors.push({
        label: `Biometric Ratio: HC/AC of ${ratio.toFixed(2)} (${isAsymmetrical ? 'Brain-Sparing' : 'Symmetrical'})`,
        direction: isAsymmetrical ? 'up' : 'neutral',
        impact: 'high'
      });

      if (isAsymmetrical) {
        contributingFactors.push({
          label: `Brain-Sparing Velocity: AC lag (${acVel.toFixed(1)} mm/wk) vs HC (${hcVel.toFixed(1)} mm/wk)`,
          direction: 'down',
          impact: 'high'
        });
      }
    }
  }

  if (!triggered) {
    return {
      triggered: false,
      severity: 'info',
      title: 'Stable Trajectory Observed',
      summary: 'Serial measurements track within expected personalized physiological tolerances across visits. Fetal growth and amniotic volume show concordant maintenance.',
      reasons: [
        'AFI & SDP stable within expected personal baseline',
        'Fetal growth percentile maintains consistent velocity',
        'No multi-visit downward trajectory detected'
      ],
      afiDeltaText,
      growthDeltaText,
      consecutiveDropsCount: 0,
      confidence: 94,
      baselineDeviation_cm: parseFloat((currentFilteredAfi - 10.5).toFixed(1)),
      primaryContributor: 'Fluid Trajectory',
      contributingFactors: [
        { label: 'Amniotic fluid maintenance (Physiological)', direction: 'neutral', impact: 'low' },
        { label: 'EFW growth velocity (Normal tracking)', direction: 'neutral', impact: 'low' }
      ],
      recommendedAction: 'Continue standard antenatal care schedule. Re-evaluate serial biometrics at scheduled interval.',
      sdpSequenceText,
      iugrClassification,
      kalmanFilterRecord
    };
  }

  const title = severity === 'critical' 
    ? 'Critical Multi-Visit Trajectory Alert' 
    : 'Elevated Longitudinal Trend Deviation';

  const summary = primaryContributor === 'Fluid Trajectory'
    ? `Risk increased primarily because SDP decreased across serial consecutive visits (${sdpSequenceText}) and amniotic fluid volume declined at ${velocities.afiVelocity_cmPerWeek.toFixed(2)} cm/week.`
    : primaryContributor === 'Growth Trajectory'
    ? `Risk increased primarily because fetal growth percentile dropped from ${sorted[0].growthPercentile}% to ${current.growthPercentile}% over sequential scans indicating progressive growth deceleration.`
    : `Risk increased due to concurrent declines in both amniotic fluid volume (${sdpSequenceText}) and fetal growth percentile (${growthDeltaText}).`;

  const recommendedAction = 'Review latest ultrasound and clinical findings. Consider Doppler velocimetry (UA/MCA PI) and interval growth surveillance. Phrased as clinical decision support, not autonomous diagnosis.';

  return {
    triggered: true,
    severity,
    title,
    summary,
    reasons,
    afiDeltaText,
    growthDeltaText,
    consecutiveDropsCount: Math.max(consecutiveFluidDrops, consecutiveGrowthDrops, consecutiveSdpDrops),
    confidence: Math.round(current.sourceConfidence * 92),
    baselineDeviation_cm: parseFloat((currentFilteredAfi - 10.5).toFixed(1)),
    primaryContributor,
    contributingFactors,
    recommendedAction,
    sdpSequenceText,
    iugrClassification,
    kalmanFilterRecord
  };
}

/**
 * Forecasting Engine: Project next visit (e.g. +3-4 weeks)
 * Based on linear rate of change with conservative damping and uncertainty bounds
 */
export function forecastNextVisit(
  visits: VisitMeasurement[],
  velocities: TrajectoryVelocity
): NextVisitForecast {
  const latest = visits[visits.length - 1];
  const deltaWeeksAhead = 4;
  const targetGa = latest ? latest.gestationalAgeWeeks + deltaWeeksAhead : 36;

  if (visits.length < 2) {
    return {
      expectedGaWeeks: targetGa,
      expectedAfiRange: [9.5, 12.0],
      expectedGrowthPercentileRange: [40, 50],
      expectedEfwRange_g: [latest ? latest.estimatedFetalWeight_g + 750 : 2500, latest ? latest.estimatedFetalWeight_g + 950 : 2750],
      predictedTrajectory: 'STABLE',
      forecastConfidence: 70,
      disclaimer: 'Prototype projection based on single baseline visit. Requires serial data for personalized accuracy.'
    };
  }

  // Damped linear extrapolation
  const damping = 0.8;
  const projectedAfiDelta = velocities.afiVelocity_cmPerWeek * deltaWeeksAhead * damping;
  const centerAfi = Math.max(4.0, latest.amnioticFluidIndex_cm + projectedAfiDelta);
  const afiMargin = 0.7; // uncertainty spread

  const projectedGrowthDelta = velocities.growthVelocity_percentilePerWeek * deltaWeeksAhead * damping;
  const centerGrowth = Math.max(5, Math.min(95, latest.growthPercentile + projectedGrowthDelta));
  const growthMargin = 5;

  const expectedEfw = latest.estimatedFetalWeight_g + (velocities.efwVelocity_gPerWeek > 50 ? velocities.efwVelocity_gPerWeek * deltaWeeksAhead : 800);

  let predictedTrajectory: 'STABLE' | 'DECLINING' | 'RECOVERING' = 'STABLE';
  if (velocities.afiVelocity_cmPerWeek < -0.25 || velocities.growthVelocity_percentilePerWeek < -1.5) {
    predictedTrajectory = 'DECLINING';
  } else if (velocities.afiVelocity_cmPerWeek > 0.3 && latest.amnioticFluidIndex_cm < 9.0) {
    predictedTrajectory = 'RECOVERING';
  }

  const confidence = visits.length >= 3 ? 84 : 72;

  return {
    expectedGaWeeks: targetGa,
    expectedAfiRange: [
      parseFloat(Math.max(3.0, centerAfi - afiMargin).toFixed(1)),
      parseFloat(Math.max(3.5, centerAfi + afiMargin).toFixed(1))
    ],
    expectedGrowthPercentileRange: [
      Math.max(1, Math.round(centerGrowth - growthMargin)),
      Math.min(99, Math.round(centerGrowth + growthMargin))
    ],
    expectedEfwRange_g: [
      Math.round(expectedEfw - 120),
      Math.round(expectedEfw + 140)
    ],
    predictedTrajectory,
    forecastConfidence: confidence,
    disclaimer: 'Research & decision-support forecast only. Not an autonomous clinical prediction or diagnostic mandate.'
  };
}

/**
 * Counterfactual / What-If Analysis
 * Doctor can test hypotheses: "What if AFI recovers to 9.5?" or "What if growth drops to 20th?"
 */
export function simulateCounterfactual(
  visits: VisitMeasurement[],
  hypotheticalAfi: number,
  hypotheticalGrowthPercentile: number
): {
  simulatedScore: TrajectoryScore;
  simulatedCategory: TrajectoryCategory;
  simulatedRisk: RiskLevel;
  primaryDrivingFactor: string;
} {
  if (visits.length === 0) {
    return {
      simulatedScore: {
        overallScore: 80,
        growthScore: 80,
        fluidScore: 80,
        trendScore: 80,
        confidenceScore: 90,
        isResearchPrototype: true
      },
      simulatedCategory: 'STABLE',
      simulatedRisk: 'LOW',
      primaryDrivingFactor: 'Insufficient Data'
    };
  }

  // Clone visits and override latest with hypothetical values
  const simulatedVisits: VisitMeasurement[] = JSON.parse(JSON.stringify(visits));
  const latest = simulatedVisits[simulatedVisits.length - 1];
  latest.amnioticFluidIndex_cm = hypotheticalAfi;
  latest.growthPercentile = hypotheticalGrowthPercentile;

  const simVelocities = calculateVelocities(simulatedVisits);
  const simScore = calculateTrajectoryScore(simulatedVisits, simVelocities);

  let simulatedCategory: TrajectoryCategory = 'STABLE';
  let simulatedRisk: RiskLevel = 'LOW';

  if (simScore.overallScore < 60) {
    simulatedRisk = 'HIGH';
    if (simScore.fluidScore < simScore.growthScore) {
      simulatedCategory = 'FLUID_DECLINE';
    } else {
      simulatedCategory = 'GROWTH_DEVIATION';
    }
  } else if (simScore.overallScore < 75) {
    simulatedRisk = 'WATCH';
    if (simScore.fluidScore < 70) simulatedCategory = 'FLUID_DECLINE';
    else if (simScore.growthScore < 70) simulatedCategory = 'GROWTH_DEVIATION';
  }

  // Determine driving factor
  const fluidImpact = 90 - simScore.fluidScore;
  const growthImpact = 90 - simScore.growthScore;
  const primaryDrivingFactor = fluidImpact > growthImpact 
    ? `Amniotic Fluid Dynamics (impact weight ${fluidImpact})` 
    : `Fetal Growth Velocity (impact weight ${growthImpact})`;

  return {
    simulatedScore: simScore,
    simulatedCategory,
    simulatedRisk,
    primaryDrivingFactor
  };
}

/**
 * 1D Kalman Filter to filter out sonographer caliper/measurement noise.
 * Combines process variance (fetal physiological dynamics) and measurement variance (ultrasound machine / operator error margins).
 */
export function applyKalmanFilter(
  measurements: number[],
  processVarianceQ: number,
  measurementVarianceR: number
): number[] {
  if (!measurements || measurements.length === 0) return [];
  
  const filtered: number[] = [];
  // Standardize inputs, replace null/undefined/NaN with 0 safely
  const cleanMeasurements = measurements.map(m => {
    if (m === undefined || m === null || isNaN(m)) return 0;
    return m;
  });

  // Initialize state with first measurement
  let x_est = cleanMeasurements[0];
  let p_est = 1.0; // initial estimation error variance

  filtered.push(parseFloat(x_est.toFixed(2)));

  for (let i = 1; i < cleanMeasurements.length; i++) {
    // 1. Predict
    const x_pred = x_est;
    const p_pred = p_est + processVarianceQ;

    // 2. Update
    const z = cleanMeasurements[i];
    const k_gain = p_pred / (p_pred + measurementVarianceR);
    x_est = x_pred + k_gain * (z - x_pred);
    p_est = (1.0 - k_gain) * p_pred;

    filtered.push(parseFloat(x_est.toFixed(2)));
  }

  return filtered;
}

export interface HcAcAnalysisResult {
  hasMultipleVisits: boolean;
  hcAcRatioSeries: { ga: number; ratio: number; ratioSmoothed: number; status: 'normal' | 'elevated' | 'depressed'; bpd: number; hc: number; ac: number; fl: number }[];
  asymmetryTrend: 'stable' | 'increasing' | 'decreasing' | 'none';
  latestRatio: number;
  latestRatioSmoothed: number;
  latestStatus: 'normal' | 'elevated' | 'depressed';
  classification: 'none' | 'asymmetrical' | 'symmetrical';
  confidence: number;
  clinicalExplanation: string;
  recommendations: string[];
}

export function calculateLongitudinalHcAcAnalysis(visits: VisitMeasurement[]): HcAcAnalysisResult {
  const sorted = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);
  
  // Apply Kalman smoothing over full longitudinal sequence to get smoothed values
  let smoothedVisits: any[] = [];
  try {
    smoothedVisits = smoothLongitudinalVisits(sorted);
  } catch (err) {
    console.error('Failed to smooth visits with Kalman Filter in trajectoryEngine:', err);
    smoothedVisits = sorted; // Fallback to raw visits
  }

  const series: { ga: number; ratio: number; ratioSmoothed: number; status: 'normal' | 'elevated' | 'depressed'; bpd: number; hc: number; ac: number; fl: number }[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const v = sorted[i];
    const sv = smoothedVisits[i] || v;
    
    // Raw measurements
    const hcRaw = v.biometrics?.hc_mm;
    const acRaw = v.biometrics?.ac_mm;
    
    // Smoothed measurements
    const hcSmoothed = sv.biometrics?.hc_mm || hcRaw;
    const acSmoothed = sv.biometrics?.ac_mm || acRaw;

    if (hcRaw && acRaw && acRaw > 0) {
      const ratioRaw = hcRaw / acRaw;
      const ratioSmoothed = (hcSmoothed && acSmoothed && acSmoothed > 0) ? (hcSmoothed / acSmoothed) : ratioRaw;
      
      const ga = v.gestationalAgeWeeks + (v.gestationalAgeDays || 0) / 7;
      
      // Clinical categorization thresholds for asymmetrical growth (brain-sparing)
      let status: 'normal' | 'elevated' | 'depressed' = 'normal';
      if (ga >= 34) {
        if (ratioSmoothed >= 1.10) status = 'elevated';
        else if (ratioSmoothed < 0.85) status = 'depressed';
      } else if (ga >= 28) {
        if (ratioSmoothed >= 1.15) status = 'elevated';
        else if (ratioSmoothed < 0.90) status = 'depressed';
      } else {
        if (ratioSmoothed >= 1.25) status = 'elevated';
        else if (ratioSmoothed < 0.95) status = 'depressed';
      }
      
      series.push({
        ga: parseFloat(ga.toFixed(1)),
        ratio: parseFloat(ratioRaw.toFixed(3)),
        ratioSmoothed: parseFloat(ratioSmoothed.toFixed(3)),
        status,
        bpd: v.biometrics?.bpd_mm || 0,
        hc: hcRaw,
        ac: acRaw,
        fl: v.biometrics?.fl_mm || 0
      });
    }
  }
  
  if (series.length === 0) {
    return {
      hasMultipleVisits: false,
      hcAcRatioSeries: [],
      asymmetryTrend: 'none',
      latestRatio: 0,
      latestRatioSmoothed: 0,
      latestStatus: 'normal',
      classification: 'none',
      confidence: 0,
      clinicalExplanation: 'Insufficient caliper measurements (HC and AC) to track asymmetrical growth trends.',
      recommendations: ['Capture both Head Circumference and Abdominal Circumference measurements during the next sonogram.']
    };
  }
  
  const latest = series[series.length - 1];
  const lastVisitObj = sorted[sorted.length - 1];
  
  let trend: 'stable' | 'increasing' | 'decreasing' | 'none' = 'none';
  if (series.length >= 2) {
    const first = series[0];
    const diff = latest.ratioSmoothed - first.ratioSmoothed;
    if (Math.abs(diff) < 0.03) {
      trend = 'stable';
    } else if (diff > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
  }
  
  // Asymmetrical Fetal Growth Restriction (FGR / Brain-Sparing) Detection Logic:
  // 1. Fetal growth restriction is suspected if fetal weight percentile is restricted (< 15th percentile),
  //    OR if there is a massive drop in growth velocity (e.g. drop of >= 15 percentiles).
  const isGrowthRestricted = lastVisitObj.growthPercentile < 15 || 
    (sorted.length >= 2 && lastVisitObj.growthPercentile - sorted[0].growthPercentile <= -15);
  
  let classification: 'none' | 'asymmetrical' | 'symmetrical' = 'none';
  let clinicalExplanation = 'Normative fetal growth pattern. Symmetric development of skeletal, abdominal, and cranial biometry is stable along the growth curve.';
  const recommendations: string[] = [];
  
  if (isGrowthRestricted) {
    if (latest.status === 'elevated' || (series.length >= 2 && trend === 'increasing')) {
      classification = 'asymmetrical';
      clinicalExplanation = `Asymmetrical Fetal Growth Restriction (FGR / SUSPECTED Brain-Sparing Effect). Fetal head circumference remains preserved while abdominal circumference is significantly lagging (latest HC/AC ratio: ${latest.ratioSmoothed.toFixed(2)} is elevated for ${Math.floor(latest.ga)}w gestation). This is highly suggestive of late-onset placental insufficiency where arterial blood flow is preferentially redirected to preserve cerebral development.`;
      
      recommendations.push(
        'Schedule Umbilical Artery (UA) and Middle Cerebral Artery (MCA) Doppler assessments twice weekly to compute Cerebroplacental Ratio (CPR).',
        'Initiate biweekly Manning Biophysical Profiles (BPP) and non-stress testing (NST) for real-time fetal surveillance.',
        'Monitor maternal blood pressures daily to screen for emerging preeclampsia or gestational hypertension.',
        'Optimize maternal nutrition and schedule follow-up MFM level II sonogram in 10-14 days to monitor trajectory velocity.'
      );
    } else {
      classification = 'symmetrical';
      clinicalExplanation = `Symmetrical Fetal Growth Restriction (FGR). Proportional size reduction across all biometrics, including femur length, abdominal circumference, and cranial circumferences. The HC/AC ratio (${latest.ratioSmoothed.toFixed(2)}) remains in the normative range, suggesting a global, early-onset constraint. This pattern commonly points to early first-trimester baseline limits, genetic/constitutional constraints, or chronic maternal vascular factors.`;
      
      recommendations.push(
        'Perform detailed structural anatomical ultrasound review (Level II sonogram) to screen for dysmorphology.',
        'Consider maternal serum screening, karyotype/microarray consultations, and TORCH infectious workup if early-onset FGR is confirmed.',
        'Monitor amniotic fluid volume (AFI/SDP) weekly to verify placental reserve remains stable.',
        'Monitor fetal development every 2-3 weeks. Delivery timing should be guided strictly by Doppler status.'
      );
    }
  } else {
    if (latest.status === 'elevated') {
      clinicalExplanation = `Constitutional asymmetry trend detected. Fetal growth percentiles remain reassuring (${lastVisitObj.growthPercentile}th percentile), but HC/AC ratio (${latest.ratioSmoothed.toFixed(2)}) is marginally elevated. This pattern may represent constitutional variance without placental distress.`;
      recommendations.push('Re-evaluate caliper placement on the next routine ultrasound to rule out operator measurement error.');
    } else {
      clinicalExplanation = `Symmetric, reassuring fetal growth. Cranial growth (HC: ${latest.hc}mm) and abdominal development (AC: ${latest.ac}mm) are tracking in balanced symmetry (HC/AC: ${latest.ratioSmoothed.toFixed(2)}) at ${Math.floor(latest.ga)} weeks.`;
    }
    recommendations.push('Continue standard prenatal care and follow-up clinical sonograms as scheduled.');
  }
  
  const confidence = Math.round(
    Math.min(98, Math.max(70, (lastVisitObj.sourceConfidence || 0.9) * 100 - (series.length < 3 ? 10 : 0)))
  );
  
  return {
    hasMultipleVisits: series.length >= 2,
    hcAcRatioSeries: series,
    asymmetryTrend: trend,
    latestRatio: latest.ratio,
    latestRatioSmoothed: latest.ratioSmoothed,
    latestStatus: latest.status,
    classification,
    confidence,
    clinicalExplanation,
    recommendations
  };
}

/**
 * Parse dosage string into numeric milligrams
 */
export function parseDoseNumeric(dose: string): number {
  if (!dose) return 0;
  const match = dose.match(/(\d+(?:\.\d+)?)\s*(?:mg|g|mcg|ml)?/i);
  if (!match) return 0;
  let val = parseFloat(match[1]);
  if (dose.toLowerCase().includes('mcg')) val = val / 1000;
  if (dose.toLowerCase().includes(' g') || dose.toLowerCase().endsWith('g')) val = val * 1000;
  return val;
}

/**
 * Parse frequency string into daily frequency count
 */
export function parseFrequencyNumeric(freq: string): number {
  if (!freq) return 1;
  const f = freq.toLowerCase();
  if (f.includes('twice') || f.includes('bid') || f.includes('2x')) return 2;
  if (f.includes('three') || f.includes('tid') || f.includes('3x')) return 3;
  if (f.includes('four') || f.includes('qid') || f.includes('4x')) return 4;
  if (f.includes('bedtime') || f.includes('daily') || f.includes('qd') || f.includes('once')) return 1;
  if (f.includes('weekly')) return 1 / 7;
  if (f.includes('other day') || f.includes('qod')) return 0.5;
  return 1;
}

/**
 * Engineer medication features for risk-analysis pipeline (XGBoost)
 */
export function engineerMedicationFeatures(meds: any[], currentGaWeeks: number) {
  if (!meds || meds.length === 0) {
    return {
      hasActiveExposure: 0,
      activeMedCount: 0,
      totalExposureDurationWeeks: 0,
      maxDoseMg: 0,
      maxFrequencyDaily: 0,
      exposedTrimestersCount: 0,
      avgDaysSinceStart: 0
    };
  }

  const activeMeds = meds.filter(m => m.exposureStatus === 'current');
  const totalDuration = meds.reduce((sum, m) => {
    const end = m.gestationalAgeStopWeeks || currentGaWeeks;
    return sum + Math.max(0, end - m.gestationalAgeStartWeeks);
  }, 0);

  const doses = meds.map(m => parseDoseNumeric(m.dose));
  const freqs = meds.map(m => parseFrequencyNumeric(m.frequency));
  const trimesters = new Set(meds.map(m => m.trimester));

  const daysSinceStart = meds.reduce((sum, m) => {
    return sum + Math.max(0, (currentGaWeeks - m.gestationalAgeStartWeeks) * 7);
  }, 0);

  return {
    hasActiveExposure: activeMeds.length > 0 ? 1 : 0,
    activeMedCount: activeMeds.length,
    totalExposureDurationWeeks: parseFloat(totalDuration.toFixed(1)),
    maxDoseMg: doses.length > 0 ? Math.max(...doses) : 0,
    maxFrequencyDaily: freqs.length > 0 ? Math.max(...freqs) : 0,
    exposedTrimestersCount: trimesters.size,
    avgDaysSinceStart: meds.length > 0 ? parseFloat((daysSinceStart / meds.length).toFixed(1)) : 0
  };
}

/**
 * Levels 1 & 2 Medication Impact Engine: Temporal Analysis and Verification
 */
export function evaluateMedicationTemporalAssociation(visits: VisitMeasurement[], meds: any[]) {
  if (visits.length === 0 || !meds || meds.length === 0) return [];

  const associations: any[] = [];
  const sortedVisits = [...visits].sort((a, b) => a.gestationalAgeWeeks - b.gestationalAgeWeeks);

  meds.forEach(med => {
    const startW = med.gestationalAgeStartWeeks;
    const stopW = med.gestationalAgeStopWeeks || 40;

    // Filter scans before start date
    const scansBefore = sortedVisits.filter(v => v.gestationalAgeWeeks < startW);
    // Filter scans after start date (overlapping with medication duration)
    const scansDuringAfter = sortedVisits.filter(v => v.gestationalAgeWeeks >= startW && v.gestationalAgeWeeks <= stopW);

    let beforeAfiAverage = 0;
    let beforeGrowthAverage = 0;
    if (scansBefore.length > 0) {
      beforeAfiAverage = scansBefore.reduce((sum, v) => sum + v.amnioticFluidIndex_cm, 0) / scansBefore.length;
      beforeGrowthAverage = scansBefore.reduce((sum, v) => sum + v.growthPercentile, 0) / scansBefore.length;
    }

    let duringAfiAverage = 0;
    let duringGrowthAverage = 0;
    if (scansDuringAfter.length > 0) {
      duringAfiAverage = scansDuringAfter.reduce((sum, v) => sum + v.amnioticFluidIndex_cm, 0) / scansDuringAfter.length;
      duringGrowthAverage = scansDuringAfter.reduce((sum, v) => sum + v.growthPercentile, 0) / scansDuringAfter.length;
    }

    const hasBeforeAndAfter = scansBefore.length > 0 && scansDuringAfter.length > 0;
    const afiDelta = duringAfiAverage - beforeAfiAverage;
    const growthDelta = duringGrowthAverage - beforeGrowthAverage;

    let correlationText = "Stable longitudinal trend aligned; continue surveillance.";
    let correlationSeverity: 'stable' | 'watch' | 'improve' = 'stable';

    if (hasBeforeAndAfter) {
      if (afiDelta < -1.5 && growthDelta < -10) {
        correlationText = `Significant concurrent drop in AFI (${afiDelta.toFixed(1)} cm) and growth percentile (${growthDelta.toFixed(1)} points) observed after starting ${med.medicationName}.`;
        correlationSeverity = 'watch';
      } else if (afiDelta < -1.5) {
        correlationText = `Decrease in Amniotic Fluid Index (mean drop ${Math.abs(afiDelta).toFixed(1)} cm) observed after starting ${med.medicationName}.`;
        correlationSeverity = 'watch';
      } else if (growthDelta < -10) {
        correlationText = `Fetal growth velocity deceleration (mean drop ${Math.abs(growthDelta).toFixed(1)}th %ile) observed after starting ${med.medicationName}.`;
        correlationSeverity = 'watch';
      } else if (growthDelta > 5) {
        correlationText = `Positive growth percentile acceleration (mean increase +${growthDelta.toFixed(1)} %ile) observed following ${med.medicationName} initiation.`;
        correlationSeverity = 'improve';
      }
    } else {
      correlationText = `Medication started at week ${startW}. Insufficient pre-exposure scans to calculate temporal baseline shifts.`;
    }

    associations.push({
      medicationId: med.id,
      medicationName: med.medicationName,
      dose: med.dose,
      gestationalAgeStartWeeks: startW,
      gestationalAgeStopWeeks: med.gestationalAgeStopWeeks,
      scansBeforeCount: scansBefore.length,
      scansDuringCount: scansDuringAfter.length,
      beforeAfi: beforeAfiAverage ? parseFloat(beforeAfiAverage.toFixed(1)) : null,
      duringAfi: duringAfiAverage ? parseFloat(duringAfiAverage.toFixed(1)) : null,
      beforeGrowth: beforeGrowthAverage ? Math.round(beforeGrowthAverage) : null,
      duringGrowth: duringGrowthAverage ? Math.round(duringGrowthAverage) : null,
      afiDelta: beforeAfiAverage ? parseFloat(afiDelta.toFixed(1)) : 0,
      growthDelta: beforeGrowthAverage ? Math.round(growthDelta) : 0,
      correlationText,
      correlationSeverity,
      confidence: med.confidence || 'Extracted',
      prescriber: med.prescriber || 'Not specified'
    });
  });

  return associations;
}

/**
 * Level 3 Medication Impact Engine: Multi-Factor SHAP Explainability Graph
 * Simulates Structured XGBoost feature contributions with Medication Exposure
 */
export function calculateMedicationShapContributions(
  visits: VisitMeasurement[],
  meds: any[],
  patient: any
): { feature: string; importance: number; description: string; direction: 'negative' | 'positive' | 'neutral' }[] {
  const velocities = calculateVelocities(visits);
  const whyNow = evaluateWhyNow(visits, velocities);
  const medFeatures = engineerMedicationFeatures(meds, patient.currentGestationalAgeWeeks);

  const contributions: { feature: string; importance: number; description: string; direction: 'negative' | 'positive' | 'neutral' }[] = [];

  // AFI Velocity Contribution
  const afiVel = velocities.afiVelocity_cmPerWeek;
  contributions.push({
    feature: 'AFI Velocity (ΔAFI / Δweeks)',
    importance: afiVel < -0.3 ? 35 : afiVel < 0 ? 15 : 5,
    description: `Amniotic fluid rate of change: ${afiVel} cm/wk`,
    direction: afiVel < 0 ? 'negative' : afiVel > 0 ? 'positive' : 'neutral'
  });

  // Fetal Growth Velocity Contribution
  const growthVel = velocities.growthVelocity_percentilePerWeek;
  contributions.push({
    feature: 'Fetal Growth Velocity (Δ%ile / Δweeks)',
    importance: growthVel < -1.5 ? 30 : growthVel < 0 ? 12 : 6,
    description: `Growth percentile rate of change: ${growthVel} %ile/wk`,
    direction: growthVel < 0 ? 'negative' : growthVel > 0 ? 'positive' : 'neutral'
  });

  // Medication Exposure Feature Contribution
  if (medFeatures.hasActiveExposure > 0) {
    const duration = medFeatures.totalExposureDurationWeeks;
    contributions.push({
      feature: 'Maternal Medication Exposure Duration',
      importance: duration > 6 ? 18 : 10,
      description: `${medFeatures.activeMedCount} active drug(s) with total exposure of ${duration} weeks`,
      direction: 'negative'
    });
  }

  // Maternal Baseline Covariates (BMI & Age)
  const bmi = patient.maternalBmi || 24.5;
  const age = patient.age || 28;
  const hasRiskBmi = bmi > 30 || bmi < 18.5;
  const hasRiskAge = age >= 35 || age < 20;

  contributions.push({
    feature: 'Maternal Covariates (BMI & Age)',
    importance: (hasRiskBmi || hasRiskAge) ? 12 : 4,
    description: `Age: ${age}y, BMI: ${bmi} kg/m²`,
    direction: (hasRiskBmi || hasRiskAge) ? 'negative' : 'positive'
  });

  // Personal Baseline Deviation
  const deviation = whyNow.baselineDeviation_cm;
  contributions.push({
    feature: 'Personal Baseline Deviation',
    importance: Math.abs(deviation) > 2.0 ? 15 : 6,
    description: `Deviation from expected curve: ${deviation > 0 ? '+' : ''}${deviation} cm`,
    direction: deviation < 0 ? 'negative' : 'positive'
  });

  // Sort contributions by importance descending
  return contributions.sort((a, b) => b.importance - a.importance);
}



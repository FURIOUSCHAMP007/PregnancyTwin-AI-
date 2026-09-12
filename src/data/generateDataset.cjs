const fs = require('fs');
const path = require('path');

// Seedable pseudo-random generator
function createRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const PATTERNS = [
  "growth_percentile_decline", // P001
  "stable", // P002
  "variable_fluid", // P003
  "growth_recovery", // P004
  "stable_low_percentile", // P005
  "fluid_recovery", // P006
  "growth_recovery", // P007
  "growth_percentile_decline", // P008
  "late_fluid_decline", // P009
  "growth_percentile_decline", // P010
  "growth_percentile_decline", // P011
  "variable_fluid", // P012
  "gradual_fluid_decline", // P013
  "growth_percentile_decline", // P014
  "rapid_growth_change", // P015
  "fluid_recovery", // P016
  "variable_fluid", // P017
  "gradual_fluid_decline", // P018
  "rapid_growth_change", // P019
  "mixed_fluid_growth_change", // P020
  "growth_recovery", // P021
  "growth_percentile_decline", // P022
  "growth_recovery", // P023
  "stable", // P024
  "rapid_growth_change", // P025
  "stable", // P026
  "rapid_growth_change", // P027
  "growth_percentile_decline", // P028
  "mixed_fluid_growth_change", // P029
  "late_fluid_decline", // P030
  "mixed_fluid_growth_change", // P031
  "fluid_recovery", // P032
  "gradual_fluid_decline", // P033
  "variable_fluid", // P034
  "growth_percentile_decline", // P035
  "growth_recovery", // P036
  "growth_percentile_decline", // P037
  "fluid_recovery", // P038
  "mixed_fluid_growth_change", // P039
  "fluid_recovery", // P040
  "growth_percentile_decline", // P041
  "growth_recovery", // P042
  "variable_fluid", // P043
  "growth_percentile_decline", // P044
  "gradual_fluid_decline", // P045
  "mixed_fluid_growth_change", // P046
  "fluid_recovery", // P047
  "rapid_growth_change", // P048
  "rapid_growth_change", // P049
  "growth_percentile_decline", // P050
  "fluid_recovery", // P051
  "mixed_fluid_growth_change", // P052
  "growth_percentile_decline", // P053
  "variable_fluid", // P054
  "stable_low_percentile", // P055
  "gradual_fluid_decline", // P056
  "stable", // P057
  "variable_fluid", // P058
  "rapid_growth_change", // P059
  "mixed_fluid_growth_change", // P060
  "rapid_growth_change", // P061
  "rapid_growth_change", // P062
  "stable_low_percentile", // P063
  "variable_fluid", // P064
  "stable_low_percentile", // P065
  "variable_fluid", // P066
  "mixed_fluid_growth_change", // P067
  "fluid_recovery", // P068
  "growth_percentile_decline", // P069
  "rapid_growth_change", // P070
  "stable", // P071
  "growth_percentile_decline", // P072
  "gradual_fluid_decline", // P073
  "stable", // P074
  "stable_low_percentile", // P075
  "variable_fluid", // P076
  "late_fluid_decline", // P077
  "rapid_growth_change", // P078
  "gradual_fluid_decline", // P079
  "fluid_recovery", // P080
  "late_fluid_decline", // P081
  "mixed_fluid_growth_change", // P082
  "growth_percentile_decline", // P083
  "mixed_fluid_growth_change", // P084
  "late_fluid_decline", // P085
  "late_fluid_decline", // P086
  "stable", // P087
  "growth_percentile_decline", // P088
  "stable", // P089
  "fluid_recovery", // P090
  "variable_fluid", // P091
  "stable_low_percentile", // P092
  "gradual_fluid_decline", // P093
  "gradual_fluid_decline", // P094
  "stable", // P095
  "growth_recovery", // P096
  "growth_recovery", // P097
  "growth_recovery", // P098
  "variable_fluid", // P099
  "variable_fluid" // P100
];

const generatedData = [];

for (let i = 0; i < 100; i++) {
  const patientIdx = i + 1;
  const pId = `P${String(patientIdx).padStart(3, '0')}`;
  const pattern = PATTERNS[i];
  const rand = createRandom(patientIdx * 77);

  // Number of visits (4 to 7)
  const numVisits = Math.floor(rand() * 4) + 4;
  
  // Start gestational age (20 to 24 weeks)
  let currentGA = Math.floor(rand() * 4) + 20;
  
  const visits = [];
  let prevEFW = null;
  let prevAFI = null;
  let prevPercentile = null;

  // Base starting parameters
  let basePercentile = 30 + rand() * 40; // 30% to 70%
  let baseAFI = 10 + rand() * 5; // 10 to 15 cm

  for (let vNum = 1; vNum <= numVisits; vNum++) {
    // Visit interval 2 to 4 weeks
    if (vNum > 1) {
      currentGA += Math.floor(rand() * 3) + 2;
    }

    if (currentGA > 40) currentGA = 40;

    // Apply pattern trends to percentile and AFI
    let percentile = basePercentile;
    let afi = baseAFI;

    if (pattern === "growth_percentile_decline") {
      percentile = basePercentile - (vNum - 1) * (5 + rand() * 4);
      if (percentile < 5) percentile = 5 + rand() * 3;
    } else if (pattern === "stable") {
      percentile = basePercentile + (rand() * 6 - 3);
    } else if (pattern === "variable_fluid") {
      afi = baseAFI + Math.sin(vNum) * (2 + rand() * 2);
    } else if (pattern === "growth_recovery") {
      if (vNum === 1) percentile = 15 + rand() * 5;
      else percentile = 15 + (vNum - 1) * (4 + rand() * 3);
    } else if (pattern === "stable_low_percentile") {
      percentile = 12 + rand() * 8;
    } else if (pattern === "fluid_recovery") {
      if (vNum === 1) afi = 7.5 + rand() * 1.5;
      else afi = 8.0 + (vNum - 1) * (0.8 + rand() * 0.4);
    } else if (pattern === "late_fluid_decline") {
      if (currentGA < 32) afi = 11.5 + rand() * 1.5;
      else afi = 11.5 - (currentGA - 31) * (0.6 + rand() * 0.4);
      if (afi < 4.5) afi = 4.5 + rand();
    } else if (pattern === "gradual_fluid_decline") {
      afi = baseAFI - (vNum - 1) * (0.9 + rand() * 0.4);
      if (afi < 5.0) afi = 5.0 + rand() * 0.5;
    } else if (pattern === "rapid_growth_change") {
      percentile = basePercentile + Math.sin(vNum * 1.5) * (15 + rand() * 10);
    } else if (pattern === "mixed_fluid_growth_change") {
      percentile = basePercentile + Math.sin(vNum) * (10 + rand() * 5);
      afi = baseAFI + Math.cos(vNum) * (2 + rand() * 1.5);
    }

    // Constraint clamps
    if (percentile < 3) percentile = 3;
    if (percentile > 98) percentile = 98;
    if (afi < 3) afi = 3;
    if (afi > 25) afi = 25;

    // Hadlock biometry progression models
    const hc_mm = -28 + 11.2 * currentGA - 0.078 * currentGA * currentGA + (rand() * 2 - 1);
    const ac_mm = -45 + 10.4 * currentGA - 0.058 * currentGA * currentGA + (rand() * 2 - 1);
    const fl_mm = -12 + 2.8 * currentGA - 0.019 * currentGA * currentGA + (rand() * 1 - 0.5);

    // Approximate weight from GA scaled by percentile
    const pScale = 1.0 + (percentile - 50) * 0.004;
    const standardEFW = Math.pow(currentGA, 2.3) * 0.72; // Biologically aligned EFW curve
    const efw_g = Math.round(standardEFW * pScale);

    const fhr_bpm = Math.round(135 + Math.sin(vNum + patientIdx) * 12 + rand() * 5);

    // Changes calculation
    const change_from_previous = {
      efw_percent: prevEFW ? Math.round(((efw_g - prevEFW) / prevEFW) * 10000) / 100 : null,
      afi_cm: prevAFI ? Math.round((afi - prevAFI) * 100) / 100 : null,
      growth_percentile_points: prevPercentile ? Math.round((percentile - prevPercentile) * 10) / 10 : null
    };

    visits.push({
      patient_id: pId,
      visit_number: vNum,
      visit_date: `2026-05-${String(vNum * 7 + Math.floor(rand() * 5)).padStart(2, '0')}`,
      gestational_age_weeks: currentGA,
      hc_mm: Math.round(hc_mm * 10) / 10,
      ac_mm: Math.round(ac_mm * 10) / 10,
      fl_mm: Math.round(fl_mm * 10) / 10,
      efw_g,
      afi_cm: Math.round(afi * 10) / 10,
      fhr_bpm,
      growth_percentile: Math.round(percentile * 10) / 10,
      change_from_previous
    });

    prevEFW = efw_g;
    prevAFI = afi;
    prevPercentile = percentile;
  }

  generatedData.push({
    patient_id: pId,
    data_type: "synthetic_longitudinal_pregnancy",
    trajectory_pattern: pattern,
    disclaimer: "Synthetic data for software prototype/demo only; not for clinical use.",
    visits
  });
}

// Write to active target file
const targetFile = path.join(__dirname, 'sihSyntheticDataset.json');
fs.writeFileSync(targetFile, JSON.stringify(generatedData, null, 2));
console.log(`Successfully generated 100 patients with standard trajectory patterns in: ${targetFile}`);

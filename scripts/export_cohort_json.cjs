const fs = require('fs');
const path = require('path');

const rawPatients = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/pregnancy_twin_100_unique_patients.json'), 'utf-8'));
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Map medications context for patients
const medicationCatalog = [
  { name: 'Prenatal Multivitamin', dose: '1 tab daily', start_week: 6, end_week: 40, indication: 'Routine micronutrient support' },
  { name: 'Low-Dose Aspirin', dose: '150 mg daily', start_week: 12, end_week: 36, indication: 'Placental insufficiency prophylaxis' },
  { name: 'Labetalol', dose: '100 mg BID', start_week: 24, end_week: 34, indication: 'Gestational hypertension management' },
  { name: 'Nifedipine ER', dose: '30 mg daily', start_week: 28, end_week: 34, indication: 'Pre-eclampsia vascular stabilization' },
  { name: 'Betamethasone', dose: '12 mg IM (2 doses)', start_week: 29, end_week: 30, indication: 'Fetal lung maturation course' },
  { name: 'Insulin (Aspart)', dose: '8 units TID', start_week: 24, end_week: 38, indication: 'Gestational diabetes management' }
];

rawPatients.slice(0, 30).forEach((p, idx) => {
  const patientId = p.patient_id;
  const visits = (p.visits || []).map(v => ({
    gestational_age: v.gestational_age_weeks,
    hc: Math.round(v.hc_mm),
    ac: Math.round(v.ac_mm),
    fl: Math.round(v.fl_mm),
    efw: Math.round(v.efw_g),
    afi: Number(v.afi_cm.toFixed(1)),
    growth_percentile: Math.round(v.growth_percentile)
  }));

  // Assign realistic contextual medication
  let medications = [];
  if (idx % 4 === 1) {
    medications.push(medicationCatalog[2]); // Labetalol
  } else if (idx % 4 === 2) {
    medications.push(medicationCatalog[1]); // Aspirin
  } else if (idx % 4 === 3) {
    medications.push(medicationCatalog[3]); // Nifedipine
    medications.push(medicationCatalog[4]); // Betamethasone
  } else {
    medications.push(medicationCatalog[0]); // Multivitamin
  }

  const outputObj = {
    patient_id: patientId,
    trajectory_type: p.trajectory_pattern || 'concordant',
    visits,
    medications
  };

  fs.writeFileSync(path.join(dataDir, `${patientId}.json`), JSON.stringify(outputObj, null, 2));
});

console.log(`Successfully generated 30 patient JSON files in ${dataDir}`);

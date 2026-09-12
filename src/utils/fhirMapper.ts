/**
 * PregnancyTwin AI - HL7 FHIR Compliance Interoperability Layer
 * Converts proprietary longitudinal pregnancy twin profiles to official HL7 FHIR R4/R5 resources.
 * Matches standard LOINC clinical coding for obstetric biometrics.
 */

import { Patient, VisitMeasurement } from '../types';

export interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: {
    fullUrl: string;
    resource: FhirResource;
    request: {
      method: 'POST' | 'PUT';
      url: string;
    };
  }[];
}

/**
 * Maps standard local Patient entity to a compliant HL7 FHIR Patient Resource
 */
export function mapToFhirPatient(patient: Patient): FhirResource {
  return {
    resourceType: 'Patient',
    id: `patient-${patient.id}`,
    active: true,
    name: [
      {
        use: 'official',
        text: patient.name,
        family: patient.name.split(' ').slice(-1)[0] || '',
        given: patient.name.split(' ').slice(0, -1) || [patient.name]
      }
    ],
    gender: 'female',
    birthDate: patient.age ? new Date(new Date().getFullYear() - patient.age, 5, 1).toISOString().split('T')[0] : undefined,
    identifier: [
      {
        use: 'official',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }
          ]
        },
        system: 'urn:oid:1.2.36.146.595.217.0.1', // Example local hospital OID
        value: patient.mrn
      }
    ],
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-pregnancy-status',
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '77386006',
              display: 'Patient currently pregnant'
            }
          ]
        }
      }
    ]
  };
}

/**
 * Maps a single longitudinal ultrasound visit measurement to multiple FHIR Observation Resources
 * Grouped together with official SNOMED / LOINC medical codes.
 */
export function mapVisitToFhirObservations(
  patient: Patient,
  visit: VisitMeasurement,
  useKalman: boolean = true
): FhirResource[] {
  const patientRef = `Patient/patient-${patient.id}`;
  const observations: FhirResource[] = [];
  const baseId = `obs-${patient.id}-${visit.visitNumber}`;

  // Helper to generate a standard FHIR observation
  const createObservation = (
    subId: string,
    loincCode: string,
    display: string,
    value: number,
    unit: string,
    unitCode: string,
    notes?: string
  ): FhirResource => ({
    resourceType: 'Observation',
    id: `${baseId}-${subId}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'imaging',
            display: 'Imaging'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: loincCode,
          display: display
        }
      ],
      text: display
    },
    subject: {
      reference: patientRef,
      display: patient.name
    },
    effectiveDateTime: visit.date,
    valueQuantity: {
      value: value,
      unit: unit,
      system: 'http://unitsofmeasure.org',
      code: unitCode
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'N',
            display: 'Normal'
          }
        ]
      }
    ],
    note: notes ? [{ text: notes }] : undefined
  });

  // 1. Estimated Fetal Weight (EFW) LOINC Code: 11727-5
  observations.push(
    createObservation(
      'efw',
      '11727-5',
      'Fetal Weight Estimated by Ultrasound',
      visit.estimatedFetalWeight_g,
      'grams',
      'g',
      `Fetal growth tracked at ${visit.growthPercentile}th percentile via Hadlock formula.`
    )
  );

  // 2. Amniotic Fluid Index (AFI) LOINC Code: 11627-7
  const finalAfi = useKalman && visit.kalmanAfi ? visit.kalmanAfi : visit.amnioticFluidIndex_cm;
  observations.push(
    createObservation(
      'afi',
      '11627-7',
      'Amniotic Fluid Index (AFI)',
      finalAfi,
      'centimeters',
      'cm',
      useKalman && visit.kalmanAfi ? 'Dampened value processed via 1D Kalman Filter.' : 'Raw sonographer measurement.'
    )
  );

  // 3. Fetal Growth Percentile LOINC Code: 59074-5
  const finalPercentile = useKalman && visit.kalmanPercentile ? visit.kalmanPercentile : visit.growthPercentile;
  observations.push(
    createObservation(
      'percentile',
      '59074-5',
      'Fetal Gestational age Estimated from biometric measurements',
      finalPercentile,
      'percentile',
      '%',
      `Longitudinal growth standard: Inter-visit percentile trajectory.`
    )
  );

  // 4. Head Circumference (HC) if available. LOINC: 11984-2
  if (visit.biometrics?.hc_mm) {
    observations.push(
      createObservation(
        'hc',
        '11984-2',
        'Fetal Head Circumference by Ultrasound',
        visit.biometrics.hc_mm,
        'millimeters',
        'mm'
      )
    );
  }

  // 5. Abdominal Circumference (AC) if available. LOINC: 11979-2
  if (visit.biometrics?.ac_mm) {
    observations.push(
      createObservation(
        'ac',
        '11979-2',
        'Fetal Abdominal Circumference by Ultrasound',
        visit.biometrics.ac_mm,
        'millimeters',
        'mm'
      )
    );
  }

  // 6. Femur Length (FL) if available. LOINC: 11963-6
  if (visit.biometrics?.fl_mm) {
    observations.push(
      createObservation(
        'fl',
        '11963-6',
        'Fetal Femur Length by Ultrasound',
        visit.biometrics.fl_mm,
        'millimeters',
        'mm'
      )
    );
  }

  return observations;
}

/**
 * Creates a complete FHIR Transaction Bundle containing the Patient and all serial Visit Observations.
 */
export function generateFhirBundle(patient: Patient, visits: VisitMeasurement[], useKalman: boolean = true): FhirBundle {
  const patientResource = mapToFhirPatient(patient);
  const entries: FhirBundle['entry'] = [
    {
      fullUrl: `urn:uuid:${patientResource.id}`,
      resource: patientResource,
      request: {
        method: 'PUT',
        url: `Patient/${patientResource.id}`
      }
    }
  ];

  // Map all visits
  visits.forEach(visit => {
    const obsList = mapVisitToFhirObservations(patient, visit, useKalman);
    obsList.forEach(obs => {
      entries.push({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: obs,
        request: {
          method: 'PUT',
          url: `Observation/${obs.id}`
        }
      });
    });
  });

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries
  };
}

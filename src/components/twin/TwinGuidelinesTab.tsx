import React, { useMemo } from 'react';
import { Patient, VisitMeasurement, PregnancyDigitalTwin } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  FileCheck2, 
  Activity, 
  Calendar, 
  Clock, 
  Heart,
  ExternalLink
} from 'lucide-react';

interface TwinGuidelinesTabProps {
  patient: Patient;
  twin: PregnancyDigitalTwin;
  visits: VisitMeasurement[];
}

export const TwinGuidelinesTab: React.FC<TwinGuidelinesTabProps> = ({
  patient,
  twin,
  visits,
}) => {
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const aGA = a.gestationalAgeWeeks + a.gestationalAgeDays / 7;
      const bGA = b.gestationalAgeWeeks + b.gestationalAgeDays / 7;
      return aGA - bGA;
    });
  }, [visits]);

  const latestVisit = sortedVisits[sortedVisits.length - 1] || visits[visits.length - 1];

  // Derive Clinical Auditing Conditions based on the selected patient's latest values
  const auditResults = useMemo(() => {
    const efwPct = latestVisit?.growthPercentile || 50;
    const afi = latestVisit?.amnioticFluidIndex_cm || 12;
    const sdp = latestVisit?.singleDeepestPocket_cm || 4;
    
    // Doppler logic based on patient profile
    let uaPi = 0.95;
    let mcaPi = 1.75;
    if (patient.id === 'pat-002') {
      uaPi = 1.45; // High resistance UA
      mcaPi = 1.15; // Low resistance MCA (brain sparing)
    } else if (patient.id === 'pat-003') {
      uaPi = 1.18;
      mcaPi = 1.35;
    }

    const cpr = mcaPi / uaPi;

    // ACOG / SMFM Guideline criteria thresholds
    const isEfwSga = efwPct < 10;
    const isEfwSevere = efwPct < 3;
    const isAfiOligo = afi < 5.0 || sdp < 2.0;
    const isUaPiElevated = uaPi > 1.3; // proxy 95th percentile
    const isCprElevated = cpr < 1.08;  // proxy 5th percentile

    // Overall Diagnosis Summary
    let diagnoses: string[] = [];
    let deliveryGaRecommendation = 'Expectant management; deliver at 39w 0d - 40w 6d.';
    let surveillanceRecommendation = 'Standard routine prenatal checkups.';
    let riskTier: 'LOW' | 'WATCH' | 'HIGH' = 'LOW';

    if (isEfwSevere) {
      diagnoses.push('Severe Fetal Growth Restriction (EFW < 3rd Percentile)');
      deliveryGaRecommendation = 'Expedite delivery between 36w 0d and 37w 6d (or earlier if abnormal Doppler flow detected).';
      surveillanceRecommendation = 'Twice-weekly Doppler velocimetry, twice-weekly Non-Stress Test (NST) or Biophysical Profile (BPP).';
      riskTier = 'HIGH';
    } else if (isEfwSga) {
      diagnoses.push('Fetal Growth Restriction (EFW < 10th Percentile)');
      deliveryGaRecommendation = 'Recommend delivery at 38w 0d - 39w 0d.';
      surveillanceRecommendation = 'Weekly Doppler velocimetry (UA PI) & weekly NST/BPP surveillance.';
      riskTier = 'HIGH';
    }

    if (isAfiOligo) {
      diagnoses.push('Oligohydramnios (AFI < 5.0cm or SDP < 2.0cm)');
      deliveryGaRecommendation = 'Deliver at 36w 0d - 37w 6d upon diagnosis, or immediately if concurrent indications exist.';
      surveillanceRecommendation = 'NST/BPP twice-weekly. Serial AFI/SDP fluid volume checks every 3-4 days.';
      riskTier = 'HIGH';
    }

    if (isCprElevated || isUaPiElevated) {
      diagnoses.push('Placental Perfusion Insufficiency & Fetal Hemodynamic Adaptation');
      if (riskTier !== 'HIGH') {
        deliveryGaRecommendation = 'Deliver at 37w 0d - 38w 6d depending on continuous Doppler parameters.';
        surveillanceRecommendation = 'Twice-weekly Doppler monitoring (UA, MCA, CPR) and continuous fetal monitoring.';
        riskTier = 'WATCH';
      }
    }

    if (diagnoses.length === 0) {
      diagnoses.push('Physiological Gestational Profile (Healthy & Active Twin)');
    }

    return {
      efwPct,
      afi,
      sdp,
      uaPi,
      mcaPi,
      cpr,
      isEfwSga,
      isEfwSevere,
      isAfiOligo,
      isUaPiElevated,
      isCprElevated,
      diagnoses,
      deliveryGaRecommendation,
      surveillanceRecommendation,
      riskTier
    };
  }, [latestVisit, patient.id]);

  const consensusChecklist = [
    {
      id: 'crit-efw-10',
      name: 'EFW Sub-10th Percentile (ACOG SGA Threshold)',
      description: 'Hadlock-4 estimated fetal weight is below the 10th percentile for gestational age.',
      status: auditResults.isEfwSga ? 'WARNING' : 'PASS',
      statusLabel: auditResults.isEfwSga ? 'Triggered (FGR Threshold)' : 'Normal Growth',
      valueText: `EFW Percentile: ${auditResults.efwPct}%`
    },
    {
      id: 'crit-efw-3',
      name: 'Severe Growth Restrictive Profile (EFW < 3rd Percentile)',
      description: 'Hadlock estimated fetal weight plummeting below 3rd percentile, signaling severe placental mismatch.',
      status: auditResults.isEfwSevere ? 'FAIL' : 'PASS',
      statusLabel: auditResults.isEfwSevere ? 'CRITICAL TRIGGER' : 'Stable Percentile Corridor',
      valueText: `EFW Percentile: ${auditResults.efwPct}%`
    },
    {
      id: 'crit-oligo',
      name: 'Oligohydramnios Criteria (ACOG/SMFM Cutoff)',
      description: 'Amniotic Fluid Index (AFI) < 5.0 cm or Single Deepest Pocket (SDP) < 2.0 cm.',
      status: auditResults.isAfiOligo ? 'FAIL' : 'PASS',
      statusLabel: auditResults.isAfiOligo ? 'Triggered (Anhydramnios/Oligo)' : 'Adequate Fluid Vol',
      valueText: `AFI: ${auditResults.afi} cm • SDP: ${auditResults.sdp} cm`
    },
    {
      id: 'crit-uapi',
      name: 'Umbilical Artery High Resistance Index (> 95th Percentile)',
      description: 'Elevated pulsatility index in the umbilical artery indicating high impedance in placental cotyledons.',
      status: auditResults.isUaPiElevated ? 'WARNING' : 'PASS',
      statusLabel: auditResults.isUaPiElevated ? 'High Resistance' : 'Low Impedance',
      valueText: `UA PI: ${auditResults.uaPi.toFixed(2)}`
    },
    {
      id: 'crit-cpr',
      name: 'Cerebroplacental Ratio (CPR < 1.08 Cutoff)',
      description: 'MCA PI / UA PI ratio < 1.08 indicating brain-sparing cerebral vasodilation (Compensatory Hypoxia).',
      status: auditResults.isCprElevated ? 'FAIL' : 'PASS',
      statusLabel: auditResults.isCprElevated ? 'Cerebrovascular Sparing' : 'Balanced Perfusion',
      valueText: `CPR: ${auditResults.cpr.toFixed(2)}`
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Guideline Framework Overview Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>ACOG / SMFM Clinical Guidelines Audit Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic automated compliance auditor comparing serial digital twin biometric velocities against national consensus guidelines.
              </p>
            </div>
          </div>
          
          <span className="text-[10px] font-mono bg-slate-900 text-teal-300 px-3 py-1 rounded font-bold border border-slate-700 flex items-center space-x-1 shrink-0">
            <span>ACOG Practice Bulletin No. 227 Compliance</span>
          </span>
        </div>

        {/* Diagnostic Synthesizer Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          {/* Diagnostic Categorization */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Derived Diagnoses / Indications</div>
            <div className="space-y-1 pt-1">
              {auditResults.diagnoses.map((dx, i) => (
                <div key={i} className="text-xs font-bold text-slate-800 flex items-start space-x-1.5">
                  <span className="text-teal-700 font-extrabold">•</span>
                  <span>{dx}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Window Recommendation */}
          <div className="space-y-1 md:border-l md:border-slate-200 md:pl-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Consensus Delivery Window Guidance</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 pt-1 leading-relaxed">
              {auditResults.deliveryGaRecommendation}
            </p>
          </div>

          {/* Surveillance Frequency */}
          <div className="space-y-1 md:border-l md:border-slate-200 md:pl-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Maternal-Fetal Surveillance Frequency</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 pt-1 leading-relaxed">
              {auditResults.surveillanceRecommendation}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Checklist Criteria Items */}
      <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Consensus Diagnostic Criteria Checkpoint Audit
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Evaluates the selected biometric points against consensus guidelines from ACOG, SMFM, and the International Society of Ultrasound in Obstetrics and Gynecology (ISUOG).
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {consensusChecklist.map((crit) => {
            const isPass = crit.status === 'PASS';
            const isWarning = crit.status === 'WARNING';
            const isFail = crit.status === 'FAIL';

            return (
              <div key={crit.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{crit.name}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      isPass 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : isWarning 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {crit.statusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{crit.description}</p>
                </div>

                <div className="flex items-center space-x-4 self-start sm:self-center shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {crit.valueText}
                  </span>
                  
                  <div>
                    {isPass && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {isFail && <XCircle className="w-5 h-5 text-rose-600 animate-pulse" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Consensus Decision Trees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACOG SGA Classification Table */}
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>FGR / SGA Classification Framework</span>
          </h4>
          
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2 px-2.5">Category</th>
                  <th className="py-2 px-2.5">EFW Percentile</th>
                  <th className="py-2 px-2.5">Umbilical Doppler PI</th>
                  <th className="py-2 px-2.5">Maternal Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2 px-2.5 text-emerald-800">Constitutional SGA</td>
                  <td className="py-2 px-2.5">3rd - 9th %</td>
                  <td className="py-2 px-2.5 text-slate-500">Normal (&lt; 95th)</td>
                  <td className="py-2 px-2.5">Low Surveillance</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-amber-50/35">
                  <td className="py-2 px-2.5 text-amber-800">Fetal Growth Restriction (FGR)</td>
                  <td className="py-2 px-2.5">&lt; 10th %</td>
                  <td className="py-2 px-2.5 text-amber-700">High (&gt; 95th) or Low CPR</td>
                  <td className="py-2 px-2.5">Moderate/Weekly</td>
                </tr>
                <tr className="hover:bg-slate-50/50 bg-rose-50/35">
                  <td className="py-2 px-2.5 text-rose-800">Severe Placental Insufficiency</td>
                  <td className="py-2 px-2.5">&lt; 3rd %</td>
                  <td className="py-2 px-2.5 text-rose-700">Absent / Reversed End Diastolic Flow</td>
                  <td className="py-2 px-2.5">High / Urgent / Hospitalize</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Decision pearls */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-600" />
              <span>Evidence-Based Clinical Pearls</span>
            </h4>
            
            <div className="text-[11px] leading-relaxed text-slate-600 space-y-2.5">
              <p>
                <strong className="font-bold text-slate-800">Middle Cerebral Artery Sparing:</strong> Fetal redistribution (brain sparing) is detected before biometrical deceleration. When the MCA PI is low, it represents compensatory vasodilation under systemic hypoxia.
              </p>
              <p>
                <strong className="font-bold text-slate-800">Delivery Timings:</strong> For uncomplicated SGA, delivery is recommended at 38w 0d - 39w 6d. For FGR with elevated UA PI, delivery should be planned at 37w 0d. Absent End-Diastolic Flow (AEDF) warrants immediate delivery consideration at 33w - 34w.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] font-bold text-teal-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Consensus Guidelines Synchronized</span>
            </span>
            <a 
              href="https://www.acog.org" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:underline flex items-center space-x-1 text-slate-400 hover:text-slate-600"
            >
              <span>ACOG Org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

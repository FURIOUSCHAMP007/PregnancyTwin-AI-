import React from 'react';
import { Patient } from '../types';
import { 
  Activity, 
  User, 
  Baby, 
  Database, 
  FileJson, 
  CheckCircle, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight 
} from 'lucide-react';

interface RestPatientDisplayProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
}

export const RestPatientDisplay: React.FC<RestPatientDisplayProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
}) => {
  // Display ONLY 5 unique cases/patients
  const uniqueCases = patients.slice(0, 5);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'HIGH':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-500',
          text: 'High Risk'
        };
      case 'WATCH':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
          text: 'Watch'
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-500',
          text: 'Stable'
        };
    }
  };

  const getTrajectoryIcon = (category: string) => {
    switch (category) {
      case 'FLUID_DECLINE':
        return <span title="Amniotic Fluid Index Decline"><TrendingDown className="w-3.5 h-3.5 text-rose-500" /></span>;
      case 'GROWTH_DEVIATION':
        return <span title="Fetal Growth Percentile Deceleration"><TrendingDown className="w-3.5 h-3.5 text-amber-500" /></span>;
      case 'ACCELERATED_DECLINE':
        return <span title="Accelerated Decline Profile"><TrendingDown className="w-3.5 h-3.5 text-rose-600 animate-pulse" /></span>;
      default:
        return <span title="Stable Growth Trajectory"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /></span>;
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm w-full animate-in fade-in duration-300">
      {/* Banner Header with REST API metadata info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <span>REST Continuous Case-Inflow Monitor</span>
              <span className="text-[9px] bg-slate-900 text-teal-300 font-mono font-extrabold px-1.5 py-0.5 rounded border border-slate-700 select-none">
                GET /api/patients?limit=5
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Live REST ingestion showing 5 unique active clinical cohort digital twins.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto text-[10px] font-mono text-slate-400">
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
            <span>REST API Active</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>5 unique cases loaded</span>
        </div>
      </div>

      {/* 5 Unique Case Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {uniqueCases.map((patient) => {
          const isSelected = patient.id === selectedPatientId;
          const status = getStatusStyle(patient.status);
          
          return (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`group relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                isSelected
                  ? 'bg-teal-50/70 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Highlight ribbon for selected patient */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                  </span>
                </div>
              )}

              {/* Top part: MRN & Risk Status Badge */}
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">
                    {patient.mrn}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${status.bg}`}>
                    {status.text}
                  </span>
                </div>

                {/* Patient Name */}
                <h4 className="font-extrabold text-slate-900 text-xs truncate leading-snug group-hover:text-teal-950 transition-colors pt-1">
                  {patient.name.split(' (')[0]}
                </h4>

                {/* Gestational Age */}
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium">
                  <Baby className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">
                    GA: {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
                  </span>
                </div>
              </div>

              {/* Bottom part: Trajectory summary & Interactive Action */}
              <div className="border-t border-slate-200/60 pt-2 mt-2 w-full flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1 truncate pr-1">
                  {getTrajectoryIcon(patient.trajectoryCategory)}
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wide text-slate-400 truncate max-w-[65px]">
                    {patient.trajectoryCategory.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center text-teal-600 font-extrabold text-[9px] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Twin</span>
                  <ArrowRight className="w-2.5 h-2.5 ml-0.5 text-teal-500" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * PregnancyTwin AI - Patient Cohort Overview & Selector
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Activity,
  ArrowRight,
  UploadCloud,
  FileText,
  Sliders
} from 'lucide-react';
import { Patient, RiskLevel, User } from '../types';
import { UserCheck, Shield } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenUpload: (patientId: string) => void;
  onNavigateToLiveInput?: (patientId: string) => void;
  currentUser?: User;
  totalHospitalPatients?: number;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenUpload,
  onNavigateToLiveInput,
  currentUser,
  totalHospitalPatients
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | RiskLevel>('ALL');

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      (p.assignedDoctorName && p.assignedDoctorName.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: RiskLevel) => {
    switch (status) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
            HIGH RISK
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            WATCH
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            NORMAL
          </span>
        );
    }
  };

  const getTrajectoryBadge = (cat: string) => {
    switch (cat) {
      case 'FLUID_DECLINE':
        return (
          <span className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <TrendingDown className="w-3 h-3 mr-1 text-amber-600" />
            Fluid Trajectory Decline
          </span>
        );
      case 'GROWTH_DEVIATION':
        return (
          <span className="inline-flex items-center text-[11px] font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <TrendingDown className="w-3 h-3 mr-1 text-indigo-600" />
            Growth Velocity Deceleration
          </span>
        );
      case 'ACCELERATED_DECLINE':
        return (
          <span className="inline-flex items-center text-[11px] font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
            Combined Acceleration
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Activity className="w-3 h-3 mr-1 text-teal-600" />
            Stable Trajectory Concordance
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Search and Filters Bar */}
      <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/70">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="input-search-patient"
            type="text"
            placeholder="Search by patient name, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white text-slate-900 placeholder-slate-400 rounded-md text-xs border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block mr-1" />
          {(['ALL', 'HIGH', 'WATCH', 'LOW'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {f === 'ALL' ? 'All Patients' : f}
            </button>
          ))}
        </div>
      </div>

      {/* RBAC Segregation Status Bar */}
      <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
        currentUser?.role === 'admin'
          ? 'bg-amber-50/60 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center space-x-2">
          {currentUser?.role === 'admin' ? (
            <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          )}
          <span className="font-normal text-[11px]">
            {currentUser?.role === 'admin' ? (
              <>
                <strong className="font-semibold text-amber-950">Administrator Oversight:</strong> Displaying all {filteredPatients.length} hospital patients across clinical rosters.
              </>
            ) : (
              <>
                <strong className="font-semibold text-slate-900">Clinician Data Segregation:</strong> Showing {filteredPatients.length} patient(s) assigned to <strong>{currentUser?.name || 'Dr. Vance'}</strong>.
              </>
            )}
          </span>
        </div>
        {totalHospitalPatients && totalHospitalPatients > filteredPatients.length && (
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Total hospital database: {totalHospitalPatients} patients
          </span>
        )}
      </div>

      {/* Patients Table / List */}
      <div className="divide-y divide-slate-100">
        {filteredPatients.map((patient) => {
          const isSelected = patient.id === selectedPatientId;
          return (
            <div
              key={patient.id}
              id={`patient-row-${patient.id}`}
              onClick={() => onSelectPatient(patient.id)}
              className={`p-3.5 transition-colors cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-50/90 border-l-3 border-l-teal-600'
                  : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                  patient.status === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : patient.status === 'WATCH'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {patient.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 text-xs">{patient.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {patient.mrn}</span>
                    {getStatusBadge(patient.status)}
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                      {patient.assignedDoctorName || 'Dr. Vance'}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>Age {patient.age}</span>
                    <span className="text-slate-300">•</span>
                    <span>G{patient.gravidity}P{patient.parity}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">
                      GA: {patient.currentGestationalAgeWeeks}w {patient.currentGestationalAgeDays}d
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>EDD: {patient.edd}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    {getTrajectoryBadge(patient.trajectoryCategory)}
                    <span className="text-[11px] text-slate-400 line-clamp-1 italic max-w-md hidden lg:inline">
                      "{patient.notes}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                {onNavigateToLiveInput && (
                  <button
                    id={`btn-live-input-${patient.id}`}
                    onClick={() => onNavigateToLiveInput(patient.id)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100/70 border border-teal-200 transition-colors"
                    title="Open live ultrasound biometric input & simulator for this patient"
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-700" />
                    <span>Live Input</span>
                  </button>
                )}

                <button
                  id={`btn-upload-scan-${patient.id}`}
                  onClick={() => onOpenUpload(patient.id)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                  title="Upload ultrasound report or scan for this patient"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload</span>
                </button>

                <button
                  id={`btn-view-twin-${patient.id}`}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  <span>Digital Twin</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No patients match current search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

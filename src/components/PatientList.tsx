/**
 * PregnancyTwin AI - Patient Cohort Overview & Selector with Bulk Export
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
  Sliders,
  UserCheck,
  Shield,
  Loader2,
  Download,
  Printer,
  CheckSquare,
  Square
} from 'lucide-react';
import { Patient, RiskLevel, User } from '../types';

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenUpload: (patientId: string) => void;
  onNavigateToLiveInput?: (patientId: string) => void;
  currentUser?: User;
  totalHospitalPatients?: number;
  showToast?: (msg: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenUpload,
  onNavigateToLiveInput,
  currentUser,
  totalHospitalPatients,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [isExportingBulkPdf, setIsExportingBulkPdf] = useState<boolean>(false);

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      (p.assignedDoctorName && p.assignedDoctorName.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const isAllSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every(p => selectedPatientIds.includes(p.id));

  const handleToggleSelect = (patientId: string) => {
    setSelectedPatientIds(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently filtered patients
      const filteredIds = filteredPatients.map(p => p.id);
      setSelectedPatientIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all currently filtered patients
      const filteredIds = filteredPatients.map(p => p.id);
      const newSelected = Array.from(new Set([...selectedPatientIds, ...filteredIds]));
      setSelectedPatientIds(newSelected);
    }
  };

  const triggerBulkIframePrint = (html: string) => {
    try {
      let iframe = document.getElementById('clinical-bulk-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'clinical-bulk-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 300);
      }
    } catch (e) {
      console.warn('[Bulk Print Fallback] iframe print failed:', e);
      window.print();
    }
  };

  const handleBulkExportPDF = async () => {
    if (selectedPatientIds.length === 0 || isExportingBulkPdf) return;
    setIsExportingBulkPdf(true);

    const selectedPatients = patients.filter((p) => selectedPatientIds.includes(p.id));
    const formattedDate = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Parallel fetch serial twin scan records for each selected patient
    const patientTwinMap: Record<string, any> = {};
    await Promise.allSettled(
      selectedPatients.map(async (p) => {
        try {
          const res = await fetch(`/api/patients/${p.id}/twin`);
          if (res.ok) {
            const data = await res.json();
            patientTwinMap[p.id] = data;
          }
        } catch {
          // Fall back gracefully to patient basic data
        }
      })
    );

    const highRiskCount = selectedPatients.filter((p) => p.status === 'HIGH').length;
    const watchCount = selectedPatients.filter((p) => p.status === 'WATCH').length;
    const lowCount = selectedPatients.filter((p) => p.status === 'LOW').length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PregnancyTwin AI — Combined Clinical Session Report (${selectedPatients.length} Patients)</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; line-height: 1.5; background: #ffffff; }
          .page-break { page-break-after: always; break-after: page; }
          .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 18px; }
          h1 { font-size: 20px; color: #0f766e; margin: 0 0 4px 0; font-weight: 700; letter-spacing: -0.02em; }
          .subhead { font-size: 11px; color: #64748b; font-weight: 500; }
          .session-badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 4px; background: #0f766e; color: #ffffff; text-transform: uppercase; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: center; }
          .stat-num { font-size: 20px; font-weight: 800; color: #0f172a; }
          .stat-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          h2 { font-size: 14px; color: #0f766e; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #0f766e; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th { background: #0f766e; color: white; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 10px; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge-high { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
          .badge-watch { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
          .badge-low { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
          .patient-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
          .patient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .field-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .field-value { font-size: 13px; font-weight: 700; color: #0f172a; }
          .disclaimer { margin-top: 24px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 10px; color: #92400e; }
          .footer-note { font-size: 9px; color: #94a3b8; text-align: right; margin-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <!-- SESSION COVER PAGE -->
        <div class="header-bar">
          <div>
            <h1>PregnancyTwin AI — Combined Clinical Session Summary</h1>
            <div class="subhead">Maternal-Fetal Medicine Cohort Review Report • ${formattedDate} (${formattedTime})</div>
          </div>
          <div style="text-align: right;">
            <div class="session-badge">Session Export</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Clinician: ${currentUser?.name || 'Dr. Alistair Vance, MD'}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">${selectedPatients.length}</div>
            <div class="stat-label">Total Patients Exported</div>
          </div>
          <div class="stat-card" style="background: #fff1f2; border-color: #fecaca;">
            <div class="stat-num" style="color: #be123c;">${highRiskCount}</div>
            <div class="stat-label" style="color: #9f1239;">High Risk</div>
          </div>
          <div class="stat-card" style="background: #fffbeb; border-color: #fde68a;">
            <div class="stat-num" style="color: #b45309;">${watchCount}</div>
            <div class="stat-label" style="color: #92400e;">Watch / Monitor</div>
          </div>
          <div class="stat-card" style="background: #f0fdf4; border-color: #bbf7d0;">
            <div class="stat-num" style="color: #15803d;">${lowCount}</div>
            <div class="stat-label" style="color: #166534;">Normal</div>
          </div>
        </div>

        <h2>Clinical Session Cohort Roster</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Patient Name</th>
              <th>MRN</th>
              <th>GA</th>
              <th>Risk Level</th>
              <th>Trajectory Status</th>
              <th>Assigned Clinician</th>
              <th>Notes / Indications</th>
            </tr>
          </thead>
          <tbody>
            ${selectedPatients.map((p, idx) => `
              <tr>
                <td><strong>${idx + 1}</strong></td>
                <td><strong>${p.name}</strong> (Age ${p.age})</td>
                <td style="font-family: monospace;">${p.mrn}</td>
                <td>${p.currentGestationalAgeWeeks}w ${p.currentGestationalAgeDays}d</td>
                <td>
                  ${p.status === 'HIGH' ? '<span class="badge-high">HIGH RISK</span>' : p.status === 'WATCH' ? '<span class="badge-watch">WATCH</span>' : '<span class="badge-low">NORMAL</span>'}
                </td>
                <td>${p.trajectoryCategory.replace('_', ' ')}</td>
                <td>${p.assignedDoctorName || 'Dr. Vance'}</td>
                <td style="font-style: italic;">${p.notes || 'Routine surveillance'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="disclaimer" style="margin-top: 20px;">
          <strong>Clinical Session Summary Notice:</strong> Generated by PregnancyTwin AI decision-support workstation for clinical session review and electronic health records archive. Center: ${currentUser?.hospital || 'St. Jude Maternal Fetal Health'}.
        </div>

        <div class="footer-note">End of Session Overview • Detailed patient sections follow</div>

        <div class="page-break"></div>

        <!-- DETAILED PATIENT BREAKDOWNS -->
        ${selectedPatients.map((p, idx) => {
          const twin = patientTwinMap[p.id];
          const visits = twin?.visits || [];
          return `
            <div class="header-bar">
              <div>
                <h1>Patient #${idx + 1}: ${p.name}</h1>
                <div class="subhead">Medical Record Number (MRN): ${p.mrn} • Gestational Age: ${p.currentGestationalAgeWeeks}w ${p.currentGestationalAgeDays}d</div>
              </div>
              <div>
                ${p.status === 'HIGH' ? '<span class="badge-high" style="font-size:11px; padding:4px 8px;">HIGH RISK</span>' : p.status === 'WATCH' ? '<span class="badge-watch" style="font-size:11px; padding:4px 8px;">WATCH</span>' : '<span class="badge-low" style="font-size:11px; padding:4px 8px;">NORMAL</span>'}
              </div>
            </div>

            <div class="patient-box">
              <div class="patient-grid">
                <div><div class="field-label">Patient Name</div><div class="field-value">${p.name}</div></div>
                <div><div class="field-label">MRN</div><div class="field-value">${p.mrn}</div></div>
                <div><div class="field-label">Age / Obstetric History</div><div class="field-value">${p.age}y • G${p.gravidity}P${p.parity}</div></div>
                <div><div class="field-label">LMP Date</div><div class="field-value">${p.lmp}</div></div>
                <div><div class="field-label">Estimated Due Date (EDD)</div><div class="field-value">${p.edd}</div></div>
                <div><div class="field-label">Trajectory Classification</div><div class="field-value">${p.trajectoryCategory}</div></div>
              </div>
            </div>

            <h3>Longitudinal Serial Ultrasound Biometry Scans (${visits.length} recorded)</h3>
            <table>
              <thead>
                <tr>
                  <th>Visit #</th>
                  <th>Date</th>
                  <th>GA (Weeks)</th>
                  <th>EFW (g)</th>
                  <th>Hadlock Growth %</th>
                  <th>AFI (cm)</th>
                  <th>Doctor Review</th>
                </tr>
              </thead>
              <tbody>
                ${visits.length > 0 ? visits.map((v: any) => `
                  <tr>
                    <td><strong>Visit ${v.visitNumber}</strong></td>
                    <td>${v.date}</td>
                    <td>${v.gestationalAgeWeeks}w</td>
                    <td>${v.estimatedFetalWeight_g}g</td>
                    <td>${v.growthPercentile}%</td>
                    <td>${v.amnioticFluidIndex_cm} cm</td>
                    <td><span class="badge-low">${(v.doctorReviewStatus || 'Accepted').toUpperCase()}</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="7" style="text-align:center; padding: 12px; color: #64748b;">
                      Baseline ultrasound biometry logged in database. Last visit date: ${p.lastVisitDate}.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>

            ${p.notes ? `
              <div style="margin-top: 14px; padding: 10px; background: #f1f5f9; border-radius: 6px; font-size: 11px;">
                <strong>Clinical Notes:</strong> ${p.notes}
              </div>
            ` : ''}

            <div class="footer-note" style="margin-top: 30px;">
              PregnancyTwin AI Workstation • Patient ${idx + 1} of ${selectedPatients.length}
            </div>

            ${idx < selectedPatients.length - 1 ? '<div class="page-break"></div>' : ''}
          `;
        }).join('')}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Brief delay for tactile feedback
    await new Promise((res) => setTimeout(res, 500));

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        triggerBulkIframePrint(htmlContent);
      }
    } catch {
      triggerBulkIframePrint(htmlContent);
    }

    setIsExportingBulkPdf(false);

    if (showToast) {
      showToast(`Bulk PDF report generated for ${selectedPatients.length} selected patients!`);
    }
  };

  const selectedHighRiskCount = patients.filter(
    (p) => selectedPatientIds.includes(p.id) && p.status === 'HIGH'
  ).length;
  const selectedWatchCount = patients.filter(
    (p) => selectedPatientIds.includes(p.id) && p.status === 'WATCH'
  ).length;

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
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Select All Toggle Button */}
          <button
            type="button"
            id="btn-select-all-patients"
            onClick={handleSelectAll}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer border ${
              isAllSelected
                ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title={isAllSelected ? "Deselect all patients" : "Select all filtered patients"}
          >
            {isAllSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-teal-200" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          <div className="relative w-full sm:w-64">
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

      {/* Bulk Selection Actions Toolbar Banner */}
      {selectedPatientIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/50 text-teal-300 flex items-center justify-center font-bold text-[11px]">
                {selectedPatientIds.length}
              </span>
              <span className="font-semibold text-xs text-slate-100">
                Patients Selected for Clinical Session Export
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-300 font-mono border-l border-slate-700 pl-3">
              {selectedHighRiskCount > 0 && (
                <span className="bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold">
                  {selectedHighRiskCount} High Risk
                </span>
              )}
              {selectedWatchCount > 0 && (
                <span className="bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                  {selectedWatchCount} Watch
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedPatientIds([])}
              className="px-2.5 py-1 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              id="btn-bulk-export-pdf"
              onClick={handleBulkExportPDF}
              disabled={isExportingBulkPdf}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold text-white flex items-center space-x-1.5 transition shadow-sm cursor-pointer ${
                isExportingBulkPdf
                  ? 'bg-teal-850 opacity-90 cursor-wait'
                  : 'bg-teal-600 hover:bg-teal-500 border border-teal-500'
              }`}
              title="Generate combined PDF report for all selected patients in current clinical session"
            >
              {isExportingBulkPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-200" />
                  <span>Generating Bulk PDF ({selectedPatientIds.length})...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-teal-200" />
                  <span>Bulk Export PDF ({selectedPatientIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
          const isChecked = selectedPatientIds.includes(patient.id);

          return (
            <div
              key={patient.id}
              id={`patient-row-${patient.id}`}
              onClick={() => onSelectPatient(patient.id)}
              className={`p-3.5 transition-colors cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-50/90 border-l-3 border-l-teal-600'
                  : isChecked
                  ? 'bg-teal-50/30'
                  : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Row Select Checkbox */}
                <div
                  className="pt-1 cursor-pointer shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(patient.id);
                  }}
                  title="Toggle select for bulk export"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSelect(patient.id)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </div>

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

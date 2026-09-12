/**
 * PregnancyTwin AI - MedicationTimeline Component
 * Visually maps active medication periods as interactive horizontal bars along the Gestational Age (GA) axis.
 * Aligned with standard GA ranges (weeks 20 to 40) with dynamic positioning, hover indicators, and rich popovers.
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pill, Info, Calendar, Clock, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { MedicationExposure, VisitMeasurement } from '../types';

interface MedicationTimelineProps {
  medications: MedicationExposure[];
  visits: VisitMeasurement[];
  currentGestationalAgeWeeks: number;
}

// Dose intensity scale classifiers & segment palette generation based on actual medication dose strength
const getDoseIntensity = (dose: string): 'low' | 'medium' | 'high' => {
  const match = dose.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 'medium';
  const num = parseFloat(match[1]);
  
  // Insulin units classification
  if (dose.toLowerCase().includes('unit')) {
    if (num < 10) return 'low';
    if (num < 20) return 'medium';
    return 'high';
  }

  // Standard mg dosing tiers (e.g. Aspirin 81mg, Labetalol 100/200mg, Methyldopa 250/500mg)
  if (num <= 81) return 'low';
  if (num <= 200) return 'medium';
  return 'high';
};

const getSegmentPalette = (paletteIndex: number, intensity: 'low' | 'medium' | 'high') => {
  const idx = paletteIndex % 5;
  if (idx === 0) {
    // Teal/Emerald theme
    if (intensity === 'low') {
      return {
        bg: 'bg-gradient-to-r from-teal-200 to-emerald-200 hover:from-teal-300 hover:to-emerald-300',
        border: 'border-teal-300',
        text: 'text-teal-950',
        badge: 'bg-teal-50 text-teal-800 border-teal-200'
      };
    }
    if (intensity === 'medium') {
      return {
        bg: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
        border: 'border-teal-600',
        text: 'text-white',
        badge: 'bg-teal-100 text-teal-800 border-teal-300'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-teal-800 to-emerald-850 hover:from-teal-900 hover:to-emerald-900',
      border: 'border-teal-900',
      text: 'text-white font-extrabold',
      badge: 'bg-teal-200 text-teal-900 border-teal-400'
    };
  }
  if (idx === 1) {
    // Indigo/Purple theme
    if (intensity === 'low') {
      return {
        bg: 'bg-gradient-to-r from-indigo-200 to-purple-200 hover:from-indigo-300 hover:to-purple-300',
        border: 'border-indigo-300',
        text: 'text-indigo-950',
        badge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      };
    }
    if (intensity === 'medium') {
      return {
        bg: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
        border: 'border-indigo-600',
        text: 'text-white',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-indigo-800 to-purple-850 hover:from-indigo-900 hover:to-purple-900',
      border: 'border-indigo-900',
      text: 'text-white font-extrabold',
      badge: 'bg-indigo-200 text-indigo-900 border-indigo-400'
    };
  }
  if (idx === 2) {
    // Amber/Orange theme
    if (intensity === 'low') {
      return {
        bg: 'bg-gradient-to-r from-amber-200 to-orange-200 hover:from-amber-300 hover:to-orange-300',
        border: 'border-amber-300',
        text: 'text-amber-950',
        badge: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    }
    if (intensity === 'medium') {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
        border: 'border-amber-600',
        text: 'text-white',
        badge: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-amber-800 to-orange-850 hover:from-amber-900 hover:to-orange-900',
      border: 'border-amber-900',
      text: 'text-white font-extrabold',
      badge: 'bg-amber-200 text-amber-900 border-amber-400'
    };
  }
  if (idx === 3) {
    // Rose/Pink theme
    if (intensity === 'low') {
      return {
        bg: 'bg-gradient-to-r from-rose-200 to-pink-200 hover:from-rose-300 hover:to-pink-300',
        border: 'border-rose-300',
        text: 'text-rose-950',
        badge: 'bg-rose-50 text-rose-800 border-rose-200'
      };
    }
    if (intensity === 'medium') {
      return {
        bg: 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-rose-600',
        border: 'border-rose-600',
        text: 'text-white',
        badge: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-rose-800 to-pink-850 hover:from-rose-900 hover:to-pink-900',
      border: 'border-rose-900',
      text: 'text-white font-extrabold',
      badge: 'bg-rose-200 text-rose-900 border-rose-400'
    };
  }
  // Cyan/Sky theme
  if (intensity === 'low') {
    return {
      bg: 'bg-gradient-to-r from-cyan-200 to-sky-200 hover:from-cyan-300 hover:to-sky-300',
      border: 'border-cyan-300',
      text: 'text-cyan-950',
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-200'
    };
  }
  if (intensity === 'medium') {
    return {
      bg: 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-cyan-600',
      border: 'border-cyan-600',
      text: 'text-white',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300'
    };
  }
  return {
    bg: 'bg-gradient-to-r from-cyan-800 to-sky-850 hover:from-cyan-900 hover:to-sky-900',
    border: 'border-cyan-900',
    text: 'text-white font-extrabold',
    badge: 'bg-cyan-200 text-cyan-900 border-cyan-400'
  };
};

export const MedicationTimeline: React.FC<MedicationTimelineProps> = ({
  medications = [],
  visits = [],
  currentGestationalAgeWeeks
}) => {
  const [hoveredMed, setHoveredMed] = useState<{ med: MedicationExposure; rect: DOMRect; paletteIndex: number } | null>(null);
  const [selectedMed, setSelectedMed] = useState<MedicationExposure | null>(null);

  // Focus only on active/past medications
  const activeMeds = useMemo(() => {
    return medications.filter(m => m.exposureStatus === 'current' || m.exposureStatus === 'past');
  }, [medications]);

  // Group medications of the same active name to visualize dosage increases/decreases in a single row
  const groupedMeds = useMemo(() => {
    const groups: { [key: string]: MedicationExposure[] } = {};
    activeMeds.forEach(m => {
      const name = m.medicationName;
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(m);
    });

    // Sort intervals inside each track row chronologically by start week
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => a.gestationalAgeStartWeeks - b.gestationalAgeStartWeeks);
    });

    return groups;
  }, [activeMeds]);

  // Helper to compile the medication's longitudinal dose trajectory
  const getDoseHistory = (meds: MedicationExposure[]) => {
    if (meds.length === 1) return meds[0].dose;
    // Map distinct doses in chronological order
    const list = meds.map(m => m.dose);
    const uniqueConsecutive: string[] = [];
    list.forEach(d => {
      if (uniqueConsecutive.length === 0 || uniqueConsecutive[uniqueConsecutive.length - 1] !== d) {
        uniqueConsecutive.push(d);
      }
    });
    return uniqueConsecutive.join(' ➔ ');
  };

  // Dynamic Gestational Age range bounds - starts early enough to capture T1/T2 start weeks (e.g. 12w for Aspirin)
  const minLoggedWeek = useMemo(() => {
    if (activeMeds.length === 0) return 12;
    const minStart = Math.min(...activeMeds.map(m => m.gestationalAgeStartWeeks));
    return Math.min(12, minStart);
  }, [activeMeds]);

  const startBound = Math.max(10, Math.floor(minLoggedWeek / 2) * 2);
  const endBound = 40;
  const totalWeeks = endBound - startBound;

  // Generate 2-week step ticks for the horizontal axis ruler
  const ticks = useMemo(() => {
    const list = [];
    for (let w = startBound; w <= endBound; w += 2) {
      list.push(w);
    }
    return list;
  }, [startBound, endBound]);

  if (activeMeds.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto border border-slate-200">
          <Pill className="w-4 h-4 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900">No Medication Exposure Logged</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Visually tracking medication timelines requires entering active maternal treatments in the Medication Impact Panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-3xs space-y-5">
      
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <Pill className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900">
              Interactive Maternal Medication Exposure Axis
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              Chronologically synchronized with Gestational Age (weeks {startBound}–{endBound})
            </p>
          </div>
        </div>

        {/* Legend showing intensity steps in clean, structured chips */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <span className="text-slate-700 font-bold">Dose Intensity:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-teal-900 border border-teal-200 text-[9px] font-bold shadow-3xs">
            <span className="w-2.5 h-2 rounded bg-teal-200 border border-teal-350 inline-block" />
            <span>Low (≤81mg)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-teal-900 border border-teal-200 text-[9px] font-bold shadow-3xs">
            <span className="w-2.5 h-2 rounded bg-teal-500 inline-block" />
            <span>Medium</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-teal-900 border border-teal-200 text-[9px] font-bold shadow-3xs">
            <span className="w-2.5 h-2 rounded bg-teal-800 inline-block" />
            <span>High (&gt;200mg)</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-teal-800 font-bold text-[10px] whitespace-nowrap">
            {Object.keys(groupedMeds).length} Active Regimen{Object.keys(groupedMeds).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Timeline Grid - with clean horizontal scroll and hidden vertical overflow */}
      <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4 overflow-x-auto overflow-y-hidden min-w-[600px]">
        
        {/* Horizontal GA Axis Ticks */}
        <div className="flex items-center select-none border-b border-slate-200/60 pb-2">
          {/* Label Spaceholder */}
          <div className="w-44 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 shrink-0">
            Medication Name
          </div>
          {/* Chronological columns */}
          <div className="flex-1 flex justify-between relative pl-4 pr-4">
            {ticks.map((tick, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center text-center relative w-6">
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {tick}w
                </span>
                {/* Thin vertical grid marker line */}
                <div className="absolute top-6 w-0.5 h-48 bg-slate-200/50 z-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Tracks representing medications grouped by name to show sequential dosage changes */}
        <div className="space-y-5 relative z-10 pt-1">
          {(Object.entries(groupedMeds) as [string, MedicationExposure[]][]).map(([medicationName, exposures], medIdx) => {
            const doseHistory = getDoseHistory(exposures);
            const routeAndFreq = exposures[0] ? `${exposures[0].route} • ${exposures[0].frequency}` : '';

            return (
              <div 
                key={medicationName} 
                className="flex items-center relative py-1 hover:bg-slate-100/50 rounded-xl transition-colors"
              >
                {/* Left Medication Identity Card with Dose Trajectory */}
                <div className="w-44 pr-4 pl-2 shrink-0 space-y-0.5 z-10">
                  <div className="font-extrabold text-xs text-slate-900 leading-tight">
                    {medicationName}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 font-mono flex flex-col gap-0.5">
                    <span className="bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 w-fit font-bold">
                      {doseHistory}
                    </span>
                    <span className="text-slate-400 text-[8px] truncate">{routeAndFreq}</span>
                  </div>
                </div>

                {/* Timeline Track with Colored Segment */}
                <div className="flex-1 relative h-8 pl-4 pr-4">
                  {/* Background Track Line */}
                  <div className="absolute inset-y-3.5 left-4 right-4 bg-slate-200/40 rounded-full" />

                  {/* Render the exposures as segments on this row track */}
                  {exposures.map((med) => {
                    const startWeeks = med.gestationalAgeStartWeeks;
                    const stopWeeks = med.gestationalAgeStopWeeks || currentGestationalAgeWeeks || 40;

                    // Calculate percentage based horizontal coordinates
                    const startPercent = Math.max(0, Math.min(100, ((startWeeks - startBound) / totalWeeks) * 100));
                    const stopPercent = Math.max(0, Math.min(100, ((stopWeeks - startBound) / totalWeeks) * 100));
                    const widthPercent = Math.max(4, stopPercent - startPercent);

                    const intensity = getDoseIntensity(med.dose);
                    const design = getSegmentPalette(medIdx, intensity);
                    const isSelected = selectedMed?.id === med.id;

                    return (
                      <div
                        key={med.id}
                        style={{
                          left: `calc(${startPercent}% + 16px)`,
                          width: `calc(${widthPercent}%)`,
                        }}
                        className={`absolute inset-y-1 rounded-full cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between px-3 group border shadow-3xs ${design.bg} ${design.border} ${design.text} ${
                          isSelected ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                        }`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredMed({ med, rect, paletteIndex: medIdx });
                        }}
                        onMouseLeave={() => setHoveredMed(null)}
                        onClick={() => setSelectedMed(prev => (prev?.id === med.id ? null : med))}
                        title="Click to lock regimen details in inspector"
                      >
                        <span className="truncate pr-1 text-[9px] font-bold">
                          {med.dose} ({startWeeks}w - {stopWeeks}w)
                        </span>
                        <Clock className="w-3 h-3 opacity-85 shrink-0" />
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Pinned Regimen Detailed Inspector (Active when a pill is clicked) */}
      {selectedMed && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-500 flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="w-5 h-5 text-teal-400" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-sm text-white">{selectedMed.medicationName}</h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                  {selectedMed.dose} • {selectedMed.frequency}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700">
                  {selectedMed.exposureStatus} Exposure
                </span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-slate-400 font-semibold">Indication:</strong> "{selectedMed.indication}" 
                {selectedMed.maternalCondition ? ` • Target: ${selectedMed.maternalCondition}` : ''}
              </p>
              <div className="text-[11px] text-teal-300/90 font-mono flex items-center gap-3 pt-0.5">
                <span>Prescribed Range: {selectedMed.gestationalAgeStartWeeks}w — {selectedMed.gestationalAgeStopWeeks || currentGestationalAgeWeeks}w</span>
                <span>•</span>
                <span>Route: {selectedMed.route}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedMed(null)}
            className="self-start md:self-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Inspector</span>
          </button>
        </div>
      )}

      {/* Contextual Clinical Info */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start space-x-2 text-[10px] text-slate-500 leading-normal font-medium">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <p>
          <strong>Clinical Dose Intensity Axis:</strong> Regimen tracks are grouped by medication name to highlight dosage adjustments (increases or decreases) chronologically. Hover over any regimen bar to inspect dosage specifications and clinical indications, or click a bar to pin it to the active inspector.
        </p>
      </div>

      {/* Unclipped Global Viewport Tooltip (Rendered via React Portal) */}
      {hoveredMed && typeof document !== 'undefined' && createPortal(
        (() => {
          const { med, rect, paletteIndex } = hoveredMed;
          const intensity = getDoseIntensity(med.dose);
          const design = getSegmentPalette(paletteIndex, intensity);
          const placeBelow = rect.top < 280;
          const tooltipWidth = 320;
          const pillCenter = rect.left + rect.width / 2;
          const clampedLeft = Math.max(tooltipWidth / 2 + 16, Math.min(window.innerWidth - tooltipWidth / 2 - 16, pillCenter));

          const style: React.CSSProperties = {
            position: 'fixed',
            left: `${clampedLeft}px`,
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: `${tooltipWidth}px`,
          };

          if (placeBelow) {
            style.top = `${rect.bottom + 10}px`;
          } else {
            style.bottom = `${window.innerHeight - rect.top + 10}px`;
          }

          const startWeeks = med.gestationalAgeStartWeeks;
          const stopWeeks = med.gestationalAgeStopWeeks || currentGestationalAgeWeeks || 40;

          return (
            <div
              style={style}
              className="bg-slate-950 text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-700 text-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none space-y-3 text-left"
            >
              {/* Pointer Arrow */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-slate-700 transform rotate-45 ${
                  placeBelow 
                    ? '-top-1.5 border-t border-l' 
                    : '-bottom-1.5 border-b border-r'
                }`}
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-950 border border-teal-700 flex items-center justify-center shrink-0">
                    <Pill className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="leading-tight">
                    <span className="font-extrabold text-white text-[13px] block">
                      {med.medicationName}
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono">
                      {startWeeks}w — {stopWeeks}w Active
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${design.badge}`}>
                  {intensity.toUpperCase()} DOSE
                </span>
              </div>

              {/* Metrics 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-b border-slate-800/80 pb-2.5">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Dose Strength</span>
                  <strong className="text-white font-mono">{med.dose}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Frequency</span>
                  <strong className="text-white">{med.frequency}</strong>
                </div>
                <div className="mt-1">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Route</span>
                  <strong className="text-white">{med.route}</strong>
                </div>
                <div className="mt-1">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Exposure Status</span>
                  <strong className="text-teal-400 capitalize">{med.exposureStatus}</strong>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Clinical Indication</span>
                  <p className="text-slate-200 font-medium italic">"{med.indication}"</p>
                </div>
                {med.maternalCondition && (
                  <div className="pt-0.5">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">Maternal Target Condition</span>
                    <p className="text-slate-300 font-medium">{med.maternalCondition}</p>
                  </div>
                )}
              </div>

              {/* Footer alignment */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-teal-400 font-bold">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Maternal-Fetal Clinical Alignment</span>
                </div>
                <span className="text-slate-400 text-[9px] font-normal">Click to pin</span>
              </div>
            </div>
          );
        })(),
        document.body
      )}

    </div>
  );
};

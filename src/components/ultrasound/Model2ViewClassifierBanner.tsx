/**
 * PregnancyTwin AI - MODEL 2: Ultrasound View / Plane Classification AI
 * 
 * Second critical stage of the ultrasound AI pipeline:
 * ULTRASOUND SCAN -> MODEL 1 (Quality Gate) -> MODEL 2 (View Classifier) -> DOWNSTREAM U-NETS
 * 
 * Architectural Framework:
 *  - Backbone: Swin Transformer (Shifted Windows, Patch Partitioning, Hierarchical Attention)
 *  - 5-Class Categorization:
 *      1. HEAD: Fetal head biometric plane -> Head U-Net (HC, BPD, OFD)
 *      2. ABDOMEN: Fetal abdominal biometric plane -> Abdomen U-Net (AC)
 *      3. FEMUR: Fetal femur diaphysis plane -> Femur U-Net (FL)
 *      4. OTHER: Non-biometric ultrasound scan -> No downstream measurement
 *      5. UNKNOWN: Ambiguous / Low Confidence (<0.65) -> Clinician Manual Selection
 */

import React, { useState } from 'react';
import {
  Compass,
  Layers,
  ArrowRight,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  RefreshCw,
  Cpu,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { UltrasoundViewResult, UltrasoundViewClass } from '../../types';

export interface Model2ViewClassifierBannerProps {
  result: UltrasoundViewResult | null;
  isLoading: boolean;
  onProceedToDownstream: () => void;
  onSelectViewOverride?: (view: UltrasoundViewClass) => void;
  onOpenNotebookModal?: () => void;
  overrideActiveView?: UltrasoundViewClass | null;
}

const VIEW_METADATA: Record<UltrasoundViewClass, {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  gradientBg: string;
  nextModel: string;
  biometrics: string[];
  description: string;
}> = {
  HEAD: {
    label: 'Fetal Head Biometric Plane',
    badgeBg: 'bg-sky-500',
    badgeText: 'text-sky-950 font-black',
    borderCol: 'border-sky-500/50',
    gradientBg: 'from-sky-950/90 via-slate-900 to-slate-900',
    nextModel: 'Head U-Net (Skull Segmentation)',
    biometrics: ['HC (Head Circumference)', 'BPD (Biparietal Diameter)', 'OFD (Occipitofrontal Diameter)'],
    description: 'Transthalamic / transventricular biparietal plane displaying symmetric thalami, cavum septi pellucidi, and continuous midline falx echo.'
  },
  ABDOMEN: {
    label: 'Fetal Abdominal Biometric Plane',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-emerald-950 font-black',
    borderCol: 'border-emerald-500/50',
    gradientBg: 'from-emerald-950/90 via-slate-900 to-slate-900',
    nextModel: 'Abdomen U-Net (Perimeter Fit)',
    biometrics: ['AC (Abdominal Circumference)'],
    description: 'Transverse circular abdominal view displaying gastric bubble, portal-umbilical vein junction (J-shape), without renal shadows.'
  },
  FEMUR: {
    label: 'Fetal Femur Biometric Plane',
    badgeBg: 'bg-indigo-500',
    badgeText: 'text-indigo-950 font-black',
    borderCol: 'border-indigo-500/50',
    gradientBg: 'from-indigo-950/90 via-slate-900 to-slate-900',
    nextModel: 'Femur U-Net (Diaphysis Endpoint Extraction)',
    biometrics: ['FL (Femur Length)'],
    description: 'Longitudinal view of the fully ossified femoral diaphysis oriented perpendicular to acoustic insonation, displaying distinct blunt ends.'
  },
  OTHER: {
    label: 'Non-Biometric Ultrasound View',
    badgeBg: 'bg-purple-500',
    badgeText: 'text-purple-950 font-black',
    borderCol: 'border-purple-500/50',
    gradientBg: 'from-purple-950/90 via-slate-900 to-slate-900',
    nextModel: 'None (Inform Clinician)',
    biometrics: [],
    description: 'Anatomical survey or Doppler view (heart, spine, placenta, face, or cord). Does not represent target biometric planes for automated calipers.'
  },
  UNKNOWN: {
    label: 'Ambiguous / Low-Confidence View',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-amber-950 font-black',
    borderCol: 'border-amber-500/50',
    gradientBg: 'from-amber-950/90 via-slate-900 to-slate-900',
    nextModel: 'Clinician Manual Plane Confirmation',
    biometrics: [],
    description: 'Model confidence is below safety uncertainty threshold (<0.65) or represents an off-axis transitional scan. Manual review required.'
  }
};

export const Model2ViewClassifierBanner: React.FC<Model2ViewClassifierBannerProps> = ({
  result,
  isLoading,
  onProceedToDownstream,
  onSelectViewOverride,
  onOpenNotebookModal,
  overrideActiveView
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showOverrideSelector, setShowOverrideSelector] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-indigo-500/40 shadow-md animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-300 font-mono">
                MODEL 2 — VIEW CLASSIFIER
              </span>
              <span className="text-xs text-slate-300">Swin Transformer (Hierarchical Shifted Windows)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating anatomical structures, patch partition spatial relationships, and plane-specific signatures...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const currentView = overrideActiveView || result.view_class;
  const meta = VIEW_METADATA[currentView] || VIEW_METADATA.UNKNOWN;
  const isOverridden = !!overrideActiveView && overrideActiveView !== result.view_class;
  const isUncertain = result.is_uncertain && !isOverridden;
  const confidencePct = Math.round(result.confidence * 100);

  const handleSelectOverride = (view: UltrasoundViewClass) => {
    if (onSelectViewOverride) {
      onSelectViewOverride(view);
    }
    setShowOverrideSelector(false);
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all shadow-md bg-gradient-to-r ${meta.gradientBg} ${meta.borderCol} text-white`}>
      
      {/* Top Header: Pipeline View Classifier Step & Active View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs bg-white/10 ${meta.borderCol}`}>
            <Compass className="w-5 h-5 text-indigo-300" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 font-mono text-slate-200 border border-white/10">
                MODEL 2 — VIEW ROUTING
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${meta.badgeBg} ${meta.badgeText}`}>
                {currentView}
              </span>
              {isOverridden && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 font-mono">
                  CLINICIAN OVERRIDE
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-mono">
                {result.model_name} ({result.model_version})
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
              <span>{meta.label}</span>
              {isUncertain && (
                <span className="text-amber-300 text-xs flex items-center gap-1 font-normal">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Low Confidence (&lt;65%) — Confirmation Recommended
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Confidence & Routing Score Box */}
        <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Classification Confidence
            </div>
            <div className="text-lg font-black font-mono leading-none flex items-baseline justify-end gap-1">
              <span className={confidencePct >= 80 ? 'text-emerald-400' : confidencePct >= 65 ? 'text-amber-400' : 'text-rose-400'}>
                {result.confidence.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">({confidencePct}%)</span>
            </div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="text-left text-[10px] text-slate-400 font-mono leading-tight">
            <div>&ge;0.65: <span className="text-emerald-400">AUTO-ROUTE</span></div>
            <div>&lt;0.65: <span className="text-amber-400">HUMAN REVIEW</span></div>
          </div>
        </div>
      </div>

      {/* Pipeline Navigation Flow Indicator */}
      <div className="my-3 py-2 px-3 rounded-lg bg-black/30 border border-white/5 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-emerald-300 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MODEL 1: Quality Gate (Passed)</span>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="font-bold text-indigo-300 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>MODEL 2: {currentView}</span>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-teal-300 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{meta.nextModel}</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-300">
          Target Biometrics: <strong className="text-white">{meta.biometrics.length > 0 ? meta.biometrics.join(', ') : 'None (Survey View)'}</strong>
        </div>
      </div>

      {/* View Anatomical Description & Rationale */}
      <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5 flex items-start space-x-2">
        <Info className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Anatomical Verification: </span>
          <span>{meta.description}</span>
          {meta.biometrics.length > 0 && (
            <div className="mt-1 text-[11px] text-indigo-200">
              Downstream Model Selected: <strong className="text-white">{meta.nextModel}</strong> will extract {meta.biometrics.join(' and ')}.
            </div>
          )}
        </div>
      </div>

      {/* Top-3 Predictions & Class Probability Bars */}
      <div className="mt-3 bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-bold text-slate-300">Swin Transformer Top-3 Predictions</span>
          <span className="text-[10px]">Threshold: 0.65</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {result.top3.map((pred, idx) => {
            const pct = Math.round(pred.confidence * 100);
            const isTop = idx === 0;
            return (
              <div
                key={pred.view}
                className={`p-2 rounded-lg border flex flex-col justify-between ${
                  isTop
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] flex items-center justify-center font-bold">
                      #{idx + 1}
                    </span>
                    <span>{pred.view}</span>
                  </span>
                  <span className="font-mono font-bold text-teal-300">{pct}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isTop ? 'bg-indigo-400' : 'bg-slate-400'}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swin Transformer Technical Feature Details Toggle */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer transition"
        >
          <span>{showTechnicalDetails ? 'Hide' : 'View'} Swin Transformer Architecture (Shifted Windows, Patches, Attention)</span>
          {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/50 p-3 rounded-xl border border-white/10 font-mono">
            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Backbone Architecture</div>
              <div className="font-bold text-white text-xs mt-0.5">Swin-T (Patch 4, Win 7)</div>
              <div className="text-[10px] text-indigo-300 mt-0.5">Shifted Local Windows</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Input Resolution</div>
              <div className="font-bold text-white text-xs mt-0.5">224 × 224 RGB</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Normalized Tensor</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Hierarchical Stages</div>
              <div className="font-bold text-white text-xs mt-0.5">4 Stages (Linear Embed)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">768-Dim Features</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Classification Head</div>
              <div className="font-bold text-white text-xs mt-0.5">5 Classes (Softmax)</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Weighted Cross-Entropy</div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Gate Controls & Clinician Override */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {onOpenNotebookModal && (
            <button
              type="button"
              onClick={onOpenNotebookModal}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Inspect 26-Cell Google Colab Training Notebook & Swin Architecture"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Model 2 Colab Notebook</span>
            </button>
          )}

          {/* Clinician Plane Override Selector */}
          {!showOverrideSelector ? (
            <button
              type="button"
              onClick={() => setShowOverrideSelector(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title="Manual Anatomical Plane Selection / Override"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Change / Confirm Plane...</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-black/70 p-1.5 rounded-xl border border-indigo-500/50">
              <span className="text-[10px] text-slate-400 uppercase font-mono px-1">Select Plane:</span>
              {(['HEAD', 'ABDOMEN', 'FEMUR', 'OTHER', 'UNKNOWN'] as UltrasoundViewClass[]).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSelectOverride(v)}
                  className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    currentView === v
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowOverrideSelector(false)}
                className="px-1.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Downstream Execution Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onProceedToDownstream}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition cursor-pointer ${
              currentView === 'HEAD'
                ? 'bg-sky-400 hover:bg-sky-300 text-sky-950'
                : currentView === 'ABDOMEN'
                ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950'
                : currentView === 'FEMUR'
                ? 'bg-indigo-400 hover:bg-indigo-300 text-indigo-950'
                : currentView === 'OTHER'
                ? 'bg-purple-400 hover:bg-purple-300 text-purple-950'
                : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
            }`}
          >
            <span>Proceed to {meta.nextModel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

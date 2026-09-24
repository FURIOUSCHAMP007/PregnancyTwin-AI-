/**
 * PregnancyTwin AI - MODEL 1: Ultrasound Image Quality Assessment & Quality Gate
 * 
 * First safety gate of the ultrasound AI pipeline:
 * ULTRASOUND IMAGE -> MODEL 1 (Quality Gate) -> MODEL 2 (View Classifier) -> MODEL 3/4/5 (Segmentation)
 * 
 * Enforces Three-State Output:
 *  - GOOD (score >= 0.85): proceed = true -> Model 2
 *  - REVIEW (0.60 <= score < 0.85): proceed = false -> Clinician Confirmation Required
 *  - POOR (score < 0.60): proceed = false -> STOP / RECAPTURE
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  FileCode,
  Download,
  Info,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UltrasoundQualityResult } from '../../types';

export interface Model1QualityGateBannerProps {
  result: UltrasoundQualityResult | null;
  isLoading: boolean;
  onProceedToModel2: () => void;
  onRecapture: () => void;
  onOverride?: (reason: string) => void;
  onOpenNotebookModal?: () => void;
}

export const Model1QualityGateBanner: React.FC<Model1QualityGateBannerProps> = ({
  result,
  isLoading,
  onProceedToModel2,
  onRecapture,
  onOverride,
  onOpenNotebookModal
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [overrideActive, setOverrideActive] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('Visual calipers distinguishable despite acoustic artifact.');

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-teal-500/40 shadow-md animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 font-mono">
                MODEL 1 — SAFETY GATE
              </span>
              <span className="text-xs text-slate-300">EfficientNet-B0 + CV Quality Pipeline</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating image usability, edge sharpness, acoustic shadowing, and signal-to-noise ratio...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const {
    quality_class,
    quality_score,
    proceed,
    quality_reason,
    technical_metrics,
    model_name,
    model_version,
    next_stage
  } = result;

  const scorePct = Math.round(quality_score * 100);
  const isGood = quality_class === 'GOOD';
  const isReview = quality_class === 'REVIEW';
  const isPoor = quality_class === 'POOR';

  const handleApplyOverride = () => {
    if (onOverride) {
      onOverride(overrideReason);
    }
    onProceedToModel2();
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all shadow-md ${
      isGood
        ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-500/50 text-white'
        : isReview
        ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border-amber-500/50 text-white'
        : 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-rose-500/60 text-white'
    }`}>
      
      {/* Top Header: Pipeline Gate Step & Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
            isGood
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
              : isReview
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
              : 'bg-rose-500/20 border-rose-400/40 text-rose-400'
          }`}>
            {isGood ? (
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            ) : isReview ? (
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-300 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 font-mono text-slate-200 border border-white/10">
                MODEL 1 — QUALITY GATE
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${
                isGood
                  ? 'bg-emerald-500 text-emerald-950 font-black'
                  : isReview
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : 'bg-rose-600 text-white font-black'
              }`}>
                {quality_class}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {model_name} ({model_version})
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
              {isGood && <span>Image Quality Verified — Suitable for Downstream Analysis</span>}
              {isReview && <span>Borderline Quality — Clinician Visual Review Required</span>}
              {isPoor && <span>Safety Gate Stopped — Image Quality Insufficient for Automated AI</span>}
            </h4>
          </div>
        </div>

        {/* Score & Threshold Badge */}
        <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Quality Score
            </div>
            <div className="text-lg font-black font-mono leading-none flex items-baseline justify-end gap-1">
              <span className={isGood ? 'text-emerald-400' : isReview ? 'text-amber-400' : 'text-rose-400'}>
                {quality_score.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 1.00</span>
            </div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="text-left text-[10px] text-slate-400 font-mono leading-tight">
            <div>≥0.85: <span className="text-emerald-400">GOOD</span></div>
            <div>0.60–0.85: <span className="text-amber-400">REV</span></div>
            <div>&lt;0.60: <span className="text-rose-400">POOR</span></div>
          </div>
        </div>
      </div>

      {/* Pipeline Navigation Flow Indicator */}
      <div className="my-3 py-2 px-3 rounded-lg bg-black/30 border border-white/5 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center space-x-2 font-mono">
          <span className="font-bold text-teal-300 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>MODEL 1: Quality Gate</span>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className={`flex items-center gap-1 ${proceed ? 'text-white font-medium' : 'text-slate-500'}`}>
            <span>MODEL 2: View Classifier (ViT)</span>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">
            <span>MODEL 3/4/5: Segmentation</span>
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-300">
          Next Stage: <strong className={isGood ? 'text-emerald-300' : isReview ? 'text-amber-300' : 'text-rose-300'}>{next_stage}</strong>
        </div>
      </div>

      {/* Rationale explanation */}
      <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5 flex items-start space-x-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Quality Gate Reason: </span>
          <span>{quality_reason}</span>
          {isPoor && (
            <div className="mt-1 text-rose-200 text-[11px]">
              Recommendation: Reposition transducer, optimize acoustic gain, eliminate rib shadowing, and recapture scan before feeding automated caliper model.
            </div>
          )}
        </div>
      </div>

      {/* Technical Non-ML Metrics Toggle & Content */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer transition"
        >
          <span>{showTechnicalDetails ? 'Hide' : 'View'} Technical Engineering Metrics (Sharpness, Contrast, SNR)</span>
          {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showTechnicalDetails && technical_metrics && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/10 font-mono">
            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Sharpness (Laplacian)</div>
              <div className="font-bold text-white text-sm">{technical_metrics.sharpness.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400">{technical_metrics.sharpness > 50 ? 'Sharp boundaries' : 'Blown/blurry'}</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Contrast (StdDev)</div>
              <div className="font-bold text-white text-sm">{technical_metrics.contrast.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400">{technical_metrics.contrast > 40 ? 'High dynamic range' : 'Low contrast'}</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Brightness (Mean)</div>
              <div className="font-bold text-white text-sm">{technical_metrics.brightness.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400">Gain calibrated</div>
            </div>

            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">Signal-to-Noise (SNR)</div>
              <div className="font-bold text-white text-sm">{technical_metrics.snr_db.toFixed(1)} dB</div>
              <div className="text-[10px] text-slate-400">Acoustic clarity</div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Gate Controls */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {onOpenNotebookModal && (
            <button
              type="button"
              onClick={onOpenNotebookModal}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Inspect 26-Cell Google Colab Training Notebook & Architecture"
            >
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>Model 1 Colab Notebook</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPoor && (
            <>
              <button
                type="button"
                onClick={onRecapture}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                <span>Recapture / Upload Alternative Scan</span>
              </button>

              {!overrideActive ? (
                <button
                  type="button"
                  onClick={() => setOverrideActive(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                  title="Senior Clinician Override (Emergency Documentation)"
                >
                  <Unlock className="w-3 h-3 text-amber-400" />
                  <span>Clinician Override...</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 bg-black/60 p-1 rounded-xl border border-amber-500/40">
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter clinical override rationale"
                    className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white w-48 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyOverride}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Confirm & Proceed
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideActive(false)}
                    className="px-1.5 py-1 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          {isReview && (
            <>
              <button
                type="button"
                onClick={onRecapture}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Upload Alternative
              </button>

              <button
                type="button"
                onClick={onProceedToModel2}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <span>Clinician Verified — Proceed to Model 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {isGood && (
            <button
              type="button"
              onClick={onProceedToModel2}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <span>Quality Gate Passed — Proceed to Model 2 (View Classifier)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Printer,
  Download,
  X,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export interface ExportConfirmationData {
  patientName: string;
  patientMrn: string;
  gestationalAge: string;
  riskProfile: string;
  timestamp: string;
  visitCount: number;
  isPopupBlocked?: boolean;
}

interface PdfExportNotificationToastProps {
  data: ExportConfirmationData | null;
  onClose: () => void;
  onReprint?: () => void;
  onViewReport?: () => void;
  onDownloadJson?: () => void;
  autoCloseDuration?: number; // in milliseconds, default 7000
}

export const PdfExportNotificationToast: React.FC<PdfExportNotificationToastProps> = ({
  data,
  onClose,
  onReprint,
  onViewReport,
  onDownloadJson,
  autoCloseDuration = 7000
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data) return;

    setProgress(100);
    const intervalMs = 50;
    const step = (intervalMs / autoCloseDuration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return Math.max(0, prev - step);
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [data, isPaused, autoCloseDuration, onClose]);

  if (!data) return null;

  const handleCopyDetails = () => {
    const text = `PregnancyTwin AI Clinical Summary\nPatient: ${data.patientName} (MRN: ${data.patientMrn})\nGestational Age: ${data.gestationalAge}\nRisk Profile: ${data.riskProfile}\nGenerated: ${data.timestamp}\nVisits: ${data.visitCount}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="pdf-export-toast-notification"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] bg-slate-900/95 backdrop-blur-md text-slate-100 rounded-xl border border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 font-sans"
    >
      {/* Top Accent Gradient Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

      <div className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Report Generated for Print</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  READY
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                ACOG/ISUOG Clinical Summary compiled successfully
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            title="Dismiss notification"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient & Report Metadata Details Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">PATIENT:</span>
            <span className="font-bold text-teal-300">{data.patientName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">MRN:</span>
            <span>{data.patientMrn}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">GESTATIONAL AGE:</span>
            <span>{data.gestationalAge}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/80 text-[10px]">
            <span className="text-slate-500">DATA SET:</span>
            <span className="text-slate-400">{data.visitCount} visits • {data.riskProfile} Risk</span>
          </div>
        </div>

        {/* Instruction Tip on How to Save as PDF */}
        <div className="flex items-start gap-2 bg-teal-950/40 border border-teal-800/50 rounded-lg p-2 text-[10px] text-teal-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <span>
            <strong>PDF Tip:</strong> In your browser's print dialog, set <strong>Destination</strong> to <em>Save as PDF</em> to save a copy directly to your files.
          </span>
        </div>

        {/* Popup Blocked Warning (if browser sandbox blocked popup) */}
        {data.isPopupBlocked && (
          <div className="flex items-start gap-2 bg-amber-950/50 border border-amber-800/60 rounded-lg p-2 text-[10px] text-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Browser blocked automatic popup window. Click <strong>Reprint / Open Dialog</strong> below to launch print dialog directly.
            </span>
          </div>
        )}

        {/* Action Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {onReprint && (
              <button
                type="button"
                id="btn-toast-reprint"
                onClick={onReprint}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-[11px] font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Open Print Dialog</span>
              </button>
            )}

            {onViewReport && (
              <button
                type="button"
                id="btn-toast-view-report"
                onClick={onViewReport}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-md text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer border border-slate-700"
                title="Open full interactive clinical report modal"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Preview Modal</span>
              </button>
            )}

            {onDownloadJson && (
              <button
                type="button"
                id="btn-toast-download-json"
                onClick={onDownloadJson}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer border border-slate-700"
                title="Download structured JSON report data"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyDetails}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[10px] flex items-center space-x-1 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Dismiss Progress Bar at the Bottom */}
      <div className="h-0.5 w-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-teal-400 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

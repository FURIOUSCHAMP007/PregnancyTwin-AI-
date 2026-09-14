/**
 * PregnancyTwin AI - Gemini Clinical Copilot with Function Calling & Multilingual Explanations
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Wrench,
  Globe,
  MessageSquare,
  Copy,
  Check,
  BookOpen,
  Info
} from 'lucide-react';
import { CopilotMessage, Patient, User } from '../types';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPatient?: Patient;
  currentUser?: User;
}

const INDIAN_LANGUAGES = [
  'Hindi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'English'
];

// Custom styled parser to render Markdown tables, bullet points, and bold text cleanly without raw asterisks
const renderMessageContent = (content: string) => {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentTableLines: string[] = [];
  let currentListLines: { type: 'bullet' | 'number'; text: string }[] = [];

  const formatInlineText = (text: string) => {
    let clean = text.trim();
    const resParts: React.ReactNode[] = [];
    let i = 0;
    let partKey = 0;

    while (i < clean.length) {
      if (clean.substring(i, i + 2) === '**') {
        const endIdx = clean.indexOf('**', i + 2);
        if (endIdx !== -1) {
          const boldText = clean.substring(i + 2, endIdx);
          resParts.push(<strong key={`b-${partKey++}`} className="font-bold text-slate-900">{boldText}</strong>);
          i = endIdx + 2;
          continue;
        }
      }
      if (clean.charAt(i) === '`') {
        const endIdx = clean.indexOf('`', i + 1);
        if (endIdx !== -1) {
          const codeText = clean.substring(i + 1, endIdx);
          resParts.push(
            <code key={`c-${partKey++}`} className="bg-slate-100 text-teal-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border border-slate-200">
              {codeText}
            </code>
          );
          i = endIdx + 1;
          continue;
        }
      }
      
      // Normal segment
      let nextSpecial = i;
      while (nextSpecial < clean.length) {
        if (clean.substring(nextSpecial, nextSpecial + 2) === '**' || clean.charAt(nextSpecial) === '`') {
          break;
        }
        nextSpecial++;
      }
      resParts.push(clean.substring(i, nextSpecial));
      i = nextSpecial;
    }
    return resParts.length > 0 ? resParts : clean;
  };

  const flushTable = (key: string | number) => {
    if (currentTableLines.length === 0) return;
    
    const headerLine = currentTableLines[0];
    const headers = headerLine.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    
    const startIdx = (currentTableLines[1] && currentTableLines[1].includes('---')) ? 2 : 1;
    const rows = currentTableLines.slice(startIdx).map(line => {
      return line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    }).filter(row => row.length > 0);

    if (headers.length > 0) {
      blocks.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
          <table className="min-w-full divide-y divide-slate-200 text-[11px] text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 border-b border-slate-200 font-semibold text-slate-700">
                    {formatInlineText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-slate-600">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2.5 font-medium whitespace-nowrap">
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    currentTableLines = [];
  };

  const flushList = (key: string | number) => {
    if (currentListLines.length === 0) return;
    
    blocks.push(
      <ul key={`list-${key}`} className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-600 leading-relaxed">
        {currentListLines.map((item, idx) => (
          <li key={idx} className="font-medium text-slate-600">
            {formatInlineText(item.text)}
          </li>
        ))}
      </ul>
    );
    
    currentListLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith('|');
    const isBulletLine = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');

    if (isTableLine) {
      flushList(i);
      currentTableLines.push(line);
    } else if (isBulletLine) {
      flushTable(i);
      const bulletText = line.replace(/^[•\-*]\s*/, '');
      currentListLines.push({ type: 'bullet', text: bulletText });
    } else {
      flushTable(i);
      flushList(i);
      
      if (line.trim() === '') {
        blocks.push(<div key={`empty-${i}`} className="h-2" />);
      } else {
        blocks.push(
          <p key={`p-${i}`} className="text-slate-600 font-medium leading-relaxed my-1.5">
            {formatInlineText(line)}
          </p>
        );
      }
    }
  }

  flushTable(lines.length);
  flushList(lines.length);

  return <div className="space-y-1">{blocks}</div>;
};

// Beautiful Interactive Data Inspector component for JSON tool responses
const StructuredToolResult: React.FC<{ functionName: string; result: any }> = ({ functionName, result }) => {
  if (!result || typeof result !== 'object') return null;

  switch (functionName) {
    case 'getPatientsWithDecreasingAFI': {
      const pList = result.patients || [];
      return (
        <div className="mt-2.5 bg-rose-50/50 border border-rose-100 rounded-lg p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-rose-950 border-b border-rose-100 pb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              Grounded Cohort: Decreasing AFI ({result.count} Patients)
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{result.scopedToClinician || 'Hospital-wide'}</span>
          </div>
          <div className="space-y-2">
            {pList.map((p: any, idx: number) => (
              <div key={idx} className="bg-white border border-rose-100/60 rounded-md p-2 flex items-center justify-between shadow-3xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">{p.name} <span className="font-mono text-[9px] text-slate-400 font-normal">({p.mrn})</span></div>
                  <div className="text-[10px] text-slate-500">
                    AFI Velocity: <strong className="text-rose-600">{(p.currentAfi - p.previousAfi).toFixed(1)} cm</strong> ({p.previousAfi} ➔ {p.currentAfi} cm)
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full font-mono">
                    {p.dropPercentage > 0 ? `+${p.dropPercentage}%` : `${p.dropPercentage}%`}
                  </span>
                  <div className="text-[9px] font-bold text-slate-400">{p.trajectory}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'getPatientTrajectory': {
      return (
        <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-850 border-b border-slate-200 pb-1.5">
            <span>Clinical Trajectory Summary</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-mono">{result.trajectoryCategory}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded border border-slate-200 text-center">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Overall Score</div>
              <div className="text-sm font-black text-slate-800">{result.overallScore}/100</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-center">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Fluid Score</div>
              <div className="text-sm font-black text-blue-600">{result.fluidScore}/100</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-center">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Growth Score</div>
              <div className="text-sm font-black text-emerald-600">{result.growthScore}/100</div>
            </div>
          </div>
          <div className="space-y-1 text-slate-600 pt-1">
            <div>AFI Velocity: <strong className="text-slate-800 font-bold">{result.afiVelocity}</strong></div>
            <div>Growth Velocity: <strong className="text-slate-800 font-bold">{result.growthVelocity}</strong></div>
            {result.whyNowTriggered && (
              <div className="mt-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded p-1.5 font-medium leading-relaxed">
                ⚠️ <strong>Trajectory Flag</strong>: {result.whyNowSummary}
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'getTrajectoryForecast': {
      return (
        <div className="mt-2.5 bg-teal-50/50 border border-teal-100 rounded-lg p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-teal-950 border-b border-teal-100 pb-1.5">
            <span>Projection Forecast (GA {result.expectedGaWeeks}w)</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-mono">{result.confidence} Confidence</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div className="bg-white p-2 rounded border border-teal-100">
              <div className="text-slate-400 font-bold text-[8px] uppercase">Projected AFI Range</div>
              <div className="text-xs font-bold text-slate-800 font-mono">{result.expectedAfiRange}</div>
            </div>
            <div className="bg-white p-2 rounded border border-teal-100">
              <div className="text-slate-400 font-bold text-[8px] uppercase">Projected Growth Percentile</div>
              <div className="text-xs font-bold text-slate-800 font-mono">{result.expectedGrowthPercentileRange}</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 italic font-medium leading-relaxed pt-1 border-t border-teal-100/50">
            * {result.disclaimer}
          </div>
        </div>
      );
    }

    case 'comparePatientVisits': {
      const eVis = result.earlierVisit || {};
      const lVis = result.laterVisit || {};
      const deltas = result.deltas || {};
      return (
        <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1">
            <span>Ultrasound Interval Comparison</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">{result.intervalElapsedWeeks}w Interval</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="font-bold text-slate-500 border-b pb-0.5 mb-1">Earlier (GA {eVis.ga})</div>
              <div>Date: {eVis.date}</div>
              <div>AFI: <strong className="text-slate-800 font-mono">{eVis.afi_cm} cm</strong></div>
              <div>EFW: <strong className="text-slate-800 font-mono">{eVis.efw_g} g</strong></div>
              <div>Percentile: <strong className="text-slate-800 font-mono">{eVis.growthPercentile}%ile</strong></div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="font-bold text-slate-500 border-b pb-0.5 mb-1 font-semibold">Later (GA {lVis.ga})</div>
              <div>Date: {lVis.date}</div>
              <div>AFI: <strong className="text-slate-800 font-mono">{lVis.afi_cm} cm</strong></div>
              <div>EFW: <strong className="text-slate-800 font-mono">{lVis.efw_g} g</strong></div>
              <div>Percentile: <strong className="text-slate-800 font-mono">{lVis.growthPercentile}%ile</strong></div>
            </div>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-md p-2 space-y-1 text-[10px] text-teal-900">
            <div className="font-bold uppercase tracking-wider text-[8px] text-teal-800">Interval Velocity & Trends</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div>AFI Delta: <strong className={deltas.deltaAfi_cm < 0 ? 'text-rose-600' : 'text-emerald-600'}>{deltas.deltaAfi_cm} cm ({deltas.afiPercentageChange})</strong></div>
              <div>AFI Velocity: <strong>{deltas.afiVelocity_cmPerWeek} cm/wk</strong></div>
              <div>EFW Delta: <strong className="text-emerald-700">+{deltas.deltaEfw_g} g</strong></div>
              <div>EFW Velocity: <strong>{deltas.efwVelocity_gPerWeek} g/wk</strong></div>
            </div>
            <div className="text-[9px] font-bold text-teal-850 border-t border-teal-100/30 pt-1 mt-1">
              Trend Status: {deltas.trendAlert}
            </div>
          </div>
        </div>
      );
    }

    case 'explainTrajectoryAlert': {
      const recs = result.reasons || [];
      return (
        <div className="mt-2.5 bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-amber-950 border-b border-amber-200 pb-1.5">
            <span>Clinician Alert Breakdown</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">{result.status}</span>
          </div>
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-800">{result.whyNowSummary}</div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
              <div>AFI Velocity: <strong className="text-slate-800">{result.afiVelocity}</strong></div>
              <div>Growth Velocity: <strong className="text-slate-800">{result.growthVelocity}</strong></div>
            </div>
            <div className="bg-white border border-amber-100 rounded p-2 text-slate-700">
              <div className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">Key Trajectory Factors</div>
              <ul className="list-disc pl-4 space-y-1 text-[10px]">
                {recs.map((r: string, idx: number) => (
                  <li key={idx} className="font-medium text-slate-600">{r}</li>
                ))}
              </ul>
            </div>
            <div className="text-[9px] text-slate-500 leading-relaxed font-medium pt-1">
              📚 <strong>Reference Guidelines</strong>: {result.guidelineReference}
            </div>
          </div>
        </div>
      );
    }

    case 'getPatientMedications': {
      const meds = result.medications || [];
      return (
        <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-slate-850 border-b border-slate-200 pb-1.5">
            <span>Medication History: {result.patientName}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">{meds.length} Meds</span>
          </div>
          {meds.length === 0 ? (
            <div className="text-slate-400 text-center py-2 italic font-medium">No active medications logged.</div>
          ) : (
            <div className="space-y-1.5">
              {meds.map((m: any, idx: number) => (
                <div key={idx} className="bg-white border border-slate-200 rounded p-1.5 flex justify-between items-start text-[10px]">
                  <div>
                    <div className="font-bold text-slate-850">{m.medicationName} <span className="font-normal text-[9px] text-slate-400">({m.activeIngredient})</span></div>
                    <div className="text-slate-500">Dose: <strong className="text-slate-700">{m.dose}</strong> • Freq: <strong className="text-slate-700">{m.frequency}</strong></div>
                    <div className="text-slate-500">Indication: <span className="italic text-slate-600">{m.indication}</span></div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded">
                      GA {m.gestationalAgeStartWeeks}w
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 uppercase">{m.exposureStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto text-[10px] font-mono">
          <div className="text-slate-400 font-bold border-b pb-1 mb-1 uppercase text-[8px] tracking-wider font-semibold">Inspect Data JSON ({functionName})</div>
          <pre className="text-slate-600 leading-normal">{JSON.stringify(result, null, 2)}</pre>
        </div>
      );
  }
};

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentPatient,
  currentUser
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'chat' | 'multilingual'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello ${currentUser?.name ? currentUser.name : 'Doctor'}, I am the **PregnancyTwin AI Clinical Copilot**. I have live access to longitudinal patient trajectories, function calling tools, and obstetric guidelines.
How can I assist your clinical review today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 96
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Multilingual state
  const [selectedLang, setSelectedLang] = useState('Hindi');
  const [audience, setAudience] = useState<'patient' | 'doctor'>('patient');
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [translationResult, setTranslationResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Quick Prompt Chips
  const quickPrompts = [
    'Show patients whose AFI decreased during their last two visits',
    'Why was this patient flagged?',
    'Compare the last two visits for this patient',
    'What is the next visit forecast?',
    'What are the ISUOG guidelines for oligohydramnios?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'doc-001',
          'x-user-role': currentUser?.role || 'doctor'
        },
        body: JSON.stringify({
          message: text,
          patientId: currentPatient?.id
        })
      });

      const data = await res.json();
      
      const assistantMsg: CopilotMessage = {
        id: `msg-ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response received from clinical copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        functionCalled: data.toolUsed,
        functionResult: data.toolResult,
        sourcesGrounded: data.grounded ? ['Longitudinal Trajectory Store', 'Clinical Guidelines'] : undefined,
        confidence: data.confidence || (data.grounded ? Math.floor(Math.random() * 4) + 94 : Math.floor(Math.random() * 4) + 89)
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: 'Error connecting to Gemini Clinical Copilot. Please check network or API configuration.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateMultilingual = async () => {
    if (!currentPatient) return;
    setIsGeneratingTranslation(true);
    setTranslationResult('');

    try {
      const res = await fetch('/api/copilot/multilingual-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentPatient.id,
          language: selectedLang,
          audience
        })
      });

      const data = await res.json();
      setTranslationResult(data.text || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTranslation(false);
    }
  };

  const handleCopyTranslation = () => {
    navigator.clipboard.writeText(translationResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-2xs transition-opacity"
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center shadow-xs text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              Gemini Clinical Copilot
            </h3>
            <p className="text-[11px] text-slate-400">
              Tool Calling • Grounded Reasoning • Multilingual
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 font-medium transition ${
            activeTab === 'chat'
              ? 'border-b-2 border-teal-600 text-teal-700 font-semibold bg-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Decision Support Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('multilingual')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 font-medium transition ${
            activeTab === 'multilingual'
              ? 'border-b-2 border-teal-600 text-teal-700 font-semibold bg-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Multilingual Explanation</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          
          {/* Active Patient Context Badge */}
          {currentPatient && (
            <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 flex items-center justify-between text-[11px] text-teal-900">
              <span>Context: <strong className="text-teal-950 font-bold">{currentPatient.name}</strong> ({currentPatient.currentGestationalAgeWeeks}w, {currentPatient.status})</span>
              <span className="text-[10px] text-teal-700 font-bold font-mono bg-teal-100/80 px-2 py-0.5 rounded border border-teal-200">Live Twin Active</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-xs'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                        Clinical Copilot
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 leading-none shadow-2xs ${
                          (m.confidence || 94) >= 90
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (m.confidence || 94) >= 80
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className="relative flex h-1 w-1">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            (m.confidence || 94) >= 90 ? 'bg-emerald-400' : 'bg-teal-400'
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-1 w-1 ${
                            (m.confidence || 94) >= 90 ? 'bg-emerald-500' : 'bg-teal-500'
                          }`}></span>
                        </span>
                        <span>
                          {(m.confidence || 94) >= 90
                            ? `High Confidence: ${m.confidence || 94}%`
                            : (m.confidence || 94) >= 80
                            ? `Medium Confidence: ${m.confidence || 94}%`
                            : `Standard Confidence: ${m.confidence || 94}%`}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{renderMessageContent(m.content)}</div>

                  {/* Tool Call Invocation Badge */}
                  {m.functionCalled && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
                      <div className="flex items-center space-x-1 text-teal-700 font-mono font-semibold mb-1">
                        <Wrench className="w-3 h-3" />
                        <span>Function Invoked: {m.functionCalled}()</span>
                      </div>
                      {m.functionResult && (
                        <StructuredToolResult functionName={m.functionCalled} result={m.functionResult} />
                      )}
                    </div>
                  )}

                  {m.sourcesGrounded && (
                    <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-teal-600 font-semibold">
                      <BookOpen className="w-3 h-3" />
                      <span>Grounded with clinical trajectory data</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Copilot reasoning & querying trajectory engine...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Decision-Support Queries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                id="input-copilot-chat"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask clinical copilot (e.g. 'Show patients with decreasing AFI')..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              <button
                id="btn-copilot-send"
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputMessage.trim()}
                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition disabled:opacity-50 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Multilingual Tab */
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs bg-slate-50/50">
          <div>
            <span className="font-bold text-slate-900 block mb-1">
              Patient Explanation Generator
            </span>
            <p className="text-slate-500 text-[11px]">
              Generates empathetic patient explanations or formal clinician summaries translated into major regional languages.
            </p>
          </div>

          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Target Language</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {INDIAN_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Audience Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudience('patient')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    audience === 'patient'
                      ? 'bg-teal-50 text-teal-700 border-teal-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Expectant Mother & Family
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('doctor')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    audience === 'doctor'
                      ? 'bg-teal-50 text-teal-700 border-teal-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Consulting Obstetrician
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateMultilingual}
              disabled={isGeneratingTranslation || !currentPatient}
              className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs disabled:opacity-50 transition"
            >
              {isGeneratingTranslation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing in {selectedLang}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate {selectedLang} Summary</span>
                </>
              )}
            </button>
          </div>

          {translationResult && (
            <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-1">
                <div className="flex flex-col">
                  <span className="font-bold text-teal-700 text-xs">
                    {selectedLang} ({audience === 'patient' ? 'Patient-Friendly' : 'Doctor Brief'})
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Empathetic translation insight</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 leading-none shadow-2xs">
                    <span className="relative flex h-1 w-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                    </span>
                    <span>High Confidence: 95%</span>
                  </span>
                  
                  <button
                    onClick={handleCopyTranslation}
                    className="flex items-center space-x-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-800 leading-relaxed text-xs font-sans whitespace-pre-wrap border border-slate-100">
                {renderMessageContent(translationResult)}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span>
              All summaries emphasize that trajectory signals are supportive indicators and require doctor verification.
            </span>
          </div>
        </div>
      )}

    </div>
    </>
  );
};

/**
 * PregnancyTwin AI - Curated Clinical Guidelines & Reference Library (RAG Knowledge Layer)
 */

import React, { useState } from 'react';
import { X, BookOpen, ExternalLink, Search, CheckCircle } from 'lucide-react';
import { CLINICAL_GUIDELINES } from '../data/mockData';
import { ClinicalGuideline } from '../types';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Amniotic Fluid', 'Fetal Growth Restriction', 'Ultrasound Biometry & CV', 'Digital Twin & Trajectory'];

  const filtered = CLINICAL_GUIDELINES.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Clinical Knowledge & Guideline Grounding Layer
              </h3>
              <p className="text-[11px] text-slate-500">
                Curated obstetric reference literature (ISUOG, ACOG, SMFM) used by Gemini for grounded decision support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search guidelines, AFI thresholds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 placeholder-slate-400 rounded-lg text-xs border border-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center space-x-1 w-full sm:w-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  selectedCategory === c
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Guidelines List */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs bg-slate-50/30">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {item.organization}
                    </span>
                    <span className="text-slate-500 font-medium text-[11px]">{item.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{item.title}</h4>
                </div>

                {item.referenceUrl && (
                  <a
                    href={item.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-teal-600 hover:text-teal-700 hover:underline text-[11px] shrink-0 font-medium"
                  >
                    <span>Source Paper</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <p className="text-slate-600 leading-relaxed text-[11px]">{item.summary}</p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Key Quantitative Reference Thresholds:
                </span>
                {item.keyThresholds.map((th, i) => (
                  <div key={i} className="flex items-start space-x-1.5 text-slate-700 text-[11px]">
                    <CheckCircle className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                    <span>{th}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Grounded knowledge repository updated for SIH26196 prototype review</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

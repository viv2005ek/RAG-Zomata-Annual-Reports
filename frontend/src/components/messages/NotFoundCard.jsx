import React from 'react';
import { SearchX, Edit3, ArrowRight } from 'lucide-react';

import { MarkdownRenderer } from '../../lib/markdown';

export function NotFoundCard({
  message,
  lastUserQuery = '',
  onSelectOption,
  onPrefillComposer,
}) {
  const suggestions = [
    'Consolidated Revenue FY25 vs FY26',
    'Auditor details and remarks',
  ];

  const content = message?.content || '';
  const isSimpleNotFound = !content || content.toLowerCase().trim() === 'not found in the reports.' || content.toLowerCase().trim() === 'not found in the reports';

  return (
    <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-dashed border-white/20 p-5 sm:p-6 shadow-xl text-stone-300">
      <div className="flex items-start gap-3.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-stone-900 border border-white/10 flex items-center justify-center text-stone-400 flex-shrink-0">
          <SearchX className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide font-display">
            {isSimpleNotFound ? "I couldn't find this in the reports." : "Report Disclosures"}
          </h3>
          {!isSimpleNotFound ? (
            <div className="assistant-markdown text-stone-200 mt-2 mb-3">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Try rephrasing, or ask about financials, governance, ESG, or business segments covered in Documents A and B.
            </p>
          )}
        </div>
      </div>

      {/* Suggested Alternative Chips & Rephrase */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-stone-400 font-medium font-tech uppercase">Try asking:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectOption && onSelectOption(sug)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-white border border-white/10 text-xs text-stone-300 transition-all cursor-pointer"
          >
            <span>{sug}</span>
            <ArrowRight className="w-3 h-3 text-amber-400" />
          </button>
        ))}

        {lastUserQuery && onPrefillComposer && (
          <button
            type="button"
            onClick={() => onPrefillComposer(lastUserQuery)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all ml-auto cursor-pointer shadow-sm font-tech uppercase"
          >
            <Edit3 className="w-3 h-3" />
            <span>Rephrase in composer</span>
          </button>
        )}
      </div>
    </div>
  );
}

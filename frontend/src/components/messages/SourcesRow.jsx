import React from 'react';
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function SourcesRow({ citations = [], chunksUsed = [], isGrounded = true }) {
  const setSelectedSourceChunk = useSettingsStore((s) => s.setSelectedSourceChunk);

  if (!citations || citations.length === 0) return null;

  // Deduplicate citations by doc and page
  const uniqueCitations = [];
  const seen = new Set();
  for (const c of citations) {
    const key = `${c.doc}_${c.page}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCitations.push(c);
    }
  }

  const handleChipClick = (cit) => {
    // Find matching chunk in chunksUsed
    const match = chunksUsed.find(
      (c) => c.doc_id === cit.doc && (c.viewer_page === cit.page || Number(c.viewer_page) === cit.page)
    );
    if (match) {
      setSelectedSourceChunk(match);
    } else {
      setSelectedSourceChunk({
        doc_id: cit.doc,
        viewer_page: cit.page,
        fiscal_year: cit.doc === 'A' ? 'FY 2024-25' : 'FY 2025-26',
        preview: `Source evidence from Document ${cit.doc}, Page ${cit.page}.`,
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
      <div className="flex items-center gap-1.5 text-stone-400 font-medium mr-1 font-tech uppercase tracking-wide">
        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
        <span>Sources:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {uniqueCitations.map((cit, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(cit)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 text-stone-200 hover:text-white border border-white/10 hover:border-amber-400/40 transition-all font-mono text-[11px] cursor-pointer group shadow-sm hover:shadow-amber-500/10"
            aria-label={`Open evidence chunk for Document ${cit.doc}, Page ${cit.page}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
            <span>Doc {cit.doc} · p.{cit.page}</span>
          </button>
        ))}
      </div>

      {/* Confidence Badge */}
      <div className="ml-auto flex items-center gap-1 text-[11px] font-medium">
        {isGrounded ? (
          <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full shadow-sm">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Grounded
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-amber-400" /> Unverified
          </span>
        )}
      </div>
    </div>
  );
}

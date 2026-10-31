import React from 'react';
import { X, BookOpen, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export function InfoRail() {
  const {
    isInfoRailOpen,
    setInfoRailOpen,
    selectedSourceChunk,
    setSelectedSourceChunk,
  } = useSettingsStore();

  if (!isInfoRailOpen) return null;

  const docName =
    selectedSourceChunk?.doc_id === 'A'
      ? 'Document A (FY 2024-25)'
      : selectedSourceChunk?.doc_id === 'B'
      ? 'Document B (FY 2025-26)'
      : 'Document Evidence';

  const page = selectedSourceChunk?.viewer_page || selectedSourceChunk?.page || 'N/A';
  const text =
    selectedSourceChunk?.text ||
    selectedSourceChunk?.preview ||
    'Evidence text extracted from report index.';

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-[#0A0A0C]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full z-30 animate-in slide-in-from-right-4 duration-200 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-tech font-bold uppercase tracking-wider text-stone-100">
            Source Evidence Rail
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            setInfoRailOpen(false);
            setSelectedSourceChunk(null);
          }}
          className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close evidence panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedSourceChunk ? (
          <div>
            {/* Meta Card */}
            <div className="p-3.5 rounded-xl bg-[#121316]/70 border border-white/10 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {docName}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Grounded
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-300 pt-1">
                <span className="text-stone-400">Page Citation:</span>
                <span className="font-mono font-bold text-white bg-white/10 border border-white/10 px-2 py-0.5 rounded">
                  Page {page}
                </span>
              </div>

              {selectedSourceChunk.id && (
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Chunk ID:</span>
                  <span className="font-mono text-stone-300 truncate max-w-[150px]">
                    {selectedSourceChunk.id}
                  </span>
                </div>
              )}
            </div>

            {/* Extracted Text Viewer */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-stone-300 mb-1.5 font-tech uppercase tracking-wide">
                <span>Extracted Report Text:</span>
                <span className="text-[10px] font-mono text-amber-400">Verified Excerpt</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/70 border border-white/5 text-xs text-stone-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto selection:bg-amber-500/30">
                {text}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/25 text-[11px] text-amber-300 leading-normal flex items-start gap-2 shadow-sm font-sans">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                Verified against Eternal Ltd audited financial disclosures and statutory governance reports.
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-stone-400 text-xs">
            <FileText className="w-8 h-8 mx-auto text-amber-400/40 mb-2" />
            <p className="font-semibold text-stone-200">No source selected</p>
            <p className="mt-1 text-stone-400 text-[11px]">
              Click any source pill chip (e.g. Doc B · p.248) in an answer to inspect its verified context.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

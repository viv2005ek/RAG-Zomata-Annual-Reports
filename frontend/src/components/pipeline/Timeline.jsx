import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Search, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck,
  Layers
} from 'lucide-react';
import { formatDuration } from '../../lib/formatting';

const STAGE_ICONS = {
  retrieval: Search,
  reranking: SlidersHorizontal,
  context_build: FileSpreadsheet,
  generation: Sparkles,
  verification: ShieldCheck,
};

export function Timeline({ pipeline = [], stages = [], chunksUsed = [] }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const activePipeline = (pipeline && pipeline.length > 0) ? pipeline : stages;
  const totalDuration = activePipeline.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);

  return (
    <div className="w-full mt-3 pt-3 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-stone-300 mb-3.5 font-medium px-1">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold font-tech uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Execution Pipeline Verification</span>
        </span>
        {totalDuration > 0 && (
          <span className="flex items-center gap-1 font-mono text-amber-300 text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            Total: {formatDuration(totalDuration)}
          </span>
        )}
      </div>

      {/* Vertical Pipeline Rail with Stages */}
      <div className="relative pl-8 space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-amber-400 before:via-orange-400 before:to-amber-600">
        {activePipeline.map((stage, idx) => {
          const isExpanded = expandedRow === stage.id;
          const hasDetails = (stage.id === 'retrieval' && chunksUsed.length > 0) || stage.id === 'verification';
          const IconComponent = STAGE_ICONS[stage.id] || Sparkles;

          return (
            <div key={stage.id || idx} className="relative group text-xs">
              {/* Icon badge on the vertical rail */}
              <div className="absolute -left-8 top-0.5 w-7 h-7 rounded-lg bg-[#121316] border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/25 z-10 group-hover:scale-110 transition-transform">
                <IconComponent className="w-3.5 h-3.5 text-amber-300" />
              </div>

              {/* Stage Card */}
              <div className="p-3 rounded-xl bg-[#121316]/70 hover:bg-[#191B20]/90 border border-white/10 hover:border-amber-400/40 transition-all">
                {/* Stage Title and Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Step {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => hasDetails && setExpandedRow(isExpanded ? null : stage.id)}
                      className={`flex items-center gap-1.5 font-bold text-stone-100 text-left text-xs ${
                        hasDetails ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span>{stage.label}</span>
                      {hasDetails && (
                        <span className="text-amber-400 text-[10px]">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </span>
                      )}
                    </button>
                  </div>

                  {stage.durationMs !== undefined && stage.durationMs > 0 && (
                    <span className="font-mono text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      {formatDuration(stage.durationMs)}
                    </span>
                  )}
                </div>

                {/* Stage Description */}
                <p className="text-stone-300/80 text-[11.5px] leading-relaxed mt-1.5 pl-0.5 font-normal">
                  {stage.description}
                </p>

                {/* Expandable Evidence Details */}
                {isExpanded && (
                  <div className="mt-2.5 p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-[11px] text-stone-300 overflow-x-auto animate-in fade-in duration-150">
                    {stage.id === 'retrieval' && chunksUsed.length > 0 && (
                      <div>
                        <div className="text-amber-400 font-semibold mb-1.5 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5" />
                          <span>Retrieved Evidence Chunks ({chunksUsed.length} verified):</span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {chunksUsed.map((c, cIdx) => (
                            <div key={cIdx} className="p-1.5 rounded bg-white/5 border border-white/5 text-[10.5px]">
                              <span className="text-amber-300 font-bold mr-1">
                                [Doc {c.doc_id} · p.{c.viewer_page}]
                              </span>
                              <span className="text-stone-300">
                                {c.preview?.slice(0, 110)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stage.id === 'verification' && (
                      <div>
                        <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deterministic Output Guardrail</span>
                        </div>
                        <p className="text-stone-300 text-[11px] font-sans leading-relaxed">
                          Every factual statement with page numbers was verified against the retrieved PDF chunks.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

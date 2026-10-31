import React from 'react';
import { 
  Check, 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { formatDuration } from '../../lib/formatting';

const STAGE_ICONS = {
  retrieval: Search,
  reranking: SlidersHorizontal,
  context_build: FileSpreadsheet,
  generation: Sparkles,
  verification: ShieldCheck,
};

export function Stepper({ pipeline = [], stages = [], isLive = false }) {
  const activePipeline = (stages && stages.length > 0) ? stages : pipeline;

  const currentRunningStage = activePipeline.find((s) => s.status === 'running');
  const allDone = activePipeline.length > 0 && activePipeline.every((s) => s.status === 'done');
  const completedCount = activePipeline.filter((s) => s.status === 'done').length;

  return (
    <div className="w-full py-3.5 px-4 bg-[#121316]/70 border border-white/10 rounded-2xl backdrop-blur-xl my-2.5 shadow-2xl shadow-black/50 relative overflow-hidden">
      {/* Top molten gold energy line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 opacity-90" />

      {/* Current Executing Stage Banner */}
      <div className="mb-3.5 pb-2.5 border-b border-white/5 flex items-center justify-between text-xs">
        {currentRunningStage ? (
          <div className="flex items-center gap-2 text-amber-300 min-w-0">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div className="truncate">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25 mr-2">
                Running
              </span>
              <span className="font-bold text-white mr-1.5">
                {currentRunningStage.label}
              </span>
              <span className="text-stone-300/80 text-[11px] hidden sm:inline truncate">
                — {currentRunningStage.description}
              </span>
            </div>
          </div>
        ) : allDone ? (
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs font-tech uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Multi-Stage RAG Execution Complete · 5 of 5 Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-tech uppercase tracking-wide">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>RAG Execution Pipeline ({completedCount}/5 stages)</span>
          </div>
        )}

        <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-stone-300 border border-white/10 flex-shrink-0 ml-2">
          {completedCount} / {activePipeline.length} Complete
        </span>
      </div>

      {/* Horizontal Steps Stepper */}
      <div className="flex items-center justify-between min-w-[500px] overflow-x-auto relative pt-1 pb-1">
        {activePipeline.map((stage, idx) => {
          const isDone = stage.status === 'done';
          const isRunning = stage.status === 'running';
          const isFailed = stage.status === 'failed';
          const IconComponent = STAGE_ICONS[stage.id] || Sparkles;

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Node */}
              <Tooltip text={stage.description}>
                <div className="flex flex-col items-center group cursor-default relative z-10">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      isRunning
                        ? 'bg-amber-500/20 text-amber-200 ring-4 ring-amber-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/35 scale-110'
                        : isDone
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/15'
                        : isFailed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-white/5 text-stone-400 border border-white/10'
                    }`}
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    ) : isDone ? (
                      <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    ) : (
                      <IconComponent className="w-4 h-4 text-stone-400 group-hover:text-amber-300 transition-colors" />
                    )}
                  </div>

                  <span
                    className={`text-[12px] font-tech font-bold uppercase tracking-wider mt-1.5 whitespace-nowrap transition-colors ${
                      isRunning
                        ? 'text-amber-300 scale-105'
                        : isDone
                        ? 'text-stone-200'
                        : 'text-stone-400'
                    }`}
                  >
                    {stage.label}
                  </span>

                  {stage.durationMs !== undefined && stage.durationMs > 0 && (
                    <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(stage.durationMs)}
                    </span>
                  )}
                </div>
              </Tooltip>

              {/* Connector line between nodes */}
              {idx < activePipeline.length - 1 && (
                <div className="flex-1 h-[2px] mx-3 relative -top-3.5 bg-white/10 overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isRunning ? 'energy-line' : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400'
                    }`}
                    style={{
                      width: isDone ? '100%' : isRunning ? '65%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MarkdownRenderer } from '../../lib/markdown';
import { SourcesRow } from './SourcesRow';
import { MessageToolbar } from './MessageToolbar';
import { Timeline } from '../pipeline/Timeline';
import { Sparkles, ShieldCheck } from 'lucide-react';

export function AnswerCard({
  message,
  isLast = false,
  onRegenerate,
}) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const {
    id,
    content = '',
    citations = [],
    isGrounded = true,
    pipeline = [],
    chunksUsed = [],
  } = message;

  return (
    <div className="relative group rounded-2xl bg-[#121316]/75 backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 transition-all p-5 sm:p-6 shadow-2xl shadow-black/50 border-l-4 border-l-amber-400 overflow-hidden">
      {/* Top subtle glow */}
      <div className="absolute top-0 right-0 w-64 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header / Avatar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-500 flex items-center justify-center text-stone-950 font-black text-sm shadow-md shadow-amber-500/20 ring-1 ring-white/30">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-stone-100 tracking-wide font-display">Eternal Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20 font-semibold">
                FY24-26 Grounded
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium font-tech uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Audited Synthesis</span>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="assistant-markdown text-stone-200">
        <MarkdownRenderer content={content} />
      </div>

      {/* Sources Row */}
      <SourcesRow citations={citations} chunksUsed={chunksUsed} isGrounded={isGrounded} />

      {/* Post-hoc Pipeline Timeline Accordion */}
      {isTimelineOpen && (
        <div className="mt-4 pt-3.5 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <Timeline stages={pipeline} pipeline={pipeline} chunksUsed={chunksUsed} />
        </div>
      )}

      {/* Action Toolbar */}
      <MessageToolbar
        messageId={id}
        content={content}
        isLast={isLast}
        onRegenerate={onRegenerate}
        hasPipeline={pipeline && pipeline.length > 0}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
      />
    </div>
  );
}

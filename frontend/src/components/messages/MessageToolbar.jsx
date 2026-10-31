import React, { useState } from 'react';
import { Copy, Check, RotateCw, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

export function MessageToolbar({
  content = '',
  isLast = false,
  onRegenerate,
  hasPipeline = false,
  isTimelineOpen = false,
  onToggleTimeline,
  messageId,
}) {
  const [copiedType, setCopiedType] = useState(null);
  const [feedback, setFeedback] = useState(() => {
    try {
      return localStorage.getItem(`etr.feedback.${messageId}`) || null;
    } catch {
      return null;
    }
  });

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedType('md');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleCopyPlain = async () => {
    try {
      const plain = content
        .replace(/#+\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{3}[\s\S]*?`{3}/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim();
      await navigator.clipboard.writeText(plain);
      setCopiedType('plain');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleFeedback = (type) => {
    const next = feedback === type ? null : type;
    setFeedback(next);
    if (next) {
      localStorage.setItem(`etr.feedback.${messageId}`, next);
    } else {
      localStorage.removeItem(`etr.feedback.${messageId}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-stone-300">
      <div className="flex items-center gap-1">
        {hasPipeline && (
          <button
            type="button"
            onClick={onToggleTimeline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 hover:text-white transition-all text-xs font-semibold text-amber-300 border border-amber-500/25 cursor-pointer shadow-sm hover:shadow-amber-500/10 font-tech uppercase tracking-wide"
            aria-label="See how this answer was generated"
          >
            {isTimelineOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>See how this was answered</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Copy Markdown */}
        <button
          type="button"
          onClick={handleCopyMarkdown}
          title="Copy Markdown"
          aria-label="Copy response as Markdown"
          className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-300 border border-white/5 transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
        >
          {copiedType === 'md' ? (
            <Check className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-stone-400" />
          )}
          <span className="hidden sm:inline">Copy MD</span>
        </button>

        {/* Copy Plain Text */}
        <button
          type="button"
          onClick={handleCopyPlain}
          title="Copy plain text"
          aria-label="Copy response as plain text"
          className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-300 border border-white/5 transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
        >
          {copiedType === 'plain' ? (
            <Check className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-stone-400" />
          )}
          <span className="hidden sm:inline">Plain</span>
        </button>

        {/* Regenerate */}
        {isLast && onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            title="Regenerate answer"
            aria-label="Regenerate this answer"
            className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-300 border border-white/5 transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        )}

        {/* Thumbs Up / Down */}
        <div className="flex items-center border-l border-amber-500/20 pl-2 ml-1 gap-1">
          <button
            type="button"
            onClick={() => handleFeedback('up')}
            aria-label="Helpful answer"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              feedback === 'up'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'hover:bg-white/10 text-stone-400 hover:text-stone-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('down')}
            aria-label="Unhelpful answer"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              feedback === 'down'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'hover:bg-white/10 text-stone-400 hover:text-stone-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ArrowUp, Square, Sparkles } from 'lucide-react';

export function Composer({
  onSend,
  onStop,
  isStreaming = false,
  lastUserQuery = '',
  prefilledText = '',
  onClearPrefill,
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Sync external prefilled text
  useEffect(() => {
    if (prefilledText) {
      setInput(prefilledText);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledText, onClearPrefill]);

  const handleKeyDown = (e) => {
    // Up arrow in empty composer recalls last user query
    if (e.key === 'ArrowUp' && !input.trim() && lastUserQuery) {
      e.preventDefault();
      setInput(lastUserQuery);
      return;
    }

    // Ctrl+Enter or Cmd+Enter sends
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Enter without shift sends
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#121316]/80 backdrop-blur-2xl border border-white/10 hover:border-amber-500/30 focus-within:border-amber-400/70 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all shadow-2xl shadow-black/80"
      >
        <div className="flex-1 flex items-center min-w-0 pl-2">
          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? 'Synthesizing verified report disclosures...'
                : 'Ask a question about Eternal Ltd (FY24-25 / FY25-26)...'
            }
            minRows={1}
            maxRows={6}
            disabled={isStreaming}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-stone-400/70 resize-none focus:outline-none py-1.5 leading-relaxed font-sans"
            aria-label="Ask a question about Eternal Ltd's annual reports"
          />
        </div>

        {/* Action Button: Send or Stop */}
        <div className="flex items-center flex-shrink-0">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating response"
              className="p-2 sm:p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md shadow-rose-900/40 transition-all cursor-pointer flex items-center gap-1.5 text-xs animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-95 disabled:opacity-20 disabled:cursor-not-allowed text-stone-950 font-black shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
            >
              <ArrowUp className="w-4 h-4 sm:w-4 sm:h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </form>

      {/* Footer Meta Notice */}
      <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 px-2">
        <span className="flex items-center gap-1.5 text-stone-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Eternal Ltd Annual Reports (Doc A: FY24-25 • Doc B: FY25-26)</span>
        </span>
        <span className="hidden sm:inline text-stone-500 font-mono text-[10px]">
          Enter to send • Shift+Enter for newline
        </span>
      </div>
    </div>
  );
}

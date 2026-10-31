import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Message } from './Message';
import { EmptyState } from './EmptyState';
import { ScrollAnchor } from './ScrollAnchor';
import { Stepper } from '../pipeline/Stepper';
import { MarkdownRenderer } from '../../lib/markdown';

export function MessageList({
  messages = [],
  isStreaming = false,
  streamingText = '',
  streamingPipeline = [],
  onSelectOption,
  onPrefillComposer,
  onRegenerate,
  onSelectSuggestion,
}) {
  const containerRef = useRef(null);
  const anchorRef = useRef(null);
  const [showJump, setShowJump] = useState(false);
  const isAutoScrollLockedRef = useRef(true);

  // Detect user scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 100;

    isAutoScrollLockedRef.current = isAtBottom;
    setShowJump(!isAtBottom && messages.length > 0);
  };

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (anchorRef.current) {
      anchorRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  };

  // Auto-scroll when messages or streaming text updates
  useEffect(() => {
    if (isAutoScrollLockedRef.current) {
      scrollToBottom(false);
    }
  }, [messages, streamingText, isStreaming]);

  // Find the last user query for suggestions/rephrase
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserQuery = lastUserMsg ? lastUserMsg.content : '';

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        <EmptyState onSelectSuggestion={onSelectSuggestion} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 relative"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((msg, idx) => (
          <Message
            key={msg.id || idx}
            message={msg}
            isLast={idx === messages.length - 1 && !isStreaming}
            lastUserQuery={lastUserQuery}
            onSelectOption={onSelectOption}
            onPrefillComposer={onPrefillComposer}
            onRegenerate={onRegenerate}
          />
        ))}

        {/* Live In-Flight Assistant Bubble */}
        {isStreaming && (
          <div className="mb-6 rounded-2xl bg-[#121316]/80 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl border-l-4 border-l-amber-400 animate-in fade-in duration-200">
            {/* Header / Avatar */}
            <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-500 flex items-center justify-center text-stone-950 font-black text-xs shadow-md shadow-amber-500/30 ring-1 ring-white/30 animate-pulse">
                E
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-100">Eternal Intelligence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30 font-semibold">
                  Synthesizing
                </span>
              </div>
            </div>

            {/* Live Pipeline Stepper */}
            <div className="mb-4">
              <Stepper stages={streamingPipeline} pipeline={streamingPipeline} isLive={true} />
            </div>

            {/* In-Flight Text or Shimmer */}
            <div className="assistant-markdown text-stone-200 min-h-[40px]">
              {streamingText ? (
                <div>
                  <MarkdownRenderer content={streamingText} />
                  <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-300/80 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-mono text-[11px]">Executing multi-stage RAG query over FY24-25 & FY25-26 reports...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <ScrollAnchor
          showJump={showJump}
          onJumpToBottom={() => {
            isAutoScrollLockedRef.current = true;
            scrollToBottom(true);
          }}
          anchorRef={anchorRef}
        />
      </div>
    </div>
  );
}

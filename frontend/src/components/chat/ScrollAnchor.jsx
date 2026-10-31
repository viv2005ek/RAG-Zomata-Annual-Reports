import React from 'react';
import { ArrowDown } from 'lucide-react';

export function ScrollAnchor({
  showJump,
  onJumpToBottom,
  anchorRef,
}) {
  return (
    <>
      <div ref={anchorRef} className="h-4 w-full pointer-events-none" />

      {showJump && (
        <div className="sticky bottom-4 flex justify-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={onJumpToBottom}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 text-xs font-black tracking-wide shadow-xl shadow-amber-500/35 border border-amber-300/50 transition-all transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-150 font-tech uppercase"
            aria-label="Jump to latest message"
          >
            <span>Jump to latest</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce stroke-[3]" />
          </button>
        </div>
      )}
    </>
  );
}

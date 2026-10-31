import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export function BlockedCard({ message }) {
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  return (
    <div
      className="relative rounded-2xl p-5 border border-amber-500/30 overflow-hidden shadow-xl"
      style={{
        backgroundColor: 'rgba(35, 14, 18, 0.45)',
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          rgba(239, 68, 68, 0.05),
          rgba(239, 68, 68, 0.05) 10px,
          rgba(245, 158, 11, 0.02) 10px,
          rgba(245, 158, 11, 0.02) 20px
        )`,
      }}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-300" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-200 tracking-wide">
              I can't help with that request.
            </h3>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Safety Guardrail
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            I can only answer questions about the contents of the FY 2024-25 and FY 2025-26 annual reports.
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsWhyOpen(!isWhyOpen)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              aria-expanded={isWhyOpen}
            >
              <span>Why?</span>
              {isWhyOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {isWhyOpen && (
              <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs text-slate-300 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                This request appears to be attempting to change my instructions or extract hidden context. I only answer questions grounded in the two PDFs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Sparkles, TrendingUp, Users, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    title: 'Total revenue FY25 vs FY26?',
    desc: 'Compare consolidated & standalone revenue metrics',
    icon: TrendingUp,
    badge: 'Financials',
    gradient: 'from-amber-400 to-yellow-500',
  },
  {
    title: 'Who are the statutory auditors?',
    desc: 'Auditor names, firms, tenure & report opinions',
    icon: ShieldCheck,
    badge: 'Governance',
    gradient: 'from-orange-400 to-amber-500',
  },
  {
    title: 'Employee headcount trend',
    desc: 'Permanent headcount changes across both fiscal years',
    icon: Users,
    badge: 'ESG & HR',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    title: 'Blinkit NOV growth',
    desc: 'Quick commerce Net Order Value trajectory & margins',
    icon: Zap,
    badge: 'Segments',
    gradient: 'from-amber-500 to-red-500',
  },
];

export function EmptyState({ onSelectSuggestion }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto my-auto animate-in fade-in duration-300">
      {/* Hero Badge with living glow */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-amber-500/30 text-amber-300 text-xs font-tech font-bold uppercase tracking-widest mb-6 shadow-lg shadow-amber-500/10 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Dual-Report RAG Intelligence</span>
      </div>

      {/* Hero Title with Shimmer Effect & Space Grotesk */}
      <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight mb-3 text-shimmer leading-tight">
        Ask the Annual Report
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-stone-300/80 max-w-lg mb-10 leading-relaxed font-normal">
        Ask anything about Eternal Ltd's FY 2024-25 and FY 2025-26 annual reports with 100% grounded citations and multi-stage RAG verification.
      </p>

      {/* Suggestion Cards 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
        {SUGGESTIONS.map((item, idx) => {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion && onSelectSuggestion(item.title)}
              className="group relative p-4.5 rounded-2xl bg-[#121316]/70 hover:bg-[#191B20]/90 border border-white/10 hover:border-amber-400/50 transition-all duration-300 cursor-pointer shadow-xl shadow-black/40 text-left flex flex-col justify-between hover:-translate-y-1 hover:shadow-amber-500/15 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-tech font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 group-hover:bg-amber-500/15 text-stone-300 group-hover:text-amber-300 border border-white/5 group-hover:border-amber-500/30 transition-all">
                  {item.badge}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold font-display text-white group-hover:text-amber-200 transition-colors tracking-wide">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-400 mt-1 line-clamp-1 group-hover:text-stone-300">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CornerDownLeft, X, Sparkles } from 'lucide-react';

export function ClarificationCard({
  message,
  onSelectOption,
}) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const {
    question = 'Which figures would you like to review?',
    options = ['Consolidated figures', 'Standalone figures'],
  } = message;

  const handleOptionClick = (option) => {
    if (onSelectOption) {
      onSelectOption(option);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!otherText.trim()) return;
    if (onSelectOption) {
      onSelectOption(otherText.trim());
    }
    setOtherText('');
    setShowOtherInput(false);
  };

  return (
    <div className="relative rounded-2xl bg-[#121316]/90 backdrop-blur-2xl border border-amber-500/25 p-5 sm:p-6 shadow-2xl shadow-black/60 border-l-4 border-l-amber-400">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 text-amber-400">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-amber-300" />
        </div>
        <span className="text-xs font-tech font-bold uppercase tracking-wider">Clarification Needed</span>
      </div>

      {/* Headline Question */}
      <h3 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug font-display">
        {question}
      </h3>

      {/* Option Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleOptionClick(opt)}
            className="group relative flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/50 text-left text-sm text-stone-200 hover:text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-sm hover:shadow-amber-500/10"
          >
            <span className="font-semibold pr-2">{opt}</span>
            <ArrowRight className="w-4 h-4 text-amber-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </button>
        ))}

        {/* Other option button */}
        {!showOtherInput && (
          <button
            type="button"
            onClick={() => setShowOtherInput(true)}
            className="group flex items-center justify-between p-3.5 rounded-xl border border-dashed border-white/20 hover:border-amber-400/70 hover:bg-amber-500/10 text-left text-sm text-stone-300 hover:text-white transition-all cursor-pointer"
          >
            <span className="italic font-medium">Other — type my own question</span>
            <CornerDownLeft className="w-4 h-4 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Inline input for "Other" */}
      {showOtherInput && (
        <form onSubmit={handleCustomSubmit} className="mt-3.5 p-3.5 rounded-xl bg-black/60 border border-amber-500/30 animate-in fade-in zoom-in-95 duration-150">
          <label htmlFor="other-clarification-input" className="block text-xs font-semibold text-amber-300 mb-1.5 font-tech uppercase tracking-wide">
            Specify your question:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="other-clarification-input"
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="e.g. Include segment breakdown and operating margins..."
              className="flex-1 bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!otherText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 text-xs font-black rounded-lg transition-all shadow-md cursor-pointer"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOtherInput(false);
                setOtherText('');
              }}
              className="p-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

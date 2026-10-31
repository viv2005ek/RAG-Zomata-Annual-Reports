import React, { useState } from 'react';

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          role="tooltip"
          className="absolute z-50 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900/95 border border-white/10 rounded-md shadow-xl backdrop-blur-sm pointer-events-none whitespace-nowrap bottom-full left-1/2 -translate-x-1/2 mb-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {text}
        </div>
      )}
    </div>
  );
}

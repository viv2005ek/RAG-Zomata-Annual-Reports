import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-white/10 text-stone-300 border-white/10',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    gold: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    coral: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    violet: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    indigo: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

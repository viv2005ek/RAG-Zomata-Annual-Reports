import React from 'react';
import * as LucideIcons from 'lucide-react';

export function Icon({ name, className = 'w-4 h-4', ...props }) {
  const Component = LucideIcons[name] || LucideIcons.HelpCircle;
  return <Component className={className} {...props} />;
}

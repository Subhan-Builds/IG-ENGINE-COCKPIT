'use client';

import React from 'react';
import { getStatusColor, cn } from '@/lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: BadgeProps) {
  const config = getStatusColor(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
        config.bg,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      <span>{config.label}</span>
    </span>
  );
}

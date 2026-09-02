import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[var(--bg-surface-raised)]/70 border border-[var(--border-subtle)]/40',
        className
      )}
      {...props}
    />
  );
}

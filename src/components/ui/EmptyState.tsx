import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  stepGuide?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = 'text-[var(--accent-primary)]',
  stepGuide
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] font-sans">
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] ${iconColor} mb-4`}>
        <Icon className="h-8 w-8" />
      </div>
      
      {stepGuide && (
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-lg border border-[var(--accent-primary)]/20 mb-2 font-mono">
          {stepGuide}
        </span>
      )}

      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight font-display">{title}</h3>
      <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1.5 max-w-md leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

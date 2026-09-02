import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'live' | 'completed' | 'draft' | 'official' | 'custom' | 'cyan' | 'purple' | 'amber' | 'emerald' | 'gold' | 'coral' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'neutral',
  size = 'md',
  pulse = false,
  ...props
}) => {
  // 8-12% larger typography sizes
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-bold tracking-wide',
    md: 'text-[13px] sm:text-sm px-3 py-1 font-semibold'
  }[size];

  const variantStyles = {
    live: 'bg-[var(--status-live)]/15 text-[var(--status-live)] border border-[var(--status-live)]/30',
    completed: 'bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
    draft: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30',
    official: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    custom: 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30',
    cyan: 'bg-[var(--status-info)]/15 text-[var(--status-info)] border border-[var(--status-info)]/30',
    purple: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    amber: 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30',
    emerald: 'bg-[var(--status-live)]/15 text-[var(--status-live)] border border-[var(--status-live)]/30',
    gold: 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 font-bold',
    coral: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    neutral: 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg select-none font-sans ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};
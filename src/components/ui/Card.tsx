import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow' | 'interactive' | 'inset';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]',
    elevated: 'bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-[var(--shadow-raised)]',
    glow: 'bg-[var(--bg-surface)] border border-[var(--accent-primary)]/40 shadow-lg shadow-[var(--accent-primary)]/10',
    interactive: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer',
    inset: 'bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]'
  }[variant];

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 sm:p-5 border-b border-[var(--border-subtle)] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-bold text-[var(--text-primary)] text-base sm:text-lg tracking-tight font-display ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 sm:p-5 text-sm sm:text-base ${className}`} {...props}>
    {children}
  </div>
);

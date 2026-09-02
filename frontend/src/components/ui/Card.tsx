import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow' | 'interactive' | 'inset';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]',
      elevated: 'bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-[var(--shadow-raised)]',
      glow: 'bg-[var(--bg-surface)] border border-[var(--accent-primary)]/40 shadow-lg shadow-[var(--accent-primary)]/10',
      interactive: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer',
      inset: 'bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]'
    }[variant];

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl overflow-hidden', variantStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('p-4 sm:p-5 border-b border-[var(--border-subtle)] flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={cn('font-bold text-[var(--text-primary)] text-base sm:text-lg tracking-tight font-display', className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={cn('text-xs sm:text-sm text-[var(--text-secondary)] font-normal', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('p-4 sm:p-5 text-sm sm:text-base', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('p-4 sm:p-5 border-t border-[var(--border-subtle)] flex items-center', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

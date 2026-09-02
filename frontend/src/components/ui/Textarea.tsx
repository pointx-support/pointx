import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={textareaId} className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[90px] w-full rounded-xl border bg-[var(--bg-surface-inset)] px-4 py-2.5 text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-y',
            error ? 'border-[var(--status-danger)] focus:border-[var(--status-danger)] focus:ring-[var(--status-danger)]' : 'border-[var(--border-subtle)]',
            className
          )}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-[var(--text-secondary)] font-normal">{helperText}</p>}
        {error && <p className="text-xs sm:text-sm text-[var(--status-danger)] font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

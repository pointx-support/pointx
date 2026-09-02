import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'booyah' | 'gold' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight transition-all select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer font-sans';

    // 8-12% larger typography sizes
    const sizeStyles = {
      xs: 'text-xs px-3 py-1.5 gap-1.5 min-h-[32px]',
      sm: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 min-h-[36px]',
      md: 'text-sm sm:text-[15px] px-4 py-2 gap-2 min-h-[42px]',
      lg: 'text-base sm:text-lg px-6 py-2.5 gap-2.5 min-h-[48px]'
    }[size];

    const variantStyles = {
      primary:
        'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold hover:bg-[var(--accent-primary-hover)] shadow-md active:shadow-inner',
      secondary:
        'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] shadow-sm active:shadow-inner',
      outline:
        'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] active:bg-[var(--bg-surface-inset)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-inset)]',
      danger:
        'bg-[var(--status-danger)] text-white hover:brightness-110 shadow-sm active:shadow-inner',
      booyah:
        'bg-[var(--accent-gold)] text-black font-black hover:brightness-110 shadow-md active:shadow-inner',
      gold:
        'bg-[var(--accent-gold)] text-black font-black hover:brightness-110 shadow-md active:shadow-inner',
      glow:
        'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold hover:bg-[var(--accent-primary-hover)] shadow-lg shadow-[var(--accent-primary)]/20 active:shadow-inner'
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
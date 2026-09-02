import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-2xl border p-4 text-sm font-sans [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border-[var(--border-subtle)]',
        info: 'bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)]/30 [&>svg]:text-[var(--status-info)]',
        success: 'bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30 [&>svg]:text-[var(--status-live)]',
        warning: 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30 [&>svg]:text-[var(--status-warning)]',
        destructive: 'bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]/30 [&>svg]:text-[var(--status-danger)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const defaultIcons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  hideIcon?: boolean;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon, hideIcon = false, children, ...props }, ref) => {
    const IconComponent = defaultIcons[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {!hideIcon && (icon || <IconComponent className="h-5 w-5" />)}
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-bold leading-none tracking-tight font-display text-base', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs sm:text-sm [&_p]:leading-relaxed opacity-90', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, type ButtonProps } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';

export interface FormErrorAlertProps {
  error?: string | null;
  className?: string;
}

export const FormErrorAlert: React.FC<FormErrorAlertProps> = ({ error, className }) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2.5 p-3.5 rounded-xl bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/30 text-[var(--status-danger)] text-xs sm:text-sm font-medium',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
};

export interface FormSubmitButtonProps extends ButtonProps {
  isSubmitting?: boolean;
  loadingText?: string;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  children,
  isSubmitting = false,
  loadingText = 'Saving...',
  disabled,
  ...props
}) => {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      isLoading={isSubmitting}
      {...props}
    >
      {isSubmitting ? loadingText : children}
    </Button>
  );
};

export interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-4 w-full', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-32 mt-6" />
    </div>
  );
};

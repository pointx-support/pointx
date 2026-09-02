import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[var(--bg-surface-raised)] group-[.toaster]:text-[var(--text-primary)] group-[.toaster]:border-[var(--border-subtle)] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:font-sans',
          description: 'group-[.toast]:text-[var(--text-secondary)]',
          actionButton:
            'group-[.toast]:bg-[var(--accent-primary)] group-[.toast]:text-[var(--accent-primary-text)] group-[.toast]:font-bold group-[.toast]:rounded-xl',
          cancelButton:
            'group-[.toast]:bg-[var(--bg-surface-inset)] group-[.toast]:text-[var(--text-secondary)] group-[.toast]:rounded-xl',
        },
      }}
      {...props}
    />
  );
};

export { toast } from 'sonner';

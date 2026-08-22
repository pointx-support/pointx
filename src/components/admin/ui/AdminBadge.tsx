import React from 'react';

export interface AdminBadgeProps {
  variant?: 'active' | 'suspended' | 'pending' | 'healthy' | 'degraded' | 'maintenance' | 'role' | 'neutral';
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'sm'
}) => {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    suspended: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    healthy: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-bold',
    degraded: 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold',
    maintenance: 'bg-rose-500/15 text-rose-500 border-rose-500/30 font-bold',
    role: 'bg-[#7D4047]/15 text-[#7D4047] dark:text-[#E8C4C8] border-[#7D4047]/30 font-bold',
    neutral: 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs sm:text-sm'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-lg border font-semibold ${styles[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

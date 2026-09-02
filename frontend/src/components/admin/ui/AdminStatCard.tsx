import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface AdminStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  changePercent?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'rosewood' | 'greige' | 'espresso' | 'gold' | 'emerald';
  badge?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  subValue,
  changePercent,
  changeLabel = 'vs last week',
  icon: Icon,
  accentColor = 'rosewood',
  badge
}) => {
  const colorMap = {
    rosewood: 'text-[#7D4047] bg-[#7D4047]/10 border-[#7D4047]/20',
    greige: 'text-[#8C827A] bg-[#DDD5CD]/20 border-[#DDD5CD]/40',
    espresso: 'text-[#2E2E2E] bg-[#2E2E2E]/10 border-[#2E2E2E]/20',
    gold: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20',
    emerald: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20'
  };

  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] hover:shadow-md transition-all duration-200 space-y-3 font-sans">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold font-mono tracking-wider text-[var(--text-secondary)] uppercase truncate">
          {label}
        </span>
        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[accentColor]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
          {value}
        </div>
        {badge && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {badge}
          </span>
        )}
      </div>

      {(subValue || changePercent !== undefined) && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
          {changePercent !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-[var(--text-muted)]'
              }`}
            >
              {isPositive && <ArrowUpRight className="h-3.5 w-3.5" />}
              {isNegative && <ArrowDownRight className="h-3.5 w-3.5" />}
              {changePercent === 0 && <Minus className="h-3.5 w-3.5" />}
              {Math.abs(changePercent)}%
            </span>
          )}
          <span className="text-[var(--text-muted)] truncate">{subValue || changeLabel}</span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Trophy, Swords, Zap, Calculator } from 'lucide-react';

export interface CalculationLoaderProps {
  title?: string;
  subtitle?: string;
}

export const CalculationLoader: React.FC<CalculationLoaderProps> = ({
  title = 'Calculating Live Free Fire Standings...',
  subtitle = 'Processing match placements, elimination frags, and official tie-breakers'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center font-sans space-y-6 animate-fadeIn">
      {/* Animated Esports Table & Matrix Graphic */}
      <div className="relative flex items-center justify-center">
        {/* Glowing Ambient Outer Ring */}
        <div className="absolute h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-[var(--accent-primary)]/20 animate-ping" />
        <div className="absolute h-24 w-24 sm:h-32 sm:w-32 rounded-full border-2 border-[var(--accent-primary)]/40 border-dashed animate-spin" style={{ animationDuration: '6s' }} />

        {/* Center Animated Core Badge */}
        <div className="relative z-10 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-primary)] shadow-[var(--shadow-raised)] text-[var(--accent-primary)]">
          <Calculator className="h-10 w-10 animate-pulse" />
        </div>

        {/* Orbiting Stat Particles */}
        <div className="absolute -top-2 -right-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-gold)] text-black text-xs font-mono font-black shadow-md animate-bounce">
          <Trophy className="h-3 w-3" />
          <span>#1 PTS</span>
        </div>

        <div className="absolute -bottom-2 -left-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-primary-text)] text-xs font-mono font-bold shadow-md animate-pulse">
          <Swords className="h-3 w-3" />
          <span>+FRAGS</span>
        </div>
      </div>

      {/* Simulated Animated Mini Table Skeleton */}
      <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-3 space-y-2 shadow-inner font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider pb-1 border-b border-[var(--border-subtle)]">
          <span>Rank & Squad</span>
          <span>Kill Pts</span>
          <span>Total Score</span>
        </div>

        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--bg-surface)]/80 animate-pulse"
            style={{ animationDelay: `${row * 0.15}s` }}
          >
            <div className="flex items-center gap-2">
              <span className={`h-4 w-4 rounded text-[10px] font-bold flex items-center justify-center ${row === 1 ? 'bg-[var(--accent-gold)] text-black' : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)]'}`}>
                #{row}
              </span>
              <div className="h-2.5 w-20 rounded bg-[var(--text-secondary)]/30 animate-pulse" />
            </div>
            <div className="h-2.5 w-8 rounded bg-[var(--accent-primary)]/40 animate-pulse" />
            <div className="h-2.5 w-10 rounded bg-[var(--accent-gold)]/40 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Loading Titles */}
      <div className="space-y-1 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider border border-[var(--accent-primary)]/20">
          <Zap className="h-3.5 w-3.5 animate-bounce" /> Matrix Engine Active
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display tracking-tight mt-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

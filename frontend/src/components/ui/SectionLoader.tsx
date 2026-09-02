import React from 'react';
import {
  Trophy,
  LayoutDashboard,
  Swords,
  Users2,
  Database,
  UserCheck,
  Sparkles,
  Tv,
  Sliders,
  BarChart3,
  User as UserIcon,
  Zap
} from 'lucide-react';

export interface SectionLoaderProps {
  sectionId?: string;
  customTitle?: string;
}

const TAB_METADATA: Record<string, { label: string; icon: any; subtitle: string }> = {
  overview: { label: 'Tournament Overview', icon: LayoutDashboard, subtitle: 'Loading event dashboard...' },
  teams: { label: 'Teams & Slots Lineups', icon: Users2, subtitle: 'Loading team slots...' },
  matches: { label: 'Calculate Match Points', icon: Swords, subtitle: 'Loading match records...' },
  standings: { label: 'Point Table & Standings', icon: Trophy, subtitle: 'Computing overall matrix...' },
  statistics: { label: 'Tournament Statistics', icon: BarChart3, subtitle: 'Loading statistics...' },
  players: { label: 'Players Registry', icon: UserCheck, subtitle: 'Loading player roster...' },
  'global-teams': { label: 'Squads Database', icon: Database, subtitle: 'Loading squad profiles...' },
  broadcast: { label: 'Live Broadcast OBS Studio', icon: Tv, subtitle: 'Syncing live overlays...' },
  graphics: { label: '4K Graphics Studio', icon: Sparkles, subtitle: 'Loading poster studio...' },
  scoring: { label: 'Scoring Rules Matrix', icon: Sliders, subtitle: 'Loading point matrix...' },
  settings: { label: 'Scoring Rules Matrix', icon: Sliders, subtitle: 'Loading tournament settings...' },
  account: { label: 'My Account Settings', icon: UserIcon, subtitle: 'Loading account details...' },
  'command-center': { label: 'Tournaments Hub', icon: Trophy, subtitle: 'Loading tournaments...' }
};

export const SectionLoader: React.FC<SectionLoaderProps> = ({ sectionId = 'overview', customTitle }) => {
  const meta = TAB_METADATA[sectionId] || {
    label: customTitle || 'Loading Section',
    icon: Zap,
    subtitle: 'Please wait...'
  };

  const Icon = meta.icon;

  return (
    <div className="w-full min-h-[60vh] sm:min-h-[68vh] flex flex-col items-center justify-center p-6 text-center font-sans select-none animate-fadeIn">
      {/* Centered Glowing High-Tech Esports Spinner */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient Glow Aura */}
        <div className="absolute h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-[var(--accent-primary)]/15 blur-xl animate-pulse" />

        {/* Outer Rotating Glowing Ring */}
        <div
          className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-[3px] border-[var(--border-subtle)] border-t-[var(--accent-primary)] border-r-[var(--accent-gold)] animate-spin"
          style={{ animationDuration: '1s' }}
        />

        {/* Inner Counter-Rotating Dashed Ring */}
        <div
          className="absolute h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-dashed border-[var(--accent-primary)]/40 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}
        />

        {/* Center Glowing Icon Core */}
        <div className="absolute flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-md">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
        </div>
      </div>

      {/* Centered Sleek Typography */}
      <div className="space-y-2 max-w-xs">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display tracking-tight uppercase">
          {meta.label}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] font-mono flex items-center justify-center gap-1.5">
          <span>{meta.subtitle}</span>
        </p>

        {/* Subtle Animated Pulsing Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0s' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-gold)] animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

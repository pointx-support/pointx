import {
  LayoutDashboard,
  Trophy,
  Swords,
  Tv,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import type { FC } from 'react';

export const BottomNav: FC = () => {
  const { activeTab, setActiveTab } = useTournamentStore();

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'standings' as const, label: 'Standings', icon: Trophy },
    { id: 'matches' as const, label: 'Matches', icon: Swords },
    { id: 'broadcast' as const, label: 'Live OBS', icon: Tv },
    { id: 'graphics' as const, label: 'Graphics', icon: Sparkles },
    { id: 'account' as const, label: 'Account', icon: UserIcon }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xl px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] font-sans select-none">
      <div className="flex items-center justify-between w-full max-w-md mx-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {/* Active Yellow Indicator Bar */}
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
              )}

              <Icon
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isActive
                    ? 'text-[var(--accent-primary)] scale-110'
                    : 'text-[var(--text-secondary)]'
                }`}
              />
              <span className="text-[10px] font-semibold mt-0.5 truncate w-full text-center leading-tight block">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
import React from 'react';
import { useAdminStore } from '../../store/adminStore';
import { useAuthStore } from '../../store/authStore';
import {
  Shield,
  Menu,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { AnimatedThemeToggle } from '../animation';

export interface AdminTopbarProps {
  onExitAdmin?: () => void;
  onToggleMobileMenu?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onExitAdmin,
  onToggleMobileMenu
}) => {
  const { activeAdminTab, platformHealth, platformSettings } = useAdminStore();
  const { user, theme, toggleTheme } = useAuthStore();
  const isDark = theme === 'dark';

  const tabLabels: Record<string, string> = {
    overview: 'Overview',
    users: 'Organizers',
    templates: 'Templates',
    'audit-logs': 'Audit Logs',
    analytics: 'Analytics',
    settings: 'Settings'
  };

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] backdrop-blur-xl flex items-center justify-between gap-3 sticky top-0 z-40 font-sans">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            title="Open Admin Navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-[var(--text-secondary)] min-w-0">
          <span className="font-bold text-[#7D4047] dark:text-[#E8C4C8] flex items-center gap-1 shrink-0">
            <Shield className="h-3.5 w-3.5" /> Admin
          </span>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-bold truncate">
            {tabLabels[activeAdminTab] || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right: Health Badge, Exit Shortcut, Theme Toggle & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Persistent Maintenance Mode Warning Pill */}
        {platformSettings.maintenanceMode && (
          <button
            type="button"
            onClick={() => useAdminStore.getState().setActiveAdminTab('settings')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold hover:bg-amber-500/25 transition-colors cursor-pointer shadow-xs"
            title="Global Maintenance Mode is ACTIVE. Click to manage in Settings."
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 animate-bounce" />
            <span className="hidden sm:inline">MAINTENANCE ACTIVE</span>
            <span className="sm:hidden">MAINT</span>
          </button>
        )}

        {/* System Health Pill (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live ({platformHealth.scoringEngineLatencyMs}ms)</span>
        </div>

        {/* Mobile Exit Shortcut */}
        {onExitAdmin && (
          <button
            type="button"
            onClick={onExitAdmin}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs"
            title="Exit Admin to Tournament Studio"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Exit</span>
          </button>
        )}

        {/* Theme Mode Toggle */}
        <AnimatedThemeToggle
          isDark={isDark}
          onToggle={toggleTheme}
        />

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 sm:pl-2 sm:border-l sm:border-[var(--border-subtle)]">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-[#7D4047] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
            {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[var(--text-primary)] leading-tight truncate max-w-[120px]">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] font-mono text-[#7D4047] dark:text-[#E8C4C8] font-semibold">
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

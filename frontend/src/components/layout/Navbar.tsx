import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import {
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Shield
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';
import { PointXLogo } from '../ui/PointXLogo';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface NavbarProps {
  viewMode?: 'command-center' | 'workspace' | 'admin-dashboard';
  onBackToDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  viewMode = 'command-center',
  onBackToDashboard,
  onOpenAdminDashboard
}) => {
  const { currentTournament } = useTournamentStore();
  const { user, theme, toggleTheme, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';
  const isOngoing = currentTournament?.status === 'Live' || currentTournament?.status === 'Ongoing';

  const [showExitModal, setShowExitModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-xl shadow-sm font-sans transition-colors duration-200">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: PointX Brand Logo and Context */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* PointX Official Brand Logo */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'workspace') {
                  setShowExitModal(true);
                } else if (onBackToDashboard) {
                  onBackToDashboard();
                }
              }}
              className="flex items-center gap-2.5 bg-transparent border-0 p-0 text-left cursor-pointer group shrink-0"
              title="PointX Main Dashboard"
            >
              <PointXLogo className="h-7 sm:h-8 w-auto max-w-[105px] sm:max-w-[125px] object-contain group-hover:scale-105 transition-transform select-none" />
            </button>

            {viewMode === 'workspace' ? (
              /* Active Tournament Info & Badges */
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-[var(--border-subtle)] pl-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate font-display" title={currentTournament.title}>
                    {currentTournament.title}
                  </h1>

                  <Badge
                    variant={
                      isOngoing
                        ? 'live'
                        : currentTournament.status === 'Completed'
                        ? 'completed'
                        : currentTournament.status === 'Upcoming'
                        ? 'cyan'
                        : 'draft'
                    }
                    size="sm"
                    pulse={isOngoing}
                  >
                    {currentTournament.status.toUpperCase()}
                  </Badge>

                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] shrink-0">
                    <span>{currentTournament.teams.length} Teams</span>
                    <span>•</span>
                    <span>{currentTournament.matches.length} Matches</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Command Center Subtitle */
              <div className="flex flex-col border-l border-[var(--border-subtle)] pl-3.5 hidden sm:flex">
                <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
                  By Strikz Esports
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                  Official Esports Platform
                </span>
              </div>
            )}
          </div>

        {/* Right: Theme Toggle & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-3">
          {/* Theme Quick Toggle Button */}
          <button
            onClick={toggleTheme}
            className="glass-nav-item p-2 sm:p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[var(--accent-primary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
            )}
          </button>

          {/* User Profile Pill */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="glass-nav-item flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--bg-surface-inset)] text-xs font-black text-[var(--accent-primary)] font-mono border border-[var(--border-subtle)]">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden xl:inline truncate max-w-[90px] text-xs sm:text-sm font-bold">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-floating)] z-50 animate-dropdown-enter space-y-1 backdrop-blur-xl">
                  <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)] mb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] text-sm truncate font-display">{user.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        user.role === 'admin' ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono truncate mt-0.5">{user.email}</div>
                  </div>

                  {/* Switch Role Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = user.role === 'admin' ? 'organizer' : 'admin';
                      useAuthStore.getState().setRole(next);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all text-left cursor-pointer font-semibold"
                  >
                    <span>Switch Role</span>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
                      {user.role === 'admin' ? '→ Normal User' : '→ Admin Mode'}
                    </span>
                  </button>

                  {/* Admin Dashboard Entry Point (Only for Admins) */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenAdminDashboard) {
                          onOpenAdminDashboard();
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#7D4047]/10 text-[#7D4047] dark:text-[#E8C4C8] hover:bg-[#7D4047] hover:text-white transition-all text-left cursor-pointer font-bold border border-[#7D4047]/20"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Control Center</span>
                    </button>
                  )}

                  {/* Theme Mode Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-all cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="h-4 w-4 text-[var(--accent-primary)]" />
                      ) : (
                        <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
                      )}
                      <span>Theme Mode</span>
                    </div>
                    <span className="text-xs font-mono uppercase font-bold text-[var(--accent-primary)]">
                      {theme}
                    </span>
                  </button>

                  <div className="pt-1 border-t border-[var(--border-subtle)] mt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-all text-left cursor-pointer font-bold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Confirmation Modal to Exit Workspace to Main Dashboard */}
    <Modal
      isOpen={showExitModal}
      onClose={() => setShowExitModal(false)}
      title="Return to Main Dashboard?"
      maxWidth="md"
    >
      <div className="space-y-4 font-sans">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          You are currently working inside <strong className="text-[var(--text-primary)] font-bold">{currentTournament?.title || 'this tournament'}</strong>. Are you sure you want to return to the Main Dashboard?
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          All your changes are automatically saved and you can return anytime.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowExitModal(false)}
          >
            No, Stay Here
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowExitModal(false);
              if (onBackToDashboard) {
                onBackToDashboard();
              }
            }}
          >
            Yes, Return to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};
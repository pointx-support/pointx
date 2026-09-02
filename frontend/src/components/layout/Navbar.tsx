import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import {
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Shield,
  ArrowLeft,
  Home,
  User,
  Settings,
  Lock,
  Laptop,
  Trophy,
  History,
  HelpCircle,
  Repeat,
  ExternalLink,
  Keyboard,
  Sparkles
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
  onNavigateHome?: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  viewMode = 'command-center',
  onBackToDashboard,
  onOpenAdminDashboard,
  onNavigateHome,
}) => {
  const { currentTournament, setActiveTab } = useTournamentStore();
  const { user, theme, toggleTheme, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isDark = theme === 'dark';
  const isOngoing = currentTournament?.status === 'Live' || currentTournament?.status === 'Ongoing';
  const isAdmin = user?.role === 'admin' || (user as any)?.isOriginalAdmin;

  const handleOpenTab = (tab: any) => {
    setIsDropdownOpen(false);
    setActiveTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-xl shadow-sm font-sans transition-colors duration-200">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
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
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-[var(--border-subtle)] pl-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate font-display" title={currentTournament?.title}>
                    {currentTournament?.title}
                  </h1>
                  <Badge
                    variant={
                      isOngoing
                        ? 'live'
                        : currentTournament?.status === 'Completed'
                        ? 'completed'
                        : currentTournament?.status === 'Upcoming'
                        ? 'cyan'
                        : 'draft'
                    }
                    size="sm"
                    pulse={isOngoing}
                  >
                    {currentTournament?.status?.toUpperCase()}
                  </Badge>
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] shrink-0">
                    <span>{currentTournament?.teams?.length || 0} Teams</span>
                    <span>•</span>
                    <span>{currentTournament?.matches?.length || 0} Matches</span>
                  </div>
                </div>
              </div>
            ) : viewMode === 'admin-dashboard' ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-[var(--border-subtle)] pl-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
                  <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate font-display">
                    Admin Control Center
                  </h1>
                  <Badge variant="live" size="sm">GOVERNANCE</Badge>
                </div>
                {onBackToDashboard && (
                  <button
                    type="button"
                    onClick={onBackToDashboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs ml-1 sm:ml-3 font-mono"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col border-l border-[var(--border-subtle)] pl-3.5 hidden sm:flex">
                <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">PointX Esports</span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">Official Esports Platform</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-all font-mono"
                title="View Public Landing Page"
              >
                <Home className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                <span>Landing Page</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm cursor-pointer transition-colors"
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="h-4 w-4 text-[var(--accent-primary)]" /> : <Moon className="h-4 w-4 text-[var(--accent-primary)]" />}
            </button>

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2.5 rounded-xl border transition-all p-1.5 sm:px-3 sm:py-2 cursor-pointer ${
                    isDropdownOpen ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-raised)] shadow-[0_0_15px_rgba(255,208,0,0.15)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] shadow-sm'
                  }`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-xs font-black text-[var(--accent-primary)] font-mono border border-amber-400/40 shrink-0 shadow-xs">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-lg" /> : user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden xl:flex flex-col text-left leading-tight">
                    <span className="truncate max-w-[100px] text-xs font-bold text-[var(--text-primary)] font-sans">{user.name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{user.role}</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-76 sm:w-84 max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/98 backdrop-blur-2xl p-2.5 shadow-[var(--shadow-floating)] z-50 animate-dropdown-enter space-y-2 divide-y divide-[var(--border-subtle)]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffd000]/25 via-[#ffc000]/15 to-[#ff9900]/25 border border-amber-400/50 text-sm font-black text-[var(--accent-primary)] font-mono shrink-0 shadow-md">
                          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-xl" /> : user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-sm text-[var(--text-primary)] font-display truncate">{user.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/[0.08] text-[var(--text-secondary)] border border-white/[0.1]'}`}>
                              {user.role === 'admin' ? 'Super Admin' : 'Organizer'}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] font-mono truncate mt-0.5">{user.email}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><span>Verified Account</span></div>
                        <span className="text-[var(--text-muted)] text-[10px]">Active Session</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Account & Security</div>
                      <button type="button" onClick={() => handleOpenTab('account')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <User className="h-4 w-4 text-[var(--accent-primary)]" />
                          <div><div className="font-bold text-[var(--text-primary)]">My Account / Profile</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Personal info & credentials</div></div>
                        </div>
                      </button>
                      <button type="button" onClick={() => handleOpenTab('settings')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <Settings className="h-4 w-4 text-[var(--accent-primary)]" />
                          <div><div className="font-bold text-[var(--text-primary)]">Account Settings</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Platform rules & branding</div></div>
                        </div>
                      </button>
                      <button type="button" onClick={() => handleOpenTab('account')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <Lock className="h-4 w-4 text-emerald-400" />
                          <div><div className="font-bold text-[var(--text-primary)]">Security & Login</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Password & 2FA protection</div></div>
                        </div>
                      </button>
                      <button type="button" onClick={() => handleOpenTab('account')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <Laptop className="h-4 w-4 text-cyan-400" />
                          <div><div className="font-bold text-[var(--text-primary)]">Active Sessions / Devices</div><div className="text-[10px] text-[var(--text-muted)] font-mono">1 device connected</div></div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-white">Active</span>
                      </button>
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Tournaments & Logs</div>
                      <button type="button" onClick={() => { setIsDropdownOpen(false); if (onBackToDashboard) onBackToDashboard(); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <Trophy className="h-4 w-4 text-[var(--accent-primary)]" />
                          <div><div className="font-bold text-[var(--text-primary)]">My Tournaments</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Command Center dashboard</div></div>
                        </div>
                      </button>
                      <button type="button" onClick={() => handleOpenTab('organization')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <History className="h-4 w-4 text-[var(--status-info)]" />
                          <div><div className="font-bold text-[var(--text-primary)]">Usage & Activity</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Audit logs & timeline</div></div>
                        </div>
                      </button>
                      {onNavigateHome && (
                        <button type="button" onClick={() => { setIsDropdownOpen(false); onNavigateHome(); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <Home className="h-4 w-4 text-purple-400" />
                            <div><div className="font-bold text-[var(--text-primary)]">Landing Page</div><div className="text-[10px] text-[var(--text-muted)] font-mono">Public storefront</div></div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </button>
                      )}
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Platform Tools</div>
                      <button type="button" onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer">
                        <div className="flex items-center gap-2.5">{isDark ? <Sun className="h-4 w-4 text-[var(--accent-primary)]" /> : <Moon className="h-4 w-4 text-[var(--accent-primary)]" />}<span className="font-bold text-[var(--text-primary)]">Theme Mode</span></div>
                        <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded bg-white/[0.06] text-[var(--accent-primary)]">{theme}</span>
                      </button>
                      <button type="button" onClick={() => { setIsDropdownOpen(false); setShowShortcutsModal(true); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer">
                        <div className="flex items-center gap-2.5"><Keyboard className="h-4 w-4 text-cyan-400" /><span className="font-bold text-[var(--text-primary)]">Keyboard Shortcuts</span></div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">?</span>
                      </button>
                      <button type="button" onClick={() => { setIsDropdownOpen(false); setShowHelpModal(true); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer">
                        <div className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-amber-400" /><span className="font-bold text-[var(--text-primary)]">Help & Support</span></div>
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="pt-2 space-y-1">
                        <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Super Governance</div>
                        {user?.role === 'admin' && onOpenAdminDashboard && (
                          <button type="button" onClick={() => { setIsDropdownOpen(false); onOpenAdminDashboard(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#7D4047]/15 text-[#E8C4C8] hover:bg-[#7D4047] hover:text-white transition-all text-left cursor-pointer border border-[#7D4047]/30">
                            <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                            <span>Admin Control Center</span>
                          </button>
                        )}
                        <button type="button" onClick={() => { const next = user.role === 'admin' ? 'organizer' : 'admin'; useAuthStore.getState().setRole(next); }} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer font-semibold">
                          <div className="flex items-center gap-2.5"><Repeat className="h-4 w-4 text-amber-400" /><span>Switch Role View</span></div>
                          <span className="text-[10px] font-mono font-bold text-amber-400">{user.role === 'admin' ? '→ Organizer' : '→ Admin'}</span>
                        </button>
                      </div>
                    )}

                    <div className="pt-2">
                      <button type="button" onClick={() => { setIsDropdownOpen(false); logout(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-all text-left cursor-pointer font-bold">
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

      <Modal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} title="Keyboard Shortcuts Cheat Sheet" maxWidth="lg">
        <div className="space-y-4 font-sans">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Use these global keyboard shortcuts to accelerate your tournament operations.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Show Shortcuts Cheat Sheet</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">?</kbd></div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Close Active Modal / Exit</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">ESC</kbd></div>
          </div>
          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => setShowShortcutsModal(false)}>Got It</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="PointX Help & Support" maxWidth="md">
        <div className="space-y-4 font-sans">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--accent-primary)]" /><span>Official Rule Engine</span></div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">PointX calculates placement and kill scores conforming directly to official esports rulebooks.</p>
          </div>
          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => setShowHelpModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title="Return to Main Dashboard?" maxWidth="md">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">You are currently working inside <strong className="text-[var(--text-primary)] font-bold">{currentTournament?.title || 'this tournament'}</strong>. Are you sure you want to return to the Main Dashboard?</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="md" onClick={() => setShowExitModal(false)}>No, Stay Here</Button>
            <Button variant="primary" size="md" onClick={() => { setShowExitModal(false); if (onBackToDashboard) onBackToDashboard(); }}>Yes, Return to Dashboard</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
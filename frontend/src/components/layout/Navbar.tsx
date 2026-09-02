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
  Sparkles,
  ShieldCheck,
  Smartphone,
  Globe
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';
import { PointXLogo } from '../ui/PointXLogo';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

export interface NavbarProps {
  viewMode?: 'command-center' | 'workspace' | 'admin-dashboard';
  onBackToDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onNavigateHome?: () => void;
  onSelectWorkspaceTab?: (tab: any) => void;
}

export const Navbar: FC<NavbarProps> = ({
  viewMode = 'command-center',
  onBackToDashboard,
  onOpenAdminDashboard,
  onNavigateHome,
  onSelectWorkspaceTab: _onSelectWorkspaceTab
}) => {
  const { currentTournament } = useTournamentStore();
  const {
    user,
    theme,
    toggleTheme,
    logout,
    updateProfile,
    changePassword,
    terminateOtherSessions,
    activities,
    sessions,
    setRole
  } = useAuthStore();
  const { showToast } = useToast();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal Dialog States
  const [showExitModal, setShowExitModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOrgName, setEditOrgName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync profile edit state whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditOrgName(user.organizationName || '');
      setEditPhone(user.phoneNumber || '');
    }
  }, [user, showProfileModal, showSettingsModal]);

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

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter your full name.' });
      return;
    }
    updateProfile({
      name: editName.trim(),
      organizationName: editOrgName.trim(),
      phoneNumber: editPhone.trim()
    });
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your personal and organization credentials have been saved.'
    });
    setShowProfileModal(false);
    setShowSettingsModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast({ type: 'error', title: 'Input Required', message: 'Please fill out all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ type: 'error', title: 'Weak Password', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Mismatch', message: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password was changed securely.'
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowSecurityModal(false);
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: res.error || 'Current password was incorrect.'
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    await terminateOtherSessions();
    showToast({
      type: 'success',
      title: 'Sessions Terminated',
      message: 'All other connected devices have been logged out.'
    });
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
                    
                    {/* Header Profile Identity Card */}
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

                    {/* SECTION 1: ACCOUNT & SECURITY */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Account & Security</div>
                      
                      {/* My Account / Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="h-4 w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">My Account / Profile</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Personal info & credentials</div>
                          </div>
                        </div>
                      </button>

                      {/* Account Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowSettingsModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings className="h-4 w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Account Settings</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Platform rules & branding</div>
                          </div>
                        </div>
                      </button>

                      {/* Security & Login */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowSecurityModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Lock className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Security & Login</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Password & 2FA protection</div>
                          </div>
                        </div>
                      </button>

                      {/* Active Sessions / Devices */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowSessionsModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Laptop className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Active Sessions / Devices</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">1 device connected</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-white">Active</span>
                      </button>
                    </div>

                    {/* SECTION 2: TOURNAMENTS & LOGS */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Tournaments & Logs</div>
                      
                      {/* My Tournaments (Go to Dashboard) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (onBackToDashboard) onBackToDashboard();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Trophy className="h-4 w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">My Tournaments</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Command Center dashboard</div>
                          </div>
                        </div>
                      </button>

                      {/* Usage & Activity */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowActivityModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <History className="h-4 w-4 text-[var(--status-info)] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Usage & Activity</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Audit logs & timeline</div>
                          </div>
                        </div>
                      </button>

                      {/* Landing Page */}
                      {onNavigateHome && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onNavigateHome();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Home className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-bold text-[var(--text-primary)]">Landing Page</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">Public storefront</div>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </button>
                      )}
                    </div>

                    {/* SECTION 3: PLATFORM TOOLS */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Platform Tools</div>
                      
                      {/* Theme Toggle */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? <Sun className="h-4 w-4 text-[var(--accent-primary)]" /> : <Moon className="h-4 w-4 text-[var(--accent-primary)]" />}
                          <span className="font-bold text-[var(--text-primary)]">Theme Mode</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded bg-white/[0.06] text-[var(--accent-primary)]">{theme}</span>
                      </button>

                      {/* Keyboard Shortcuts */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowShortcutsModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Keyboard className="h-4 w-4 text-cyan-400" />
                          <span className="font-bold text-[var(--text-primary)]">Keyboard Shortcuts</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">?</span>
                      </button>

                      {/* Help & Support */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowHelpModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="h-4 w-4 text-amber-400" />
                          <span className="font-bold text-[var(--text-primary)]">Help & Support</span>
                        </div>
                      </button>
                    </div>

                    {/* SECTION 4: GOVERNANCE (Admins Only) */}
                    {isAdmin && (
                      <div className="pt-2 space-y-1">
                        <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">Super Governance</div>
                        {user?.role === 'admin' && onOpenAdminDashboard && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onOpenAdminDashboard();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#7D4047]/15 text-[#E8C4C8] hover:bg-[#7D4047] hover:text-white transition-all text-left cursor-pointer border border-[#7D4047]/30"
                          >
                            <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                            <span>Admin Control Center</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const next = user.role === 'admin' ? 'organizer' : 'admin';
                            setRole(next);
                            showToast({
                              type: 'info',
                              title: 'Role Switched',
                              message: `You are now in ${next === 'admin' ? 'Admin Mode' : 'Organizer Mode'}.`
                            });
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer font-semibold"
                        >
                          <div className="flex items-center gap-2.5">
                            <Repeat className="h-4 w-4 text-amber-400" />
                            <span>Switch Role View</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400">{user.role === 'admin' ? '→ Organizer' : '→ Admin'}</span>
                        </button>
                      </div>
                    )}

                    {/* SECTION 5: SIGN OUT */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-all text-left cursor-pointer font-bold"
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

      {/* 1. My Account / Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="My Account / Profile" maxWidth="md">
        <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/25 border border-amber-400/50 flex items-center justify-center font-mono font-black text-sm text-[var(--accent-primary)]">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-xl" /> : user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)] font-display">{user?.name}</div>
              <div className="text-xs text-[var(--text-secondary)] font-mono">{user?.email}</div>
              <Badge variant="live" size="sm" className="mt-1">Verified {user?.role === 'admin' ? 'Admin' : 'Organizer'}</Badge>
            </div>
          </div>

          <Input label="Full Name *" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Email Address (Verified)" value={editEmail} disabled className="opacity-75 cursor-not-allowed" />
          <Input label="Organization / Club Name" value={editOrgName} onChange={(e) => setEditOrgName(e.target.value)} placeholder="e.g. Total Gaming Esports" />
          <Input label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowProfileModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Account Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Account Settings" maxWidth="md">
        <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
          <p className="text-xs text-[var(--text-secondary)]">Configure your organization defaults and tournament branding.</p>
          <Input label="Organization Brand Name" value={editOrgName} onChange={(e) => setEditOrgName(e.target.value)} placeholder="PointX Arena Club" />
          <Input label="Official Contact Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" />
          <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-mono space-y-1">
            <div className="text-[var(--text-secondary)]">Default Rule Matrix: <strong className="text-[var(--text-primary)]">Free Fire 12-Tier Official</strong></div>
            <div className="text-[var(--text-secondary)]">Stream Overlay Resolution: <strong className="text-cyan-400">1080p60 / 4K UHD</strong></div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Settings</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Security & Login Modal */}
      <Modal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} title="Security & Authentication" maxWidth="md">
        <form onSubmit={handleChangePassword} className="space-y-4 font-sans">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Email OTP 2-Factor Authentication Active</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Protected</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="text-xs font-bold font-mono text-[var(--text-secondary)] uppercase">Change Password</div>
            <Input label="Current Password *" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" required />
            <Input label="New Password *" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" required />
            <Input label="Confirm New Password *" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowSecurityModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Active Sessions / Devices Modal */}
      <Modal isOpen={showSessionsModal} onClose={() => setShowSessionsModal(false)} title="Active Sessions & Devices" maxWidth="md">
        <div className="space-y-4 font-sans">
          <p className="text-xs text-[var(--text-secondary)]">Manage devices that are currently authenticated into your PointX account.</p>

          <div className="space-y-2.5">
            {/* Current Active Device */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Current Browser Session</span>
                    <Badge variant="live" size="sm">THIS DEVICE</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">
                    Windows Desktop • Chrome Engine • IP: Active Session
                  </div>
                </div>
              </div>
            </div>

            {/* List other sessions if any */}
            {sessions.map((sess) => (
              <div key={sess.id} className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.06] text-[var(--text-secondary)]">
                    {sess.deviceName?.toLowerCase().includes('phone') || sess.deviceName?.toLowerCase().includes('android') || sess.deviceName?.toLowerCase().includes('ios') ? <Smartphone className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">{sess.deviceName || 'Authenticated Device'} • {sess.browser}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">{sess.ipAddress || 'Active'} • {new Date(sess.lastActive).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <Button variant="danger" size="sm" onClick={handleTerminateOtherSessions} leftIcon={<LogOut className="h-3.5 w-3.5" />}>
              Terminate Other Sessions
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSessionsModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* 5. Usage & Activity Audit Log Modal */}
      <Modal isOpen={showActivityModal} onClose={() => setShowActivityModal(false)} title="Usage & Audit Activity Log" maxWidth="lg">
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Live Audit Trail (Last 20 Activities)</span>
            <span className="text-emerald-400 font-bold">Synchronized</span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-xs pr-1 custom-scrollbar">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[var(--text-primary)] font-sans">{act.action}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{act.details}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded uppercase font-bold bg-white/[0.06] text-[var(--accent-primary)]">{act.category}</span>
                    <div className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(act.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[var(--text-primary)] font-sans">Authenticated Session Started</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Logged in as {user?.email}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 font-mono">AUTH</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[var(--text-primary)] font-sans">Point Matrix Engine Synchronized</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Free Fire 12-Tier Official Scoring Rules active</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 font-mono">TOURNAMENT</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => setShowActivityModal(false)}>Close Log</Button>
          </div>
        </div>
      </Modal>

      {/* 6. Keyboard Shortcuts Modal */}
      <Modal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} title="Keyboard Shortcuts Cheat Sheet" maxWidth="lg">
        <div className="space-y-4 font-sans">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Use these global keyboard shortcuts anywhere in PointX to accelerate your tournament operations.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Show Shortcuts Cheat Sheet</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">?</kbd></div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Close Active Modal / Exit</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">ESC</kbd></div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Quick Standings Recalculation</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">R</kbd></div>
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between"><span className="text-[var(--text-secondary)] font-sans">Toggle Theme Mode (Dark/Light)</span><kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-strong)] font-bold text-[var(--accent-primary)]">T</kbd></div>
          </div>
          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => setShowShortcutsModal(false)}>Got It</Button>
          </div>
        </div>
      </Modal>

      {/* 7. Help & Support Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="PointX Help & Support" maxWidth="md">
        <div className="space-y-4 font-sans">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--accent-primary)]" /><span>Official Free Fire 12-Tier Rule Engine</span></div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">PointX calculates placement and kill scores conforming directly to official esports rulebooks (12-9-8-7-6-5-4-3-2-1-0-0).</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Shield className="h-4 w-4 text-emerald-400" /><span>Need Direct Tournament Assistance?</span></div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Email our engineering support team directly at <strong className="text-[var(--accent-primary)] font-mono">support@pointx.in</strong>.</p>
          </div>
          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => setShowHelpModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* 8. Exit Tournament Confirmation Modal */}
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
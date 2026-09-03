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
  Laptop,
  Trophy,
  HelpCircle,
  Repeat,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Globe,
  Copy,
  Check,
  Mail,
  Send,
  MessageSquare
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';
import { PointXLogo } from '../ui/PointXLogo';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedThemeToggle } from '../animation';
import { dropdownVariants } from '../animation/motionTokens';

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
  onSelectWorkspaceTab
}) => {
  const { currentTournament, activeTournamentId, activeTab } = useTournamentStore();
  const hasActiveTournament = Boolean(
    activeTournamentId &&
    currentTournament?.id &&
    currentTournament.id !== '' &&
    !currentTournament.id.startsWith('tour-empty-')
  );
  const {
    user,
    theme,
    toggleTheme,
    logout,
    updateProfile,
    changePassword,
    terminateOtherSessions,
    sessions,
    setRole
  } = useAuthStore();
  const { showToast } = useToast();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal Dialog States
  const [showExitModal, setShowExitModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
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

  // Quick Staff Delegation Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'scorer' | 'broadcast_producer' | 'co-organizer'>('scorer');
  const [quickCopied, setQuickCopied] = useState(false);

  // Contact Form State
  const [contactCategory, setContactCategory] = useState('OBS Overlays & Broadcast Graphics');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Sync profile edit state whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditOrgName(user.organizationName || '');
      setEditPhone(user.phoneNumber || '');
    }
  }, [user, showProfileModal]);

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
      message: 'Account details and organization branding saved.'
    });
    setShowProfileModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast({ type: 'error', title: 'Invalid Password', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Password Mismatch', message: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    const res = await changePassword(oldPassword, newPassword);
    setPasswordLoading(false);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowSecurityModal(false);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account credentials have been updated securely.'
      });
    } else {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: res.error || 'Current password was incorrect.'
      });
    }
  };

  const handleCreateStaffPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) {
      showToast({ type: 'error', title: 'Required Fields', message: 'Enter staff member name and email.' });
      return;
    }

    const operatorLink = `${window.location.origin}/remote?tour=${currentTournament?.id || 'live'}&role=${staffRole}&staff=${encodeURIComponent(staffName)}`;
    navigator.clipboard.writeText(operatorLink);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 3000);

    showToast({
      type: 'success',
      title: 'Operator Access Pass Created',
      message: `Direct Operator URL for ${staffName} copied to clipboard!`
    });
  };

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      showToast({ type: 'error', title: 'Fields Required', message: 'Please enter a subject and your message.' });
      return;
    }
    setContactSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name || 'Tournament Organizer',
          email: user?.email || 'support@pointx.in',
          category: contactCategory,
          subject: contactSubject.trim(),
          message: contactMessage.trim(),
          organizationName: user?.organizationName,
          tournamentTitle: currentTournament?.title
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setContactSubject('');
        setContactMessage('');
        setShowHelpModal(false);
        showToast({
          type: 'success',
          title: 'Support Query Dispatched',
          message: 'Your inquiry was delivered directly to all PointX administrators via email.'
        });
      } else {
        showToast({
          type: 'error',
          title: 'Dispatch Failed',
          message: data.error || 'Failed to send query. Please reach out on Telegram @Darklordx69.'
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to server. Please reach out on Telegram @Darklordx69.'
      });
    } finally {
      setContactSending(false);
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

            {viewMode === 'workspace' && hasActiveTournament ? (
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
            ) : viewMode === 'workspace' && !hasActiveTournament ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-[var(--border-subtle)] pl-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate font-display">
                    {activeTab === 'organization' ? 'My Organisation' : activeTab === 'account' ? 'Staff & Account' : 'PointX Arena'}
                  </h1>
                  <Badge variant="cyan" size="sm">ORGANIZER CONSOLE</Badge>
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

            <AnimatedThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
            />

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2.5 rounded-xl border transition-all p-1.5 sm:px-3 sm:py-2 cursor-pointer btn-press ${
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

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2.5 w-76 sm:w-84 max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/98 backdrop-blur-2xl p-2.5 shadow-[var(--shadow-floating)] z-50 space-y-2 divide-y divide-[var(--border-subtle)]"
                    >
                    
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

                    {/* SECTION 1: ACCOUNT & MANAGEMENT */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Account & Organization</div>
                      
                      {/* Unified My Account & Settings Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (onSelectWorkspaceTab) {
                            onSelectWorkspaceTab('account');
                          } else {
                            setShowProfileModal(true);
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="h-4 w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">My Account & Settings</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Personal info, branding & rules</div>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
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
                          <Laptop className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Active Sessions / Devices</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">Manage active devices</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-white">Active</span>
                      </button>
                    </div>

                    {/* SECTION 2: TOURNAMENTS & NAVIGATION */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Tournaments</div>
                      
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

                    {/* SECTION 3: PLATFORM TOOLS & HELP */}
                    <div className="pt-2 space-y-1">
                      <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Support & Controls</div>
                      
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

                      {/* Contact Us & Support */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowHelpModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">Contact Us & Support</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">24/7 helpdesk & WhatsApp</div>
                          </div>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. Unified My Account & Settings Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="My Account & Organization Settings" maxWidth="md">
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
          <Input label="Official Contact Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" />

          <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-mono space-y-1">
            <div className="text-[var(--text-secondary)]">Default Rule Matrix: <strong className="text-[var(--text-primary)]">Free Fire 12-Tier Official</strong></div>
            <div className="text-[var(--text-secondary)]">Stream Overlay Resolution: <strong className="text-cyan-400">1080p60 / 4K UHD</strong></div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
            {onSelectWorkspaceTab && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  onSelectWorkspaceTab('account');
                }}
                leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                Open Full Account Portal
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowProfileModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit">Save Changes</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 2. Staff & Operator Quick Access Modal */}
      <Modal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} title="Staff & Tournament Operator Delegation" maxWidth="md">
        <form onSubmit={handleCreateStaffPass} className="space-y-4 font-sans">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Authorize team members or referees to enter match scores, record kills, and control OBS stream overlays.
          </p>

          <Input
            label="Staff Member Name *"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />

          <Input
            label="Staff Email Address *"
            type="email"
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            placeholder="staff@esports.in"
            required
          />

          <div>
            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Assigned Operational Role
            </label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] font-sans focus:border-[var(--accent-primary)] outline-none"
            >
              <option value="scorer">Match Scorer & Points Operator (Scorecard & Kill Entry)</option>
              <option value="broadcast_producer">Broadcast & Overlay Producer (OBS Transparent URL & Graphics)</option>
              <option value="co-organizer">Co-Organizer (Full Administrative Tournament Access)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
            <div className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Direct Remote Operator URL
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Generating this pass gives your staff instant access to the match scoring controller and OBS broadcast overlays.
            </p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
            {onSelectWorkspaceTab && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setShowStaffModal(false);
                  onSelectWorkspaceTab('account');
                }}
              >
                View All Staff
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowStaffModal(false)}>Close</Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                leftIcon={quickCopied ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5 text-black" />}
              >
                {quickCopied ? 'Access Link Copied!' : 'Generate & Copy Link'}
              </Button>
            </div>
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

      {/* 5. Contact Us & Support Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Contact Us & Tournament Support Desk" maxWidth="lg">
        <div className="space-y-5 font-sans">
          
          {/* Support Channels Strip (Spacious 2-Card Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Telegram Support Channel */}
            <a
              href="https://t.me/Darklordx69"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400 hover:bg-cyan-500/20 transition-all flex flex-col justify-between group shadow-sm text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">Telegram Support</div>
                    <div className="text-xs text-cyan-400 font-mono font-bold mt-0.5">@Darklordx69</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                  &lt; 5m REPLY
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-3 leading-relaxed">
                Direct 1-on-1 assistance for scoring setup, OBS overlays, and live tournament troubleshooting.
              </p>
            </a>

            {/* Official Email Channel */}
            <a
              href="mailto:support@pointx.in"
              className="p-4 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/60 transition-all flex flex-col justify-between group shadow-sm text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">Official Email Desk</div>
                    <div className="text-xs text-[var(--accent-primary)] font-mono font-bold mt-0.5">support@pointx.in</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-[var(--accent-primary)] font-bold uppercase tracking-wider">
                  ALL ADMINS
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-3 leading-relaxed">
                Formal queries, billing inquiries, and enterprise feature requests dispatched to all platform admins.
              </p>
            </a>
          </div>

          {/* Emergency 24/7 Operations Ribbon */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>24/7 Live Esports Broadcast & Matrix Operations</span>
            </div>
            <span className="text-[var(--text-muted)] text-[10px]">Active Response Team</span>
          </div>

          {/* Priority Support Ticket Message Form */}
          <form onSubmit={handleSendContact} className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-[var(--text-secondary)] uppercase">Send Direct Message to Administrators</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Broadcasts to all admins
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Support Category / Topic
              </label>
              <select
                value={contactCategory}
                onChange={(e) => setContactCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:border-[var(--accent-primary)] outline-none"
              >
                <option value="OBS Overlays & Broadcast Graphics">OBS Overlays & Broadcast Graphics (Browser Source, 4K Posters)</option>
                <option value="Point Matrix & Scoring Calculation">Point Matrix & Scoring Calculation (Free Fire 12-Tier, Tie-breakers)</option>
                <option value="Staff & Operator Delegation">Staff & Operator Delegation (Scorer / Broadcast Pass URLs)</option>
                <option value="Team Slots & Tournament Configuration">Team Slots & Tournament Configuration (Slotting & Roster)</option>
                <option value="Account, Security & 2FA Login">Account, Security & 2FA Login</option>
                <option value="General Inquiry & Feature Request">General Inquiry & Feature Request</option>
              </select>
            </div>

            <Input
              label="Subject / Topic *"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="e.g. Assistance setting up transparent OBS browser source for 12-team final"
              required
            />

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Your Query / Message Details *
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your question or issue in detail..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:border-[var(--accent-primary)] outline-none resize-none"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Direct dispatch to: <strong className="text-[var(--text-primary)]">support@pointx.in</strong> &amp; admins
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowHelpModal(false)}>Close</Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={contactSending}
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                >
                  {contactSending ? 'Dispatching to Admins...' : 'Send Query to Admins'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* 6. Exit Tournament Confirmation Modal */}
      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title="Return to Main Dashboard?" maxWidth="md">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">You are currently working inside <strong className="text-[var(--text-primary)] font-bold">{currentTournament?.title || 'this tournament'}</strong>. Are you sure you want to return to the Main Dashboard?</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="md" onClick={() => setShowExitModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={() => { setShowExitModal(false); if (onBackToDashboard) onBackToDashboard(); }}>Yes, Return to Dashboard</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
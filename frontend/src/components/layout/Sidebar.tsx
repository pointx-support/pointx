import { useState, useMemo } from 'react';
import type { FC } from 'react';
import {
  Trophy,
  LayoutGrid,
  Swords,
  Users2,
  Database,
  UserCheck,
  Sparkles,
  Tv,
  Sliders,
  BarChart3,
  User as UserIcon,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Shield,
  Palette,
  Edit3,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Lock,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { motion, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EditTournamentModal } from '../tournaments/EditTournamentModal';
import { cn } from '../../lib/utils';
import type { AppState } from '../../store/tournamentStore';
import type { AdminTab } from '../../types/admin';

export interface SidebarProps {
  viewMode?: 'command-center' | 'workspace' | 'admin-dashboard';
  onSelectDashboard?: () => void;
  onSelectWorkspaceTab?: (tab: AppState['activeTab']) => void;
  onSelectAdminDashboard?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  viewMode = 'workspace',
  onSelectDashboard,
  onSelectWorkspaceTab,
  onSelectAdminDashboard
}) => {
  const { user, theme } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    currentTournament,
    updateTournament,
    triggerDashboardHighlight,
    activeGraphicsCategory,
    setActiveGraphicsCategory
  } = useTournamentStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const prefersReducedMotion = useReducedMotion();

  // Single-expanded accordion model: 'tournament' | 'graphics' | 'admin' | null
  const [expandedSection, setExpandedSection] = useState<'tournament' | 'graphics' | 'admin' | null>(
    activeTab === 'graphics' ? 'graphics' : viewMode === 'admin-dashboard' ? 'admin' : 'tournament'
  );

  const isMainTreeOpen = expandedSection === 'tournament';
  const isGraphicsTreeOpen = expandedSection === 'graphics';
  const isAdminTreeOpen = expandedSection === 'admin';

  const toggleSection = (section: 'tournament' | 'graphics' | 'admin') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const { activeAdminTab, setActiveAdminTab } = useAdminStore();
  const [hoveredFlyout, setHoveredFlyout] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTournamentRequiredModal, setShowTournamentRequiredModal] = useState(false);

  const isDark = theme === 'dark';
  const isCommandCenter = viewMode === 'command-center';
  const hasActiveTournament = viewMode === 'workspace' && Boolean(currentTournament?.id);
  const isTournamentLocked = !hasActiveTournament;
  const isExpanded = !isSidebarCollapsed;

  // Best-in-class accordion expand / collapse motion variants
  const accordionVariants: Variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: prefersReducedMotion ? 0.08 : 0.28, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: prefersReducedMotion ? 0.08 : 0.18, ease: 'easeIn' },
      },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: prefersReducedMotion ? 0.08 : 0.35, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: prefersReducedMotion ? 0.08 : 0.25, delay: prefersReducedMotion ? 0 : 0.04, ease: 'easeOut' },
      },
    },
  };

  const branchItemVariants: Variants = {
    collapsed: { opacity: 0, x: prefersReducedMotion ? 0 : -8 },
    expanded: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.024,
        duration: prefersReducedMotion ? 0.08 : 0.24,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  // Sub-items inside the Main Tournament Tree (Scoring Rules moved here per user directive)
  const tournamentSubItems = [
    { id: 'standings', label: 'Point Table', icon: Trophy },
    { id: 'matches', label: 'Calculate Points', icon: Swords },
    { id: 'teams', label: 'Teams & Slots', icon: Users2 },
    { id: 'players', label: 'Players Roster', icon: UserCheck },
    { id: 'global-teams', label: 'Squads DB', icon: Database },
    { id: 'statistics', label: 'Statistics & MVPs', icon: BarChart3 },
    { id: 'settings', label: 'Scoring Rules', icon: Sliders },
    { id: 'edit-tournament', label: 'Edit Tournament Info', icon: Edit3, isAction: true }
  ];

  // Sub-items inside Graphics Studio (Strictly 1-at-a-time active selection)
  const graphicsSubItems: { id: 'standings' | 'warheads' | 'fraggers' | 'team-poster' | 'slots-list' | 'certificate'; label: string; isPro: boolean }[] = [
    { id: 'standings', label: 'Point Tables', isPro: false },
    { id: 'warheads', label: 'Warheads / Kill Leader', isPro: true },
    { id: 'fraggers', label: 'Top Fraggers / MVP', isPro: true },
    { id: 'team-poster', label: 'Team Poster', isPro: true },
    { id: 'slots-list', label: 'Slots List', isPro: true },
    { id: 'certificate', label: 'Victory Certificate', isPro: true }
  ];

  // Organization & Staff Delegation (Accessible before tournament selection)
  const orgNavItems = [
    { id: 'organization', label: 'My Organisation', icon: Building2 },
    { id: 'account', label: 'Staff & Account', icon: UserIcon }
  ];

  // Admin Center Sub-Items
  const adminSubItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizers', label: 'Organizers', icon: Users },
    { id: 'templates', label: 'Template Studio', icon: Palette },
    { id: 'audit-logs', label: 'Activity Logs', icon: FileText },
    { id: 'settings', label: 'Advance Settings', icon: Settings },
  ];

  const handleAdminSubClick = (subId: AdminTab) => {
    setActiveAdminTab(subId);
    setExpandedSection('admin');
    handleNavClick('admin-dashboard');
  };

  const handleGraphicsSubClick = (categoryId: any) => {
    if (isTournamentLocked) {
      triggerDashboardHighlight();
      setShowTournamentRequiredModal(true);
      return;
    }
    setActiveGraphicsCategory(categoryId);
    setExpandedSection('graphics');
    handleNavClick('graphics');
  };

  const handleNavClick = (tabId: string) => {
    setHoveredFlyout(null);

    // Organization and Account are ALWAYS accessible before choosing or creating a tournament
    if (tabId === 'organization' || tabId === 'account') {
      if (onSelectWorkspaceTab) onSelectWorkspaceTab(tabId as any);
      else setActiveTab(tabId as any);
      return;
    }

    if (tabId === 'admin-dashboard') {
      setExpandedSection('admin');
      if (onSelectAdminDashboard) onSelectAdminDashboard();
      return;
    }

    // All tournament arena tabs, live broadcast, and graphics require an active tournament
    if (isTournamentLocked) {
      triggerDashboardHighlight();
      setShowTournamentRequiredModal(true);
      return;
    }

    if (tabId === 'graphics') {
      setExpandedSection('graphics');
    } else if (tabId === 'overview' || tournamentSubItems.some((s) => s.id === tabId)) {
      setExpandedSection('tournament');
    }

    if (tabId === 'edit-tournament') {
      setShowEditModal(true);
      return;
    }

    if (onSelectWorkspaceTab) {
      onSelectWorkspaceTab(tabId as any);
    } else {
      setActiveTab(tabId as any);
    }
  };

  const handleDashboardClick = () => {
    if (viewMode === 'workspace') {
      setShowExitConfirm(true);
    } else if (onSelectDashboard) {
      onSelectDashboard();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (onSelectDashboard) {
      onSelectDashboard();
    }
  };

  // Filter items by search query if user searches
  const filteredSubItems = useMemo(() => {
    if (!searchQuery.trim()) return tournamentSubItems;
    return tournamentSubItems.filter((i) =>
      i.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tournamentSubItems]);

  const isAnySubActive = tournamentSubItems.some((sub) => activeTab === sub.id);
  const isGraphicsActive = activeTab === 'graphics';

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col relative shrink-0 sticky top-20 select-none font-sans transition-all duration-300 ease-in-out z-40 my-3 ml-3 sm:ml-4 rounded-[30px] p-3.5 border shadow-2xl h-[calc(100vh-6rem)] overflow-visible',
          isDark
            ? 'bg-[#111215]/98 border-white/15 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]'
            : 'bg-[#FFFFFF] border-black/10 text-[#111215] shadow-[0_20px_50px_rgba(0,0,0,0.08)]',
          isExpanded ? 'w-68' : 'w-20'
        )}
      >
        {/* Collapse / Expand Toggle Tab Pill Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3.5 top-7 h-7 w-7 rounded-full flex items-center justify-center border shadow-lg cursor-pointer transition-transform hover:scale-110 z-50',
            isDark
              ? 'bg-[#18191E] border-white/20 text-zinc-300 hover:text-white'
              : 'bg-white border-black/15 text-zinc-700 hover:text-black'
          )}
          title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
          aria-label={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
          )}
        </button>

        {/* Top Header: Brand Emblem & Quick Search Bar */}
        <div className="space-y-3 pb-3 border-b border-[var(--border-subtle)]">
          {/* Brand Emblem */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDashboardClick}
              className={cn(
                'h-10 w-10 rounded-2xl flex items-center justify-center font-black shadow-md cursor-pointer transition-transform hover:scale-105 shrink-0',
                isDark ? 'bg-white text-black' : 'bg-[#111215] text-white'
              )}
              title="PointX Arena"
            >
              <span className="font-display font-black text-lg tracking-tighter leading-none">
                P<span className="text-[#ffd000]">X</span>
              </span>
            </button>

            {isExpanded && (
              <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display font-black text-sm tracking-wider uppercase truncate">
                    Point<span className="text-[var(--accent-primary)]">X</span> Arena
                  </span>
                  {currentTournament && !isCommandCenter && (
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer shrink-0"
                      title="Edit Tournament Information"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                  {currentTournament ? currentTournament.title : 'Esports Engine'}
                </span>
              </div>
            )}
          </div>

          {/* Search Bar / Search Trigger */}
          {isExpanded ? (
            <div className={cn(
              'relative flex items-center justify-between px-3 py-2 rounded-2xl border transition-all',
              isDark
                ? 'bg-white/[0.04] border-white/10 text-white focus-within:border-white/25'
                : 'bg-black/[0.03] border-black/10 text-black focus-within:border-black/20'
            )}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent border-0 outline-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-white/10 text-[var(--text-muted)] border border-white/10">
                  ⌘S
                </kbd>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'h-10 w-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer',
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-black/[0.03] border-black/10 text-zinc-600 hover:text-black'
                )}
                title="Search and Navigation"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-3 custom-scrollbar">
          
          {/* SECTION 1: MAIN TOURNAMENT ARENA */}
          <div className="space-y-1">
            {isExpanded && (
              <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                MAIN
              </div>
            )}

            {/* 1. Main Dashboard Top Option */}
            <button
              type="button"
              onClick={handleDashboardClick}
              className={cn(
                'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                isCommandCenter
                  ? (isDark ? 'bg-white text-black shadow-md font-display' : 'bg-[#111215] text-white shadow-md font-display')
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
              )}
              title={!isExpanded ? 'Main Dashboard' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutGrid className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  isCommandCenter ? (isDark ? 'text-black' : 'text-white') : 'text-[var(--accent-primary)]'
                )} />
                {isExpanded && <span className="truncate">Main Dashboard</span>}
              </div>
              {isExpanded && isCommandCenter && (
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isDark ? 'bg-black' : 'bg-white')} />
              )}
            </button>

            {/* 2. Main Tournament Navigation Tree */}
            <div
              className={cn(
                'relative transition-all',
                isTournamentLocked && 'opacity-45 filter grayscale-[0.6] hover:opacity-75 cursor-pointer'
              )}
              onMouseEnter={() => !isExpanded && setHoveredFlyout('main-tree')}
              onMouseLeave={() => !isExpanded && setHoveredFlyout(null)}
            >
              <button
                type="button"
                onClick={() => {
                  if (isTournamentLocked) {
                    triggerDashboardHighlight();
                    setShowTournamentRequiredModal(true);
                    return;
                  }
                  if (isExpanded) {
                    toggleSection('tournament');
                    handleNavClick('overview');
                  } else {
                    handleNavClick('overview');
                  }
                }}
                className={cn(
                  'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                  isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                  (activeTab === 'overview' || isAnySubActive) && !isCommandCenter
                    ? (isDark ? 'bg-white/12 text-white shadow-sm' : 'bg-black/8 text-black shadow-sm')
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
                )}
                title={!isExpanded ? 'Tournament Overview' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Trophy className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    (activeTab === 'overview' || isAnySubActive) && !isCommandCenter ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                  )} />
                  {isExpanded && <span className="truncate">Tournament Arena</span>}
                </div>

                {isExpanded && isTournamentLocked && (
                  <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-auto mr-1" />
                )}

                {isExpanded && !isTournamentLocked && (
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isMainTreeOpen ? 'rotate-0 text-[var(--accent-primary)]' : '-rotate-90 text-[var(--text-muted)]'
                    )}
                  />
                )}
              </button>

              {/* Collapsed Flyout Menu Popup for Nested Items */}
              {!isExpanded && hoveredFlyout === 'main-tree' && (
                <div className={cn(
                  'absolute left-full ml-3 top-0 w-52 p-2.5 rounded-3xl border shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150',
                  isDark
                    ? 'bg-[#18191E]/98 border-white/20 text-white shadow-[0_16px_40px_rgba(0,0,0,0.8)]'
                    : 'bg-white/98 border-black/15 text-black shadow-[0_16px_40px_rgba(0,0,0,0.15)]'
                )}>
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5 mb-1.5">
                    Tournament Sections
                  </div>
                  <div className="relative pl-3 border-l-2 border-white/15 space-y-1 ml-2">
                    {tournamentSubItems.map((sub) => {
                      const isActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavClick(sub.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer',
                            isActive
                              ? (isDark ? 'bg-white/15 text-white font-bold' : 'bg-black/10 text-black font-bold')
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                          )}
                        >
                          <span>{sub.label}</span>
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expanded Nested Sub-Tree with Physics Animation */}
              <AnimatePresence initial={false}>
                {isExpanded && isMainTreeOpen && (
                  <motion.div
                    key="tournament-tree-content"
                    variants={accordionVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    <div className="relative pl-5 ml-4 mt-1.5 space-y-0.5">
                      {/* Vertical Tree Connector Spine Line */}
                      <div className="absolute left-[3px] top-1 bottom-2.5 w-[2px] bg-white/20 dark:bg-white/20 light:bg-black/20 rounded-full" />

                      {filteredSubItems.map((sub, idx) => {
                        const Icon = sub.icon;
                        const isActive = activeTab === sub.id && !isCommandCenter;

                        return (
                          <motion.div
                            key={sub.id}
                            custom={idx}
                            variants={branchItemVariants}
                            className="relative flex items-center"
                          >
                            {/* Curved Connector Branch Stub */}
                            <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-3 h-[2px] bg-white/20 dark:bg-white/20 light:bg-black/20 rounded-full" />

                            <button
                              type="button"
                              onClick={() => handleNavClick(sub.id)}
                              className={cn(
                                'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group',
                                isActive
                                  ? (isDark
                                      ? 'bg-white/15 text-white font-bold shadow-sm'
                                      : 'bg-black/10 text-black font-bold shadow-sm')
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110',
                                  isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                                )} />
                                <span className="truncate">{sub.label}</span>
                              </div>

                              {isActive && (
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)] shrink-0" />
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Live Broadcast Overlays (OBS) */}
            <button
              type="button"
              onClick={() => handleNavClick('broadcast')}
              className={cn(
                'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                isTournamentLocked && 'opacity-45 filter grayscale-[0.6] hover:opacity-75',
                activeTab === 'broadcast' && !isCommandCenter
                  ? (isDark ? 'bg-white/12 text-white shadow-sm' : 'bg-black/8 text-black shadow-sm')
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
              )}
              title={!isExpanded ? 'Live Broadcast (OBS)' : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Tv className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  activeTab === 'broadcast' && !isCommandCenter ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                )} />
                {isExpanded && <span className="truncate">Live Overlays (OBS)</span>}
              </div>

              {isExpanded && isTournamentLocked ? (
                <Lock className="h-3 w-3 text-amber-500/80 shrink-0" />
              ) : (
                <span className={cn(
                  'flex h-2 w-2 rounded-full shrink-0',
                  activeTab === 'broadcast' && !isCommandCenter ? 'bg-[var(--accent-primary)]' : 'bg-emerald-400 animate-pulse'
                )} />
              )}
            </button>

            {/* 4. Graphics Studio with Sub-types Branch Tree (Point Tables, Warheads, MVP, etc.) */}
            <div
              className={cn(
                'relative transition-all',
                isTournamentLocked && 'opacity-45 filter grayscale-[0.6] hover:opacity-75 cursor-pointer'
              )}
              onMouseEnter={() => !isExpanded && setHoveredFlyout('graphics-tree')}
              onMouseLeave={() => !isExpanded && setHoveredFlyout(null)}
            >
              <button
                type="button"
                onClick={() => {
                  if (isTournamentLocked) {
                    triggerDashboardHighlight();
                    setShowTournamentRequiredModal(true);
                    return;
                  }
                  if (isExpanded) {
                    toggleSection('graphics');
                    handleNavClick('graphics');
                  } else {
                    handleNavClick('graphics');
                  }
                }}
                className={cn(
                  'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                  isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                  isGraphicsActive && !isCommandCenter
                    ? (isDark ? 'bg-white/12 text-white shadow-sm' : 'bg-black/8 text-black shadow-sm')
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
                )}
                title={!isExpanded ? 'Graphics Studio' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Sparkles className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    isGraphicsActive && !isCommandCenter ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                  )} />
                  {isExpanded && <span className="truncate">Graphics Studio</span>}
                </div>

                {isExpanded && isTournamentLocked && (
                  <Lock className="h-3 w-3 text-amber-500/80 shrink-0 ml-auto mr-1" />
                )}

                {isExpanded && !isTournamentLocked && (
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isGraphicsTreeOpen ? 'rotate-0 text-[var(--accent-primary)]' : '-rotate-90 text-[var(--text-muted)]'
                    )}
                  />
                )}
              </button>

              {/* Collapsed Flyout Menu Popup for Graphics Sub-items */}
              {!isExpanded && hoveredFlyout === 'graphics-tree' && (
                <div className={cn(
                  'absolute left-full ml-3 top-0 w-52 p-2.5 rounded-3xl border shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150',
                  isDark
                    ? 'bg-[#18191E]/98 border-white/20 text-white shadow-[0_16px_40px_rgba(0,0,0,0.8)]'
                    : 'bg-white/98 border-black/15 text-black shadow-[0_16px_40px_rgba(0,0,0,0.15)]'
                )}>
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1.5 mb-1.5">
                    Graphics Posters
                  </div>
                  <div className="relative pl-3 border-l-2 border-white/15 space-y-1 ml-2">
                    {graphicsSubItems.map((sub) => {
                      const isSubActive = isGraphicsActive && activeGraphicsCategory === sub.id && !isCommandCenter;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleGraphicsSubClick(sub.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer',
                            isSubActive
                              ? (isDark ? 'bg-white/15 text-white font-bold' : 'bg-black/10 text-black font-bold')
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                          )}
                        >
                          <span>{sub.label}</span>
                          {isSubActive ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)] shrink-0" />
                          ) : sub.isPro && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                              PRO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expanded Branch Tree Connectors for Graphics Studio with Accordion Animation */}
              <AnimatePresence initial={false}>
                {isExpanded && isGraphicsTreeOpen && (
                  <motion.div
                    key="graphics-tree-branch"
                    variants={accordionVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden"
                  >
                    <div className="relative ml-4 pl-4.5 border-l-2 border-white/15 dark:border-white/15 light:border-black/15 mt-1.5 space-y-1">
                      {graphicsSubItems.map((sub, idx) => {
                        const isSubActive = isGraphicsActive && activeGraphicsCategory === sub.id && !isCommandCenter;

                        return (
                          <motion.div
                            key={sub.id}
                            custom={idx}
                            variants={branchItemVariants}
                            className="relative flex items-center"
                          >
                            {/* Curved Connector Branch Stub */}
                            <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-3.5 h-[2px] bg-white/20 dark:bg-white/20 light:bg-black/20 rounded-full" />

                            <button
                              type="button"
                              onClick={() => handleGraphicsSubClick(sub.id)}
                              className={cn(
                                'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group',
                                isSubActive
                                  ? (isDark
                                      ? 'bg-white/15 text-white font-bold shadow-sm'
                                      : 'bg-black/10 text-black font-bold shadow-sm')
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                              )}
                            >
                              <span className="truncate">{sub.label}</span>
                              {isSubActive ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)] shrink-0" />
                              ) : sub.isPro && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">
                                  PRO
                                </span>
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SECTION 2: ORGANIZATION & STAFF */}
          <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            {isExpanded && (
              <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>ORGANIZATION</span>
                <span className="text-[9px] text-[var(--accent-primary)]">HOST</span>
              </div>
            )}

            {orgNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                    isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                    isActive
                      ? (isDark ? 'bg-white/12 text-white shadow-sm' : 'bg-black/8 text-black shadow-sm')
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={cn(
                      'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    )} />
                    {isExpanded && <span className="truncate">{item.label}</span>}
                  </div>

                  {isExpanded && item.id === 'account' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                      STAFF
                    </span>
                  )}
                </button>
              );
            })}

            {/* Super Admin Control Center Option with Sub-Nav Bar */}
            {user?.role === 'admin' && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isExpanded) {
                      toggleSection('admin');
                    }
                    handleNavClick('admin-dashboard');
                  }}
                  className={cn(
                    'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                    isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                    viewMode === 'admin-dashboard'
                      ? 'bg-amber-500/20 text-[var(--accent-primary)] border border-amber-500/30 shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-amber-400 hover:bg-amber-500/10'
                  )}
                  title={!isExpanded ? 'Admin Control Center' : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield className="h-4 w-4 text-[var(--accent-primary)] shrink-0 transition-transform group-hover:scale-110" />
                    {isExpanded && <span className="truncate text-[var(--accent-primary)] font-bold">Admin Center</span>}
                  </div>
                  {isExpanded && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                        ADMIN
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-neutral-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                          isAdminTreeOpen ? 'rotate-0 text-amber-400' : '-rotate-90'
                        )}
                      />
                    </div>
                  )}
                </button>

                {/* Sub-Navigation Items Under Admin Center on Sidebar with Accordion Animation */}
                <AnimatePresence initial={false}>
                  {isExpanded && isAdminTreeOpen && (
                    <motion.div
                      key="admin-tree-branch"
                      variants={accordionVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="overflow-hidden"
                    >
                      <div className="relative ml-4 pl-4.5 border-l-2 border-amber-500/20 mt-1.5 space-y-1">
                        {adminSubItems.map((sub, idx) => {
                          const Icon = sub.icon;
                          const isSubActive =
                            viewMode === 'admin-dashboard' &&
                            (activeAdminTab === sub.id ||
                              (sub.id === 'templates' && activeAdminTab === 'template-studio') ||
                              (sub.id === 'settings' &&
                                (activeAdminTab === 'requests' ||
                                  activeAdminTab === 'mongodb' ||
                                  activeAdminTab === 'cloudinary' ||
                                  activeAdminTab === 'brevo' ||
                                  activeAdminTab === 'health')));

                          return (
                            <motion.div
                              key={sub.id}
                              custom={idx}
                              variants={branchItemVariants}
                              className="relative flex items-center"
                            >
                              {/* Curved Connector Branch Stub */}
                              <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-3.5 h-[2px] bg-amber-500/30 rounded-full" />
                              <button
                                type="button"
                                onClick={() => handleAdminSubClick(sub.id)}
                                className={cn(
                                  'w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group',
                                  isSubActive
                                    ? isDark
                                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                                      : 'bg-amber-500/15 text-amber-900 font-bold border border-amber-500/30 shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Icon className={cn('h-3.5 w-3.5 shrink-0', isSubActive ? 'text-amber-400' : 'text-neutral-400')} />
                                  <span className="truncate">{sub.label}</span>
                                </div>
                                {isSubActive && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
                                )}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: BOTTOM PROFILE IDENTITY CARD (Matching Reference Image) */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          {isExpanded ? (
            <button
              type="button"
              onClick={() => handleNavClick('account')}
              className={cn(
                'w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 cursor-pointer group',
                isDark
                  ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  : 'bg-black/[0.03] border-black/10 hover:bg-black/[0.06] hover:border-black/20'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/25 border border-amber-400/50 flex items-center justify-center font-mono font-black text-xs text-[var(--accent-primary)] shrink-0 shadow-sm">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    user?.name?.slice(0, 2).toUpperCase() || 'OX'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[var(--text-primary)] truncate font-display">
                    {user?.name || 'Tournament Host'}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase truncate">
                    {user?.role === 'admin' ? 'Super Admin' : 'Organizer'}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleNavClick('account')}
                className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/25 border border-amber-400/50 flex items-center justify-center font-mono font-black text-xs text-[var(--accent-primary)] shadow-sm cursor-pointer hover:scale-105 transition-transform"
                title={user?.name || 'Account Settings'}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  user?.name?.slice(0, 2).toUpperCase() || 'OX'
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Exit Workspace Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Return to Main Dashboard?"
        maxWidth="md"
      >
        <div className="space-y-4 font-sans">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            You are currently working inside <strong className="text-[var(--text-primary)] font-bold">{currentTournament?.title || 'this tournament'}</strong>. Are you sure you want to return to the Main Dashboard?
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="md" onClick={() => setShowExitConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmExit}>
              Yes, Return to Dashboard
            </Button>
          </div>
        </div>
      </Modal>
      {/* Edit Tournament Modal */}
      {currentTournament && (
        <EditTournamentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          tournament={currentTournament}
          onSave={(tournamentId, updatedFields) => {
            updateTournament(tournamentId, updatedFields);
            showToast({
              type: 'success',
              title: 'Tournament Updated',
              message: 'Tournament details and branding have been saved.'
            });
          }}
        />
      )}

      {/* Premium Tournament Required Prompt Modal */}
      <Modal
        isOpen={showTournamentRequiredModal}
        onClose={() => setShowTournamentRequiredModal(false)}
        title="Tournament Required"
        maxWidth="md"
      >
        <div className="space-y-6 text-center py-2 font-sans">
          {/* Glowing Trophy Icon with Radiant Lock Badge */}
          <div className="relative mx-auto w-16 h-16 rounded-3xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,208,0,0.2)]">
            <Trophy className="h-8 w-8 text-[var(--accent-primary)] animate-pulse" />
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest">
              LOCKED
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-[var(--text-primary)] font-display tracking-tight">
              Select or Create a Tournament
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              To access <strong className="text-[var(--text-primary)]">Tournament Arena</strong>, <strong className="text-[var(--text-primary)]">Live OBS Overlays</strong>, and the <strong className="text-[var(--text-primary)]">Graphics Studio</strong>, please select an existing tournament or create a new arena.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-left">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">01. ARENA</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Point Tables</div>
              <p className="text-[10px] text-[var(--text-secondary)]">Automated calculations & rules</p>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">02. OBS</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Live Overlays</div>
              <p className="text-[10px] text-[var(--text-secondary)]">Direct streaming sources</p>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">03. STUDIO</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">4K Post-Match</div>
              <p className="text-[10px] text-[var(--text-secondary)]">Instagram & broadcast posters</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto justify-center font-bold"
              onClick={() => {
                setShowTournamentRequiredModal(false);
                if (onSelectDashboard) onSelectDashboard();
                triggerDashboardHighlight();
              }}
            >
              Select from Dashboard
            </Button>

            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto justify-center font-bold"
              onClick={() => {
                setShowTournamentRequiredModal(false);
                if (onSelectDashboard) onSelectDashboard();
                triggerDashboardHighlight();
              }}
              leftIcon={<Trophy className="h-4 w-4" />}
            >
              Create Tournament
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
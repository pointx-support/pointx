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
  Palette
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { AppState } from '../../store/tournamentStore';

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
    triggerDashboardHighlight
  } = useTournamentStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMainTreeOpen, setIsMainTreeOpen] = useState(true);
  const [hoveredFlyout, setHoveredFlyout] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isDark = theme === 'dark';
  const isCommandCenter = viewMode === 'command-center';
  const isExpanded = !isSidebarCollapsed;

  // Sub-items inside the Main Tournament Tree
  const tournamentSubItems = [
    { id: 'standings', label: 'Point Table', icon: Trophy },
    { id: 'matches', label: 'Calculate Points', icon: Swords },
    { id: 'teams', label: 'Teams & Slots', icon: Users2 },
    { id: 'players', label: 'Players Roster', icon: UserCheck },
    { id: 'global-teams', label: 'Squads DB', icon: Database },
    { id: 'statistics', label: 'Statistics & MVPs', icon: BarChart3 }
  ];

  // Primary Single Nav Items
  const primaryNavItems = [
    { id: 'broadcast', label: 'Live Overlays (OBS)', icon: Tv, isLive: true },
    { id: 'graphics', label: 'Graphics Studio', icon: Sparkles },
    { id: 'template-studio', label: 'Template Studio', icon: Palette }
  ];

  // Organization & Staff Delegation
  const orgNavItems = [
    { id: 'organization', label: 'My Organisation', icon: Building2 },
    { id: 'settings', label: 'Scoring Rules', icon: Sliders },
    { id: 'account', label: 'Staff & Account', icon: UserIcon }
  ];

  const handleNavClick = (tabId: string) => {
    setHoveredFlyout(null);

    if (tabId === 'admin-dashboard') {
      if (onSelectAdminDashboard) onSelectAdminDashboard();
      return;
    }

    if (tabId === 'account' || tabId === 'organization') {
      if (onSelectWorkspaceTab) onSelectWorkspaceTab(tabId as any);
      else setActiveTab(tabId as any);
      return;
    }

    if (isCommandCenter) {
      triggerDashboardHighlight();
      showToast({
        type: 'info',
        title: 'Tournament Required',
        message: `Create or open a tournament to view this section.`
      });
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
                <span className="font-display font-black text-sm tracking-wider uppercase truncate">
                  Point<span className="text-[var(--accent-primary)]">X</span> Arena
                </span>
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

            {/* Dashboard / Tournament Overview Parent Node */}
            <div
              className="relative"
              onMouseEnter={() => !isExpanded && setHoveredFlyout('main-tree')}
              onMouseLeave={() => !isExpanded && setHoveredFlyout(null)}
            >
              <button
                type="button"
                onClick={() => {
                  if (isExpanded) {
                    setIsMainTreeOpen(!isMainTreeOpen);
                    handleNavClick('overview');
                  } else {
                    handleNavClick('overview');
                  }
                }}
                className={cn(
                  'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                  isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                  (activeTab === 'overview' || isAnySubActive)
                    ? (isDark ? 'bg-white/12 text-white shadow-sm' : 'bg-black/8 text-black shadow-sm')
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
                )}
                title={!isExpanded ? 'Dashboard' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LayoutGrid className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    (activeTab === 'overview' || isAnySubActive) ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                  )} />
                  {isExpanded && <span className="truncate">Dashboard</span>}
                </div>

                {isExpanded && (
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200',
                      isMainTreeOpen ? 'rotate-0' : '-rotate-90'
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

              {/* Expanded Branch Tree Connectors */}
              {isExpanded && isMainTreeOpen && (
                <div className="relative ml-4 pl-4.5 border-l-2 border-white/15 dark:border-white/15 light:border-black/15 mt-1.5 space-y-1">
                  {filteredSubItems.map((sub) => {
                    const isActive = activeTab === sub.id;
                    const SubIcon = sub.icon;

                    return (
                      <div key={sub.id} className="relative flex items-center">
                        {/* Curved Connector Branch Stub */}
                        <div className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-3.5 h-[2px] bg-white/20 dark:bg-white/20 light:bg-black/20 rounded-full" />

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
                          <div className="flex items-center gap-2 truncate">
                            <SubIcon className={cn(
                              'h-3.5 w-3.5 transition-transform group-hover:scale-110',
                              isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                            )} />
                            <span className="truncate">{sub.label}</span>
                          </div>

                          {isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)] shrink-0" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other Primary Items (Broadcast & Graphics) */}
            {primaryNavItems.map((item) => {
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
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 dark:hover:bg-white/5'
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

                  {item.isLive && (
                    <span className={cn(
                      'flex h-2 w-2 rounded-full shrink-0',
                      isActive ? 'bg-[var(--accent-primary)]' : 'bg-emerald-400 animate-pulse'
                    )} />
                  )}
                </button>
              );
            })}
          </div>

          {/* SECTION 2: ORGANIZATION & STAFF (Matching 'MESSAGES' in Screenshot) */}
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

            {/* Super Admin Control Center Option */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavClick('admin-dashboard')}
                className={cn(
                  'w-full flex items-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer group',
                  isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center h-10 w-10 mx-auto p-0',
                  viewMode === 'admin-dashboard'
                    ? 'bg-amber-500/20 text-[var(--accent-primary)] border border-amber-500/30'
                    : 'text-[var(--text-secondary)] hover:text-amber-400 hover:bg-amber-500/10'
                )}
                title={!isExpanded ? 'Admin Control Center' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="h-4 w-4 text-[var(--accent-primary)] shrink-0 transition-transform group-hover:scale-110" />
                  {isExpanded && <span className="truncate text-[var(--accent-primary)] font-bold">Admin Center</span>}
                </div>
              </button>
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
    </>
  );
};

export default Sidebar;
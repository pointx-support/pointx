import { useState } from 'react';
import type { FC } from 'react';
import {
  Trophy,
  LayoutDashboard,
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
  PanelLeftClose,
  PanelLeftOpen,
  Shield
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { AppState } from '../../store/tournamentStore';

interface SidebarNavItem {
  id: 'overview' | 'teams' | 'matches' | 'standings' | 'statistics' | 'players' | 'global-teams' | 'broadcast' | 'graphics' | 'settings' | 'account' | 'organization' | 'template-studio' | 'admin-dashboard';
  label: string;
  icon: any;
  isLivePulse?: boolean;
}

interface SidebarNavGroup {
  groupName: string;
  items: SidebarNavItem[];
}

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
  const { user } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    currentTournament,
    triggerDashboardHighlight
  } = useTournamentStore();
  const { showToast } = useToast();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isHoveredInDashboard, setIsHoveredInDashboard] = useState(false);

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

  const navGroups: SidebarNavGroup[] = [
    {
      groupName: 'ACTIVE TOURNAMENT',
      items: [
        { id: 'overview', label: 'Tournament Overview', icon: LayoutDashboard },
        { id: 'teams', label: 'Teams & Slots', icon: Users2 },
        { id: 'matches', label: 'Calculate Points', icon: Swords },
        { id: 'standings', label: 'Point Table', icon: Trophy },
        { id: 'statistics', label: 'Statistics', icon: BarChart3 },
        { id: 'players', label: 'Players', icon: UserCheck },
        { id: 'global-teams', label: 'Squads DB', icon: Database }
      ]
    },
    {
      groupName: 'BROADCAST & MEDIA',
      items: [
        { id: 'broadcast', label: 'Live Broadcast (OBS)', icon: Tv, isLivePulse: true },
        { id: 'graphics', label: 'Graphics Studio', icon: Sparkles }
      ]
    },
    {
      groupName: 'ORGANISATION & SETTINGS',
      items: [
        { id: 'organization', label: 'My Organisation', icon: Building2 },
        { id: 'settings', label: 'Scoring Rules', icon: Sliders },
        { id: 'account', label: 'My Account', icon: UserIcon }
      ]
    },
    ...(user?.role === 'admin'
      ? [
          {
            groupName: 'ADMINISTRATION',
            items: [
              {
                id: 'admin-dashboard' as const,
                label: 'Admin Control Center',
                icon: Shield
              }
            ]
          }
        ]
      : [])
  ];

  const handleNavClick = (item: SidebarNavItem) => {
    // Admin Dashboard navigation
    if (item.id === 'admin-dashboard') {
      if (onSelectAdminDashboard) {
        onSelectAdminDashboard();
      }
      return;
    }

    // Global views accessible anytime from dashboard
    if (item.id === 'account' || item.id === 'organization') {
      if (onSelectWorkspaceTab) {
        onSelectWorkspaceTab(item.id);
      } else {
        setActiveTab(item.id);
      }
      return;
    }

    // If user is on the main dashboard (Command Center), trigger attention animation on Create/Open tournament buttons
    if (viewMode === 'command-center') {
      triggerDashboardHighlight();
      showToast({
        type: 'info',
        title: 'Tournament Required',
        message: `Please create a tournament or click "Continue/Open" below to access ${item.label}.`
      });
      return;
    }

    if (onSelectWorkspaceTab) {
      onSelectWorkspaceTab(item.id);
    } else {
      setActiveTab(item.id);
    }
  };

  const isCommandCenter = viewMode === 'command-center';
  const isExpanded = isCommandCenter ? isHoveredInDashboard : !isSidebarCollapsed;

  return (
    <>
      <aside
        onMouseEnter={() => {
          if (isCommandCenter) setIsHoveredInDashboard(true);
        }}
        onMouseLeave={() => {
          if (isCommandCenter) setIsHoveredInDashboard(false);
        }}
        className={`hidden md:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-3 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar select-none font-sans transition-all duration-300 ease-out z-30 ${
          isCommandCenter
            ? isHoveredInDashboard
              ? 'w-64 shadow-[0_16px_36px_rgba(0,0,0,0.6)] border-r-[var(--border-medium)]'
              : 'w-16'
            : isSidebarCollapsed
            ? 'w-16'
            : 'w-64'
        }`}
      >
        {/* Top Header / Collapse Control */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] mb-2.5">
          {isExpanded ? (
            <>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                {isCommandCenter ? 'Quick Navigation' : 'Tournament Menu'}
              </span>
              {!isCommandCenter && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                  title="Hide Sidebar"
                  aria-label="Hide Sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-center py-1">
              {!isCommandCenter ? (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                  title="Expand Sidebar"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4 text-[var(--accent-primary)]" />
                </button>
              ) : (
                <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" title="Hover to expand navigation" />
              )}
            </div>
          )}
        </div>

        {/* Primary Main Dashboard Option */}
        <div className="space-y-1 pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleDashboardClick}
            className={`glass-nav-item w-full flex items-center ${
              isExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'
            } rounded-xl text-sm font-bold cursor-pointer select-none transition-all ${
              viewMode === 'command-center'
                ? 'active bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-md shadow-amber-500/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title="Main Dashboard"
          >
            <div className="flex items-center gap-3 min-w-0">
              <LayoutGrid
                className={`h-5 w-5 shrink-0 ${
                  viewMode === 'command-center'
                    ? 'text-[var(--accent-primary-text)]'
                    : 'text-[var(--accent-primary)]'
                }`}
              />
              {isExpanded && <span className="truncate font-display">Main Dashboard</span>}
            </div>
            {isExpanded && viewMode === 'command-center' && (
              <span className="h-1.5 w-1.5 rounded-full bg-black/60 shrink-0" />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {isExpanded && (
                <div className="px-3 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono truncate">
                  {group.groupName}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.id === 'admin-dashboard'
                      ? viewMode === 'admin-dashboard'
                      : viewMode === 'workspace' && activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`glass-nav-item relative w-full flex items-center ${
                        isExpanded ? 'justify-between px-3 py-2' : 'justify-center p-2.5'
                      } rounded-xl text-xs sm:text-sm font-bold cursor-pointer select-none transition-all group ${
                        active
                          ? 'active bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-md shadow-amber-500/20'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            active
                              ? 'text-[var(--accent-primary-text)]'
                              : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]'
                          }`}
                        />
                        {isExpanded && <span className="truncate">{item.label}</span>}
                      </div>

                      {isExpanded && item.id === 'teams' && viewMode === 'workspace' && currentTournament && currentTournament.teams.length < 6 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--status-warning)] text-black animate-pulse shrink-0">
                          Add 6+
                        </span>
                      )}

                      {item.isLivePulse && (
                        <span
                          className={`flex h-2 w-2 shrink-0 rounded-full ${
                            active
                              ? 'bg-[var(--accent-primary-text)]'
                              : 'bg-[var(--status-live)] animate-pulse'
                          } ${!isExpanded ? 'absolute top-1.5 right-1.5' : ''}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Selected Tournament Context Footer */}
        {isExpanded && viewMode === 'workspace' && currentTournament && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
            <div className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-0.5">Selected Event</div>
            <div className="font-bold text-[var(--text-primary)] truncate font-sans text-xs">{currentTournament.title}</div>
          </div>
        )}
      </aside>

      {/* Exit Confirmation Modal */}
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
          <p className="text-xs text-[var(--text-muted)] font-mono">
            All your match calculations and rosters remain saved.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowExitConfirm(false)}
            >
              No, Stay Here
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmExit}
            >
              Yes, Return to Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
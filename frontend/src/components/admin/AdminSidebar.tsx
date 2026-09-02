import React from 'react';
import { useAdminStore } from '../../store/adminStore';
import { PointXLogo } from '../ui/PointXLogo';
import {
  LayoutDashboard,
  Users,
  Palette,
  FileText,
  TrendingUp,
  Settings,
  Shield,
  ArrowLeft,
  Activity,
  X
} from 'lucide-react';
import type { AdminTab } from '../../types/admin';

export interface AdminSidebarProps {
  onExitAdmin: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onExitAdmin,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { activeAdminTab, setActiveAdminTab, getAdminUsers, platformSettings } = useAdminStore();

  const users = getAdminUsers();
  const activeAnnouncements = platformSettings.systemAnnouncements.filter((a) => a.isActive).length;

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; badgeVariant?: 'rosewood' | 'gold' }[] = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users, badge: users.length },
    { id: 'templates', label: 'Template Governance', icon: Palette },
    { id: 'audit-logs', label: 'Audit & Security Logs', icon: FileText },
    { id: 'analytics', label: 'SaaS Analytics', icon: TrendingUp },
    {
      id: 'settings',
      label: 'Platform Controls',
      icon: Settings,
      badge: platformSettings.maintenanceMode ? 'ALERT' : activeAnnouncements > 0 ? activeAnnouncements : undefined,
      badgeVariant: platformSettings.maintenanceMode ? 'rosewood' : 'gold'
    }
  ];

  const handleTabClick = (tabId: AdminTab) => {
    setActiveAdminTab(tabId);
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 font-sans">
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-5">
        {/* Admin Brand Card */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2 shadow-[var(--shadow-inset)]">
          <div className="flex items-center justify-between">
            <PointXLogo className="h-7 w-auto object-contain select-none" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#7D4047]/15 text-[#7D4047] dark:text-[#E8C4C8] border border-[#7D4047]/30 uppercase tracking-widest flex items-center gap-1">
                <Shield className="h-3 w-3" /> Root
              </span>
              {/* Mobile Close Button */}
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="md:hidden p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]"
                  title="Close Navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SaaS Control Center
            </span>
            <span className="font-bold text-[var(--text-primary)]">v2.4</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] px-3 py-1">
            Platform Management
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7D4047] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeVariant === 'rosewood'
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Return to User Workspace Button */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        {platformSettings.maintenanceMode && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-mono font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
            <span className="truncate">Maintenance Active</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            onExitAdmin();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Studio</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 md:w-72 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex-col justify-between shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Sliding Drawer */}
          <div className="relative w-4/5 max-w-xs bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

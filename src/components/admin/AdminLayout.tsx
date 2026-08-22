import React, { useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminTemplatesView } from './views/AdminTemplatesView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import {
  LayoutDashboard,
  Users,
  Palette,
  FileText,
  TrendingUp,
  Settings
} from 'lucide-react';
import type { AdminTab } from '../../types/admin';

export interface AdminLayoutProps {
  onExitAdmin: () => void;
  onOpenTemplateStudio: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onExitAdmin,
  onOpenTemplateStudio
}) => {
  const { activeAdminTab, setActiveAdminTab } = useAdminStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const MOBILE_TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'audit-logs', label: 'Logs', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderActiveView = () => {
    switch (activeAdminTab) {
      case 'overview':
        return <AdminOverviewView />;
      case 'users':
        return <AdminUsersView />;
      case 'templates':
        return <AdminTemplatesView onOpenTemplateStudio={onOpenTemplateStudio} />;
      case 'audit-logs':
        return <AdminAuditLogsView />;
      case 'analytics':
        return <AdminAnalyticsView />;
      case 'settings':
        return <AdminSettingsView />;
      default:
        return <AdminOverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex overflow-x-hidden font-sans">
      {/* 1. Admin Sidebar (Desktop fixed + Mobile sliding drawer) */}
      <AdminSidebar
        onExitAdmin={onExitAdmin}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Executive Content Column */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminTopbar
          onExitAdmin={onExitAdmin}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* 3. Mobile Fast Tab Bar (Horizontal Scrollable Strip on Phones) */}
        <div className="md:hidden flex items-center gap-1.5 p-2 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] overflow-x-auto no-scrollbar scroll-smooth">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAdminTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7D4047] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Responsive Viewport */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

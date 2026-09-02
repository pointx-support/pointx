import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Database,
  Cloud,
  Mail,
  Cpu,
  FileText,
  Settings,
  LogOut,
  Search,
  CheckCircle2,
  Ban,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Eye,
  Palette,
  ArrowLeft,
  User,
} from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/api';
import type { AdminTab, AdminUserRecord } from '../../types/admin';
import { OrganizerDrawer } from './OrganizerDrawer';
import { BrevoConfigPanel } from './BrevoConfigPanel';
import { MongoDbMonitorPanel } from './MongoDbMonitorPanel';
import { CloudinaryMonitorPanel } from './CloudinaryMonitorPanel';
import { SystemHealthPanel } from './SystemHealthPanel';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminTemplatesView } from './views/AdminTemplatesView';
import { cn } from '../../lib/utils';

export interface SuperAdminDashboardProps {
  onExitAdmin?: () => void;
  onOpenTemplateStudio?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onExitAdmin,
  onOpenTemplateStudio,
}) => {
  const { user, theme, toggleTheme, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Overview metrics state
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // Organizers state (Server-side paginated)
  const [organizers, setOrganizers] = useState<AdminUserRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Organizer Drawer
  const [selectedOrganizer, setSelectedOrganizer] = useState<AdminUserRecord | null>(null);

  // Toast / Feedback message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Overview Stats
  const fetchOverview = async () => {
    setIsOverviewLoading(true);
    try {
      const res = await adminApi.getOverview();
      if (res.success && res.data) {
        setOverviewData(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setIsOverviewLoading(false);
    }
  };

  // Fetch Organizers Data Table (Server-side Pagination)
  const fetchOrganizers = async (page = pagination.page, filter = statusFilter, search = searchQuery) => {
    try {
      const res = await adminApi.getOrganizers({
        page,
        limit: pagination.limit,
        status: filter,
        search,
      });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setOrganizers(list);
        if ((res as any).pagination) {
          setPagination((res as any).pagination);
        } else if ((res.data as any).pagination) {
          setPagination((res.data as any).pagination);
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch organizers.');
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchOrganizers(1, statusFilter, searchQuery);
  }, []);

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchOrganizers(1, newStatus, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrganizers(1, statusFilter, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrganizers(newPage, statusFilter, searchQuery);
    }
  };

  // Lifecycle Action Handlers
  const handleApprove = async (id: string) => {
    try {
      const res = await adminApi.approveOrganizer(id);
      if (res.success) {
        showToast('success', res.message || 'Organizer approved successfully.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, status: 'active' });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve organizer.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await adminApi.rejectOrganizer(id, reason);
      if (res.success) {
        showToast('success', res.message || 'Organizer registration rejected.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, status: 'rejected', suspensionReason: reason });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject organizer.');
    }
  };

  const handleSuspend = async (id: string, reason: string) => {
    try {
      const res = await adminApi.suspendUser(id, reason);
      if (res.success) {
        showToast('success', res.message || 'Organizer suspended.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, status: 'suspended', suspensionReason: reason });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to suspend organizer.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await adminApi.restoreUser(id);
      if (res.success) {
        showToast('success', res.message || 'Organizer account restored.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, status: 'active', suspensionReason: undefined });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to restore organizer.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminApi.deleteUser(id);
      if (res.success) {
        showToast('success', 'Organizer deleted permanently.');
        fetchOrganizers();
        fetchOverview();
        setSelectedOrganizer(null);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete organizer.');
    }
  };

  const handlePromoteToAdmin = async (id: string) => {
    try {
      const res = await adminApi.updateOrganizer(id, { role: 'admin' });
      if (res.success) {
        showToast('success', 'User promoted to Admin / Super Admin.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, role: 'admin' });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to promote user to admin.');
    }
  };

  const handleDemoteToOrganizer = async (id: string) => {
    try {
      const res = await adminApi.updateOrganizer(id, { role: 'organizer' });
      if (res.success) {
        showToast('success', 'User role changed to Organizer.');
        fetchOrganizers();
        fetchOverview();
        if (selectedOrganizer && (selectedOrganizer.id === id || (selectedOrganizer as any)._id === id)) {
          setSelectedOrganizer({ ...selectedOrganizer, role: 'organizer' });
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to change user role.');
    }
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/super-admin/login';
    }
  };

  const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizers', label: 'Organizers', icon: Users },
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'requests', label: 'Verification Queue', icon: Clock },
    { id: 'mongodb', label: 'MongoDB Atlas', icon: Database },
    { id: 'cloudinary', label: 'Cloudinary CDN', icon: Cloud },
    { id: 'brevo', label: 'Brevo Email', icon: Mail },
    { id: 'health', label: 'System Health', icon: Cpu },
    { id: 'audit-logs', label: 'Activity', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Organizer breakdown numbers
  const totalOrgs = overviewData?.organizers?.total || organizers.length || 0;
  const approvedOrgs = overviewData?.organizers?.approved || 0;
  const pendingOrgs = overviewData?.organizers?.pending || 0;

  // Percentage calculations for the reference-inspired segmented progress bar
  const approvedPct = totalOrgs > 0 ? Math.round((approvedOrgs / totalOrgs) * 100) : 70;
  const pendingPct = totalOrgs > 0 ? Math.round((pendingOrgs / totalOrgs) * 100) : 20;
  const restrictedPct = totalOrgs > 0 ? Math.max(5, 100 - approvedPct - pendingPct) : 10;

  return (
    <div className="min-h-screen bg-[#F6F5F0] dark:bg-[#080A10] text-neutral-900 dark:text-neutral-100 p-3 sm:p-6 lg:p-8 font-sans selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={cn(
            'fixed top-6 right-6 z-60 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300',
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/40'
              : 'bg-rose-950 text-rose-100 border-rose-500/40'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Dashboard Canvas Frame (Large Rounded Shell Inspired by Reference) */}
      <div className="max-w-[1440px] mx-auto rounded-[2rem] sm:rounded-[2.75rem] bg-[#FFFFFF] dark:bg-[#10131B] border border-black/[0.06] dark:border-white/[0.08] shadow-2xl shadow-black/5 p-5 sm:p-8 lg:p-10 space-y-8 transition-colors duration-300">
        
        {/* 1. Top Navigation Bar (Reference-Inspired Pill Design) */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-2">
          
          {/* Left Brand Container */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50/90 dark:bg-neutral-900/90 shadow-xs">
              <PointXLogo className="h-6 w-auto max-w-[95px] object-contain select-none" />
              <div className="flex items-center gap-1.5 border-l border-black/10 dark:border-white/10 pl-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                  Super Admin
                </span>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center Navigation Tabs Strip (Pill Segmented Menu) */}
          <nav className="flex items-center gap-1 p-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-900/90 border border-black/[0.05] dark:border-white/[0.07] overflow-x-auto no-scrollbar max-w-full shadow-inner">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'organizers' || item.id === 'requests') {
                      const filter = item.id === 'requests' ? 'pending' : statusFilter;
                      fetchOrganizers(1, filter);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none',
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md font-black'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                  )}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Utility Buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchOverview}
              className="p-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer shadow-xs"
              title="Refresh Telemetry"
            >
              <RefreshCw className={cn('h-4 w-4', isOverviewLoading ? 'animate-spin' : '')} />
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer shadow-xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700" />}
            </button>

            {/* Admin Profile Circle */}
            <div className="flex items-center gap-2 pl-1">
              <div className="h-9 w-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-display font-black text-xs flex items-center justify-center shadow-md">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
            </div>

            {/* Exit to Workspace Button */}
            {onExitAdmin && (
              <button
                type="button"
                onClick={onExitAdmin}
                className="px-4 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:opacity-90"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Workspace</span>
              </button>
            )}

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </header>

        {/* 2. TAB: MAIN DASHBOARD OVERVIEW (Inspired by the Reference Layout) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Hero Welcome & Top Telemetry Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
              
              {/* Left Welcome Title & Segmented Distribution Bar */}
              <div className="space-y-4 max-w-xl">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-neutral-900 dark:text-white">
                    Welcome in, {user?.name?.split(' ')[0] || 'Administrator'}
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                    PointX Tournament Governance & Infrastructure Command Center
                  </p>
                </div>

                {/* Reference-Style Segmented Status Bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                      <span>Approved ({approvedPct}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span>Pending ({pendingPct}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                      <span>Restricted ({restrictedPct}%)</span>
                    </span>
                  </div>

                  {/* Multi-segment Pill Bar */}
                  <div className="h-5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 p-1 flex items-center gap-1 overflow-hidden border border-black/[0.04] dark:border-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white dark:text-neutral-900"
                      style={{ width: `${approvedPct}%` }}
                    >
                      {approvedPct > 15 && `${approvedPct}%`}
                    </div>
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-black"
                      style={{ width: `${pendingPct}%` }}
                    >
                      {pendingPct > 10 && `${pendingPct}%`}
                    </div>
                    <div
                      className="h-full rounded-full bg-neutral-300 dark:bg-neutral-700 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-neutral-700 dark:text-neutral-300"
                      style={{ width: `${restrictedPct}%` }}
                    >
                      {restrictedPct > 10 && `${restrictedPct}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Big Numeric Telemetry Counters (Reference Style) */}
              <div className="flex items-center gap-6 sm:gap-10 self-start lg:self-auto pt-2 lg:pt-0">
                
                {/* Metric 1: Total Organizers */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black font-display tracking-tight text-neutral-900 dark:text-white">
                      {totalOrgs}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider -mt-1">
                      Organizers
                    </div>
                  </div>
                </div>

                {/* Metric 2: Pending Reviews */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black font-display tracking-tight text-amber-500">
                      {pendingOrgs}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider -mt-1">
                      Pending
                    </div>
                  </div>
                </div>

                {/* Metric 3: Active Tournaments */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black font-display tracking-tight text-neutral-900 dark:text-white">
                      {overviewData?.tournaments?.total || 14}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider -mt-1">
                      Tournaments
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* 3. Reference-Inspired Modular Floating Cards Grid (4 Top Pillars) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Admin Identity Spotlight Card */}
              <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                      Root Session
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-700 dark:to-neutral-900 text-white font-display font-black text-xl flex items-center justify-center shadow-md">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                        {user?.name || 'Super Administrator'}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                        {user?.email || 'admin@pointx.gg'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>2FA Protected</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    Full Root
                  </span>
                </div>
              </div>

              {/* Card 2: Organizer Verification Progress & Vertical Bar Chart */}
              <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-sans">
                      Organizer Intake
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('requests');
                        fetchOrganizers(1, 'pending');
                      }}
                      className="p-1.5 rounded-full bg-white dark:bg-neutral-800 border border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                      title="View Verification Queue"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black font-display text-neutral-900 dark:text-white">
                      {pendingOrgs}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      Requests Awaiting
                    </span>
                  </div>

                  {/* Vertical Pill Bar Chart (Inspired by Reference) */}
                  <div className="flex items-end justify-between gap-2 h-18 pt-2">
                    {[
                      { day: 'S', h: '35%', active: false },
                      { day: 'M', h: '65%', active: false },
                      { day: 'T', h: '45%', active: false },
                      { day: 'W', h: '85%', active: false },
                      { day: 'T', h: '70%', active: false },
                      { day: 'F', h: '100%', active: true, tag: `${pendingOrgs} new` },
                      { day: 'S', h: '40%', active: false },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full max-w-[10px] rounded-full bg-neutral-200 dark:bg-neutral-800 relative flex items-end justify-center overflow-hidden h-full">
                          <div
                            className={cn(
                              'w-full rounded-full transition-all duration-500',
                              bar.active ? 'bg-amber-400' : 'bg-neutral-900 dark:bg-neutral-400'
                            )}
                            style={{ height: bar.h }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <span>Weekly Velocity</span>
                  <span className="font-bold text-amber-500">+14% Growth</span>
                </div>
              </div>

              {/* Card 3: Platform Telemetry Circular Gauge Card */}
              <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-sans">
                      Core Telemetry
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('health')}
                      className="p-1.5 rounded-full bg-white dark:bg-neutral-800 border border-black/[0.06] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                      title="View System Health"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Circular Dial / Gauge Visualization (Inspired by Reference) */}
                  <div className="flex items-center justify-center my-3 relative">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-neutral-200 dark:text-neutral-800"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-400"
                        strokeDasharray="92, 100"
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black font-display text-neutral-900 dark:text-white">
                        99.9%
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">
                        Uptime
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <span>API Latency</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">18ms Average</span>
                </div>
              </div>

              {/* Card 4: High-Contrast Dark Accent Card (Verification Quick Action List) */}
              <div className="rounded-3xl bg-neutral-900 text-white dark:bg-neutral-950 border border-neutral-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-display">
                      Urgent Queue
                    </span>
                    <span className="text-lg font-black font-display text-amber-400">
                      {pendingOrgs > 0 ? `${pendingOrgs} Pending` : 'All Clear'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                    New organizer accounts require administrative verification before organizing championship tournaments.
                  </p>

                  {/* Checklist Items */}
                  <div className="space-y-2 text-xs font-mono">
                    {organizers.filter(o => o.status === 'pending' || o.status === 'pending_verification').slice(0, 2).map((item) => (
                      <div
                        key={item.id || (item as any)._id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="truncate min-w-0">
                          <div className="font-bold text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-neutral-400 truncate">{item.organizationName || item.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id || (item as any)._id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-black text-[11px] hover:brightness-110 transition-all shrink-0 cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    ))}

                    {organizers.filter(o => o.status === 'pending' || o.status === 'pending_verification').length === 0 && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-neutral-400 text-xs font-mono">
                        No pending approvals in queue
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('requests');
                      fetchOrganizers(1, 'pending');
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-display cursor-pointer"
                  >
                    <span>View All Applications</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* 4. Integrated Service Infrastructure Telemetry Strip */}
            <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black font-display text-neutral-900 dark:text-white uppercase tracking-tight">
                    Service Infrastructure Telemetry
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                    Live operational telemetry across database, asset delivery, email dispatch, and compute nodes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('health')}
                    className="px-4 py-2 rounded-full bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Full Health Diagnostics
                  </button>
                </div>
              </div>

              {/* 4 Infrastructure Service Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* MongoDB Atlas */}
                <div
                  onClick={() => setActiveTab('mongodb')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#10131B] border border-black/[0.06] dark:border-white/[0.06] hover:border-emerald-500/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Database className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Connected
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">MongoDB Atlas</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">Cluster Primary</p>
                </div>

                {/* Cloudinary CDN */}
                <div
                  onClick={() => setActiveTab('cloudinary')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#10131B] border border-black/[0.06] dark:border-white/[0.06] hover:border-sky-500/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Cloud className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      Active CDN
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Cloudinary Storage</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">Logo & Poster Assets</p>
                </div>

                {/* Brevo Email Engine */}
                <div
                  onClick={() => setActiveTab('brevo')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#10131B] border border-black/[0.06] dark:border-white/[0.06] hover:border-amber-500/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Operational
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Brevo SMTP Engine</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">OTP & Notifications</p>
                </div>

                {/* PointX Backend */}
                <div
                  onClick={() => setActiveTab('health')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#10131B] border border-black/[0.06] dark:border-white/[0.06] hover:border-purple-500/40 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      Node.js v20+
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Compute Core</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">Sub-second Math Engine</p>
                </div>

              </div>
            </div>

            {/* 5. Organizer Overview & Quick Review Table */}
            <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black font-display text-neutral-900 dark:text-white uppercase tracking-tight">
                    Registered Tournament Organizers
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                    Direct access to approve, inspect, suspend, or manage organizer workspace accounts
                  </p>
                </div>

                {/* Search & Status Filter Strip */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search organizer..."
                      className="w-full bg-white dark:bg-[#10131B] border border-black/[0.08] dark:border-white/[0.08] rounded-full py-2 pl-9 pr-4 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-[var(--accent-primary)] shadow-xs"
                    />
                  </form>

                  <div className="flex items-center gap-1 bg-white dark:bg-[#10131B] p-1 rounded-full border border-black/[0.08] dark:border-white/[0.08]">
                    {['all', 'approved', 'pending', 'suspended'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleFilterChange(st)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer',
                          statusFilter === st
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#10131B]">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <th className="py-3 px-4">Organizer</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs font-sans">
                    {organizers.slice(0, 6).map((org) => {
                      const id = org.id || (org as any)._id;
                      const isPending = org.status === 'pending' || org.status === 'pending_verification';
                      const isActive = org.status === 'active';
                      const isSuspended = org.status === 'suspended';

                      return (
                        <tr key={id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                                {org.name ? org.name.slice(0, 2).toUpperCase() : 'OR'}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white">{org.name}</div>
                                <div className="text-[11px] text-neutral-400 font-mono">{org.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                            {org.organizationName || 'Individual Club'}
                          </td>

                          <td className="py-3.5 px-4">
                            {isActive && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-bold">
                                <Clock className="h-3.5 w-3.5" /> Pending Review
                              </span>
                            )}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-bold">
                                <Ban className="h-3.5 w-3.5" /> Suspended
                              </span>
                            )}
                            {!isActive && !isPending && !isSuspended && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-500/10 text-neutral-500 text-[11px] font-mono font-bold">
                                {org.status}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-neutral-500 text-xs">
                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Recent'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {org.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDemoteToOrganizer(id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="Demote to standard organizer"
                                >
                                  Demote
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToAdmin(id)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Promote to Admin / Super Admin"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Make Admin</span>
                                </button>
                              )}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedOrganizer(org)}
                                className="p-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                title="Inspect Organizer Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* View All Organizers CTA Strip */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-neutral-400">
                  Showing {organizers.length} registered organizers
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('organizers')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] hover:brightness-110 font-display uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Open Full Organizer Workspace</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 3. TAB: ORGANIZERS FULL WORKSPACE */}
        {(activeTab === 'organizers' || activeTab === 'requests') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 className="text-2xl font-black font-display text-neutral-900 dark:text-white uppercase tracking-tight">
                  {activeTab === 'requests' ? 'Pending Organizer Verification Queue' : 'Organizer Ecosystem Directory'}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                  Full control room to review identity, verify organizations, and manage workspace permissions
                </p>
              </div>

              {/* Search & Filter Strip */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, org..."
                    className="w-full bg-white dark:bg-[#10131B] border border-black/[0.08] dark:border-white/[0.08] rounded-full py-2.5 pl-9 pr-4 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-[var(--accent-primary)] shadow-xs"
                  />
                </form>

                <div className="flex items-center gap-1 bg-white dark:bg-[#10131B] p-1 rounded-full border border-black/[0.08] dark:border-white/[0.08]">
                  {['all', 'approved', 'pending', 'suspended', 'rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleFilterChange(st)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer',
                        statusFilter === st
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Organizers Table */}
            <div className="rounded-3xl bg-neutral-50/90 dark:bg-[#151923] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-sm">
              <div className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#10131B]">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06] text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30">
                      <th className="py-3.5 px-4">Organizer Account</th>
                      <th className="py-3.5 px-4">Organization</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs font-sans">
                    {organizers.map((org) => {
                      const id = org.id || (org as any)._id;
                      const isPending = org.status === 'pending' || org.status === 'pending_verification';
                      const isActive = org.status === 'active';
                      const isSuspended = org.status === 'suspended';

                      return (
                        <tr key={id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-neutral-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                                {org.name ? org.name.slice(0, 2).toUpperCase() : 'OR'}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white">{org.name}</div>
                                <div className="text-[11px] text-neutral-400 font-mono">{org.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                            {org.organizationName || 'Independent Organizer'}
                          </td>

                          <td className="py-4 px-4">
                            {isActive && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">
                                <Clock className="h-3.5 w-3.5" /> Pending Review
                              </span>
                            )}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold">
                                <Ban className="h-3.5 w-3.5" /> Suspended
                              </span>
                            )}
                            {!isActive && !isPending && !isSuspended && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-500 text-xs font-mono font-bold">
                                {org.status}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-mono text-neutral-500 text-xs">
                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Recent'}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {org.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDemoteToOrganizer(id)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                  title="Demote to standard organizer"
                                >
                                  <User className="h-3.5 w-3.5" />
                                  <span>Demote</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToAdmin(id)}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Promote account to Admin / Super Admin"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span>Promote to Admin</span>
                                </button>
                              )}

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(id, 'Requirements not fulfilled.')}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleSuspend(id, 'Administrative suspension.')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}

                              {isSuspended && (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Restore
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedOrganizer(org)}
                                className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                title="Inspect Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                <span className="text-xs font-mono text-neutral-400">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#10131B] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#10131B] text-neutral-700 dark:text-neutral-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4. SUB-PANELS: TEMPLATES, MONGODB, CLOUDINARY, BREVO, HEALTH, AUDIT LOGS, SETTINGS */}
        {activeTab === 'templates' && (
          <AdminTemplatesView
            onOpenTemplateStudio={() => {
              if (onOpenTemplateStudio) {
                onOpenTemplateStudio();
              }
            }}
          />
        )}
        {activeTab === 'mongodb' && <MongoDbMonitorPanel />}
        {activeTab === 'cloudinary' && <CloudinaryMonitorPanel />}
        {activeTab === 'brevo' && <BrevoConfigPanel />}
        {activeTab === 'health' && <SystemHealthPanel />}
        {activeTab === 'audit-logs' && <AdminAuditLogsView />}
        {activeTab === 'settings' && <AdminSettingsView />}

      </div>

      {/* Selected Organizer Drawer Slide-Over */}
      {selectedOrganizer && (
        <OrganizerDrawer
          organizer={selectedOrganizer}
          onClose={() => setSelectedOrganizer(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSuspend={handleSuspend}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onPromote={handlePromoteToAdmin}
          onDemote={handleDemoteToOrganizer}
          onEdit={(updated) => {
            setSelectedOrganizer(updated);
            fetchOrganizers();
          }}
        />
      )}

    </div>
  );
};

export default SuperAdminDashboard;

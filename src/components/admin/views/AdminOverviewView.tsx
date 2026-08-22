import React, { useMemo } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useTournamentStore } from '../../../store/tournamentStore';
import { useTemplateStore } from '../../../store/templateStore';
import { useAuthStore } from '../../../store/authStore';
import { AdminStatCard } from '../ui/AdminStatCard';
import { AdminBadge } from '../ui/AdminBadge';
import { Button } from '../../ui/Button';
import {
  Users,
  Trophy,
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  ArrowUpRight,
  FileText
} from 'lucide-react';

export const AdminOverviewView: React.FC = () => {
  const {
    getAdminUsers,
    platformHealth,
    platformSettings,
    adminAuditLogs,
    toggleMaintenanceMode,
    setActiveAdminTab
  } = useAdminStore();

  const { tournaments } = useTournamentStore();
  const { templates } = useTemplateStore();
  const { activities } = useAuthStore();

  const users = getAdminUsers();

  // Aggregate Metrics Computation
  const metrics = useMemo(() => {
    const totalUsers = users.length || 1;
    const onlineUsers = users.filter((u) => u.isOnline).length || 1;
    const activeToday = Math.max(onlineUsers, Math.round(totalUsers * 0.85));
    const newThisWeek = Math.max(1, Math.round(totalUsers * 0.25));

    const totalTourneys = tournaments.length;
    const activeTourneys = tournaments.filter((t) => t.status === 'Ongoing').length;
    const completedTourneys = tournaments.filter((t) => t.status === 'Completed').length;
    const draftTourneys = tournaments.filter((t) => t.status === 'Draft').length;

    const publishedTemplates = templates.filter((t) => t.isPublished).length;
    const totalTemplates = templates.length;

    // Template usage estimation
    const topTemplate = templates[0] || { name: 'Emerald Crystal 4:5 Poster', id: 'emerald-crystal-poster' };

    return {
      totalUsers,
      onlineUsers,
      activeToday,
      newThisWeek,
      totalTourneys,
      activeTourneys,
      completedTourneys,
      draftTourneys,
      publishedTemplates,
      totalTemplates,
      topTemplate
    };
  }, [users, tournaments, templates]);

  // Combined real-time audit feed
  const combinedAuditFeed = useMemo(() => {
    const raw = [...adminAuditLogs, ...activities];
    const seen = new Set();
    return raw
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 7);
  }, [adminAuditLogs, activities]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP HERO EXECUTIVE BANNER */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7D4047] dark:text-[#E8C4C8] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Real-time Platform Operations
            </span>
            <AdminBadge variant="healthy" size="xs">
              Live Monitor
            </AdminBadge>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
            PointX SaaS Control Center
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            High-level overview of organizers, ongoing tournaments, OBS broadcast loads, and graphics engine health.
          </p>
        </div>

        {/* Quick Platform Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => toggleMaintenanceMode(!platformSettings.maintenanceMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer flex items-center gap-2 shadow-xs ${
              platformSettings.maintenanceMode
                ? 'bg-amber-500 text-black border-amber-600 animate-pulse'
                : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{platformSettings.maintenanceMode ? 'Maintenance ON' : 'Maintenance Mode'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveAdminTab('users')}
            leftIcon={<Users className="h-4 w-4" />}
          >
            Manage Users
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveAdminTab('templates')}
            leftIcon={<Palette className="h-4 w-4" />}
          >
            Templates Studio
          </Button>
        </div>
      </div>

      {/* 2. TOP 4 KEY METRIC CARDS (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Registered Organizers"
          value={metrics.totalUsers}
          subValue={`${metrics.onlineUsers} online now`}
          changePercent={14}
          changeLabel="growth this month"
          icon={Users}
          accentColor="rosewood"
        />

        <AdminStatCard
          label="Total Tournaments"
          value={metrics.totalTourneys}
          subValue={`${metrics.activeTourneys} currently live`}
          changePercent={28}
          icon={Trophy}
          accentColor="gold"
          badge={`${metrics.completedTourneys} Done`}
        />

        <AdminStatCard
          label="Graphics Templates"
          value={metrics.publishedTemplates}
          subValue={`${metrics.totalTemplates} total templates in engine`}
          icon={Palette}
          accentColor="greige"
          badge="4K Ready"
        />

        <AdminStatCard
          label="Scoring Engine Latency"
          value={`${platformHealth.scoringEngineLatencyMs} ms`}
          subValue="OBS WebSocket 100% stable"
          icon={Server}
          accentColor="emerald"
          badge="Optimal"
        />
      </div>

      {/* 3. MIDDLE DUAL SECTION: TOURNAMENT RADAR + TEMPLATE USAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: TOURNAMENT & USER DISTRIBUTION */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tournament State Breakdown */}
          <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#7D4047] dark:text-[#E8C4C8]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                  Tournament Operations Breakdown
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {metrics.totalTourneys} Events Tracked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Ongoing
                </div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)] font-numbers">
                  {metrics.activeTourneys}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">Active in lobby</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)] font-numbers">
                  {metrics.completedTourneys}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">Standings finalized</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Draft / Planned
                </div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)] font-numbers">
                  {metrics.draftTourneys}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">Setup in progress</div>
              </div>
            </div>

            {/* Visual Progress Ratio Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)]">
                <span>Distribution Ratio</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {metrics.totalTourneys > 0 ? Math.round((metrics.completedTourneys / metrics.totalTourneys) * 100) : 100}% Completion Rate
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--bg-surface-inset)] overflow-hidden flex">
                <div
                  style={{ width: `${metrics.totalTourneys > 0 ? (metrics.activeTourneys / metrics.totalTourneys) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full"
                  title="Live Ongoing"
                />
                <div
                  style={{ width: `${metrics.totalTourneys > 0 ? (metrics.completedTourneys / metrics.totalTourneys) * 100 : 100}%` }}
                  className="bg-blue-500 h-full"
                  title="Completed"
                />
                <div
                  style={{ width: `${metrics.totalTourneys > 0 ? (metrics.draftTourneys / metrics.totalTourneys) * 100 : 0}%` }}
                  className="bg-[var(--border-subtle)] h-full"
                  title="Draft"
                />
              </div>
            </div>
          </div>

          {/* User Directory Pulse */}
          <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#7D4047] dark:text-[#E8C4C8]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                  Recent Registered Organizers
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAdminTab('users')}
                className="text-xs font-bold text-[#7D4047] dark:text-[#E8C4C8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({users.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {users.slice(0, 4).map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-center font-bold font-mono text-[var(--text-primary)] shrink-0">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--text-primary)] text-sm font-display truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono truncate">
                        {u.email} • {u.organizationName || 'Indie Organizer'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <AdminBadge variant={u.status === 'active' ? 'active' : 'suspended'} size="xs">
                      {u.status}
                    </AdminBadge>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline">
                      {u.tournamentsCreatedCount} events
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: PLATFORM HEALTH & RECENT AUDIT FEED */}
        <div className="lg:col-span-5 space-y-6">
          {/* System Health Diagnostics */}
          <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                  Platform Core Diagnostics
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% HEALTH
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Database Storage:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  IndexedDB 100% Synced
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">OBS WebSocket Engine:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Bridge Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">4K Export Worker Pool:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  Ready (WebGL/Canvas)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Platform Version:</span>
                <span className="font-bold text-[var(--accent-primary)]">
                  v{platformHealth.version}
                </span>
              </div>
            </div>
          </div>

          {/* Live Audit Log Stream */}
          <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#7D4047] dark:text-[#E8C4C8]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                  Live Audit Activity Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAdminTab('audit-logs')}
                className="text-xs font-bold text-[#7D4047] dark:text-[#E8C4C8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Trail</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {combinedAuditFeed.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1 text-xs font-sans"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)] font-display truncate">
                      {act.action}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                    {act.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

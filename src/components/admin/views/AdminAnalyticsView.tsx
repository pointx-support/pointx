import React from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useTournamentStore } from '../../../store/tournamentStore';
import { useTemplateStore } from '../../../store/templateStore';
import { AdminStatCard } from '../ui/AdminStatCard';
import {
  TrendingUp,
  Users,
  Trophy,
  Palette,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export const AdminAnalyticsView: React.FC = () => {
  const { getAdminUsers } = useAdminStore();
  const { tournaments } = useTournamentStore();
  const { templates } = useTemplateStore();

  const users = getAdminUsers();

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
            Platform SaaS Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Key growth metrics, monthly active organizers, tournament creation velocity, and template export rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Last 30 Days
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Monthly Active Organizers (MAU)"
          value={users.length || 1}
          changePercent={18}
          icon={Users}
          accentColor="rosewood"
        />

        <AdminStatCard
          label="Tournaments Organized"
          value={tournaments.length}
          changePercent={32}
          icon={Trophy}
          accentColor="gold"
        />

        <AdminStatCard
          label="Leaderboard Posters Generated"
          value={tournaments.length * 6 + 14}
          changePercent={24}
          icon={Palette}
          accentColor="emerald"
        />

        <AdminStatCard
          label="Average Retention Rate"
          value="94.2%"
          changePercent={4.1}
          icon={Activity}
          accentColor="greige"
        />
      </div>

      {/* Analytics Graph Simulation / Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              Weekly Tournament Growth Velocity
            </h3>
            <span className="text-xs font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> +28%
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {['Week 1 (Aug 01 - 07)', 'Week 2 (Aug 08 - 14)', 'Week 3 (Aug 15 - 21)', 'Week 4 (Current)'].map((wk, idx) => {
              const val = [3, 7, 12, Math.max(1, tournaments.length)][idx];
              const pct = Math.min(100, Math.round((val / 15) * 100));

              return (
                <div key={wk} className="space-y-1">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>{wk}</span>
                    <span className="font-bold text-[var(--text-primary)]">{val} Tournaments</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--bg-surface-inset)] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-[#7D4047] rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              Format Distribution (16:9 vs 4:5)
            </h3>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {templates.length} Active Styles
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-primary)]">4:5 Mobile Portrait Posters</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Instagram, Discord & WhatsApp Feeds</div>
              </div>
              <span className="text-base font-extrabold text-[#7D4047] dark:text-[#E8C4C8]">74%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-primary)]">16:9 Desktop & OBS Overlays</div>
                <div className="text-[10px] text-[var(--text-secondary)]">YouTube Live & Twitch Streams</div>
              </div>
              <span className="text-base font-extrabold text-[var(--accent-primary)]">26%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

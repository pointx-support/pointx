import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import {
  FileText,
  Search
} from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const { adminAuditLogs } = useAdminStore();
  const { activities } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tournament' | 'security' | 'match' | 'team'>('all');

  const allLogs = useMemo(() => {
    const raw = [...adminAuditLogs, ...activities];
    const seen = new Set();
    return raw
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [adminAuditLogs, activities]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q)
      );
    });
  }, [allLogs, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Filter Controls */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
              Immutable Audit & Security Log
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Complete chronological audit trail of logins, tournament creations, suspensions, and platform adjustments.
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-[var(--text-secondary)]">
            Total Records: <strong className="text-[var(--text-primary)]">{allLogs.length}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search audit records by action or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] shadow-inner"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="security">Security & Auth</option>
              <option value="tournament">Tournament Events</option>
              <option value="match">Match Operations</option>
              <option value="team">Team Management</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                <th className="py-3.5 pl-6 pr-3 w-44">Timestamp</th>
                <th className="py-3.5 px-3 w-32">Category</th>
                <th className="py-3.5 px-3 w-56 font-sans">Action</th>
                <th className="py-3.5 pl-3 pr-6 font-sans">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-3 pl-6 pr-3 text-[var(--text-muted)] text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        log.category === 'security'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : log.category === 'tournament'
                          ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                          : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}>
                        {log.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans font-bold text-[var(--text-primary)]">
                      {log.action}
                    </td>

                    <td className="py-3 pl-3 pr-6 font-sans text-[var(--text-secondary)]">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

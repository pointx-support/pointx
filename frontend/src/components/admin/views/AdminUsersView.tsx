import React, { useState, useMemo } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { AdminBadge } from '../ui/AdminBadge';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { useToast } from '../../ui/Toast';
import {
  Users,
  Search,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import type { AdminUserRecord } from '../../../types/admin';

export const AdminUsersView: React.FC = () => {
  const { getAdminUsers, suspendUser, restoreUser, deleteUser } = useAdminStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  const users = getAdminUsers();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q))
      );
    });
  }, [users, statusFilter, searchQuery]);

  const handleConfirmSuspend = () => {
    if (!selectedUser) return;
    suspendUser(selectedUser.id, suspensionReason);
    setIsSuspendModalOpen(false);
    setSuspensionReason('');
    setSelectedUser(null);
    showToast({
      type: 'info',
      title: 'User Suspended',
      message: `${selectedUser.name} has been suspended.`
    });
  };

  const handleConfirmRestore = (user: AdminUserRecord) => {
    restoreUser(user.id);
    showToast({
      type: 'success',
      title: 'User Restored',
      message: `${user.name} has been restored to active status.`
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
    showToast({
      type: 'info',
      title: 'User Deleted',
      message: `Account deleted permanently.`
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Search/Filter Controls */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
              Organizer User Directory
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Inspect organizer credentials, monitor session counts, and manage account statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
              Total Users: <strong className="text-[var(--text-primary)]">{users.length}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] shadow-inner"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="all">All Statuses ({users.length})</option>
              <option value="active">Active Only ({users.filter((u) => u.status === 'active').length})</option>
              <option value="suspended">Suspended ({users.filter((u) => u.status === 'suspended').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                <th className="py-3.5 pl-6 pr-3">Organizer</th>
                <th className="py-3.5 px-3">Role</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-center">Logins</th>
                <th className="py-3.5 px-3 text-center">Events</th>
                <th className="py-3.5 px-3 text-center">Templates</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)] font-mono">
                    No organizers found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRootAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      {/* Organizer Column */}
                      <td className="py-3 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-center font-bold font-mono text-[var(--text-primary)] shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[var(--text-primary)] text-sm font-display truncate">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#7D4047]/15 text-[#7D4047] dark:text-[#E8C4C8] border border-[#7D4047]/30'
                            : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <AdminBadge variant={u.status === 'active' ? 'active' : 'suspended'} size="xs">
                          {u.status}
                        </AdminBadge>
                      </td>

                      {/* Logins */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[var(--text-primary)] font-numbers">
                        {u.loginCount}
                      </td>

                      {/* Tournaments */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[var(--text-primary)] font-numbers">
                        {u.tournamentsCreatedCount}
                      </td>

                      {/* Templates */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[var(--text-primary)] font-numbers">
                        {u.templateUsageCount}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'suspended' ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleConfirmRestore(u)}
                              leftIcon={<Unlock className="h-3 w-3 text-emerald-500" />}
                            >
                              Restore
                            </Button>
                          ) : (
                            !isRootAdmin && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsSuspendModalOpen(true);
                                }}
                                leftIcon={<Lock className="h-3 w-3 text-amber-500" />}
                              >
                                Suspend
                              </Button>
                            )
                          )}

                          {!isRootAdmin && (
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsDeleteModalOpen(true);
                              }}
                              leftIcon={<Trash2 className="h-3 w-3" />}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUSPEND MODAL */}
      {isSuspendModalOpen && selectedUser && (
        <Modal
          isOpen={isSuspendModalOpen}
          onClose={() => setIsSuspendModalOpen(false)}
          title="Suspend Organizer Account?"
          description={`Suspending ${selectedUser.name} will immediately block login sessions.`}
          maxWidth="sm"
        >
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                Reason for Suspension:
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter suspension reason"
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSuspendModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmSuspend}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Confirm Suspension
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE USER MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Organizer Account?"
          description={`Permanently remove account for ${selectedUser.name} (${selectedUser.email}).`}
          maxWidth="sm"
        >
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                This will delete account access, organizer profile metadata, and saved session tokens.
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

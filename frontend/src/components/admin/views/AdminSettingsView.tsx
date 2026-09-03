import React, { useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useTournamentStore } from '../../../store/tournamentStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { useToast } from '../../ui/Toast';
import {
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  Sliders,
  Bell,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { adminDemoEnabled, setAdminDemoEnabled } = useTournamentStore();
  const {
    platformSettings,
    toggleMaintenanceMode,
    updatePlatformSettings,
    addAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement
  } = useAdminStore();

  const { showToast } = useToast();

  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    addAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      severity: annSeverity,
      isActive: true,
      targetRole: 'all'
    });

    setIsAnnModalOpen(false);
    setAnnTitle('');
    setAnnMessage('');
    showToast({
      type: 'success',
      title: 'Announcement Published',
      message: 'Announcement banner is now active for users.'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
            Platform Controls & Governance
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure system-wide maintenance states, broadcast announcements, and enforce organizer limits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Maintenance Mode Card */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                Emergency & Maintenance Mode
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
              platformSettings.maintenanceMode
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}>
              {platformSettings.maintenanceMode ? 'Active' : 'Standby'}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            When enabled, non-admin organizers will see a maintenance notice preventing match finalization and tournament edits.
          </p>

          <div className="space-y-3 pt-2 font-mono text-xs">
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] cursor-pointer">
              <input
                type="checkbox"
                checked={platformSettings.maintenanceMode}
                onChange={(e) => toggleMaintenanceMode(e.target.checked)}
                className="rounded text-[#7D4047] h-4 w-4"
              />
              <span className="font-bold text-[var(--text-primary)] font-sans">
                Enable Platform Maintenance Lock
              </span>
            </label>
          </div>
        </div>

        {/* 2. Demo Tournaments & Feature Testing Card (Admin Only) */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                Demo Tournaments & Test Data
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
              adminDemoEnabled
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                : 'bg-zinc-500/15 text-zinc-500 border border-zinc-500/30'
            }`}>
              {adminDemoEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Provides 3 official Free Fire sample tournaments for admin feature testing and OBS graphics calibration. Normal users never see demo info.
          </p>

          <div className="pt-2">
            <Button
              variant={adminDemoEnabled ? 'outline' : 'primary'}
              size="sm"
              onClick={() => {
                const next = !adminDemoEnabled;
                setAdminDemoEnabled(next);
                showToast({
                  type: next ? 'success' : 'info',
                  title: next ? 'Demo Tournaments Enabled' : 'Demo Tournaments Disabled',
                  message: next
                    ? 'Sample tournaments are now available in your admin workspace for feature testing.'
                    : 'Sample tournaments have been removed from your workspace.'
                });
              }}
              leftIcon={adminDemoEnabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            >
              {adminDemoEnabled ? 'Disable Demo Info (Admin Only)' : 'Enable Demo Info (Admin Only)'}
            </Button>
          </div>
        </div>

        {/* 2. Global Platform Limits */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#7D4047] dark:text-[#E8C4C8]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
                Global Platform Limits
              </h3>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-[var(--text-primary)] font-sans">Public Registrations</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Allow new esports organizers to sign up</div>
              </div>
              <input
                type="checkbox"
                checked={platformSettings.allowRegistrations}
                onChange={(e) => updatePlatformSettings({ allowRegistrations: e.target.checked })}
                className="rounded text-[#7D4047] h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-[var(--text-primary)] font-sans">Max Teams per Tournament</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Standard Free Fire lobby bracket</div>
              </div>
              <span className="font-bold text-[var(--accent-primary)] font-numbers">48 Teams</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Announcements Broadcast */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#7D4047] dark:text-[#E8C4C8]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              System Announcement Banners
            </h3>
          </div>

          <Button
            variant="primary"
            size="xs"
            onClick={() => setIsAnnModalOpen(true)}
            leftIcon={<Plus className="h-3 w-3" />}
          >
            Create Banner
          </Button>
        </div>

        <div className="space-y-3 font-sans">
          {platformSettings.systemAnnouncements.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] font-mono">
              No active announcements.
            </div>
          ) : (
            platformSettings.systemAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)] text-sm font-display">
                      {ann.title}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full uppercase ${
                      ann.severity === 'critical'
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : ann.severity === 'warning'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                    }`}>
                      {ann.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">{ann.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={ann.isActive ? 'outline' : 'secondary'}
                    size="xs"
                    onClick={() => toggleAnnouncement(ann.id)}
                  >
                    {ann.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => deleteAnnouncement(ann.id)}
                    leftIcon={<Trash2 className="h-3 w-3" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isAnnModalOpen && (
        <Modal
          isOpen={isAnnModalOpen}
          onClose={() => setIsAnnModalOpen(false)}
          title="Create System Announcement"
          description="Broadcast a real-time banner across all active organizer workspaces."
          maxWidth="md"
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4 font-sans text-xs sm:text-sm">
            <Input
              label="Banner Title *"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Enter announcement title"
              required
            />

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Message Body *
              </label>
              <textarea
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder="Enter message text"
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Severity Level:
              </label>
              <select
                value={annSeverity}
                onChange={(e) => setAnnSeverity(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="critical">Critical (Rose)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAnnModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Plus className="h-4 w-4" />} >
                Broadcast Now
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

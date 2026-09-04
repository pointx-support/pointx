import React, { useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { useTournamentStore } from '../../../store/tournamentStore';
import { usePlatformStore } from '../../../store/platformStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { useToast } from '../../ui/Toast';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Sliders,
  Bell,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { adminDemoEnabled, setAdminDemoEnabled, fetchAdminDemoSetting } = useTournamentStore();
  const {
    platformSettings,
    toggleMaintenanceMode,
    updatePlatformSettings,
    fetchSettings,
    addAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement
  } = useAdminStore();

  const { showToast } = useToast();
  const setPreviewMaintenance = usePlatformStore((s) => s.setPreviewMaintenance);

  React.useEffect(() => {
    fetchAdminDemoSetting();
    fetchSettings();
  }, [fetchAdminDemoSetting, fetchSettings]);

  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  // Maintenance Mode Management State
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintReasonInput, setMaintReasonInput] = useState('');
  const [maintCustomMessageInput, setMaintCustomMessageInput] = useState('');
  const [maintReturnTimeInput, setMaintReturnTimeInput] = useState('');
  const [isUpdatingMaint, setIsUpdatingMaint] = useState(false);

  const handleToggleMaintenanceClick = () => {
    if (platformSettings.maintenanceMode) {
      // Deactivating Maintenance Mode immediately
      setIsUpdatingMaint(true);
      toggleMaintenanceMode(false)
        .then(() => {
          showToast({
            type: 'success',
            title: 'Maintenance Mode Disabled',
            message: 'PointX is now live and accessible to all users.'
          });
        })
        .catch(() => {
          showToast({
            type: 'error',
            title: 'Update Failed',
            message: 'Could not deactivate maintenance mode.'
          });
        })
        .finally(() => setIsUpdatingMaint(false));
    } else {
      // Activating Maintenance Mode: prompt confirmation modal with configurable reason, custom message and return time
      setMaintReasonInput(
        platformSettings.maintenanceReason ||
        "Scheduled Platform & Arena Upgrade"
      );
      setMaintCustomMessageInput(
        platformSettings.customMessage ||
        "PointX is temporarily offline while we upgrade our tournament arena and live scoring engine. We will be back online shortly!"
      );
      setMaintReturnTimeInput(platformSettings.estimatedReturnTime || '');
      setIsMaintModalOpen(true);
    }
  };

  const handleConfirmActivateMaintenance = async (andPreview: boolean = false) => {
    setIsUpdatingMaint(true);
    try {
      await toggleMaintenanceMode(
        true,
        maintReasonInput.trim(),
        maintReturnTimeInput.trim() || null,
        maintCustomMessageInput.trim() || null
      );
      setIsMaintModalOpen(false);
      showToast({
        type: 'info',
        title: 'Maintenance Mode Activated',
        message: 'Global maintenance mode is active. Public users are now routed to the maintenance page.'
      });
      if (andPreview) {
        setPreviewMaintenance(true);
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not activate maintenance mode.'
      });
    } finally {
      setIsUpdatingMaint(false);
    }
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Global Maintenance Mode Control Card (Hero Section) */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${platformSettings.maintenanceMode ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                <AlertTriangle className={`h-5 w-5 ${platformSettings.maintenanceMode ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] font-display">
                  Global Maintenance Mode
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Instant sitewide access lock with real-time public redirection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMaintenance(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] text-xs font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
                title="Preview what regular visitors see when maintenance is active"
              >
                <Eye className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Preview Maintenance Screen</span>
                <span className="sm:hidden">Preview</span>
              </button>

              <span className={`text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                platformSettings.maintenanceMode
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
                {platformSettings.maintenanceMode ? 'ACTIVE (PUBLIC LOCKED)' : 'STANDBY (NORMAL)'}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            When enabled, all public visitors and organizers are immediately redirected to <code className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-inset)] font-mono text-xs text-[var(--text-primary)] font-bold">/maintenance</code> with zero content flash. Only authenticated Super Admins retain console access.
          </p>

          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] block">
                Platform State: {platformSettings.maintenanceMode ? 'Locked for Calibration' : 'Online & Fully Accessible'}
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)] mt-1 block truncate max-w-lg">
                {platformSettings.maintenanceMode
                  ? `Active Reason: "${platformSettings.maintenanceReason || 'Arena Upgrade'}"`
                  : 'All features, APIs, and tournament portals running normally.'}
              </span>
            </div>

            {/* Segmented [ ON / OFF ] Toggle Switch with large touch targets */}
            <div className="flex items-center bg-[var(--bg-surface)] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-xs shrink-0 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={handleToggleMaintenanceClick}
                disabled={isUpdatingMaint}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                  platformSettings.maintenanceMode
                    ? 'bg-amber-500 text-black shadow-md font-extrabold scale-[1.02]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={handleToggleMaintenanceClick}
                disabled={isUpdatingMaint}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                  !platformSettings.maintenanceMode
                    ? 'bg-emerald-600 text-white shadow-md font-extrabold scale-[1.02]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {platformSettings.maintenanceMode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)] font-mono">
              <span>
                {platformSettings.estimatedReturnTime ? `Reopening ETA: ${platformSettings.estimatedReturnTime}` : 'No estimated return time configured.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMaintReasonInput(platformSettings.maintenanceReason || '');
                  setMaintReturnTimeInput(platformSettings.estimatedReturnTime || '');
                  setIsMaintModalOpen(true);
                }}
                className="text-amber-500 hover:underline text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                Edit Reason / ETA
              </button>
            </div>
          )}
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
              onClick={async () => {
                const next = !adminDemoEnabled;
                await setAdminDemoEnabled(next);
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

      {/* ACTIVATE / EDIT MAINTENANCE MODE MODAL */}
      {isMaintModalOpen && (
        <Modal
          isOpen={isMaintModalOpen}
          onClose={() => setIsMaintModalOpen(false)}
          title={platformSettings.maintenanceMode ? 'Update Maintenance Details' : 'Activate Global Maintenance Mode'}
          description="Configure the outage details before enforcing public lockdown."
          maxWidth="md"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmActivateMaintenance(false); }} className="space-y-4 font-sans text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">Warning: Sitewide Public Impact</span>
                Enabling maintenance mode will immediately lock out all unauthenticated visitors and organizers across all routes and redirect them to <span className="font-mono font-bold">/maintenance</span>. Only Super Admins can log in and manage the console.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Maintenance Heading / Reason *
              </label>
              <input
                type="text"
                value={maintReasonInput}
                onChange={(e) => setMaintReasonInput(e.target.value)}
                placeholder="e.g. Scheduled Platform & Database Maintenance"
                required
                className="w-full p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Custom Message to Display to Visitors *
              </label>
              <textarea
                value={maintCustomMessageInput}
                onChange={(e) => setMaintCustomMessageInput(e.target.value)}
                placeholder="Enter the message displayed to users on the maintenance screen..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 leading-relaxed"
              />
              <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-1 block">
                This message will be rendered directly on the public maintenance screen.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Estimated Reopening / Return Time (Optional)
              </label>
              <div className="relative">
                <Input
                  value={maintReturnTimeInput}
                  onChange={(e) => setMaintReturnTimeInput(e.target.value)}
                  placeholder="e.g. Approx. 2 Hours, or 18:00 UTC"
                  className="pl-8"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsMaintModalOpen(false)}
                disabled={isUpdatingMaint}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => handleConfirmActivateMaintenance(true)}
                disabled={isUpdatingMaint}
                leftIcon={<Eye className="h-4 w-4 text-amber-500" />}
                className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                Activate & Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isUpdatingMaint}
                leftIcon={<AlertTriangle className="h-4 w-4 text-black" />}
                className="!bg-amber-500 hover:!bg-amber-400 !text-black font-extrabold"
              >
                {isUpdatingMaint
                  ? 'Applying Lock...'
                  : platformSettings.maintenanceMode
                  ? 'Save Details'
                  : 'Turn ON Maintenance'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

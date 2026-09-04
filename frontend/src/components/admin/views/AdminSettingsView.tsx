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
  ShieldAlert,
  KeyRound,
  AlertCircle
} from 'lucide-react';

export interface MaintenancePreset {
  id: string;
  category: string;
  badge: string;
  reason: string;
  message: string;
  returnTime: string;
}

export const MAINTENANCE_PRESETS: MaintenancePreset[] = [
  {
    id: 'db-upgrade',
    category: 'Database & Storage',
    badge: 'Database',
    reason: 'Core Database Migration & Cluster Optimization',
    message: 'PointX is performing scheduled database indexing and cluster scaling to enhance real-time query throughput. All tournament brackets and statistics will resume shortly.',
    returnTime: 'Approx. 30 Minutes',
  },
  {
    id: 'scoring-engine',
    category: 'Tournament Engine',
    badge: 'Scoring',
    reason: 'Tournament Scoring Engine Architecture Upgrade',
    message: 'We are rolling out version upgrades to our automated Free Fire point calculation engine. Match telemetry feeds will be back online with enhanced sub-millisecond precision.',
    returnTime: 'Approx. 45 Minutes',
  },
  {
    id: 'obs-stream',
    category: 'Broadcasting & OBS',
    badge: 'OBS Overlays',
    reason: 'OBS Live Stream Overlays & Graphics Core Update',
    message: 'Upgrading graphics rendering pipeline and dynamic scoreboard stream overlays for official tournament broadcasts. Live streaming overlays will resume shortly.',
    returnTime: 'Approx. 20 Minutes',
  },
  {
    id: 'emergency-hotfix',
    category: 'Emergency & Stability',
    badge: 'Emergency',
    reason: 'Emergency Infrastructure & Server Calibration',
    message: 'Our engineering team is conducting urgent server node calibrations and network route optimizations. Platform operations will be restored as soon as possible.',
    returnTime: 'Approx. 15 Minutes',
  },
  {
    id: 'security-hardening',
    category: 'Security & Compliance',
    badge: 'Security',
    reason: 'Scheduled Security Hardening & Zero-Trust Protocol Update',
    message: 'PointX is applying critical security patches and enterprise firewall fortifications. No tournament data is impacted during this routine update.',
    returnTime: 'Approx. 40 Minutes',
  },
  {
    id: 'season-rollover',
    category: 'Championship Operations',
    badge: 'Season Roll',
    reason: 'New Championship Season & Leaderboard Rollover',
    message: 'Transitioning leaderboards and archiving seasonal tournament brackets in preparation for the upcoming championship series. Get your squads ready!',
    returnTime: 'Approx. 1 Hour',
  },
  {
    id: 'cdn-assets',
    category: 'Media & CDN Delivery',
    badge: 'CDN Sync',
    reason: 'Media Asset Delivery Network Synchronization',
    message: 'Synchronizing 4K team logos, tournament badges, and broadcast templates across global CDN edge nodes for lightning-fast asset loading.',
    returnTime: 'Approx. 25 Minutes',
  },
  {
    id: 'websocket-sync',
    category: 'Real-Time Sync',
    badge: 'WebSockets',
    reason: 'WebSocket Mesh Network & Sync Infrastructure Upgrade',
    message: 'Upgrading real-time synchronization brokers to ensure zero-lag remote control room and multi-screen score operator synchronization.',
    returnTime: 'Approx. 35 Minutes',
  },
  {
    id: 'auth-gateway',
    category: 'Authentication & Accounts',
    badge: 'Auth & OTP',
    reason: 'Authentication Gateway & Communication Service Update',
    message: 'Conducting routine maintenance on our transactional messaging gateways. New registrations and password reset services are temporarily paused.',
    returnTime: 'Approx. 20 Minutes',
  },
  {
    id: 'datacenter-hardware',
    category: 'Hardware & Network',
    badge: 'Hardware',
    reason: 'Data Center Node Hardware & Power Grid Maintenance',
    message: 'Our cloud hosting partner is performing scheduled hardware maintenance on primary server racks. Full connectivity will resume within the hour.',
    returnTime: 'Approx. 50 Minutes',
  },
  {
    id: 'anticheat-roster',
    category: 'Competitive Integrity',
    badge: 'Fair Play',
    reason: 'Anti-Tamper & Player Registry Calibration',
    message: 'Calibrating player verification and tournament roster anti-tamper validation services to ensure fair play across all competitive brackets.',
    returnTime: 'Approx. 30 Minutes',
  },
  {
    id: 'major-v3',
    category: 'Platform Release',
    badge: 'Major Release',
    reason: 'PointX Enterprise Major Feature Deployment',
    message: 'Deploying exciting new features to the Tournament Workspace, Squads Registry, and Template Studio! We are putting the final touches on this release.',
    returnTime: 'Approx. 1.5 Hours',
  },
];

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
  const [securityCodeInput, setSecurityCodeInput] = useState('');
  const [securityCodeError, setSecurityCodeError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isUpdatingMaint, setIsUpdatingMaint] = useState(false);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = MAINTENANCE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setMaintReasonInput(found.reason);
      setMaintCustomMessageInput(found.message);
      setMaintReturnTimeInput(found.returnTime);
    }
  };

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
      // Activating Maintenance Mode: prompt confirmation modal with configurable reason, custom message, presets, and security code
      const defaultPreset = MAINTENANCE_PRESETS[0];
      setMaintReasonInput(
        platformSettings.maintenanceReason ||
        defaultPreset.reason
      );
      setMaintCustomMessageInput(
        platformSettings.customMessage ||
        defaultPreset.message
      );
      setMaintReturnTimeInput(platformSettings.estimatedReturnTime || defaultPreset.returnTime);
      setSelectedPresetId(defaultPreset.id);
      setSecurityCodeInput('');
      setSecurityCodeError(null);
      setIsMaintModalOpen(true);
    }
  };

  const handleConfirmActivateMaintenance = async (andPreview: boolean = false) => {
    if (!platformSettings.maintenanceMode) {
      if (securityCodeInput.trim() !== '8260452263') {
        setSecurityCodeError('Security confirmation failed. You must enter the authorization code: 8260452263');
        return;
      }
    }

    setSecurityCodeError(null);
    setIsUpdatingMaint(true);
    try {
      await toggleMaintenanceMode(
        true,
        maintReasonInput.trim(),
        maintReturnTimeInput.trim() || null,
        maintCustomMessageInput.trim() || null,
        securityCodeInput.trim()
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
    } catch (err: any) {
      const msg = err?.message || 'Could not activate maintenance mode.';
      if (msg.toLowerCase().includes('security code')) {
        setSecurityCodeError(msg);
      }
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: msg
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

            {/* Pre-written Scenarios (More than 10 presets) */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Pre-written Scenarios ({MAINTENANCE_PRESETS.length} Presets Available)
                </label>
                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
                  1-Click Auto-Fill
                </span>
              </div>
              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-amber-500"
              >
                {MAINTENANCE_PRESETS.map((preset, index) => (
                  <option key={preset.id} value={preset.id}>
                    #{index + 1} [{preset.badge}] — {preset.reason}
                  </option>
                ))}
              </select>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {MAINTENANCE_PRESETS.map((p) => {
                  const isActive = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {p.badge}
                    </button>
                  );
                })}
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

            {/* Security Authorization Code (Required when activating) */}
            {!platformSettings.maintenanceMode && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    Admin Security Confirmation Code
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Enter the 10-digit master authorization code to confirm this action: <span className="font-mono font-bold text-rose-500 select-all">8260452263</span>
                </p>
                <div className="relative">
                  <Input
                    type="text"
                    value={securityCodeInput}
                    onChange={(e) => {
                      setSecurityCodeInput(e.target.value);
                      if (securityCodeError) setSecurityCodeError(null);
                    }}
                    placeholder="Enter security code: 8260452263"
                    className="font-mono font-bold tracking-widest text-center"
                    required
                  />
                </div>
                {securityCodeError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{securityCodeError}</span>
                  </div>
                )}
              </div>
            )}

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

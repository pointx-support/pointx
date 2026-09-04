import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AdminTab,
  AdminUserRecord,
  PlatformSettings,
  SystemAnnouncement,
  PlatformHealthStatus
} from '../types/admin';
import type { AuditActivity } from '../types/auth';
import { adminApi } from '../services/api';
import { usePlatformStore } from './platformStore';

const ADMIN_SETTINGS_STORAGE_KEY = 'pointx_admin_platform_settings_v1';
const ACTIVITIES_STORAGE_KEY = 'pointx_audit_activities_v1';

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  maintenanceReason: 'Scheduled database indexing and system upgrade.',
  allowRegistrations: true,
  maxTournamentsPerOrganizer: 25,
  maxTeamsPerTournament: 48,
  defaultExportResolution: '4k',
  requireOnboardingVerification: true,
  systemAnnouncements: [
    {
      id: 'ann-01',
      title: 'PointX 2.4 Enterprise Released',
      message: 'Graphics Studio 4K poster renderer and OBS ultra-low-latency bridge now live.',
      severity: 'info',
      isActive: true,
      createdAt: '2026-08-20T10:00:00Z',
      targetRole: 'all'
    }
  ]
};

const DEFAULT_PLATFORM_HEALTH: PlatformHealthStatus = {
  databaseStatus: 'healthy',
  scoringEngineLatencyMs: 4.2,
  obsWebSocketBridge: 'connected',
  exportWorkerPool: 'operational',
  lastBackupAt: new Date().toISOString(),
  version: '2.4.0-Enterprise',
  uptimeSeconds: 864200
};

export interface AdminStoreState {
  activeAdminTab: AdminTab;
  platformSettings: PlatformSettings;
  adminAuditLogs: AuditActivity[];
  platformHealth: PlatformHealthStatus;

  // Actions
  setActiveAdminTab: (tab: AdminTab) => void;
  getAdminUsers: () => AdminUserRecord[];
  suspendUser: (userId: string, reason?: string) => void;
  restoreUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  toggleMaintenanceMode: (enabled: boolean, reason?: string, returnTime?: string | null, customMessage?: string | null) => Promise<void>;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
  fetchSettings: () => Promise<void>;
  addAnnouncement: (announcement: Omit<SystemAnnouncement, 'id' | 'createdAt'>) => void;
  toggleAnnouncement: (id: string) => void;
  deleteAnnouncement: (id: string) => void;
  recordAdminEvent: (action: string, category: AuditActivity['category'], details: string) => void;
}

export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set, get) => ({
      activeAdminTab: 'overview',
      platformSettings: DEFAULT_PLATFORM_SETTINGS,
      adminAuditLogs: [],
      platformHealth: DEFAULT_PLATFORM_HEALTH,

      setActiveAdminTab: (tab) => set({ activeAdminTab: tab }),

      getAdminUsers: () => {
        adminApi.getUsers().then((res) => {
          if (res.success && Array.isArray(res.data)) {
            // Updated via backend
          }
        }).catch(() => {});
        return [];
      },

      suspendUser: (userId, reason) => {
        adminApi.suspendUser(userId, reason).catch(() => {});
        get().recordAdminEvent(
          'User Account Suspended',
          'security',
          `Admin suspended user ${userId}. Reason: ${reason || 'General policy'}`
        );
      },

      restoreUser: (userId) => {
        adminApi.restoreUser(userId).catch(() => {});
        get().recordAdminEvent(
          'User Account Restored',
          'security',
          `Admin restored user ${userId} back to active standing.`
        );
      },

      deleteUser: (userId) => {
        adminApi.deleteUser(userId).catch(() => {});
        get().recordAdminEvent(
          'User Account Deleted',
          'security',
          `Admin permanently deleted account for ${userId}.`
        );
      },

      toggleMaintenanceMode: async (enabled, reason, returnTime, customMessage) => {
        const current = get().platformSettings;
        const updated: PlatformSettings = {
          ...current,
          maintenanceMode: enabled,
          maintenanceReason: reason !== undefined && reason !== null ? reason : current.maintenanceReason,
          customMessage: customMessage !== undefined ? customMessage : current.customMessage,
          estimatedReturnTime: returnTime !== undefined ? returnTime : current.estimatedReturnTime
        };
        set({ platformSettings: updated });

        // Immediately sync with platform store for instant UI response
        usePlatformStore.getState().setMaintenanceState(
          enabled,
          updated.maintenanceReason,
          updated.estimatedReturnTime,
          updated.customMessage
        );

        try {
          const res = await adminApi.saveSettings(updated);
          if (res.success && res.data) {
            set({ platformSettings: res.data });
          }
        } catch {}

        get().recordAdminEvent(
          enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          'security',
          enabled ? `Admin activated platform maintenance: ${reason || 'Scheduled'}` : 'Admin resumed standard operations.'
        );
      },

      fetchSettings: async () => {
        try {
          const res = await adminApi.getSettings();
          if (res.success && res.data) {
            set({ platformSettings: res.data });
            usePlatformStore.getState().setMaintenanceState(
              Boolean(res.data.maintenanceMode),
              res.data.maintenanceReason,
              res.data.estimatedReturnTime
            );
          }
        } catch {}
      },

      updatePlatformSettings: (settings) => {
        const updated = { ...get().platformSettings, ...settings };
        set({ platformSettings: updated });
        adminApi.saveSettings(updated).catch(() => {});
        get().recordAdminEvent('Platform Settings Updated', 'security', 'Admin updated global platform configuration limits.');
      },

      addAnnouncement: (announcement) => {
        const newAnn: SystemAnnouncement = {
          ...announcement,
          id: `ann-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString()
        };
        const updated = {
          ...get().platformSettings,
          systemAnnouncements: [newAnn, ...get().platformSettings.systemAnnouncements]
        };
        set({ platformSettings: updated });
        adminApi.saveSettings(updated).catch(() => {});
        get().recordAdminEvent('System Announcement Created', 'security', `Created announcement banner: "${newAnn.title}"`);
      },

      toggleAnnouncement: (id) => {
        const updated = {
          ...get().platformSettings,
          systemAnnouncements: get().platformSettings.systemAnnouncements.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          )
        };
        set({ platformSettings: updated });
        adminApi.saveSettings(updated).catch(() => {});
      },

      deleteAnnouncement: (id) => {
        const updated = {
          ...get().platformSettings,
          systemAnnouncements: get().platformSettings.systemAnnouncements.filter((a) => a.id !== id)
        };
        set({ platformSettings: updated });
        adminApi.saveSettings(updated).catch(() => {});
      },

      recordAdminEvent: (action, category, details) => {
        adminApi.recordActivity(action, category, details).catch(() => {});
        const newActivity: AuditActivity = {
          id: `admin-act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
          userId: 'admin-lead',
          action,
          category,
          details,
          timestamp: new Date().toISOString()
        };

        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const raw = window.localStorage.getItem(ACTIVITIES_STORAGE_KEY);
            const current: AuditActivity[] = raw ? JSON.parse(raw) : [];
            window.localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify([newActivity, ...current.slice(0, 99)]));
          } catch {}
        }

        set((state) => ({
          adminAuditLogs: [newActivity, ...state.adminAuditLogs.slice(0, 99)]
        }));
      }
    }),
    {
      name: ADMIN_SETTINGS_STORAGE_KEY
    }
  )
);

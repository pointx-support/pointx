import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AdminTab,
  AdminUserRecord,
  PlatformSettings,
  SystemAnnouncement,
  PlatformHealthStatus
} from '../types/admin';
import type { AuditActivity, User } from '../types/auth';

const ADMIN_SETTINGS_STORAGE_KEY = 'pointx_admin_platform_settings_v1';
const REGISTERED_USERS_KEY = 'strikz_registered_users_v1';
const ACTIVITIES_STORAGE_KEY = 'strikz_audit_activities_v1';

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
  toggleMaintenanceMode: (enabled: boolean, reason?: string) => void;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
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
        if (typeof window === 'undefined' || !window.localStorage) return [];
        try {
          const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
          const users: User[] = raw ? JSON.parse(raw) : [];

          // Enrich with admin tracking metadata
          return users.map((u, idx) => {
            const isSuspended = (u as any).status === 'suspended';
            return {
              ...u,
              status: isSuspended ? 'suspended' : 'active',
              loginCount: (u as any).loginCount || (idx === 0 ? 42 : Math.max(1, (idx * 7) % 25)),
              totalSessions: (u as any).totalSessions || (idx === 0 ? 3 : 1),
              tournamentsCreatedCount: (u as any).tournamentsCreatedCount || (idx === 0 ? 5 : Math.max(0, idx % 3)),
              templateUsageCount: (u as any).templateUsageCount || (idx === 0 ? 18 : idx * 4),
              isOnline: idx === 0 || idx % 2 === 0,
              notes: (u as any).notes || undefined,
              suspendedAt: (u as any).suspendedAt,
              suspensionReason: (u as any).suspensionReason
            };
          });
        } catch {
          return [];
        }
      },

      suspendUser: (userId, reason) => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
          const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
          const users: any[] = raw ? JSON.parse(raw) : [];
          const target = users.find((u) => u.id === userId);

          const updated = users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status: 'suspended',
                  suspendedAt: new Date().toISOString(),
                  suspensionReason: reason || 'Violation of platform organizer guidelines.'
                }
              : u
          );
          window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));

          get().recordAdminEvent(
            'User Account Suspended',
            'security',
            `Admin suspended user ${target?.name || userId}. Reason: ${reason || 'General policy'}`
          );
        } catch {}
      },

      restoreUser: (userId) => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
          const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
          const users: any[] = raw ? JSON.parse(raw) : [];
          const target = users.find((u) => u.id === userId);

          const updated = users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status: 'active',
                  suspendedAt: undefined,
                  suspensionReason: undefined
                }
              : u
          );
          window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));

          get().recordAdminEvent(
            'User Account Restored',
            'security',
            `Admin restored user ${target?.name || userId} back to active standing.`
          );
        } catch {}
      },

      deleteUser: (userId) => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
          const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
          const users: any[] = raw ? JSON.parse(raw) : [];
          const target = users.find((u) => u.id === userId);
          const filtered = users.filter((u) => u.id !== userId);

          window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));

          get().recordAdminEvent(
            'User Account Deleted',
            'security',
            `Admin permanently deleted account for ${target?.name || userId} (${target?.email || ''}).`
          );
        } catch {}
      },

      toggleMaintenanceMode: (enabled, reason) => {
        set((state) => {
          const updated = {
            ...state.platformSettings,
            maintenanceMode: enabled,
            maintenanceReason: reason || state.platformSettings.maintenanceReason
          };
          return { platformSettings: updated };
        });

        get().recordAdminEvent(
          enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          'security',
          enabled ? `Admin activated platform maintenance: ${reason || 'Scheduled'}` : 'Admin resumed standard operations.'
        );
      },

      updatePlatformSettings: (settings) => {
        set((state) => ({
          platformSettings: { ...state.platformSettings, ...settings }
        }));
        get().recordAdminEvent('Platform Settings Updated', 'security', 'Admin updated global platform configuration limits.');
      },

      addAnnouncement: (announcement) => {
        const newAnn: SystemAnnouncement = {
          ...announcement,
          id: `ann-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          platformSettings: {
            ...state.platformSettings,
            systemAnnouncements: [newAnn, ...state.platformSettings.systemAnnouncements]
          }
        }));
        get().recordAdminEvent('System Announcement Created', 'security', `Created announcement banner: "${newAnn.title}"`);
      },

      toggleAnnouncement: (id) => {
        set((state) => ({
          platformSettings: {
            ...state.platformSettings,
            systemAnnouncements: state.platformSettings.systemAnnouncements.map((a) =>
              a.id === id ? { ...a, isActive: !a.isActive } : a
            )
          }
        }));
      },

      deleteAnnouncement: (id) => {
        set((state) => ({
          platformSettings: {
            ...state.platformSettings,
            systemAnnouncements: state.platformSettings.systemAnnouncements.filter((a) => a.id !== id)
          }
        }));
      },

      recordAdminEvent: (action, category, details) => {
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

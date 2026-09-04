import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { platformApi } from '../services/api';

export interface PlatformState {
  maintenanceMode: boolean;
  maintenanceReason: string;
  customMessage: string;
  estimatedReturnTime: string | null;
  isLoading: boolean;
  hasInitialCheck: boolean;
  lastCheckedAt: number;
  previewMaintenance: boolean;

  fetchPlatformStatus: () => Promise<boolean>;
  setMaintenanceState: (enabled: boolean, reason?: string, returnTime?: string | null, customMessage?: string | null) => void;
  setPreviewMaintenance: (preview: boolean) => void;
  startPolling: (intervalMs?: number) => () => void;
}

let pollingTimer: any = null;

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      maintenanceMode: false,
      maintenanceReason: "PointX is temporarily offline while we upgrade tournament arena engines. We'll be back shortly.",
      customMessage: "",
      estimatedReturnTime: null,
      isLoading: false,
      hasInitialCheck: false,
      lastCheckedAt: 0,
      previewMaintenance: false,

      fetchPlatformStatus: async () => {
        try {
          set({ isLoading: true });
          const res = await platformApi.getStatus();
          if (res && res.success) {
            const isMaintenance = Boolean(res.maintenanceMode);
            set({
              maintenanceMode: isMaintenance,
              maintenanceReason: res.maintenanceReason || get().maintenanceReason,
              customMessage: (res as any).customMessage || '',
              estimatedReturnTime: res.estimatedReturnTime || null,
              hasInitialCheck: true,
              lastCheckedAt: Date.now(),
              isLoading: false,
            });
            return isMaintenance;
          }
        } catch {
          // In case of network error, do not unexpectedly change existing status
        } finally {
          set({ isLoading: false, hasInitialCheck: true });
        }
        return get().maintenanceMode;
      },

      setMaintenanceState: (enabled: boolean, reason?: string, returnTime?: string | null, customMessage?: string | null) => {
        set((state) => ({
          maintenanceMode: enabled,
          maintenanceReason: reason !== undefined && reason !== null ? reason : state.maintenanceReason,
          customMessage: customMessage !== undefined && customMessage !== null ? customMessage : state.customMessage,
          estimatedReturnTime: returnTime !== undefined ? returnTime : state.estimatedReturnTime,
          lastCheckedAt: Date.now(),
        }));
      },

      setPreviewMaintenance: (preview: boolean) => {
        set({ previewMaintenance: preview });
      },

      startPolling: (intervalMs = 6000) => {
        if (pollingTimer) {
          clearInterval(pollingTimer);
        }
        get().fetchPlatformStatus();
        pollingTimer = setInterval(() => {
          get().fetchPlatformStatus();
        }, intervalMs);

        return () => {
          if (pollingTimer) {
            clearInterval(pollingTimer);
            pollingTimer = null;
          }
        };
      },
    }),
    {
      name: 'pointx_platform_status_v1',
      partialize: (state) => ({
        maintenanceMode: state.maintenanceMode,
        maintenanceReason: state.maintenanceReason,
        customMessage: state.customMessage,
        estimatedReturnTime: state.estimatedReturnTime,
      }),
    }
  )
);

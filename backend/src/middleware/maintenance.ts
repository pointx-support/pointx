import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, optionalAuthenticate } from './auth';
import { getPlatformSettings } from '../services/adminService';

// In-memory cached maintenance flag for sub-millisecond route checks
let cachedMaintenanceMode = false;
let cachedReason = "PointX is temporarily offline while we improve the tournament experience. We'll be back shortly.";
let cachedCustomMessage = "";
let cachedReturnTime: string | null = null;
let lastCacheFetch = 0;

export async function refreshMaintenanceCache(): Promise<boolean> {
  try {
    const settings = await getPlatformSettings();
    cachedMaintenanceMode = Boolean(settings.maintenanceMode);
    cachedReason = settings.maintenanceReason || cachedReason;
    cachedCustomMessage = (settings as any).customMessage || '';
    cachedReturnTime = (settings as any).estimatedReturnTime || null;
    lastCacheFetch = Date.now();
  } catch {
    // If DB check fails, retain existing state
  }
  return cachedMaintenanceMode;
}

export function setMaintenanceCache(enabled: boolean, reason?: string, returnTime?: string | null, customMessage?: string) {
  cachedMaintenanceMode = enabled;
  if (reason) cachedReason = reason;
  if (customMessage !== undefined) cachedCustomMessage = customMessage;
  if (returnTime !== undefined) cachedReturnTime = returnTime;
  lastCacheFetch = Date.now();
}

export function getMaintenanceStatus() {
  return {
    maintenanceMode: cachedMaintenanceMode,
    maintenanceReason: cachedReason,
    customMessage: cachedCustomMessage,
    estimatedReturnTime: cachedReturnTime,
  };
}

export function resetMaintenanceCacheForTesting() {
  cachedMaintenanceMode = false;
  cachedReason = "PointX is temporarily offline while we improve the tournament experience. We'll be back shortly.";
  cachedCustomMessage = "";
  cachedReturnTime = null;
  lastCacheFetch = 0;
}

export async function enforceMaintenanceMode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const path = (req.originalUrl || req.path || '').toLowerCase();

  // 0. Non-API traffic (frontend HTML shell, JS bundles, CSS, logos, favicons, fonts)
  // must NEVER be blocked by the API guard. The browser needs these assets to render the maintenance UI!
  if (!path.startsWith('/api')) {
    return next();
  }

  // 1. Unconditionally allow vital infrastructure, status, and administrative operations
  if (
    path.startsWith('/api/health') ||
    path.startsWith('/api/platform/status') ||
    path.startsWith('/api/admin') ||
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/me') ||
    path.startsWith('/api/auth/logout')
  ) {
    return next();
  }

  // 2. Periodic cache refresh every 5 seconds
  if (Date.now() - lastCacheFetch > 5000) {
    await refreshMaintenanceCache();
  }

  // 3. If maintenance mode is OFF, allow all traffic
  if (!cachedMaintenanceMode) {
    return next();
  }

  // 4. If maintenance mode is ON: Authenticate user to verify administrator status
  if (!req.user) {
    await new Promise<void>((resolve) => {
      optionalAuthenticate(req, res, () => resolve());
    });
  }

  // 5. Authorized Administrators bypass maintenance completely
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // 6. Block all non-admin and unauthenticated requests with HTTP 503 Service Unavailable
  return res.status(503).json({
    success: false,
    maintenanceMode: true,
    error: 'PointX is currently undergoing scheduled maintenance.',
    message: cachedReason,
    customMessage: cachedCustomMessage,
    estimatedReturnTime: cachedReturnTime,
  });
}

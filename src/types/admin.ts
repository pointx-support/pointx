import type { User, UserRole } from './auth';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'templates'
  | 'audit-logs'
  | 'analytics'
  | 'settings';

export type UserAccountStatus = 'active' | 'suspended' | 'pending' | 'deleted';

export interface AdminUserRecord extends User {
  status: UserAccountStatus;
  loginCount: number;
  totalSessions: number;
  tournamentsCreatedCount: number;
  templateUsageCount: number;
  isOnline?: boolean;
  notes?: string;
  suspendedAt?: string;
  suspensionReason?: string;
}

export interface PlatformHealthStatus {
  databaseStatus: 'healthy' | 'degraded' | 'maintenance';
  scoringEngineLatencyMs: number;
  obsWebSocketBridge: 'connected' | 'idle' | 'offline';
  exportWorkerPool: 'operational' | 'busy' | 'stopped';
  lastBackupAt: string;
  version: string;
  uptimeSeconds: number;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  targetRole?: UserRole | 'all';
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceReason?: string;
  allowRegistrations: boolean;
  maxTournamentsPerOrganizer: number;
  maxTeamsPerTournament: number;
  defaultExportResolution: '1080p' | '4k';
  requireOnboardingVerification: boolean;
  systemAnnouncements: SystemAnnouncement[];
}

export interface AdminDashboardMetrics {
  totalRegisteredUsers: number;
  activeUsersToday: number;
  onlineUsersNow: number;
  newUsersThisWeek: number;
  totalTournaments: number;
  activeLiveTournaments: number;
  completedTournaments: number;
  totalTemplatesAvailable: number;
  publishedTemplatesCount: number;
  mostUsedTemplate: {
    name: string;
    id: string;
    usageCount: number;
  } | null;
  systemHealth: PlatformHealthStatus;
}

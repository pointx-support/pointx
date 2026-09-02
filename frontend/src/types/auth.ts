export type UserRole = 'admin' | 'organizer';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultScoringPreset: string;
  defaultMatchSlots: number;
  soundEffects: boolean;
  broadcastResolution: string;
}

export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AuditActivity {
  id: string;
  userId: string;
  action: string;
  category: 'tournament' | 'match' | 'scoring' | 'graphics' | 'obs' | 'security';
  details: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName: string;
  organizationLogoUrl?: string;
  defaultTournamentTitle?: string;
  tournamentLogoUrl?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'prefer-not-to-say' | '';
  orgSize?: '200+' | '500+' | '1000+' | '5000+' | '10,000+' | '20,000+' | string;
  heardFrom?: string;
  isOnboarded?: boolean;
  isOriginalAdmin?: boolean;
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  sessions: UserSession[];
  activities: AuditActivity[];
}
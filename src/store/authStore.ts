import { create } from 'zustand';
import type { User, UserSession, AuditActivity, UserPreferences } from '../types/auth';

const AUTH_STORAGE_KEY = 'strikz_auth_session_v1';
const REGISTERED_USERS_KEY = 'strikz_registered_users_v1';
const ACTIVITIES_STORAGE_KEY = 'strikz_audit_activities_v1';
const THEME_STORAGE_KEY = 'strikz_theme_mode_v1';

export interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  sessionToken: string | null;
  sessions: UserSession[];
  activities: AuditActivity[];

  login: (email: string, password?: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password?: string, orgName?: string) => { success: boolean; error?: string };
  completeOnboarding: (data: {
    name: string;
    organizationName: string;
    phoneNumber: string;
    gender: User['gender'];
    orgSize: User['orgSize'];
    heardFrom: string;
  }) => void;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'email' | 'organizationName' | 'organizationLogoUrl' | 'defaultTournamentTitle' | 'tournamentLogoUrl' | 'avatarUrl' | 'phoneNumber' | 'gender' | 'orgSize' | 'heardFrom' | 'isOnboarded'>>) => void;
  changePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setRole: (role: 'admin' | 'organizer') => void;
  toggleRole: () => void;
  terminateOtherSessions: () => void;
  recordActivity: (action: string, category: AuditActivity['category'], details: string) => void;
}

const DEFAULT_USER: User = {
  id: 'usr-shakti-lead-admin',
  name: 'Shakti',
  email: 'shakti@strikzesports.com',
  role: 'admin',
  organizationName: 'Strikz Esports Network',
  avatarUrl: undefined,
  isOnboarded: true,
  createdAt: '2026-01-15T10:00:00Z',
  lastLoginAt: '2026-08-18T23:30:00Z',
  preferences: {
    theme: 'light',
    defaultScoringPreset: 'preset-ff-official-v1',
    defaultMatchSlots: 12,
    soundEffects: true,
    broadcastResolution: '1080p'
  }
};

const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess-current',
    deviceName: 'Windows 11 PC (OBS Studio)',
    browser: 'Chrome 128 / Desktop',
    ipAddress: '103.21.244.12',
    location: 'Mumbai, India',
    lastActive: 'Just now',
    isCurrent: true
  },
  {
    id: 'sess-mobile',
    deviceName: 'iPhone 15 Pro (Admin Control)',
    browser: 'Mobile Safari',
    ipAddress: '157.34.120.88',
    location: 'Mumbai, India',
    lastActive: '2 hours ago',
    isCurrent: false
  }
];

const INITIAL_ACTIVITIES: AuditActivity[] = [
  {
    id: 'act-01',
    userId: 'usr-shakti-lead-admin',
    action: 'Tournament Created',
    category: 'tournament',
    details: 'Created "Free Fire Grand Championship — Season 5" with 12 team slots.',
    timestamp: '2026-08-18T18:00:00Z'
  },
  {
    id: 'act-02',
    userId: 'usr-shakti-lead-admin',
    action: 'Match #3 Finalized',
    category: 'match',
    details: 'Locked official scores into standings. Total Gaming Esports won Booyah.',
    timestamp: '2026-08-18T20:05:00Z'
  },
  {
    id: 'act-03',
    userId: 'usr-shakti-lead-admin',
    action: 'OBS Access Token Generated',
    category: 'obs',
    details: 'Generated live broadcast token for OBS Browser Source overlay.',
    timestamp: '2026-08-18T21:15:00Z'
  },
  {
    id: 'act-04',
    userId: 'usr-shakti-lead-admin',
    action: 'Standings 4K UHD Graphic Exported',
    category: 'graphics',
    details: 'Exported Legit Showdown overall standings in 3840x2160 resolution.',
    timestamp: '2026-08-18T22:30:00Z'
  }
];

function applyThemeToDOM(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

function loadStoredTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.localStorage) return 'light';
  try {
    const directTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (directTheme === 'light' || directTheme === 'dark') return directTheme;
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.preferences?.theme) return parsed.preferences.theme;
    }
    return 'light';
  } catch {
    return 'light';
  }
}

function loadStoredUser(): User | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadRegisteredUsers(): User[] {
  if (typeof window === 'undefined' || !window.localStorage) return [DEFAULT_USER];
  try {
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_USER];
  } catch {
    return [DEFAULT_USER];
  }
}

function saveRegisteredUsers(users: User[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  }
}

function loadStoredActivities(): AuditActivity[] {
  if (typeof window === 'undefined' || !window.localStorage) return INITIAL_ACTIVITIES;
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
  } catch {
    return INITIAL_ACTIVITIES;
  }
}

const initialTheme = loadStoredTheme();
applyThemeToDOM(initialTheme);

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: loadStoredUser(),
  isAuthenticated: !!loadStoredUser(),
  theme: initialTheme,
  sessionToken: 'sess_tok_' + Math.random().toString(36).substr(2, 12),
  sessions: INITIAL_SESSIONS,
  activities: loadStoredActivities(),

  setTheme: (newTheme: 'light' | 'dark') => {
    applyThemeToDOM(newTheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          theme: newTheme
        }
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      set({ theme: newTheme, user: updatedUser });
    } else {
      set({ theme: newTheme });
    }
  },

  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  login: (email, _password) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const currentTheme = get().theme;
    const registered = loadRegisteredUsers();
    const existing = registered.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    const authenticatedUser: User = existing
      ? {
          ...existing,
          lastLoginAt: new Date().toISOString(),
          preferences: {
            ...existing.preferences,
            theme: currentTheme
          }
        }
      : {
          ...DEFAULT_USER,
          id: `usr-${Date.now().toString(36)}`,
          email: email.trim(),
          name: email.split('@')[0],
          isOnboarded: email.toLowerCase() === DEFAULT_USER.email.toLowerCase(),
          lastLoginAt: new Date().toISOString(),
          preferences: {
            ...DEFAULT_USER.preferences,
            theme: currentTheme
          }
        };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    }

    set({
      user: authenticatedUser,
      isAuthenticated: true,
      sessionToken: 'sess_tok_' + Math.random().toString(36).substr(2, 12)
    });

    get().recordActivity('User Logged In', 'security', `Logged in as ${authenticatedUser.name} (${authenticatedUser.role.toUpperCase()})`);
    return { success: true };
  },

  signup: (name, email, _password, orgName) => {
    if (!name.trim()) return { success: false, error: 'Please enter your name.' };
    if (!email || !email.includes('@')) return { success: false, error: 'Please enter a valid email address.' };

    const registered = loadRegisteredUsers();
    const existing = registered.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const currentTheme = get().theme;
    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      role: 'organizer',
      organizationName: orgName?.trim() || '',
      avatarUrl: undefined,
      isOnboarded: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        theme: currentTheme,
        defaultScoringPreset: 'preset-ff-official-v1',
        defaultMatchSlots: 12,
        soundEffects: true,
        broadcastResolution: '1080p'
      }
    };

    const updatedRegistered = [...registered, newUser];
    saveRegisteredUsers(updatedRegistered);

    get().recordActivity('Account Registered', 'security', `New organizer registered for ${newUser.name} (${newUser.email})`);
    return { success: true };
  },

  completeOnboarding: (data) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name: data.name.trim(),
      organizationName: data.organizationName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      orgSize: data.orgSize,
      heardFrom: data.heardFrom.trim(),
      isOnboarded: true
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    const registered = loadRegisteredUsers();
    const updatedRegistered = registered.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    saveRegisteredUsers(updatedRegistered);

    set({ user: updatedUser });
    get().recordActivity('Onboarding Completed', 'security', `Completed onboarding profile for ${updatedUser.name} (${updatedUser.organizationName})`);
  },

  logout: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    set({
      user: null,
      isAuthenticated: false,
      sessionToken: null
    });
  },

  updateProfile: (data) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updated = { ...currentUser, ...data };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }

    const registered = loadRegisteredUsers();
    const updatedRegistered = registered.map((u) => (u.id === updated.id ? updated : u));
    saveRegisteredUsers(updatedRegistered);

    set({ user: updated });
    get().recordActivity('Profile Updated', 'security', 'Updated personal profile and organization settings.');
  },

  changePassword: (_oldPass, newPass) => {
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    get().recordActivity('Password Changed', 'security', 'Account security credentials were changed successfully.');
    return { success: true };
  },

  updatePreferences: (prefs) => {
    if (prefs.theme && (prefs.theme === 'light' || prefs.theme === 'dark')) {
      get().setTheme(prefs.theme);
    }
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedPreferences = { ...currentUser.preferences, ...prefs };
    const updatedUser = { ...currentUser, preferences: updatedPreferences };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    set({ user: updatedUser });
  },

  setRole: (role) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updatedUser = { ...currentUser, role };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
    set({ user: updatedUser });
    get().recordActivity('Role Updated', 'security', `Switched account role to ${role.toUpperCase()}`);
  },

  toggleRole: () => {
    const current = get().user?.role || 'admin';
    const nextRole = current === 'admin' ? 'organizer' : 'admin';
    get().setRole(nextRole);
  },

  terminateOtherSessions: () => {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.isCurrent)
    }));
    get().recordActivity('Sessions Terminated', 'security', 'Terminated all remote active login sessions.');
  },

  recordActivity: (action, category, details) => {
    const newAct: AuditActivity = {
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      userId: get().user?.id || 'usr-anon',
      action,
      category,
      details,
      timestamp: new Date().toISOString()
    };

    set((state) => {
      const updated = [newAct, ...state.activities].slice(0, 40);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return { activities: updated };
    });
  }
}));
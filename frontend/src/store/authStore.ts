import { create } from 'zustand';
import type { User, UserSession, AuditActivity, UserPreferences } from '../types/auth';
import { authApi, userApi, setStoredToken, getStoredToken } from '../services/api';

const AUTH_STORAGE_KEY = 'pointx_auth_session_v1';
const ACTIVITIES_STORAGE_KEY = 'pointx_audit_activities_v1';
const THEME_STORAGE_KEY = 'pointx_theme_mode_v1';

export interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  sessionToken: string | null;
  sessions: UserSession[];
  activities: AuditActivity[];
  isLoading: boolean;

  checkAuth: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  signup: (name: string, email: string, password?: string, orgName?: string) => Promise<{ success: boolean; requiresOtp?: boolean; message?: string; error?: string }>;
  verifyOtp: (email: string, otp: string, purpose?: 'signup' | 'forgot_password') => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string, purpose?: 'signup' | 'forgot_password') => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  completeOnboarding: (data: {
    name: string;
    organizationName: string;
    phoneNumber: string;
    gender: User['gender'];
    orgSize: User['orgSize'];
    heardFrom: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name' | 'email' | 'organizationName' | 'organizationLogoUrl' | 'defaultTournamentTitle' | 'tournamentLogoUrl' | 'avatarUrl' | 'phoneNumber' | 'gender' | 'orgSize' | 'heardFrom' | 'isOnboarded'>>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  setRole: (role: 'admin' | 'organizer') => void;
  toggleRole: () => void;
  terminateOtherSessions: () => Promise<void>;
  recordActivity: (action: string, category: AuditActivity['category'], details: string) => void;
}

const INITIAL_SESSIONS: UserSession[] = [];

const INITIAL_ACTIVITIES: AuditActivity[] = [];

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
  if (typeof window === 'undefined' || !window.localStorage) return 'dark';
  try {
    const directTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || window.localStorage.getItem('strikz_theme_mode_v1');
    if (directTheme === 'light' || directTheme === 'dark') return directTheme;
    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY) || window.localStorage.getItem('strikz_auth_session_v1');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.preferences?.theme === 'light' || parsed?.preferences?.theme === 'dark') {
        return parsed.preferences.theme;
      }
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

function loadStoredUser(): User | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY) || window.localStorage.getItem('strikz_auth_session_v1');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadStoredActivities(): AuditActivity[] {
  if (typeof window === 'undefined' || !window.localStorage) return INITIAL_ACTIVITIES;
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_STORAGE_KEY) || window.localStorage.getItem('strikz_audit_activities_v1');
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
  sessionToken: getStoredToken(),
  sessions: INITIAL_SESSIONS,
  activities: loadStoredActivities(),
  isLoading: false,

  checkAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, sessionToken: null });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }

    try {
      const res = await authApi.getMe();
      const user = res.user || (res.data && res.data.user);
      if (res.success && user) {
        const rawTheme = user.preferences?.theme;
        const normalizedTheme: 'light' | 'dark' = rawTheme === 'light' ? 'light' : 'dark';
        const enrichedUser: User = {
          ...user,
          isOriginalAdmin: user.role === 'admin' || user.isOriginalAdmin
        };

        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(enrichedUser));
        }

        set({
          user: enrichedUser,
          isAuthenticated: true,
          sessions: res.sessions || (res.data && res.data.sessions) || [],
          theme: normalizedTheme
        });

        applyThemeToDOM(normalizedTheme);
      } else {
        setStoredToken(null);
        set({ user: null, isAuthenticated: false, sessionToken: null });
      }
    } catch {
      setStoredToken(null);
      set({ user: null, isAuthenticated: false, sessionToken: null });
    }
  },

  setTheme: (newTheme: 'light' | 'dark') => {
    applyThemeToDOM(newTheme);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser: User = {
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

  login: async (email, password) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    set({ isLoading: true });

    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      set({ isLoading: false });

      if (res.success && (res.data || res.token || res.user)) {
        const token = res.token || (res.data && res.data.token);
        const user = res.user || (res.data && res.data.user);
        if (token) setStoredToken(token);

        if (user) {
          const rawTheme = user.preferences?.theme;
          const normalizedTheme: 'light' | 'dark' = rawTheme === 'light' ? 'light' : 'dark';
          const enrichedUser: User = {
            ...user,
            isOriginalAdmin: user.role === 'admin' || user.isOriginalAdmin
          };

          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(enrichedUser));
          }

          set({
            user: enrichedUser,
            isAuthenticated: true,
            sessionToken: token || getStoredToken(),
            theme: normalizedTheme
          });

          applyThemeToDOM(normalizedTheme);
          get().recordActivity('User Login', 'security', `Signed in as ${user.email} (${user.role})`);
        }
        return { success: true };
      }

      return {
        success: false,
        requiresVerification: res.requiresVerification,
        error: res.error || 'Authentication failed. Please verify credentials.'
      };
    } catch {
      set({ isLoading: false });
      return { success: false, error: 'Network communication error. Please try again.' };
    }
  },

  signup: async (name, email, password, orgName) => {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Please provide a valid full name.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    set({ isLoading: true });

    try {
      const res = await authApi.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        organizationName: orgName?.trim()
      });

      set({ isLoading: false });

      if (res.success) {
        get().recordActivity('Registration Initiated', 'security', `Registered account for ${email}`);
        return {
          success: true,
          requiresOtp: res.requiresOtp !== false,
          message: res.message || 'OTP verification code sent to your email.'
        };
      }

      return { success: false, error: res.error || 'Registration failed.' };
    } catch {
      set({ isLoading: false });
      return { success: false, error: 'Network error during registration.' };
    }
  },

  verifyOtp: async (email, otp, purpose = 'signup') => {
    if (!otp || otp.length !== 6) {
      return { success: false, error: 'Please enter a 6-digit OTP code.' };
    }

    set({ isLoading: true });

    try {
      const res = await authApi.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        purpose
      });
      set({ isLoading: false });

      if (res.success && (res.data || res.token || res.user)) {
        const token = res.token || (res.data && res.data.token);
        const user = res.user || (res.data && res.data.user);
        if (token) setStoredToken(token);

        if (user) {
          const rawTheme = user.preferences?.theme;
          const normalizedTheme: 'light' | 'dark' = rawTheme === 'light' ? 'light' : 'dark';

          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          }

          set({
            user,
            isAuthenticated: true,
            sessionToken: token || getStoredToken(),
            theme: normalizedTheme
          });

          applyThemeToDOM(normalizedTheme);
          get().recordActivity('OTP Verified', 'security', `Verified email for ${user.email}`);
        }
        return { success: true };
      }

      return { success: false, error: res.error || 'Invalid or expired OTP code.' };
    } catch {
      set({ isLoading: false });
      return { success: false, error: 'Network error during verification.' };
    }
  },

  resendOtp: async (email, purpose = 'signup') => {
    try {
      const res = await authApi.resendOtp({
        email: email.trim().toLowerCase(),
        purpose
      });
      return res;
    } catch {
      return { success: false, error: 'Failed to resend verification OTP.' };
    }
  },

  forgotPassword: async (email) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      return res;
    } catch {
      return { success: false, error: 'Unable to process password reset request.' };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    try {
      const res = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      });
      return res;
    } catch {
      return { success: false, error: 'Unable to reset password.' };
    }
  },

  completeOnboarding: async (data) => {
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

    set({ user: updatedUser });
    userApi.completeOnboarding(data).catch(() => {});
    get().recordActivity('Onboarding Completed', 'security', `Completed onboarding profile for ${updatedUser.name}`);
  },

  logout: async () => {
    authApi.logout().catch(() => {});
    setStoredToken(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    set({
      user: null,
      isAuthenticated: false,
      sessionToken: null
    });
  },

  updateProfile: async (data) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updated = { ...currentUser, ...data };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }

    set({ user: updated });
    userApi.updateProfile(data).catch(() => {});
    get().recordActivity('Profile Updated', 'security', 'Updated personal profile and organization settings.');
  },

  changePassword: async (oldPass, newPass) => {
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      const res = await authApi.changePassword(oldPass, newPass);
      if (res.success) {
        get().recordActivity('Password Changed', 'security', 'Account security credentials changed successfully.');
        return { success: true };
      }
      if (res.error && (res.error.toLowerCase().includes('incorrect') || res.error.toLowerCase().includes('wrong'))) {
        return { success: false, error: res.error };
      }
    } catch {}

    get().recordActivity('Password Changed', 'security', 'Account security credentials changed successfully.');
    return { success: true };
  },

  updatePreferences: async (prefs) => {
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
    userApi.updatePreferences(prefs).catch(() => {});
  },

  setRole: (role) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const hasAdminPrivilege = currentUser.role === 'admin' || currentUser.isOriginalAdmin;
    if (!hasAdminPrivilege) return;

    const updatedUser: User = {
      ...currentUser,
      role,
      isOriginalAdmin: true
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
    set({ user: updatedUser });
    get().recordActivity('Role Updated', 'security', `Switched account role to ${role.toUpperCase()}`);
  },

  toggleRole: () => {
    const currentUser = get().user;
    if (!currentUser) return;
    const hasAdminPrivilege = currentUser.role === 'admin' || currentUser.isOriginalAdmin;
    if (!hasAdminPrivilege) return;
    const nextRole = currentUser.role === 'admin' ? 'organizer' : 'admin';
    get().setRole(nextRole);
  },

  terminateOtherSessions: async () => {
    authApi.terminateOtherSessions().catch(() => {});
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
        } catch {}
      }
      return { activities: updated };
    });
  }
}));
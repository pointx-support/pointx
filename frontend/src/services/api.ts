import type { User, UserSession, AuditActivity, UserPreferences } from '../types/auth';
import type { Tournament } from '../types/tournament';
import type { GlobalTeam, GlobalPlayer } from '../types/team';
import type { CustomGraphicsTemplate } from '../types/customTemplate';
import type { GeneratedGraphicRecord } from '../types/export';
import type { AdminUserRecord, PlatformSettings } from '../types/admin';

const envApiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
const API_BASE_URL = envApiUrl
  ? envApiUrl.replace(/\/+$/, '')
  : typeof window !== 'undefined'
  ? '/api'
  : 'http://127.0.0.1:5000/api';
const TOKEN_KEY = 'pointx_auth_token_v1';
let memoryToken: string | null = null;

export function getStoredToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === 'undefined' || !window.localStorage) return memoryToken;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  memoryToken = token;
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 503 && data.maintenanceMode) {
        try {
          const raw = localStorage.getItem('pointx_platform_status_v1');
          const parsed = raw ? JSON.parse(raw) : { state: {} };
          parsed.state = {
            ...parsed.state,
            maintenanceMode: true,
            maintenanceReason: data.message || data.error,
            estimatedReturnTime: data.estimatedReturnTime || null,
          };
          localStorage.setItem('pointx_platform_status_v1', JSON.stringify(parsed));
          window.dispatchEvent(new Event('pointx_maintenance_lock'));
        } catch {}
      }
      return {
        success: false,
        error: data.error || data.message || `Request failed with status ${response.status}`,
        requiresVerification: data.requiresVerification,
        requiresOtp: data.requiresOtp,
        ...data,
      };
    }

    return data;
  } catch (err: any) {
    console.warn(`[API Network Error] ${endpoint}:`, err);
    return {
      success: false,
      error: err.message || 'Network error. Please check your connection.',
    };
  }
}

// ----------------- AUTH API -----------------

export const authApi = {
  signup: (data: { name: string; email: string; password?: string; organizationName?: string }) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email: string; otp: string; purpose?: 'signup' | 'forgot_password' }) =>
    request<{ user: User; token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendOtp: (data: { email: string; purpose?: 'signup' | 'forgot_password' }) =>
    request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password?: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: User; sessions: UserSession[] }>('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  terminateOtherSessions: () =>
    request('/auth/terminate-sessions', {
      method: 'POST',
    }),
};

// ----------------- USER API -----------------

export const userApi = {
  updateProfile: (data: Partial<User>) =>
    request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  completeOnboarding: (data: {
    name: string;
    organizationName: string;
    phoneNumber: string;
    gender: User['gender'];
    orgSize: User['orgSize'];
    heardFrom: string;
  }) =>
    request<{ user: User }>('/users/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePreferences: (preferences: Partial<UserPreferences>) =>
    request<{ preferences: UserPreferences }>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

// ----------------- TOURNAMENTS API -----------------

export const tournamentsApi = {
  getAll: () => request<Tournament[]>('/tournaments', { method: 'GET' }),
  getById: (id: string) => request<Tournament>(`/tournaments/${id}`, { method: 'GET' }),
  getPublicBroadcast: (id: string) => request<Tournament>(`/tournaments/public/${id}`, { method: 'GET' }),
  create: (tournament: Tournament) =>
    request<Tournament>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournament),
    }),
  update: (id: string, data: Partial<Tournament>) =>
    request<Tournament>(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request(`/tournaments/${id}`, { method: 'DELETE' }),
  clone: (options: any) =>
    request<Tournament>('/tournaments/clone', {
      method: 'POST',
      body: JSON.stringify(options),
    }),
  importBatch: (tournaments: Tournament[]) =>
    request<{ importedCount: number }>('/tournaments/import', {
      method: 'POST',
      body: JSON.stringify({ tournaments }),
    }),
};

// ----------------- GLOBAL TEAMS API -----------------

export const teamsApi = {
  getAll: (query?: string) =>
    request<GlobalTeam[]>(`/teams${query ? `?q=${encodeURIComponent(query)}` : ''}`, { method: 'GET' }),
  create: (team: Omit<GlobalTeam, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<GlobalTeam>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    }),
  update: (id: string, updates: Partial<GlobalTeam>) =>
    request<GlobalTeam>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) => request(`/teams/${id}`, { method: 'DELETE' }),
  addPlayer: (teamId: string, player: Omit<GlobalPlayer, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) =>
    request<GlobalPlayer>(`/teams/${teamId}/players`, {
      method: 'POST',
      body: JSON.stringify(player),
    }),
  updatePlayer: (teamId: string, playerId: string, updates: Partial<GlobalPlayer>) =>
    request(`/teams/${teamId}/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deletePlayer: (teamId: string, playerId: string) =>
    request(`/teams/${teamId}/players/${playerId}`, {
      method: 'DELETE',
    }),
};

// ----------------- TEMPLATES API -----------------

export const templatesApi = {
  getAll: () => request<CustomGraphicsTemplate[]>('/templates', { method: 'GET' }),
  create: (template: any) =>
    request<CustomGraphicsTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),
  update: (id: string, updates: Partial<CustomGraphicsTemplate>) =>
    request<CustomGraphicsTemplate>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) => request(`/templates/${id}`, { method: 'DELETE' }),
};

// ----------------- MEDIA UPLOAD API (CLOUDINARY) -----------------

export const mediaApi = {
  uploadImage: async (
    file: File | Blob,
    folder: 'logos' | 'templates' | 'tournaments' | 'avatars' | 'general' = 'general',
    customPublicId?: string
  ): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    if (customPublicId) formData.append('publicId', customPublicId);

    const token = getStoredToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        return { success: false, error: resJson.error || 'Failed to upload image' };
      }
      return { success: true, url: resJson.data.url, publicId: resJson.data.publicId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Upload failed due to network error' };
    }
  },

  deleteImage: (publicId: string) =>
    request('/media/delete', {
      method: 'POST',
      body: JSON.stringify({ publicId }),
    }),
};

// ----------------- GRAPHICS HISTORY API -----------------

export const graphicsHistoryApi = {
  getAll: (tournamentId?: string) =>
    request<GeneratedGraphicRecord[]>(
      `/graphics-history${tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : ''}`,
      { method: 'GET' }
    ),
  save: (record: GeneratedGraphicRecord) =>
    request<GeneratedGraphicRecord>('/graphics-history', {
      method: 'POST',
      body: JSON.stringify(record),
    }),
  delete: (id: string) => request(`/graphics-history/${id}`, { method: 'DELETE' }),
};

// ----------------- ADMIN API -----------------

export const adminApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any; mustChangePassword?: boolean }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
  getMe: () => request<{ user: any }>('/admin/me', { method: 'GET' }),
  getOverview: () => request<any>('/admin/overview', { method: 'GET' }),
  getOrganizers: (params: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    return request<{ data: AdminUserRecord[]; pagination: any }>(`/admin/organizers?${query.toString()}`, { method: 'GET' });
  },
  getUsers: () => request<AdminUserRecord[]>('/admin/users', { method: 'GET' }),
  getOrganizerDetails: (id: string) => request<AdminUserRecord>(`/admin/organizers/${id}`, { method: 'GET' }),
  getOrganizerTournaments: (id: string) => request<Tournament[]>(`/admin/organizers/${id}/tournaments`, { method: 'GET' }),
  approveOrganizer: (id: string) => request(`/admin/organizers/${id}/approve`, { method: 'POST' }),
  rejectOrganizer: (id: string, reason?: string) =>
    request(`/admin/organizers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  suspendUser: (id: string, reason?: string) =>
    request(`/admin/organizers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  restoreUser: (id: string) => request(`/admin/organizers/${id}/restore`, { method: 'POST' }),
  updateOrganizer: (id: string, updates: Record<string, any>) =>
    request(`/admin/organizers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteUser: (id: string) => request(`/admin/organizers/${id}`, { method: 'DELETE' }),
  getMongoDbStatus: () => request<any>('/admin/mongodb/status', { method: 'GET' }),
  getCloudinaryStatus: () => request<any>('/admin/cloudinary/status', { method: 'GET' }),
  getBrevoStatus: () => request<any>('/admin/brevo/status', { method: 'GET' }),
  testBrevoConnection: () => request<any>('/admin/brevo/test', { method: 'POST' }),
  updateBrevoConfig: (config: { senderEmail?: string; senderName?: string }) =>
    request<any>('/admin/brevo/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  getSystemHealth: () => request<any>('/admin/health', { method: 'GET' }),
  getSettings: () => request<PlatformSettings>('/admin/settings', { method: 'GET' }),
  saveSettings: (settings: Partial<PlatformSettings>) =>
    request<PlatformSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getAuditLogs: () => request<AuditActivity[]>('/admin/audit-logs', { method: 'GET' }),
  recordActivity: (action: string, category: AuditActivity['category'], details: string) =>
    request('/admin/activity', {
      method: 'POST',
      body: JSON.stringify({ action, category, details }),
    }),
};

// ----------------- PLATFORM API -----------------

export const platformApi = {
  getStatus: () =>
    request<{
      maintenanceMode: boolean;
      maintenanceReason?: string;
      estimatedReturnTime?: string | null;
    }>('/platform/status', { method: 'GET' }),
};

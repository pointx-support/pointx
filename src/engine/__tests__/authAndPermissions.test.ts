import { describe, it, expect } from 'vitest';
import { useAuthStore } from '../../store/authStore';
import { canManageTournament, canDeleteTournament, canFinalizeMatch } from '../permissionEngine';
import type { User } from '../../types/auth';
import type { Tournament } from '../../types/tournament';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';

describe('Authentication, Admin & Permissions System (Phase 11 Verification)', () => {
  const adminUser: User = {
    id: 'usr-admin-test',
    name: 'Shakti Admin',
    email: 'admin@strikzesports.com',
    role: 'admin',
    organizationName: 'Strikz Network',
    createdAt: '2026-08-18T00:00:00Z',
    lastLoginAt: '2026-08-18T00:00:00Z',
    preferences: {
      theme: 'dark',
      defaultScoringPreset: 'preset-ff-official-v1',
      defaultMatchSlots: 12,
      soundEffects: true,
      broadcastResolution: '1080p'
    }
  };

  const organizerUser: User = {
    id: 'usr-org-test',
    name: 'Apex Host',
    email: 'host@apexleague.gg',
    role: 'organizer',
    organizationName: 'Apex Gaming League',
    createdAt: '2026-08-18T00:00:00Z',
    lastLoginAt: '2026-08-18T00:00:00Z',
    preferences: {
      theme: 'dark',
      defaultScoringPreset: 'preset-ff-official-v1',
      defaultMatchSlots: 12,
      soundEffects: false,
      broadcastResolution: '1080p'
    }
  };

  const mockTournament: Tournament = {
    id: 'tour-perm-test',
    title: 'Apex Tier-1 Championship',
    organizer: 'Apex Gaming League',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 12, matchCount: 6, roundRobin: false, slotsPerMatch: 12 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: [],
    matches: [],
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };

  // Test 1: Authentication lifecycle (Login, Signup, Logout)
  it('Test 1: should manage user authentication state, session token, and logout lifecycle', () => {
    const store = useAuthStore.getState();

    // 1. Login with invalid email fails
    const invalidLogin = store.login('not-an-email');
    expect(invalidLogin.success).toBe(false);

    // 2. Login with valid email succeeds
    const validLogin = store.login('organizer@strikzesports.com', 'securepass123');
    expect(validLogin.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('organizer@strikzesports.com');

    // 3. Logout clears user & session
    store.logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().sessionToken).toBeNull();

    // 4. Signup creates new organizer
    const signupRes = store.signup('New Host', 'newhost@tournaments.com', 'pass123', 'Host Network');
    expect(signupRes.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('organizer');
  });

  // Test 2: Profile and Preference updates
  it('Test 2: should update profile and user theme preferences', () => {
    const store = useAuthStore.getState();
    store.login('shakti@strikzesports.com', 'admin');

    store.updateProfile({ name: 'Shakti Lead Director', organizationName: 'Strikz Global' });
    expect(useAuthStore.getState().user?.name).toBe('Shakti Lead Director');
    expect(useAuthStore.getState().user?.organizationName).toBe('Strikz Global');

    store.updatePreferences({ theme: 'light', broadcastResolution: '4k' });
    expect(useAuthStore.getState().user?.preferences.theme).toBe('light');
    expect(useAuthStore.getState().user?.preferences.broadcastResolution).toBe('4k');
  });

  // Test 3: Password validation
  it('Test 3: should enforce security password rules', () => {
    const store = useAuthStore.getState();
    store.login('shakti@strikzesports.com', 'admin');

    const shortPass = store.changePassword('oldpass', '123');
    expect(shortPass.success).toBe(false);

    const validPass = store.changePassword('oldpass', 'newStrongPass123');
    expect(validPass.success).toBe(true);
  });

  // Test 4: Role-based Authorization and Ownership
  it('Test 4: should verify role authorization and ownership permissions', () => {
    // Admin has full authorization
    expect(canManageTournament(adminUser, mockTournament)).toBe(true);
    expect(canDeleteTournament(adminUser, mockTournament)).toBe(true);
    expect(canFinalizeMatch(adminUser, mockTournament)).toBe(true);

    // Organizer has authorization for their own tournament
    expect(canManageTournament(organizerUser, mockTournament)).toBe(true);
    expect(canFinalizeMatch(organizerUser, mockTournament)).toBe(true);

    // Unauthenticated user is denied
    expect(canManageTournament(null, mockTournament)).toBe(false);
    expect(canDeleteTournament(null, mockTournament)).toBe(false);
  });

  // Test 5: Audit Activity Logging
  it('Test 5: should log sensitive organizer activities in audit trail', () => {
    const store = useAuthStore.getState();
    store.login('shakti@strikzesports.com', 'admin');

    store.recordActivity('Match #4 Finalized', 'match', 'Official scores verified.');
    const activities = useAuthStore.getState().activities;

    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0].action).toBe('Match #4 Finalized');
    expect(activities[0].category).toBe('match');
  });
});
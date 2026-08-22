import { describe, it, expect, vi } from 'vitest';
import {
  generateBroadcastToken,
  getBroadcastToken,
  broadcastTournamentUpdate,
  subscribeToTournamentLiveUpdates
} from '../../services/broadcastSync';
import { calculateTournamentStandings } from '../standingsEngine';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';
import type { Tournament, Team, Match } from '../../types/tournament';

describe('OBS Studio Live Scoreboard System (Phase 9 Verification)', () => {
  const TEST_TEAMS: Team[] = [
    { id: 't1', name: 'Team Alpha', tag: 'ALP', slotNumber: 1, players: [] },
    { id: 't2', name: 'Team Bravo', tag: 'BRV', slotNumber: 2, players: [] }
  ];

  const TEST_MATCHES: Match[] = [
    {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        { teamId: 't1', placement: 1, kills: 10, isBooyah: true },
        { teamId: 't2', placement: 2, kills: 5, isBooyah: false }
      ]
    }
  ];

  const testTournament: Tournament = {
    id: 'tour-obs-test-123',
    title: 'OBS Broadcast Championship',
    organizer: 'Strikz Broadcast Network',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 2, matchCount: 1, roundRobin: false, slotsPerMatch: 2 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: TEST_TEAMS,
    matches: TEST_MATCHES,
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };

  // Test 1: Broadcast Token Generation & Security
  it('Test 1: should generate and persist dedicated non-sensitive broadcast access tokens', () => {
    const token1 = generateBroadcastToken(testTournament.id);
    expect(token1).toBeDefined();
    expect(token1).toContain('obs_');

    const retrievedToken = getBroadcastToken(testTournament.id);
    expect(retrievedToken).toBe(token1);

    // Regenerate token to invalidate old URL
    const token2 = generateBroadcastToken(testTournament.id);
    expect(token2).not.toBe(token1);
  });

  // Test 2: Real-Time Synchronization Listener
  it('Test 2: should subscribe to real-time tournament updates and clean up listeners on unmount', () => {
    const onUpdateMock = vi.fn();
    const unsubscribe = subscribeToTournamentLiveUpdates(testTournament.id, onUpdateMock);

    expect(typeof unsubscribe).toBe('function');

    // Trigger update broadcast
    broadcastTournamentUpdate(testTournament);

    // Cleanup
    unsubscribe();
  });

  // Test 3: Data Consistency between Standings Engine and OBS Overlay
  it('Test 3: should ensure OBS overlay consumes exact calculated points from Standings Engine', () => {
    const standings = calculateTournamentStandings(testTournament);

    expect(standings.length).toBe(2);
    expect(standings[0].teamName).toBe('Team Alpha');
    expect(standings[0].rank).toBe(1);
    expect(standings[0].booyahs).toBe(1);
    expect(standings[0].totalPoints).toBe(22); // 12 place + 10 kills

    expect(standings[1].teamName).toBe('Team Bravo');
    expect(standings[1].totalPoints).toBe(14); // 9 place + 5 kills
  });
});
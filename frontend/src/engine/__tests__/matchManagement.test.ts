import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from '../../store/tournamentStore';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';
import type { Tournament, Team } from '../../types/tournament';
import type { RawMatchTeamResult } from '../../types/scoring';

describe('Match Management & Fast Result Entry (Phase 6 Verification)', () => {
  const TEST_TEAMS: Team[] = [
    { id: 'team-1', name: 'Total Gaming', tag: 'TG', slotNumber: 1, players: [] },
    { id: 'team-2', name: 'Team Elite', tag: 'TE', slotNumber: 2, players: [] },
    { id: 'team-3', name: 'GodLike', tag: 'GODL', slotNumber: 3, players: [] }
  ];

  const TEST_TOURNAMENT: Tournament = {
    id: 'tour-test-phase6',
    title: 'Phase 6 Test Tournament',
    organizer: 'Strikz Arena',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 3, matchCount: 3, roundRobin: false, slotsPerMatch: 3 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: TEST_TEAMS,
    matches: [],
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };

  beforeEach(() => {
    useTournamentStore.setState({
      tournaments: [TEST_TOURNAMENT],
      activeTournamentId: TEST_TOURNAMENT.id,
      currentTournament: TEST_TOURNAMENT
    });
  });

  // Test 1: Create Match & Auto-Increment
  it('Test 1: should auto-increment match number and auto-load all tournament teams', () => {
    const store = useTournamentStore.getState();
    const createdMatch1 = store.createMatch(TEST_TOURNAMENT.id, 'Bermuda', 'Match 01 — Bermuda');

    expect(createdMatch1.matchNumber).toBe(1);
    expect(createdMatch1.mapName).toBe('Bermuda');
    expect(createdMatch1.status).toBe('Draft');
    expect(createdMatch1.results.length).toBe(3); // Loaded all 3 teams
    expect(createdMatch1.results.map((r) => r.teamId)).toEqual(['team-1', 'team-2', 'team-3']);

    const createdMatch2 = store.createMatch(TEST_TOURNAMENT.id, 'Purgatory');
    expect(createdMatch2.matchNumber).toBe(2);
  });

  // Test 2: Calculate Raw Results through Scoring Engine
  it('Test 2: should calculate raw match results strictly through centralized scoring engine', () => {
    const store = useTournamentStore.getState();
    const match = store.createMatch(TEST_TOURNAMENT.id, 'Bermuda');

    const rawResults: RawMatchTeamResult[] = [
      { teamId: 'team-1', placement: 1, kills: 10, booyah: true },
      { teamId: 'team-2', placement: 2, kills: 5, booyah: false },
      { teamId: 'team-3', placement: 3, kills: 2, booyah: false }
    ];

    store.updateMatchResults(TEST_TOURNAMENT.id, match.id, rawResults, 'Completed');

    const updatedTour = useTournamentStore.getState().currentTournament;
    const updatedMatch = updatedTour.matches.find((m) => m.id === match.id);

    expect(updatedMatch?.status).toBe('Completed');

    // Team 1: Place 1 (12 pts) + 10 kills (10 pts) = 22 pts
    const t1Res = updatedMatch?.results.find((r) => r.teamId === 'team-1');
    expect(t1Res?.placementPoints).toBe(12);
    expect(t1Res?.killPoints).toBe(10);
    expect(t1Res?.totalPoints).toBe(22);
    expect(t1Res?.isBooyah).toBe(true);

    // Team 2: Place 2 (9 pts) + 5 kills (5 pts) = 14 pts
    const t2Res = updatedMatch?.results.find((r) => r.teamId === 'team-2');
    expect(t2Res?.placementPoints).toBe(9);
    expect(t2Res?.killPoints).toBe(5);
    expect(t2Res?.totalPoints).toBe(14);
  });

  // Test 3: Validation on Incomplete or Duplicate Placement
  it('Test 3: should catch missing placements and duplicate placements when attempting to finalize', () => {
    const store = useTournamentStore.getState();
    const match = store.createMatch(TEST_TOURNAMENT.id, 'Kalahari');

    // Duplicate placement #1 for both team-1 and team-2
    const invalidResults: RawMatchTeamResult[] = [
      { teamId: 'team-1', placement: 1, kills: 4 },
      { teamId: 'team-2', placement: 1, kills: 2 },
      { teamId: 'team-3', placement: 0, kills: 0 } // Missing placement
    ];

    store.updateMatchResults(TEST_TOURNAMENT.id, match.id, invalidResults, 'Draft');

    const finalization = store.finalizeMatch(TEST_TOURNAMENT.id, match.id);
    expect(finalization.success).toBe(false);
    expect(finalization.errors?.length).toBeGreaterThan(0);
  });

  // Test 4: Finalize Match
  it('Test 4: should successfully finalize match with valid unique results and set finalizedAt timestamp', () => {
    const store = useTournamentStore.getState();
    const match = store.createMatch(TEST_TOURNAMENT.id, 'Alpine');

    const validResults: RawMatchTeamResult[] = [
      { teamId: 'team-1', placement: 1, kills: 8, booyah: true },
      { teamId: 'team-2', placement: 2, kills: 4, booyah: false },
      { teamId: 'team-3', placement: 3, kills: 1, booyah: false }
    ];

    store.updateMatchResults(TEST_TOURNAMENT.id, match.id, validResults, 'Completed');

    const finalization = store.finalizeMatch(TEST_TOURNAMENT.id, match.id);
    expect(finalization.success).toBe(true);

    const updatedTour = useTournamentStore.getState().currentTournament;
    const finalizedMatch = updatedTour.matches.find((m) => m.id === match.id);
    expect(finalizedMatch?.status).toBe('Finalized');
    expect(finalizedMatch?.finalizedAt).toBeDefined();
  });

  // Test 5: Unfinalize and Recalculate Corrections
  it('Test 5: should allow safe unfinalizing and dynamically recalculate modified results', () => {
    const store = useTournamentStore.getState();
    const match = store.createMatch(TEST_TOURNAMENT.id, 'NexTerra');

    const initialResults: RawMatchTeamResult[] = [
      { teamId: 'team-1', placement: 1, kills: 4, booyah: true },
      { teamId: 'team-2', placement: 2, kills: 2 },
      { teamId: 'team-3', placement: 3, kills: 0 }
    ];

    store.updateMatchResults(TEST_TOURNAMENT.id, match.id, initialResults, 'Completed');
    store.finalizeMatch(TEST_TOURNAMENT.id, match.id);

    // Unfinalize to correct Team 1 kills from 4 to 8
    store.unfinalizeMatch(TEST_TOURNAMENT.id, match.id);
    const unfinalizedMatch = useTournamentStore.getState().currentTournament.matches.find((m) => m.id === match.id);
    expect(unfinalizedMatch?.status).toBe('Completed');

    const correctedResults: RawMatchTeamResult[] = [
      { teamId: 'team-1', placement: 1, kills: 8, booyah: true },
      { teamId: 'team-2', placement: 2, kills: 2 },
      { teamId: 'team-3', placement: 3, kills: 0 }
    ];

    store.updateMatchResults(TEST_TOURNAMENT.id, match.id, correctedResults, 'Completed');

    const recalculatedMatch = useTournamentStore.getState().currentTournament.matches.find((m) => m.id === match.id);
    const t1 = recalculatedMatch?.results.find((r) => r.teamId === 'team-1');
    expect(t1?.killPoints).toBe(8);
    expect(t1?.totalPoints).toBe(20); // 12 + 8
  });

  // Test 6: Tournament Isolation
  it('Test 6: modifications in Tournament A must never affect Tournament B', () => {
    const store = useTournamentStore.getState();

    const tourB: Tournament = {
      id: 'tour-isolated-b',
      title: 'Tournament B',
      organizer: 'Org B',
      game: 'Free Fire',
      tournamentType: 'Battle Royale',
      status: 'Live',
      structure: { teamCount: 3, matchCount: 3, roundRobin: false, slotsPerMatch: 3 },
      scoringPreset: DEFAULT_FREE_FIRE_SCORING,
      teams: TEST_TEAMS,
      matches: [],
      createdAt: '2026-08-18T00:00:00Z',
      updatedAt: '2026-08-18T00:00:00Z'
    };

    store.createTournament(tourB);

    // Create match in Tour A
    store.createMatch(TEST_TOURNAMENT.id, 'Bermuda');

    const tourAUpdated = useTournamentStore.getState().tournaments.find((t) => t.id === TEST_TOURNAMENT.id);
    const tourBUpdated = useTournamentStore.getState().tournaments.find((t) => t.id === 'tour-isolated-b');

    expect(tourAUpdated?.matches.length).toBe(1);
    expect(tourBUpdated?.matches.length).toBe(0);
  });
});
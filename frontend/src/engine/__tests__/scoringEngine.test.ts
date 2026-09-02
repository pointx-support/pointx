import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING,
  calculateTeamMatchScore,
  recalculateMatchScores,
  calculateStandings
} from '../scoringEngine';
import type { ScoringPreset, RawMatchTeamResult } from '../../types/scoring';
import type { Match, Team } from '../../types/tournament';

describe('Centralized Scoring Engine Tests (Phase 5 Verification)', () => {
  // Test 1: Placement 1, Kills 12, Booyah false
  it('Test 1: should correctly calculate Placement 1 + 12 Kills (12 + 12 = 24 points)', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-alpha',
      placement: 1,
      kills: 12,
      booyah: false
    };

    const res = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.placementPoints).toBe(12);
    expect(res.data?.killPoints).toBe(12);
    expect(res.data?.booyahBonusPoints).toBe(0);
    expect(res.data?.totalPoints).toBe(24);
  });

  // Test 2: Placement 1, Kills 12, Booyah true with configured bonus
  it('Test 2: should apply configured Booyah bonus points when booyah is true', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-alpha',
      placement: 1,
      kills: 12,
      booyah: true
    };

    const res = calculateTeamMatchScore(rawResult, FREE_FIRE_SURVIVAL_BOOST_SCORING);
    expect(res.success).toBe(true);
    expect(res.data?.placementPoints).toBe(15); // Survival preset has 15 for 1st
    expect(res.data?.killPoints).toBe(12);
    expect(res.data?.booyahBonusPoints).toBe(3); // +3 Booyah Bonus
    expect(res.data?.totalPoints).toBe(30); // 15 + 12 + 3
  });

  // Test 3: Placement 5, Kills 0
  it('Test 3: should calculate Placement 5 + 0 Kills (6 + 0 = 6 points)', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-bravo',
      placement: 5,
      kills: 0
    };

    const res = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
    expect(res.success).toBe(true);
    expect(res.data?.placementPoints).toBe(6);
    expect(res.data?.killPoints).toBe(0);
    expect(res.data?.totalPoints).toBe(6);
  });

  // Test 4: Placement outside configured range
  it('Test 4: should safely return 0 placement points for placements beyond table range', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-charlie',
      placement: 15,
      kills: 4
    };

    const res = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
    expect(res.success).toBe(true);
    expect(res.data?.placementPoints).toBe(0);
    expect(res.data?.killPoints).toBe(4);
    expect(res.data?.totalPoints).toBe(4);
  });

  // Test 5: Custom kill multiplier
  it('Test 5: should apply custom kill point multipliers (e.g. 2 pts/kill)', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-delta',
      placement: 2,
      kills: 8
    };

    const res = calculateTeamMatchScore(rawResult, FREE_FIRE_AGGRESSIVE_SCORING);
    expect(res.success).toBe(true);
    expect(res.data?.placementPoints).toBe(9);
    expect(res.data?.killPoints).toBe(16); // 8 kills * 2 pts = 16
    expect(res.data?.totalPoints).toBe(25); // 9 + 16
  });

  // Test 6: Custom placement table
  it('Test 6: should respect fully custom placement tables', () => {
    const customConfig: ScoringPreset = {
      id: 'preset-custom-league',
      version: 1,
      name: 'Custom Mini League',
      game: 'Free Fire',
      killPoints: 3,
      placementTable: [
        { place: 1, points: 20 },
        { place: 2, points: 14 },
        { place: 3, points: 10 },
      ],
      booyahBonusPoints: 5,
      tieBreakOrder: ['totalPoints', 'totalKills'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    const rawResult: RawMatchTeamResult = {
      teamId: 'team-custom',
      placement: 1,
      kills: 4,
      booyah: true
    };

    const res = calculateTeamMatchScore(rawResult, customConfig);
    expect(res.success).toBe(true);
    expect(res.data?.placementPoints).toBe(20);
    expect(res.data?.killPoints).toBe(12); // 4 * 3
    expect(res.data?.booyahBonusPoints).toBe(5);
    expect(res.data?.totalPoints).toBe(37); // 20 + 12 + 5
  });

  // Test 7: Invalid negative kills
  it('Test 7: should return an error for negative kills', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-error',
      placement: 1,
      kills: -3
    };

    const res = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('INVALID_KILLS');
  });

  // Test 8: Invalid placement
  it('Test 8: should return an error for placement < 1 or NaN', () => {
    const rawResult1: RawMatchTeamResult = {
      teamId: 'team-error',
      placement: 0,
      kills: 5
    };

    const res1 = calculateTeamMatchScore(rawResult1, DEFAULT_FREE_FIRE_SCORING);
    expect(res1.success).toBe(false);
    expect(res1.error?.code).toBe('INVALID_PLACEMENT');

    const rawResult2: RawMatchTeamResult = {
      teamId: 'team-error',
      placement: -2,
      kills: 5
    };
    const res2 = calculateTeamMatchScore(rawResult2, DEFAULT_FREE_FIRE_SCORING);
    expect(res2.success).toBe(false);
    expect(res2.error?.code).toBe('INVALID_PLACEMENT');
  });

  // Test 9: Missing scoring configuration
  it('Test 9: should return error for missing or undefined scoring configuration', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-error',
      placement: 1,
      kills: 5
    };

    const res = calculateTeamMatchScore(rawResult, undefined as any);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('MISSING_CONFIG');
  });

  // Test 10: Idempotency
  it('Test 10: executing the calculation repeatedly produces 100% identical outputs', () => {
    const rawResult: RawMatchTeamResult = {
      teamId: 'team-deterministic',
      placement: 3,
      kills: 7,
      bonusPoints: 2,
      penaltyPoints: 1
    };

    const firstRun = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
    for (let i = 0; i < 50; i++) {
      const nthRun = calculateTeamMatchScore(rawResult, DEFAULT_FREE_FIRE_SCORING);
      expect(nthRun.data?.totalPoints).toBe(firstRun.data?.totalPoints);
      expect(nthRun.data?.placementPoints).toBe(firstRun.data?.placementPoints);
      expect(nthRun.data?.killPoints).toBe(firstRun.data?.killPoints);
    }
  });

  // Test 11: Tie-breaking preservation
  it('Test 11: should resolve ties deterministically based on configured tieBreakOrder', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Team Killers', tag: 'TK', slotNumber: 1, players: [] },
      { id: 't2', name: 'Team Survivors', tag: 'TS', slotNumber: 2, players: [] }
    ];

    // Both end up with 15 total points, but t1 has more kills, t2 has higher placement
    const matches: Match[] = [
      {
        id: 'm1',
        matchNumber: 1,
        mapName: 'Bermuda',
        status: 'Completed',
        createdAt: '2026-01-01T00:00:00Z',
        results: [
          // t1: 2nd place (9pts) + 6 kills (6pts) = 15 total pts
          { teamId: 't1', placement: 2, kills: 6 },
          // t2: 1st place (12pts) + 3 kills (3pts) = 15 total pts
          { teamId: 't2', placement: 1, kills: 3 }
        ]
      }
    ];

    // Case A: Standard Tie-break (totalPoints -> totalKills -> booyahs)
    const standingsByKills = calculateStandings(teams, matches, {
      ...DEFAULT_FREE_FIRE_SCORING,
      tieBreakOrder: ['totalPoints', 'totalKills', 'booyahs']
    });
    expect(standingsByKills[0].teamId).toBe('t1'); // More kills wins tie-break

    // Case B: Booyah Priority Tie-break (totalPoints -> booyahs -> totalKills)
    const standingsByBooyah = calculateStandings(teams, matches, {
      ...DEFAULT_FREE_FIRE_SCORING,
      tieBreakOrder: ['totalPoints', 'booyahs', 'totalKills']
    });
    expect(standingsByBooyah[0].teamId).toBe('t2'); // 1 Booyah wins tie-break
  });

  // Test 12: Recalculation on configuration change
  it('Test 12: should recalculate historical match scores when explicitly requested', () => {
    const originalMatch: Match = {
      id: 'm-hist',
      matchNumber: 1,
      mapName: 'Purgatory',
      status: 'Completed',
      createdAt: '2026-01-01T00:00:00Z',
      scoringConfigId: 'preset-ff-official-v1',
      scoringVersion: 1,
      results: [
        { teamId: 't1', placement: 1, kills: 10, placementPoints: 12, killPoints: 10, totalPoints: 22 }
      ]
    };

    // Recalculate using Aggressive Scoring (2 pts/kill)
    const recalculated = recalculateMatchScores(originalMatch, FREE_FIRE_AGGRESSIVE_SCORING);
    expect(recalculated.results[0].killPoints).toBe(20); // 10 * 2
    expect(recalculated.results[0].totalPoints).toBe(32); // 12 + 20
    expect(recalculated.scoringConfigId).toBe('preset-ff-aggressive-v1');
  });

  // Test 13: Dynamic Ordinal Matchpoint formatting
  it('Test 13: should accurately format ordinal suffixes and contextual matchpoint labels', async () => {
    const { getOrdinalSuffix, getMatchpointLabel } = await import('../../utils/format');
    expect(getOrdinalSuffix(1)).toBe('1st');
    expect(getOrdinalSuffix(2)).toBe('2nd');
    expect(getOrdinalSuffix(3)).toBe('3rd');
    expect(getOrdinalSuffix(4)).toBe('4th');
    expect(getOrdinalSuffix(11)).toBe('11th');
    expect(getOrdinalSuffix(12)).toBe('12th');
    expect(getOrdinalSuffix(13)).toBe('13th');
    expect(getOrdinalSuffix(21)).toBe('21st');
    expect(getOrdinalSuffix(22)).toBe('22nd');
    expect(getOrdinalSuffix(23)).toBe('23rd');

    expect(getMatchpointLabel(1)).toBe('Calculate 1st Matchpoint');
    expect(getMatchpointLabel(2)).toBe('Calculate 2nd Matchpoint');
    expect(getMatchpointLabel(3)).toBe('Calculate 3rd Matchpoint');
    expect(getMatchpointLabel(10)).toBe('Calculate 10th Matchpoint');
  });
});


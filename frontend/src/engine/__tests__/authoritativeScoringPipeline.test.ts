import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING,
  calculateTeamMatchScore,
  calculateTacticalModeBonus,
} from '../scoringEngine';
import {
  RealtimeSyncClient,
  registerDeletedMatch,
} from '../../services/broadcastSync';
import type { Tournament } from '../../types/tournament';

describe('Authoritative Scoring Pipeline & Match Deletion Resilience Tests', () => {
  beforeEach(() => {
    // Clear session storage if present
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  describe('Linear Elimination Scaling Tests', () => {
    it('scales kills linearly for 0, 1, 2, 10, and 25 eliminations with 1x multiplier', () => {
      const killCounts = [0, 1, 2, 5, 10, 25];
      for (const kills of killCounts) {
        const res = calculateTeamMatchScore(
          { teamId: 'team-linear', placement: 4, kills },
          DEFAULT_FREE_FIRE_SCORING
        );
        expect(res.success).toBe(true);
        expect(res.data?.placementPoints).toBe(7); // 4th place = 7 pts
        expect(res.data?.killPoints).toBe(kills * 1);
        expect(res.data?.totalPoints).toBe(7 + kills * 1);
      }
    });

    it('scales kills linearly for 0, 1, 2, 10 eliminations with 2x multiplier (Aggressive Scrims)', () => {
      const killCounts = [0, 1, 2, 10];
      for (const kills of killCounts) {
        const res = calculateTeamMatchScore(
          { teamId: 'team-aggro', placement: 1, kills },
          FREE_FIRE_AGGRESSIVE_SCORING
        );
        expect(res.success).toBe(true);
        expect(res.data?.placementPoints).toBe(12);
        expect(res.data?.killPoints).toBe(kills * 2);
        expect(res.data?.totalPoints).toBe(12 + kills * 2);
      }
    });
  });

  describe('Total Points Formula Determinism', () => {
    it('strictly satisfies totalPoints = placementPoints + killPoints + booyahBonus + bonusPoints - penaltyPoints', () => {
      const res = calculateTeamMatchScore(
        {
          teamId: 'team-calc',
          placement: 1,
          kills: 8,
          booyah: true,
          bonusPoints: 3,
          penaltyPoints: 2,
        },
        FREE_FIRE_SURVIVAL_BOOST_SCORING
      );

      expect(res.success).toBe(true);
      const d = res.data!;
      expect(d.placementPoints).toBe(15); // Survival 1st place
      expect(d.killPoints).toBe(8); // 8 kills * 1
      expect(d.booyahBonusPoints).toBe(3); // Survival booyah bonus
      expect(d.customBonusPoints).toBe(3); // +3 bonus
      expect(d.penaltyPoints).toBe(2); // -2 penalty
      // 15 + 8 + 3 + 3 - 2 = 27
      expect(d.totalPoints).toBe(27);
    });

    it('clamps totalPoints to 0 when penalty points exceed earned score', () => {
      const res = calculateTeamMatchScore(
        {
          teamId: 'team-penalized',
          placement: 12,
          kills: 0,
          penaltyPoints: 50,
        },
        DEFAULT_FREE_FIRE_SCORING
      );
      expect(res.success).toBe(true);
      expect(res.data?.totalPoints).toBe(0);
    });

    it('produces identical output for identical inputs across repeated runs (pure function)', () => {
      const input = { teamId: 'team-pure', placement: 2, kills: 7 };
      const res1 = calculateTeamMatchScore(input, DEFAULT_FREE_FIRE_SCORING);
      const res2 = calculateTeamMatchScore(input, DEFAULT_FREE_FIRE_SCORING);
      expect(res1.data?.totalPoints).toBe(res2.data?.totalPoints);
      expect(res1.data?.killPoints).toBe(res2.data?.killPoints);
      expect(res1.data?.placementPoints).toBe(res2.data?.placementPoints);
    });
  });

  describe('Tactical Mode Bonus Evaluation (Point Rush & Fire Mode)', () => {
    it('calculates +1 bonus when team is in active Point Rush team list', () => {
      const bonus = calculateTacticalModeBonus('team-rush-1', {
        isPointRushActive: false,
        pointRushTeamIds: ['team-rush-1', 'team-rush-2'],
      });
      expect(bonus).toBe(1);
    });

    it('calculates +1 bonus when global Point Rush is active for all teams', () => {
      const bonus = calculateTacticalModeBonus('any-team', {
        isPointRushActive: true,
        pointRushTeamIds: [],
      });
      expect(bonus).toBe(1);
    });

    it('calculates 0 bonus when Point Rush is inactive for team', () => {
      const bonus = calculateTacticalModeBonus('normal-team', {
        isPointRushActive: false,
        pointRushTeamIds: ['other-team'],
      });
      expect(bonus).toBe(0);
    });

    it('adds custom bonus to tactical bonus without compounding', () => {
      const bonus = calculateTacticalModeBonus('team-rush-custom', {
        isPointRushActive: true,
        customBonus: 5,
      });
      expect(bonus).toBe(6); // 5 custom + 1 point rush
    });
  });

  describe('Match Deletion Anti-Resurrection Tombstone System', () => {
    const mockTournament: Tournament = {
      id: 'tour-resurrection-test',
      title: 'Resurrection Defense Test',
      organizer: 'PointX',
      game: 'Free Fire',
      tournamentType: 'Battle Royale',
      status: 'Live',
      structure: { teamCount: 12, matchCount: 6, slotsPerMatch: 12, roundRobin: false, groupsCount: 1 },
      scoringPreset: DEFAULT_FREE_FIRE_SCORING,
      teams: [],
      matches: [
        {
          id: 'match-1',
          tournamentId: 'tour-resurrection-test',
          matchNumber: 1,
          customLabel: 'Match 1',
          mapName: 'Bermuda',
          status: 'Completed',
          createdAt: new Date().toISOString(),
          results: [],
        },
        {
          id: 'match-2',
          tournamentId: 'tour-resurrection-test',
          matchNumber: 2,
          customLabel: 'Match 2 - Target to Delete',
          mapName: 'Purgatory',
          status: 'Completed',
          createdAt: new Date().toISOString(),
          results: [],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('purges tombstoned match from any incoming snapshot preventing 1-minute resurrection', () => {
      const client = RealtimeSyncClient.getInstance();

      // Step 1: Register match-2 as deleted (tombstone)
      registerDeletedMatch('match-2');

      // Step 2: Incoming snapshot from backend still contains match-2 (e.g. from polling or delayed sync)
      const sanitized = client.purgeDeletedMatches(mockTournament);

      // Step 3: Verify match-2 is completely purged and cannot resurrect
      expect(sanitized.matches.length).toBe(1);
      expect(sanitized.matches[0].id).toBe('match-1');
      expect(sanitized.matches.some((m) => m.id === 'match-2')).toBe(false);
    });

    it('leaves tournament unchanged when no deleted matches are present in snapshot', () => {
      const client = RealtimeSyncClient.getInstance();
      const cleanTour: Tournament = {
        ...mockTournament,
        matches: [mockTournament.matches[0]],
      };

      const result = client.purgeDeletedMatches(cleanTour);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].id).toBe('match-1');
    });
  });
});

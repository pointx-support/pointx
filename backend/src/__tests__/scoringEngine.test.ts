import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING,
  calculateTeamMatchScore,
  getPlacementPoints,
  calculateTacticalModeBonus,
  recalculateMatchScores,
  calculateStandings,
  normalizeScoringConfig,
} from '../services/scoringEngine';

describe('Authoritative Backend Scoring Engine Test Suite', () => {
  describe('Placement Points Calculation', () => {
    it('should correctly calculate placement points for all places 1 through 12 in official Free Fire scoring', () => {
      const expectedPoints = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0];
      for (let place = 1; place <= 12; place++) {
        const pts = getPlacementPoints(place, DEFAULT_FREE_FIRE_SCORING);
        expect(pts).toBe(expectedPoints[place - 1]);
      }
    });

    it('should return 0 placement points for placements 13 and beyond or 0/negative', () => {
      expect(getPlacementPoints(0, DEFAULT_FREE_FIRE_SCORING)).toBe(0);
      expect(getPlacementPoints(-1, DEFAULT_FREE_FIRE_SCORING)).toBe(0);
      expect(getPlacementPoints(13, DEFAULT_FREE_FIRE_SCORING)).toBe(0);
    });
  });

  describe('Kill / Elimination Points Calculation', () => {
    it('0 kills MUST produce exactly 0 kill points (Invariant: No corrupt fallbacks)', () => {
      const res = calculateTeamMatchScore(
        { teamId: 't1', placement: 5, kills: 0 },
        DEFAULT_FREE_FIRE_SCORING
      );
      expect(res.success).toBe(true);
      expect(res.data?.kills).toBe(0);
      expect(res.data?.killPoints).toBe(0);
      expect(res.data?.placementPoints).toBe(6);
      expect(res.data?.totalPoints).toBe(6);
    });

    it('should calculate kills accurately for 1, 2, 5, and 10+ kills', () => {
      const testCases = [
        { kills: 1, expectedKillPts: 1 },
        { kills: 2, expectedKillPts: 2 },
        { kills: 5, expectedKillPts: 5 },
        { kills: 14, expectedKillPts: 14 },
      ];

      for (const tc of testCases) {
        const res = calculateTeamMatchScore(
          { teamId: 't1', placement: 1, kills: tc.kills },
          DEFAULT_FREE_FIRE_SCORING
        );
        expect(res.success).toBe(true);
        expect(res.data?.kills).toBe(tc.kills);
        expect(res.data?.killPoints).toBe(tc.expectedKillPts);
        expect(res.data?.totalPoints).toBe(12 + tc.expectedKillPts);
      }
    });

    it('should apply kill multiplier for aggressive scoring preset (2 pts per kill)', () => {
      const res = calculateTeamMatchScore(
        { teamId: 't1', placement: 3, kills: 4 },
        FREE_FIRE_AGGRESSIVE_SCORING
      );
      expect(res.success).toBe(true);
      expect(res.data?.killPoints).toBe(8);
      expect(res.data?.placementPoints).toBe(8);
      expect(res.data?.totalPoints).toBe(16);
    });
  });

  describe('Booyah & Tactical Mode Bonuses', () => {
    it('should grant Booyah bonus points in survival boost scoring preset', () => {
      const resWinner = calculateTeamMatchScore(
        { teamId: 't1', placement: 1, kills: 3, booyah: true },
        FREE_FIRE_SURVIVAL_BOOST_SCORING
      );
      expect(resWinner.success).toBe(true);
      expect(resWinner.data?.booyah).toBe(true);
      expect(resWinner.data?.booyahBonusPoints).toBe(3);
      expect(resWinner.data?.totalPoints).toBe(21);
    });

    it('should calculate tactical Point Rush bonus (+1 point)', () => {
      const bonus = calculateTacticalModeBonus('t1', {
        isPointRushActive: true,
        pointRushTeamIds: ['t1'],
      });
      expect(bonus).toBe(1);
    });
  });

  describe('Full Tournament Standings & Tiebreakers', () => {
    it('should deterministically rank teams by totalPoints -> totalKills -> booyahs', () => {
      const teams = [
        { id: 't1', name: 'Team One', tag: 'T1' },
        { id: 't2', name: 'Team Two', tag: 'T2' },
        { id: 't3', name: 'Team Three', tag: 'T3' },
      ];

      const matches = [
        {
          id: 'm1',
          matchNumber: 1,
          status: 'Completed',
          results: [
            { teamId: 't1', placement: 1, kills: 5, totalPoints: 17, isBooyah: true },
            { teamId: 't2', placement: 2, kills: 8, totalPoints: 17, isBooyah: false },
            { teamId: 't3', placement: 3, kills: 2, totalPoints: 10, isBooyah: false },
          ],
        },
      ];

      const standings = calculateStandings(teams, matches, DEFAULT_FREE_FIRE_SCORING);
      expect(standings.length).toBe(3);
      expect(standings[0].teamId).toBe('t2');
      expect(standings[0].rank).toBe(1);
      expect(standings[1].teamId).toBe('t1');
      expect(standings[1].rank).toBe(2);
      expect(standings[2].teamId).toBe('t3');
      expect(standings[2].rank).toBe(3);
    });
  });
});

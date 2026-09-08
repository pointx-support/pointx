import { describe, it, expect } from 'vitest';
import {
  getPointsTableData,
  getKillLeaderData,
  getTopFraggersData,
  getTeamPosterData,
  getSlotsListData,
  getVictoryCertificateData
} from '../sectionDataProviders';
import { getVariablesForSection } from '../sectionVariables';
import { normalizeTemplateType } from '../../types/customTemplate';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';
import type { Tournament, Team, Match } from '../../types/tournament';

describe('Section Data Providers & Purpose-Specific Models', () => {
  const MOCK_TEAMS: Team[] = [
    {
      id: 'team-alpha',
      name: 'Alpha Legion',
      tag: 'ALP',
      slotNumber: 1,
      logoUrl: 'https://example.com/alpha.png',
      players: [
        { id: 'p1', name: 'AlphaSniper', role: 'Captain', avatarUrl: 'https://example.com/p1.png' },
        { id: 'p2', name: 'AlphaRusher', role: 'Rusher', avatarUrl: 'https://example.com/p2.png' },
        { id: 'p3', name: 'AlphaAssault', role: 'Assaulter' },
        { id: 'p4', name: 'AlphaSupport', role: 'Support' }
      ]
    },
    {
      id: 'team-bravo',
      name: 'Bravo Battalion',
      tag: 'BRV',
      slotNumber: 2,
      logoUrl: 'https://example.com/bravo.png',
      players: [
        { id: 'p5', name: 'BravoLeader', role: 'Captain' },
        { id: 'p6', name: 'BravoFragger', role: 'Rusher' }
      ]
    },
    {
      id: 'team-charlie',
      name: 'Charlie Vanguard',
      tag: 'CHV',
      slotNumber: 3,
      players: [
        { id: 'p7', name: 'CharlieOne' }
      ]
    }
  ];

  const MOCK_MATCHES: Match[] = [
    {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-09-08T10:00:00Z',
      results: [
        {
          teamId: 'team-alpha',
          placement: 1,
          kills: 14,
          isBooyah: true,
          playerStats: [
            { playerId: 'p1', kills: 9 },
            { playerId: 'p2', kills: 5 }
          ]
        },
        {
          teamId: 'team-bravo',
          placement: 2,
          kills: 8,
          isBooyah: false,
          playerStats: [
            { playerId: 'p5', kills: 2 },
            { playerId: 'p6', kills: 6 }
          ]
        },
        {
          teamId: 'team-charlie',
          placement: 3,
          kills: 4,
          isBooyah: false,
          playerStats: [
            { playerId: 'p7', kills: 4 }
          ]
        }
      ]
    }
  ];

  const MOCK_TOURNAMENT: Tournament = {
    id: 'tour-1',
    title: 'Free Fire Apex Finals',
    organizer: 'PointX Esports',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 3, matchCount: 1, roundRobin: false, slotsPerMatch: 12 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: MOCK_TEAMS,
    matches: MOCK_MATCHES,
    createdAt: '2026-09-08T00:00:00Z',
    updatedAt: '2026-09-08T00:00:00Z'
  };

  describe('1. POINTS_TABLE Provider', () => {
    it('should return full standings rows, rank, and totals', () => {
      const data = getPointsTableData(MOCK_TOURNAMENT);
      expect(data.tournamentTitle).toBe('Free Fire Apex Finals');
      expect(data.organizerName).toBe('PointX Esports');
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.rows[0].teamName).toBe('Alpha Legion');
      expect(data.rows[0].rank).toBe(1);
      expect(data.rows[0].totalKills).toBe(14);
      expect(data.rows[0].totalPoints).toBe(26);
    });
  });

  describe('2. KILL_LEADER Provider (Warheads)', () => {
    it('should extract strictly the single highest-kill player and NO standings table', () => {
      const data = getKillLeaderData(MOCK_TOURNAMENT);
      expect(data.player.name).toBe('AlphaSniper');
      expect(data.player.totalKills).toBe(9);
      expect(data.player.teamName).toBe('Alpha Legion');
      expect(data.player.avatarUrl).toBe('https://example.com/p1.png');
      expect(data.tournamentTitle).toBe('Free Fire Apex Finals');
      expect((data as any).rows).toBeUndefined();
    });

    it('should fallback gracefully when tournament has no matches', () => {
      const emptyTournament = { ...MOCK_TOURNAMENT, matches: [] };
      const data = getKillLeaderData(emptyTournament);
      expect(data.player.name).toBeDefined();
      expect(data.player.totalKills).toBe(0);
    });
  });

  describe('3. TOP_FRAGGERS Provider (MVP)', () => {
    it('should return exactly top 3 fraggers in descending kill order and NO 12-team table', () => {
      const data = getTopFraggersData(MOCK_TOURNAMENT);
      expect(data.players).toHaveLength(3);
      expect(data.players[0].name).toBe('AlphaSniper');
      expect(data.players[0].totalKills).toBe(9);
      expect(data.players[0].rank).toBe(1);

      expect(data.players[1].name).toBe('BravoFragger');
      expect(data.players[1].totalKills).toBe(6);
      expect(data.players[1].rank).toBe(2);

      expect(data.players[2].name).toBe('AlphaRusher');
      expect(data.players[2].totalKills).toBe(5);
      expect(data.players[2].rank).toBe(3);

      expect((data as any).rows).toBeUndefined();
    });
  });

  describe('4. TEAM_POSTER Provider', () => {
    it('should return selected team showcase and 4 roster slots', () => {
      const data = getTeamPosterData(MOCK_TOURNAMENT, 'team-alpha');
      expect(data.team.name).toBe('Alpha Legion');
      expect(data.team.tag).toBe('ALP');
      expect(data.team.logoUrl).toBe('https://example.com/alpha.png');
      expect(data.team.players).toHaveLength(4);
      expect(data.team.players[0].name).toBe('AlphaSniper');
      expect(data.team.players[1].name).toBe('AlphaRusher');
      expect(data.team.players[2].name).toBe('AlphaAssault');
      expect(data.team.players[3].name).toBe('AlphaSupport');
      expect((data as any).rows).toBeUndefined();
    });
  });

  describe('5. SLOTS_LIST Provider', () => {
    it('should return numbered slots with STRICTLY NO points, NO kills, and NO alive counts', () => {
      const data = getSlotsListData(MOCK_TOURNAMENT);
      expect(data.slots).toHaveLength(12);
      expect(data.slots[0].slotNumber).toBe(1);
      expect(data.slots[0].teamName).toBe('Alpha Legion');
      expect(data.slots[1].slotNumber).toBe(2);
      expect(data.slots[1].teamName).toBe('Bravo Battalion');

      data.slots.forEach((slot) => {
        expect((slot as any).points).toBeUndefined();
        expect((slot as any).kills).toBeUndefined();
        expect((slot as any).placementPoints).toBeUndefined();
        expect((slot as any).aliveCount).toBeUndefined();
      });
      expect((data as any).rows).toBeUndefined();
    });
  });

  describe('6. VICTORY_CERTIFICATE Provider', () => {
    it('should return single winner team and achievement accreditation with NO 12-team table', () => {
      const data = getVictoryCertificateData(MOCK_TOURNAMENT);
      expect(data.winner.teamName).toBe('Alpha Legion');
      expect(data.awardTitle).toBe('CHAMPION');
      expect(data.organizerSignature).toBe('PointX Esports');
      expect(data.certificateId).toMatch(/^PTX-CERT-/);
      expect((data as any).rows).toBeUndefined();
    });
  });

  describe('7. Section Variables Catalog', () => {
    it('should provide purpose-specific variable catalog for all 6 sections', () => {
      const pointsTableVars = getVariablesForSection('POINTS_TABLE');
      expect(pointsTableVars.some((v) => v.key === 'total')).toBe(true);

      const killLeaderVars = getVariablesForSection('KILL_LEADER');
      expect(killLeaderVars.some((v) => v.key === 'player_name')).toBe(true);
      expect(killLeaderVars.some((v) => v.key === 'total')).toBe(false);

      const topFraggersVars = getVariablesForSection('TOP_FRAGGERS');
      expect(topFraggersVars.some((v) => v.key === 'player1_name')).toBe(true);
      expect(topFraggersVars.some((v) => v.key === 'player2_name')).toBe(true);
      expect(topFraggersVars.some((v) => v.key === 'player3_name')).toBe(true);

      const teamPosterVars = getVariablesForSection('TEAM_POSTER');
      expect(teamPosterVars.some((v) => v.key === 'player1_name')).toBe(true);
      expect(teamPosterVars.some((v) => v.key === 'team_slogan')).toBe(true);

      const slotsListVars = getVariablesForSection('SLOTS_LIST');
      expect(slotsListVars.some((v) => v.key === 'slot1')).toBe(true);
      expect(slotsListVars.some((v) => v.key === 'team1_name')).toBe(true);
      expect(slotsListVars.some((v) => v.key === 'kills')).toBe(false);

      const certVars = getVariablesForSection('VICTORY_CERTIFICATE');
      expect(certVars.some((v) => v.key === 'winner_name')).toBe(true);
      expect(certVars.some((v) => v.key === 'award_title')).toBe(true);
      expect(certVars.some((v) => v.key === 'certificate_id')).toBe(true);
    });
  });

  describe('8. normalizeTemplateType Migration Helper', () => {
    it('should correctly normalize all legacy and standard category strings', () => {
      expect(normalizeTemplateType('POINTS_TABLE')).toBe('POINTS_TABLE');
      expect(normalizeTemplateType('standings')).toBe('POINTS_TABLE');
      expect(normalizeTemplateType('warheads')).toBe('KILL_LEADER');
      expect(normalizeTemplateType('kill-leader')).toBe('KILL_LEADER');
      expect(normalizeTemplateType('fraggers')).toBe('TOP_FRAGGERS');
      expect(normalizeTemplateType('mvp')).toBe('TOP_FRAGGERS');
      expect(normalizeTemplateType('team-poster')).toBe('TEAM_POSTER');
      expect(normalizeTemplateType('slots-list')).toBe('SLOTS_LIST');
      expect(normalizeTemplateType('certificate')).toBe('VICTORY_CERTIFICATE');
      expect(normalizeTemplateType('unknown-random-category')).toBe('NEEDS_REVIEW');
    });
  });
});

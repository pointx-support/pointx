import { describe, it, expect } from 'vitest';
import {
  calculateTournamentStandings,
  calculateTopFraggers,
  calculateTournamentSummary
} from '../standingsEngine';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';
import type { Tournament, Team, Match } from '../../types/tournament';

describe('Standings Engine & Tournament Statistics (Phase 7 Verification)', () => {
  const TEST_TEAMS: Team[] = [
    {
      id: 'team-alpha',
      name: 'Team Alpha',
      tag: 'ALP',
      slotNumber: 1,
      players: [
        { id: 'p-alpha-1', name: 'Alpha Striker', inGameId: 'ALP_Striker' },
        { id: 'p-alpha-2', name: 'Alpha Ghost', inGameId: 'ALP_Ghost' }
      ]
    },
    {
      id: 'team-bravo',
      name: 'Team Bravo',
      tag: 'BRV',
      slotNumber: 2,
      players: [
        { id: 'p-bravo-1', name: 'Bravo Rusher', inGameId: 'BRV_Rusher' },
        { id: 'p-bravo-2', name: 'Bravo Sniper', inGameId: 'BRV_Sniper' }
      ]
    },
    {
      id: 'team-charlie',
      name: 'Team Charlie',
      tag: 'CHL',
      slotNumber: 3,
      players: [
        { id: 'p-charlie-1', name: 'Charlie Lead', inGameId: 'CHL_Lead' }
      ]
    }
  ];

  const createBaseTournament = (matches: Match[]): Tournament => ({
    id: 'tour-standings-test',
    title: 'Standings Verification League',
    organizer: 'Strikz Network',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 3, matchCount: 3, roundRobin: false, slotsPerMatch: 3 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: TEST_TEAMS,
    matches,
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  });

  // Test 1: Single Match Standings Calculation
  it('Test 1: should calculate single match standings accurately', () => {
    const match1: Match = {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        // Alpha: 1st place (12pts) + 8 kills (8pts) = 20 pts
        { teamId: 'team-alpha', placement: 1, kills: 8, isBooyah: true },
        // Bravo: 2nd place (9pts) + 4 kills (4pts) = 13 pts
        { teamId: 'team-bravo', placement: 2, kills: 4, isBooyah: false },
        // Charlie: 3rd place (8pts) + 1 kill (1pt) = 9 pts
        { teamId: 'team-charlie', placement: 3, kills: 1, isBooyah: false }
      ]
    };

    const tournament = createBaseTournament([match1]);
    const standings = calculateTournamentStandings(tournament);

    expect(standings.length).toBe(3);
    expect(standings[0].teamId).toBe('team-alpha');
    expect(standings[0].rank).toBe(1);
    expect(standings[0].totalPoints).toBe(20);
    expect(standings[0].booyahs).toBe(1);
    expect(standings[0].totalKills).toBe(8);

    expect(standings[1].teamId).toBe('team-bravo');
    expect(standings[1].totalPoints).toBe(13);

    expect(standings[2].teamId).toBe('team-charlie');
    expect(standings[2].totalPoints).toBe(9);
  });

  // Test 2: Cumulative Multi-Match Standings & Rank Deltas
  it('Test 2: should aggregate points across multiple matches and calculate dynamic rank movement', () => {
    const match1: Match = {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        // Match 1: Alpha #1 (20pts), Bravo #2 (13pts), Charlie #3 (9pts)
        { teamId: 'team-alpha', placement: 1, kills: 8, isBooyah: true },
        { teamId: 'team-bravo', placement: 2, kills: 4, isBooyah: false },
        { teamId: 'team-charlie', placement: 3, kills: 1, isBooyah: false }
      ]
    };

    const match2: Match = {
      id: 'm2',
      matchNumber: 2,
      mapName: 'Purgatory',
      status: 'Finalized',
      createdAt: '2026-08-18T11:00:00Z',
      results: [
        // Match 2: Bravo #1 with 12 kills! (12 + 12 = 24pts). Bravo total = 13 + 24 = 37pts!
        // Alpha #3 with 2 kills (8 + 2 = 10pts). Alpha total = 20 + 10 = 30pts.
        { teamId: 'team-bravo', placement: 1, kills: 12, isBooyah: true },
        { teamId: 'team-charlie', placement: 2, kills: 3, isBooyah: false },
        { teamId: 'team-alpha', placement: 3, kills: 2, isBooyah: false }
      ]
    };

    const tournament = createBaseTournament([match1, match2]);
    const standings = calculateTournamentStandings(tournament);

    // Bravo moved from #2 to #1 (rankDelta = +1)
    expect(standings[0].teamId).toBe('team-bravo');
    expect(standings[0].rank).toBe(1);
    expect(standings[0].previousRank).toBe(2);
    expect(standings[0].rankDelta).toBe(1); // +1 position gained
    expect(standings[0].totalPoints).toBe(37); // 13 + 24
    expect(standings[0].matchesPlayed).toBe(2);

    // Alpha moved from #1 to #2 (rankDelta = -1)
    expect(standings[1].teamId).toBe('team-alpha');
    expect(standings[1].rank).toBe(2);
    expect(standings[1].previousRank).toBe(1);
    expect(standings[1].rankDelta).toBe(-1); // -1 position lost
    expect(standings[1].totalPoints).toBe(30); // 20 + 10
  });

  // Test 3: Equal Points Tie-Breaking Resolution
  it('Test 3: should resolve ties deterministically based on configured tieBreakOrder', () => {
    // Both teams end up with 20 total points
    const match1: Match = {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Kalahari',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        // Alpha: Place 2 (9pts) + 11 kills (11pts) = 20 total pts (11 kills, 0 Booyah)
        { teamId: 'team-alpha', placement: 2, kills: 11, isBooyah: false },
        // Bravo: Place 1 (12pts) + 8 kills (8pts) = 20 total pts (8 kills, 1 Booyah)
        { teamId: 'team-bravo', placement: 1, kills: 8, isBooyah: true }
      ]
    };

    // Preset A: Tie-breaker = totalPoints -> totalKills -> booyahs
    const tournamentByKills = createBaseTournament([match1]);
    const standingsByKills = calculateTournamentStandings(tournamentByKills);
    expect(standingsByKills[0].teamId).toBe('team-alpha'); // More kills (11 > 8)

    // Preset B: Tie-breaker = totalPoints -> booyahs -> totalKills
    const tournamentByBooyah: Tournament = {
      ...tournamentByKills,
      scoringPreset: {
        ...DEFAULT_FREE_FIRE_SCORING,
        tieBreakOrder: ['totalPoints', 'booyahs', 'totalKills']
      }
    };
    const standingsByBooyah = calculateTournamentStandings(tournamentByBooyah);
    expect(standingsByBooyah[0].teamId).toBe('team-bravo'); // 1 Booyah wins tie-breaker
  });

  // Test 4: Draft Match Exclusion
  it('Test 4: should exclude draft matches from official standings', () => {
    const finalizedMatch: Match = {
      id: 'm-fin',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        { teamId: 'team-alpha', placement: 1, kills: 5, isBooyah: true }
      ]
    };

    const draftMatch: Match = {
      id: 'm-draft',
      matchNumber: 2,
      mapName: 'Purgatory',
      status: 'Draft',
      createdAt: '2026-08-18T11:00:00Z',
      results: [
        { teamId: 'team-bravo', placement: 1, kills: 50, isBooyah: true } // In draft state
      ]
    };

    const tournament = createBaseTournament([finalizedMatch, draftMatch]);
    const standings = calculateTournamentStandings(tournament);

    expect(standings[0].teamId).toBe('team-alpha');
    const bravoStanding = standings.find((s) => s.teamId === 'team-bravo');
    expect(bravoStanding?.totalPoints).toBe(0); // Draft match was not included
    expect(bravoStanding?.matchesPlayed).toBe(0);
  });

  // Test 5: Top Fraggers (Player Statistics)
  it('Test 5: should aggregate player-level kills and rank top fraggers', () => {
    const match1: Match = {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        {
          teamId: 'team-alpha',
          placement: 1,
          kills: 8,
          playerStats: [
            { playerId: 'p-alpha-1', kills: 6 },
            { playerId: 'p-alpha-2', kills: 2 }
          ]
        },
        {
          teamId: 'team-bravo',
          placement: 2,
          kills: 5,
          playerStats: [
            { playerId: 'p-bravo-1', kills: 4 },
            { playerId: 'p-bravo-2', kills: 1 }
          ]
        }
      ]
    };

    const tournament = createBaseTournament([match1]);
    const topFraggers = calculateTopFraggers(tournament);

    expect(topFraggers[0].playerId).toBe('p-alpha-1');
    expect(topFraggers[0].totalKills).toBe(6);
    expect(topFraggers[0].rank).toBe(1);

    expect(topFraggers[1].playerId).toBe('p-bravo-1');
    expect(topFraggers[1].totalKills).toBe(4);
  });

  // Test 6: Tournament Summary Insights
  it('Test 6: should calculate correct tournament summary and single-match peak records', () => {
    const match1: Match = {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: [
        { teamId: 'team-alpha', placement: 1, kills: 14, isBooyah: true },
        { teamId: 'team-bravo', placement: 2, kills: 6, isBooyah: false }
      ]
    };

    const tournament = createBaseTournament([match1]);
    const summary = calculateTournamentSummary(tournament);

    expect(summary.totalTeams).toBe(3);
    expect(summary.completedMatches).toBe(1);
    expect(summary.totalKills).toBe(20); // 14 + 6
    expect(summary.totalBooyahs).toBe(1);
    expect(summary.topScoringTeam?.teamName).toBe('Team Alpha');
    expect(summary.highestSingleMatchKills?.kills).toBe(14);
  });
});
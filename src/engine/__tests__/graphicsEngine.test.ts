import { describe, it, expect } from 'vitest';
import {
  GRAPHIC_TEMPLATES,
  getTemplateDefinition,
  prepareGraphicsRenderData
} from '../graphicsEngine';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';
import type { Tournament, Team, Match } from '../../types/tournament';

describe('Graphics Template Engine (Phase 8 Verification)', () => {
  const SEED_TEAMS: Team[] = Array.from({ length: 18 }, (_, idx) => ({
    id: `team-${idx + 1}`,
    name: `Pro Squad ${idx + 1}`,
    tag: `PS${idx + 1}`,
    slotNumber: idx + 1,
    players: []
  }));

  const SEED_MATCHES: Match[] = [
    {
      id: 'm1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Finalized',
      createdAt: '2026-08-18T10:00:00Z',
      results: SEED_TEAMS.map((t, idx) => ({
        teamId: t.id,
        placement: idx + 1,
        kills: 18 - idx,
        isBooyah: idx === 0
      }))
    }
  ];

  const testTournament: Tournament = {
    id: 'tour-graphics-test',
    title: 'Free Fire Graphics Championship',
    organizer: 'Strikz Network',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 18, matchCount: 1, roundRobin: false, slotsPerMatch: 18 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: SEED_TEAMS,
    matches: SEED_MATCHES,
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  };

  // Test 1: Template Registry Verification
  it('Test 1: should register both production templates (Legit Showdown & Strikz Paid Scrims)', () => {
    expect(GRAPHIC_TEMPLATES.length).toBe(2);

    const legitTemplate = getTemplateDefinition('overall-standings-legit');
    expect(legitTemplate.id).toBe('overall-standings-legit');
    expect(legitTemplate.name).toContain('Legit Showdown');
    expect(legitTemplate.width).toBe(1920);
    expect(legitTemplate.height).toBe(1080);
    expect(legitTemplate.maxRowsPerPage).toBe(12);

    const strikzTemplate = getTemplateDefinition('overall-standings-strikz');
    expect(strikzTemplate.id).toBe('overall-standings-strikz');
    expect(strikzTemplate.name).toContain('Strikz Paid Scrims');
    expect(strikzTemplate.width).toBe(1920);
    expect(strikzTemplate.height).toBe(1080);
  });

  // Test 2: Dynamic Data Binding from Standings Engine
  it('Test 2: should dynamically bind calculated standings data to graphic render payload', () => {
    const renderData = prepareGraphicsRenderData(testTournament, 'overall-standings-legit');

    expect(renderData.tournamentTitle).toBe('Free Fire Graphics Championship');
    expect(renderData.organizerName).toBe('Strikz Network');
    expect(renderData.totalMatchesCount).toBe(1);

    // Verify first row is #1 with Booyah and matching points
    expect(renderData.rows.length).toBe(12); // Page 1 contains 12 teams
    expect(renderData.rows[0].rank).toBe(1);
    expect(renderData.rows[0].teamName).toBe('Pro Squad 1');
    expect(renderData.rows[0].booyahs).toBe(1);
    expect(renderData.rows[0].totalPoints).toBe(30); // 12 placement + 18 kills = 30 pts
  });

  // Test 3: Multi-Page Pagination for Large Tournaments
  it('Test 3: should handle pagination for tournaments with >12 teams (18 teams = 2 pages)', () => {
    // Page 1: Ranks 1 to 12
    const page1Data = prepareGraphicsRenderData(testTournament, 'overall-standings-legit', {
      pageIndex: 1,
      rowsPerPage: 12
    });
    expect(page1Data.page).toBe(1);
    expect(page1Data.totalPages).toBe(2);
    expect(page1Data.rows.length).toBe(12);
    expect(page1Data.rows[0].rank).toBe(1);
    expect(page1Data.rows[11].rank).toBe(12);

    // Page 2: Ranks 13 to 18
    const page2Data = prepareGraphicsRenderData(testTournament, 'overall-standings-legit', {
      pageIndex: 2,
      rowsPerPage: 12
    });
    expect(page2Data.page).toBe(2);
    expect(page2Data.rows.length).toBe(6);
    expect(page2Data.rows[0].rank).toBe(13);
    expect(page2Data.rows[5].rank).toBe(18);
  });

  // Test 4: Custom Title & Subtitle Overrides
  it('Test 4: should support custom title and subtitle overrides without mutating underlying tournament data', () => {
    const renderData = prepareGraphicsRenderData(testTournament, 'overall-standings-strikz', {
      customTitle: 'STUDENT CUP FINALS',
      customSubtitle: 'GRAND FINALS DAY 2'
    });

    expect(renderData.tournamentTitle).toBe('STUDENT CUP FINALS');
    expect(renderData.subtitle).toBe('GRAND FINALS DAY 2');
    // Ensure underlying tournament title remains intact
    expect(testTournament.title).toBe('Free Fire Graphics Championship');
  });

  // Test 5: Template Switching preserves identical standings data
  it('Test 5: should preserve identical data when switching between Legit and Strikz templates', () => {
    const legitData = prepareGraphicsRenderData(testTournament, 'overall-standings-legit');
    const strikzData = prepareGraphicsRenderData(testTournament, 'overall-standings-strikz');

    expect(legitData.rows[0].totalPoints).toBe(strikzData.rows[0].totalPoints);
    expect(legitData.rows[0].totalKills).toBe(strikzData.rows[0].totalKills);
    expect(legitData.rows[0].teamName).toBe(strikzData.rows[0].teamName);
  });
});
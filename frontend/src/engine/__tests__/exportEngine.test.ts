import { describe, it, expect } from 'vitest';
import { sanitizeGraphicFilename } from '../exportEngine';
import { useGraphicsHistoryStore } from '../../store/graphicsHistoryStore';
import type { GeneratedGraphicRecord } from '../../types/export';

describe('Export, Download & Sharing System (Phase 10 Verification)', () => {
  // Test 1: Filename Sanitization
  it('Test 1: should sanitize tournament graphic filenames safely for any OS filesystem', () => {
    const filename1 = sanitizeGraphicFilename(
      'Free Fire: Grand Championship #5 (Finals)!',
      'OVERALL_STANDINGS',
      'Legit Showdown',
      1,
      'png'
    );
    expect(filename1).toBe('FREE_FIRE_GRAND_CHAMPIONSHIP_5_OVERALL_STANDINGS_LEGIT_SHOWDOWN.png');

    const filenamePage2 = sanitizeGraphicFilename(
      'Apex League / Night Scrims',
      'OVERALL_STANDINGS',
      'PointX Scrims',
      2,
      'jpeg'
    );
    expect(filenamePage2).toBe('APEX_LEAGUE_NIGHT_SCRIMS_OVERALL_STANDINGS_POINTX_SCRIMS_P2.jpg');
  });

  // Test 2: Graphics History Store Lifecycle
  it('Test 2: should save, retrieve, and delete generated graphic export records', () => {
    const store = useGraphicsHistoryStore.getState();

    const mockRecord: GeneratedGraphicRecord = {
      id: 'rec-test-01',
      tournamentId: 'tour-history-test',
      tournamentTitle: 'History Championship',
      templateId: 'overall-standings-legit',
      templateName: 'Legit Showdown',
      graphicType: 'overall-standings',
      customTitle: 'History Championship',
      pageIndex: 1,
      dataScope: 'Overall (3 Matches)',
      format: 'png',
      resolution: '1920x1080 (1080p)',
      createdAt: '2026-08-18T12:00:00Z',
      updatedAt: '2026-08-18T12:00:00Z'
    };

    store.saveGraphic(mockRecord);
    const retrieved = store.getTournamentGraphics('tour-history-test');

    expect(retrieved.length).toBeGreaterThanOrEqual(1);
    expect(retrieved[0].id).toBe('rec-test-01');
    expect(retrieved[0].templateId).toBe('overall-standings-legit');

    // Delete single record
    store.deleteGraphic('rec-test-01');
    const afterDelete = store.getTournamentGraphics('tour-history-test');
    expect(afterDelete.some((r) => r.id === 'rec-test-01')).toBe(false);
  });

  // Test 3: Tournament History Isolation
  it('Test 3: should isolate recent graphics history by tournamentId', () => {
    const store = useGraphicsHistoryStore.getState();

    store.saveGraphic({
      id: 'rec-tour-A',
      tournamentId: 'tournament-AAA',
      tournamentTitle: 'Tournament AAA',
      templateId: 'overall-standings-legit',
      templateName: 'Legit Showdown',
      graphicType: 'overall-standings',
      customTitle: 'Tour AAA',
      pageIndex: 1,
      dataScope: 'Overall',
      format: 'png',
      resolution: '1080p',
      createdAt: '2026-08-18T12:00:00Z',
      updatedAt: '2026-08-18T12:00:00Z'
    });

    store.saveGraphic({
      id: 'rec-tour-B',
      tournamentId: 'tournament-BBB',
      tournamentTitle: 'Tournament BBB',
      templateId: 'overall-standings-strikz',
      templateName: 'Strikz Paid Scrims',
      graphicType: 'overall-standings',
      customTitle: 'Tour BBB',
      pageIndex: 1,
      dataScope: 'Overall',
      format: 'jpeg',
      resolution: '4K',
      createdAt: '2026-08-18T12:00:00Z',
      updatedAt: '2026-08-18T12:00:00Z'
    });

    const graphicsA = store.getTournamentGraphics('tournament-AAA');
    expect(graphicsA.length).toBe(1);
    expect(graphicsA[0].id).toBe('rec-tour-A');

    const graphicsB = store.getTournamentGraphics('tournament-BBB');
    expect(graphicsB.length).toBe(1);
    expect(graphicsB[0].id).toBe('rec-tour-B');

    // Clear Tournament A
    store.clearTournamentHistory('tournament-AAA');
    expect(store.getTournamentGraphics('tournament-AAA').length).toBe(0);
    expect(store.getTournamentGraphics('tournament-BBB').length).toBe(1); // B is untouched
  });
});
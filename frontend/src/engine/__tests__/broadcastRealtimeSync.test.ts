import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  broadcastTournamentUpdate,
  subscribeToTournamentLiveUpdates,
  broadcastLayoutChange,
  broadcastTemplateLiveUpdate,
  subscribeToBroadcastDisplayUpdates,
  subscribeToConnectionState,
  type ConnectionState,
  type BroadcastDisplayState
} from '../../services/broadcastSync';
import { getRoomAliases, sanitizeStateForBroadcast } from '../../../../backend/src/services/realtimeSync';
import type { Tournament } from '../../types/tournament';
import { DEFAULT_FREE_FIRE_SCORING } from '../scoringEngine';

describe('PointX OBS Real-Time Synchronization Engine', () => {
  const sampleTournament: Tournament = {
    id: 'tour-sync-test-999',
    title: 'Grand Finals 2026',
    organizer: 'PointX Broadcast',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: 12, matchCount: 6, roundRobin: false, slotsPerMatch: 12 },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: [
      { id: 't1', name: 'Total Gaming', tag: 'TG', slotNumber: 1, players: [] },
      { id: 't2', name: 'GodLike', tag: 'GL', slotNumber: 2, players: [] }
    ],
    matches: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should subscribe to and receive live display and layout changes', () => {
    const receivedDisplayUpdates: BroadcastDisplayState[] = [];
    const unsub = subscribeToBroadcastDisplayUpdates('tour-sync-test-999', (disp) => {
      receivedDisplayUpdates.push(disp);
    });

    expect(typeof unsub).toBe('function');

    broadcastLayoutChange('standings', {
      tournamentId: 'tour-sync-test-999',
      themeHue: 120,
      customEventTitle: 'Live Championship Finals'
    });

    expect(receivedDisplayUpdates.length).toBeGreaterThanOrEqual(1);
    const lastUpdate = receivedDisplayUpdates[receivedDisplayUpdates.length - 1];
    expect(lastUpdate.activeLayout).toBe('standings');
    expect(lastUpdate.themeHue).toBe(120);
    expect(lastUpdate.customEventTitle).toBe('Live Championship Finals');

    unsub();
  });

  it('2. should broadcast and subscribe to live template changes without reload', () => {
    const receivedDisplayUpdates: BroadcastDisplayState[] = [];
    const unsub = subscribeToBroadcastDisplayUpdates('tour-sync-test-999', (disp) => {
      receivedDisplayUpdates.push(disp);
    });

    const mockTemplate = {
      id: 'tpl-cyber-gold',
      name: 'Cyber Gold 4K',
      aspectRatio: '16:9',
      category: 'standings'
    };

    broadcastTemplateLiveUpdate(mockTemplate, {
      tournamentId: 'tour-sync-test-999',
      activeScope: 3,
      customOrgName: 'PointX Esports Arena'
    });

    expect(receivedDisplayUpdates.length).toBeGreaterThanOrEqual(1);
    const lastUpdate = receivedDisplayUpdates[receivedDisplayUpdates.length - 1];
    expect(lastUpdate.activeTemplateId).toBe('tpl-cyber-gold');
    expect(lastUpdate.activeTemplate.name).toBe('Cyber Gold 4K');
    expect(lastUpdate.activeScope).toBe(3);
    expect(lastUpdate.customOrgName).toBe('PointX Esports Arena');

    unsub();
  });

  it('3. should track and notify connection state transitions', () => {
    const states: ConnectionState[] = [];
    const unsub = subscribeToConnectionState((state) => {
      states.push(state);
    });

    expect(states.length).toBeGreaterThanOrEqual(1);
    expect(['CONNECTED', 'CONNECTING', 'RECONNECTING', 'DISCONNECTED']).toContain(states[0]);

    unsub();
  });

  it('4. should correctly compute multi-room aliases for seamless OBS routing', () => {
    const tournamentDoc = {
      _id: '65e8a2b3c4d5e6f7a8b9c0d1',
      customId: 'tour-ff-championship-2026',
      id: 'tour-ff-championship-2026'
    };

    const aliases = getRoomAliases('tour-ff-championship-2026', tournamentDoc);

    expect(aliases).toContain('tour-ff-championship-2026');
    expect(aliases).toContain('65e8a2b3c4d5e6f7a8b9c0d1');
    expect(aliases).toContain('default');
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it('5. should sanitize state for OBS broadcast and strip sensitive security credentials', () => {
    const mockSyncState: any = {
      tournamentId: 'tour-test-101',
      revision: 42,
      pinCode: '8260',
      sessionToken: 'secret_token_abc_123',
      connectedDevices: [
        { deviceId: 'dev_1', deviceName: 'Phone Remote', lastActive: Date.now(), isBlocked: false, verified: true }
      ],
      blockedDeviceIds: ['dev_bad'],
      timestamp: Date.now(),
      tournament: sampleTournament,
      activeLayout: 'live-squads'
    };

    const sanitized = sanitizeStateForBroadcast(mockSyncState);

    expect(sanitized.pinCode).toBeUndefined();
    expect(sanitized.revision).toBe(42);
    expect(sanitized.tournamentId).toBe('tour-test-101');
    expect(sanitized.activeLayout).toBe('live-squads');
    expect(sanitized.connectedDevices[0].deviceId).toBe('dev_1');
  });

  it('6. should subscribe to tournament updates and receive latest state', () => {
    const received: Tournament[] = [];
    const unsub = subscribeToTournamentLiveUpdates('tour-sync-test-999', (tour) => {
      received.push(tour);
    });

    broadcastTournamentUpdate(sampleTournament);

    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[received.length - 1].title).toBe('Grand Finals 2026');

    unsub();
  });
});

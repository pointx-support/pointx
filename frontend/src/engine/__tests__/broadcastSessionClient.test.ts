import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  broadcastSessionApi,
  initializeBroadcastSession,
  fetchSessionState,
  connectBroadcastSession,
} from '../../services/broadcastClient';
import type { AuthoritativeBroadcastState } from '../../types/broadcastSession';

// Mock MockWebSocket for unit testing real-time WS behavior
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  onclose: (() => void) | null = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  simulateServerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

const mockInitialState: AuthoritativeBroadcastState = {
  sessionId: 'bsess_123',
  tournamentId: 'tour-123',
  matchId: 'm-1',
  revision: 1,
  tableVisible: true,
  activeMode: 'NORMAL',
  pointRushEnabled: false,
  fireTeamIds: [],
  pointRushTeamIds: [],
  selectedTeamId: null,
  selectedPlayerIndex: null,
  tournament: {
    id: 'tour-123',
    title: 'Free Fire Grand Final',
    game: 'Free Fire',
    status: 'Live',
  },
  match: {
    id: 'm-1',
    matchNumber: 1,
    mapName: 'Bermuda',
    status: 'Live',
  },
  teams: [
    {
      teamId: 'team-1',
      name: 'Total Gaming',
      tag: 'TG',
      slotNumber: 1,
      kills: 0,
      placement: 1,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      isBooyah: false,
      squadPlayers: ['alive', 'alive', 'alive', 'alive'],
      alivePlayersCount: 4,
      isWiped: false,
      isFireActive: false,
      isPointRushActive: false,
      isFocused: false,
      rank: 1,
    },
  ],
  availableMatches: [
    {
      id: 'm-1',
      matchNumber: 1,
      mapName: 'Bermuda',
      status: 'Live',
    },
  ],
  aliveSquadsCount: 1,
};

describe('Broadcast Session Client & Realtime Sync Tests', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. initializeBroadcastSession calls API and returns session data', async () => {
    vi.spyOn(broadcastSessionApi, 'createOrGetSession').mockResolvedValueOnce({
      success: true,
      sessionId: 'bsess_123',
      session: { sessionId: 'bsess_123' },
      state: mockInitialState,
    });

    const result = await initializeBroadcastSession('tour-123', 'm-1');
    expect(result.sessionId).toBe('bsess_123');
    expect(result.state.revision).toBe(1);
    expect(result.state.teams[0].name).toBe('Total Gaming');
  });

  it('2. fetchSessionState retrieves authoritative snapshot', async () => {
    vi.spyOn(broadcastSessionApi, 'getAuthoritativeState').mockResolvedValueOnce({
      success: true,
      state: mockInitialState,
    });

    const state = await fetchSessionState('bsess_123');
    expect(state.sessionId).toBe('bsess_123');
    expect(state.revision).toBe(1);
  });

  it('3. connectBroadcastSession sends JOIN_BROADCAST_SESSION frame and handles sequential revisions', async () => {
    vi.spyOn(broadcastSessionApi, 'getAuthoritativeState').mockResolvedValue({
      success: true,
      state: mockInitialState,
    });

    let currentStatus = '';
    const receivedStates: AuthoritativeBroadcastState[] = [];

    const conn = connectBroadcastSession('bsess_123', mockInitialState, {
      onState: (st) => receivedStates.push(st),
      onStatusChange: (st) => {
        currentStatus = st;
      },
    });

    // Wait for WS open
    await new Promise((r) => setTimeout(r, 20));

    expect(MockWebSocket.instances.length).toBe(1);
    const ws = MockWebSocket.instances[0];

    // Verify join message
    expect(ws.sentMessages.length).toBeGreaterThan(0);
    const joinMsg = JSON.parse(ws.sentMessages[0]);
    expect(joinMsg.action).toBe('JOIN_BROADCAST_SESSION');
    expect(joinMsg.sessionId).toBe('bsess_123');
    expect(currentStatus).toBe('LIVE');

    // Simulate next sequential revision (Rev 2)
    const rev2State: AuthoritativeBroadcastState = {
      ...mockInitialState,
      revision: 2,
      teams: [
        {
          ...mockInitialState.teams[0],
          kills: 1,
          totalPoints: 1,
        },
      ],
    };

    ws.simulateServerMessage({
      type: 'BROADCAST_STATE_UPDATED',
      sessionId: 'bsess_123',
      revision: 2,
      state: rev2State,
    });

    expect(receivedStates.length).toBe(2); // 1 from initial sync on open, 1 from rev 2
    expect(receivedStates[receivedStates.length - 1].revision).toBe(2);
    expect(conn.getRevision()).toBe(2);

    conn.disconnect();
    expect(currentStatus).toBe('DISCONNECTED');
  });

  it('4. connectBroadcastSession detects revision gaps and catches up authoritative state', async () => {
    const rev5State: AuthoritativeBroadcastState = {
      ...mockInitialState,
      revision: 5,
    };

    const getSpy = vi.spyOn(broadcastSessionApi, 'getAuthoritativeState').mockResolvedValue({
      success: true,
      state: rev5State,
    });

    const receivedStates: AuthoritativeBroadcastState[] = [];
    const conn = connectBroadcastSession('bsess_123', mockInitialState, {
      onState: (st) => receivedStates.push(st),
    });

    await new Promise((r) => setTimeout(r, 20));
    const ws = MockWebSocket.instances[0];

    // Simulate receiving revision 5 when current revision is 1 (gap of 4 revisions!)
    ws.simulateServerMessage({
      type: 'BROADCAST_STATE_UPDATED',
      sessionId: 'bsess_123',
      revision: 5,
      state: rev5State,
    });

    // Wait for gap-fill fetch
    await new Promise((r) => setTimeout(r, 20));

    expect(getSpy).toHaveBeenCalledWith('bsess_123');
    expect(conn.getRevision()).toBe(5);

    conn.disconnect();
  });
});

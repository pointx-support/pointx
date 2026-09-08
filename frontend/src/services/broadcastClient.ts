import { broadcastSessionApi } from './api';
import type {
  AuthoritativeBroadcastState,
  BroadcastSyncStatus,
} from '../types/broadcastSession';

export { broadcastSessionApi };

export interface BroadcastSessionConnection {
  disconnect: () => void;
  sendCommand: (
    commandType: string,
    targetTeamId?: string,
    payload?: any
  ) => Promise<{ revision: number; state: AuthoritativeBroadcastState }>;
  fetchAuthoritativeSnapshot: () => Promise<AuthoritativeBroadcastState>;
  getRevision: () => number;
}

export interface BroadcastSessionCallbacks {
  onState: (state: AuthoritativeBroadcastState) => void;
  onStatusChange?: (status: BroadcastSyncStatus) => void;
  onError?: (err: any) => void;
}

/**
 * Initializes or fetches a broadcast session from the server.
 */
export async function initializeBroadcastSession(
  tournamentId: string,
  matchId?: string
): Promise<{ sessionId: string; state: AuthoritativeBroadcastState }> {
  const res = await broadcastSessionApi.createOrGetSession(tournamentId, matchId);
  if (!res.success || !res.sessionId || !res.state) {
    throw new Error(res.error || 'Failed to initialize broadcast session');
  }
  return {
    sessionId: res.sessionId,
    state: res.state,
  };
}

/**
 * Fetch fresh authoritative snapshot for a session ID.
 */
export async function fetchSessionState(sessionId: string): Promise<AuthoritativeBroadcastState> {
  const res = await broadcastSessionApi.getAuthoritativeState(sessionId);
  if (!res.success || !res.state) {
    throw new Error(res.error || 'Failed to fetch authoritative broadcast state');
  }
  return res.state;
}

/**
 * Connect to a Broadcast Session room via WebSocket with gap detection and auto-reconnect.
 */
export function connectBroadcastSession(
  sessionId: string,
  initialState: AuthoritativeBroadcastState,
  callbacks: BroadcastSessionCallbacks
): BroadcastSessionConnection {
  let ws: WebSocket | null = null;
  let isDisposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 1000;
  let currentRevision = initialState.revision;

  const updateStatus = (status: BroadcastSyncStatus) => {
    if (!isDisposed && callbacks.onStatusChange) {
      callbacks.onStatusChange(status);
    }
  };

  const syncAuthoritativeSnapshot = async () => {
    try {
      const state = await fetchSessionState(sessionId);
      if (isDisposed) return;
      currentRevision = state.revision;
      callbacks.onState(state);
      updateStatus('LIVE');
    } catch (err) {
      if (!isDisposed && callbacks.onError) {
        callbacks.onError(err);
      }
    }
  };

  const connectWs = () => {
    if (isDisposed) return;

    try {
      const isBrowser = typeof window !== 'undefined' && !!window.location;
      const protocol = isBrowser && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = isBrowser && window.location.host ? window.location.host : '127.0.0.1:5000';
      const wsUrl = `${protocol}//${host}/api/sync/ws?role=obs`;

      const WsClass = typeof WebSocket !== 'undefined' ? WebSocket : (globalThis as any).WebSocket;
      const socket: WebSocket = new WsClass(wsUrl);
      ws = socket;

      socket.onopen = () => {
        if (isDisposed) {
          socket.close();
          return;
        }
        reconnectDelay = 1000;

        // Join the dedicated Broadcast Session room
        socket.send(
          JSON.stringify({
            action: 'JOIN_BROADCAST_SESSION',
            type: 'JOIN_BROADCAST_SESSION',
            sessionId,
          })
        );

        updateStatus('LIVE');

        // Always fetch snapshot after reconnecting to fill any potential gap
        syncAuthoritativeSnapshot();
      };

      socket.onmessage = (event) => {
        if (isDisposed) return;

        try {
          const message = JSON.parse(event.data);

          if (message.type === 'BROADCAST_STATE_UPDATED' && message.sessionId === sessionId) {
            const incomingRev = Number(message.revision);
            const incomingState = message.state || message.payload || message.data;

            if (incomingRev === currentRevision + 1) {
              // Exact next sequential revision: apply cleanly
              currentRevision = incomingRev;
              if (incomingState) {
                callbacks.onState(incomingState);
              }
              updateStatus('LIVE');
            } else if (incomingRev > currentRevision + 1) {
              // Gap detected! Client missed one or more updates -> pull full authoritative snapshot
              console.warn(
                `[BroadcastSync] Gap detected! Expected rev ${currentRevision + 1}, got ${incomingRev}. Fetching authoritative snapshot...`
              );
              syncAuthoritativeSnapshot();
            } else {
              // Stale or duplicate revision (incomingRev <= currentRevision)
              if (incomingState) {
                callbacks.onState(incomingState);
              }
            }
          }
        } catch (err) {
          console.warn('[BroadcastSync] Error processing incoming WS message:', err);
        }
      };

      socket.onerror = (err) => {
        if (!isDisposed && callbacks.onError) {
          callbacks.onError(err);
        }
      };

      socket.onclose = () => {
        if (isDisposed) return;
        updateStatus('RECONNECTING');

        // Exponential backoff reconnect
        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
          connectWs();
        }, reconnectDelay);
      };
    } catch (err) {
      if (!isDisposed) {
        updateStatus('RECONNECTING');
        reconnectTimer = setTimeout(connectWs, 3000);
      }
    }
  };

  // Kick off initial WebSocket connection
  connectWs();

  return {
    disconnect: () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
        ws = null;
      }
      callbacks.onStatusChange?.('DISCONNECTED');
    },
    sendCommand: async (commandType: string, targetTeamId?: string, payload?: any) => {
      const res = await broadcastSessionApi.sendCommand(sessionId, {
        commandType,
        targetTeamId,
        payload,
      });
      const resolvedState = res.state || res.payload || (res.data as any)?.state;
      if (!res.success || !resolvedState) {
        throw new Error(res.error || `Command ${commandType} failed`);
      }
      currentRevision = res.revision;
      callbacks.onState(resolvedState);
      return { revision: res.revision, state: resolvedState };
    },
    fetchAuthoritativeSnapshot: syncAuthoritativeSnapshot as any,
    getRevision: () => currentRevision,
  };
}

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Tournament } from '../models/Tournament';

export interface RemoteDeviceSession {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  lastActive: number;
  isBlocked: boolean;
}

export interface TournamentSyncState {
  tournamentId: string;
  revision: number;
  tournament?: any;
  squads?: any;
  highlightedTeamId?: string | null;
  isVisible?: boolean;
  pinCode: string;
  sessionToken?: string;
  tokenExpiresAt?: number;
  connectedDevices: RemoteDeviceSession[];
  blockedDeviceIds: string[];
  timestamp: number;
  [key: string]: any;
}

interface ClientMeta {
  tournamentId: string;
  role: 'obs' | 'remote' | 'dashboard';
  deviceId: string;
  deviceName: string;
  isAlive: boolean;
}

// In-Memory Authoritative Live State Store
const syncStore: Record<string, TournamentSyncState> = {};

// Active WebSocket client rooms: tournamentId -> Set<WebSocket>
const roomClients = new Map<string, Set<WebSocket>>();
const clientMetadata = new WeakMap<WebSocket, ClientMeta>();

// Active Server-Sent Event (SSE) response listeners: tournamentId -> Set<http.ServerResponse>
const sseListeners = new Map<string, Set<any>>();

/**
 * Retrieve or initialize the authoritative state for a tournament
 */
export async function getOrCreateAuthoritativeState(tournamentId: string): Promise<TournamentSyncState> {
  const tourId = tournamentId || 'default';
  const now = Date.now();
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  if (!syncStore[tourId]) {
    const cleanId = tourId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const initialToken = `px_${cleanId}_${Math.random().toString(36).substring(2, 8)}`;

    syncStore[tourId] = {
      tournamentId: tourId,
      revision: 1,
      pinCode: '1234',
      sessionToken: initialToken,
      tokenExpiresAt: now + SIX_HOURS_MS,
      connectedDevices: [],
      blockedDeviceIds: [],
      timestamp: now,
      isVisible: true,
      squads: {},
      highlightedTeamId: null,
    };
  }

  const state = syncStore[tourId];

  // Guarantee token stays unchanged for at least 6 hours
  if (!state.sessionToken || !state.tokenExpiresAt || now > state.tokenExpiresAt) {
    const cleanId = tourId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    state.sessionToken = `px_${cleanId}_${Math.random().toString(36).substring(2, 8)}`;
    state.tokenExpiresAt = now + SIX_HOURS_MS;
  }

  // If in-memory tournament is not loaded, try fetching from database
  if (!state.tournament && tourId !== 'default') {
    try {
      const idQueries: any[] = [{ customId: tourId }];
      if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
        idQueries.push({ _id: tourId });
      }
      const doc = await Tournament.findOne({ $or: idQueries }).lean();
      if (doc) {
        state.tournament = {
          ...doc,
          id: doc.customId || String(doc._id),
        };
      }
    } catch (err) {
      console.warn(`[SyncStore] Could not load tournament ${tourId} from DB:`, err);
    }
  }

  return state;
}

/**
 * Atomically update state, increment revision, broadcast to all connected clients,
 * and persist tournament updates to MongoDB
 */
export async function updateAuthoritativeState(
  tournamentId: string,
  updates: Partial<TournamentSyncState>,
  sourceWs?: WebSocket
): Promise<TournamentSyncState> {
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  // Monotonic revision increment
  state.revision = (state.revision || 0) + 1;
  state.timestamp = Date.now();

  // Apply updates
  if (updates.tournament !== undefined) state.tournament = updates.tournament;
  if (updates.squads !== undefined) state.squads = updates.squads;
  if (updates.highlightedTeamId !== undefined) state.highlightedTeamId = updates.highlightedTeamId;
  if (updates.isVisible !== undefined) state.isVisible = updates.isVisible;
  if (updates.pinCode !== undefined) state.pinCode = updates.pinCode;
  if (updates.blockedDeviceIds !== undefined) state.blockedDeviceIds = updates.blockedDeviceIds;
  if (updates.connectedDevices !== undefined) state.connectedDevices = updates.connectedDevices;

  // Persist tournament matches/teams/status to MongoDB in background
  if (updates.tournament && tourId !== 'default') {
    const idQueries: any[] = [{ customId: tourId }];
    if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: tourId });
    }
    Tournament.updateOne(
      { $or: idQueries },
      {
        $set: {
          matches: updates.tournament.matches,
          teams: updates.tournament.teams,
          status: updates.tournament.status || 'Live',
        },
      }
    ).catch((err) => {
      console.warn(`[SyncStore] DB persist error for ${tourId}:`, err);
    });
  }

  // Real-time broadcast to all connected WebSocket clients in this tournament room
  broadcastToRoom(tourId, {
    type: 'STATE_UPDATED',
    tournamentId: tourId,
    revision: state.revision,
    data: state,
    timestamp: state.timestamp,
  });

  // Broadcast to all active SSE listeners
  broadcastToSse(tourId, {
    type: 'STATE_UPDATED',
    tournamentId: tourId,
    revision: state.revision,
    data: state,
    timestamp: state.timestamp,
  });

  return state;
}

/**
 * Broadcast message to all WebSocket clients in a specific tournament room
 */
function broadcastToRoom(tournamentId: string, message: any, excludeWs?: WebSocket): void {
  const clients = roomClients.get(tournamentId);
  if (!clients || clients.size === 0) return;

  const raw = JSON.stringify(message);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(raw);
      } catch (err) {
        console.warn(`[WebSocket Broadcast Error] ${tournamentId}:`, err);
      }
    }
  }
}

/**
 * Broadcast message to active SSE listeners
 */
function broadcastToSse(tournamentId: string, message: any): void {
  const listeners = sseListeners.get(tournamentId);
  if (!listeners || listeners.size === 0) return;

  const raw = `data: ${JSON.stringify(message)}\n\n`;
  for (const res of listeners) {
    try {
      res.write(raw);
    } catch {
      listeners.delete(res);
    }
  }
}

/**
 * Register an SSE connection for a tournament
 */
export function addSseListener(tournamentId: string, res: any): () => void {
  if (!sseListeners.has(tournamentId)) {
    sseListeners.set(tournamentId, new Set());
  }
  const set = sseListeners.get(tournamentId)!;
  set.add(res);

  return () => {
    set.delete(res);
    if (set.size === 0) sseListeners.delete(tournamentId);
  };
}

/**
 * Setup Real-time WebSocket Server on top of the existing Node.js HTTP Server
 */
export function setupRealtimeSyncServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/api/sync/ws',
  });

  console.log(`?? [RealTime Sync] WebSocket Server attached to /api/sync/ws`);

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    // Parse URL params
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const tournamentId = url.searchParams.get('tournamentId') || 'default';
    const role = (url.searchParams.get('role') as 'obs' | 'remote' | 'dashboard') || 'obs';
    const deviceId = url.searchParams.get('deviceId') || `dev_${Math.random().toString(36).substr(2, 8)}`;
    const deviceName = url.searchParams.get('deviceName') || (role === 'obs' ? 'OBS Studio' : 'Remote Control');

    // Register client in room
    if (!roomClients.has(tournamentId)) {
      roomClients.set(tournamentId, new Set());
    }
    roomClients.get(tournamentId)!.add(ws);

    clientMetadata.set(ws, {
      tournamentId,
      role,
      deviceId,
      deviceName,
      isAlive: true,
    });

    // Send Authoritative Initial State immediately
    const initialState = await getOrCreateAuthoritativeState(tournamentId);

    // Register device in session list if it's a remote
    if (role === 'remote') {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const existingIdx = initialState.connectedDevices.findIndex((d) => d.deviceId === deviceId);
      const session: RemoteDeviceSession = {
        deviceId,
        deviceName,
        ipAddress: ip,
        lastActive: Date.now(),
        isBlocked: initialState.blockedDeviceIds.includes(deviceId),
      };
      if (existingIdx >= 0) {
        initialState.connectedDevices[existingIdx] = session;
      } else {
        initialState.connectedDevices.push(session);
      }
    }

    // Send full snapshot to newly connected client
    try {
      ws.send(
        JSON.stringify({
          type: 'INITIAL_STATE',
          tournamentId,
          revision: initialState.revision,
          data: initialState,
          timestamp: initialState.timestamp,
        })
      );
    } catch {}

    // Message handler
    ws.on('message', async (data: string) => {
      try {
        const parsed = JSON.parse(data.toString());
        const meta = clientMetadata.get(ws);
        const activeTourId = parsed.tournamentId || meta?.tournamentId || 'default';

        if (parsed.type === 'PONG') {
          if (meta) meta.isAlive = true;
          return;
        }

        if (parsed.type === 'JOIN_ROOM') {
          const newTourId = parsed.tournamentId || 'default';
          // Leave old room
          if (meta && meta.tournamentId !== newTourId) {
            roomClients.get(meta.tournamentId)?.delete(ws);
            meta.tournamentId = newTourId;
          }
          // Join new room
          if (!roomClients.has(newTourId)) {
            roomClients.set(newTourId, new Set());
          }
          roomClients.get(newTourId)!.add(ws);

          const state = await getOrCreateAuthoritativeState(newTourId);
          ws.send(
            JSON.stringify({
              type: 'INITIAL_STATE',
              tournamentId: newTourId,
              revision: state.revision,
              data: state,
              timestamp: state.timestamp,
            })
          );
          return;
        }

        if (parsed.type === 'UPDATE_STATE') {
          const payload = parsed.payload || parsed.data || {};
          const updatedState = await updateAuthoritativeState(activeTourId, payload, ws);

          // Send ACK back to sender
          ws.send(
            JSON.stringify({
              type: 'ACK',
              tournamentId: activeTourId,
              revision: updatedState.revision,
              success: true,
              timestamp: updatedState.timestamp,
            })
          );
          return;
        }

        if (parsed.type === 'REQUEST_SYNC') {
          const state = await getOrCreateAuthoritativeState(activeTourId);
          ws.send(
            JSON.stringify({
              type: 'STATE_UPDATED',
              tournamentId: activeTourId,
              revision: state.revision,
              data: state,
              timestamp: state.timestamp,
            })
          );
          return;
        }
      } catch (err) {
        console.warn('[WebSocket Message Error]', err);
      }
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      const meta = clientMetadata.get(ws);
      if (meta && roomClients.has(meta.tournamentId)) {
        const set = roomClients.get(meta.tournamentId)!;
        set.delete(ws);
        if (set.size === 0) roomClients.delete(meta.tournamentId);
      }
    });

    ws.on('error', () => {
      ws.close();
    });
  });

  // Heartbeat ping cycle every 15 seconds to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const meta = clientMetadata.get(ws);
      if (!meta) return;

      if (!meta.isAlive) {
        ws.terminate();
        return;
      }

      meta.isAlive = false;
      try {
        ws.send(JSON.stringify({ type: 'PING' }));
      } catch {
        ws.terminate();
      }
    });
  }, 15000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
}

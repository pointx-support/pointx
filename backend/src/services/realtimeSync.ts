import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Tournament } from '../models/Tournament';
import { calculateTeamMatchScore, recalculateMatchScores } from './scoringEngine';
import { LiveStateStore, type RemoteCommand } from './liveStateStore';
import { enqueueBatchedPersistence, flushPersistenceImmediately } from './batchedPersistenceService';
import { getNextMatchForTournament } from './tournamentService';

export interface RemoteDeviceSession {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  lastActive: number;
  isBlocked: boolean;
  verified?: boolean;
}

export type BroadcastEvent =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_DELETED'
  | 'MATCH_COMPLETED'
  | 'SCORE_UPDATED'
  | 'SCORE_DELETED'
  | 'POINT_TABLE_UPDATED'
  | 'TOURNAMENT_UPDATED'
  | 'TEAM_UPDATED'
  | 'PLAYER_UPDATED'
  | 'TEMPLATE_UPDATED'
  | 'GRAPHICS_UPDATED'
  | 'OBS_STATE_UPDATED'
  | 'STATE_UPDATED';

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

  // Real-Time Display & Template Controls
  activeLayout?: string; // 'live-squads' | 'standings' | 'match' | 'fraggers' | 'lower-third' | 'graphic' | 'poster'
  activeTemplateId?: string;
  activeTemplate?: any;
  activeMatchNumber?: number;
  activeScope?: string | number; // 'overall' | number
  customEventTitle?: string;
  customOrgName?: string;
  themeHue?: number;
  [key: string]: any;
}

interface ClientMeta {
  tournamentId: string;
  role: 'obs' | 'remote' | 'dashboard';
  deviceId: string;
  deviceName: string;
  isAlive: boolean;
  token?: string;
}

// In-Memory Authoritative Live State Store
const syncStore: Record<string, TournamentSyncState> = {};

// Server-side tombstones for deleted matches to prevent resurrection
const deletedMatchTombstones = new Set<string>();

export function registerServerDeletedMatch(matchId: string): void {
  if (!matchId) return;
  deletedMatchTombstones.add(matchId);
  // Clean from all active states in syncStore
  for (const tourId of Object.keys(syncStore)) {
    const state = syncStore[tourId];
    if (state?.tournament?.matches && Array.isArray(state.tournament.matches)) {
      state.tournament.matches = state.tournament.matches.filter(
        (m: any) => (m.id || m.customId) !== matchId
      );
    }
  }
}

export function isServerMatchDeleted(matchId: string): boolean {
  return deletedMatchTombstones.has(matchId);
}


// Active WebSocket client rooms: tournamentId -> Set<WebSocket>
const roomClients = new Map<string, Set<WebSocket>>();
const clientMetadata = new WeakMap<WebSocket, ClientMeta>();

// Dedicated session broadcast rooms: sessionId -> Set<WebSocket>
const broadcastSessionClients = new Map<string, Set<WebSocket>>();

export function broadcastToSession(sessionId: string, event: any): void {
  const room = broadcastSessionClients.get(sessionId);
  if (!room || room.size === 0) return;
  const msg = JSON.stringify(event);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(msg);
      } catch (err) {
        console.warn(`[BroadcastSession] Failed to send to client in session ${sessionId}:`, err);
      }
    }
  }
}

// Active Server-Sent Event (SSE) response listeners: tournamentId -> Set<http.ServerResponse>
const sseListeners = new Map<string, Set<any>>();

export const DEFAULT_SEED_TEAMS = [
  { id: 't1', name: 'Total Gaming Esports', tag: 'TG', slotNumber: 1, players: [{ id: 'p1', name: 'Mafia' }, { id: 'p2', name: 'FozyAjay' }] },
  { id: 't2', name: 'Team Elite', tag: 'TE', slotNumber: 2, players: [{ id: 'p3', name: 'Killer' }, { id: 'p4', name: 'Pahari' }] },
  { id: 't3', name: 'Orangutan Elite', tag: 'OG', slotNumber: 3, players: [{ id: 'p5', name: 'Jash' }, { id: 'p6', name: 'MrJayYT' }] },
  { id: 't4', name: 'GodLike Esports', tag: 'GODL', slotNumber: 4, players: [{ id: 'p7', name: 'Niku' }, { id: 'p8', name: 'Ginotra' }] },
  { id: 't5', name: 'Blind Esports', tag: 'BLIND', slotNumber: 5, players: [{ id: 'p9', name: 'Abhay' }] },
  { id: 't6', name: 'Revenant Esports', tag: 'RNT', slotNumber: 6, players: [{ id: 'p10', name: 'Aayush' }] },
  { id: 't7', name: 'Chemin Esports', tag: 'CHM', slotNumber: 7, players: [{ id: 'p11', name: 'Swastik' }] },
  { id: 't8', name: 'TSM FTX India', tag: 'TSM', slotNumber: 8, players: [{ id: 'p12', name: 'OldMonk' }] },
  { id: 't9', name: 'Nigma Galaxy', tag: 'NGX', slotNumber: 9, players: [{ id: 'p13', name: 'VasiyoCRJ7' }] },
  { id: 't10', name: 'Desi Gamers Esports', tag: 'DG', slotNumber: 10, players: [{ id: 'p14', name: 'AmitBhai' }] },
  { id: 't11', name: 'Head Hunters', tag: 'HH', slotNumber: 11, players: [{ id: 'p15', name: 'Aasif' }] },
  { id: 't12', name: 'Enigma Gaming', tag: 'EG', slotNumber: 12, players: [{ id: 'p16', name: 'RadheThakur' }] },
];

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
  if (!state.tournament) {
    try {
      let doc: any = null;
      if (tourId !== 'default') {
        const idQueries: any[] = [{ customId: tourId }];
        if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
          idQueries.push({ _id: tourId });
        }
        doc = await Tournament.findOne({ $or: idQueries }).lean();
      }

      // No cross-tenant fallback: never load another tenant's tournament for 'default'

      if (doc) {
        if (doc.matches && Array.isArray(doc.matches)) {
          doc.matches = doc.matches.filter((m: any) => !deletedMatchTombstones.has(m.id || m.customId));
        }
        state.tournament = {
          ...doc,
          id: doc.customId || String(doc._id),
        };
      }
    } catch (err) {
      console.warn(`[SyncStore] Could not load tournament ${tourId} from DB:`, err);
    }
  }

  // If still no tournament found in database, do NOT synthesize demo tournament
  if (!state.tournament) {
    state.tournament = null;
  }

  // Ensure initial squad states exist for tournament teams if empty
  if (state.tournament?.teams && (!state.squads || Object.keys(state.squads).length === 0)) {
    state.squads = {};
    for (const team of state.tournament.teams) {
      state.squads[team.id] = ['alive', 'alive', 'alive', 'alive'];
    }
  }

  return state;
}

export function sanitizeStateForBroadcast(state: TournamentSyncState): any {
  return {
    ...state,
    pinCode: undefined,
    connectedDevices: (state.connectedDevices || []).map((d) => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      lastActive: d.lastActive,
      isBlocked: d.isBlocked,
      verified: d.verified,
    })),
  };
}

/**
 * Helper to compute all room aliases for a tournament (customId, _id, id, and 'default')
 */
export function getRoomAliases(tournamentId: string, tournamentDoc?: any): string[] {
  const rooms = new Set<string>();
  if (tournamentId) rooms.add(tournamentId);
  if (tournamentDoc) {
    if (tournamentDoc.customId) rooms.add(tournamentDoc.customId);
    if (tournamentDoc._id) rooms.add(String(tournamentDoc._id));
    if (tournamentDoc.id) rooms.add(String(tournamentDoc.id));
  }
  return Array.from(rooms);
}

/**
 * Atomically update state, increment revision, broadcast to all connected clients across room aliases,
 * and persist tournament updates to MongoDB
 */
export async function updateAuthoritativeState(
  tournamentId: string,
  updates: Partial<TournamentSyncState>,
  sourceWs?: WebSocket,
  eventType: BroadcastEvent = 'STATE_UPDATED'
): Promise<TournamentSyncState> {
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  // Monotonic revision increment
  state.revision = (state.revision || 0) + 1;
  state.timestamp = Date.now();
  state.isExplicitlyInitialized = true;

  // Apply updates
  if (updates.tournament !== undefined) {
    if (updates.tournament && Array.isArray(updates.tournament.matches)) {
      updates.tournament.matches = updates.tournament.matches.filter(
        (m: any) => !deletedMatchTombstones.has(m.id || m.customId)
      );
    }
    state.tournament = updates.tournament;
  }
  if (updates.squads !== undefined) state.squads = updates.squads;
  if (updates.highlightedTeamId !== undefined) state.highlightedTeamId = updates.highlightedTeamId;
  if (updates.isVisible !== undefined) state.isVisible = updates.isVisible;
  if (updates.pinCode !== undefined) state.pinCode = updates.pinCode;
  if (updates.blockedDeviceIds !== undefined) state.blockedDeviceIds = updates.blockedDeviceIds;
  if (updates.connectedDevices !== undefined) state.connectedDevices = updates.connectedDevices;

  // Real-Time Display & Template Controls
  if (updates.activeLayout !== undefined) state.activeLayout = updates.activeLayout;
  if (updates.activeTemplateId !== undefined) state.activeTemplateId = updates.activeTemplateId;
  if (updates.activeTemplate !== undefined) state.activeTemplate = updates.activeTemplate;
  if (updates.activeMatchNumber !== undefined) state.activeMatchNumber = updates.activeMatchNumber;
  if (updates.activeScope !== undefined) state.activeScope = updates.activeScope;
  if (updates.customEventTitle !== undefined) state.customEventTitle = updates.customEventTitle;
  if (updates.customOrgName !== undefined) state.customOrgName = updates.customOrgName;
  if (updates.themeHue !== undefined) state.themeHue = updates.themeHue;

  // Persist tournament matches/teams/status to MongoDB in background
  const targetDbId = updates.tournament?.id || state.tournament?.id || (tourId !== 'default' ? tourId : null);
  if (updates.tournament && targetDbId && targetDbId !== 'default' && targetDbId !== 'tour-default-live') {
    const idQueries: any[] = [{ customId: targetDbId }];
    if (targetDbId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: targetDbId });
    }
    Tournament.updateOne(
      { $or: idQueries },
      {
        $set: {
          matches: updates.tournament.matches !== undefined ? updates.tournament.matches : state.tournament?.matches,
          teams: updates.tournament.teams !== undefined ? updates.tournament.teams : state.tournament?.teams,
          status: updates.tournament.status || state.tournament?.status || 'Live',
        },
      }
    ).catch((err) => {
      console.warn(`[SyncStore] DB persist error for ${targetDbId}:`, err);
    });
  }

  // Synchronize state across alias keys in syncStore (creating or updating so no stale alias retains old state)
  const aliasRooms = getRoomAliases(tourId, state.tournament);
  for (const alias of aliasRooms) {
    if (alias !== tourId) {
      if (!syncStore[alias]) {
        syncStore[alias] = {
          ...state,
          tournament: state.tournament ? { ...state.tournament } : undefined,
          squads: { ...state.squads },
          connectedDevices: [...(state.connectedDevices || [])],
          blockedDeviceIds: [...(state.blockedDeviceIds || [])],
        };
      } else {
        syncStore[alias].revision = state.revision;
        syncStore[alias].timestamp = state.timestamp;
        syncStore[alias].tournament = state.tournament;
        syncStore[alias].squads = state.squads;
        syncStore[alias].activeLayout = state.activeLayout;
        syncStore[alias].activeTemplateId = state.activeTemplateId;
        syncStore[alias].activeTemplate = state.activeTemplate;
        syncStore[alias].activeMatchNumber = state.activeMatchNumber;
        syncStore[alias].activeScope = state.activeScope;
        syncStore[alias].customEventTitle = state.customEventTitle;
        syncStore[alias].customOrgName = state.customOrgName;
        syncStore[alias].themeHue = state.themeHue;
        syncStore[alias].isVisible = state.isVisible;
        syncStore[alias].highlightedTeamId = state.highlightedTeamId;
      }
    }
  }

  // Real-time broadcast to all connected WebSocket clients across all alias rooms
  const safeState = sanitizeStateForBroadcast(state);
  const payload = {
    type: eventType,
    tournamentId: tourId,
    revision: state.revision,
    data: safeState,
    timestamp: state.timestamp,
  };

  broadcastToRooms(aliasRooms, payload, sourceWs);

  // Broadcast to all active SSE listeners across all alias rooms
  broadcastToSseRooms(aliasRooms, payload);

  return state;
}

/**
 * Authoritative Server-Side Match Score Calculation and Persistence
 */
export async function updateMatchScoreServer(
  tournamentId: string,
  matchId: string,
  rawResult: {
    teamId: string;
    kills?: number;
    placement?: number;
    isBooyah?: boolean;
    bonusPoints?: number;
    penaltyPoints?: number;
  },
  sourceWs?: WebSocket
): Promise<{ state: TournamentSyncState; calculatedResult: any }> {
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  if (!state.tournament) {
    throw new Error(`Tournament "${tourId}" not found`);
  }

  const teamExists = Array.isArray(state.tournament.teams) &&
    state.tournament.teams.some((t: any) => (t.id || t.customId || String(t._id)) === rawResult.teamId);
  if (!teamExists) {
    throw new Error(`Team "${rawResult.teamId}" not found in tournament "${tourId}"`);
  }

  if (!Array.isArray(state.tournament.matches)) {
    state.tournament.matches = [];
  }

  let match = state.tournament.matches.find(
    (m: any) => (m.id || m.customId) === matchId
  );

  if (!match) {
    const fallback = state.tournament.matches.find((m: any) => (m.id || m.customId) === matchId);
    if (fallback) {
      match = fallback;
    } else {
      throw new Error(`Match "${matchId}" not found in tournament`);
    }
  }

  const effectiveMatchId = match.id || match.customId || matchId;

  const calc = calculateTeamMatchScore(
    {
      teamId: rawResult.teamId,
      matchId: effectiveMatchId,
      placement: rawResult.placement ?? 12,
      kills: rawResult.kills ?? 0,
      booyah: rawResult.isBooyah,
      bonusPoints: rawResult.bonusPoints,
      penaltyPoints: rawResult.penaltyPoints,
    },
    state.tournament.scoringPreset
  );

  if (!calc.success || !calc.data) {
    throw new Error(calc.error?.message || 'Failed to calculate match score');
  }

  const d = calc.data;
  if (!Array.isArray(match.results)) match.results = [];
  const existingIdx = match.results.findIndex((r: any) => r.teamId === rawResult.teamId);
  const updatedTeamResult = {
    ...(existingIdx >= 0 ? match.results[existingIdx] : {}),
    teamId: rawResult.teamId,
    placement: d.placement,
    kills: d.kills,
    placementPoints: d.placementPoints,
    killPoints: d.killPoints,
    booyahBonusPoints: d.booyahBonusPoints,
    customBonusPoints: d.customBonusPoints,
    penaltyPoints: d.penaltyPoints,
    totalPoints: d.totalPoints,
    isBooyah: d.booyah,
  };

  if (existingIdx >= 0) {
    match.results[existingIdx] = updatedTeamResult;
  } else {
    match.results.push(updatedTeamResult);
  }

  // Recalculate match scores
  const updatedMatch = recalculateMatchScores(match, state.tournament.scoringPreset);
  const matchIndex = state.tournament.matches.findIndex(
    (m: any) => (m.id || m.customId) === effectiveMatchId
  );
  if (matchIndex >= 0) {
    state.tournament.matches[matchIndex] = updatedMatch;
  } else {
    state.tournament.matches.push(updatedMatch);
  }

  // Persist to MongoDB
  const targetDbId =
    state.tournament.customId || state.tournament.id || String(state.tournament._id);
  if (targetDbId && targetDbId !== 'default' && targetDbId !== 'tour-default-live') {
    const idQueries: any[] = [{ customId: targetDbId }];
    if (targetDbId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: targetDbId });
    }
    await Tournament.updateOne(
      { $or: idQueries },
      { $set: { matches: state.tournament.matches } }
    );
  }

  const updatedState = await updateAuthoritativeState(
    tourId,
    { tournament: state.tournament },
    sourceWs,
    'SCORE_UPDATED'
  );

  // Broadcast ultra-lightweight SCORE_DELTA (~180 bytes) specifically for OBS / live overlays
  const aliasRooms = getRoomAliases(tourId, state.tournament);
  const deltaPayload = {
    type: 'SCORE_DELTA',
    tournamentId: tourId,
    revision: updatedState.revision,
    data: {
      tournamentId: tourId,
      matchId: effectiveMatchId,
      teamId: rawResult.teamId,
      kills: d.kills,
      placement: d.placement,
      placementPoints: d.placementPoints,
      killPoints: d.killPoints,
      totalPoints: d.totalPoints,
      isBooyah: d.booyah,
    },
    timestamp: updatedState.timestamp,
  };
  broadcastToRooms(aliasRooms, deltaPayload, sourceWs);
  broadcastToSseRooms(aliasRooms, deltaPayload);

  return { state: updatedState, calculatedResult: d };
}


/**
 * Broadcast message to all WebSocket clients across room aliases with client deduplication
 */
function broadcastToRooms(roomIds: string[], message: any, excludeWs?: WebSocket): void {
  const sentClients = new Set<WebSocket>();
  const raw = JSON.stringify(message);

  for (const rid of roomIds) {
    const clients = roomClients.get(rid);
    if (!clients || clients.size === 0) continue;
    for (const client of clients) {
      if (!sentClients.has(client) && client !== excludeWs && client.readyState === WebSocket.OPEN) {
        sentClients.add(client);
        try {
          client.send(raw);
        } catch (err) {
          console.warn(`[WebSocket Broadcast Error] ${rid}:`, err);
        }
      }
    }
  }
}

/**
 * Broadcast message to active SSE listeners across room aliases with listener deduplication
 */
function broadcastToSseRooms(roomIds: string[], message: any): void {
  const sentListeners = new Set<any>();
  const raw = `data: ${JSON.stringify(message)}\n\n`;

  for (const rid of roomIds) {
    const listeners = sseListeners.get(rid);
    if (!listeners || listeners.size === 0) continue;
    for (const res of listeners) {
      if (!sentListeners.has(res)) {
        sentListeners.add(res);
        try {
          res.write(raw);
        } catch {
          listeners.delete(res);
        }
      }
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

  console.log(`📡 [RealTime Sync] WebSocket Server attached to /api/sync/ws`);

  wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
    // Parse URL params
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const tournamentId = url.searchParams.get('tournamentId') || 'default';
    const role = (url.searchParams.get('role') as 'obs' | 'remote' | 'dashboard') || 'obs';
    const deviceId = url.searchParams.get('deviceId') || `dev_${Math.random().toString(36).substr(2, 8)}`;
    const deviceName = url.searchParams.get('deviceName') || (role === 'obs' ? 'OBS Studio' : 'Remote Control');
    const token = url.searchParams.get('token') || '';

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
      token,
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

    // Send sanitized snapshot to client (unless dashboard)
    const isDashboard = role === 'dashboard';
    const clientInitialState = isDashboard ? initialState : sanitizeStateForBroadcast(initialState);
    try {
      ws.send(
        JSON.stringify({
          type: 'INITIAL_STATE',
          tournamentId,
          revision: initialState.revision,
          data: clientInitialState,
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

        if (parsed.action === 'JOIN_BROADCAST_SESSION' || parsed.type === 'JOIN_BROADCAST_SESSION') {
          const sessId = parsed.sessionId;
          if (sessId) {
            if (!broadcastSessionClients.has(sessId)) {
              broadcastSessionClients.set(sessId, new Set());
            }
            broadcastSessionClients.get(sessId)!.add(ws);
            ws.send(JSON.stringify({
              type: 'BROADCAST_SESSION_JOINED',
              sessionId: sessId,
              timestamp: Date.now(),
            }));
          }
          return;
        }

        if (parsed.type === 'JOIN_ROOM') {
          const newTourId = parsed.tournamentId || 'default';
          if (meta) {
            if (parsed.role) meta.role = parsed.role;
            if (parsed.deviceId) meta.deviceId = parsed.deviceId;
            if (parsed.token) meta.token = parsed.token;
          }

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
          const isDash = meta?.role === 'dashboard';
          ws.send(
            JSON.stringify({
              type: 'INITIAL_STATE',
              tournamentId: newTourId,
              revision: state.revision,
              data: isDash ? state : sanitizeStateForBroadcast(state),
              timestamp: state.timestamp,
            })
          );
          return;
        }

        if (parsed.type === 'COMMAND') {
          const cmd: RemoteCommand = {
            commandId: parsed.commandId || `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            command: parsed.command,
            sessionId: parsed.sessionId,
            organizationId: parsed.organizationId || 'org-default',
            tournamentId: parsed.tournamentId || activeTourId,
            matchId: parsed.matchId || 'm1',
            payload: parsed.payload || {},
            timestamp: parsed.timestamp || Date.now(),
          };

          if (cmd.command === 'NEXT_MATCH') {
            await flushPersistenceImmediately(cmd.organizationId, cmd.tournamentId, cmd.matchId);

            const nextRes = await getNextMatchForTournament(cmd.tournamentId, cmd.matchId);
            if (nextRes.hasNext && nextRes.nextMatch) {
              const nextLiveState = await LiveStateStore.getInstance().getOrCreateLiveState(
                cmd.organizationId,
                cmd.tournamentId,
                nextRes.nextMatch.id
              );

              const nextMsg = {
                type: 'NEXT_MATCH_READY',
                tournamentId: cmd.tournamentId,
                matchId: nextRes.nextMatch.id,
                matchNumber: nextRes.nextMatch.matchNumber,
                nextMatch: nextRes.nextMatch,
                initialState: nextLiveState,
                timestamp: Date.now(),
              };

              const aliasRooms = getRoomAliases(cmd.tournamentId);
              broadcastToRooms(aliasRooms, nextMsg);
              ws.send(JSON.stringify(nextMsg));
            } else {
              ws.send(JSON.stringify({
                type: 'NO_NEXT_MATCH',
                message: nextRes.message || 'No next match',
                timestamp: Date.now(),
              }));
            }
            return;
          }

          if (cmd.command === 'FINALIZE_MATCH') {
            await flushPersistenceImmediately(cmd.organizationId, cmd.tournamentId, cmd.matchId);
          }

          const currentTourState = await getOrCreateAuthoritativeState(cmd.tournamentId);
          const scoringPreset = currentTourState.tournament?.scoringPreset;

          const { state: updatedLiveState, patch } = await LiveStateStore.getInstance().applyCommand(cmd, scoringPreset);

          // Batched asynchronous persistence (3s debounce window)
          enqueueBatchedPersistence(updatedLiveState, scoringPreset);

          // Broadcast ultra-lightweight MATCH_DELTA (~200 bytes)
          const deltaMsg = {
            type: 'MATCH_DELTA',
            matchId: cmd.matchId,
            revision: updatedLiveState.revision,
            patch,
            timestamp: updatedLiveState.updatedAt,
          };

          const aliasRooms = getRoomAliases(cmd.tournamentId);
          broadcastToRooms(aliasRooms, deltaMsg);
          broadcastToSseRooms(aliasRooms, deltaMsg);

          if (updatedLiveState.sessionId) {
            broadcastToSession(updatedLiveState.sessionId, {
              type: 'BROADCAST_STATE_UPDATED',
              sessionId: updatedLiveState.sessionId,
              revision: updatedLiveState.revision,
              data: updatedLiveState,
              state: updatedLiveState,
              patch,
              timestamp: updatedLiveState.updatedAt,
            });
          }

          // Send immediate ACK back to Remote
          ws.send(JSON.stringify({
            type: 'ACK',
            commandId: cmd.commandId,
            revision: updatedLiveState.revision,
            success: true,
            timestamp: updatedLiveState.updatedAt,
          }));
          return;
        }

        if (parsed.type === 'JOIN_MATCH') {
          const orgId = parsed.organizationId || 'org-default';
          const tourId = parsed.tournamentId || activeTourId;
          const matchId = parsed.matchId || 'm1';

          const liveState = await LiveStateStore.getInstance().getOrCreateLiveState(orgId, tourId, matchId);
          ws.send(JSON.stringify({
            type: 'INITIAL_MATCH_STATE',
            matchId,
            revision: liveState.revision,
            data: liveState,
            timestamp: liveState.updatedAt,
          }));
          return;
        }

        if (parsed.type === 'REQUEST_FULL_STATE') {
          const orgId = parsed.organizationId || 'org-default';
          const tourId = parsed.tournamentId || activeTourId;
          const matchId = parsed.matchId || 'm1';

          const liveState = await LiveStateStore.getInstance().getOrCreateLiveState(orgId, tourId, matchId);
          ws.send(JSON.stringify({
            type: 'FULL_MATCH_STATE',
            matchId,
            revision: liveState.revision,
            state: liveState,
            timestamp: liveState.updatedAt,
          }));
          return;
        }

        if (parsed.type === 'UPDATE_STATE') {
          const payload = parsed.payload || parsed.data || {};
          const state = await getOrCreateAuthoritativeState(activeTourId);

          const clientDeviceId = meta?.deviceId || parsed.deviceId || payload.deviceId;
          const clientToken = meta?.token || parsed.token || payload.token;
          const clientRole = parsed.role || meta?.role;

          const isVerifiedRemote = clientDeviceId && state.connectedDevices.some(
            (d) => d.deviceId === clientDeviceId && d.verified && !d.isBlocked && !state.blockedDeviceIds.includes(d.deviceId)
          );
          const hasValidToken = (clientToken && clientToken === state.sessionToken) || isVerifiedRemote;

          if (clientRole === 'obs' && !parsed.role && !hasValidToken && !isVerifiedRemote) {
            ws.send(JSON.stringify({ type: 'ERROR', error: 'OBS clients are read-only.' }));
            return;
          }

          if (!isVerifiedRemote && !hasValidToken && clientRole !== 'dashboard') {
            ws.send(JSON.stringify({ type: 'ERROR', error: 'Unauthorized to update state. PIN verification or token required.' }));
            return;
          }

          const incomingRev = Number(parsed.revision ?? payload.revision);
          if (incomingRev && incomingRev < state.revision) {
            ws.send(
              JSON.stringify({
                type: 'STALE_REVISION',
                tournamentId: activeTourId,
                currentRevision: state.revision,
                data: clientRole === 'dashboard' ? state : sanitizeStateForBroadcast(state),
                timestamp: state.timestamp,
              })
            );
            return;
          }

          delete payload.pinCode;
          delete payload.sessionToken;
          delete payload.blockedDeviceIds;

          const eventType = parsed.eventType || payload.eventType || 'STATE_UPDATED';
          const updatedState = await updateAuthoritativeState(activeTourId, payload, ws, eventType);

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

        if (parsed.type === 'UPDATE_MATCH_SCORE' || parsed.type === 'RECORD_ELIMINATION') {
          const payload = parsed.payload || parsed.data || parsed;
          const matchId = payload.matchId;
          const teamId = payload.teamId;

          try {
            const result = await updateMatchScoreServer(
              activeTourId,
              matchId,
              {
                teamId,
                kills: payload.kills,
                placement: payload.placement,
                isBooyah: payload.isBooyah ?? payload.booyah,
                bonusPoints: payload.bonusPoints,
                penaltyPoints: payload.penaltyPoints,
              },
              ws
            );

            ws.send(
              JSON.stringify({
                type: 'ACK',
                tournamentId: activeTourId,
                revision: result.state.revision,
                success: true,
                data: result.calculatedResult,
                timestamp: result.state.timestamp,
              })
            );
          } catch (err: any) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                error: err?.message || 'Failed to update match score',
              })
            );
          }
          return;
        }

        if (parsed.type === 'REQUEST_SYNC') {
          const state = await getOrCreateAuthoritativeState(activeTourId);
          const isDash = meta?.role === 'dashboard';
          ws.send(
            JSON.stringify({
              type: 'STATE_UPDATED',
              tournamentId: activeTourId,
              revision: state.revision,
              data: isDash ? state : sanitizeStateForBroadcast(state),
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

      for (const [sessId, clients] of broadcastSessionClients.entries()) {
        if (clients.has(ws)) {
          clients.delete(ws);
          if (clients.size === 0) broadcastSessionClients.delete(sessId);
        }
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

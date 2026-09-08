import type { Tournament } from '../types/tournament';

const SYNC_CHANNEL_NAME = 'pointx_live_sync_channel';

// In-memory fallback map for non-browser/test environments
const memoryTokenMap = new Map<string, string>();
const memoryStoreMap = new Map<string, string>();

// Initialize Web BroadcastChannel if available in browser
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  console.warn('BroadcastChannel not available, falling back to storage/websocket sync');
}

export interface BroadcastTokenInfo {
  token: string;
  tournamentId: string;
  createdAt: number;
}

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

export type LivePlayerState = 'alive' | 'knock' | 'eliminated';

export interface LiveSquadSyncState {
  tournamentId: string;
  revision?: number;
  squads: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>;
  highlightedTeamId?: string | null;
  fireTeamIds?: string[];
  pointRushTeamIds?: string[];
  isPointRushActive?: boolean;
  isVisible?: boolean;
  timestamp: number;
}

export interface BroadcastDisplayState {
  tournamentId: string;
  revision?: number;
  activeLayout?: string;
  activeTemplateId?: string;
  activeTemplate?: any;
  activeMatchNumber?: number;
  activeScope?: string | number;
  customEventTitle?: string;
  customOrgName?: string;
  themeHue?: number;
  timestamp: number;
}

export interface FullSyncPayload {
  tournamentId: string;
  revision?: number;
  tournament?: Tournament;
  squads?: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>;
  highlightedTeamId?: string | null;
  fireTeamIds?: string[];
  pointRushTeamIds?: string[];
  isPointRushActive?: boolean;
  isVisible?: boolean;
  activeLayout?: string;
  activeTemplateId?: string;
  activeTemplate?: any;
  activeMatchNumber?: number;
  activeScope?: string | number;
  customEventTitle?: string;
  customOrgName?: string;
  themeHue?: number;
  timestamp?: number;
}

export function generateBroadcastToken(tournamentId: string): string {
  const token = `obs_${tournamentId.slice(0, 8)}_${Math.random().toString(36).substr(2, 8)}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(`pointx_token_${tournamentId}`, token);
  } else {
    memoryTokenMap.set(`pointx_token_${tournamentId}`, token);
  }
  return token;
}

export function getBroadcastToken(tournamentId: string): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(`pointx_token_${tournamentId}`) || window.localStorage.getItem(`strikz_token_${tournamentId}`);
    if (existing) return existing;
  } else {
    const mem = memoryTokenMap.get(`pointx_token_${tournamentId}`) || memoryTokenMap.get(`strikz_token_${tournamentId}`);
    if (mem) return mem;
  }
  return generateBroadcastToken(tournamentId);
}

// =========================================================================
// SINGLETON AUTHORITATIVE REAL-TIME WEBSOCKET & SSE CONNECTION MANAGER
// =========================================================================

type TournamentListener = (tour: Tournament, revision?: number) => void;
type SquadListener = (data: LiveSquadSyncState) => void;
type DisplayListener = (data: BroadcastDisplayState) => void;
type ConnectionListener = (state: ConnectionState) => void;
type HeartbeatListener = () => void;

export class RealtimeSyncClient {
  private static instance: RealtimeSyncClient | null = null;

  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private currentTournamentId: string = 'default';
  private currentRevision: number = 0;
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private healthCheckTimer: any = null;
  private reconnectAttempts: number = 0;
  private connectionState: ConnectionState = 'DISCONNECTED';

  private tournamentListeners = new Set<TournamentListener>();
  private squadListeners = new Set<SquadListener>();
  private displayListeners = new Set<DisplayListener>();
  private scoreDeltaListeners = new Set<(delta: any) => void>();
  private connectionListeners = new Set<ConnectionListener>();
  private heartbeatListeners = new Set<HeartbeatListener>();
  private deletedMatchTombstones = new Set<string>();

  public static getInstance(): RealtimeSyncClient {
    if (!RealtimeSyncClient.instance) {
      RealtimeSyncClient.instance = new RealtimeSyncClient();
    }
    return RealtimeSyncClient.instance;
  }

  private constructor() {
    if (typeof window === 'undefined') return;

    try {
      if (window.sessionStorage) {
        const stored = JSON.parse(window.sessionStorage.getItem('pointx_deleted_matches') || '[]');
        if (Array.isArray(stored)) {
          stored.forEach((id) => this.deletedMatchTombstones.add(id));
        }
      }
    } catch {}

    // Listen to tab-to-tab BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', (event: MessageEvent) => {
        const msg = event.data;
        if (!msg) return;
        if (msg.type === 'TOURNAMENT_UPDATED' && msg.data) {
          this.notifyTournament(msg.data, msg.revision);
        } else if (msg.type === 'LIVE_SQUADS_UPDATED' && msg.data) {
          this.notifySquads(msg.data);
        } else if (msg.type === 'DISPLAY_STATE_UPDATED' && msg.data) {
          this.notifyDisplayState(msg.data);
        }
      });
    }

    // Listen to localStorage events
    window.addEventListener('storage', (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key.startsWith('pointx_live_') || event.key.startsWith('strikz_live_')) {
        const raw = event.newValue;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.id) this.notifyTournament(parsed);
          } catch {}
        }
      } else if (event.key.startsWith('pointx_squads_') || event.key.startsWith('strikz_squads_')) {
        const raw = event.newValue;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed) this.notifySquads(parsed);
          } catch {}
        }
      } else if (event.key.startsWith('pointx_display_')) {
        const raw = event.newValue;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed) this.notifyDisplayState(parsed);
          } catch {}
        }
      }
    });

    // Start background health check & revision reconciliation every 10s
    this.startHealthCheck();
  }

  public setTournament(tournamentId: string): void {
    const cleanId = tournamentId || 'default';
    if (this.currentTournamentId !== cleanId) {
      this.currentTournamentId = cleanId;
      this.currentRevision = 0; // Reset revision for new tournament context
      this.connect();
    } else if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }
  }

  public subscribeTournament(cb: TournamentListener, onHeartbeat?: HeartbeatListener): () => void {
    this.tournamentListeners.add(cb);
    if (onHeartbeat) this.heartbeatListeners.add(onHeartbeat);

    // If we have cached state, deliver it immediately
    const cachedTour = this.getCachedTournament(this.currentTournamentId);
    if (cachedTour) {
      cb(cachedTour, this.currentRevision);
    }

    return () => {
      this.tournamentListeners.delete(cb);
      if (onHeartbeat) this.heartbeatListeners.delete(onHeartbeat);
    };
  }

  public subscribeSquads(cb: SquadListener): () => void {
    this.squadListeners.add(cb);

    const cachedSquads = this.getCachedSquads(this.currentTournamentId);
    if (cachedSquads) {
      cb(cachedSquads);
    }

    return () => {
      this.squadListeners.delete(cb);
    };
  }

  public subscribeDisplay(cb: DisplayListener): () => void {
    this.displayListeners.add(cb);

    const cachedDisplay = this.getCachedDisplayState(this.currentTournamentId);
    if (cachedDisplay) {
      cb(cachedDisplay);
    }

    return () => {
      this.displayListeners.delete(cb);
    };
  }

  public subscribeScoreDelta(cb: (delta: any) => void): () => void {
    this.scoreDeltaListeners.add(cb);
    return () => {
      this.scoreDeltaListeners.delete(cb);
    };
  }

  private notifyScoreDelta(delta: any): void {
    for (const listener of this.scoreDeltaListeners) {
      try {
        listener(delta);
      } catch {}
    }
  }

  public subscribeConnection(cb: ConnectionListener): () => void {
    this.connectionListeners.add(cb);
    cb(this.connectionState);

    return () => {
      this.connectionListeners.delete(cb);
    };
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      for (const listener of this.connectionListeners) {
        try {
          listener(state);
        } catch {}
      }
    }
  }

  private notifyDisplayState(data: BroadcastDisplayState): void {
    for (const listener of this.displayListeners) {
      try {
        listener(data);
      } catch {}
    }
  }

  private role: 'obs' | 'remote' | 'dashboard' = 'dashboard';
  private customToken?: string;
  private customDeviceId?: string;

  public setRole(role: 'obs' | 'remote' | 'dashboard'): void {
    this.role = role;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        tournamentId: this.currentTournamentId,
        role: this.role,
        deviceId: this.getDeviceId(),
        token: this.getToken(),
      }));
    }
  }

  public setAuthCredentials(token?: string, deviceId?: string): void {
    if (token) this.customToken = token;
    if (deviceId) this.customDeviceId = deviceId;
  }

  public getRole(): 'obs' | 'remote' | 'dashboard' {
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      if (search.includes('mode=remote')) return 'remote';
      if (search.includes('mode=broadcast') || search.includes('role=obs')) return 'obs';
    }
    return this.role;
  }

  public getDeviceId(): string {
    if (this.customDeviceId) return this.customDeviceId;
    if (typeof window !== 'undefined' && window.localStorage) {
      let id = window.localStorage.getItem('pointx_remote_device_id');
      if (!id) {
        id = `dev_${Math.random().toString(36).substr(2, 6)}_${Date.now().toString(36).substr(-4)}`;
        window.localStorage.setItem('pointx_remote_device_id', id);
      }
      return id;
    }
    return 'dev_default';
  }

  public getToken(): string {
    if (this.customToken) return this.customToken;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) return urlToken;
      if (window.localStorage) {
        return (
          window.localStorage.getItem(`pointx_remote_token_${this.currentTournamentId}`) ||
          window.localStorage.getItem(`pointx_broadcast_token_${this.currentTournamentId}`) ||
          window.localStorage.getItem(`pointx_token_${this.currentTournamentId}`) ||
          ''
        );
      }
    }
    return '';
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.isConnecting && this.ws && this.ws.readyState === WebSocket.CONNECTING) return;

    const effectiveRole = this.getRole();
    const effectiveDeviceId = this.getDeviceId();
    const effectiveToken = this.getToken();

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.setConnectionState('CONNECTED');
        this.ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          tournamentId: this.currentTournamentId,
          role: effectiveRole,
          deviceId: effectiveDeviceId,
          token: effectiveToken,
        }));
      }
      return;
    }

    this.isConnecting = true;
    this.setConnectionState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    const queryParams = new URLSearchParams({
      tournamentId: this.currentTournamentId,
      role: effectiveRole,
      deviceId: effectiveDeviceId,
    });
    if (effectiveToken) queryParams.set('token', effectiveToken);

    const wsUrl = `${protocol}//${host}/api/sync/ws?${queryParams.toString()}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.setConnectionState('CONNECTED');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'JOIN_ROOM',
            tournamentId: this.currentTournamentId,
            role: effectiveRole,
            deviceId: effectiveDeviceId,
            token: effectiveToken,
          }));
        }
        this.notifyHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {}
      };

      this.ws.onerror = () => {
        this.fallbackToSse();
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.isConnecting = false;
        this.setConnectionState('RECONNECTING');
        this.scheduleReconnect();
      };
    } catch {
      this.fallbackToSse();
      this.scheduleReconnect();
    }
  }

  private fallbackToSse(): void {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;
    if (this.sse) return;

    try {
      this.sse = new EventSource(`/api/sync/stream?tournamentId=${encodeURIComponent(this.currentTournamentId)}`);
      this.sse.onmessage = (event: MessageEvent) => {
        this.setConnectionState('CONNECTED');
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {}
      };
      this.sse.onerror = () => {
        if (this.sse) {
          this.sse.close();
          this.sse = null;
        }
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(msg: any): void {
    if (!msg) return;

    if (msg.type === 'PING') {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PONG' }));
      }
      this.notifyHeartbeat();
      return;
    }

    if (msg.type === 'MATCH_DELETED') {
      const matchId = msg.matchId || msg.payload?.matchId || msg.data?.matchId;
      if (matchId) {
        this.registerDeletedMatch(matchId);
      }
      if (Array.isArray(msg.deletedMatchIds)) {
        msg.deletedMatchIds.forEach((id: string) => this.registerDeletedMatch(id));
      }
    }

    if (msg.type === 'SCORE_DELTA' && msg.data) {
      const delta = msg.data;
      this.notifyScoreDelta(delta);

      const targetTourId = delta.tournamentId || this.currentTournamentId;
      let currentTour = this.getCachedTournament(targetTourId);
      if (!currentTour && targetTourId !== this.currentTournamentId) {
        currentTour = this.getCachedTournament(this.currentTournamentId);
      }

      if (currentTour) {
        const matches = Array.isArray(currentTour.matches)
          ? currentTour.matches.map((m) => ({
              ...m,
              results: Array.isArray(m.results) ? m.results.map((r: any) => ({ ...r })) : [],
            }))
          : [];
        let match = matches.find((m) => m.id === delta.matchId || (m as any).customId === delta.matchId);
        if (!match) {
          match = {
            id: delta.matchId,
            tournamentId: targetTourId,
            matchNumber: 1,
            mapName: 'Bermuda',
            status: 'Live',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            results: [],
          };
          matches.push(match);
        }
        if (!Array.isArray(match.results)) match.results = [];
        const res = match.results.find((r: any) => r.teamId === delta.teamId);
        if (res) {
          res.kills = delta.kills;
          res.placement = delta.placement;
          res.placementPoints = delta.placementPoints;
          res.killPoints = delta.killPoints;
          res.totalPoints = delta.totalPoints;
          res.isBooyah = delta.isBooyah;
          if (delta.bonusPoints !== undefined) res.bonusPoints = delta.bonusPoints;
          if (delta.penaltyPoints !== undefined) res.penaltyPoints = delta.penaltyPoints;
        } else {
          match.results.push({ ...delta });
        }
        const updatedTour: Tournament = {
          ...currentTour,
          matches,
          updatedAt: new Date().toISOString(),
        };
        this.cacheTournament(targetTourId, updatedTour);
        this.notifyTournament(updatedTour, this.currentRevision);
      } else {
        this.fetchAuthoritativeSnapshot();
      }
      this.notifyHeartbeat();
      return;
    }

    if (msg.type === 'STALE_REVISION') {
      if (msg.currentRevision) {
        this.currentRevision = Number(msg.currentRevision);
      }
      const stalePayload = msg.data || msg.payload;
      if (stalePayload) {
        this.handleServerMessage({
          type: 'STATE_UPDATED',
          revision: this.currentRevision,
          data: stalePayload,
          timestamp: msg.timestamp || Date.now(),
        });
      }
      return;
    }

    const incomingRevision = Number(msg.revision || msg.data?.revision || 0);

    // Monotonic Ordering: Reject stale out-of-order packets
    if (incomingRevision > 0 && incomingRevision < this.currentRevision) {
      return;
    }

    if (incomingRevision > 0) {
      this.currentRevision = incomingRevision;
    }

    const payload = msg.data || msg.payload || msg;

    if (payload.tournament) {
      this.cacheTournament(this.currentTournamentId, payload.tournament);
      this.notifyTournament(payload.tournament, this.currentRevision);
    }

    if (payload.squads || payload.isVisible !== undefined || payload.highlightedTeamId !== undefined) {
      const squadState: LiveSquadSyncState = {
        tournamentId: payload.tournamentId || this.currentTournamentId,
        revision: this.currentRevision,
        squads: payload.squads || {},
        highlightedTeamId: payload.highlightedTeamId,
        isVisible: payload.isVisible !== undefined ? payload.isVisible : true,
        timestamp: payload.timestamp || Date.now(),
      };
      this.cacheSquads(this.currentTournamentId, squadState);
      this.notifySquads(squadState);
    }

    // Process display and template updates in real-time
    if (
      payload.activeLayout !== undefined ||
      payload.activeTemplateId !== undefined ||
      payload.activeTemplate !== undefined ||
      payload.activeMatchNumber !== undefined ||
      payload.activeScope !== undefined ||
      payload.customEventTitle !== undefined ||
      payload.customOrgName !== undefined ||
      payload.themeHue !== undefined
    ) {
      const displayState: BroadcastDisplayState = {
        tournamentId: payload.tournamentId || this.currentTournamentId,
        revision: this.currentRevision,
        activeLayout: payload.activeLayout,
        activeTemplateId: payload.activeTemplateId,
        activeTemplate: payload.activeTemplate,
        activeMatchNumber: payload.activeMatchNumber,
        activeScope: payload.activeScope,
        customEventTitle: payload.customEventTitle,
        customOrgName: payload.customOrgName,
        themeHue: payload.themeHue,
        timestamp: payload.timestamp || Date.now(),
      };
      this.cacheDisplayState(this.currentTournamentId, displayState);
      this.notifyDisplayState(displayState);
    }

    this.notifyHeartbeat();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts += 1;
    this.setConnectionState('RECONNECTING');
    // Exponential backoff capped at 5s, never giving up
    const delay = Math.min(500 * Math.pow(1.5, Math.min(this.reconnectAttempts, 8) - 1), 5000);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.fetchAuthoritativeSnapshot();
    }, delay);
  }

  private startHealthCheck(): void {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    this.healthCheckTimer = setInterval(() => {
      // Lightweight HTTP state check every 10 seconds to reconcile state
      this.fetchAuthoritativeSnapshot();
    }, 10000);
  }

  public async fetchAuthoritativeSnapshot(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(`/api/sync/state?tournamentId=${encodeURIComponent(this.currentTournamentId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.handleServerMessage({
          type: 'STATE_UPDATED',
          revision: json.revision || json.data.revision,
          data: json.data,
          timestamp: json.timestamp || Date.now(),
        });
      }
    } catch {}
  }

  public sendUpdate(payload: FullSyncPayload): void {
    const ts = payload.timestamp || Date.now();
    const tourId = payload.tournamentId || this.currentTournamentId;

    // 1. BroadcastChannel (Instant same-browser tabs)
    if (broadcastChannel) {
      try {
        if (payload.tournament) {
          broadcastChannel.postMessage({
            type: 'TOURNAMENT_UPDATED',
            tournamentId: tourId,
            data: payload.tournament,
            timestamp: ts,
          });
        }
        if (payload.squads || payload.isVisible !== undefined || payload.fireTeamIds !== undefined || payload.pointRushTeamIds !== undefined || payload.isPointRushActive !== undefined) {
          broadcastChannel.postMessage({
            type: 'LIVE_SQUADS_UPDATED',
            tournamentId: tourId,
            data: {
              tournamentId: tourId,
              squads: payload.squads || {},
              highlightedTeamId: payload.highlightedTeamId,
              fireTeamIds: payload.fireTeamIds || [],
              pointRushTeamIds: payload.pointRushTeamIds || [],
              isPointRushActive: payload.isPointRushActive || false,
              isVisible: payload.isVisible !== undefined ? payload.isVisible : true,
              timestamp: ts,
            },
          });
        }
        if (
          payload.activeLayout !== undefined ||
          payload.activeTemplateId !== undefined ||
          payload.activeTemplate !== undefined ||
          payload.activeMatchNumber !== undefined ||
          payload.activeScope !== undefined ||
          payload.customEventTitle !== undefined ||
          payload.customOrgName !== undefined ||
          payload.themeHue !== undefined
        ) {
          const displayPayload: BroadcastDisplayState = {
            tournamentId: tourId,
            revision: payload.revision || this.currentRevision,
            activeLayout: payload.activeLayout,
            activeTemplateId: payload.activeTemplateId,
            activeTemplate: payload.activeTemplate,
            activeMatchNumber: payload.activeMatchNumber,
            activeScope: payload.activeScope,
            customEventTitle: payload.customEventTitle,
            customOrgName: payload.customOrgName,
            themeHue: payload.themeHue,
            timestamp: ts,
          };
          broadcastChannel.postMessage({
            type: 'DISPLAY_STATE_UPDATED',
            tournamentId: tourId,
            data: displayPayload,
            timestamp: ts,
          });
        }
      } catch {}
    }

    // 2. Local Notification & Persistence
    if (payload.tournament) {
      this.cacheTournament(tourId, payload.tournament);
      this.notifyTournament(payload.tournament, this.currentRevision);
    }
    if (payload.squads || payload.isVisible !== undefined || payload.fireTeamIds !== undefined || payload.pointRushTeamIds !== undefined || payload.isPointRushActive !== undefined) {
      const squadState: LiveSquadSyncState = {
        tournamentId: tourId,
        squads: payload.squads || {},
        highlightedTeamId: payload.highlightedTeamId,
        fireTeamIds: payload.fireTeamIds || [],
        pointRushTeamIds: payload.pointRushTeamIds || [],
        isPointRushActive: payload.isPointRushActive || false,
        isVisible: payload.isVisible !== undefined ? payload.isVisible : true,
        timestamp: ts,
      };
      this.cacheSquads(tourId, squadState);
      this.notifySquads(squadState);
    }
    if (
      payload.activeLayout !== undefined ||
      payload.activeTemplateId !== undefined ||
      payload.activeTemplate !== undefined ||
      payload.activeMatchNumber !== undefined ||
      payload.activeScope !== undefined ||
      payload.customEventTitle !== undefined ||
      payload.customOrgName !== undefined ||
      payload.themeHue !== undefined
    ) {
      const dispState: BroadcastDisplayState = {
        tournamentId: tourId,
        revision: payload.revision || this.currentRevision,
        activeLayout: payload.activeLayout,
        activeTemplateId: payload.activeTemplateId,
        activeTemplate: payload.activeTemplate,
        activeMatchNumber: payload.activeMatchNumber,
        activeScope: payload.activeScope,
        customEventTitle: payload.customEventTitle,
        customOrgName: payload.customOrgName,
        themeHue: payload.themeHue,
        timestamp: ts,
      };
      this.cacheDisplayState(tourId, dispState);
      this.notifyDisplayState(dispState);
    }

    const effectiveRole = this.getRole();
    const effectiveDeviceId = this.getDeviceId();
    const effectiveToken = this.getToken();

    // 3. Real-time WebSocket Push
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'UPDATE_STATE',
            tournamentId: tourId,
            role: effectiveRole,
            deviceId: effectiveDeviceId,
            token: effectiveToken,
            payload: {
              ...payload,
              role: effectiveRole,
              deviceId: effectiveDeviceId,
              token: effectiveToken,
              tournamentId: tourId,
              timestamp: ts,
            },
          })
        );
        return;
      } catch {}
    }

    // 4. Fallback REST POST if WebSocket is momentarily offline
    fetch('/api/sync/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveToken ? { 'x-broadcast-token': effectiveToken } : {}),
        ...(effectiveDeviceId ? { 'x-device-id': effectiveDeviceId } : {}),
      },
      body: JSON.stringify({
        ...payload,
        role: effectiveRole,
        deviceId: effectiveDeviceId,
        token: effectiveToken,
        tournamentId: tourId,
        timestamp: ts,
      }),
    }).catch(() => {});
  }

  public updateMatchScore(
    tournamentId: string,
    matchId: string,
    result: {
      teamId: string;
      kills?: number;
      placement?: number;
      isBooyah?: boolean;
      bonusPoints?: number;
      penaltyPoints?: number;
    }
  ): void {
    const tourId = tournamentId || this.currentTournamentId;
    const effectiveRole = this.getRole();
    const effectiveDeviceId = this.getDeviceId();
    const effectiveToken = this.getToken();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'UPDATE_MATCH_SCORE',
            tournamentId: tourId,
            role: effectiveRole,
            deviceId: effectiveDeviceId,
            token: effectiveToken,
            payload: {
              tournamentId: tourId,
              matchId,
              ...result,
            },
          })
        );
        return;
      } catch {}
    }

    // Fallback: POST /api/tournaments/:id/matches/:matchId/score
    fetch(`/api/tournaments/${tourId}/matches/${matchId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveToken ? { 'x-broadcast-token': effectiveToken } : {}),
        ...(effectiveDeviceId ? { 'x-device-id': effectiveDeviceId } : {}),
      },
      body: JSON.stringify(result),
    }).catch(() => {});
  }

  public registerDeletedMatch(matchId: string): void {
    if (!matchId) return;
    this.deletedMatchTombstones.add(matchId);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = JSON.parse(window.sessionStorage.getItem('pointx_deleted_matches') || '[]');
        if (!stored.includes(matchId)) {
          stored.push(matchId);
          window.sessionStorage.setItem('pointx_deleted_matches', JSON.stringify(stored));
        }
      }
    } catch {}
  }

  public purgeDeletedMatches(tour: Tournament): Tournament {
    if (!tour || !Array.isArray(tour.matches) || this.deletedMatchTombstones.size === 0) {
      return tour;
    }
    const filtered = tour.matches.filter((m) => !this.deletedMatchTombstones.has(m.id));
    if (filtered.length === tour.matches.length) return tour;
    return { ...tour, matches: filtered };
  }

  private notifyTournament(tour: Tournament, revision?: number): void {
    const cleanTour = this.purgeDeletedMatches(tour);
    const freshTour: Tournament = {
      ...cleanTour,
      matches: Array.isArray(cleanTour.matches)
        ? cleanTour.matches.map((m) => ({
            ...m,
            results: Array.isArray(m.results) ? m.results.map((r: any) => ({ ...r })) : [],
          }))
        : [],
      teams: Array.isArray(cleanTour.teams) ? cleanTour.teams.map((t) => ({ ...t })) : [],
    };
    for (const listener of this.tournamentListeners) {
      try {
        listener(freshTour, revision);
      } catch {}
    }
  }

  private notifySquads(data: LiveSquadSyncState): void {
    for (const listener of this.squadListeners) {
      try {
        listener(data);
      } catch {}
    }
  }

  private notifyHeartbeat(): void {
    for (const listener of this.heartbeatListeners) {
      try {
        listener();
      } catch {}
    }
  }

  public cacheAuthoritativeTournament(tournamentId: string, tour: Tournament): void {
    this.cacheTournament(tournamentId, tour);
  }

  private cacheTournament(tournamentId: string, tour: Tournament): void {
    const cleanTour = this.purgeDeletedMatches(tour);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`pointx_live_${tournamentId}`, JSON.stringify(cleanTour));
        window.localStorage.setItem('pointx_live_ping', String(Date.now()));
      } catch {}
    } else {
      memoryStoreMap.set(`pointx_live_${tournamentId}`, JSON.stringify(cleanTour));
    }
  }

  private getCachedTournament(tournamentId: string): Tournament | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw =
        window.localStorage.getItem(`pointx_live_${tournamentId}`) ||
        window.localStorage.getItem(`strikz_live_${tournamentId}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return parsed ? this.purgeDeletedMatches(parsed) : null;
        } catch {}
      }
    }
    const mem = memoryStoreMap.get(`pointx_live_${tournamentId}`);
    if (mem) {
      try {
        const parsed = JSON.parse(mem);
        return parsed ? this.purgeDeletedMatches(parsed) : null;
      } catch {}
    }
    return null;
  }

  private cacheSquads(tournamentId: string, data: LiveSquadSyncState): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`pointx_squads_${tournamentId}`, JSON.stringify(data));
        window.localStorage.setItem('pointx_squads_ping', String(Date.now()));
      } catch {}
    } else {
      memoryStoreMap.set(`pointx_squads_${tournamentId}`, JSON.stringify(data));
    }
  }

  private getCachedSquads(tournamentId: string): LiveSquadSyncState | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw =
        window.localStorage.getItem(`pointx_squads_${tournamentId}`) ||
        window.localStorage.getItem(`strikz_squads_${tournamentId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    const mem = memoryStoreMap.get(`pointx_squads_${tournamentId}`);
    if (mem) {
      try {
        return JSON.parse(mem);
      } catch {}
    }
    return null;
  }

  private cacheDisplayState(tournamentId: string, data: BroadcastDisplayState): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`pointx_display_${tournamentId}`, JSON.stringify(data));
        window.localStorage.setItem('pointx_display_ping', String(Date.now()));
      } catch {}
    } else {
      memoryStoreMap.set(`pointx_display_${tournamentId}`, JSON.stringify(data));
    }
  }

  private getCachedDisplayState(tournamentId: string): BroadcastDisplayState | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`pointx_display_${tournamentId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    const mem = memoryStoreMap.get(`pointx_display_${tournamentId}`);
    if (mem) {
      try {
        return JSON.parse(mem);
      } catch {}
    }
    return null;
  }
}

// =========================================================================
// PUBLIC CONVENIENCE EXPORTS (Seamless drop-in replacement)
// =========================================================================

export function registerDeletedMatch(matchId: string): void {
  RealtimeSyncClient.getInstance().registerDeletedMatch(matchId);
}

export function purgeDeletedMatches(tournament: Tournament): Tournament {
  return RealtimeSyncClient.getInstance().purgeDeletedMatches(tournament);
}

export function broadcastTournamentUpdate(tournament: Tournament): void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(tournament.id);
  client.sendUpdate({
    tournamentId: tournament.id,
    tournament,
    timestamp: Date.now(),
  });
}

export function broadcastLiveSquadUpdate(data: LiveSquadSyncState): void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(data.tournamentId);
  client.sendUpdate({
    tournamentId: data.tournamentId,
    squads: data.squads,
    highlightedTeamId: data.highlightedTeamId,
    fireTeamIds: data.fireTeamIds || [],
    pointRushTeamIds: data.pointRushTeamIds || [],
    isPointRushActive: data.isPointRushActive || false,
    isVisible: data.isVisible !== undefined ? data.isVisible : true,
    timestamp: Date.now(),
  });
}

export function broadcastFullSync(payload: FullSyncPayload): void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(payload.tournamentId);
  client.sendUpdate(payload);
}

export function subscribeToTournamentLiveUpdates(
  tournamentId: string,
  onUpdate: (tournament: Tournament) => void,
  onHeartbeat?: () => void
): () => void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(tournamentId);
  return client.subscribeTournament(onUpdate, onHeartbeat);
}

export function subscribeToLiveSquadUpdates(
  tournamentId: string,
  onUpdate: (data: LiveSquadSyncState) => void
): () => void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(tournamentId);
  return client.subscribeSquads(onUpdate);
}

export function subscribeToBroadcastDisplayUpdates(
  tournamentId: string,
  onUpdate: (displayState: BroadcastDisplayState) => void
): () => void {
  const client = RealtimeSyncClient.getInstance();
  client.setTournament(tournamentId);
  return client.subscribeDisplay(onUpdate);
}

export function subscribeToConnectionState(cb: (state: ConnectionState) => void): () => void {
  return RealtimeSyncClient.getInstance().subscribeConnection(cb);
}

export function broadcastDisplayUpdate(payload: Partial<BroadcastDisplayState> & { tournamentId?: string }): void {
  const client = RealtimeSyncClient.getInstance();
  const tourId = payload.tournamentId || 'default';
  client.setTournament(tourId);
  client.sendUpdate({
    tournamentId: tourId,
    ...payload,
    timestamp: Date.now(),
  });
}

export function broadcastLayoutChange(layout: string, extra?: Partial<BroadcastDisplayState> & { tournamentId?: string }): void {
  const tourId = extra?.tournamentId || 'default';
  broadcastDisplayUpdate({
    tournamentId: tourId,
    activeLayout: layout,
    ...extra,
  });
}

export function broadcastTemplateLiveUpdate(template: any, extra?: Partial<BroadcastDisplayState> & { tournamentId?: string }): void {
  const tourId = extra?.tournamentId || 'default';
  broadcastDisplayUpdate({
    tournamentId: tourId,
    activeTemplateId: template?.id || template?._id,
    activeTemplate: template,
    ...extra,
  });
}

export function setClientSyncRole(role: 'obs' | 'remote' | 'dashboard'): void {
  RealtimeSyncClient.getInstance().setRole(role);
}

export function setClientSyncAuth(token?: string, deviceId?: string): void {
  RealtimeSyncClient.getInstance().setAuthCredentials(token, deviceId);
}

export function sendMatchScoreUpdate(
  tournamentId: string,
  matchId: string,
  result: {
    teamId: string;
    kills?: number;
    placement?: number;
    isBooyah?: boolean;
    bonusPoints?: number;
    penaltyPoints?: number;
  }
): void {
  RealtimeSyncClient.getInstance().updateMatchScore(tournamentId, matchId, result);
}

export function subscribeToScoreDelta(cb: (delta: any) => void): () => void {
  return RealtimeSyncClient.getInstance().subscribeScoreDelta(cb);
}

export function cacheAuthoritativeTournament(tournamentId: string, tour: Tournament): void {
  RealtimeSyncClient.getInstance().cacheAuthoritativeTournament(tournamentId, tour);
}




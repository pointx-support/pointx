import { RealtimeSyncClient } from './broadcastSync';

export type PlayerState = 'alive' | 'knock' | 'eliminated';

export interface PlayerLiveStatus {
  status: PlayerState;
  updatedAt: number;
}

export interface TeamLiveStatus {
  teamId: string;
  kills: number;
  points: number;
  placementPoints: number;
  killPoints: number;
  placement?: number;
  isBooyah?: boolean;
  bonusPoints?: number;
  penaltyPoints?: number;
  players: Record<string, PlayerLiveStatus>;
  pointRushEnabled: boolean;
  lastKillTimestamp?: number;
}

export interface CanonicalLiveMatchState {
  sessionId: string;
  organizationId: string;
  tournamentId: string;
  matchId: string;
  matchNumber: number;
  revision: number;
  tableVisible: boolean;
  selectedTeamId: string | null;
  selectedPlayerId: string | null;
  fireTeamId: string | null;
  pointRushThreshold: number;
  teams: Record<string, TeamLiveStatus>;
  eliminationOrder: string[];
  isMatchFinished: boolean;
  updatedAt: number;
}

export interface MatchDeltaPatch {
  revision: number;
  matchId: string;
  tableVisible?: boolean;
  selectedTeamId?: string | null;
  selectedPlayerId?: string | null;
  fireTeamId?: string | null;
  pointRushThreshold?: number;
  teams?: Record<string, Partial<TeamLiveStatus>>;
  eliminationOrder?: string[];
  isMatchFinished?: boolean;
  timestamp: number;
}

type StateListener = (state: CanonicalLiveMatchState) => void;
type NextMatchListener = (data: { nextMatchId: string; nextMatchNumber: number; nextMatch: any }) => void;

export class CanonicalLiveStore {
  private static instance: CanonicalLiveStore | null = null;
  private currentState: CanonicalLiveMatchState | null = null;
  private lastAppliedRevision: number = 0;
  private listeners = new Set<StateListener>();
  private nextMatchListeners = new Set<NextMatchListener>();
  private activeMatchId: string = '';
  private activeTourId: string = '';
  private activeOrgId: string = '';

  public static getInstance(): CanonicalLiveStore {
    if (!CanonicalLiveStore.instance) {
      CanonicalLiveStore.instance = new CanonicalLiveStore();
    }
    return CanonicalLiveStore.instance;
  }

  private constructor() {
    if (typeof window === 'undefined') return;

    // Listen to WebSocket messages from RealtimeSyncClient
    const client = RealtimeSyncClient.getInstance();
    client.subscribeRawMessage((msg: any) => {
      this.handleServerMessage(msg);
    });
  }

  public setMatchContext(orgId: string, tourId: string, matchId: string): void {
    if (this.activeMatchId !== matchId || this.activeTourId !== tourId) {
      this.activeOrgId = orgId || 'org-default';
      this.activeTourId = tourId || 'default';
      this.activeMatchId = matchId || 'm1';
      this.lastAppliedRevision = 0;
      this.currentState = null;

      // Join new room on WebSocket
      const client = RealtimeSyncClient.getInstance();
      client.sendRawMessage({
        type: 'JOIN_MATCH',
        organizationId: this.activeOrgId,
        tournamentId: this.activeTourId,
        matchId: this.activeMatchId,
      });

      // Request full state
      client.sendRawMessage({
        type: 'REQUEST_FULL_STATE',
        organizationId: this.activeOrgId,
        tournamentId: this.activeTourId,
        matchId: this.activeMatchId,
        lastAppliedRevision: 0,
      });
    }
  }

  public getState(): CanonicalLiveMatchState | null {
    return this.currentState;
  }

  public getRevision(): number {
    return this.lastAppliedRevision;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    if (this.currentState) {
      listener(this.currentState);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeNextMatch(listener: NextMatchListener): () => void {
    this.nextMatchListeners.add(listener);
    return () => {
      this.nextMatchListeners.delete(listener);
    };
  }

  private notify(): void {
    if (!this.currentState) return;
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch {}
    }
  }

  /**
   * Apply full authoritative state atomically (Latest State Wins)
   */
  public applyAuthoritativeState(state: CanonicalLiveMatchState): void {
    if (!state || !state.matchId) return;

    // Rule: Incoming revision <= current revision: IGNORE (HTTP or stale snapshot must never overwrite newer WebSocket state)
    if (this.currentState && state.revision < this.lastAppliedRevision) {
      return;
    }

    this.currentState = { ...state };
    this.lastAppliedRevision = state.revision;
    this.activeMatchId = state.matchId;
    this.activeTourId = state.tournamentId;
    this.activeOrgId = state.organizationId;
    this.notify();
  }

  /**
   * Apply lightweight diff (~200 bytes) atomically (Latest State Wins)
   */
  public applyAuthoritativePatch(patch: MatchDeltaPatch): void {
    if (!patch || !patch.matchId) return;
    if (this.activeMatchId && patch.matchId !== this.activeMatchId) return;

    // Rule: Incoming revision <= current revision: IGNORE
    if (patch.revision <= this.lastAppliedRevision) {
      return;
    }

    // If there is a revision gap (> +1) and we lack full state, request full state
    if (this.lastAppliedRevision > 0 && patch.revision > this.lastAppliedRevision + 5) {
      const client = RealtimeSyncClient.getInstance();
      client.sendRawMessage({
        type: 'REQUEST_FULL_STATE',
        organizationId: this.activeOrgId,
        tournamentId: this.activeTourId,
        matchId: this.activeMatchId,
        lastAppliedRevision: this.lastAppliedRevision,
      });
    }

    if (!this.currentState) {
      // If we don't have base state yet, wait for FULL_MATCH_STATE
      return;
    }

    // Atomically merge the delta patch
    this.lastAppliedRevision = patch.revision;
    this.currentState.revision = patch.revision;
    this.currentState.updatedAt = patch.timestamp || Date.now();

    if (patch.tableVisible !== undefined) {
      this.currentState.tableVisible = patch.tableVisible;
    }
    if (patch.selectedTeamId !== undefined) {
      this.currentState.selectedTeamId = patch.selectedTeamId;
    }
    if (patch.selectedPlayerId !== undefined) {
      this.currentState.selectedPlayerId = patch.selectedPlayerId;
    }
    if (patch.fireTeamId !== undefined) {
      this.currentState.fireTeamId = patch.fireTeamId;
    }
    if (patch.pointRushThreshold !== undefined) {
      this.currentState.pointRushThreshold = patch.pointRushThreshold;
    }
    if (patch.eliminationOrder !== undefined) {
      this.currentState.eliminationOrder = patch.eliminationOrder;
    }
    if (patch.isMatchFinished !== undefined) {
      this.currentState.isMatchFinished = patch.isMatchFinished;
    }

    if (patch.teams) {
      for (const [teamId, teamPatch] of Object.entries(patch.teams)) {
        if (!this.currentState.teams[teamId]) {
          this.currentState.teams[teamId] = {
            teamId,
            kills: 0,
            points: 0,
            placementPoints: 0,
            killPoints: 0,
            players: {},
            pointRushEnabled: false,
            ...teamPatch,
          } as TeamLiveStatus;
        } else {
          const t = this.currentState.teams[teamId];
          if (teamPatch.kills !== undefined) t.kills = teamPatch.kills;
          if (teamPatch.points !== undefined) t.points = teamPatch.points;
          if (teamPatch.killPoints !== undefined) t.killPoints = teamPatch.killPoints;
          if (teamPatch.placementPoints !== undefined) t.placementPoints = teamPatch.placementPoints;
          if (teamPatch.pointRushEnabled !== undefined) t.pointRushEnabled = teamPatch.pointRushEnabled;
          if (teamPatch.lastKillTimestamp !== undefined) t.lastKillTimestamp = teamPatch.lastKillTimestamp;

          if (teamPatch.players) {
            for (const [pid, pstatus] of Object.entries(teamPatch.players)) {
              t.players[pid] = { ...t.players[pid], ...pstatus };
            }
          }
        }
      }
    }

    this.notify();
  }

  public sendCommand(
    command: 'ADD_KILLS' | 'SET_PLAYER_STATUS' | 'WIPE_SQUAD' | 'REVIVE_SQUAD' | 'SET_TABLE_VISIBILITY' | 'SELECT_TEAM' | 'SELECT_PLAYER' | 'SET_POINT_RUSH_THRESHOLD' | 'FINALIZE_MATCH' | 'NEXT_MATCH',
    payload: any
  ): string {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const client = RealtimeSyncClient.getInstance();

    // Optimistic local update for instant UI feedback (7 + 4 = 11 immediately!)
    if (this.currentState) {
      if (command === 'ADD_KILLS') {
        const teamId = payload.teamId;
        const delta = Number(payload.delta ?? payload.kills ?? 1);
        const t = this.currentState.teams[teamId];
        if (t) {
          t.kills = Math.max(0, t.kills + delta);
          t.killPoints = t.kills * 1;
          t.points = t.placementPoints + t.killPoints;
          t.pointRushEnabled = t.points >= this.currentState.pointRushThreshold;
          this.notify();
        }
      } else if (command === 'SET_PLAYER_STATUS') {
        const { teamId, playerId, status } = payload;
        const t = this.currentState.teams[teamId];
        if (t && t.players[playerId]) {
          t.players[playerId].status = status;
          this.notify();
        }
      } else if (command === 'SET_TABLE_VISIBILITY') {
        this.currentState.tableVisible = Boolean(payload.visible);
        this.notify();
      }
    }

    client.sendRawMessage({
      type: 'COMMAND',
      commandId,
      command,
      organizationId: this.activeOrgId,
      tournamentId: this.activeTourId,
      matchId: this.activeMatchId,
      payload,
      timestamp: Date.now(),
    });

    return commandId;
  }

  private handleServerMessage(msg: any): void {
    if (!msg) return;

    if (msg.type === 'MATCH_DELTA' && msg.patch) {
      this.applyAuthoritativePatch(msg.patch);
    } else if (msg.type === 'FULL_MATCH_STATE' && msg.state) {
      this.applyAuthoritativeState(msg.state);
    } else if (msg.type === 'INITIAL_MATCH_STATE' && msg.data) {
      this.applyAuthoritativeState(msg.data);
    } else if (msg.type === 'NEXT_MATCH_READY' && msg.data) {
      for (const listener of this.nextMatchListeners) {
        try {
          listener(msg.data);
        } catch {}
      }
    }
  }
}

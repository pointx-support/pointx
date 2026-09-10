import Redis from 'ioredis';
import { env } from '../config/env';
import { Tournament } from '../models/Tournament';

export type PlayerState = 'alive' | 'knock' | 'eliminated';

export interface PlayerLiveStatus {
  status: PlayerState;
  updatedAt: number;
}

export interface TeamLiveStatus {
  teamId: string;
  name?: string;
  tag?: string;
  slotNumber?: number;
  logoUrl?: string;
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

export interface RemoteCommand {
  commandId: string;
  command:
    | 'ADD_KILLS'
    | 'SET_PLAYER_STATUS'
    | 'WIPE_SQUAD'
    | 'REVIVE_SQUAD'
    | 'RESET_ALIVE'
    | 'SET_TABLE_VISIBILITY'
    | 'SELECT_TEAM'
    | 'SELECT_PLAYER'
    | 'SET_POINT_RUSH_THRESHOLD'
    | 'FINALIZE_MATCH'
    | 'REOPEN_MATCH'
    | 'NEXT_MATCH'
    | 'REFRESH_OVERLAY';
  sessionId?: string;
  organizationId: string;
  tournamentId: string;
  matchId: string;
  payload: any;
  timestamp?: number;
}

const inMemoryStore = new Map<string, CanonicalLiveMatchState>();
const processedCommandIds = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;
  for (const [cmdId, time] of processedCommandIds.entries()) {
    if (now - time > TEN_MIN) {
      processedCommandIds.delete(cmdId);
    }
  }
}, 5 * 60 * 1000);

export class LiveStateStore {
  private static instance: LiveStateStore | null = null;
  private redis: Redis | null = null;
  private isRedisConnected: boolean = false;

  public static getInstance(): LiveStateStore {
    if (!LiveStateStore.instance) {
      LiveStateStore.instance = new LiveStateStore();
    }
    return LiveStateStore.instance;
  }

  private constructor() {
    const redisUrl = process.env.REDIS_URL || (env as any).REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 500, 2000);
          },
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          console.log('⚡ [Redis] Live State Store connected successfully');
        });

        this.redis.on('error', () => {
          this.isRedisConnected = false;
        });

        this.redis.connect().catch(() => {
          this.isRedisConnected = false;
        });
      } catch {
        this.isRedisConnected = false;
      }
    }
  }

  public isHealthy(): boolean {
    return true;
  }

  private getKey(orgId: string, tournamentId: string, matchId: string): string {
    return `pointx:live:${orgId || 'org-default'}:${tournamentId || 'tour-default'}:${matchId || 'm1'}`;
  }

  public isCommandProcessed(commandId: string): boolean {
    if (!commandId) return false;
    return processedCommandIds.has(commandId);
  }

  public markCommandProcessed(commandId: string): void {
    if (!commandId) return;
    processedCommandIds.set(commandId, Date.now());
  }

  public async getOrCreateLiveState(
    organizationId: string,
    tournamentId: string,
    matchId: string,
    tournamentDoc?: any
  ): Promise<CanonicalLiveMatchState> {
    const key = this.getKey(organizationId, tournamentId, matchId);

    let state = inMemoryStore.get(key);
    if (state) return state;

    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw) {
          state = JSON.parse(raw);
          if (state) {
            inMemoryStore.set(key, state);
            return state;
          }
        }
      } catch {}
    }

    let tour = tournamentDoc;
    if (!tour && tournamentId && tournamentId !== 'default') {
      try {
        const idQueries: any[] = [{ customId: tournamentId }];
        if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
          idQueries.push({ _id: tournamentId });
        }
        tour = await Tournament.findOne({ $or: idQueries }).lean();
      } catch {}
    }

    const effectiveOrgId = organizationId || (tour?.organizationId ? String(tour.organizationId) : 'org-default');
    const effectiveMatchId = matchId || (tour?.matches?.[0]?.id || (tour?.matches && tour.matches.length > 0 ? `m_${tournamentId}_1` : 'none'));
    const matchNumber = tour?.matches?.find((m: any) => m.id === effectiveMatchId)?.matchNumber || (tour?.matches && tour.matches.length > 0 ? 1 : 0);
    const threshold = tour?.scoringPreset?.pointRushThreshold ?? 50;

    const teamsMap: Record<string, TeamLiveStatus> = {};
    const effectiveTeams = Array.isArray(tour?.teams) && tour.teams.length > 0 ? tour.teams : [];

    const existingMatch = tour?.matches?.find((m: any) => (m.id || m.customId) === effectiveMatchId);
    const resultsMap = new Map<string, any>();
    if (existingMatch && Array.isArray(existingMatch.results)) {
      existingMatch.results.forEach((r: any) => resultsMap.set(r.teamId, r));
    }

    effectiveTeams.forEach((t: any, teamIdx: number) => {
      const res = resultsMap.get(t.id);
      const playersObj: Record<string, PlayerLiveStatus> = {};
      const teamPlayers = Array.isArray(t.players) && t.players.length > 0 ? t.players : [{ id: `${t.id}-p1` }, { id: `${t.id}-p2` }, { id: `${t.id}-p3` }, { id: `${t.id}-p4` }];

      teamPlayers.forEach((p: any, idx: number) => {
        const pid = p.id || `${t.id}-p${idx + 1}`;
        playersObj[pid] = { status: 'alive', updatedAt: Date.now() };
      });

      const kills = res?.kills || 0;
      const points = res?.totalPoints || 0;

      teamsMap[t.id] = {
        teamId: t.id,
        name: t.name || `Team ${t.slotNumber || teamIdx + 1}`,
        tag: t.tag || (t.name ? t.name.slice(0, 4).toUpperCase() : `T${t.slotNumber || teamIdx + 1}`),
        slotNumber: t.slotNumber || teamIdx + 1,
        logoUrl: t.logoUrl || '',
        kills,
        points,
        placementPoints: res?.placementPoints || 0,
        killPoints: res?.killPoints || (kills * (tour?.scoringPreset?.killPoints ?? 1)),
        placement: res?.placement,
        isBooyah: res?.isBooyah || false,
        bonusPoints: res?.bonusPoints || 0,
        penaltyPoints: res?.penaltyPoints || 0,
        players: playersObj,
        pointRushEnabled: points >= threshold,
        lastKillTimestamp: kills > 0 ? Date.now() : undefined,
      };
    });

    const fireTeamId = this.calculateFireTeamId(teamsMap);

    state = {
      sessionId: `sess_${effectiveOrgId}_${tournamentId}_${effectiveMatchId}`,
      organizationId: effectiveOrgId,
      tournamentId,
      matchId: effectiveMatchId,
      matchNumber,
      revision: 1,
      tableVisible: true,
      selectedTeamId: null,
      selectedPlayerId: null,
      fireTeamId,
      pointRushThreshold: threshold,
      teams: teamsMap,
      eliminationOrder: [],
      isMatchFinished: false,
      updatedAt: Date.now(),
    };

    inMemoryStore.set(key, state);
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(state), 'EX', 86400);
      } catch {}
    }

    return state;
  }

  public calculateFireTeamId(teams: Record<string, TeamLiveStatus>): string | null {
    let topKills = 0;
    let candidates: TeamLiveStatus[] = [];

    for (const team of Object.values(teams)) {
      if (team.kills > topKills) {
        topKills = team.kills;
        candidates = [team];
      } else if (team.kills === topKills && team.kills > 0) {
        candidates.push(team);
      }
    }

    if (topKills === 0 || candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0].teamId;
    }

    candidates.sort((a, b) => {
      const timeA = a.lastKillTimestamp || Number.MAX_SAFE_INTEGER;
      const timeB = b.lastKillTimestamp || Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      return a.teamId.localeCompare(b.teamId);
    });

    return candidates[0].teamId;
  }

  public recalculatePointRush(state: CanonicalLiveMatchState): void {
    const threshold = state.pointRushThreshold;
    for (const team of Object.values(state.teams)) {
      team.pointRushEnabled = team.points >= threshold;
    }
  }

  public async applyCommand(command: RemoteCommand, scoringPreset?: any): Promise<{ state: CanonicalLiveMatchState; patch: MatchDeltaPatch }> {
    const { organizationId, tournamentId, matchId, command: action, payload, commandId } = command;

    if (commandId && this.isCommandProcessed(commandId)) {
      const existing = await this.getOrCreateLiveState(organizationId, tournamentId, matchId);
      return {
        state: existing,
        patch: {
          revision: existing.revision,
          matchId: existing.matchId,
          timestamp: existing.updatedAt,
        },
      };
    }

    const state = await this.getOrCreateLiveState(organizationId, tournamentId, matchId);
    const oldFire = state.fireTeamId;
    const now = Date.now();

    state.revision += 1;
    state.updatedAt = now;

    const diff: Partial<MatchDeltaPatch> = {
      revision: state.revision,
      matchId: state.matchId,
      timestamp: now,
    };

    switch (action) {
      case 'ADD_KILLS': {
        const teamId = payload.teamId;
        const delta = Number(payload.delta ?? payload.kills ?? 1);
        const team = state.teams[teamId];

        if (team) {
          team.kills = Math.max(0, team.kills + delta);
          team.lastKillTimestamp = now;

          const killRate = scoringPreset?.killPoints ?? 1;
          team.killPoints = team.kills * killRate;
          team.points = team.placementPoints + team.killPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);

          team.pointRushEnabled = team.points >= state.pointRushThreshold;

          state.fireTeamId = this.calculateFireTeamId(state.teams);

          diff.teams = {
            [teamId]: {
              kills: team.kills,
              points: team.points,
              killPoints: team.killPoints,
              pointRushEnabled: team.pointRushEnabled,
              lastKillTimestamp: team.lastKillTimestamp,
            },
          };

          if (state.fireTeamId !== oldFire) {
            diff.fireTeamId = state.fireTeamId;
          }
        }
        break;
      }

      case 'SET_PLAYER_STATUS': {
        const { teamId, playerId, status } = payload;
        const team = state.teams[teamId];
        if (team) {
          if (!team.players[playerId]) {
            team.players[playerId] = { status, updatedAt: now };
          } else {
            team.players[playerId].status = status;
            team.players[playerId].updatedAt = now;
          }

          const allDead = Object.values(team.players).every((p) => p.status === 'eliminated');
          if (allDead && !state.eliminationOrder.includes(teamId)) {
            state.eliminationOrder.push(teamId);
            diff.eliminationOrder = state.eliminationOrder;
          } else if (!allDead && state.eliminationOrder.includes(teamId)) {
            state.eliminationOrder = state.eliminationOrder.filter((id) => id !== teamId);
            diff.eliminationOrder = state.eliminationOrder;
          }

          diff.teams = {
            [teamId]: {
              players: {
                [playerId]: team.players[playerId],
              },
            },
          };
        }
        break;
      }

      case 'WIPE_SQUAD': {
        const teamId = payload.teamId;
        const team = state.teams[teamId];
        if (team) {
          for (const pid of Object.keys(team.players)) {
            team.players[pid].status = 'eliminated';
            team.players[pid].updatedAt = now;
          }

          if (!state.eliminationOrder.includes(teamId)) {
            state.eliminationOrder.push(teamId);
            diff.eliminationOrder = state.eliminationOrder;
          }

          diff.teams = {
            [teamId]: {
              players: team.players,
            },
          };
        }
        break;
      }

      case 'REVIVE_SQUAD': {
        const teamId = payload.teamId;
        const team = state.teams[teamId];
        if (team) {
          for (const pid of Object.keys(team.players)) {
            team.players[pid].status = 'alive';
            team.players[pid].updatedAt = now;
          }

          state.eliminationOrder = state.eliminationOrder.filter((id) => id !== teamId);
          diff.eliminationOrder = state.eliminationOrder;

          diff.teams = {
            [teamId]: {
              players: team.players,
            },
          };
        }
        break;
      }

      case 'SET_TABLE_VISIBILITY': {
        const visible = Boolean(payload.visible);
        state.tableVisible = visible;
        diff.tableVisible = visible;
        break;
      }

      case 'SELECT_TEAM': {
        state.selectedTeamId = payload.teamId ?? null;
        diff.selectedTeamId = state.selectedTeamId;
        break;
      }

      case 'SELECT_PLAYER': {
        state.selectedPlayerId = payload.playerId ?? null;
        diff.selectedPlayerId = state.selectedPlayerId;
        break;
      }

      case 'SET_POINT_RUSH_THRESHOLD': {
        const newThreshold = Number(payload.threshold || 50);
        state.pointRushThreshold = newThreshold;
        this.recalculatePointRush(state);

        diff.pointRushThreshold = newThreshold;
        const updatedTeams: Record<string, Partial<TeamLiveStatus>> = {};
        for (const [tid, t] of Object.entries(state.teams)) {
          updatedTeams[tid] = { pointRushEnabled: t.pointRushEnabled };
        }
        diff.teams = updatedTeams;
        break;
      }

      case 'RESET_ALIVE': {
        state.eliminationOrder = [];
        diff.eliminationOrder = [];
        const updatedTeams: Record<string, Partial<TeamLiveStatus>> = {};

        for (const [tid, team] of Object.entries(state.teams)) {
          for (const pid of Object.keys(team.players)) {
            team.players[pid].status = 'alive';
            team.players[pid].updatedAt = now;
          }
          updatedTeams[tid] = { players: team.players };
        }
        diff.teams = updatedTeams;
        break;
      }

      case 'FINALIZE_MATCH': {
        state.isMatchFinished = true;
        diff.isMatchFinished = true;
        break;
      }

      case 'REOPEN_MATCH': {
        state.isMatchFinished = false;
        diff.isMatchFinished = false;
        break;
      }
    }

    if (commandId) {
      this.markCommandProcessed(commandId);
    }

    const key = this.getKey(organizationId, tournamentId, matchId);
    inMemoryStore.set(key, state);
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(state), 'EX', 86400);
      } catch {}
    }

    return {
      state,
      patch: diff as MatchDeltaPatch,
    };
  }

  public async removeMatchState(organizationId: string, tournamentId: string, matchId: string): Promise<void> {
    const key = this.getKey(organizationId, tournamentId, matchId);
    inMemoryStore.delete(key);
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch {}
    }
  }
}

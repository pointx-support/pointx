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
  isOnFire?: boolean;
  isPointRushManual?: boolean;
  priorTotalPoints?: number;
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
    | 'TOGGLE_TEAM_FIRE'
    | 'TOGGLE_TEAM_RUSH'
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
    let tour = tournamentDoc;
    if (!tour && tournamentId && tournamentId !== 'default' && tournamentId !== 'none') {
      try {
        const idQueries: any[] = [{ customId: tournamentId }];
        if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
          idQueries.push({ _id: tournamentId });
        }
        tour = await Tournament.findOne({ $or: idQueries }).lean();
      } catch {}
    }

    const canonicalTourId = tour?.customId || (tour?._id ? String(tour._id) : tournamentId);
    const key = this.getKey(organizationId, canonicalTourId, matchId);
    const aliasKey = this.getKey(organizationId, tournamentId, matchId);

    let state = inMemoryStore.get(key) || inMemoryStore.get(aliasKey);
    if (state) {
      inMemoryStore.set(key, state);
      inMemoryStore.set(aliasKey, state);
      return state;
    }

    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key) || await this.redis.get(aliasKey);
        if (raw) {
          state = JSON.parse(raw);
          if (state) {
            inMemoryStore.set(key, state);
            inMemoryStore.set(aliasKey, state);
            return state;
          }
        }
      } catch {}
    }

    const effectiveOrgId = organizationId || (tour?.organizationId ? String(tour.organizationId) : 'org-default');
    const hasMatches = Array.isArray(tour?.matches) && tour.matches.length > 0;
    const requestedMatch = hasMatches ? tour.matches.find((m: any) => (m.id || m.customId) === matchId) : null;
    const effectiveMatchId = requestedMatch
      ? (requestedMatch.id || requestedMatch.customId)
      : (matchId && matchId !== 'none'
          ? matchId
          : (hasMatches
              ? (tour.matches[0].id || tour.matches[0].customId)
              : 'none'));

    // Resolve match number intelligently (e.g. from match document, or live-match-2 -> 2)
    let matchNumber = 1;
    if (requestedMatch?.matchNumber) {
      matchNumber = requestedMatch.matchNumber;
    } else if (matchId && matchId.match(/match.*?(\d+)/i)) {
      matchNumber = parseInt(matchId.match(/match.*?(\d+)/i)![1], 10);
    } else if (effectiveMatchId === 'none') {
      matchNumber = 0;
    } else if (hasMatches) {
      matchNumber = tour.matches.length + 1;
    }
    const threshold = tour?.scoringPreset?.pointRushThreshold ?? 50;

    // Sum up totalPoints for each team from prior COMPLETED matches
    const priorCompletedMatches = Array.isArray(tour?.matches)
      ? tour.matches.filter((m: any) => m.status === 'Completed' && (m.id || m.customId) !== effectiveMatchId)
      : [];

    const teamsMap: Record<string, TeamLiveStatus> = {};
    const effectiveTeams = Array.isArray(tour?.teams) && tour.teams.length > 0
      ? tour.teams
      : [];

    const existingMatch = tour?.matches?.find((m: any) => (m.id || m.customId) === effectiveMatchId);
    const resultsMap = new Map<string, any>();
    if (existingMatch && Array.isArray(existingMatch.results)) {
      existingMatch.results.forEach((r: any) => resultsMap.set(r.teamId, r));
    }

    if (effectiveMatchId !== 'none') {
      effectiveTeams.forEach((t: any, teamIdx: number) => {
        const res = resultsMap.get(t.id);
        const playersObj: Record<string, PlayerLiveStatus> = {};
        const rawPlayers = Array.isArray(t.players) ? [...t.players] : [];
        while (rawPlayers.length < 4) {
          rawPlayers.push({ id: `${t.id}-p${rawPlayers.length + 1}`, name: `Player ${rawPlayers.length + 1}` });
        }
        const teamPlayers = rawPlayers;

        teamPlayers.forEach((p: any, idx: number) => {
          const pid = p.id || `${t.id}-p${idx + 1}`;
          playersObj[pid] = { status: 'alive', updatedAt: Date.now() };
        });

        // Compute prior matches total points
        let priorTotalPoints = 0;
        for (const pm of priorCompletedMatches) {
          if (Array.isArray(pm.results)) {
            const priorRes = pm.results.find((r: any) => r.teamId === t.id);
            if (priorRes && priorRes.totalPoints !== undefined) {
              priorTotalPoints += Number(priorRes.totalPoints) || 0;
            }
          }
        }

        const kills = res?.kills || 0;
        const killRate = tour?.scoringPreset?.killPoints ?? 1;
        const killPoints = res?.killPoints || (kills * killRate);
        const placementPoints = res?.placementPoints || 0;
        const points = priorTotalPoints + killPoints + placementPoints + (res?.bonusPoints || 0) - (res?.penaltyPoints || 0);

        teamsMap[t.id] = {
          teamId: t.id,
          name: t.name || `Team ${t.slotNumber || teamIdx + 1}`,
          tag: t.tag || (t.name ? t.name.slice(0, 4).toUpperCase() : `T${t.slotNumber || teamIdx + 1}`),
          slotNumber: t.slotNumber || teamIdx + 1,
          logoUrl: t.logoUrl || '',
          kills,
          points,
          placementPoints,
          killPoints,
          placement: res?.placement,
          isBooyah: res?.isBooyah || false,
          bonusPoints: res?.bonusPoints || 0,
          penaltyPoints: res?.penaltyPoints || 0,
          players: playersObj,
          pointRushEnabled: points >= threshold,
          priorTotalPoints,
          lastKillTimestamp: kills > 0 ? Date.now() : undefined,
        };
      });
    }

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
    inMemoryStore.set(aliasKey, state);
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(state), 'EX', 86400);
        await this.redis.set(aliasKey, JSON.stringify(state), 'EX', 86400);
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
      if (team.isPointRushManual === undefined) {
        team.pointRushEnabled = team.points >= threshold;
      }
    }
  }

  public checkAndApplyAutoBooyah(state: CanonicalLiveMatchState, diff: Partial<MatchDeltaPatch>): void {
    const allSquads = Object.values(state.teams);
    if (allSquads.length <= 1) return;

    const aliveSquads = allSquads.filter((t) => {
      const players = Object.values(t.players);
      return players.some((p) => p.status === 'alive' || p.status === 'knock');
    });

    if (aliveSquads.length === 1) {
      const booyahWinner = aliveSquads[0];
      booyahWinner.isBooyah = true;
      state.isMatchFinished = true;
      diff.isMatchFinished = true;
      if (!diff.teams) diff.teams = {};
      diff.teams[booyahWinner.teamId] = {
        ...(diff.teams[booyahWinner.teamId] || {}),
        isBooyah: true,
      };

      // Clear isBooyah on ALL other squads so multiple teams can NEVER hold Booyah simultaneously
      for (const t of allSquads) {
        if (t.teamId !== booyahWinner.teamId && t.isBooyah) {
          t.isBooyah = false;
          diff.teams[t.teamId] = {
            ...(diff.teams[t.teamId] || {}),
            isBooyah: false,
          };
        }
      }
    } else {
      // More than 1 team alive OR 0 teams alive: no single Booyah exists
      if (state.isMatchFinished) {
        state.isMatchFinished = false;
        diff.isMatchFinished = false;
      }
      if (!diff.teams) diff.teams = {};
      for (const t of allSquads) {
        if (t.isBooyah) {
          t.isBooyah = false;
          diff.teams[t.teamId] = {
            ...(diff.teams[t.teamId] || {}),
            isBooyah: false,
          };
        }
      }
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
          team.points = (team.priorTotalPoints || 0) + team.placementPoints + team.killPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);

          if (team.isPointRushManual === undefined) {
            team.pointRushEnabled = team.points >= state.pointRushThreshold;
          }

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

          if (allDead && team.isBooyah) {
            team.isBooyah = false;
          }

          diff.teams = {
            [teamId]: {
              players: {
                [playerId]: team.players[playerId],
              },
              ...(allDead && !team.isBooyah ? { isBooyah: false } : {}),
            },
          };

          this.checkAndApplyAutoBooyah(state, diff);
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

          if (team.isBooyah) {
            team.isBooyah = false;
          }

          if (!state.eliminationOrder.includes(teamId)) {
            state.eliminationOrder.push(teamId);
            diff.eliminationOrder = state.eliminationOrder;
          }

          diff.teams = {
            [teamId]: {
              players: team.players,
              isBooyah: false,
            },
          };

          this.checkAndApplyAutoBooyah(state, diff);
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

          this.checkAndApplyAutoBooyah(state, diff);
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

      case 'TOGGLE_TEAM_FIRE': {
        const teamId = payload.teamId;
        const team = state.teams[teamId];
        if (team) {
          const currentlyOnFire = team.isOnFire === true || (team.isOnFire !== false && state.fireTeamId === teamId);
          team.isOnFire = payload.enabled !== undefined ? Boolean(payload.enabled) : !currentlyOnFire;

          // If turning off and this was the auto leader, clear fireTeamId so it stops burning
          if (!team.isOnFire && state.fireTeamId === teamId) {
            state.fireTeamId = null;
          }

          diff.teams = {
            [teamId]: {
              isOnFire: team.isOnFire,
            },
          };
          if (state.fireTeamId !== oldFire) {
            diff.fireTeamId = state.fireTeamId;
          }
        }
        break;
      }

      case 'TOGGLE_TEAM_RUSH': {
        const teamId = payload.teamId;
        const team = state.teams[teamId];
        if (team) {
          const nextRush = payload.enabled !== undefined ? Boolean(payload.enabled) : !team.pointRushEnabled;
          team.pointRushEnabled = nextRush;
          team.isPointRushManual = nextRush;

          diff.teams = {
            [teamId]: {
              pointRushEnabled: team.pointRushEnabled,
              isPointRushManual: team.isPointRushManual,
            },
          };
        }
        break;
      }

      case 'RESET_ALIVE': {
        state.eliminationOrder = [];
        diff.eliminationOrder = [];
        state.isMatchFinished = false;
        diff.isMatchFinished = false;
        const updatedTeams: Record<string, Partial<TeamLiveStatus>> = {};

        for (const [tid, team] of Object.entries(state.teams)) {
          team.isBooyah = false;
          for (const pid of Object.keys(team.players)) {
            team.players[pid].status = 'alive';
            team.players[pid].updatedAt = now;
          }
          updatedTeams[tid] = { players: team.players, isBooyah: false };
        }
        diff.teams = updatedTeams;
        break;
      }

      case 'FINALIZE_MATCH': {
        state.isMatchFinished = true;
        diff.isMatchFinished = true;

        const defaultPlacementPts: Record<number, number> = {
          1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0,
        };
        const scoringPlacements = scoringPreset?.placementPoints || defaultPlacementPts;
        const booyahBonus = scoringPreset?.booyahBonus ?? 0;
        const killRate = scoringPreset?.killPoints ?? 1;

        const eliminatedIds = [...state.eliminationOrder];
        const survivingTeams = Object.values(state.teams).filter((t) => !eliminatedIds.includes(t.teamId));

        survivingTeams.sort((a, b) => b.kills - a.kills);

        const updatedTeams: Record<string, Partial<TeamLiveStatus>> = {};

        survivingTeams.forEach((team, idx) => {
          const placement = idx + 1;
          const isBooyah = placement === 1;
          const placePts = (typeof scoringPlacements.get === 'function' ? scoringPlacements.get(String(placement)) : scoringPlacements[placement]) ?? 0;
          team.placement = placement;
          team.isBooyah = isBooyah;
          team.placementPoints = placePts + (isBooyah ? booyahBonus : 0);
          team.killPoints = team.kills * killRate;
          team.points = (team.priorTotalPoints || 0) + team.placementPoints + team.killPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);
          team.pointRushEnabled = team.points >= state.pointRushThreshold;
          updatedTeams[team.teamId] = {
            placement: team.placement,
            isBooyah: team.isBooyah,
            placementPoints: team.placementPoints,
            killPoints: team.killPoints,
            points: team.points,
            pointRushEnabled: team.pointRushEnabled,
          };
        });

        const reversedEliminated = [...eliminatedIds].reverse();
        reversedEliminated.forEach((teamId, idx) => {
          const team = state.teams[teamId];
          if (team) {
            const placement = survivingTeams.length + 1 + idx;
            const placePts = (typeof scoringPlacements.get === 'function' ? scoringPlacements.get(String(placement)) : scoringPlacements[placement]) ?? 0;
            team.placement = placement;
            team.isBooyah = false;
            team.placementPoints = placePts;
            team.killPoints = team.kills * killRate;
            team.points = (team.priorTotalPoints || 0) + team.placementPoints + team.killPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);
            team.pointRushEnabled = team.points >= state.pointRushThreshold;
            updatedTeams[teamId] = {
              placement: team.placement,
              isBooyah: team.isBooyah,
              placementPoints: team.placementPoints,
              killPoints: team.killPoints,
              points: team.points,
              pointRushEnabled: team.pointRushEnabled,
            };
          }
        });

        diff.teams = updatedTeams;
        break;
      }

      case 'REOPEN_MATCH': {
        state.isMatchFinished = false;
        diff.isMatchFinished = false;
        const updatedTeams: Record<string, Partial<TeamLiveStatus>> = {};
        for (const [tid, team] of Object.entries(state.teams)) {
          team.placement = undefined;
          team.isBooyah = false;
          team.placementPoints = 0;
          team.points = (team.priorTotalPoints || 0) + team.killPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);
          team.pointRushEnabled = team.points >= state.pointRushThreshold;
          updatedTeams[tid] = {
            placement: undefined,
            isBooyah: false,
            placementPoints: 0,
            points: team.points,
            pointRushEnabled: team.pointRushEnabled,
          };
        }
        diff.teams = updatedTeams;
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

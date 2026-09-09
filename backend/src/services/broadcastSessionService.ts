import mongoose from 'mongoose';
import { BroadcastSession, IBroadcastSession, PlayerState, BroadcastMode } from '../models/BroadcastSession';
import { Tournament, ITournament } from '../models/Tournament';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { calculateTeamMatchScore, normalizeScoringConfig } from './scoringEngine';
import { broadcastToSession } from './realtimeSync';

export interface BroadcastCommand {
  commandId?: string;
  commandType:
    | 'ADD_KILL'
    | 'REMOVE_KILL'
    | 'SET_PLAYER_STATUS'
    | 'WIPE_SQUAD'
    | 'REVIVE_SQUAD'
    | 'RESET_ALIVE'
    | 'SET_MODE'
    | 'SET_TABLE_VISIBILITY'
    | 'SET_POINT_RUSH'
    | 'ADD_POINT_ALL_TEAMS'
    | 'CHANGE_MATCH'
    | 'SELECT_PLAYER'
    | 'RESET_BROADCAST'
    | 'FINISH_MATCH'
    | 'REOPEN_MATCH'
    | 'SET_FIRE'
    | 'TOGGLE_FIRE'
    | 'REFRESH_OVERLAY'
    | 'SUBMIT_MATCH_REPORT';
  targetTeamId?: string;
  payload?: any;
}

/**
 * Mutex lock queue per sessionId to serialize concurrent/rapid command processing.
 */
const sessionCommandLocks = new Map<string, Promise<any>>();

/**
 * In-memory idempotency cache for command deduplication.
 */
const processedCommandIds = new Map<string, { timestamp: number; result: any }>();
const COMMAND_ID_TTL_MS = 60000;

/**
 * Get or create a Broadcast Session for a given tournament and match.
 */
export async function getOrCreateBroadcastSession(
  tournamentId: string,
  requestedMatchId?: string,
  user?: { _id?: any; role?: string; organizationName?: string; primaryOrganizationId?: any },
  authorizedOrgIds?: string[]
): Promise<IBroadcastSession> {
  const cleanId = (tournamentId || '').trim();
  if (!cleanId) {
    const err: any = new Error('INVALID_TOURNAMENT_ID');
    err.statusCode = 400;
    throw err;
  }

  const idQueries: any[] = [
    { customId: cleanId },
    { id: cleanId },
  ];
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    idQueries.push({ _id: new mongoose.Types.ObjectId(cleanId) });
    idQueries.push({ _id: cleanId });
  }

  const query: any = { $or: idQueries };

  // Tenant authorization enforcement
  if (user && user.role !== 'admin') {
    const userObjectId = user._id && mongoose.Types.ObjectId.isValid(user._id) ? new mongoose.Types.ObjectId(user._id) : null;
    const orgFilter = (authorizedOrgIds || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (user.primaryOrganizationId && mongoose.Types.ObjectId.isValid(user.primaryOrganizationId)) {
      orgFilter.push(new mongoose.Types.ObjectId(user.primaryOrganizationId));
    }

    query.$and = [
      {
        $or: [
          { organizationId: { $in: orgFilter } },
          ...(userObjectId ? [{ userId: userObjectId }] : []),
        ],
      },
    ];
  }

  const tournament = await Tournament.findOne(query);

  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const effectiveTournamentId = tournament.customId || (tournament as any).id || tournament._id.toString();
  const orgId = tournament.organizationId?.toString() || tournament.userId?.toString() || user?._id?.toString() || 'default_org';

  if (!Array.isArray(tournament.matches)) {
    tournament.matches = [];
  }

  // Determine active match
  let targetMatch = requestedMatchId
    ? tournament.matches.find((m: any) => (m.id || m.customId) === requestedMatchId)
    : tournament.matches[0];

  if (!targetMatch) {
    const matchId = `match-${effectiveTournamentId}-1`;
    targetMatch = {
      id: matchId,
      customId: matchId,
      tournamentId: effectiveTournamentId,
      matchNumber: 1,
      customLabel: 'Match 01 — Bermuda',
      mapName: 'Bermuda',
      status: 'Live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scoringConfigId: tournament.scoringPreset?.id || 'preset-ff-official-v1',
      scoringVersion: tournament.scoringPreset?.version || 1,
      results: [],
    };
    tournament.matches = [targetMatch];
    tournament.markModified('matches');
    await tournament.save();
  }

  const matchIdStr = targetMatch.id || targetMatch.customId;

  // Search for existing active session for this tournament and match
  let session = await BroadcastSession.findOne({
    tournamentId: effectiveTournamentId,
    matchId: matchIdStr,
    active: true,
  });

  const matchResults = Array.isArray(targetMatch.results) ? targetMatch.results : [];
  const isAlreadyFinished = targetMatch.status === 'Completed';

  if (!session) {
    const sessionId = `bcs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialSquads: Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]> = {};
    const initialTeamStats: Record<string, { kills: number; bonusPoints: number; isBooyah: boolean; manualPlacement?: number }> = {};

    (tournament.teams || []).forEach((t: any, idx: number) => {
      const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
      initialSquads[tId] = ['alive', 'alive', 'alive', 'alive'];
      const res = matchResults.find((r: any) => r.teamId === tId || r.teamId === t.id);
      initialTeamStats[tId] = {
        kills: res?.kills !== undefined ? Number(res.kills) : 0,
        bonusPoints: res?.bonusPoints !== undefined ? Number(res.bonusPoints) : 0,
        isBooyah: !!res?.isBooyah,
        manualPlacement: isAlreadyFinished && res?.placement !== undefined ? Number(res.placement) : undefined,
      };
    });

    session = await BroadcastSession.create({
      sessionId,
      organizationId: orgId,
      tournamentId: effectiveTournamentId,
      matchId: matchIdStr,
      templateId: 'default',
      activeMode: 'NORMAL',
      tableVisible: true,
      pointRushEnabled: false,
      fireTeamIds: [],
      pointRushTeamIds: [],
      squads: initialSquads,
      teamStats: initialTeamStats,
      eliminatedTeamOrder: [],
      isMatchFinished: isAlreadyFinished,
      isSubmittedToWebsite: isAlreadyFinished,
      revision: 1,
      active: true,
    });
  } else {
    // Migration check: ensure teamStats exists for sessions created previously
    if (!session.teamStats || Object.keys(session.teamStats).length === 0) {
      session.teamStats = {};
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        const res = matchResults.find((r: any) => r.teamId === tId || r.teamId === t.id);
        session.teamStats[tId] = {
          kills: res?.kills !== undefined ? Number(res.kills) : 0,
          bonusPoints: res?.bonusPoints !== undefined ? Number(res.bonusPoints) : 0,
          isBooyah: !!res?.isBooyah,
          manualPlacement: isAlreadyFinished && res?.placement !== undefined ? Number(res.placement) : undefined,
        };
      });
      session.markModified('teamStats');
      await session.save();
    }
  }

  return session;
}

export async function getTournamentForSession(tournamentId: string): Promise<any> {
  const idQueries: any[] = [
    { customId: tournamentId },
    { id: tournamentId },
  ];
  if (mongoose.Types.ObjectId.isValid(tournamentId)) {
    idQueries.push({ _id: new mongoose.Types.ObjectId(tournamentId) });
    idQueries.push({ _id: tournamentId });
  }

  return await Tournament.findOne({ $or: idQueries });
}

/**
 * Pure in-memory compiler for authoritative broadcast snapshot.
 * GUARANTEE: Zero placement points during live match play until finished or squad is wiped!
 */
export function buildAuthoritativeSnapshot(session: any, tournament: any): any {
  if (!Array.isArray(tournament.matches)) {
    tournament.matches = [];
  }

  let match = tournament.matches.find(
    (m: any) => (m.id || m.customId) === session.matchId
  ) || tournament.matches[0];

  if (!match) {
    const matchId = `match-${tournament.customId || session.tournamentId}-1`;
    match = {
      id: matchId,
      customId: matchId,
      tournamentId: tournament.customId || session.tournamentId,
      matchNumber: 1,
      customLabel: 'Match 01 — Bermuda',
      mapName: 'Bermuda',
      status: 'Live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scoringConfigId: tournament.scoringPreset?.id || 'preset-ff-official-v1',
      scoringVersion: tournament.scoringPreset?.version || 1,
      results: [],
    };
  }

  const scoringConfig = normalizeScoringConfig(tournament.scoringPreset);
  const teamsList = Array.isArray(tournament.teams) ? tournament.teams : [];
  const totalTeams = teamsList.length || 12;

  const isMatchFinished = !!session.isMatchFinished;
  const eliminatedOrder: string[] = Array.isArray(session.eliminatedTeamOrder) ? session.eliminatedTeamOrder : [];
  const teamStats = session.teamStats || {};

  // Check wiped status for every squad
  const teamWipedStatusMap = new Map<string, boolean>();
  teamsList.forEach((team: any, idx: number) => {
    const teamId = team.id || team.customId || (team._id ? String(team._id) : `team-${idx + 1}`);
    const squad = session.squads?.[teamId] || ['alive', 'alive', 'alive', 'alive'];
    teamWipedStatusMap.set(teamId, squad.every((p: any) => p === 'eliminated'));
  });

  const aliveTeams = teamsList.filter((team: any, idx: number) => {
    const teamId = team.id || team.customId || (team._id ? String(team._id) : `team-${idx + 1}`);
    return !teamWipedStatusMap.get(teamId);
  });

  const fireTeamIds: string[] = Array.isArray(session.fireTeamIds) ? session.fireTeamIds : [];
  const pointRushTeamIds: string[] = Array.isArray(session.pointRushTeamIds) ? session.pointRushTeamIds : [];

  // Calculate live and final team rows
  const calculatedTeams = teamsList.map((team: any, idx: number) => {
    const teamId = team.id || team.customId || (team._id ? String(team._id) : `team-${idx + 1}`);
    const stats = teamStats[teamId] || { kills: 0, bonusPoints: 0, isBooyah: false, manualPlacement: undefined };

    const kills = Number(stats.kills) || 0;
    const bonusPoints = Number(stats.bonusPoints) || 0;
    const squadPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] =
      session.squads?.[teamId] || ['alive', 'alive', 'alive', 'alive'];
    const alivePlayersCount = squadPlayers.filter((p) => p === 'alive' || p === 'knock').length;
    const isWiped = squadPlayers.every((p) => p === 'eliminated');

    let placement = stats.manualPlacement;
    let isBooyah = !!stats.isBooyah;

    const singleSurvivingTeamId = aliveTeams.length === 1
      ? (aliveTeams[0].id || aliveTeams[0].customId || (aliveTeams[0]._id ? String(aliveTeams[0]._id) : ''))
      : null;

    if (placement === undefined) {
      if (isWiped) {
        const elimIndex = eliminatedOrder.indexOf(teamId);
        if (elimIndex !== -1) {
          placement = Math.max(1, totalTeams - elimIndex);
        } else {
          placement = totalTeams;
        }
      } else {
        if (aliveTeams.length === 1 && singleSurvivingTeamId === teamId) {
          placement = 1;
          isBooyah = true;
        } else {
          placement = Math.min(aliveTeams.length, idx + 1);
        }
      }
    }

    let placementPoints = 0;
    let killPoints = kills * (scoringConfig.killPoints ?? 1);
    let totalPoints = killPoints + bonusPoints;

    // Placements points are awarded immediately when:
    // 1. Squad is wiped (placement fixed via elimination order: totalTeams - elimIndex)
    // 2. Only 1 squad survives (Booyah = 1st place)
    // 3. Match is finished
    const shouldAwardPlacement = isWiped || (aliveTeams.length === 1 && singleSurvivingTeamId === teamId) || isMatchFinished;
    if (shouldAwardPlacement) {
      const calc = calculateTeamMatchScore(
        { teamId, kills, placement: placement || 1, booyah: isBooyah, bonusPoints },
        scoringConfig
      );
      if (calc.success && calc.data) {
        placementPoints = calc.data.placementPoints;
        killPoints = calc.data.killPoints;
        totalPoints = calc.data.totalPoints;
      }
    }

    const isTeamFire = fireTeamIds.includes(teamId) || (session.activeMode === 'FIRE' && fireTeamIds.length === 0);

    return {
      teamId,
      name: team.name || `Team ${idx + 1}`,
      tag: team.tag || (team.name ? team.name.slice(0, 4).toUpperCase() : `T${idx + 1}`),
      slotNumber: team.slotNumber || idx + 1,
      logoUrl: team.logoUrl || '',
      kills,
      placement: placement || idx + 1,
      placementPoints,
      killPoints,
      totalPoints,
      isBooyah,
      bonusPoints,
      squadPlayers,
      alivePlayersCount,
      isWiped,
      isFireActive: isTeamFire,
      isPointRushActive: pointRushTeamIds.includes(teamId) || !!session.pointRushEnabled,
      isFocused: session.selectedTeamId === teamId,
    };
  });

  // Sort logic
  if (!isMatchFinished) {
    calculatedTeams.sort((a, b) => {
      if (a.isWiped !== b.isWiped) return a.isWiped ? 1 : -1;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.slotNumber - b.slotNumber;
    });
  } else {
    calculatedTeams.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.placement !== b.placement) return a.placement - b.placement;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.slotNumber - b.slotNumber;
    });
  }

  // Assign display rank 1..N
  calculatedTeams.forEach((t, i) => {
    (t as any).rank = i + 1;
  });

  const aliveSquadsCount = calculatedTeams.filter((t) => !t.isWiped).length;

  return {
    sessionId: session.sessionId,
    organizationId: session.organizationId,
    tournamentId: tournament.customId,
    matchId: match.id || match.customId,
    revision: session.revision,
    tableVisible: session.tableVisible,
    activeMode: session.activeMode,
    pointRushEnabled: session.pointRushEnabled,
    fireTeamIds,
    pointRushTeamIds,
    selectedTeamId: session.selectedTeamId,
    selectedPlayerIndex: session.selectedPlayerIndex,
    isMatchFinished: !!session.isMatchFinished,
    isSubmittedToWebsite: !!session.isSubmittedToWebsite,
    eliminatedTeamOrder: session.eliminatedTeamOrder || [],
    tournament: {
      id: tournament.customId,
      title: tournament.title,
      organizer: tournament.organizer,
      logoUrl: tournament.logoUrl,
      organizerLogoUrl: tournament.organizerLogoUrl,
      game: tournament.game,
      status: tournament.status,
      structure: tournament.structure,
      scoringPreset: tournament.scoringPreset,
    },
    match: {
      id: match.id || match.customId,
      matchNumber: match.matchNumber,
      customLabel: match.customLabel,
      mapName: match.mapName,
      status: isMatchFinished ? 'Completed' : (match.status || 'Live'),
    },
    teams: calculatedTeams,
    availableMatches: tournament.matches.map((m: any) => ({
      id: m.id || m.customId,
      matchNumber: m.matchNumber,
      customLabel: m.customLabel,
      mapName: m.mapName,
      status: m.status,
    })),
    aliveSquadsCount,
    totalSquadsCount: calculatedTeams.length,
    timestamp: Date.now(),
  };
}

/**
 * Fetch the complete authoritative broadcast snapshot for OBS and Remote clients.
 */
export async function getAuthoritativeBroadcastState(sessionId: string): Promise<any> {
  const session = await BroadcastSession.findOne({ sessionId, active: true });
  if (!session) {
    const err: any = new Error('BROADCAST_SESSION_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const tournament = await getTournamentForSession(session.tournamentId);
  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  return buildAuthoritativeSnapshot(session, tournament);
}

/**
 * Verify authorization for a user against a broadcast session.
 */
async function verifySessionAuthorization(
  session: any,
  tournament: any,
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<void> {
  if (!user) {
    const err: any = new Error('Unauthorized: Authentication required to execute remote broadcast commands.');
    err.statusCode = 401;
    throw err;
  }

  if (user.role !== 'admin') {
    const userStr = user._id ? user._id.toString() : '';
    const tourOwner = tournament.userId ? tournament.userId.toString() : '';
    const tourOrg = tournament.organizationId ? tournament.organizationId.toString() : '';
    const sessionOrg = session.organizationId ? session.organizationId.toString() : '';

    let isAuthorized = false;
    if (tourOwner && userStr && tourOwner === userStr) isAuthorized = true;

    if (tournament.organizationId) {
      const isMember = await OrganizationMembership.exists({
        organizationId: tournament.organizationId,
        userId: user._id,
      });
      if (isMember) isAuthorized = true;
    }

    if (!isAuthorized && (!sessionOrg || sessionOrg !== tourOrg)) {
      const err: any = new Error('Forbidden: You do not have permission to control this tournament session.');
      err.statusCode = 403;
      throw err;
    }
  }
}

/**
 * Apply a single broadcast command mutation to a session in memory.
 */
function applySingleCommandToSession(
  session: any,
  tournament: any,
  command: BroadcastCommand
): void {
  const ensureSquadExists = (targetTeamId: string) => {
    if (!session.squads[targetTeamId]) {
      session.squads[targetTeamId] = ['alive', 'alive', 'alive', 'alive'];
    }
    return session.squads[targetTeamId];
  };

  const ensureTeamStats = (targetTeamId: string) => {
    if (!session.teamStats[targetTeamId]) {
      session.teamStats[targetTeamId] = { kills: 0, bonusPoints: 0, isBooyah: false };
    }
    return session.teamStats[targetTeamId];
  };

  const { commandType, targetTeamId, payload } = command;

  switch (commandType) {
    case 'ADD_KILL': {
      if (!targetTeamId) throw new Error('targetTeamId is required for ADD_KILL');
      const stats = ensureTeamStats(targetTeamId);
      const delta = Math.max(1, Number(payload?.delta ?? 1));
      stats.kills = (stats.kills || 0) + delta;
      session.markModified('teamStats');
      break;
    }

    case 'REMOVE_KILL': {
      if (!targetTeamId) throw new Error('targetTeamId is required for REMOVE_KILL');
      const stats = ensureTeamStats(targetTeamId);
      const delta = Math.max(1, Number(payload?.delta ?? 1));
      stats.kills = Math.max(0, (stats.kills || 0) - delta);
      session.markModified('teamStats');
      break;
    }

    case 'SET_PLAYER_STATUS': {
      const tId = targetTeamId || payload?.teamId;
      const pIdx = Number(payload?.playerIndex);
      const status: PlayerState = payload?.status;
      if (!tId || isNaN(pIdx) || pIdx < 0 || pIdx > 3 || !status) {
        throw new Error('Valid teamId, playerIndex (0-3), and status are required');
      }
      const squad = ensureSquadExists(tId);
      squad[pIdx] = status;
      session.markModified('squads');

      const isWiped = squad.every((p) => p === 'eliminated');
      if (isWiped && !session.eliminatedTeamOrder.includes(tId)) {
        session.eliminatedTeamOrder.push(tId);
        session.markModified('eliminatedTeamOrder');
      } else if (!isWiped && session.eliminatedTeamOrder.includes(tId)) {
        session.eliminatedTeamOrder = session.eliminatedTeamOrder.filter((id: string) => id !== tId);
        session.markModified('eliminatedTeamOrder');
      }
      break;
    }

    case 'WIPE_SQUAD': {
      const tId = targetTeamId || payload?.teamId;
      if (!tId) throw new Error('teamId is required for WIPE_SQUAD');
      session.squads[tId] = ['eliminated', 'eliminated', 'eliminated', 'eliminated'];
      session.markModified('squads');

      if (!session.eliminatedTeamOrder.includes(tId)) {
        session.eliminatedTeamOrder.push(tId);
        session.markModified('eliminatedTeamOrder');
      }
      break;
    }

    case 'REVIVE_SQUAD': {
      const tId = targetTeamId || payload?.teamId;
      if (!tId) throw new Error('teamId is required for REVIVE_SQUAD');
      session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
      session.markModified('squads');

      session.eliminatedTeamOrder = session.eliminatedTeamOrder.filter((id: string) => id !== tId);
      session.markModified('eliminatedTeamOrder');
      break;
    }

    case 'RESET_ALIVE': {
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
      });
      session.eliminatedTeamOrder = [];
      session.markModified('squads');
      session.markModified('eliminatedTeamOrder');
      break;
    }

    case 'SET_MODE': {
      const mode: BroadcastMode = payload?.mode || 'NORMAL';
      const tId = targetTeamId || payload?.teamId;
      const fireExplicit = payload?.fire !== undefined ? !!payload.fire : (mode === 'FIRE');
      const rushExplicit = payload?.rush !== undefined ? !!payload.rush : (mode === 'RUSH');

      if (!Array.isArray(session.fireTeamIds)) session.fireTeamIds = [];
      if (!Array.isArray(session.pointRushTeamIds)) session.pointRushTeamIds = [];

      if (tId) {
        if (fireExplicit) {
          if (!session.fireTeamIds.includes(tId)) {
            session.fireTeamIds = [...session.fireTeamIds, tId];
          }
          session.activeMode = 'FIRE';
        } else {
          session.fireTeamIds = session.fireTeamIds.filter((id: string) => id !== tId);
          if (session.fireTeamIds.length === 0 && session.activeMode === 'FIRE') {
            session.activeMode = 'NORMAL';
          }
        }

        if (rushExplicit) {
          if (!session.pointRushTeamIds.includes(tId)) {
            session.pointRushTeamIds = [...session.pointRushTeamIds, tId];
          }
        } else {
          session.pointRushTeamIds = session.pointRushTeamIds.filter((id: string) => id !== tId);
        }

        if (mode === 'FOCUS') {
          session.selectedTeamId = session.selectedTeamId === tId ? null : tId;
        } else if (mode === 'NORMAL' && session.selectedTeamId === tId) {
          session.selectedTeamId = null;
        }
      } else {
        session.activeMode = mode;
        if (mode === 'NORMAL') {
          session.fireTeamIds = [];
          session.pointRushTeamIds = [];
          session.selectedTeamId = null;
        }
      }
      session.markModified('fireTeamIds');
      session.markModified('pointRushTeamIds');
      break;
    }

    case 'SET_FIRE':
    case 'TOGGLE_FIRE': {
      const tId = targetTeamId || payload?.teamId;
      if (!Array.isArray(session.fireTeamIds)) session.fireTeamIds = [];
      if (tId) {
        const turnOn = payload?.fire !== undefined
          ? !!payload.fire
          : !session.fireTeamIds.includes(tId);
        if (turnOn) {
          if (!session.fireTeamIds.includes(tId)) {
            session.fireTeamIds = [...session.fireTeamIds, tId];
          }
          session.activeMode = 'FIRE';
        } else {
          session.fireTeamIds = session.fireTeamIds.filter((id: string) => id !== tId);
          if (session.fireTeamIds.length === 0 && session.activeMode === 'FIRE') {
            session.activeMode = 'NORMAL';
          }
        }
        session.markModified('fireTeamIds');
      } else {
        session.fireTeamIds = [];
        if (session.activeMode === 'FIRE') session.activeMode = 'NORMAL';
        session.markModified('fireTeamIds');
      }
      break;
    }

    case 'SET_TABLE_VISIBILITY': {
      const visible = payload?.visible !== undefined ? !!payload.visible : !session.tableVisible;
      session.tableVisible = visible;
      break;
    }

    case 'SET_POINT_RUSH': {
      const enabled = payload?.enabled !== undefined ? !!payload.enabled : !session.pointRushEnabled;
      session.pointRushEnabled = enabled;
      const tId = targetTeamId || payload?.teamId;
      if (!Array.isArray(session.pointRushTeamIds)) session.pointRushTeamIds = [];
      if (tId) {
        session.pointRushTeamIds = session.pointRushTeamIds.includes(tId)
          ? session.pointRushTeamIds.filter((id: string) => id !== tId)
          : [...session.pointRushTeamIds, tId];
        session.markModified('pointRushTeamIds');
      }
      break;
    }

    case 'ADD_POINT_ALL_TEAMS': {
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        const stats = ensureTeamStats(tId);
        stats.bonusPoints = (stats.bonusPoints || 0) + 1;
      });
      session.markModified('teamStats');
      break;
    }

    case 'CHANGE_MATCH': {
      const newMatchId = payload?.matchId;
      if (!newMatchId) throw new Error('matchId is required for CHANGE_MATCH');
      const targetM = (tournament.matches || []).find(
        (m: any) => (m.id || m.customId) === newMatchId
      );
      if (!targetM) throw new Error(`Match ${newMatchId} not found in tournament`);
      session.matchId = targetM.id || targetM.customId;
      session.isMatchFinished = targetM.status === 'Completed';
      session.isSubmittedToWebsite = targetM.status === 'Completed';
      break;
    }

    case 'SELECT_PLAYER': {
      session.selectedTeamId = targetTeamId || payload?.teamId || null;
      session.selectedPlayerIndex = payload?.playerIndex !== undefined ? Number(payload.playerIndex) : null;
      break;
    }

    case 'RESET_BROADCAST': {
      session.activeMode = 'NORMAL';
      session.fireTeamIds = [];
      session.pointRushTeamIds = [];
      session.selectedTeamId = null;
      session.selectedPlayerIndex = null;
      session.isMatchFinished = false;
      session.isSubmittedToWebsite = false;
      session.eliminatedTeamOrder = [];
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
        session.teamStats[tId] = { kills: 0, bonusPoints: 0, isBooyah: false };
      });
      session.markModified('squads');
      session.markModified('teamStats');
      session.markModified('eliminatedTeamOrder');
      break;
    }

    case 'FINISH_MATCH': {
      session.isMatchFinished = true;
      break;
    }

    case 'REOPEN_MATCH': {
      session.isMatchFinished = false;
      session.isSubmittedToWebsite = false;
      break;
    }

    case 'REFRESH_OVERLAY': {
      // Refresh signal handled by caller
      break;
    }

    default:
      throw new Error(`Unsupported command type: ${commandType}`);
  }
}

/**
 * Execute an atomic command on a Broadcast Session with queue mutex serialization.
 */
export async function executeBroadcastCommand(
  sessionId: string,
  command: BroadcastCommand,
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<any> {
  // Idempotency: return cached response if commandId has already been processed recently
  if (command.commandId && processedCommandIds.has(command.commandId)) {
    const cached = processedCommandIds.get(command.commandId)!;
    if (Date.now() - cached.timestamp < COMMAND_ID_TTL_MS) {
      return cached.result;
    }
    processedCommandIds.delete(command.commandId);
  }

  const currentLock = sessionCommandLocks.get(sessionId) || Promise.resolve();
  const nextLock = currentLock
    .catch(() => {})
    .then(async () => {
      return await executeBroadcastCommandInternal(sessionId, command, user);
    });
  sessionCommandLocks.set(sessionId, nextLock);
  return await nextLock;
}

async function executeBroadcastCommandInternal(
  sessionId: string,
  command: BroadcastCommand,
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<any> {
  const session = await BroadcastSession.findOne({ sessionId, active: true });
  if (!session) {
    const err: any = new Error('BROADCAST_SESSION_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const tournament = await getTournamentForSession(session.tournamentId);
  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  await verifySessionAuthorization(session, tournament, user);

  if (command.commandType === 'SUBMIT_MATCH_REPORT') {
    return await submitMatchReportToWebsite(sessionId, command.payload?.results || command.payload?.overrides, user);
  }

  if (!session.teamStats) session.teamStats = {};
  if (!session.squads) session.squads = {};
  if (!Array.isArray(session.eliminatedTeamOrder)) session.eliminatedTeamOrder = [];

  applySingleCommandToSession(session, tournament, command);

  // Strictly monotonically increment revision
  session.revision = (session.revision || 1) + 1;
  await session.save();

  // Compile authoritative state in memory with 0 redundant DB queries
  const authoritativeState = buildAuthoritativeSnapshot(session, tournament);

  // Realtime Broadcast across session room
  broadcastToSession(session.sessionId, {
    type: 'BROADCAST_STATE_UPDATED',
    sessionId: session.sessionId,
    revision: session.revision,
    state: authoritativeState,
    payload: authoritativeState,
    timestamp: Date.now(),
  });

  if (command.commandType === 'REFRESH_OVERLAY') {
    broadcastToSession(session.sessionId, {
      type: 'REFRESH_OVERLAY',
      action: 'REFRESH_OVERLAY',
      sessionId: session.sessionId,
      hardReload: !!command.payload?.hardReload,
      timestamp: Date.now(),
    });
  }

  const result = {
    success: true,
    delta: command.payload?.delta !== undefined ? Number(command.payload.delta) : 1,
    kills: command.targetTeamId && session.teamStats ? session.teamStats[command.targetTeamId]?.kills : undefined,
    revision: session.revision,
    teamId: command.targetTeamId,
    matchId: session.matchId,
    sessionId: session.sessionId,
    state: authoritativeState,
  };

  if (command.commandId) {
    processedCommandIds.set(command.commandId, {
      timestamp: Date.now(),
      result,
    });
    if (processedCommandIds.size > 500) {
      const cutoff = Date.now() - COMMAND_ID_TTL_MS;
      for (const [id, val] of processedCommandIds.entries()) {
        if (val.timestamp < cutoff) processedCommandIds.delete(id);
      }
    }
  }

  return result;
}

/**
 * Execute a batch of broadcast commands in a single DB transaction and single broadcast frame.
 * Eliminates serial HTTP queue lag when multiple commands are dispatched rapidly.
 */
export async function executeBatchBroadcastCommands(
  sessionId: string,
  commands: BroadcastCommand[],
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<any> {
  const currentLock = sessionCommandLocks.get(sessionId) || Promise.resolve();
  const nextLock = currentLock
    .catch(() => {})
    .then(async () => {
      return await executeBatchBroadcastCommandsInternal(sessionId, commands, user);
    });
  sessionCommandLocks.set(sessionId, nextLock);
  return await nextLock;
}

async function executeBatchBroadcastCommandsInternal(
  sessionId: string,
  commands: BroadcastCommand[],
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<any> {
  if (!Array.isArray(commands) || commands.length === 0) {
    return await getAuthoritativeBroadcastState(sessionId);
  }

  const session = await BroadcastSession.findOne({ sessionId, active: true });
  if (!session) {
    const err: any = new Error('BROADCAST_SESSION_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const tournament = await getTournamentForSession(session.tournamentId);
  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  await verifySessionAuthorization(session, tournament, user);

  if (!session.teamStats) session.teamStats = {};
  if (!session.squads) session.squads = {};
  if (!Array.isArray(session.eliminatedTeamOrder)) session.eliminatedTeamOrder = [];

  let hasRefreshOverlay = false;
  let hardReload = false;

  for (const cmd of commands) {
    if (cmd.commandType === 'REFRESH_OVERLAY') {
      hasRefreshOverlay = true;
      if (cmd.payload?.hardReload) hardReload = true;
    }
    applySingleCommandToSession(session, tournament, cmd);
  }

  session.revision = (session.revision || 1) + 1;
  await session.save();

  const authoritativeState = buildAuthoritativeSnapshot(session, tournament);

  broadcastToSession(session.sessionId, {
    type: 'BROADCAST_STATE_UPDATED',
    sessionId: session.sessionId,
    revision: session.revision,
    state: authoritativeState,
    payload: authoritativeState,
    timestamp: Date.now(),
  });

  if (hasRefreshOverlay) {
    broadcastToSession(session.sessionId, {
      type: 'REFRESH_OVERLAY',
      action: 'REFRESH_OVERLAY',
      sessionId: session.sessionId,
      hardReload,
      timestamp: Date.now(),
    });
  }

  return {
    success: true,
    batchSize: commands.length,
    revision: session.revision,
    sessionId: session.sessionId,
    state: authoritativeState,
  };
}

/**
 * Submit verified match report from Remote Control to official tournament results on website.
 */
export async function submitMatchReportToWebsite(
  sessionId: string,
  overrides?: Array<{
    teamId: string;
    placement?: number;
    kills?: number;
    bonusPoints?: number;
    isBooyah?: boolean;
  }>,
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<any> {
  const session = await BroadcastSession.findOne({ sessionId, active: true });
  if (!session) {
    const err: any = new Error('BROADCAST_SESSION_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const idQueries: any[] = [
    { customId: session.tournamentId },
    { id: session.tournamentId },
  ];
  if (mongoose.Types.ObjectId.isValid(session.tournamentId)) {
    idQueries.push({ _id: new mongoose.Types.ObjectId(session.tournamentId) });
    idQueries.push({ _id: session.tournamentId });
  }

  const tournament = await Tournament.findOne({ $or: idQueries });
  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  // Authorization check: MUST BE AUTHENTICATED
  if (!user) {
    const err: any = new Error('Unauthorized: Authentication required to submit match reports.');
    err.statusCode = 401;
    throw err;
  }

  if (user.role !== 'admin') {
    const userStr = user._id ? user._id.toString() : '';
    const tourOwner = tournament.userId ? tournament.userId.toString() : '';
    const tourOrg = tournament.organizationId ? tournament.organizationId.toString() : '';
    const sessionOrg = session.organizationId ? session.organizationId.toString() : '';

    let isAuthorized = false;
    if (tourOwner && userStr && tourOwner === userStr) isAuthorized = true;

    if (tournament.organizationId) {
      const isMember = await OrganizationMembership.exists({
        organizationId: tournament.organizationId,
        userId: user._id,
      });
      if (isMember) isAuthorized = true;
    }

    if (!isAuthorized && (!sessionOrg || sessionOrg !== tourOrg)) {
      const err: any = new Error('Forbidden: You do not have permission to modify this tournament.');
      err.statusCode = 403;
      throw err;
    }
  }

  // 1. Mark session as finished
  session.isMatchFinished = true;

  // Apply overrides to session teamStats if provided
  if (Array.isArray(overrides) && overrides.length > 0) {
    if (!session.teamStats) session.teamStats = {};
    overrides.forEach((ov) => {
      if (ov.teamId) {
        const cur = session.teamStats[ov.teamId] || { kills: 0, bonusPoints: 0, isBooyah: false };
        if (ov.kills !== undefined) cur.kills = Number(ov.kills);
        if (ov.bonusPoints !== undefined) cur.bonusPoints = Number(ov.bonusPoints);
        if (ov.placement !== undefined) cur.manualPlacement = Number(ov.placement);
        if (ov.isBooyah !== undefined) cur.isBooyah = !!ov.isBooyah;
        session.teamStats[ov.teamId] = cur;
      }
    });
    session.markModified('teamStats');
  }

  // 2. Compute authoritative state with placement points calculated!
  const finalState = await getAuthoritativeBroadcastState(session.sessionId);

  // 3. Prepare match results for tournament
  const scoringConfig = normalizeScoringConfig(tournament.scoringPreset);

  if (!Array.isArray(tournament.matches)) {
    tournament.matches = [];
  }

  let targetMatch = tournament.matches.find(
    (m: any) => (m.id || m.customId) === session.matchId
  );

  if (!targetMatch) {
    targetMatch = {
      id: session.matchId,
      customId: session.matchId,
      tournamentId: tournament.customId || session.tournamentId,
      matchNumber: 1,
      customLabel: 'Match 01',
      mapName: 'Bermuda',
      status: 'Completed',
      scoringConfigId: tournament.scoringPreset?.id || 'preset-ff-official-v1',
      scoringVersion: tournament.scoringPreset?.version || 1,
      results: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tournament.matches.push(targetMatch);
  }

  const results = finalState.teams.map((t: any) => {
    const override = Array.isArray(overrides) ? overrides.find((o) => o.teamId === t.teamId) : null;
    const placement = override?.placement !== undefined ? Number(override.placement) : t.placement;
    const kills = override?.kills !== undefined ? Number(override.kills) : t.kills;
    const isBooyah = override?.isBooyah !== undefined ? override.isBooyah : (placement === 1 || t.isBooyah);
    const bonusPoints = override?.bonusPoints !== undefined ? Number(override.bonusPoints) : (t.bonusPoints || 0);

    const calc = calculateTeamMatchScore(
      { teamId: t.teamId, kills, placement, booyah: isBooyah, bonusPoints },
      scoringConfig
    );
    const calculated = calc.success ? calc.data : null;

    return {
      teamId: t.teamId,
      placement,
      kills,
      placementPoints: calculated ? calculated.placementPoints : 0,
      killPoints: calculated ? calculated.killPoints : kills,
      totalPoints: calculated ? calculated.totalPoints : kills,
      isBooyah,
      bonusPoints,
    };
  });

  targetMatch.results = results;
  targetMatch.status = 'Completed';
  targetMatch.updatedAt = new Date().toISOString();

  tournament.markModified('matches');
  await tournament.save();

  // 4. Mark session as submitted to website
  session.isSubmittedToWebsite = true;
  session.revision = (session.revision || 1) + 1;
  await session.save();

  // 5. Broadcast to WebSocket room
  const updatedState = await getAuthoritativeBroadcastState(session.sessionId);
  broadcastToSession(session.sessionId, {
    type: 'BROADCAST_STATE_UPDATED',
    sessionId: session.sessionId,
    revision: session.revision,
    state: updatedState,
    payload: updatedState,
    timestamp: Date.now(),
  });

  return {
    success: true,
    message: 'Match report submitted and published to website successfully.',
    revision: session.revision,
    state: updatedState,
  };
}

import mongoose from 'mongoose';
import { BroadcastSession, IBroadcastSession, PlayerState, BroadcastMode } from '../models/BroadcastSession';
import { Tournament, ITournament } from '../models/Tournament';
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
    | 'RESET_BROADCAST';
  targetTeamId?: string;
  payload?: any;
}

/**
 * Get or create a Broadcast Session for a given tournament and match.
 */
export async function getOrCreateBroadcastSession(
  tournamentId: string,
  requestedMatchId?: string,
  user?: { _id?: any; role?: string; organizationName?: string }
): Promise<IBroadcastSession> {
  const cleanId = (tournamentId || '').trim();
  const idQueries: any[] = [
    { customId: cleanId },
    { id: cleanId },
  ];
  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    idQueries.push({ _id: new mongoose.Types.ObjectId(cleanId) });
    idQueries.push({ _id: cleanId });
  }

  let tournament = await Tournament.findOne({ $or: idQueries });
  if (!tournament && (!cleanId || cleanId === 'default' || cleanId === 'tour-ff-champ-2026')) {
    tournament = (await Tournament.findOne({ status: { $ne: 'Archived' } }).sort({ updatedAt: -1 }))
      || (await Tournament.findOne({}).sort({ updatedAt: -1 }));
  }

  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const effectiveTournamentId = tournament.customId || (tournament as any).id || tournament._id.toString();
  const orgId = tournament.userId?.toString() || user?._id?.toString() || 'default_org';

  if (!Array.isArray(tournament.matches)) {
    tournament.matches = [];
  }

  // Determine active match
  let targetMatch = requestedMatchId
    ? tournament.matches.find((m: any) => (m.id || m.customId) === requestedMatchId)
    : tournament.matches[0];

  if (!targetMatch) {
    // If tournament has no matches, create a real Match 1
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
      results: (tournament.teams || []).map((t: any, idx: number) => ({
        teamId: t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`),
        placement: Math.max(1, (tournament.teams?.length || 12) - idx),
        kills: 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        isBooyah: false,
      })),
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

  if (!session) {
    const sessionId = `bcs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialSquads: Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]> = {};

    (tournament.teams || []).forEach((t: any, idx: number) => {
      const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
      initialSquads[tId] = ['alive', 'alive', 'alive', 'alive'];
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
      revision: 1,
      active: true,
    });
  }

  return session;
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

  const idQueries: any[] = [
    { customId: session.tournamentId },
    { id: session.tournamentId },
  ];
  if (mongoose.Types.ObjectId.isValid(session.tournamentId)) {
    idQueries.push({ _id: new mongoose.Types.ObjectId(session.tournamentId) });
    idQueries.push({ _id: session.tournamentId });
  }

  let tournament = await Tournament.findOne({ $or: idQueries });
  if (!tournament) {
    const err: any = new Error('TOURNAMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

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
      results: (tournament.teams || []).map((t: any, idx: number) => ({
        teamId: t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`),
        placement: Math.max(1, (tournament.teams?.length || 12) - idx),
        kills: 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        isBooyah: false,
      })),
    };
    tournament.matches = [match];
    tournament.markModified('matches');
    await tournament.save().catch(() => {});
  }

  const scoringConfig = normalizeScoringConfig(tournament.scoringPreset);
  const rawResults = Array.isArray(match.results) ? match.results : [];
  const teamsList = Array.isArray(tournament.teams) ? tournament.teams : [];

  // Build team rows with authoritative kills, points, squad alive state
  const calculatedTeams = teamsList.map((team: any, idx: number) => {
    const teamId = team.id || team.customId || (team._id ? String(team._id) : `team-${idx + 1}`);
    const result = rawResults.find(
      (r: any) => r.teamId === teamId || r.teamId === team.id || r.teamId === (team._id ? String(team._id) : undefined)
    );

    const kills = result?.kills !== undefined ? Number(result.kills) : 0;
    const placement = result?.placement !== undefined ? Number(result.placement) : idx + 1;
    const isBooyah = !!result?.isBooyah;
    const bonusPoints = Number(result?.bonusPoints || 0);

    const calc = calculateTeamMatchScore(
      { teamId, kills, placement, booyah: isBooyah, bonusPoints },
      scoringConfig
    );
    const calculated = calc.success ? calc.data : null;
    const placementPoints = calculated ? calculated.placementPoints : 0;
    const killPoints = calculated ? calculated.killPoints : kills;
    const totalPoints = calculated ? calculated.totalPoints : (placementPoints + killPoints);

    const squadPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] =
      session.squads?.[teamId] || ['alive', 'alive', 'alive', 'alive'];
    const alivePlayersCount = squadPlayers.filter((p) => p === 'alive' || p === 'knock').length;
    const isWiped = squadPlayers.every((p) => p === 'eliminated');

    return {
      teamId,
      name: team.name || `Team ${idx + 1}`,
      tag: team.tag || (team.name ? team.name.slice(0, 4).toUpperCase() : `T${idx + 1}`),
      slotNumber: team.slotNumber || idx + 1,
      logoUrl: team.logoUrl || '',
      kills,
      placement,
      placementPoints,
      killPoints,
      totalPoints,
      isBooyah,
      squadPlayers,
      alivePlayersCount,
      isWiped,
      isFireActive: session.fireTeamIds.includes(teamId) || session.activeMode === 'FIRE',
      isPointRushActive: session.pointRushTeamIds.includes(teamId) || session.pointRushEnabled,
      isFocused: session.selectedTeamId === teamId,
    };
  });

  // Sort by totalPoints desc, then kills desc, then slotNumber asc
  calculatedTeams.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.slotNumber - b.slotNumber;
  });

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
    fireTeamIds: session.fireTeamIds,
    pointRushTeamIds: session.pointRushTeamIds,
    selectedTeamId: session.selectedTeamId,
    selectedPlayerIndex: session.selectedPlayerIndex,
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
      status: match.status,
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
 * Execute an atomic command on a Broadcast Session.
 */
export async function executeBroadcastCommand(
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

  // Authorization check (admin or owner of tournament/organization)
  if (user && user.role !== 'admin') {
    const userStr = user._id ? user._id.toString() : '';
    const tourOwner = tournament.userId ? tournament.userId.toString() : '';
    if (tourOwner && userStr && tourOwner !== userStr) {
      const err: any = new Error('Forbidden: You do not have permission to control this tournament session.');
      err.statusCode = 403;
      throw err;
    }
  }

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
      results: (tournament.teams || []).map((t: any, idx: number) => ({
        teamId: t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`),
        placement: Math.max(1, (tournament.teams?.length || 12) - idx),
        kills: 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        isBooyah: false,
      })),
    };
    tournament.matches = [match];
    tournament.markModified('matches');
    await tournament.save().catch(() => {});
  }

  const scoringConfig = normalizeScoringConfig(tournament.scoringPreset);
  if (!Array.isArray(match.results)) {
    match.results = [];
  }

  // Ensure team result entry exists helper
  const getOrCreateTeamResult = (targetTeamId: string) => {
    let res = match.results.find(
      (r: any) => r.teamId === targetTeamId || r.teamId === (targetTeamId as any)
    );
    if (!res) {
      res = {
        teamId: targetTeamId,
        kills: 0,
        placement: match.results.length + 1,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        isBooyah: false,
      };
      match.results.push(res);
    }
    return res;
  };

  const ensureSquadExists = (targetTeamId: string) => {
    if (!session.squads) session.squads = {};
    if (!session.squads[targetTeamId]) {
      session.squads[targetTeamId] = ['alive', 'alive', 'alive', 'alive'];
    }
    return session.squads[targetTeamId];
  };

  const { commandType, targetTeamId, payload } = command;

  switch (commandType) {
    case 'ADD_KILL': {
      if (!targetTeamId) throw new Error('targetTeamId is required for ADD_KILL');
      const res = getOrCreateTeamResult(targetTeamId);
      res.kills = (res.kills || 0) + 1;
      const calc = calculateTeamMatchScore(res, scoringConfig);
      if (calc.success && calc.data) {
        res.placementPoints = calc.data.placementPoints;
        res.killPoints = calc.data.killPoints;
        res.totalPoints = calc.data.totalPoints;
      }
      tournament.markModified('matches');
      await tournament.save();
      break;
    }

    case 'REMOVE_KILL': {
      if (!targetTeamId) throw new Error('targetTeamId is required for REMOVE_KILL');
      const res = getOrCreateTeamResult(targetTeamId);
      res.kills = Math.max(0, (res.kills || 0) - 1);
      const calc = calculateTeamMatchScore(res, scoringConfig);
      if (calc.success && calc.data) {
        res.placementPoints = calc.data.placementPoints;
        res.killPoints = calc.data.killPoints;
        res.totalPoints = calc.data.totalPoints;
      }
      tournament.markModified('matches');
      await tournament.save();
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
      break;
    }

    case 'WIPE_SQUAD': {
      const tId = targetTeamId || payload?.teamId;
      if (!tId) throw new Error('teamId is required for WIPE_SQUAD');
      session.squads[tId] = ['eliminated', 'eliminated', 'eliminated', 'eliminated'];
      session.markModified('squads');
      break;
    }

    case 'REVIVE_SQUAD': {
      const tId = targetTeamId || payload?.teamId;
      if (!tId) throw new Error('teamId is required for REVIVE_SQUAD');
      session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
      session.markModified('squads');
      break;
    }

    case 'RESET_ALIVE': {
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
      });
      session.markModified('squads');
      break;
    }

    case 'SET_MODE': {
      const mode: BroadcastMode = payload?.mode || 'NORMAL';
      session.activeMode = mode;
      const tId = targetTeamId || payload?.teamId;
      if (tId) {
        if (mode === 'FIRE') {
          session.fireTeamIds = session.fireTeamIds.includes(tId)
            ? session.fireTeamIds.filter((id) => id !== tId)
            : [...session.fireTeamIds, tId];
        } else if (mode === 'RUSH') {
          session.pointRushTeamIds = session.pointRushTeamIds.includes(tId)
            ? session.pointRushTeamIds.filter((id) => id !== tId)
            : [...session.pointRushTeamIds, tId];
        } else if (mode === 'FOCUS') {
          session.selectedTeamId = session.selectedTeamId === tId ? null : tId;
        }
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
      if (tId) {
        session.pointRushTeamIds = session.pointRushTeamIds.includes(tId)
          ? session.pointRushTeamIds.filter((id) => id !== tId)
          : [...session.pointRushTeamIds, tId];
      }
      break;
    }

    case 'ADD_POINT_ALL_TEAMS': {
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        const res = getOrCreateTeamResult(tId);
        res.bonusPoints = (res.bonusPoints || 0) + 1;
        const calc = calculateTeamMatchScore(res, scoringConfig);
        if (calc.success && calc.data) {
          res.placementPoints = calc.data.placementPoints;
          res.killPoints = calc.data.killPoints;
          res.totalPoints = calc.data.totalPoints;
        }
      });
      tournament.markModified('matches');
      await tournament.save();
      break;
    }

    case 'CHANGE_MATCH': {
      const newMatchId = payload?.matchId;
      if (!newMatchId) throw new Error('matchId is required for CHANGE_MATCH');
      const targetM = tournament.matches.find(
        (m: any) => (m.id || m.customId) === newMatchId
      );
      if (!targetM) throw new Error(`Match ${newMatchId} not found in tournament`);
      session.matchId = targetM.id || targetM.customId;
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
      (tournament.teams || []).forEach((t: any, idx: number) => {
        const tId = t.id || t.customId || (t._id ? String(t._id) : `team-${idx + 1}`);
        session.squads[tId] = ['alive', 'alive', 'alive', 'alive'];
      });
      session.markModified('squads');
      break;
    }

    default:
      throw new Error(`Unsupported command type: ${commandType}`);
  }

  // Strictly monotonically increment revision
  session.revision = (session.revision || 1) + 1;
  await session.save();

  // Compile authoritative state
  const authoritativeState = await getAuthoritativeBroadcastState(session.sessionId);

  // Realtime Broadcast across session room
  broadcastToSession(session.sessionId, {
    type: 'BROADCAST_STATE_UPDATED',
    sessionId: session.sessionId,
    revision: session.revision,
    state: authoritativeState,
    payload: authoritativeState,
    timestamp: Date.now(),
  });

  return {
    success: true,
    revision: session.revision,
    state: authoritativeState,
  };
}

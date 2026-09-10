import mongoose from 'mongoose';
import { Tournament, type ITournament } from '../models/Tournament';
import { AuditActivity } from '../models/AuditActivity';
import { registerServerDeletedMatch, updateAuthoritativeState } from './realtimeSync';
import { ensureUserOrganization } from './tenantMigrationService';
import { User } from '../models/User';

export async function getTournamentsByUser(
  userId: string,
  authorizedOrgIds?: string[]
): Promise<ITournament[]> {
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

  if (authorizedOrgIds && authorizedOrgIds.length > 0) {
    if (authorizedOrgIds.includes('*')) {
      return Tournament.find({}).sort({ createdAt: -1 });
    }
    const orgObjectIds = authorizedOrgIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    return Tournament.find({
      $or: [
        { organizationId: { $in: orgObjectIds } },
        ...(userObjectId ? [{ userId: userObjectId }] : []),
      ],
    }).sort({ createdAt: -1 });
  }

  const userCondition: any = userObjectId
    ? { $or: [{ userId: userObjectId }, { userId }] }
    : { userId };

  return Tournament.find(userCondition).sort({ createdAt: -1 });
}

export async function getTournamentsForOrganizer(organizerUserId: string): Promise<ITournament[]> {
  const userObjectId = mongoose.Types.ObjectId.isValid(organizerUserId) ? new mongoose.Types.ObjectId(organizerUserId) : null;
  const userCondition = userObjectId
    ? { $or: [{ userId: userObjectId }, { userId: organizerUserId }] }
    : { userId: organizerUserId };

  return Tournament.find(userCondition).sort({ createdAt: -1 });
}

export async function getTournamentById(
  idOrCustomId: string,
  userIdOrOrgIds?: string | string[],
  role?: string,
  explicitUserId?: string
): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: idOrCustomId }];
  if (idOrCustomId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: idOrCustomId });
  }

  const baseQuery: any = { $or: idQueries };

  if (role === 'admin') {
    return Tournament.findOne(baseQuery);
  }

  // Handle authorized organization IDs array or single userId string
  if (Array.isArray(userIdOrOrgIds) && userIdOrOrgIds.length > 0) {
    if (userIdOrOrgIds.includes('*')) {
      return Tournament.findOne(baseQuery);
    }
    const orgObjectIds = userIdOrOrgIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const userObjectId = explicitUserId && mongoose.Types.ObjectId.isValid(explicitUserId)
      ? new mongoose.Types.ObjectId(explicitUserId)
      : null;

    baseQuery.$and = [
      {
        $or: [
          { organizationId: { $in: orgObjectIds } },
          ...(userObjectId ? [{ userId: userObjectId }] : []),
        ],
      },
    ];
  } else if (typeof userIdOrOrgIds === 'string' && userIdOrOrgIds) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userIdOrOrgIds) ? new mongoose.Types.ObjectId(userIdOrOrgIds) : null;
    const userCondition = userObjectId
      ? { $or: [{ userId: userObjectId }, { userId: userIdOrOrgIds }] }
      : { userId: userIdOrOrgIds };
    baseQuery.$and = [userCondition];
  }

  return Tournament.findOne(baseQuery);
}

export async function getPublicTournamentForBroadcast(idOrCustomId: string): Promise<ITournament | null> {
  const query: any = {
    $or: [{ customId: idOrCustomId }],
  };
  if (idOrCustomId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: idOrCustomId });
  }
  const tour = await Tournament.findOne(query);
  if (!tour) return null;

  // Sanitize internal security fields before returning publicly
  if (tour.broadcastToken) {
    tour.broadcastToken.tokenHash = undefined as any;
  }

  return tour;
}

export async function createTournament(
  userId: string,
  data: any,
  explicitOrgId?: string
): Promise<ITournament> {
  const customId = data.id || `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

  // Resolve organization ID
  let targetOrgId = explicitOrgId;
  if (!targetOrgId && data.organizationId) {
    targetOrgId = data.organizationId;
  }
  if (!targetOrgId) {
    const user = await User.findById(userId);
    if (user) {
      const org = await ensureUserOrganization(user);
      targetOrgId = org._id.toString();
    }
  }

  const effectiveTeams = Array.isArray(data.teams) ? data.teams : [];
  const initialMatches = Array.isArray(data.matches) ? data.matches : [];

  const tournament = await Tournament.create({
    ...data,
    customId,
    userId: userObjectId,
    organizationId: targetOrgId ? new mongoose.Types.ObjectId(targetOrgId) : undefined,
    teams: effectiveTeams,
    matches: initialMatches,
  });

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}`,
    userId: String(userId),
    action: 'Tournament Created',
    category: 'tournament',
    details: `Created "${tournament.title}" with ${tournament.structure?.slotsPerMatch || 12} slots in organization ${targetOrgId || 'default'}.`,
  });

  return tournament;
}

export function isDemoTournamentId(id: string): boolean {
  return (
    id === 'tour-ff-champ-2026' ||
    id === 'tour-ff-night-scrims' ||
    id === 'tour-ff-summer-finals' ||
    id.startsWith('tour-demo-')
  );
}

export async function updateTournament(
  tournamentId: string,
  userId: string,
  data: any,
  role?: string,
  authorizedOrgIds?: string[]
): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    if (authorizedOrgIds && authorizedOrgIds.length > 0 && !authorizedOrgIds.includes('*')) {
      const orgObjectIds = authorizedOrgIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      query.$and = [
        {
          $or: [
            { organizationId: { $in: orgObjectIds } },
            ...(userObjectId ? [{ userId: userObjectId }] : []),
          ],
        },
      ];
    } else {
      query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId }] } : { userId }];
    }
  }

  // Protect against changing ownership through arbitrary update payloads
  const sanitized = { ...data };
  delete sanitized.userId;
  delete sanitized.organizationId;

  const updated = await Tournament.findOneAndUpdate(
    query,
    { $set: sanitized },
    { returnDocument: 'after', runValidators: true }
  );

  return updated;
}

export async function deleteMatchFromTournament(
  tournamentId: string,
  matchId: string,
  userId: string,
  role?: string,
  authorizedOrgIds?: string[]
): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    if (authorizedOrgIds && authorizedOrgIds.length > 0 && !authorizedOrgIds.includes('*')) {
      const orgObjectIds = authorizedOrgIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      query.$and = [
        {
          $or: [
            { organizationId: { $in: orgObjectIds } },
            ...(userObjectId ? [{ userId: userObjectId }] : []),
          ],
        },
      ];
    } else {
      query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId }] } : { userId }];
    }
  }

  // Atomically pull match from matches array in MongoDB
  const updated = await Tournament.findOneAndUpdate(
    query,
    { $pull: { matches: { id: matchId } } as any },
    { returnDocument: 'after', runValidators: true }
  );

  if (updated) {
    registerServerDeletedMatch(matchId);

    updateAuthoritativeState(
      tournamentId,
      { tournament: updated.toJSON ? updated.toJSON() : updated },
      undefined,
      'MATCH_DELETED'
    ).catch(() => {});

    AuditActivity.create({
      userId,
      action: 'Match Deleted',
      category: 'match',
      details: `Deleted match ID "${matchId}" from tournament "${updated.title}".`,
    }).catch(() => {});
  }

  return updated;
}

export async function updateMatchScoreAtomic(
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
  userId: string,
  role?: string,
  authorizedOrgIds?: string[]
): Promise<{ tournament: ITournament; calculatedResult: any } | null> {
  const tournament = await getTournamentById(tournamentId, authorizedOrgIds || userId, role, userId);
  if (!tournament) return null;

  const { updateMatchScoreServer } = await import('./realtimeSync');
  const result = await updateMatchScoreServer(tournamentId, matchId, rawResult);
  return { tournament, calculatedResult: result.calculatedResult };
}

export async function deleteTournament(
  tournamentId: string,
  userId: string,
  role?: string,
  authorizedOrgIds?: string[]
): Promise<boolean> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    if (authorizedOrgIds && authorizedOrgIds.length > 0 && !authorizedOrgIds.includes('*')) {
      const orgObjectIds = authorizedOrgIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      query.$and = [
        {
          $or: [
            { organizationId: { $in: orgObjectIds } },
            ...(userObjectId ? [{ userId: userObjectId }] : []),
          ],
        },
      ];
    } else {
      query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId }] } : { userId }];
    }
  }

  const res = await Tournament.deleteOne(query);
  return res.deletedCount > 0;
}

export async function cloneTournament(
  sourceId: string,
  userId: string,
  options: any,
  role?: string,
  authorizedOrgIds?: string[],
  targetOrgId?: string
): Promise<ITournament | null> {
  const source = await getTournamentById(sourceId, authorizedOrgIds || userId, role, userId);
  if (!source) return null;

  const newId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const effectiveOrgId = targetOrgId || source.organizationId?.toString();

  const clonedTeams = options.copyTeams
    ? source.teams.map((t: any, idx: number) => ({
        ...t,
        id: `team-${newId}-${idx + 1}`,
        players: options.copyPlayers
          ? (t.players || []).map((p: any, pIdx: number) => ({ ...p, id: `p-${newId}-${idx + 1}-${pIdx + 1}` }))
          : [],
      }))
    : [];

  const cloned = await Tournament.create({
    customId: newId,
    userId,
    organizationId: effectiveOrgId ? new mongoose.Types.ObjectId(effectiveOrgId) : source.organizationId,
    title: options.newTitle?.trim() || `${source.title} (Clone)`,
    organizer: source.organizer,
    game: source.game,
    description: options.copySettings ? source.description : '',
    tournamentType: source.tournamentType,
    status: 'Draft',
    structure: options.copySettings ? source.structure : { teamCount: 12, matchCount: 6, roundRobin: false, slotsPerMatch: 12 },
    scoringPreset: options.copyScoring ? source.scoringPreset : source.scoringPreset,
    bannerUrl: options.copyBranding ? source.bannerUrl : undefined,
    logoUrl: options.copyBranding ? source.logoUrl : undefined,
    teams: clonedTeams,
    matches: options.copyMatches ? source.matches : [],
  });

  return cloned;
}

export async function importTournaments(
  userId: string,
  incoming: any[],
  targetOrgId?: string
): Promise<number> {
  if (!Array.isArray(incoming) || incoming.length === 0) return 0;
  const batch = incoming.slice(0, 50);
  let count = 0;

  // Resolve user organization if not explicitly supplied
  let orgId = targetOrgId;
  if (!orgId) {
    const user = await User.findById(userId);
    if (user) {
      const org = await ensureUserOrganization(user);
      orgId = org._id.toString();
    }
  }

  for (const item of batch) {
    if (item && typeof item === 'object' && typeof item.title === 'string' && item.title.trim()) {
      const customId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const safeData = {
        title: item.title.trim().slice(0, 100),
        subtitle: typeof item.subtitle === 'string' ? item.subtitle.slice(0, 150) : '',
        organizerName: typeof item.organizerName === 'string' ? item.organizerName.slice(0, 100) : '',
        game: typeof item.game === 'string' ? item.game.slice(0, 50) : 'Free Fire',
        stageFormat: typeof item.stageFormat === 'string' ? item.stageFormat : 'Battle Royale',
        scoringSystem: item.scoringSystem && typeof item.scoringSystem === 'object' ? item.scoringSystem : undefined,
        matches: Array.isArray(item.matches) ? item.matches.slice(0, 50) : [],
        teams: Array.isArray(item.teams) ? item.teams.slice(0, 50) : [],
        customId,
        userId,
        organizationId: orgId ? new mongoose.Types.ObjectId(orgId) : undefined,
      };
      await Tournament.create(safeData);
      count++;
    }
  }

  return count;
}

export async function getNextMatchForTournament(
  tournamentId: string,
  currentMatchId: string
): Promise<{ hasNext: boolean; nextMatchId?: string; nextMatchNumber?: number; nextMatch?: any; message?: string }> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const tour = await Tournament.findOne({ $or: idQueries });
  if (!tour) {
    return { hasNext: false, message: 'Tournament not found' };
  }

  if (!Array.isArray(tour.matches)) tour.matches = [];

  const currentMatch = tour.matches.find((m: any) => (m.id || m.customId) === currentMatchId);
  const currentNum = currentMatch?.matchNumber || 1;
  const targetNextNum = currentNum + 1;

  // 1. Check if an existing match already has matchNumber === targetNextNum
  let nextMatch = tour.matches.find((m: any) => m.matchNumber === targetNextNum);
  if (nextMatch) {
    return {
      hasNext: true,
      nextMatchId: nextMatch.id || nextMatch.customId,
      nextMatchNumber: nextMatch.matchNumber,
      nextMatch,
    };
  }

  // If no next match exists in database, return hasNext: false (never auto-create matches)
  return {
    hasNext: false,
    message: `No next match found. Match ${currentNum} is the latest match.`,
  };
}

export async function createMatchInTournament(
  tournamentId: string,
  matchData: {
    mapName?: string;
    customLabel?: string;
    idempotencyKey?: string;
  },
  userId: string,
  role?: string,
  authorizedOrgIds?: string[]
): Promise<{ match: any; tournament: ITournament; alreadyExisted?: boolean } | null> {
  const tournament = await getTournamentById(tournamentId, authorizedOrgIds || userId, role, userId);
  if (!tournament) return null;

  if (!Array.isArray(tournament.matches)) {
    tournament.matches = [];
  }

  // Idempotency check: if match was already created with this idempotencyKey, return it safely
  if (matchData.idempotencyKey) {
    const existing = tournament.matches.find((m: any) => m.idempotencyKey === matchData.idempotencyKey);
    if (existing) {
      return { match: existing, tournament, alreadyExisted: true };
    }
  }

  const existingNumbers = tournament.matches.map((m: any) => m.matchNumber || 0);
  const nextMatchNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  const matchId = `match-${tournament.customId || tournamentId}-${nextMatchNumber}-${Date.now().toString(36)}`;
  const effectiveTeams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const mapName = matchData.mapName || 'Bermuda';
  const customLabel = matchData.customLabel?.trim() || `Match ${nextMatchNumber.toString().padStart(2, '0')} (${mapName})`;

  const initialResults = effectiveTeams.map((t: any, idx: number) => ({
    teamId: t.id || t.customId || `team-${idx + 1}`,
    placement: 0,
    kills: 0,
    placementPoints: 0,
    killPoints: 0,
    totalPoints: 0,
    isBooyah: false,
  }));

  const newMatch = {
    id: matchId,
    customId: matchId,
    tournamentId: tournament.customId || tournamentId,
    matchNumber: nextMatchNumber,
    customLabel,
    mapName,
    status: 'Draft',
    idempotencyKey: matchData.idempotencyKey || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scoringConfigId: tournament.scoringPreset?.id || 'preset-ff-official-v1',
    scoringVersion: tournament.scoringPreset?.version || 1,
    results: initialResults,
  };

  tournament.matches.push(newMatch);
  tournament.markModified('matches');
  await tournament.save();

  return { match: newMatch, tournament, alreadyExisted: false };
}


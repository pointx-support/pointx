import mongoose from 'mongoose';
import { Tournament, ITournament } from '../models/Tournament';
import { AuditActivity } from '../models/AuditActivity';
import { registerServerDeletedMatch, updateAuthoritativeState } from './realtimeSync';

export async function getTournamentsByUser(userId: string): Promise<ITournament[]> {
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
  const userCondition: any = userObjectId
    ? { $or: [{ userId: userObjectId }, { userId: userId }] }
    : { userId };

  const query = {
    $or: [
      userCondition,
      { customId: { $in: ['tour-ff-champ-2026', 'tour-ff-night-scrims', 'tour-ff-summer-finals'] } },
    ],
  };

  return Tournament.find(query).sort({ createdAt: -1 });
}

export async function getTournamentsForOrganizer(organizerUserId: string): Promise<ITournament[]> {
  const userObjectId = mongoose.Types.ObjectId.isValid(organizerUserId) ? new mongoose.Types.ObjectId(organizerUserId) : null;
  const userCondition = userObjectId
    ? { $or: [{ userId: userObjectId }, { userId: organizerUserId }] }
    : { userId: organizerUserId };

  return Tournament.find(userCondition).sort({ createdAt: -1 });
}

export async function getTournamentById(idOrCustomId: string, userId?: string, role?: string): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: idOrCustomId }];
  if (idOrCustomId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: idOrCustomId });
  }

  const baseQuery: any = { $or: idQueries };

  if (userId && role !== 'admin') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const userCondition = userObjectId
      ? { $or: [{ userId: userObjectId }, { userId: userId }] }
      : { userId };
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
  return Tournament.findOne(query);
}

export async function createTournament(userId: string, data: any): Promise<ITournament> {
  const customId = data.id || `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  
  const tournament = await Tournament.create({
    ...data,
    customId,
    userId: userObjectId,
  });

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}`,
    userId: String(userId),
    action: 'Tournament Created',
    category: 'tournament',
    details: `Created "${tournament.title}" with ${tournament.structure?.slotsPerMatch || 12} slots.`,
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

export async function updateTournament(tournamentId: string, userId: string, data: any, role?: string): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin' && !isDemoTournamentId(tournamentId)) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId: userId }] } : { userId }];
  }

  const updated = await Tournament.findOneAndUpdate(
    query,
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  );

  return updated;
}

export async function deleteMatchFromTournament(
  tournamentId: string,
  matchId: string,
  userId: string,
  role?: string
): Promise<ITournament | null> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin' && !isDemoTournamentId(tournamentId)) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId: userId }] } : { userId }];
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
  role?: string
): Promise<{ tournament: ITournament; calculatedResult: any } | null> {
  const tournament = await getTournamentById(tournamentId, userId, role);
  if (!tournament) return null;

  const { updateMatchScoreServer } = await import('./realtimeSync');
  const result = await updateMatchScoreServer(tournamentId, matchId, rawResult);
  return { tournament, calculatedResult: result.calculatedResult };
}

export async function deleteTournament(tournamentId: string, userId: string, role?: string): Promise<boolean> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin') {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    query.$and = [userObjectId ? { $or: [{ userId: userObjectId }, { userId: userId }] } : { userId }];
  }

  const res = await Tournament.deleteOne(query);
  return res.deletedCount > 0;
}

export async function cloneTournament(sourceId: string, userId: string, options: any, role?: string): Promise<ITournament | null> {
  const source = await getTournamentById(sourceId, userId, role);
  if (!source) return null;

  const newId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
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

export async function importTournaments(userId: string, incoming: any[]): Promise<number> {
  if (!Array.isArray(incoming) || incoming.length === 0) return 0;
  const batch = incoming.slice(0, 50);
  let count = 0;

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
      };
      await Tournament.create(safeData);
      count++;
    }
  }

  return count;
}

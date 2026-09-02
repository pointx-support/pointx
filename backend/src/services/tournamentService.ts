import { Tournament, ITournament } from '../models/Tournament';
import { AuditActivity } from '../models/AuditActivity';

export async function getTournamentsByUser(userId: string): Promise<ITournament[]> {
  return Tournament.find({ userId }).sort({ createdAt: -1 });
}

export async function getTournamentById(idOrCustomId: string, userId?: string): Promise<ITournament | null> {
  const query: any = {
    $or: [{ customId: idOrCustomId }],
  };
  if (idOrCustomId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: idOrCustomId });
  }
  if (userId) {
    // Organizers can access their own tournaments; broadcast endpoints can access by ID
    query.userId = userId;
  }
  return Tournament.findOne(query);
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
  const tournament = await Tournament.create({
    ...data,
    customId,
    userId,
  });

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}`,
    userId,
    action: 'Tournament Created',
    category: 'tournament',
    details: `Created "${tournament.title}" with ${tournament.structure?.slotsPerMatch || 12} slots.`,
  });

  return tournament;
}

export async function updateTournament(tournamentId: string, userId: string, data: any): Promise<ITournament | null> {
  const query: any = {
    $or: [{ customId: tournamentId }],
    userId,
  };
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: tournamentId });
  }

  const updated = await Tournament.findOneAndUpdate(
    query,
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  );

  return updated;
}

export async function deleteTournament(tournamentId: string, userId: string): Promise<boolean> {
  const query: any = {
    $or: [{ customId: tournamentId }],
    userId,
  };
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: tournamentId });
  }

  const res = await Tournament.deleteOne(query);
  return res.deletedCount > 0;
}

export async function cloneTournament(sourceId: string, userId: string, options: any): Promise<ITournament | null> {
  const source = await getTournamentById(sourceId, userId);
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
  let count = 0;

  for (const item of incoming) {
    if (item && item.title) {
      const customId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      await Tournament.create({
        ...item,
        customId,
        userId,
      });
      count++;
    }
  }

  return count;
}

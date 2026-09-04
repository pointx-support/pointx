import { GlobalTeam, IGlobalTeam, IGlobalPlayer } from '../models/GlobalTeam';

export async function getGlobalTeams(userId?: string, query?: string): Promise<IGlobalTeam[]> {
  const filter: any = {};
  if (userId) {
    filter.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
  }
  if (query && query.trim()) {
    const regex = new RegExp(query.trim(), 'i');
    filter.$and = [
      {
        $or: [
          { name: regex },
          { tag: regex },
          { captainName: regex },
          { 'players.name': regex },
          { 'players.inGameId': regex },
        ],
      },
    ];
  }

  return GlobalTeam.find(filter).sort({ name: 1 });
}

export async function createGlobalTeam(userId: string, data: any): Promise<IGlobalTeam> {
  const customId = data.id || `gt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  return GlobalTeam.create({
    ...data,
    customId,
    userId,
  });
}

export async function updateGlobalTeam(
  teamId: string,
  userId: string,
  updates: Partial<IGlobalTeam>,
  role?: string
): Promise<IGlobalTeam | null> {
  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };
  if (role !== 'admin') {
    query.userId = userId;
  }

  return GlobalTeam.findOneAndUpdate(query, { $set: updates }, { returnDocument: 'after' });
}

export async function deleteGlobalTeam(
  teamId: string,
  userId?: string,
  role?: string
): Promise<boolean> {
  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };
  if (role !== 'admin' && userId) {
    query.userId = userId;
  }

  const res = await GlobalTeam.deleteOne(query);
  return res.deletedCount > 0;
}

export async function addPlayerToTeam(
  teamId: string,
  userId: string,
  player: Omit<IGlobalPlayer, 'id' | 'createdAt' | 'updatedAt'>,
  role?: string
): Promise<IGlobalPlayer | null> {
  const newPlayer: IGlobalPlayer = {
    ...player,
    id: `gp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };
  if (role !== 'admin') {
    query.userId = userId;
  }

  const team = await GlobalTeam.findOne(query);
  if (!team) return null;

  team.players.push(newPlayer);
  await team.save();
  return newPlayer;
}

export async function updatePlayerInTeam(
  teamId: string,
  playerId: string,
  userId: string,
  updates: Partial<IGlobalPlayer>,
  role?: string
): Promise<boolean> {
  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };
  if (role !== 'admin') {
    query.userId = userId;
  }

  const team = await GlobalTeam.findOne(query);
  if (!team) return false;

  const playerIdx = team.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) return false;

  team.players[playerIdx] = {
    ...team.players[playerIdx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await team.save();
  return true;
}

export async function deletePlayerFromTeam(
  teamId: string,
  playerId: string,
  userId: string,
  role?: string
): Promise<boolean> {
  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };
  if (role !== 'admin') {
    query.userId = userId;
  }

  const team = await GlobalTeam.findOne(query);
  if (!team) return false;

  team.players = team.players.filter((p) => p.id !== playerId);
  await team.save();
  return true;
}

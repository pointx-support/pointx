import mongoose from 'mongoose';
import { GlobalTeam, IGlobalTeam, IGlobalPlayer } from '../models/GlobalTeam';

export async function getGlobalTeams(
  orgIds?: (string | mongoose.Types.ObjectId)[],
  userId?: string,
  query?: string,
  role?: string
): Promise<IGlobalTeam[]> {
  const filter: any = {};

  if (role !== 'admin') {
    const validOrgIds = (orgIds || []).map((id) =>
      mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    );

    const userObjectId = userId && mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const accessConditions: any[] = [
      { organizationId: { $in: validOrgIds } },
    ];

    if (userObjectId) {
      accessConditions.push(
        { userId: userObjectId, organizationId: { $exists: false } },
        { userId: userObjectId, organizationId: null }
      );
    }

    filter.$or = accessConditions;
  }

  if (query && query.trim()) {
    const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const searchCondition = {
      $or: [
        { name: regex },
        { tag: regex },
        { captainName: regex },
        { 'players.name': regex },
        { 'players.inGameId': regex },
      ],
    };
    if (filter.$or) {
      filter.$and = [searchCondition];
    } else {
      Object.assign(filter, searchCondition);
    }
  }

  return GlobalTeam.find(filter).sort({ name: 1 });
}

export async function createGlobalTeam(
  userId: string,
  orgId: string | mongoose.Types.ObjectId | undefined,
  data: any
): Promise<IGlobalTeam> {
  const customId = data.id || `gt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const orgObjectId = orgId && mongoose.Types.ObjectId.isValid(orgId) ? new mongoose.Types.ObjectId(orgId) : orgId;

  return GlobalTeam.create({
    ...data,
    customId,
    userId: userObjectId,
    organizationId: orgObjectId,
  });
}

function buildTeamScopeQuery(
  teamId: string,
  orgIds?: (string | mongoose.Types.ObjectId)[],
  userId?: string,
  role?: string
): any {
  const idQueries: any[] = [{ customId: teamId }];
  if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: teamId });
  }

  const query: any = { $or: idQueries };

  if (role !== 'admin') {
    const validOrgIds = (orgIds || []).map((id) =>
      mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    );
    const userObjectId = userId && mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const accessConditions: any[] = [
      { organizationId: { $in: validOrgIds } },
    ];
    if (userObjectId) {
      accessConditions.push(
        { userId: userObjectId, organizationId: { $exists: false } },
        { userId: userObjectId, organizationId: null }
      );
    }

    query.$and = [{ $or: accessConditions }];
  }

  return query;
}

export async function updateGlobalTeam(
  teamId: string,
  orgIds: (string | mongoose.Types.ObjectId)[] | undefined,
  userId: string,
  updates: Partial<IGlobalTeam>,
  role?: string
): Promise<IGlobalTeam | null> {
  const query = buildTeamScopeQuery(teamId, orgIds, userId, role);
  return GlobalTeam.findOneAndUpdate(query, { $set: updates }, { returnDocument: 'after' });
}

export async function deleteGlobalTeam(
  teamId: string,
  orgIds: (string | mongoose.Types.ObjectId)[] | undefined,
  userId?: string,
  role?: string
): Promise<boolean> {
  const query = buildTeamScopeQuery(teamId, orgIds, userId, role);
  const res = await GlobalTeam.deleteOne(query);
  return res.deletedCount > 0;
}

export async function addPlayerToTeam(
  teamId: string,
  orgIds: (string | mongoose.Types.ObjectId)[] | undefined,
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

  const query = buildTeamScopeQuery(teamId, orgIds, userId, role);
  const team = await GlobalTeam.findOne(query);
  if (!team) return null;

  team.players.push(newPlayer);
  await team.save();
  return newPlayer;
}

export async function updatePlayerInTeam(
  teamId: string,
  playerId: string,
  orgIds: (string | mongoose.Types.ObjectId)[] | undefined,
  userId: string,
  updates: Partial<IGlobalPlayer>,
  role?: string
): Promise<boolean> {
  const query = buildTeamScopeQuery(teamId, orgIds, userId, role);
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
  orgIds: (string | mongoose.Types.ObjectId)[] | undefined,
  userId: string,
  role?: string
): Promise<boolean> {
  const query = buildTeamScopeQuery(teamId, orgIds, userId, role);
  const team = await GlobalTeam.findOne(query);
  if (!team) return false;

  const initialLen = team.players.length;
  team.players = team.players.filter((p) => p.id !== playerId);
  if (team.players.length === initialLen) return false;

  await team.save();
  return true;
}

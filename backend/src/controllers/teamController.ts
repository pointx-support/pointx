import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createGlobalTeamSchema,
  updateGlobalTeamSchema,
  globalPlayerSchema,
} from '../validation/teamSchemas';
import {
  getGlobalTeams,
  createGlobalTeam,
  updateGlobalTeam,
  deleteGlobalTeam,
  addPlayerToTeam,
  updatePlayerInTeam,
  deletePlayerFromTeam,
} from '../services/teamService';

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string | undefined;
    const teams = await getGlobalTeams((req as any).user?._id?.toString(), query);
    return res.status(200).json({ success: true, data: teams.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = createGlobalTeamSchema.parse(req.body);
    const team = await createGlobalTeam(req.user._id.toString(), validated);
    return res.status(201).json({ success: true, data: team.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const validated = updateGlobalTeamSchema.parse(req.body);
    const updated = await updateGlobalTeam(id, req.user._id.toString(), validated as any);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(200).json({ success: true, data: updated.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const deleted = await deleteGlobalTeam(id, req.user._id.toString());
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(200).json({ success: true, message: 'Team deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function addPlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const validated = globalPlayerSchema.parse(req.body);
    const player = await addPlayerToTeam(id, validated);
    if (!player) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(201).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
}

export async function updatePlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const playerId = req.params.playerId as string;
    const validated = globalPlayerSchema.partial().parse(req.body);
    const success = await updatePlayerInTeam(id, playerId, validated);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Team or player not found.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function deletePlayer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const playerId = req.params.playerId as string;
    const success = await deletePlayerFromTeam(id, playerId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Team or player not found.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

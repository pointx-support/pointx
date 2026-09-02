import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createTournamentSchema,
  updateTournamentSchema,
  cloneTournamentSchema,
} from '../validation/tournamentSchemas';
import {
  getTournamentsByUser,
  getTournamentById,
  getPublicTournamentForBroadcast,
  createTournament,
  updateTournament,
  deleteTournament,
  cloneTournament,
  importTournaments,
} from '../services/tournamentService';

export async function getMyTournaments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const tournaments = await getTournamentsByUser(req.user._id.toString());
    return res.status(200).json({ success: true, data: tournaments.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function getTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const tournament = await getTournamentById(id, req.user?._id.toString());
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }
    return res.status(200).json({ success: true, data: tournament.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function getPublicBroadcastTournament(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const tournament = await getPublicTournamentForBroadcast(id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }
    return res.status(200).json({ success: true, data: tournament.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function createNewTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = createTournamentSchema.parse(req.body);
    const tournament = await createTournament(req.user._id.toString(), validated);
    return res.status(201).json({ success: true, data: tournament.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const validated = updateTournamentSchema.parse(req.body);
    const updated = await updateTournament(id, req.user._id.toString(), validated);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }
    return res.status(200).json({ success: true, data: updated.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const deleted = await deleteTournament(id, req.user._id.toString());
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }
    return res.status(200).json({ success: true, message: 'Tournament deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function cloneExistingTournament(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = cloneTournamentSchema.parse(req.body);
    const cloned = await cloneTournament(validated.sourceId, req.user._id.toString(), validated);
    if (!cloned) {
      return res.status(404).json({ success: false, error: 'Source tournament not found.' });
    }
    return res.status(201).json({ success: true, data: cloned.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function importTournamentsBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const { tournaments } = req.body;
    const count = await importTournaments(req.user._id.toString(), tournaments);
    return res.status(200).json({ success: true, importedCount: count });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthorizedTenantRequest } from '../middleware/tenantAuth';
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
  deleteMatchFromTournament,
  createMatchInTournament,
  updateMatchScoreAtomic,
  cloneTournament,
  importTournaments,
} from '../services/tournamentService';
import { updateAuthoritativeState } from '../services/realtimeSync';

export async function getMyTournaments(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const tournaments = await getTournamentsByUser(
      req.user._id.toString(),
      req.authorizedOrganizationIds
    );
    return res.status(200).json({ success: true, data: tournaments.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function getTournament(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    // If middleware already verified and attached tournament, use it directly
    if (req.tournament) {
      return res.status(200).json({ success: true, data: req.tournament.toJSON() });
    }

    const id = req.params.id as string;
    const tournament = await getTournamentById(
      id,
      req.authorizedOrganizationIds,
      req.user?.role,
      req.user?._id.toString()
    );
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

export async function createNewTournament(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = createTournamentSchema.parse(req.body);
    const tournament = await createTournament(
      req.user._id.toString(),
      validated,
      req.primaryOrganizationId
    );
    const tourData = tournament.toJSON();
    updateAuthoritativeState(
      tournament.customId || tournament._id.toString(),
      { tournament: tourData },
      undefined,
      'TOURNAMENT_UPDATED'
    ).catch((err) => console.warn('[RealtimeSync] Tournament create broadcast error:', err));
    return res.status(201).json({ success: true, data: tourData });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingTournament(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const validated = updateTournamentSchema.parse(req.body);
    const updated = await updateTournament(
      id,
      req.user._id.toString(),
      validated,
      req.user.role,
      req.authorizedOrganizationIds
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }
    const tourData = updated.toJSON();
    updateAuthoritativeState(
      updated.customId || id,
      { tournament: tourData },
      undefined,
      'MATCH_UPDATED'
    ).catch((err) => console.warn('[RealtimeSync] Tournament update broadcast error:', err));
    return res.status(200).json({ success: true, data: tourData });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingMatch(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const matchId = req.params.matchId as string;
    if (!id || !matchId) {
      return res.status(400).json({ success: false, error: 'Tournament ID and Match ID are required.' });
    }
    const updated = await deleteMatchFromTournament(
      id,
      matchId,
      req.user._id.toString(),
      req.user.role,
      req.authorizedOrganizationIds
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }
    const tourData = updated.toJSON();
    updateAuthoritativeState(
      updated.customId || id,
      { tournament: tourData },
      undefined,
      'MATCH_DELETED'
    ).catch((err) => console.warn('[RealtimeSync] Match delete broadcast error:', err));
    return res.status(200).json({ success: true, data: tourData, message: `Match ${matchId} deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function createNewMatch(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const { mapName, customLabel, idempotencyKey } = req.body || {};

    const result = await createMatchInTournament(
      id,
      { mapName, customLabel, idempotencyKey },
      req.user._id.toString(),
      req.user.role,
      req.authorizedOrganizationIds
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }

    const tourData = result.tournament.toJSON();
    updateAuthoritativeState(
      result.tournament.customId || id,
      { tournament: tourData },
      undefined,
      'MATCH_CREATED'
    ).catch((err) => console.warn('[RealtimeSync] Match create broadcast error:', err));

    return res.status(result.alreadyExisted ? 200 : 201).json({
      success: true,
      data: result.match,
      tournament: tourData,
      message: result.alreadyExisted ? 'Match already exists (idempotent request).' : 'Match created successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExistingTournament(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const deleted = await deleteTournament(
      id,
      req.user._id.toString(),
      req.user.role,
      req.authorizedOrganizationIds
    );
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized.' });
    }
    return res.status(200).json({ success: true, message: 'Tournament deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function cloneExistingTournament(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = cloneTournamentSchema.parse(req.body);
    const cloned = await cloneTournament(
      validated.sourceId,
      req.user._id.toString(),
      validated,
      req.user.role,
      req.authorizedOrganizationIds,
      req.primaryOrganizationId
    );
    if (!cloned) {
      return res.status(404).json({ success: false, error: 'Source tournament not found.' });
    }
    return res.status(201).json({ success: true, data: cloned.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function importTournamentsBatch(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const { tournaments } = req.body;
    if (!Array.isArray(tournaments) || tournaments.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid payload: tournaments array is required.' });
    }
    if (tournaments.length > 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 tournaments can be imported in a single batch.' });
    }
    const count = await importTournaments(
      req.user._id.toString(),
      tournaments,
      req.primaryOrganizationId
    );
    return res.status(200).json({ success: true, importedCount: count });
  } catch (error) {
    next(error);
  }
}

export async function updateMatchScore(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const matchId = req.params.matchId as string;
    const { teamId, kills, placement, isBooyah, bonusPoints, penaltyPoints } = req.body;

    if (!teamId) {
      return res.status(400).json({ success: false, error: 'teamId is required.' });
    }

    const updated = await updateMatchScoreAtomic(
      id,
      matchId,
      { teamId, kills, placement, isBooyah, bonusPoints, penaltyPoints },
      req.user._id.toString(),
      req.user.role,
      req.authorizedOrganizationIds
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tournament or match not found.' });
    }

    return res.status(200).json({
      success: true,
      data: updated.tournament.toJSON(),
      calculatedResult: updated.calculatedResult,
    });
  } catch (error) {
    next(error);
  }
}

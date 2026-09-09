import { Response, NextFunction } from 'express';
import { AuthorizedTenantRequest } from '../middleware/tenantAuth';
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

export async function listTeams(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const query = req.query.q as string | undefined;
    const orgIds = req.authorizedOrganizationIds || [];
    const teams = await getGlobalTeams(orgIds, req.user._id.toString(), query, req.user.role);
    return res.status(200).json({ success: true, data: teams.map((t) => t.toJSON()) });
  } catch (error) {
    next(error);
  }
}

export async function createTeam(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const validated = createGlobalTeamSchema.parse(req.body);
    const orgId = req.primaryOrganizationId?.toString() || (req.body.organizationId as string);
    const team = await createGlobalTeam(req.user._id.toString(), orgId, validated);
    return res.status(201).json({ success: true, data: team.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const validated = updateGlobalTeamSchema.parse(req.body);
    const orgIds = req.authorizedOrganizationIds || [];
    const updated = await updateGlobalTeam(
      id,
      orgIds,
      req.user._id.toString(),
      validated as any,
      req.user.role
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(200).json({ success: true, data: updated.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeam(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const orgIds = req.authorizedOrganizationIds || [];
    const deleted = await deleteGlobalTeam(id, orgIds, req.user._id.toString(), req.user.role);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(200).json({ success: true, message: 'Team deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function addPlayer(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const validated = globalPlayerSchema.parse(req.body);
    const orgIds = req.authorizedOrganizationIds || [];
    const player = await addPlayerToTeam(
      id,
      orgIds,
      req.user._id.toString(),
      validated,
      req.user.role
    );
    if (!player) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }
    return res.status(201).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
}

export async function updatePlayer(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const playerId = req.params.playerId as string;
    const validated = globalPlayerSchema.partial().parse(req.body);
    const orgIds = req.authorizedOrganizationIds || [];
    const success = await updatePlayerInTeam(
      id,
      playerId,
      orgIds,
      req.user._id.toString(),
      validated,
      req.user.role
    );
    if (!success) {
      return res.status(404).json({ success: false, error: 'Team or player not found.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function deletePlayer(req: AuthorizedTenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
    const id = req.params.id as string;
    const playerId = req.params.playerId as string;
    const orgIds = req.authorizedOrganizationIds || [];
    const success = await deletePlayerFromTeam(
      id,
      playerId,
      orgIds,
      req.user._id.toString(),
      req.user.role
    );
    if (!success) {
      return res.status(404).json({ success: false, error: 'Team or player not found.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

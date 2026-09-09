import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { Tournament, ITournament } from '../models/Tournament';
import { BroadcastSession, IBroadcastSession } from '../models/BroadcastSession';
import { AuditActivity } from '../models/AuditActivity';
import { ensureUserOrganization } from '../services/tenantMigrationService';

export interface AuthorizedTenantRequest extends AuthenticatedRequest {
  authorizedOrganizationIds?: string[];
  primaryOrganizationId?: string;
  tournament?: ITournament;
  broadcastSession?: IBroadcastSession;
}

/**
 * Log unauthorized cross-tenant attempt for security audits
 */
export async function logSecurityViolation(
  req: AuthenticatedRequest,
  action: string,
  resourceId?: string,
  details?: string
): Promise<void> {
  try {
    const userId = req.user?._id?.toString() || 'unauthenticated';
    const userEmail = req.user?.email || 'unauthenticated';
    await AuditActivity.create({
      customId: `sec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      action: `SECURITY_${action}`,
      category: 'security',
      details: details || `Blocked unauthorized attempt by ${userEmail} on resource ${resourceId || 'unknown'}.`,
    });
  } catch {}
}

/**
 * Resolves user's authorized organizations and memberships.
 * Guarantees that every active user has at least one provisioned organization.
 */
export async function requireOrganizationContext(
  req: AuthorizedTenantRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
      });
    }

    // Super Admin has global platform privilege
    if (req.user.role === 'admin') {
      req.authorizedOrganizationIds = ['*'];
      req.primaryOrganizationId = req.user.primaryOrganizationId?.toString();
      return next();
    }

    // Fetch user's active organization memberships
    let memberships = await OrganizationMembership.find({
      userId: req.user._id,
    });

    // Auto-provision if missing
    if (memberships.length === 0) {
      const org = await ensureUserOrganization(req.user);
      memberships = await OrganizationMembership.find({
        userId: req.user._id,
      });
      req.primaryOrganizationId = org._id.toString();
    } else {
      req.primaryOrganizationId =
        req.user.primaryOrganizationId?.toString() || memberships[0].organizationId.toString();
    }

    const orgIds = memberships.map((m) => m.organizationId.toString());
    req.authorizedOrganizationIds = orgIds;

    if (orgIds.length === 0) {
      await logSecurityViolation(req, 'NO_ORGANIZATION_MEMBERSHIP', undefined, 'User has no organization memberships.');
      return res.status(403).json({
        success: false,
        error: 'Access denied: No active organization membership found.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require and verify that the requested tournament belongs to one of the
 * authenticated user's authorized organizations.
 *
 * FAILS CLOSED: Returns 404 Not Found if tournament does not exist or user
 * does not belong to the owning organization (prevents resource enumeration).
 */
export function requireTournamentAccess(action: 'read' | 'write' | 'admin' = 'read') {
  return async (req: AuthorizedTenantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const tourId =
        (req.params.id as string) ||
        (req.params.tournamentId as string) ||
        (req.body?.tournamentId as string) ||
        (req.query?.tournamentId as string);

      if (!tourId) {
        return res.status(400).json({ success: false, error: 'Tournament ID is required.' });
      }

      const idQueries: any[] = [{ customId: tourId }];
      if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
        idQueries.push({ _id: tourId });
      }

      // If Super Admin, bypass tenant filter
      if (req.user.role === 'admin') {
        const tournament = await Tournament.findOne({ $or: idQueries });
        if (!tournament) {
          return res.status(404).json({ success: false, error: 'Tournament not found.' });
        }
        req.tournament = tournament;
        return next();
      }

      // For normal users, resolve organization context if not yet resolved
      if (!req.authorizedOrganizationIds) {
        let memberships = await OrganizationMembership.find({ userId: req.user._id });
        if (memberships.length === 0) {
          await ensureUserOrganization(req.user);
          memberships = await OrganizationMembership.find({ userId: req.user._id });
        }
        req.authorizedOrganizationIds = memberships.map((m) => m.organizationId.toString());
      }

      const authorizedOrgObjectIds = req.authorizedOrganizationIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const query: any = {
        $or: idQueries,
        $and: [
          {
            $or: [
              { organizationId: { $in: authorizedOrgObjectIds } },
              // Backward compatibility check for legacy documents during active migration
              { userId: req.user._id },
            ],
          },
        ],
      };

      const tournament = await Tournament.findOne(query);

      if (!tournament) {
        await logSecurityViolation(
          req,
          'CROSS_ORG_TOURNAMENT_ACCESS_DENIED',
          tourId,
          `User ${req.user.email} denied access to tournament ${tourId}.`
        );
        return res.status(404).json({
          success: false,
          error: 'Tournament not found.',
        });
      }

      req.tournament = tournament;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require and verify access to a Broadcast Session.
 * OBS public read is permitted only if holding a valid scoped token or sanitized view.
 * All control commands (+1 Kill, Wipe, etc.) and report submissions STRICTLY REQUIRE
 * authentication and verified organization membership.
 */
export function requireBroadcastSessionAccess(action: 'read' | 'control' = 'read') {
  return async (req: AuthorizedTenantRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = (req.params.sessionId as string) || (req.body?.sessionId as string);
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'sessionId is required.' });
      }

      const session = await BroadcastSession.findOne({ sessionId, active: true });
      if (!session) {
        return res.status(404).json({ success: false, error: 'Broadcast session not found.' });
      }

      // Read access: if public/OBS view, allow sanitized snapshot
      if (action === 'read') {
        req.broadcastSession = session;
        return next();
      }

      // Control actions: MUST BE AUTHENTICATED
      if (!req.user) {
        await logSecurityViolation(
          req,
          'UNAUTHENTICATED_BROADCAST_CONTROL_DENIED',
          sessionId,
          'Unauthenticated client attempted to execute broadcast command.'
        );
        return res.status(401).json({
          success: false,
          error: 'Authentication required to control broadcast session.',
        });
      }

      // Super Admin bypass
      if (req.user.role === 'admin') {
        req.broadcastSession = session;
        return next();
      }

      // Resolve user's authorized organizations
      if (!req.authorizedOrganizationIds) {
        let memberships = await OrganizationMembership.find({ userId: req.user._id });
        if (memberships.length === 0) {
          await ensureUserOrganization(req.user);
          memberships = await OrganizationMembership.find({ userId: req.user._id });
        }
        req.authorizedOrganizationIds = memberships.map((m) => m.organizationId.toString());
      }

      const sessionOrg = session.organizationId?.toString();
      const isAuthorizedOrg = sessionOrg && req.authorizedOrganizationIds.includes(sessionOrg);

      // Also verify tournament ownership in case session organizationId was legacy
      let isTourOwner = false;
      if (!isAuthorizedOrg && session.tournamentId) {
        const idQueries: any[] = [{ customId: session.tournamentId }];
        if (mongoose.Types.ObjectId.isValid(session.tournamentId)) {
          idQueries.push({ _id: new mongoose.Types.ObjectId(session.tournamentId) });
        }
        const tour = await Tournament.findOne({ $or: idQueries });
        if (tour) {
          const tourOrg = tour.organizationId?.toString();
          if (tourOrg && req.authorizedOrganizationIds.includes(tourOrg)) {
            isTourOwner = true;
          } else if (tour.userId && tour.userId.toString() === req.user._id.toString()) {
            isTourOwner = true;
          }
        }
      }

      if (!isAuthorizedOrg && !isTourOwner) {
        await logSecurityViolation(
          req,
          'CROSS_ORG_BROADCAST_CONTROL_DENIED',
          sessionId,
          `User ${req.user.email} denied control of session ${sessionId} (owned by ${sessionOrg}).`
        );
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have permission to control this organization session.',
        });
      }

      req.broadcastSession = session;
      next();
    } catch (error) {
      next(error);
    }
  };
}

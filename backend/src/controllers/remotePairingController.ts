import { Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RemotePairingSession } from '../models/RemotePairingSession';
import { Tournament } from '../models/Tournament';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { AuthorizedTenantRequest } from '../middleware/tenantAuth';
import { env } from '../config/env';

/**
 * Creates a short-lived (10 min TTL), single-use pairing session for Remote Control.
 * POST /api/broadcast/remote-pairing
 */
export async function createPairingSession(req: AuthorizedTenantRequest, res: Response) {
  try {
    const { tournamentId, sessionId, matchId } = req.body;

    if (!tournamentId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID and Broadcast Session ID are required to generate a pairing QR code.',
      });
    }

    // Verify tournament exists and user has access
    const idQueries: any[] = [{ customId: tournamentId }];
    if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: tournamentId });
    }

    const tournament = await Tournament.findOne({ $or: idQueries });
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found.' });
    }

    const orgId = tournament.organizationId?.toString() || tournament.customId || 'default-org';

    // Verify organization ownership if not super admin
    if (req.user?.role !== 'admin' && req.authorizedOrganizationIds && !req.authorizedOrganizationIds.includes('*')) {
      const hasAccess = req.authorizedOrganizationIds.includes(orgId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS DENIED: You do not have permission to generate remote pairing codes for this tournament.',
        });
      }
    }

    // Invalidate any existing unused pairing tokens for this broadcast session
    await RemotePairingSession.deleteMany({
      sessionId,
      isConsumed: false,
    });

    // Generate cryptographically secure random token (48 chars hex)
    const pairingToken = crypto.randomBytes(24).toString('hex');
    const ttlSeconds = 600; // 10 minutes
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const session = await RemotePairingSession.create({
      pairingToken,
      organizationId: orgId,
      tournamentId: tournament.customId || tournament._id.toString(),
      matchId: matchId || 'none',
      sessionId,
      expiresAt,
      isConsumed: false,
    });

    const clientOrigin = env.FRONTEND_URL || env.CLIENT_URL || 'https://pointx.in';
    const pairingUrl = `${clientOrigin}/remote/connect/${pairingToken}`;

    return res.status(201).json({
      success: true,
      data: {
        pairingToken: session.pairingToken,
        sessionId: session.sessionId,
        tournamentId: session.tournamentId,
        matchId: session.matchId,
        expiresAt: session.expiresAt,
        ttlSeconds,
        pairingUrl,
      },
    });
  } catch (error: any) {
    console.error('[RemotePairing] createPairingSession error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create remote pairing session.',
    });
  }
}

/**
 * Checks the status of a pairing token.
 * GET /api/broadcast/remote-pairing/status/:token
 */
export async function getPairingSessionStatus(req: AuthorizedTenantRequest, res: Response) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required.' });
    }

    const session = await RemotePairingSession.findOne({ pairingToken: token });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Pairing session not found or has already expired.',
      });
    }

    const isExpired = session.expiresAt.getTime() <= Date.now();

    return res.json({
      success: true,
      data: {
        valid: !session.isConsumed && !isExpired,
        isConsumed: session.isConsumed,
        isExpired,
        expiresAt: session.expiresAt,
        tournamentId: session.tournamentId,
        organizationId: session.organizationId,
      },
    });
  } catch (error: any) {
    console.error('[RemotePairing] getPairingSessionStatus error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pairing session status.',
    });
  }
}

/**
 * Claims a pairing session by an authenticated operator device.
 * Enforces organization tenant boundaries.
 * POST /api/broadcast/remote-pairing/claim
 */
export async function claimPairingSession(req: AuthorizedTenantRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in before claiming Remote Control access.',
      });
    }

    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Pairing token is required.' });
    }

    const session = await RemotePairingSession.findOne({ pairingToken: token });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired pairing code. Please ask the broadcast host to generate a new QR code.',
      });
    }

    if (session.isConsumed) {
      return res.status(400).json({
        success: false,
        error: 'This pairing QR code has already been claimed by another device. Please generate a new code.',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Pairing QR code has expired (10-minute limit). Please generate a fresh code on the broadcast console.',
      });
    }

    // Strict Organization Isolation Check:
    // User must be Super Admin OR have active membership in session.organizationId
    if (req.user.role !== 'admin') {
      const membership = await OrganizationMembership.findOne({
        userId: req.user._id,
        organizationId: session.organizationId,
      });

      // Also check user's primaryOrganizationId or organizationName
      const isPrimaryOrg =
        req.user.primaryOrganizationId?.toString() === session.organizationId ||
        req.user.organizationName === session.organizationId;

      if (!membership && !isPrimaryOrg) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS DENIED: You do not belong to the organization hosting this tournament.',
        });
      }
    }

    // Atomically claim the session
    session.isConsumed = true;
    session.consumedByUserId = req.user._id.toString();
    await session.save();

    // Issue authorized remote operator session grant token
    const grantToken = jwt.sign(
      {
        sessionId: session.sessionId,
        tournamentId: session.tournamentId,
        matchId: session.matchId,
        userId: req.user._id.toString(),
        role: 'remote',
        organizationId: session.organizationId,
      },
      env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    const redirectUrl = `/remote?session=${session.sessionId}&tournamentId=${session.tournamentId}&token=${grantToken}`;

    return res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        tournamentId: session.tournamentId,
        matchId: session.matchId,
        token: grantToken,
        redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('[RemotePairing] claimPairingSession error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to claim remote pairing session.',
    });
  }
}

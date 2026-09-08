import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  getOrCreateBroadcastSession,
  getAuthoritativeBroadcastState,
  executeBroadcastCommand,
} from '../services/broadcastSessionService';

export async function createOrGetSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { tournamentId, matchId } = req.body;
    if (!tournamentId) {
      return res.status(400).json({ success: false, error: 'tournamentId is required.' });
    }

    const session = await getOrCreateBroadcastSession(tournamentId, matchId, req.user);
    const authoritativeState = await getAuthoritativeBroadcastState(session.sessionId);

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      session: session.toJSON(),
      state: authoritativeState,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function getSessionAuthoritativeState(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required.' });
    }

    const authoritativeState = await getAuthoritativeBroadcastState(sessionId);
    return res.status(200).json({
      success: true,
      state: authoritativeState,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export async function postSessionCommand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId as string;
    const { commandType, targetTeamId, payload, commandId } = req.body;

    if (!sessionId || !commandType) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and commandType are required.',
      });
    }

    const result = await executeBroadcastCommand(
      sessionId,
      { commandType, targetTeamId, payload, commandId },
      req.user
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(400).json({ success: false, error: error.message || 'Command execution failed.' });
  }
}

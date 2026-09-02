import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UserSession, IUserSession } from '../models/UserSession';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  sessionRecord?: IUserSession;
  token?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check Cookie
    if (!token && (req as any).cookies?.token) {
      token = (req as any).cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
      });
    }

    // 3. Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token. Please sign in again.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: 'Invalid token payload.' });
    }

    // 4. Fetch User
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Account not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: `Account suspended. Reason: ${user.suspensionReason || 'Violation of platform guidelines.'}`,
      });
    }

    // 5. Verify Session if sessionId is present
    if (decoded.sessionId) {
      const session = await UserSession.findById(decoded.sessionId);
      if (session && session.isRevoked) {
        return res.status(401).json({
          success: false,
          error: 'This login session has been terminated. Please sign in again.',
        });
      }
      if (session) {
        session.lastActive = new Date();
        session.save().catch(() => {});
        req.sessionRecord = session;
      }
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireOnboarded(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }
  if (!req.user.isOnboarded) {
    return res.status(403).json({
      success: false,
      error: 'Organization profile setup required. Please complete onboarding to activate your workspace.',
      requiresOnboarding: true,
    });
  }
  next();
}

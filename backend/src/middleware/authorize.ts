import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of [${roles.join(', ')}] privileges.`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');

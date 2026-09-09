import { Router } from 'express';
import {
  createOrGetSession,
  getSessionAuthoritativeState,
  postSessionCommand,
  submitReport,
} from '../controllers/broadcastSessionController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireOrganizationContext, requireBroadcastSessionAccess } from '../middleware/tenantAuth';

const router = Router();

// 1. Create or get existing broadcast session for a tournament/match (Requires auth & tenant membership)
router.post('/', authenticate, requireOrganizationContext, createOrGetSession);

// 2. Fetch authoritative snapshot (Publicly accessible by session ID for OBS Browser Sources & Remotes, read-only)
router.get('/:sessionId', optionalAuthenticate, requireBroadcastSessionAccess('read'), getSessionAuthoritativeState);

// 3. Post authoritative operator commands (+1 Kill, - Kill, Wipe Squad, etc. REQUIRES AUTH & CONTROL PERMISSION)
router.post('/:sessionId/commands', authenticate, requireOrganizationContext, requireBroadcastSessionAccess('control'), postSessionCommand);

// 4. Submit verified match report from Remote Control to website results (REQUIRES AUTH & CONTROL PERMISSION)
router.post('/:sessionId/submit-report', authenticate, requireOrganizationContext, requireBroadcastSessionAccess('control'), submitReport);

export default router;

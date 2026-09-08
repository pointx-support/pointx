import { Router } from 'express';
import {
  createOrGetSession,
  getSessionAuthoritativeState,
  postSessionCommand,
  submitReport,
} from '../controllers/broadcastSessionController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// 1. Create or get existing broadcast session for a tournament/match
router.post('/', optionalAuthenticate, createOrGetSession);

// 2. Fetch authoritative snapshot (publicly accessible by session ID for OBS Browser Sources & Remotes)
router.get('/:sessionId', optionalAuthenticate, getSessionAuthoritativeState);

// 3. Post authoritative operator commands (+1 Kill, - Kill, Wipe Squad, Revive, Set Mode, etc.)
router.post('/:sessionId/commands', optionalAuthenticate, postSessionCommand);

// 4. Submit verified match report from Remote Control to website tournament results
router.post('/:sessionId/submit-report', optionalAuthenticate, submitReport);

export default router;

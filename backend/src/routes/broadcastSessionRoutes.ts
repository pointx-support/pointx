import { Router } from 'express';
import {
  createOrGetSession,
  getSessionAuthoritativeState,
  postSessionCommand,
} from '../controllers/broadcastSessionController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// 1. Create or get existing broadcast session for a tournament/match
router.post('/', optionalAuthenticate, createOrGetSession);

// 2. Fetch authoritative snapshot (publicly accessible by session ID for OBS Browser Sources & Remotes)
router.get('/:sessionId', optionalAuthenticate, getSessionAuthoritativeState);

// 3. Post authoritative operator commands (+1 Kill, - Kill, Wipe Squad, Revive, Set Mode, etc.)
router.post('/:sessionId/commands', optionalAuthenticate, postSessionCommand);

export default router;

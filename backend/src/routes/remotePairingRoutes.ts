import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireOrganizationContext } from '../middleware/tenantAuth';
import {
  createPairingSession,
  getPairingSessionStatus,
  claimPairingSession,
} from '../controllers/remotePairingController';

const router = Router();

// Create new ephemeral pairing session (requires authenticated broadcast operator)
router.post('/', authenticate, requireOrganizationContext, createPairingSession);

// Check pairing session status (public / scanner check)
router.get('/status/:token', getPairingSessionStatus);

// Claim pairing session (requires authenticated device; validates org membership)
router.post('/claim', authenticate, claimPairingSession);

export default router;

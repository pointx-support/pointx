import { Router } from 'express';
import {
  getMyTournaments,
  getTournament,
  getPublicBroadcastTournament,
  createNewTournament,
  updateExistingTournament,
  deleteExistingTournament,
  deleteExistingMatch,
  updateMatchScore,
  cloneExistingTournament,
  importTournamentsBatch,
} from '../controllers/tournamentController';
import { authenticate, requireOnboarded } from '../middleware/auth';
import { requireOrganizationContext, requireTournamentAccess } from '../middleware/tenantAuth';

const router = Router();

// Public broadcast endpoint (sanitized)
router.get('/public/:id', getPublicBroadcastTournament);

// Protected tournament operations (Requires authenticated & onboarded user with verified tenant context)
router.get('/', authenticate, requireOnboarded, requireOrganizationContext, getMyTournaments);
router.post('/', authenticate, requireOnboarded, requireOrganizationContext, createNewTournament);
router.post('/clone', authenticate, requireOnboarded, requireOrganizationContext, cloneExistingTournament);
router.post('/import', authenticate, requireOnboarded, requireOrganizationContext, importTournamentsBatch);
router.get('/:id', authenticate, requireOnboarded, requireOrganizationContext, requireTournamentAccess('read'), getTournament);
router.put('/:id', authenticate, requireOnboarded, requireOrganizationContext, requireTournamentAccess('write'), updateExistingTournament);
router.post('/:id/matches/:matchId/score', authenticate, requireOnboarded, requireOrganizationContext, requireTournamentAccess('write'), updateMatchScore);
router.delete('/:id/matches/:matchId', authenticate, requireOnboarded, requireOrganizationContext, requireTournamentAccess('write'), deleteExistingMatch);
router.delete('/:id', authenticate, requireOnboarded, requireOrganizationContext, requireTournamentAccess('admin'), deleteExistingTournament);

export default router;

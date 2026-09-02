import { Router } from 'express';
import {
  getMyTournaments,
  getTournament,
  getPublicBroadcastTournament,
  createNewTournament,
  updateExistingTournament,
  deleteExistingTournament,
  cloneExistingTournament,
  importTournamentsBatch,
} from '../controllers/tournamentController';
import { authenticate, requireOnboarded } from '../middleware/auth';

const router = Router();

// Public broadcast endpoint
router.get('/public/:id', getPublicBroadcastTournament);

// Protected tournament operations (Requires authenticated & onboarded user)
router.get('/', authenticate, requireOnboarded, getMyTournaments);
router.post('/', authenticate, requireOnboarded, createNewTournament);
router.post('/clone', authenticate, requireOnboarded, cloneExistingTournament);
router.post('/import', authenticate, requireOnboarded, importTournamentsBatch);
router.get('/:id', authenticate, requireOnboarded, getTournament);
router.put('/:id', authenticate, requireOnboarded, updateExistingTournament);
router.delete('/:id', authenticate, requireOnboarded, deleteExistingTournament);

export default router;

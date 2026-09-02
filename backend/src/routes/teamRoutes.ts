import { Router } from 'express';
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayer,
  updatePlayer,
  deletePlayer,
} from '../controllers/teamController';
import { authenticate, requireOnboarded } from '../middleware/auth';

const router = Router();

router.get('/', listTeams);
router.post('/', authenticate, requireOnboarded, createTeam);
router.put('/:id', authenticate, requireOnboarded, updateTeam);
router.delete('/:id', authenticate, requireOnboarded, deleteTeam);

router.post('/:id/players', authenticate, requireOnboarded, addPlayer);
router.put('/:id/players/:playerId', authenticate, requireOnboarded, updatePlayer);
router.delete('/:id/players/:playerId', authenticate, requireOnboarded, deletePlayer);

export default router;

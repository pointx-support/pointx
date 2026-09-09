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
import { requireOrganizationContext } from '../middleware/tenantAuth';

const router = Router();

// All team operations require authentication and organization context
router.use(authenticate, requireOnboarded, requireOrganizationContext);

router.get('/', listTeams);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

router.post('/:id/players', addPlayer);
router.put('/:id/players/:playerId', updatePlayer);
router.delete('/:id/players/:playerId', deletePlayer);

export default router;

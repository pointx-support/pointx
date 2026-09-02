import { Router } from 'express';
import {
  listTemplates,
  createNewTemplate,
  updateExistingTemplate,
  deleteExistingTemplate,
} from '../controllers/templateController';
import { authenticate, requireOnboarded } from '../middleware/auth';

const router = Router();

router.get('/', listTemplates);
router.post('/', authenticate, requireOnboarded, createNewTemplate);
router.put('/:id', authenticate, requireOnboarded, updateExistingTemplate);
router.delete('/:id', authenticate, requireOnboarded, deleteExistingTemplate);

export default router;

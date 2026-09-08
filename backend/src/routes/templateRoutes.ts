import { Router } from 'express';
import {
  listTemplates,
  getSingleTemplate,
  listOrganizationsForTemplatePicker,
  createNewTemplate,
  updateExistingTemplate,
  deleteExistingTemplate,
} from '../controllers/templateController';
import { authenticate, optionalAuthenticate, requireOnboarded } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, listTemplates);
router.get('/organizations', authenticate, listOrganizationsForTemplatePicker);
router.get('/:id', optionalAuthenticate, getSingleTemplate);
router.post('/', authenticate, requireOnboarded, createNewTemplate);
router.put('/:id', authenticate, requireOnboarded, updateExistingTemplate);
router.delete('/:id', authenticate, requireOnboarded, deleteExistingTemplate);

export default router;

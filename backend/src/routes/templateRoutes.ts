import { Router } from 'express';
import {
  listTemplates,
  getSingleTemplate,
  getTemplateSectionData,
  listOrganizationsForTemplatePicker,
  createNewTemplate,
  updateExistingTemplate,
  deleteExistingTemplate,
} from '../controllers/templateController';
import { authenticate, optionalAuthenticate, requireOnboarded } from '../middleware/auth';
import { requireOrganizationContext } from '../middleware/tenantAuth';

const router = Router();

router.get('/', optionalAuthenticate, listTemplates);
router.get('/organizations', authenticate, listOrganizationsForTemplatePicker);
router.get('/:id/data', authenticate, requireOrganizationContext, getTemplateSectionData);
router.get('/:id', optionalAuthenticate, getSingleTemplate);
router.post('/', authenticate, requireOnboarded, requireOrganizationContext, createNewTemplate);
router.put('/:id', authenticate, requireOnboarded, requireOrganizationContext, updateExistingTemplate);
router.delete('/:id', authenticate, requireOnboarded, requireOrganizationContext, deleteExistingTemplate);

export default router;

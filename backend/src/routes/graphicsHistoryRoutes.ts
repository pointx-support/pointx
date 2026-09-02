import { Router } from 'express';
import {
  getGraphicsHistory,
  saveGraphicRecord,
  deleteGraphicRecord,
} from '../controllers/graphicsHistoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getGraphicsHistory);
router.post('/', authenticate, saveGraphicRecord);
router.delete('/:id', authenticate, deleteGraphicRecord);

export default router;

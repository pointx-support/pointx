import { Router } from 'express';
import { uploadMediaFile, deleteMediaFile } from '../controllers/mediaController';
import { authenticate, requireOnboarded } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/upload', authenticate, requireOnboarded, uploadLimiter, uploadMedia.single('image'), uploadMediaFile);
router.post('/delete', authenticate, requireOnboarded, deleteMediaFile);

export default router;

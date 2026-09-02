import { Router } from 'express';
import { submitContactQuery } from '../controllers/contactController';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', apiLimiter, submitContactQuery);
router.post('/query', apiLimiter, submitContactQuery);

export default router;

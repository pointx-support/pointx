import { Router } from 'express';
import { updateProfile, completeOnboarding, updatePreferences } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.put('/profile', authenticate, updateProfile);
router.post('/onboarding', authenticate, completeOnboarding);
router.put('/preferences', authenticate, updatePreferences);

export default router;

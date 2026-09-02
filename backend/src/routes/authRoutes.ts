import { Router } from 'express';
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  terminateOtherSessions,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Auth Endpoints
router.post('/signup', authLimiter, signup);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);

// Protected Auth Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/terminate-sessions', authenticate, terminateOtherSessions);

export default router;

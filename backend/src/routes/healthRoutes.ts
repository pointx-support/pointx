import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const handleHealth = async (req: AuthenticatedRequest, res: Response) => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = readyStates[mongoose.connection.readyState] || 'unknown';
  const isHealthy = dbStatus === 'connected';

  // For unauthenticated/public monitoring callers, provide minimal health status without leaking internal architecture or 3rd-party API configs
  if (!req.user || req.user.role !== 'admin') {
    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    });
  }

  // Detailed telemetry for administrators only
  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '2.4.0-Enterprise',
    environment: env.NODE_ENV,
    services: {
      database: dbStatus,
      cloudinary: env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'mock_mode',
      brevo: env.BREVO_API_KEY ? 'configured' : 'mock_mode',
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
};

router.get('/', optionalAuthenticate, handleHealth);
router.get('/health', optionalAuthenticate, handleHealth);

export default router;

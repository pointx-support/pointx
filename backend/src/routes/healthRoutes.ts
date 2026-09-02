import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';

const router = Router();

const handleHealth = async (_req: Request, res: Response) => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = readyStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
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

router.get('/', handleHealth);
router.get('/health', handleHealth);

export default router;

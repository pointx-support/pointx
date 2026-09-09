import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';

const READY_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const router = Router();

/**
 * 1. Liveness Health Check (GET /api/health or GET /health)
 * MUST NEVER FAIL OR BLOCK: Confirms that the Node/Express HTTP process is running.
 * Used by Render, AWS, and load balancers to route traffic.
 * Does NOT depend on MongoDB connection, auth, or external APIs.
 */
const handleLivenessHealth = (_req: Request, res: Response) => {
  const dbStatus = READY_STATES[mongoose.connection.readyState] || 'unknown';

  return res.status(200).json({
    status: 'healthy',
    success: true,
    server: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
};

/**
 * 2. Readiness Probe (GET /api/ready or GET /ready)
 * Confirms that critical dependencies (MongoDB) are connected and ready to serve queries.
 */
const handleReadiness = (_req: Request, res: Response) => {
  const dbStatus = READY_STATES[mongoose.connection.readyState] || 'unknown';
  const isReady = mongoose.connection.readyState === 1;

  if (isReady) {
    return res.status(200).json({
      status: 'ready',
      success: true,
      ready: true,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
  }

  return res.status(503).json({
    status: 'not_ready',
    success: false,
    ready: false,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
    message: 'Database is still connecting or temporarily unavailable.',
  });
};

/**
 * 3. Detailed Telemetry for Administrators (GET /api/health/admin)
 */
const handleAdminHealth = async (req: AuthenticatedRequest, res: Response) => {
  const dbStatus = READY_STATES[mongoose.connection.readyState] || 'unknown';
  const isConnected = mongoose.connection.readyState === 1;

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Administrator access required.',
    });
  }

  return res.status(200).json({
    success: true,
    status: isConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '2.6.0-Enterprise',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    services: {
      database: dbStatus,
      cloudinary: env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'mock_mode',
      brevo: env.BREVO_API_KEY ? 'configured' : 'mock_mode',
    },
  });
};

// Route Definitions
router.get('/', handleLivenessHealth);
router.get('/health', handleLivenessHealth);
router.get('/ready', handleReadiness);
router.get('/admin', optionalAuthenticate, handleAdminHealth);
router.get('/health/admin', optionalAuthenticate, handleAdminHealth);
export { handleLivenessHealth, handleReadiness, handleAdminHealth };
export default router;

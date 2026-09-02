import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sanitizeInput } from './middleware/sanitize';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import teamRoutes from './routes/teamRoutes';
import templateRoutes from './routes/templateRoutes';
import mediaRoutes from './routes/mediaRoutes';
import graphicsHistoryRoutes from './routes/graphicsHistoryRoutes';
import adminRoutes from './routes/adminRoutes';
import healthRoutes from './routes/healthRoutes';
import syncRoutes from './routes/syncRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Application {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled on API layer to allow rich OBS browser overlays & SVG font rasterizer
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, OBS browser source)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          env.FRONTEND_URL,
          env.CLIENT_URL,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5000',
          'http://127.0.0.1:5000',
        ].filter(Boolean);

        if (
          !env.isProduction ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.onrender.com') ||
          origin.endsWith('.ngrok-free.dev') ||
          origin.endsWith('.ngrok.app') ||
          origin.endsWith('.ngrok.io')
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // 3. Body Parsers & Cookie Parser
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // 4. NoSQL Injection Sanitization
  app.use(sanitizeInput);

  // 5. Request Logging (skip during tests)
  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // 6. Rate Limiting for general API routes
  app.use('/api', apiLimiter);

  // 7. Route Mounting
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tournaments', tournamentRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/graphics-history', graphicsHistoryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api', healthRoutes);
  app.use('/health', healthRoutes); // Root alias for health checks

  // 8. 404 Route Catch-All for /api routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found.' });
  });

  // 9. Static Frontend Serving & Single-Page Application (SPA) Routing Fallback
  const candidateDistPaths = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
  ];

  const frontendDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

  if (frontendDistPath) {
    // Serve static frontend assets (JS, CSS, images, bgvideo.mp4, fonts)
    app.use(
      express.static(frontendDistPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          } else if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // SPA Direct Route Fallback (e.g. /login, /signup, /super-admin, /dashboard)
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        return next();
      }
      const indexPath = path.join(frontendDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return next();
    });
  }

  // 10. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const errorMessages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
    });
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists.`,
    });
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid identifier format: ${err.value}`,
    });
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token.',
    });
  }

  // 5. Multer File Upload Errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // 6. Generic Server Error
  console.error('[Unhandled Server Error]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = env.isProduction && statusCode === 500 ? 'An internal server error occurred.' : err.message || 'Server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.isDevelopment ? { stack: err.stack } : {}),
  });
}

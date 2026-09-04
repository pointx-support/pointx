import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory or root directory
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const isTest = (process.env.NODE_ENV || 'development') === 'test';
const isDevelopment = !isProduction && !isTest;

// Ensure JWT_SECRET is explicitly set in production
const jwtSecret = process.env.JWT_SECRET;
if (isProduction && (!jwtSecret || jwtSecret === 'pointx-super-secure-production-jwt-secret-key-2026')) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set to a secure, unique secret in production.');
}

const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
if (isProduction && (!superAdminPassword || superAdminPassword === 'Universe00@@')) {
  console.warn('[SECURITY WARNING] SUPER_ADMIN_PASSWORD is unset or using a default placeholder in production. Ensure a strong unique secret is set.');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pointx_db',
  
  JWT_SECRET: jwtSecret || 'pointx-super-secure-dev-only-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'support@pointx.gg',
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'PointX Esports Arena',
  
  SUPER_ADMIN_USERNAME: process.env.SUPER_ADMIN_USERNAME || 'admin',
  SUPER_ADMIN_PASSWORD: superAdminPassword || 'Universe00@@',
  
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  
  isProduction,
  isTest,
  isDevelopment,
};

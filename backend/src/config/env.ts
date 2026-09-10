import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Ensure JWT_SECRET is available; if missing in production, generate a secure dynamic key instead of crashing
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'pointx-super-secure-production-jwt-secret-key-2026') {
  if (isProduction) {
    console.warn('\n⚠️ [SECURITY WARNING] JWT_SECRET environment variable is missing or using default in production.');
    console.warn('⚠️ Generated dynamic 512-bit cryptographic session key to prevent container boot crash. Configure JWT_SECRET in Render.\n');
    jwtSecret = crypto.randomBytes(64).toString('hex');
  } else {
    jwtSecret = 'pointx-super-secure-dev-only-secret-key-2026';
  }
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
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  
  isProduction,
  isTest,
  isDevelopment,
};

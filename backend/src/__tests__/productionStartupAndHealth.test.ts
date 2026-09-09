import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let adminToken: string;
let normalToken: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = createApp();

  const admin = await User.create({
    name: 'Admin Health Test',
    email: 'admin_health@pointx.gg',
    passwordHash: 'hash123',
    role: 'admin',
    status: 'active',
  });
  adminToken = generateJwtToken(admin);

  const normal = await User.create({
    name: 'Normal User Health Test',
    email: 'user_health@pointx.gg',
    passwordHash: 'hash123',
    role: 'organizer',
    status: 'active',
  });
  normalToken = generateJwtToken(normal);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Production Startup & Health Check Architecture', () => {
  it('1. GET /api/health returns 200 OK immediately for Render platform health checker', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.success).toBe(true);
    expect(res.body.uptime).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('2. GET /health root alias returns 200 OK for root pingers', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.success).toBe(true);
  });

  it('3. GET /api/ready returns 200 OK when database is connected', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.status).toBe('ready');
    expect(res.body.services.database).toBe('connected');
  });

  it('4. GET /ready root alias returns 200 OK when database is connected', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('5. GET /api/health/admin rejects unauthenticated requests with 403', async () => {
    const res = await request(app).get('/api/health/admin');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('6. GET /api/health/admin rejects non-admin users with 403', async () => {
    const res = await request(app)
      .get('/api/health/admin')
      .set('Authorization', `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. GET /api/health/admin returns detailed telemetry for Super Admin', async () => {
    const res = await request(app)
      .get('/api/health/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBeDefined();
    expect(res.body.memoryUsageMB).toBeDefined();
    expect(res.body.services.database).toBe('connected');
  });
});

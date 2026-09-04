import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { User } from '../models/User';
import { PlatformSettings } from '../models/PlatformSettings';
import { setMaintenanceCache, resetMaintenanceCacheForTesting } from '../middleware/maintenance';
import { env } from '../config/env';

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  resetMaintenanceCacheForTesting();
});

describe('PointX Global Maintenance Mode Tests', () => {
  it('1. GET /api/platform/status returns maintenanceMode=false by default', async () => {
    const res = await request(app).get('/api/platform/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.maintenanceMode).toBe(false);
  });

  it('2. GET /health and /api/health are always accessible', async () => {
    setMaintenanceCache(true, 'Arena upgrade in progress', '2026-09-04T18:00:00Z');

    const res1 = await request(app).get('/health');
    expect(res1.status).toBe(200);

    const res2 = await request(app).get('/api/health');
    expect(res2.status).toBe(200);
  });

  it('3. Protected endpoints return 503 for non-authenticated and normal users when maintenance is ON', async () => {
    await PlatformSettings.create({
      key: 'global_config',
      maintenanceMode: true,
      maintenanceReason: 'Deploying High-Precision Tick Engine',
      estimatedReturnTime: '2026-09-04T20:00:00Z',
    });
    setMaintenanceCache(true, 'Deploying High-Precision Tick Engine', '2026-09-04T20:00:00Z');

    const resUnauth = await request(app).get('/api/tournaments');
    expect(resUnauth.status).toBe(503);
    expect(resUnauth.body.maintenanceMode).toBe(true);
    expect(resUnauth.body.message).toContain('Deploying High-Precision Tick Engine');
    expect(resUnauth.body.estimatedReturnTime).toBe('2026-09-04T20:00:00Z');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    const normalUser = await User.create({
      name: 'Organizer One',
      email: 'organizer@pointx.gg',
      passwordHash: hash,
      role: 'organizer',
      status: 'active',
      isOnboarded: true,
    });

    const userToken = jwt.sign({ id: normalUser._id.toString() }, env.JWT_SECRET);

    const resUser = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(resUser.status).toBe(503);
    expect(resUser.body.maintenanceMode).toBe(true);
  });

  it('4. Admin users bypass maintenance mode with full access', async () => {
    setMaintenanceCache(true, 'Emergency maintenance', '2026-09-04T20:00:00Z');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('adminPass123', salt);
    const adminUser = await User.create({
      name: 'PointX Admin',
      email: 'admin@pointx.gg',
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      isOnboarded: true,
    });

    const adminToken = jwt.sign({ id: adminUser._id.toString() }, env.JWT_SECRET);

    const resAdmin = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.success).toBe(true);
  });

  it('5. Login endpoint remains accessible during maintenance for admin access', async () => {
    setMaintenanceCache(true, 'Scheduled upgrade');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@pointx.gg', password: 'wrong' });

    expect(res.status).not.toBe(503);
  });

  it('6. Disabling maintenance mode restores immediate access to normal users', async () => {
    setMaintenanceCache(true, 'Test maintenance');
    
    const resBlocked = await request(app).get('/api/tournaments');
    expect(resBlocked.status).toBe(503);

    setMaintenanceCache(false);

    const resRestored = await request(app).get('/api/tournaments');
    expect(resRestored.status).toBe(401);
  });

  it('7. GET /api/platform/status dynamically reads maintenanceMode from DB without manual cache warmup', async () => {
    await PlatformSettings.create({
      key: 'global_config',
      maintenanceMode: true,
      maintenanceReason: 'Direct Database Update Verification',
      estimatedReturnTime: '2026-09-04T22:00:00Z',
    });

    // We do NOT call setMaintenanceCache here. /api/platform/status must refresh from DB.
    const res = await request(app).get('/api/platform/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.maintenanceMode).toBe(true);
    expect(res.body.maintenanceReason).toBe('Direct Database Update Verification');
    expect(res.body.estimatedReturnTime).toBe('2026-09-04T22:00:00Z');
  });

  it('8. Non-admin users cannot log in during maintenance mode', async () => {
    setMaintenanceCache(true, 'Emergency maintenance in progress');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('organizerPass123', salt);
    await User.create({
      name: 'Test Organizer',
      email: 'organizer_maint@pointx.gg',
      passwordHash: hash,
      role: 'organizer',
      status: 'active',
      isOnboarded: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'organizer_maint@pointx.gg', password: 'organizerPass123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('PointX is currently undergoing scheduled maintenance');
    expect(res.body.token).toBeUndefined();
  });

  it('9. Super Admin can log in during maintenance mode', async () => {
    setMaintenanceCache(true, 'Emergency maintenance in progress');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('adminPass123', salt);
    await User.create({
      name: 'Super Admin User',
      email: 'superadmin_maint@pointx.gg',
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      isOnboarded: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin_maint@pointx.gg', password: 'adminPass123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeDefined();
  });

  it('10. Registration is paused during maintenance mode', async () => {
    setMaintenanceCache(true, 'Maintenance active');

    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'New Player',
        email: 'newplayer@pointx.gg',
        password: 'SecurePassword123!',
      });

    expect(res.status).toBe(503);
    expect(res.body.maintenanceMode).toBe(true);
  });

  it('11. Activating maintenance mode requires valid security code 8260452263', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('adminPass123', salt);
    const adminUser = await User.create({
      name: 'Super Admin User',
      email: 'admin_gate@pointx.gg',
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      isOnboarded: true,
    });
    const adminToken = jwt.sign({ id: adminUser._id.toString() }, env.JWT_SECRET);

    // Attempt without security code -> 403
    const resNoCode = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maintenanceMode: true, maintenanceReason: 'Cluster upgrade' });
    expect(resNoCode.status).toBe(403);
    expect(resNoCode.body.error).toContain('Security authorization failed');

    // Attempt with incorrect security code -> 403
    const resWrongCode = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maintenanceMode: true, maintenanceReason: 'Cluster upgrade', securityCode: '1234567890' });
    expect(resWrongCode.status).toBe(403);
    expect(resWrongCode.body.error).toContain('Security authorization failed');

    // Attempt with correct code 8260452263 -> 200 OK
    const resValid = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maintenanceMode: true, maintenanceReason: 'Cluster upgrade', securityCode: '8260452263' });
    expect(resValid.status).toBe(200);
    expect(resValid.body.data.maintenanceMode).toBe(true);
  });

  it('12. Admin can log in using username "admin" as well as email', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('adminPass123', salt);
    await User.create({
      name: 'admin',
      email: 'admin@pointx.gg',
      passwordHash: hash,
      role: 'admin',
      status: 'active',
      isOnboarded: true,
    });

    // Login using username "admin"
    const resUsername = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin', password: 'adminPass123' });
    expect(resUsername.status).toBe(200);
    expect(resUsername.body.success).toBe(true);
    expect(resUsername.body.user.email).toBe('admin@pointx.gg');

    // Login using registered email
    const resEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@pointx.gg', password: 'adminPass123' });
    expect(resEmail.status).toBe(200);
    expect(resEmail.body.success).toBe(true);
  });
});

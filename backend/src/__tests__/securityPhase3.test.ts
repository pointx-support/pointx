import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { GlobalTeam } from '../models/GlobalTeam';
import { CustomTemplate } from '../models/CustomTemplate';
import { updateAuthoritativeState } from '../services/realtimeSync';

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
});

function createAuthToken(user: any): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Master Security Verification  Phase 3 Attack Simulation', () => {
  // 1. Attack-Surface Verification
  it('1. should reject unauthenticated requests on protected endpoints with 401', async () => {
    const endpoints = [
      { method: 'get', path: '/api/tournaments' },
      { method: 'post', path: '/api/tournaments' },
      { method: 'post', path: '/api/teams' },
      { method: 'post', path: '/api/templates' },
      { method: 'get', path: '/api/admin/users' },
      { method: 'get', path: '/api/admin/stats' },
      { method: 'get', path: '/api/admin/audit-logs' },
      { method: 'post', path: '/api/media/upload' },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  // 2. Authentication Bypass & Account Enumeration
  it('2. should not leak account existence during failed login (anti-enumeration)', async () => {
    const resNonExistent = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@nowhere.com', password: 'password123' });

    expect(resNonExistent.status).toBe(401);
    expect(resNonExistent.body.success).toBe(false);
    expect(resNonExistent.body.error).toContain('Invalid email or password');
    expect(resNonExistent.body.notRegistered).toBeUndefined();

    // Create active user
    await User.create({
      name: 'Real User',
      email: 'real@pointx.gg',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuu',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });

    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: 'real@pointx.gg', password: 'incorrectPassword123' });

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.success).toBe(false);
    expect(resWrongPass.body.error).toContain('Invalid email or password');
    // Both responses match exactly, preventing enumeration
    expect(resWrongPass.body.error).toBe(resNonExistent.body.error);
  });

  // 3. Authorization & Privilege Escalation (User -> Admin)
  it('3. should block regular organizer from invoking admin APIs with 403', async () => {
    const organizer = await User.create({
      name: 'Regular Organizer',
      email: 'organizer@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });

    const token = createAuthToken(organizer);

    const adminEndpoints = [
      { method: 'get', path: '/api/admin/users' },
      { method: 'get', path: '/api/admin/stats' },
      { method: 'get', path: '/api/admin/audit-logs' },
      { method: 'post', path: '/api/admin/system/settings' },
    ];

    for (const ep of adminEndpoints) {
      const res = await (request(app) as any)[ep.method](ep.path)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
  });

  // 4. IDOR / BOLA Prevention (Account A vs Account B)
  it('4. should prevent Account B from modifying or deleting Account A resources', async () => {
    const userA = await User.create({
      name: 'User A',
      email: 'usera@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });
    const userB = await User.create({
      name: 'User B',
      email: 'userb@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });

    const tokenB = createAuthToken(userB);

    // Create tournament owned by User A
    const tourA = await Tournament.create({
      title: 'Tournament Alpha',
      customId: 'tour-alpha-123',
      userId: userA._id,
      matches: [],
      teams: [],
    });

    // Create team owned by User A
    const teamA = await GlobalTeam.create({
      name: 'Team Alpha',
      tag: 'ALPHA',
      customId: 'gt-alpha-123',
      userId: userA._id.toString(),
      players: [],
    });

    // User B attempts to update User A tournament
    const resTourUpdate = await request(app)
      .put(`/api/tournaments/${tourA.customId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked Title by User B' });
    expect(resTourUpdate.status).toBe(404);

    // Verify tournament unchanged in DB
    const freshTour = await Tournament.findById(tourA._id);
    expect(freshTour?.title).toBe('Tournament Alpha');

    // User B attempts to delete User A team
    const resTeamDelete = await request(app)
      .delete(`/api/teams/${teamA.customId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resTeamDelete.status).toBe(404);

    // Verify team intact in DB
    const freshTeam = await GlobalTeam.findById(teamA._id);
    expect(freshTeam).not.toBeNull();
  });

  // 5. Template Protection & Built-in Immutability
  it('5. should prevent non-admins from modifying or deleting built-in templates', async () => {
    const user = await User.create({
      name: 'Standard User',
      email: 'standard@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });
    const token = createAuthToken(user);

    const builtInTemplate = await CustomTemplate.create({
      name: 'Official Esports Grid',
      customId: 'tmpl-official-1',
      imageUrl: 'https://res.cloudinary.com/test/image/upload/sample.png',
      alignment: { header: { x: 0, y: 0 } },
      isBuiltIn: true,
      isPublished: true,
    });

    // Attempt modification
    const resMod = await request(app)
      .put(`/api/templates/${builtInTemplate.customId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tampered Template' });
    expect(resMod.status).toBe(404);

    // Attempt deletion
    const resDel = await request(app)
      .delete(`/api/templates/${builtInTemplate.customId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resDel.status).toBe(404);

    const fresh = await CustomTemplate.findById(builtInTemplate._id);
    expect(fresh?.name).toBe('Official Esports Grid');
  });

  // 6. Real-Time Sync & Remote PIN Security
  it('6. should reject hardcoded 1234 PIN bypass and prevent unauthenticated state mutations', async () => {
    const tourId = 'tour-secure-pin-test';
    // Set custom PIN
    await updateAuthoritativeState(tourId, { pinCode: '8855' });

    // 1. Try 1234 bypass
    const resBypass = await request(app)
      .post('/api/sync/verify-pin')
      .send({ tournamentId: tourId, pin: '1234', deviceId: 'dev_attacker_1' });
    expect(resBypass.status).toBe(400);
    expect(resBypass.body.verified).toBeUndefined();

    // 2. Correct PIN succeeds
    const resCorrect = await request(app)
      .post('/api/sync/verify-pin')
      .send({ tournamentId: tourId, pin: '8855', deviceId: 'dev_legit_1' });
    expect(resCorrect.status).toBe(200);
    expect(resCorrect.body.verified).toBe(true);
    expect(resCorrect.body.sessionToken).toBeDefined();

    // 3. Information Disclosure check: unauthenticated GET /api/sync/state strips pinCode
    const resState = await request(app)
      .get(`/api/sync/state?tournamentId=${tourId}`);
    expect(resState.status).toBe(200);
    expect(resState.body.data.pinCode).toBeUndefined();
    // Connected device IP is stripped
    expect(resState.body.data.connectedDevices[0]?.ipAddress).toBeUndefined();

    // 4. Unauthenticated state overwrite rejected
    const resMutate = await request(app)
      .post('/api/sync/state')
      .send({ tournamentId: tourId, isVisible: false });
    expect(resMutate.status).toBe(403);
  });

  // 7. Input Security  Malicious SVG Upload Rejection
  it('7. should reject SVG media uploads containing executable scripts', async () => {
    const user = await User.create({
      name: 'Uploader',
      email: 'uploader@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });
    const token = createAuthToken(user);

    const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>';

    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from(maliciousSvg), {
        filename: 'malicious.svg',
        contentType: 'image/svg+xml',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('SVG contains forbidden scripts');
  });

  // 8. API Abuse & Batch Limit Verification
  it('8. should reject batch tournament imports exceeding 50 items', async () => {
    const user = await User.create({
      name: 'Batch Importer',
      email: 'importer@pointx.gg',
      passwordHash: 'dummy',
      status: 'active',
      role: 'organizer',
      isOnboarded: true,
    });
    const token = createAuthToken(user);

    const oversizedBatch = Array.from({ length: 51 }, (_, i) => ({
      title: `Tournament #${i + 1}`,
      game: 'Free Fire',
    }));

    const res = await request(app)
      .post('/api/tournaments/import')
      .set('Authorization', `Bearer ${token}`)
      .send({ tournaments: oversizedBatch });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Maximum 50 tournaments');
  });

  // 9. CORS Policy Verification
  it('9. should reject unauthorized cross-origin requests', async () => {
    const res = await request(app)
      .options('/api/tournaments')
      .set('Origin', 'https://evil-unauthorized-attacker.xyz')
      .set('Access-Control-Request-Method', 'GET');

    // CORS middleware rejects untrusted origin
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  // 10. Security Headers Verification
  it('10. should include security headers (Helmet CSP, nosniff, etc.) on responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

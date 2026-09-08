import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { CustomTemplate } from '../models/CustomTemplate';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let adminUser: any;
let orgAUser: any;
let orgBUser: any;
let adminToken: string;
let orgAToken: string;
let orgBToken: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';

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

  adminUser = await User.create({
    name: 'Super Admin',
    email: 'admin@pointx.gg',
    passwordHash: 'hashed_admin_123',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'PointX Governance',
  });
  adminToken = generateJwtToken(adminUser);

  orgAUser = await User.create({
    name: 'Org A Lead',
    email: 'leader@orga.gg',
    passwordHash: 'hashed_a_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Total Gaming Arena',
  });
  orgAToken = generateJwtToken(orgAUser);

  orgBUser = await User.create({
    name: 'Org B Lead',
    email: 'leader@orgb.gg',
    passwordHash: 'hashed_b_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'GodLike Esports Org',
  });
  orgBToken = generateJwtToken(orgBUser);
});

describe('Custom Organization Template Access Control & IDOR Prevention', () => {
  it('1. should allow Super Admin to create GLOBAL and ORGANIZATION_RESTRICTED templates', async () => {
    // Create GLOBAL template
    const globalRes = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Universal Free Fire Scoreboard',
        description: 'Available to everyone',
        imageUrl: 'https://cloudinary.com/global-tmpl.png',
        aspectRatio: '16:9',
        alignment: { baseY: 500 },
        visibility: 'GLOBAL',
        isBuiltIn: false,
      });

    expect(globalRes.status).toBe(201);
    expect(globalRes.body.success).toBe(true);
    expect(globalRes.body.data.visibility).toBe('GLOBAL');

    // Create RESTRICTED template for Org A
    const restrictedRes = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Total Gaming Exclusive Scoreboard',
        description: 'Custom artwork exclusively for TG',
        imageUrl: 'https://cloudinary.com/tg-private.png',
        aspectRatio: '16:9',
        alignment: { baseY: 520 },
        visibility: 'ORGANIZATION_RESTRICTED',
        allowedOrganizationIds: [orgAUser._id.toString(), 'Total Gaming Arena'],
      });

    expect(restrictedRes.status).toBe(201);
    expect(restrictedRes.body.success).toBe(true);
    expect(restrictedRes.body.data.visibility).toBe('ORGANIZATION_RESTRICTED');
    expect(restrictedRes.body.data.allowedOrganizationIds).toContain(orgAUser._id.toString());
  });

  it('2. should isolate restricted templates so Org A can view its private template while Org B cannot', async () => {
    // Template 1: Global
    await CustomTemplate.create({
      customId: 'tmpl-global-01',
      name: 'Global Public Template',
      imageUrl: 'https://img.com/global.png',
      alignment: {},
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    // Template 2: Restricted to Org A
    const tmplA = await CustomTemplate.create({
      customId: 'tmpl-orga-private-01',
      name: 'Org A Private Custom Scoreboard',
      imageUrl: 'https://img.com/orga.png',
      alignment: {},
      visibility: 'ORGANIZATION_RESTRICTED',
      allowedOrganizationIds: [orgAUser._id.toString()],
      isPublished: true,
      active: true,
    });

    // Org A requests template list
    const resA = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(resA.status).toBe(200);
    const tmplIdsA = resA.body.data.map((t: any) => t.id || t.customId);
    expect(tmplIdsA).toContain('tmpl-global-01');
    expect(tmplIdsA).toContain(tmplA.customId);

    // Org B requests template list
    const resB = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(resB.status).toBe(200);
    const tmplIdsB = resB.body.data.map((t: any) => t.id || t.customId);
    expect(tmplIdsB).toContain('tmpl-global-01');
    expect(tmplIdsB).not.toContain(tmplA.customId); // Strictly excluded!
  });

  it('3. should return 403 Forbidden when unauthorized organization attempts direct GET on private template (IDOR prevention)', async () => {
    const tmplA = await CustomTemplate.create({
      customId: 'tmpl-secret-org-a',
      name: 'Top Secret Org A Overlay',
      imageUrl: 'https://img.com/secret.png',
      alignment: {},
      visibility: 'ORGANIZATION_RESTRICTED',
      allowedOrganizationIds: [orgAUser._id.toString()],
      isPublished: true,
      active: true,
    });

    // Org B attempts direct access to Org A private template
    const resForbidden = await request(app)
      .get(`/api/templates/${tmplA.customId}`)
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(resForbidden.status).toBe(403);
    expect(resForbidden.body.success).toBe(false);
    expect(resForbidden.body.error).toContain('Forbidden: You do not have permission to access this organization template.');

    // Unauthenticated user attempts direct access
    const resUnauth = await request(app).get(`/api/templates/${tmplA.customId}`);
    expect(resUnauth.status).toBe(403);

    // Org A accesses its own private template
    const resAllowed = await request(app)
      .get(`/api/templates/${tmplA.customId}`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(resAllowed.status).toBe(200);
    expect(resAllowed.body.data.name).toBe('Top Secret Org A Overlay');
  });

  it('4. should allow Super Admin to query registered organizations for template access assignment', async () => {
    const res = await request(app)
      .get('/api/templates/organizations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const orgNames = res.body.data.map((o: any) => o.name);
    expect(orgNames).toContain('Total Gaming Arena');
    expect(orgNames).toContain('GodLike Esports Org');
  });

  it('5. should allow Super Admin to filter organizations by name and by email via search query', async () => {
    // Search by email
    const emailRes = await request(app)
      .get('/api/templates/organizations?q=leader@orga.gg')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(emailRes.status).toBe(200);
    expect(emailRes.body.success).toBe(true);
    expect(emailRes.body.data.length).toBe(1);
    expect(emailRes.body.data[0].email).toBe('leader@orga.gg');
    expect(emailRes.body.data[0].name).toBe('Total Gaming Arena');

    // Search by name (case insensitive partial match)
    const nameRes = await request(app)
      .get('/api/templates/organizations?q=godlike')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(nameRes.status).toBe(200);
    expect(nameRes.body.success).toBe(true);
    expect(nameRes.body.data.length).toBe(1);
    expect(nameRes.body.data[0].email).toBe('leader@orgb.gg');
    expect(nameRes.body.data[0].name).toBe('GodLike Esports Org');

    // Search with no matches
    const noneRes = await request(app)
      .get('/api/templates/organizations?q=nonexistent-org@nobody.com')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(noneRes.status).toBe(200);
    expect(noneRes.body.success).toBe(true);
    expect(noneRes.body.data.length).toBe(0);
  });
});


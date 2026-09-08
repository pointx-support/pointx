import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { normalizeTemplateType } from '../models/CustomTemplate';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  migrateExistingTemplates
} from '../services/templateService';
import { CustomTemplate } from '../models/CustomTemplate';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let adminUser: any;
let orgUser: any;
let adminToken: string;
let orgToken: string;

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

  orgUser = await User.create({
    name: 'Tournament Host',
    email: 'host@pointx.gg',
    passwordHash: 'hashed_host_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Host Org',
  });
  orgToken = generateJwtToken(orgUser);
});

describe('Backend Section-Specific Templates & Access Control', () => {
  describe('1. normalizeTemplateType Helper', () => {
    it('should map legacy and standard category strings accurately', () => {
      expect(normalizeTemplateType('POINTS_TABLE')).toBe('POINTS_TABLE');
      expect(normalizeTemplateType('standings')).toBe('POINTS_TABLE');
      expect(normalizeTemplateType('warheads')).toBe('KILL_LEADER');
      expect(normalizeTemplateType('fraggers')).toBe('TOP_FRAGGERS');
      expect(normalizeTemplateType('team-poster')).toBe('TEAM_POSTER');
      expect(normalizeTemplateType('slots-list')).toBe('SLOTS_LIST');
      expect(normalizeTemplateType('certificate')).toBe('VICTORY_CERTIFICATE');
      expect(normalizeTemplateType('unrecognized-cat')).toBe('NEEDS_REVIEW');
    });
  });

  describe('2. Template Creation with Section Type', () => {
    it('should create template with designated section type and index it', async () => {
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apex Kill Leader Poster',
          description: 'Single player warhead spotlight',
          templateType: 'KILL_LEADER',
          category: 'warheads',
          imageUrl: 'https://cloudinary.com/kill-leader.png',
          aspectRatio: '4:5',
          alignment: {},
          visibility: 'GLOBAL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.templateType).toBe('KILL_LEADER');

      const saved = await CustomTemplate.findOne({ templateType: 'KILL_LEADER' });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Apex Kill Leader Poster');
    });
  });

  describe('3. Section Mismatch Validation (Requirement 1 & 12)', () => {
    it('should return 400 Bad Request when requested section does not match template section', async () => {
      const created = await CustomTemplate.create({
        customId: 'tmpl-points-table-01',
        name: 'Standard Standings Table',
        imageUrl: 'https://img.com/pts.png',
        alignment: {},
        templateType: 'POINTS_TABLE',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
      });

      // Mismatched section request
      const mismatchRes = await request(app)
        .get(`/api/templates/${created.customId}?section=VICTORY_CERTIFICATE`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(mismatchRes.status).toBe(400);
      expect(mismatchRes.body.success).toBe(false);
      expect(mismatchRes.body.error).toContain('Template section mismatch');

      // Matching section request
      const matchRes = await request(app)
        .get(`/api/templates/${created.customId}?section=POINTS_TABLE`)
        .set('Authorization', `Bearer ${orgToken}`);

      expect(matchRes.status).toBe(200);
      expect(matchRes.body.success).toBe(true);
      expect(matchRes.body.data.customId).toBe('tmpl-points-table-01');
    });
  });

  describe('4. Section Filtering in Template List', () => {
    it('should filter templates by requested section', async () => {
      await CustomTemplate.create({
        customId: 'tmpl-kl-01',
        name: 'Warheads Graphic',
        imageUrl: 'https://img.com/kl.png',
        alignment: {},
        templateType: 'KILL_LEADER',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
      });

      await CustomTemplate.create({
        customId: 'tmpl-pt-01',
        name: 'Standings Graphic 1',
        imageUrl: 'https://img.com/pt1.png',
        alignment: {},
        templateType: 'POINTS_TABLE',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
      });

      await CustomTemplate.create({
        customId: 'tmpl-pt-02',
        name: 'Standings Graphic 2',
        imageUrl: 'https://img.com/pt2.png',
        alignment: {},
        templateType: 'POINTS_TABLE',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
      });

      const klRes = await request(app)
        .get('/api/templates?section=KILL_LEADER')
        .set('Authorization', `Bearer ${orgToken}`);

      expect(klRes.status).toBe(200);
      expect(klRes.body.data).toHaveLength(1);
      expect(klRes.body.data[0].templateType).toBe('KILL_LEADER');

      const ptRes = await request(app)
        .get('/api/templates?section=POINTS_TABLE')
        .set('Authorization', `Bearer ${orgToken}`);

      expect(ptRes.status).toBe(200);
      expect(ptRes.body.data).toHaveLength(2);
    });
  });

  describe('5. Database Migration for Legacy Templates', () => {
    it('should migrate legacy records without deleting data', async () => {
      await CustomTemplate.collection.insertOne({
        customId: 'legacy-warhead',
        name: 'Legacy Warhead',
        imageUrl: 'https://img.com/leg.png',
        alignment: {},
        category: 'warheads',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await CustomTemplate.collection.insertOne({
        customId: 'legacy-unknown',
        name: 'Unclassified Design',
        imageUrl: 'https://img.com/unk.png',
        alignment: {},
        category: 'mystery-box',
        visibility: 'GLOBAL',
        isPublished: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const migrationResult = await migrateExistingTemplates();
      expect(migrationResult.migrated).toBe(1);
      expect(migrationResult.needsReview).toBe(1);

      const updatedWarhead = await CustomTemplate.findOne({ customId: 'legacy-warhead' });
      expect(updatedWarhead?.templateType).toBe('KILL_LEADER');

      const updatedUnknown = await CustomTemplate.findOne({ customId: 'legacy-unknown' });
      expect(updatedUnknown?.templateType).toBe('NEEDS_REVIEW');
    });
  });
});

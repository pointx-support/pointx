import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { CustomTemplate } from '../models/CustomTemplate';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let admin1User: any;
let admin1Token: string;
let admin2User: any;
let admin2Token: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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

  admin1User = await User.create({
    name: 'Super Admin 1',
    email: 'admin1@pointx.esports',
    passwordHash: 'hashed_admin1',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });
  admin1Token = generateJwtToken(admin1User);

  admin2User = await User.create({
    name: 'Super Admin 2',
    email: 'admin2@pointx.esports',
    passwordHash: 'hashed_admin2',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });
  admin2Token = generateJwtToken(admin2User);
});

describe('Multi-Admin Template Publish/Unpublish Synchronization', () => {
  it('Admin 2 unpublishes a built-in template, persisting to MongoDB and visible to Admin 1', async () => {
    const builtinId = 'builtin-standings-1';

    // Admin 2 sends PUT /api/templates/:id with isPublished: false
    const updateRes = await request(app)
      .put(`/api/templates/${builtinId}`)
      .set('Authorization', `Bearer ${admin2Token}`)
      .send({
        isPublished: false,
        name: 'Official Free Fire Points Table',
        category: 'standings',
        templateType: 'POINTS_TABLE',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.isPublished).toBe(false);

    // Verify MongoDB document was upserted
    const docInDb = await CustomTemplate.findOne({ customId: builtinId });
    expect(docInDb).not.toBeNull();
    expect(docInDb?.isPublished).toBe(false);

    // Admin 1 queries GET /api/templates and sees the updated isPublished status
    const admin1GetRes = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(admin1GetRes.status).toBe(200);
    expect(admin1GetRes.body.success).toBe(true);
    const foundTmpl = admin1GetRes.body.data.find((t: any) => t.id === builtinId || t.customId === builtinId);
    expect(foundTmpl).toBeDefined();
    expect(foundTmpl.isPublished).toBe(false);
  });

  it('Admin 2 publishes an existing custom template, persisting to MongoDB and visible to Admin 1', async () => {
    // Create an initially unpublished custom template in MongoDB
    const custom = await CustomTemplate.create({
      customId: 'custom-tmpl-test-1',
      name: 'Custom Warhead Graphic',
      imageUrl: 'https://example.com/banner.png',
      aspectRatio: '16:9',
      alignment: {},
      isBuiltIn: false,
      isPublished: false,
      visibility: 'GLOBAL',
      active: true,
      version: 1,
      templateType: 'KILL_LEADER',
    });

    // Admin 2 publishes it
    const updateRes = await request(app)
      .put(`/api/templates/${custom.customId}`)
      .set('Authorization', `Bearer ${admin2Token}`)
      .send({
        isPublished: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.isPublished).toBe(true);

    // Admin 1 queries GET /api/templates and sees it as published
    const admin1GetRes = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${admin1Token}`);

    expect(admin1GetRes.status).toBe(200);
    const foundTmpl = admin1GetRes.body.data.find((t: any) => t.id === custom.customId || t.customId === custom.customId);
    expect(foundTmpl).toBeDefined();
    expect(foundTmpl.isPublished).toBe(true);
  });
});

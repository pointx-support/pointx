import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let testUser: any;
let userToken: string;
let testOrg: any;

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

  testUser = await User.create({
    name: 'Zero State Operator',
    email: 'zerostate@pointx.gg',
    passwordHash: 'hash',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Zero State Esports Org',
  });

  testOrg = await Organization.create({
    name: 'Zero State Esports Org',
    slug: 'org-zero-123',
    ownerId: testUser._id,
  });

  testUser.primaryOrganizationId = testOrg._id;
  await testUser.save();

  await OrganizationMembership.create({
    userId: testUser._id,
    organizationId: testOrg._id.toString(),
    role: 'owner',
    isActive: true,
  });

  userToken = generateJwtToken(testUser);
});

describe('PART 1: Match Zero-State & Explicit Match Creation', () => {
  it('creates tournament with 0 matches by default and stays at 0', async () => {
    const res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Zero State Championship',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: testOrg._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matches).toHaveLength(0);

    // Verify in MongoDB
    const persisted = await Tournament.findOne({
      $or: [{ customId: res.body.data.id }, { customId: res.body.data.customId }],
    });
    expect(persisted).toBeDefined();
    expect(persisted!.matches).toHaveLength(0);
  });

  it('opening broadcast session on a 0-match tournament does NOT create or resurrect a match', async () => {
    // 1. Create 0-match tournament
    const tourRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Empty Cup 2026',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: testOrg._id.toString(),
      });

    const tourId = tourRes.body.data.id || tourRes.body.data.customId;

    // 2. Initialize broadcast session
    const sessionRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tournamentId: tourId,
      });

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.success).toBe(true);
    expect(sessionRes.body.session.matchId).toBe('none');

    // 3. Confirm tournament STILL has 0 matches in database
    const refreshed = await Tournament.findOne({ customId: tourId });
    expect(refreshed).toBeDefined();
    expect(refreshed!.matches).toHaveLength(0);
  });

  it('allows explicit match creation via POST /api/tournaments/:id/matches with idempotency', async () => {
    const tourRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Idempotency Grand Prix',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: testOrg._id.toString(),
      });

    const tourId = tourRes.body.data.id || tourRes.body.data.customId;

    // 1. Explicitly create Match 1
    const idempotencyKey = 'client-uuid-match-1';
    const match1Res = await request(app)
      .post(`/api/tournaments/${tourId}/matches`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mapName: 'Bermuda',
        matchNumber: 1,
        idempotencyKey,
      });

    expect(match1Res.status).toBe(201);
    expect(match1Res.body.success).toBe(true);
    expect(match1Res.body.tournament.matches).toHaveLength(1);
    expect(match1Res.body.tournament.matches[0].matchNumber).toBe(1);

    // 2. Re-send identical request with same idempotencyKey (network retry simulation)
    const retryRes = await request(app)
      .post(`/api/tournaments/${tourId}/matches`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mapName: 'Bermuda',
        matchNumber: 1,
        idempotencyKey,
      });

    expect(retryRes.status).toBe(200); // 200 returned for idempotent hit
    expect(retryRes.body.tournament.matches).toHaveLength(1); // STILL 1 match, no duplicate!

    // 3. Delete match and verify deletion is permanent
    const matchId = match1Res.body.data.id;
    const deleteRes = await request(app)
      .delete(`/api/tournaments/${tourId}/matches/${matchId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.matches).toHaveLength(0);

    // Verify DB
    const finalTour = await Tournament.findOne({ customId: tourId });
    expect(finalTour!.matches).toHaveLength(0);
  });
});

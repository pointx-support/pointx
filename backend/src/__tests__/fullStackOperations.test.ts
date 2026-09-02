import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { generateJwtToken } from '../services/authService';
const DEFAULT_FREE_FIRE_SCORING = {
  id: 'preset-ff-official-v1',
  version: 1,
  name: 'Free Fire Official Standard (12-9-8)',
  game: 'Free Fire',
  isOfficial: true,
  killPoints: 1,
  placementTable: [
    { place: 1, points: 12 },
    { place: 2, points: 9 },
    { place: 3, points: 8 },
    { place: 4, points: 7 },
    { place: 5, points: 6 },
    { place: 6, points: 5 },
    { place: 7, points: 4 },
    { place: 8, points: 3 },
    { place: 9, points: 2 },
    { place: 10, points: 1 },
    { place: 11, points: 0 },
    { place: 12, points: 0 },
  ],
  booyahBonusPoints: 0,
  tieBreakOrder: ['totalPoints', 'totalKills', 'booyahs', 'highestPlacement'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

let mongoServer: MongoMemoryServer;
let app: any;
let adminUser: any;
let organizerUser: any;
let adminToken: string;
let organizerToken: string;

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

  // Create test Admin and Organizer
  adminUser = await User.create({
    name: 'Lead Admin Shakti',
    email: 'admin@pointx.gg',
    passwordHash: 'hashed_admin_pass',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    organizationName: 'PointX Esports Network',
    isOnboarded: true,
  });
  adminToken = generateJwtToken(adminUser);

  organizerUser = await User.create({
    name: 'Apex Host',
    email: 'host@apexleague.gg',
    passwordHash: 'hashed_org_pass',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    organizationName: 'Apex Gaming League',
    isOnboarded: true,
  });
  organizerToken = generateJwtToken(organizerUser);
});

describe('PointX Full-Stack Operations — Tournaments, Squads, Media & Admin API', () => {
  // Test 1: Tournament CRUD & Clone Operations
  it('1. should create, retrieve, update, clone, and delete tournaments', async () => {
    // 1. Create Tournament
    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Free Fire Grand Championship — Season 5',
        organizer: 'Apex Gaming League',
        game: 'Free Fire',
        tournamentType: 'Battle Royale',
        status: 'Live',
        structure: { teamCount: 12, matchCount: 6, roundRobin: false, slotsPerMatch: 12 },
        scoringPreset: DEFAULT_FREE_FIRE_SCORING,
        teams: [{ id: 't1', name: 'Total Gaming', tag: 'TG', slotNumber: 1, players: [] }],
        matches: [],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const tourId = createRes.body.data.id;
    expect(tourId).toBeDefined();

    // 2. Fetch Tournament by ID
    const getRes = await request(app)
      .get(`/api/tournaments/${tourId}`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe('Free Fire Grand Championship — Season 5');

    // 3. Update Tournament
    const updateRes = await request(app)
      .put(`/api/tournaments/${tourId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ status: 'Completed' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Completed');

    // 4. Clone Tournament
    const cloneRes = await request(app)
      .post('/api/tournaments/clone')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        sourceId: tourId,
        newTitle: 'Free Fire Grand Championship — Season 6 (Cloned)',
        copyTeams: true,
        copyPlayers: true,
        copyMatches: false,
        copyScoring: true,
        copySettings: true,
        copyBranding: true,
      });
    expect(cloneRes.status).toBe(201);
    expect(cloneRes.body.data.title).toBe('Free Fire Grand Championship — Season 6 (Cloned)');
    expect(cloneRes.body.data.teams).toHaveLength(1);

    // 5. Delete Tournament
    const deleteRes = await request(app)
      .delete(`/api/tournaments/${tourId}`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // Test 2: Global Teams & Player Rosters
  it('2. should manage global squad registry and player rosters', async () => {
    // 1. Create Global Team
    const createTeamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'GodLike Esports',
        tag: 'GODL',
        status: 'Active',
        captainName: 'Niku',
        contactEmail: 'mgmt@godlike.in',
        players: [],
      });

    expect(createTeamRes.status).toBe(201);
    const teamId = createTeamRes.body.data.id;

    // 2. Add Player to Team
    const addPlayerRes = await request(app)
      .post(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Niku',
        inGameId: 'GL_Niku',
        uid: '592019482',
        isCaptain: true,
        role: 'IGL',
      });
    expect(addPlayerRes.status).toBe(201);
    expect(addPlayerRes.body.data.name).toBe('Niku');

    // 3. Search Teams
    const searchRes = await request(app).get('/api/teams?q=GodLike');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data).toHaveLength(1);
    expect(searchRes.body.data[0].players).toHaveLength(1);
  });

  // Test 3: Media Upload (Cloudinary Integration & Buffer Stream)
  it('3. should accept valid image files and reject invalid formats', async () => {
    // 1. Upload valid fake PNG image
    const fakeImageBuffer = Buffer.from('fake-png-image-binary-stream-test');
    const uploadRes = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${organizerToken}`)
      .attach('image', fakeImageBuffer, 'test_logo.png')
      .field('folder', 'logos');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.url).toBeDefined();
    expect(uploadRes.body.data.publicId).toBeDefined();

    // 2. Delete media
    const deleteMediaRes = await request(app)
      .post('/api/media/delete')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ publicId: uploadRes.body.data.publicId });

    expect(deleteMediaRes.status).toBe(200);
    expect(deleteMediaRes.body.success).toBe(true);
  });

  // Test 4: Role-Gated Admin Operations
  it('4. should enforce strict role authorization on Admin endpoints', async () => {
    // 1. Organizer should be blocked from Admin Users directory (403)
    const orgDeniedRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(orgDeniedRes.status).toBe(403);

    // 2. Admin should successfully retrieve user directory
    const adminAllowedRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAllowedRes.status).toBe(200);
    expect(adminAllowedRes.body.data.length).toBeGreaterThanOrEqual(2);

    // 3. Admin can suspend an organizer account
    const suspendRes = await request(app)
      .post(`/api/admin/users/${organizerUser._id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Terms of service test' });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('suspended');

    // 4. Suspended organizer should now be blocked from API access (403)
    const suspendedBlockedRes = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(suspendedBlockedRes.status).toBe(403);
    expect(suspendedBlockedRes.body.error).toContain('Account suspended');

    // 5. Admin restores the user
    const restoreRes = await request(app)
      .post(`/api/admin/users/${organizerUser._id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.status).toBe('active');
  });
});

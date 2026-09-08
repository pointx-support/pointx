import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let organizerUser: any;
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

  organizerUser = await User.create({
    name: 'Sarah Organizer',
    email: 'sarah@esports.gg',
    passwordHash: 'hashed_password_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Sarah Esports Arena',
  });
  organizerToken = generateJwtToken(organizerUser);
});

describe('Edit Tournament Data Flow', () => {
  it('1. should fetch existing tournament by ID with all populated configuration fields', async () => {
    const tour = await Tournament.create({
      customId: 'tour-ff-summer-2026',
      userId: organizerUser._id,
      title: 'Free Fire Summer Championship 2026',
      organizer: 'Sarah Esports Arena',
      description: 'The premier national championship finals',
      game: 'Free Fire',
      tournamentType: 'Battle Royale',
      status: 'Upcoming',
      structure: {
        teamCount: 12,
        matchCount: 8,
        roundRobin: false,
        groupsCount: 1,
        slotsPerMatch: 12,
      },
      scoringPreset: {
        id: 'preset-ff-official-v1',
        name: 'Official Free Fire Scoring',
        version: 1,
        killPoints: 1,
        placementPoints: { '1': 12, '2': 9, '3': 8, '4': 7, '5': 6, '6': 5, '7': 4, '8': 3, '9': 2, '10': 1, '11': 0, '12': 0 },
        booyahBonus: 0,
        tieBreakers: ['total_points', 'total_booyahs', 'placement_points', 'kill_points'],
      },
      teams: [
        { id: 'team-1', name: 'Alpha Squad', tag: 'ALP' },
        { id: 'team-2', name: 'Bravo Warriors', tag: 'BRV' },
      ],
      matches: [],
    });

    // GET /api/tournaments/:id
    const res = await request(app)
      .get(`/api/tournaments/${tour.customId}`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Free Fire Summer Championship 2026');
    expect(res.body.data.organizer).toBe('Sarah Esports Arena');
    expect(res.body.data.description).toBe('The premier national championship finals');
    expect(res.body.data.status).toBe('Upcoming');
    expect(res.body.data.structure.matchCount).toBe(8);
    expect(res.body.data.structure.teamCount).toBe(12);
  });

  it('2. should atomically update tournament fields and persist to database upon save', async () => {
    const tour = await Tournament.create({
      customId: 'tour-ff-update-target',
      userId: organizerUser._id,
      title: 'Original Title',
      organizer: 'Original Host',
      description: 'Original Description',
      game: 'Free Fire',
      status: 'Upcoming',
      structure: { teamCount: 12, matchCount: 6, slotsPerMatch: 12 },
      teams: [],
      matches: [],
    });

    const updatePayload = {
      title: 'Updated Grand Finals 2026',
      organizer: 'Apex Global League',
      description: 'Updated Grand Finals Description',
      status: 'Live',
      tournamentType: 'League',
      structure: {
        teamCount: 12,
        matchCount: 10,
        roundRobin: true,
        groupsCount: 2,
        slotsPerMatch: 12,
      },
      scoringPreset: {
        id: 'preset-ff-aggressive-v1',
        name: 'Kill Heavy Aggressive',
        version: 1,
        killPoints: 2,
        placementPoints: { '1': 12, '2': 9, '3': 8 },
        booyahBonus: 2,
      },
    };

    // PUT /api/tournaments/:id
    const updateRes = await request(app)
      .put(`/api/tournaments/${tour.customId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(updatePayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe('Updated Grand Finals 2026');
    expect(updateRes.body.data.organizer).toBe('Apex Global League');
    expect(updateRes.body.data.status).toBe('Live');

    // Verify re-fetch returns the updated data
    const fetchRes = await request(app)
      .get(`/api/tournaments/${tour.customId}`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.title).toBe('Updated Grand Finals 2026');
    expect(fetchRes.body.data.organizer).toBe('Apex Global League');
    expect(fetchRes.body.data.description).toBe('Updated Grand Finals Description');
    expect(fetchRes.body.data.status).toBe('Live');
    expect(fetchRes.body.data.structure.matchCount).toBe(10);
  });

  it('3. should return 404 Tournament not found for invalid or non-existent ID and never return demo data', async () => {
    const res = await request(app)
      .get('/api/tournaments/non-existent-tour-99999')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Tournament not found.');
    expect(res.body.data).toBeUndefined();
  });
});

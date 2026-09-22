import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let organizerUser: any;
let organizerToken: string;

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

  organizerUser = await User.create({
    name: 'Real Organizer',
    email: 'organizer@esports.gg',
    passwordHash: 'hashed_password_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Real Esports Arena',
  });
  organizerToken = generateJwtToken(organizerUser);
});

describe('Organizer Tournament Creation and Refresh Flow', () => {
  it('creates tournament via POST /api/tournaments and verifies GET /api/tournaments returns it', async () => {
    // Exact payload sent by TournamentWizard in frontend
    const newTournamentPayload = {
      id: 'tour-test-12345',
      title: 'Free Fire Premier League 2026',
      organizer: 'Real Esports Arena',
      game: 'Free Fire',
      description: 'Championship for top squads',
      tournamentType: 'Battle Royale',
      status: 'Live',
      structure: {
        teamCount: 12,
        matchCount: 6,
        roundRobin: false,
        slotsPerMatch: 12,
      },
      scoringPreset: {
        id: 'preset-ff-official-v1',
        name: 'Official Free Fire Scoring',
        version: 1,
        game: 'Free Fire',
        killPoints: 1,
        placementTable: [
          { place: 1, points: 12 },
          { place: 2, points: 9 },
          { place: 3, points: 8 },
        ],
        booyahBonusPoints: 0,
        tieBreakOrder: ['totalPoints', 'booyahs'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      teams: [
        { id: 'team-1', name: 'Slot #1', tag: 'S1', slotNumber: 1, players: [] },
        { id: 'team-2', name: 'Slot #2', tag: 'S2', slotNumber: 2, players: [] },
      ],
      matches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const postRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(newTournamentPayload);

    console.log('POST /api/tournaments status:', postRes.status, postRes.body);
    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${organizerToken}`);

    console.log('GET /api/tournaments status:', getRes.status, getRes.body);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].title).toBe('Free Fire Premier League 2026');
  });
});

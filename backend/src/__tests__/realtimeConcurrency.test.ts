import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { generateJwtToken } from '../services/authService';
import {
  getOrCreateAuthoritativeState,
  updateAuthoritativeState,
  updateMatchScoreServer,
} from '../services/realtimeSync';

let mongoServer: MongoMemoryServer;
let app: any;
let testUser: any;
let authToken: string;

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

  testUser = await User.create({
    name: 'Esports Organizer',
    email: 'organizer@pointx.gg',
    passwordHash: 'hashed_password_123',
    role: 'organizer',
    isOnboarded: true,
  });

  authToken = generateJwtToken({
    _id: testUser._id.toString(),
    email: testUser.email,
    role: testUser.role,
    isOnboarded: true,
  });
});

describe('Realtime Concurrency & Authoritative Score Endpoint Suite', () => {
  it('should monotonically increment revision across sequential mutations', async () => {
    const tourId = 'tour-monotonic-test';
    const state0 = await getOrCreateAuthoritativeState(tourId);
    const initialRev = state0.revision;

    const state1 = await updateAuthoritativeState(tourId, { activeLayout: 'standings' });
    expect(state1.revision).toBe(initialRev + 1);

    const state2 = await updateAuthoritativeState(tourId, { themeHue: 280 });
    expect(state2.revision).toBe(initialRev + 2);
  });

  it('should update score via REST endpoint /api/tournaments/:id/matches/:matchId/score and calculate points authoritatively', async () => {
    const tour = await Tournament.create({
      customId: 'tour-api-score-test',
      userId: testUser._id,
      title: 'PointX API Score Tournament',
      game: 'Free Fire',
      matches: [
        {
          id: 'm100',
          matchNumber: 1,
          status: 'Live',
          results: [
            { teamId: 'team-a', placement: 12, kills: 0 },
            { teamId: 'team-b', placement: 12, kills: 0 },
          ],
        },
      ],
      teams: [
        { id: 'team-a', name: 'Alpha' },
        { id: 'team-b', name: 'Bravo' },
      ],
      scoringPreset: {
        id: 'preset-ff-official-v1',
        killPoints: 1,
        placementPoints: { '1': 12, '2': 9, '3': 8, '4': 7, '5': 6, '6': 5, '7': 4, '8': 3, '9': 2, '10': 1, '11': 0, '12': 0 },
        booyahBonus: 0,
      },
    });

    // Update score for team-a: +5 kills, placement 1 (Booyah)
    const res = await request(app)
      .post(`/api/tournaments/${tour.customId}/matches/m100/score`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        teamId: 'team-a',
        kills: 5,
        placement: 1,
        isBooyah: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.calculatedResult).toBeDefined();
    // 1st place = 12 pts, 5 kills = 5 pts => total = 17 pts
    expect(res.body.calculatedResult.placementPoints).toBe(12);
    expect(res.body.calculatedResult.killPoints).toBe(5);
    expect(res.body.calculatedResult.totalPoints).toBe(17);

    // Verify persisted tournament match results in database
    const updatedTour = await Tournament.findOne({ customId: tour.customId }).lean();
    const match = updatedTour!.matches.find((m: any) => m.id === 'm100');
    const teamAResult = match.results.find((r: any) => r.teamId === 'team-a');
    expect(teamAResult.kills).toBe(5);
    expect(teamAResult.placement).toBe(1);
    expect(teamAResult.totalPoints).toBe(17);
  });
});

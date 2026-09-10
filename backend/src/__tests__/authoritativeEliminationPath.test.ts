import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { createTournament } from '../services/tournamentService';
import { getOrCreateAuthoritativeState, updateMatchScoreServer } from '../services/realtimeSync';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let testOrganizer: any;
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

  testOrganizer = await User.create({
    name: 'Pro Organizer',
    email: 'organizer@pointx.gg',
    passwordHash: 'hashed_password_123',
    role: 'organizer',
    isOnboarded: true,
  });

  organizerToken = generateJwtToken(testOrganizer);
});

describe('Authoritative Elimination Path & Atomic Scoring Test Suite', () => {
  it('1. should atomically calculate kills, placement points, total points, and persist to MongoDB', async () => {
    const teams = [
      { id: 'team-real-1', name: 'Alpha Squad', tag: 'ALP' },
      { id: 'team-real-2', name: 'Beta Force', tag: 'BET' },
      { id: 'team-real-3', name: 'Gamma Esports', tag: 'GAM' },
    ];

    const tour = await createTournament(testOrganizer._id.toString(), {
      title: 'Free Fire Grand Championship',
      game: 'Free Fire',
      teams,
      scoringPreset: {
        id: 'preset-ff-official',
        name: 'Official Free Fire Scoring',
        version: 1,
        killPoints: 1,
        placementPoints: {
          1: 12,
          2: 9,
          3: 8,
          4: 7,
          5: 6,
          6: 5,
          7: 4,
          8: 3,
          9: 2,
          10: 1,
          11: 0,
          12: 0,
        },
      },
    });

    const tourId = tour.customId;

    // createTournament() does NOT auto-create matches — create Match 1 first
    const matchRes = await request(app)
      .post(`/api/tournaments/${tourId}/matches`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ mapName: 'Bermuda', idempotencyKey: 'test-atomic-m1' });
    expect(matchRes.status).toBe(201);
    const matchId: string = matchRes.body.data.id ?? matchRes.body.data._id;

    // Simulate Remote operator adding 4 kills and placement #1 (Booyah) to Alpha Squad
    const scoreResult = await updateMatchScoreServer(tourId, matchId, {
      teamId: 'team-real-1',
      kills: 4,
      placement: 1,
      isBooyah: true,
    });

    expect(scoreResult.calculatedResult).toBeDefined();
    expect(scoreResult.calculatedResult.kills).toBe(4);
    expect(scoreResult.calculatedResult.killPoints).toBe(4);
    expect(scoreResult.calculatedResult.placement).toBe(1);
    expect(scoreResult.calculatedResult.placementPoints).toBe(12);
    expect(scoreResult.calculatedResult.totalPoints).toBe(16); // 12 + 4
    expect(scoreResult.calculatedResult.booyah).toBe(true);

    // Verify MongoDB Atomic Commit
    const dbTour = await Tournament.findOne({ customId: tourId });
    expect(dbTour).toBeDefined();
    const dbMatch = dbTour!.matches.find((m: any) => m.id === matchId);
    expect(dbMatch).toBeDefined();
    const teamResult = dbMatch.results.find((r: any) => r.teamId === 'team-real-1');
    expect(teamResult).toBeDefined();
    expect(teamResult.kills).toBe(4);
    expect(teamResult.placementPoints).toBe(12);
    expect(teamResult.totalPoints).toBe(16);
    expect(teamResult.isBooyah).toBe(true);

    // Verify In-Memory Authoritative State
    const authState = await getOrCreateAuthoritativeState(tourId);
    const authMatch = authState.tournament?.matches?.find((m: any) => m.id === matchId);
    const authResult = authMatch?.results?.find((r: any) => r.teamId === 'team-real-1');
    expect(authResult?.kills).toBe(4);
    expect(authResult?.totalPoints).toBe(16);
  });

  it('2. should reject elimination score update for non-existent tournament with clear error', async () => {
    await expect(
      updateMatchScoreServer('tour-non-existent-99999', 'match-1', {
        teamId: 'team-real-1',
        kills: 1,
      })
    ).rejects.toThrow('not found');
  });

  it('3. should reject elimination score update for non-existent teamId in tournament', async () => {
    const tour = await createTournament(testOrganizer._id.toString(), {
      title: 'Solo Championship',
      teams: [{ id: 'team-valid-1', name: 'Valid Team' }],
    });

    // createTournament() does NOT auto-create matches — create Match 1 first
    const matchRes = await request(app)
      .post(`/api/tournaments/${tour.customId}/matches`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ mapName: 'Kalahari', idempotencyKey: 'test-invalid-team-m1' });
    expect(matchRes.status).toBe(201);
    const matchId: string = matchRes.body.data.id ?? matchRes.body.data._id;

    await expect(
      updateMatchScoreServer(tour.customId, matchId, {
        teamId: 'team-fake-unregistered-id',
        kills: 2,
      })
    ).rejects.toThrow('not found in tournament');
  });

  it('4. should process atomic score update via REST API endpoint /api/tournaments/:id/matches/:matchId/score', async () => {
    const tour = await createTournament(testOrganizer._id.toString(), {
      title: 'REST API Match Score Test',
      teams: [
        { id: 'team-test-a', name: 'Team Alpha' },
        { id: 'team-test-b', name: 'Team Bravo' },
      ],
    });

    const tourId = tour.customId;

    // createTournament() does NOT auto-create matches — create Match 1 first
    const matchCreateRes = await request(app)
      .post(`/api/tournaments/${tourId}/matches`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ mapName: 'Purgatory', idempotencyKey: 'test-rest-score-m1' });
    expect(matchCreateRes.status).toBe(201);
    const matchId: string = matchCreateRes.body.data.id ?? matchCreateRes.body.data._id;

    const res = await request(app)
      .post(`/api/tournaments/${tourId}/matches/${matchId}/score`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        teamId: 'team-test-b',
        kills: 6,
        placement: 2,
        isBooyah: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.calculatedResult).toBeDefined();
    expect(res.body.calculatedResult.kills).toBe(6);
    expect(res.body.calculatedResult.placement).toBe(2);

    // Verify in database
    const freshTour = await Tournament.findOne({ customId: tourId });
    const match = freshTour!.matches.find((m: any) => m.id === matchId);
    const bResult = match.results.find((r: any) => r.teamId === 'team-test-b');
    expect(bResult.kills).toBe(6);
  });
});

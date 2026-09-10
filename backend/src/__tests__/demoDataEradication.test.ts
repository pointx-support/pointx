import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { createTournament, getTournamentsByUser } from '../services/tournamentService';
import { getOrCreateAuthoritativeState } from '../services/realtimeSync';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let testUser: any;
let userToken: string;

const DEMO_IDS = ['tour-ff-champ-2026', 'tour-ff-night-scrims', 'tour-ff-summer-finals'];
const DEMO_TEAM_NAMES = ['Total Gaming Esports', 'Team Elite', 'Mafia', 'Killer', 'Galaxy Racer'];

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
    name: 'Real Organizer',
    email: 'real.organizer@pointx.gg',
    passwordHash: 'hashed_password_real',
    role: 'organizer',
    isOnboarded: true,
  });

  userToken = generateJwtToken(testUser);
});

describe('Demo Data Eradication & Strict Production Hygiene Test Suite', () => {
  it('1. should return exactly 0 tournaments for a new user and never inject demo tournaments', async () => {
    // Seed demo tournaments into MongoDB to verify they are NOT returned to regular users
    for (const demoId of DEMO_IDS) {
      await Tournament.create({
        customId: demoId,
        title: `Demo: ${demoId}`,
        userId: new mongoose.Types.ObjectId(),
        teams: [{ id: 'demo-t1', name: 'Total Gaming Esports' }],
      });
    }

    const userTournaments = await getTournamentsByUser(testUser._id.toString());
    expect(userTournaments.length).toBe(0);

    const res = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('2. should never contain demo teams in freshly created production tournament', async () => {
    const realTeams = [
      { id: 'team-phoenix-1', name: 'Phoenix Rising', tag: 'PHX' },
      { id: 'team-dragons-2', name: 'Dark Dragons', tag: 'DRG' },
    ];

    const tour = await createTournament(testUser._id.toString(), {
      title: 'City Invitational 2026',
      game: 'Free Fire',
      teams: realTeams,
    });

    const teamNames = tour.teams.map((t: any) => t.name);
    for (const demoName of DEMO_TEAM_NAMES) {
      expect(teamNames).not.toContain(demoName);
    }

    // Verify real team IDs are present and no demo team IDs snuck in
    expect(tour.teams.map((t: any) => t.id)).toEqual(['team-phoenix-1', 'team-dragons-2']);
  });

  it('3. should return 404 TOURNAMENT_NOT_FOUND for non-existent tournament and never fabricate demo teams', async () => {
    const res = await request(app)
      .get('/api/sync/state?tournamentId=tour-non-existent-sandbox-test');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('TOURNAMENT_NOT_FOUND');
  });

  it('4. should ensure authoritative state for a newly created tournament has no demo teams', async () => {
    const tour = await createTournament(testUser._id.toString(), {
      title: 'Empty Real Tournament',
      teams: [],
      matches: [],
    });

    const state = await getOrCreateAuthoritativeState(tour.customId);
    expect(state.tournament?.teams).toEqual([]);
    for (const demoName of DEMO_TEAM_NAMES) {
      expect(state.tournament?.teams?.map((t: any) => t.name)).not.toContain(demoName);
    }
  });
});

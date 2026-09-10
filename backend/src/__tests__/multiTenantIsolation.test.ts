import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { createTournament, getTournamentsByUser, getTournamentById, updateTournament } from '../services/tournamentService';
import { getOrCreateAuthoritativeState, updateMatchScoreServer } from '../services/realtimeSync';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let userA: any;
let userB: any;
let tokenA: string;
let tokenB: string;

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

  userA = await User.create({
    name: 'Organizer A',
    email: 'orgA@pointx.gg',
    passwordHash: 'hashed_password_A',
    role: 'organizer',
    isOnboarded: true,
  });

  userB = await User.create({
    name: 'Organizer B',
    email: 'orgB@pointx.gg',
    passwordHash: 'hashed_password_B',
    role: 'organizer',
    isOnboarded: true,
  });

  tokenA = generateJwtToken(userA);
  tokenB = generateJwtToken(userB);
});

describe('Multi-Tenant Tournament Isolation Test Suite', () => {
  it('1. should guarantee Organizer A only sees their own tournaments and never Organizer B', async () => {
    // Org A creates 2 tournaments
    await createTournament(userA._id.toString(), {
      title: 'Tournament A-1',
      teams: [{ id: 'team-a1', name: 'A1 Team' }],
    });
    await createTournament(userA._id.toString(), {
      title: 'Tournament A-2',
      teams: [{ id: 'team-a2', name: 'A2 Team' }],
    });

    // Org B creates 1 tournament
    await createTournament(userB._id.toString(), {
      title: 'Tournament B-1',
      teams: [{ id: 'team-b1', name: 'B1 Team' }],
    });

    // Check service layer isolation
    const listA = await getTournamentsByUser(userA._id.toString());
    const listB = await getTournamentsByUser(userB._id.toString());

    expect(listA.length).toBe(2);
    expect(listA.map((t) => t.title)).toContain('Tournament A-1');
    expect(listA.map((t) => t.title)).toContain('Tournament A-2');
    expect(listA.map((t) => t.title)).not.toContain('Tournament B-1');

    expect(listB.length).toBe(1);
    expect(listB[0].title).toBe('Tournament B-1');

    // Check REST API isolation
    const resA = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBe(2);
    expect(resA.body.data.some((t: any) => t.title === 'Tournament B-1')).toBe(false);

    const resB = await request(app)
      .get('/api/tournaments')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(1);
    expect(resB.body.data[0].title).toBe('Tournament B-1');
  });

  it('2. should prevent Organizer B from updating Organizer A tournament', async () => {
    const tourA = await createTournament(userA._id.toString(), {
      title: 'Protected Tour A',
      teams: [{ id: 'team-a', name: 'Team A' }],
    });

    // Organizer B attempts to update Tour A via REST
    const resForbidden = await request(app)
      .put(`/api/tournaments/${tourA.customId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked by B' });

    expect(resForbidden.status).toBe(404);

    // Verify title in DB did not change
    const fresh = await Tournament.findOne({ customId: tourA.customId });
    expect(fresh?.title).toBe('Protected Tour A');
  });

  it('3. should ensure authoritative sync states between Tournament A and B never collide', async () => {
    const tourA = await createTournament(userA._id.toString(), {
      title: 'Sync Tour A',
      teams: [{ id: 'team-a', name: 'Team A' }],
    });

    const tourB = await createTournament(userB._id.toString(), {
      title: 'Sync Tour B',
      teams: [{ id: 'team-b', name: 'Team B' }],
    });

    // Create Match 1 in each tournament (createTournament does not auto-create matches)
    const matchResA = await request(app)
      .post(`/api/tournaments/${tourA.customId}/matches`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ mapName: 'Map Alpha', idempotencyKey: 'sync-tour-a-m1' });
    expect(matchResA.status).toBe(201);
    const matchIdA: string = matchResA.body.data.id ?? matchResA.body.data._id;

    const matchResB = await request(app)
      .post(`/api/tournaments/${tourB.customId}/matches`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ mapName: 'Map Beta', idempotencyKey: 'sync-tour-b-m1' });
    expect(matchResB.status).toBe(201);
    const matchIdB: string = matchResB.body.data.id ?? matchResB.body.data._id;

    // Score update on Tour A — must NOT bleed into Tour B
    await updateMatchScoreServer(tourA.customId, matchIdA, {
      teamId: 'team-a',
      kills: 5,
    });

    const stateA = await getOrCreateAuthoritativeState(tourA.customId);
    const stateB = await getOrCreateAuthoritativeState(tourB.customId);

    // Tour A has 5 kills
    const matchA = stateA.tournament?.matches[0];
    expect(matchA?.results.find((r: any) => r.teamId === 'team-a')?.kills).toBe(5);

    // Tour B is completely unaffected
    const matchB = stateB.tournament?.matches[0];
    expect(matchB?.results.find((r: any) => r.teamId === 'team-b')?.kills).toBe(0);
    expect(stateB.tournament?.matches.some((m: any) => m.results.some((r: any) => r.teamId === 'team-a'))).toBe(false);

    // Sanity: Tour B's match is not Tour A's match
    expect(matchIdB).not.toBe(matchIdA);
  });
});

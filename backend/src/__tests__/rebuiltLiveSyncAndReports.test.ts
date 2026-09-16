import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { MatchReport } from '../models/MatchReport';
import { LiveStateStore } from '../services/liveStateStore';
import { generateJwtToken } from '../services/authService';
import { generateAndSaveMatchReport, getMatchReport, formatMatchReportCsv } from '../services/matchReportService';

let mongoServer: MongoMemoryServer;
let app: any;
let userA: any;
let tokenA: string;
let orgA: any;
let userB: any;
let tokenB: string;
let orgB: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-rebuilt-jwt-secret-xyz';

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

  // Seed Org A & User A
  userA = await User.create({
    name: 'Org A Admin',
    email: 'adminA@pointx.gg',
    passwordHash: 'hashA',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });

  orgA = await Organization.create({
    name: 'Organization Alpha',
    slug: 'org-alpha',
    ownerId: userA._id,
  });

  userA.primaryOrganizationId = orgA._id;
  await userA.save();

  await OrganizationMembership.create({
    userId: userA._id,
    organizationId: orgA._id.toString(),
    role: 'owner',
    isActive: true,
  });

  tokenA = generateJwtToken(userA);

  // Seed Org B & User B
  userB = await User.create({
    name: 'Org B Admin',
    email: 'adminB@pointx.gg',
    passwordHash: 'hashB',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });

  orgB = await Organization.create({
    name: 'Organization Beta',
    slug: 'org-beta',
    ownerId: userB._id,
  });

  userB.primaryOrganizationId = orgB._id;
  await userB.save();

  await OrganizationMembership.create({
    userId: userB._id,
    organizationId: orgB._id.toString(),
    role: 'owner',
    isActive: true,
  });

  tokenB = generateJwtToken(userB);
});

describe('REBUILT POINTX OBS + REMOTE + LIVE SYNC & REPORTS TEST SUITE', () => {
  it('TEST 1: Tournament with zero matches is valid — NO automatic match creation on any read', async () => {
    // 1. Create tournament
    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Zero Match Pro Invitational',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: orgA._id.toString(),
      });

    expect(createRes.status).toBe(201);
    const tourId = createRes.body.data.id || createRes.body.data.customId;
    expect(createRes.body.data.matches).toHaveLength(0);

    // 2. Fetch tournament via GET /api/tournaments/:id
    const fetchRes = await request(app)
      .get(`/api/tournaments/${tourId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.matches).toHaveLength(0);

    // 3. Request live sync state via GET /api/sync/state
    const syncRes = await request(app)
      .get(`/api/sync/state?tournamentId=${tourId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(syncRes.status).toBe(200);

    // 4. Check live state store: matchId must be 'none'
    const liveStore = LiveStateStore.getInstance();
    const liveState = await liveStore.getOrCreateLiveState(orgA._id.toString(), tourId, 'none');
    expect(liveState.matchId).toBe('none');
    expect(liveState.matchNumber).toBe(0);
    expect(Object.keys(liveState.teams)).toHaveLength(0);

    // 5. Verify database still has exactly 0 matches
    const tourDb = await Tournament.findOne({ customId: tourId });
    expect(tourDb!.matches).toHaveLength(0);
  });

  it('TEST 2 & 3: Explicit Match Creation & Deletion Consistency', async () => {
    // 1. Create tournament
    const createRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Bermuda Cup 2026',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: orgA._id.toString(),
      });
    const tourId = createRes.body.data.id || createRes.body.data.customId;

    // 2. Explicitly create Match 1
    const matchRes = await request(app)
      .post(`/api/tournaments/${tourId}/matches`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        mapName: 'Bermuda',
        matchNumber: 1,
      });

    expect(matchRes.status).toBe(201);
    expect(matchRes.body.tournament.matches).toHaveLength(1);
    const matchId = matchRes.body.data.id;

    // 3. Delete Match 1
    const delRes = await request(app)
      .delete(`/api/tournaments/${tourId}/matches/${matchId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.matches).toHaveLength(0);

    // 4. Re-fetch tournament: match remains deleted
    const reFetch = await request(app)
      .get(`/api/tournaments/${tourId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(reFetch.body.data.matches).toHaveLength(0);
  });

  it('TEST 5: Rapid 10 kills are atomic and monotonically increment revisions without lost actions', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_rapid_test';
    const matchId = 'm_rapid_10';

    const liveState = await store.getOrCreateLiveState(orgId, tourId, matchId);
    liveState.teams['team_k1'] = {
      teamId: 'team_k1',
      kills: 0,
      points: 0,
      placementPoints: 0,
      killPoints: 0,
      players: {
        'p1': { status: 'alive', updatedAt: Date.now() },
      },
      pointRushEnabled: false,
    };

    const initialRev = liveState.revision;

    for (let i = 1; i <= 10; i++) {
      const res = await store.applyCommand({
        commandId: `cmd_kill_step_${i}`,
        command: 'ADD_KILLS',
        organizationId: orgId,
        tournamentId: tourId,
        matchId,
        payload: { teamId: 'team_k1', delta: 1 },
      });

      expect(res.state.teams['team_k1'].kills).toBe(i);
      expect(res.state.revision).toBe(initialRev + i);
    }

    expect(liveState.teams['team_k1'].kills).toBe(10);
    expect(liveState.revision).toBe(initialRev + 10);
  });

  it('TEST 11: Duplicate command ID is rejected/idempotent (preventing duplicate kills)', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_idem_test';
    const matchId = 'm_idem_1';

    const liveState = await store.getOrCreateLiveState(orgId, tourId, matchId);
    liveState.teams['team_idem'] = {
      teamId: 'team_idem',
      kills: 5,
      points: 5,
      placementPoints: 0,
      killPoints: 5,
      players: {},
      pointRushEnabled: false,
    };

    const idempotentCommandId = 'unique-cmd-uuid-999';

    // First delivery
    const res1 = await store.applyCommand({
      commandId: idempotentCommandId,
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team_idem', delta: 1 },
    });
    expect(res1.state.teams['team_idem'].kills).toBe(6);

    // Duplicate delivery (e.g. network retry)
    const res2 = await store.applyCommand({
      commandId: idempotentCommandId,
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team_idem', delta: 1 },
    });

    // Kills must STILL be 6, NOT 7!
    expect(res2.state.teams['team_idem'].kills).toBe(6);
  });

  it('TEST 7: Table visibility toggles immediately in authoritative live state', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_vis_test';
    const matchId = 'm_vis_1';

    await store.getOrCreateLiveState(orgId, tourId, matchId);

    // Hide table
    const hideRes = await store.applyCommand({
      commandId: 'cmd_hide_table',
      command: 'SET_TABLE_VISIBILITY',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { visible: false },
    });
    expect(hideRes.state.tableVisible).toBe(false);
    expect(hideRes.patch.tableVisible).toBe(false);

    // Show table
    const showRes = await store.applyCommand({
      commandId: 'cmd_show_table',
      command: 'SET_TABLE_VISIBILITY',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { visible: true },
    });
    expect(showRes.state.tableVisible).toBe(true);
    expect(showRes.patch.tableVisible).toBe(true);
  });

  it('TEST 8: Fire mode: strictly ONE team has Fire with deterministic tie-breaker', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_fire_test';
    const matchId = 'm_fire_1';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams = {
      't1': {
        teamId: 't1',
        kills: 3,
        points: 3,
        placementPoints: 0,
        killPoints: 3,
        players: {},
        pointRushEnabled: false,
        lastKillTimestamp: 1000,
      },
      't2': {
        teamId: 't2',
        kills: 5,
        points: 5,
        placementPoints: 0,
        killPoints: 5,
        players: {},
        pointRushEnabled: false,
        lastKillTimestamp: 2000,
      },
      't3': {
        teamId: 't3',
        kills: 5,
        points: 5,
        placementPoints: 0,
        killPoints: 5,
        players: {},
        pointRushEnabled: false,
        lastKillTimestamp: 2500,
      },
    };

    // t2 and t3 are tied at 5 kills. t2 got the kill earlier (1000 vs 2500).
    const fireTeamId = store.calculateFireTeamId(state.teams);
    expect(fireTeamId).toBe('t2');

    // Add kill to t1 making it 6 kills
    await store.applyCommand({
      commandId: 'cmd_fire_lead',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 't1', delta: 3 }, // 3 + 3 = 6
    });

    expect(state.fireTeamId).toBe('t1');
  });

  it('TEST 9: Point Rush: configured threshold evaluated authoritatively', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_rush_test';
    const matchId = 'm_rush_1';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.pointRushThreshold = 20;

    state.teams['t_rush'] = {
      teamId: 't_rush',
      kills: 10,
      points: 10,
      placementPoints: 0,
      killPoints: 10,
      players: {},
      pointRushEnabled: false,
    };

    // 10 kills < 20 threshold
    expect(state.teams['t_rush'].pointRushEnabled).toBe(false);

    // Add 10 more kills -> total 20 points
    await store.applyCommand({
      commandId: 'cmd_rush_trigger',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 't_rush', delta: 10 },
    });

    expect(state.teams['t_rush'].points).toBe(20);
    expect(state.teams['t_rush'].pointRushEnabled).toBe(true);
  });

  it('TEST 14 & 16: Match finalization generates immutable versioned MatchReport with CSV export', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_rep_test';
    const matchId = 'm_final_rep';

    const liveState = await store.getOrCreateLiveState(orgId, tourId, matchId);
    liveState.teams = {
      't_champ': {
        teamId: 't_champ',
        name: 'Total Gaming',
        tag: 'TG',
        slotNumber: 1,
        kills: 12,
        points: 24,
        placementPoints: 12,
        killPoints: 12,
        placement: 1,
        isBooyah: true,
        players: {
          'p1': { status: 'alive', updatedAt: Date.now() },
        },
        pointRushEnabled: false,
      },
      't_runner': {
        teamId: 't_runner',
        name: 'Team Elite',
        tag: 'TE',
        slotNumber: 2,
        kills: 6,
        points: 15,
        placementPoints: 9,
        killPoints: 6,
        placement: 2,
        isBooyah: false,
        players: {
          'p2': { status: 'eliminated', updatedAt: Date.now() },
        },
        pointRushEnabled: false,
      },
    };
    liveState.eliminationOrder = ['t_runner'];

    // Finalize match in live state
    await store.applyCommand({
      commandId: 'cmd_finalize_1',
      command: 'FINALIZE_MATCH',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: {},
    });

    expect(liveState.isMatchFinished).toBe(true);
    expect(liveState.teams['t_champ'].isBooyah).toBe(true);

    // Generate Match Report
    const report = await generateAndSaveMatchReport(
      liveState,
      { customId: tourId, game: 'Free Fire' },
      userA
    );

    expect(report).toBeDefined();
    expect(report.reportId).toContain(`rep_${tourId}_${matchId}_v1`);
    expect(report.standings).toHaveLength(2);
    expect(report.standings[0].teamName).toBe('Total Gaming');
    expect(report.standings[0].isBooyah).toBe(true);
    expect(report.summary.totalEliminations).toBe(18);
    expect(report.summary.winningTeam.name).toBe('Total Gaming');

    // Test retrieval via GET /api/reports/:tourId/:matchId
    const repRes = await request(app).get(`/api/reports/${tourId}/${matchId}`);
    expect(repRes.status).toBe(200);
    expect(repRes.body.success).toBe(true);
    expect(repRes.body.data.reportId).toBe(report.reportId);

    // Test CSV export via GET /api/reports/:tourId/:matchId/export?format=csv
    const csvRes = await request(app).get(`/api/reports/${tourId}/${matchId}/export?format=csv`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('POINTX TOURNAMENT MATCH REPORT');
    expect(csvRes.text).toContain('Total Gaming');
    expect(csvRes.text).toContain('Team Elite');

    // Versioning test: generate second version
    const reportV2 = await generateAndSaveMatchReport(
      liveState,
      { customId: tourId, game: 'Free Fire' },
      userA
    );
    expect(reportV2.version).toBe(2);
    expect(reportV2.reportId).toContain(`_v2_`);
  });

  it('TEST 15: Multi-Tenant Isolation — Organization B cannot access Organization A live state', async () => {
    // 1. User A creates tournament in Org A
    const tourRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Org A Private Scrims',
        game: 'freefire',
        format: 'squad',
        totalTeams: 12,
        organizationId: orgA._id.toString(),
      });
    const tourIdA = tourRes.body.data.id || tourRes.body.data.customId;

    // 2. User B tries to fetch Org A tournament live state without permission -> 404 (multi-tenant invisible)
    const accessRes = await request(app)
      .get(`/api/sync/state?tournamentId=${tourIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(accessRes.status).toBe(404);
  });

  it('TEST 17: Measured Latency — Server processing and state mutation is sub-50ms', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = orgA._id.toString();
    const tourId = 'tour_latency_bench';
    const matchId = 'm_bench_1';

    await store.getOrCreateLiveState(orgId, tourId, matchId);

    const startTime = performance.now();

    const res = await store.applyCommand({
      commandId: 'cmd_latency_1',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 't1', delta: 1 },
      timestamp: Date.now(),
    });

    const elapsedMs = performance.now() - startTime;

    expect(res.state).toBeDefined();
    expect(elapsedMs).toBeLessThan(50); // Well under 50ms (target sub-1000ms)
    console.log(`⏱ Measured Live State Command Latency: ${elapsedMs.toFixed(2)}ms`);
  });
});

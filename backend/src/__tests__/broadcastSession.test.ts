import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { BroadcastSession } from '../models/BroadcastSession';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let organizerUser: any;
let organizerToken: string;
let testTournament: any;

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
    name: 'Operator Dan',
    email: 'dan@apexleague.gg',
    passwordHash: 'hashed_pw_123',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Apex Gaming Federation',
  });
  organizerToken = generateJwtToken(organizerUser);

  testTournament = await Tournament.create({
    customId: 'tour-apex-ff-2026',
    userId: organizerUser._id,
    title: 'Apex Free Fire Masters 2026',
    organizer: 'Apex Gaming Federation',
    game: 'Free Fire',
    status: 'Live',
    structure: { teamCount: 12, matchCount: 6, slotsPerMatch: 12 },
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
      { id: 'team-alpha', name: 'Alpha Squad', tag: 'ALP', slotNumber: 1 },
      { id: 'team-bravo', name: 'Bravo Titans', tag: 'BRV', slotNumber: 2 },
      { id: 'team-charlie', name: 'Charlie Elite', tag: 'CHR', slotNumber: 3 },
      { id: 'team-delta', name: 'Delta Force', tag: 'DLT', slotNumber: 4 },
    ],
    matches: [
      {
        id: 'match-apex-1',
        customId: 'match-apex-1',
        tournamentId: 'tour-apex-ff-2026',
        matchNumber: 1,
        customLabel: 'Match 01 — Bermuda',
        mapName: 'Bermuda',
        status: 'Live',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scoringConfigId: 'preset-ff-official-v1',
        scoringVersion: 1,
        results: [
          { teamId: 'team-alpha', kills: 0, placement: 1, placementPoints: 12, killPoints: 0, totalPoints: 12, isBooyah: true },
          { teamId: 'team-bravo', kills: 0, placement: 2, placementPoints: 9, killPoints: 0, totalPoints: 9, isBooyah: false },
          { teamId: 'team-charlie', kills: 0, placement: 3, placementPoints: 8, killPoints: 0, totalPoints: 8, isBooyah: false },
          { teamId: 'team-delta', kills: 0, placement: 4, placementPoints: 7, killPoints: 0, totalPoints: 7, isBooyah: false },
        ],
      },
    ],
  });
});

describe('Broadcast Session Engine & Authoritative Command System', () => {
  it('1. should create or retrieve a broadcast session with real database IDs and 0 demo bleed', async () => {
    const res = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.state).toBeDefined();
    expect(res.body.state.tournament.title).toBe('Apex Free Fire Masters 2026');
    expect(res.body.state.teams.length).toBe(4);
    expect(res.body.state.aliveSquadsCount).toBe(4);
    expect(res.body.state.teams[0].squadPlayers).toEqual(['alive', 'alive', 'alive', 'alive']);
  });

  it('2. should atomically process ADD_KILL, mutate MongoDB, and bump monotonic revision', async () => {
    // 1. Create session
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;
    const initialRev = initRes.body.state.revision;

    // 2. Dispatch ADD_KILL command on team-bravo
    const cmdRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'ADD_KILL',
        targetTeamId: 'team-bravo',
      });

    expect(cmdRes.status).toBe(200);
    expect(cmdRes.body.success).toBe(true);
    expect(cmdRes.body.revision).toBe(initialRev + 1);

    const bravo = cmdRes.body.state.teams.find((t: any) => t.teamId === 'team-bravo');
    expect(bravo.kills).toBe(1);
    expect(bravo.placementPoints).toBe(0); // Strictly 0 during live match!
    expect(bravo.totalPoints).toBe(1); // 0 placement + 1 kill live

    // Verify tournament on website has NOT prematurely added this live match results
    const freshTour = await Tournament.findOne({ customId: testTournament.customId });
    const match = freshTour!.matches.find((m: any) => m.id === 'match-apex-1');
    expect(match.status).not.toBe('Completed');
  });

  it('3. should handle rapid sequential kills without losing updates or race conditions', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Perform 5 rapid consecutive +1 kills
    for (let i = 1; i <= 5; i++) {
      const res = await request(app)
        .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
          commandType: 'ADD_KILL',
          targetTeamId: 'team-charlie',
        });
      expect(res.status).toBe(200);
    }

    const stateRes = await request(app).get(`/api/broadcast/sessions/${sessionId}`);
    expect(stateRes.status).toBe(200);
    const charlie = stateRes.body.state.teams.find((t: any) => t.teamId === 'team-charlie');
    expect(charlie.kills).toBe(5);
    expect(charlie.placementPoints).toBe(0); // Deferred during live match
    expect(charlie.totalPoints).toBe(5); // 5 kills, 0 placement
  });

  it('4. should decrement kills atomically via REMOVE_KILL but never drop below 0', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Add 2 kills
    await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'ADD_KILL', targetTeamId: 'team-delta' });
    await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'ADD_KILL', targetTeamId: 'team-delta' });

    // Remove 1 kill
    const removeRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'REMOVE_KILL', targetTeamId: 'team-delta' });

    const delta = removeRes.body.state.teams.find((t: any) => t.teamId === 'team-delta');
    expect(delta.kills).toBe(1);

    // Remove 3 kills (should clamp to 0)
    await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'REMOVE_KILL', targetTeamId: 'team-delta' });
    const clampedRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'REMOVE_KILL', targetTeamId: 'team-delta' });

    const deltaClamped = clampedRes.body.state.teams.find((t: any) => t.teamId === 'team-delta');
    expect(deltaClamped.kills).toBe(0);
  });

  it('5. should update individual player status and wipe/revive squads cleanly', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Knock Player 1 (index 0)
    const knockRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'SET_PLAYER_STATUS',
        targetTeamId: 'team-alpha',
        payload: { playerIndex: 0, status: 'knock' },
      });

    const alphaKnock = knockRes.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alphaKnock.squadPlayers[0]).toBe('knock');
    expect(alphaKnock.isWiped).toBe(false);

    // Wipe Squad
    const wipeRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'WIPE_SQUAD',
        targetTeamId: 'team-alpha',
      });

    const alphaWiped = wipeRes.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alphaWiped.squadPlayers).toEqual(['eliminated', 'eliminated', 'eliminated', 'eliminated']);
    expect(alphaWiped.isWiped).toBe(true);
    expect(wipeRes.body.state.aliveSquadsCount).toBe(3); // 1 squad eliminated!

    // Revive Squad
    const reviveRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'REVIVE_SQUAD',
        targetTeamId: 'team-alpha',
      });

    const alphaRevived = reviveRes.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alphaRevived.squadPlayers).toEqual(['alive', 'alive', 'alive', 'alive']);
    expect(alphaRevived.isWiped).toBe(false);
    expect(reviveRes.body.state.aliveSquadsCount).toBe(4);
  });

  it('6. should execute broadcast modes, table visibility, and +1 Pt All Teams', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Toggle Table Visibility
    const hideRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'SET_TABLE_VISIBILITY',
        payload: { visible: false },
      });
    expect(hideRes.body.state.tableVisible).toBe(false);

    // Set Mode to FIRE on team-bravo
    const fireRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'SET_MODE',
        targetTeamId: 'team-bravo',
        payload: { mode: 'FIRE' },
      });
    expect(fireRes.body.state.activeMode).toBe('FIRE');
    expect(fireRes.body.state.fireTeamIds).toContain('team-bravo');

    // Add +1 Point to All Teams
    const ptsRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'ADD_POINT_ALL_TEAMS' });

    // Each team gets +1 bonus point
    const teams = ptsRes.body.state.teams;
    const a = teams.find((t: any) => t.teamId === 'team-alpha');
    const b = teams.find((t: any) => t.teamId === 'team-bravo');
    expect(a.totalPoints).toBeGreaterThanOrEqual(1);
    expect(b.totalPoints).toBeGreaterThanOrEqual(1);
  });

  it('7. should calculate placement points when match finishes and publish verified report to website', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // 1. Wipe team-charlie (will finish 3rd/4th)
    await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'WIPE_SQUAD', targetTeamId: 'team-charlie' });

    // 2. Add 3 kills to team-alpha
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'ADD_KILL', targetTeamId: 'team-alpha' });
    }

    // While live: alpha has 3 kills, 0 placement points
    const liveState = await request(app).get(`/api/broadcast/sessions/${sessionId}`);
    const liveAlpha = liveState.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(liveAlpha.kills).toBe(3);
    expect(liveAlpha.placementPoints).toBe(0);
    expect(liveAlpha.totalPoints).toBe(3);

    // Verify wiped squad has placement points awarded immediately
    const liveCharlie = liveState.body.state.teams.find((t: any) => t.teamId === 'team-charlie');
    expect(liveCharlie.isWiped).toBe(true);
    expect(liveCharlie.placement).toBe(4);
    expect(liveCharlie.placementPoints).toBe(7); // 4th place points awarded immediately upon wipe!

    // 3. Finish match
    const finishRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'FINISH_MATCH' });
    expect(finishRes.status).toBe(200);
    expect(finishRes.body.state.isMatchFinished).toBe(true);

    const finishedAlpha = finishRes.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(finishedAlpha.placementPoints).toBeGreaterThan(0); // Now placement points are added!
    expect(finishedAlpha.totalPoints).toBe(finishedAlpha.placementPoints + finishedAlpha.killPoints);

    // 4. Submit match report to website
    const submitRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/submit-report`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({});
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.state.isSubmittedToWebsite).toBe(true);

    // 5. Verify official tournament match in MongoDB is now Completed
    const freshTour = await Tournament.findOne({ customId: testTournament.customId });
    const match = freshTour!.matches.find((m: any) => m.id === 'match-apex-1');
    expect(match.status).toBe('Completed');
    expect(match.results.length).toBeGreaterThan(0);
  });

  it('8. should support rapid coalesced kill commands with delta', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Send coalesced +6 kills in one atomic command
    const resAdd = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'ADD_KILL',
        targetTeamId: 'team-alpha',
        payload: { delta: 6 },
      });

    expect(resAdd.status).toBe(200);
    expect(resAdd.body.success).toBe(true);
    expect(resAdd.body.delta).toBe(6);
    expect(resAdd.body.kills).toBe(6);

    const alpha = resAdd.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alpha.kills).toBe(6);

    // Send coalesced -2 kills
    const resRemove = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandType: 'REMOVE_KILL',
        targetTeamId: 'team-alpha',
        payload: { delta: 2 },
      });

    expect(resRemove.status).toBe(200);
    expect(resRemove.body.kills).toBe(4);
    const alphaAfter = resRemove.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alphaAfter.kills).toBe(4);
  });

  it('9. should ensure command idempotency using commandId', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;
    const commandId = 'cmd-idempotency-test-xyz';

    // First execution
    const res1 = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandId,
        commandType: 'ADD_KILL',
        targetTeamId: 'team-bravo',
        payload: { delta: 3 },
      });

    expect(res1.status).toBe(200);
    expect(res1.body.kills).toBe(3);
    const rev1 = res1.body.revision;

    // Duplicate execution with identical commandId
    const res2 = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        commandId,
        commandType: 'ADD_KILL',
        targetTeamId: 'team-bravo',
        payload: { delta: 3 },
      });

    expect(res2.status).toBe(200);
    expect(res2.body.revision).toBe(rev1); // Unchanged revision!
    expect(res2.body.kills).toBe(3); // Not 6! Idempotent deduplication succeeded
  });

  it('10. should correctly calculate 12-team elimination sequence placement points immediately', async () => {
    // Create a realistic 12-team tournament
    const twelveTeams = Array.from({ length: 12 }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Squad ${i + 1}`,
      tag: `SQ${i + 1}`,
      slotNumber: i + 1,
    }));

    const twelveTour = await Tournament.create({
      customId: 'tour-12-squad-ff',
      userId: organizerUser._id,
      title: 'Free Fire 12 Squad Cup',
      organizer: 'Apex Gaming Federation',
      game: 'Free Fire',
      status: 'Live',
      structure: { teamCount: 12, matchCount: 1, slotsPerMatch: 12 },
      scoringPreset: {
        id: 'preset-ff-official-v1',
        name: 'Official Free Fire Scoring',
        version: 1,
        killPoints: 1,
        placementPoints: {
          '1': 12,
          '2': 9,
          '3': 8,
          '4': 7,
          '5': 6,
          '6': 5,
          '7': 4,
          '8': 3,
          '9': 2,
          '10': 1,
          '11': 0,
          '12': 0,
        },
        booyahBonus: 0,
        tieBreakers: ['total_points', 'total_booyahs', 'placement_points', 'kill_points'],
      },
      teams: twelveTeams,
      matches: [
        {
          id: 'match-12-1',
          customId: 'match-12-1',
          tournamentId: 'tour-12-squad-ff',
          matchNumber: 1,
          status: 'Live',
          results: [],
        },
      ],
    });

    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: twelveTour.customId });

    const sessionId = initRes.body.sessionId;

    // Expected placement and points mapping for elimination order 1..11
    const expectedScoring = [
      { teamId: 'team-1', expectedPlacement: 12, expectedPoints: 0 },
      { teamId: 'team-2', expectedPlacement: 11, expectedPoints: 0 },
      { teamId: 'team-3', expectedPlacement: 10, expectedPoints: 1 },
      { teamId: 'team-4', expectedPlacement: 9, expectedPoints: 2 },
      { teamId: 'team-5', expectedPlacement: 8, expectedPoints: 3 },
      { teamId: 'team-6', expectedPlacement: 7, expectedPoints: 4 },
      { teamId: 'team-7', expectedPlacement: 6, expectedPoints: 5 },
      { teamId: 'team-8', expectedPlacement: 5, expectedPoints: 6 },
      { teamId: 'team-9', expectedPlacement: 4, expectedPoints: 7 },
      { teamId: 'team-10', expectedPlacement: 3, expectedPoints: 8 },
      { teamId: 'team-11', expectedPlacement: 2, expectedPoints: 9 },
    ];

    // Wipe squads one by one
    for (const exp of expectedScoring) {
      const wipeRes = await request(app)
        .post(`/api/broadcast/sessions/${sessionId}/commands`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ commandType: 'WIPE_SQUAD', targetTeamId: exp.teamId });

      expect(wipeRes.status).toBe(200);

      const wipedTeam = wipeRes.body.state.teams.find((t: any) => t.teamId === exp.teamId);
      expect(wipedTeam.isWiped).toBe(true);
      expect(wipedTeam.placement).toBe(exp.expectedPlacement);
      expect(wipedTeam.placementPoints).toBe(exp.expectedPoints);
      expect(wipedTeam.totalPoints).toBe(exp.expectedPoints); // 0 kills + placement points
    }

    // Attempt double wipe on team-1 to verify it does not corrupt elimination order
    await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/commands`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ commandType: 'WIPE_SQUAD', targetTeamId: 'team-1' });

    const finalStateRes = await request(app).get(`/api/broadcast/sessions/${sessionId}`);
    const state = finalStateRes.body.state;

    // Verify team-1 is still 12th place (not moved to the end)
    const team1 = state.teams.find((t: any) => t.teamId === 'team-1');
    expect(team1.placement).toBe(12);

    // Verify last surviving team (team-12) has automatically achieved Booyah (1st place, 12 pts)
    const team12 = state.teams.find((t: any) => t.teamId === 'team-12');
    expect(team12.isWiped).toBe(false);
    expect(team12.isBooyah).toBe(true);
    expect(team12.placement).toBe(1);
    expect(team12.placementPoints).toBe(12);
    expect(team12.totalPoints).toBe(12);

    // Verify official website results are still untouched until submit-report is called
    const tourBeforeSubmit = await Tournament.findOne({ customId: twelveTour.customId });
    expect(tourBeforeSubmit!.matches[0].status).not.toBe('Completed');
    expect(tourBeforeSubmit!.matches[0].results.length).toBe(0);

    // Submit match report
    const submitRes = await request(app)
      .post(`/api/broadcast/sessions/${sessionId}/submit-report`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({});

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);

    const tourAfterSubmit = await Tournament.findOne({ customId: twelveTour.customId });
    expect(tourAfterSubmit!.matches[0].status).toBe('Completed');
    expect(tourAfterSubmit!.matches[0].results.length).toBe(12);
  });

  it('11. should handle concurrent commands without lost updates', async () => {
    const initRes = await request(app)
      .post('/api/broadcast/sessions')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ tournamentId: testTournament.customId });

    const sessionId = initRes.body.sessionId;

    // Fire 6 concurrent kill commands simultaneously
    const promises = Array.from({ length: 6 }, (_, i) =>
      request(app)
        .post(`/api/broadcast/sessions/${sessionId}/commands`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          commandType: 'ADD_KILL',
          targetTeamId: 'team-alpha',
          payload: { commandId: `concurrent-cmd-${i}` },
        })
    );

    const results = await Promise.all(promises);
    results.forEach((r) => expect(r.status).toBe(200));

    const finalState = await request(app).get(`/api/broadcast/sessions/${sessionId}`);
    const alpha = finalState.body.state.teams.find((t: any) => t.teamId === 'team-alpha');
    expect(alpha.kills).toBe(6);
  });
});

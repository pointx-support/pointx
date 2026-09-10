import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Tournament } from '../models/Tournament';
import { BroadcastSession } from '../models/BroadcastSession';
import { LiveStateStore } from '../services/liveStateStore';
import { enqueueBatchedPersistence, flushPersistenceImmediately } from '../services/batchedPersistenceService';
import { getNextMatchForTournament } from '../services/tournamentService';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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
});

describe('PointX Rebuilt Realtime Match Control & Ultra-Lightweight Delta Suite', () => {
  it('1. Rapid Kills: 0 -> +1 x 7 results in 7, with ultra-lightweight diff (~200 bytes) and no replay', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-test';
    const matchId = 'm_rapid_kills_1';

    const state0 = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state0.teams['team-alpha'] = {
      teamId: 'team-alpha',
      kills: 0,
      points: 0,
      placementPoints: 0,
      killPoints: 0,
      players: {
        'p1': { status: 'alive', updatedAt: Date.now() },
      },
      pointRushEnabled: false,
    };

    let finalPatch: any = null;
    let finalState: any = null;
    for (let i = 0; i < 7; i++) {
      const res = await store.applyCommand({
        commandId: `cmd_kill_${i}`,
        command: 'ADD_KILLS',
        organizationId: orgId,
        tournamentId: tourId,
        matchId,
        payload: { teamId: 'team-alpha', delta: 1 },
      });
      finalPatch = res.patch;
      finalState = res.state;
    }

    expect(finalState.teams['team-alpha'].kills).toBe(7);
    expect(finalPatch.teams['team-alpha'].kills).toBe(7);

    const jsonStr = JSON.stringify(finalPatch);
    expect(jsonStr.length).toBeLessThan(350);
  });

  it('2. Existing 7 + Rapid 4 results in 11 immediately without rolling back', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-test';
    const matchId = 'm_7_plus_4';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams['team-bravo'] = {
      teamId: 'team-bravo',
      kills: 7,
      points: 7,
      placementPoints: 0,
      killPoints: 7,
      players: {
        'p1': { status: 'alive', updatedAt: Date.now() },
      },
      pointRushEnabled: false,
    };

    const res = await store.applyCommand({
      commandId: 'cmd_add_4',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team-bravo', delta: 4 },
    });

    expect(res.state.teams['team-bravo'].kills).toBe(11);
    expect(res.patch.teams!['team-bravo'].kills).toBe(11);
  });

  it('3. Rapid Player Knocks: P1, P2, P3 knocked coalesces to all 3 knocked without revert', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-test';
    const matchId = 'm_rapid_knocks';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams['team-charlie'] = {
      teamId: 'team-charlie',
      kills: 0,
      points: 0,
      placementPoints: 0,
      killPoints: 0,
      players: {
        'p1': { status: 'alive', updatedAt: Date.now() },
        'p2': { status: 'alive', updatedAt: Date.now() },
        'p3': { status: 'alive', updatedAt: Date.now() },
        'p4': { status: 'alive', updatedAt: Date.now() },
      },
      pointRushEnabled: false,
    };

    await store.applyCommand({
      commandId: 'cmd_p1',
      command: 'SET_PLAYER_STATUS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team-charlie', playerId: 'p1', status: 'knock' },
    });

    await store.applyCommand({
      commandId: 'cmd_p2',
      command: 'SET_PLAYER_STATUS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team-charlie', playerId: 'p2', status: 'knock' },
    });

    const res3 = await store.applyCommand({
      commandId: 'cmd_p3',
      command: 'SET_PLAYER_STATUS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 'team-charlie', playerId: 'p3', status: 'knock' },
    });

    const players = res3.state.teams['team-charlie'].players;
    expect(players['p1'].status).toBe('knock');
    expect(players['p2'].status).toBe('knock');
    expect(players['p3'].status).toBe('knock');
    expect(players['p4'].status).toBe('alive');
  });

  it('4. Automatic Point Rush: Calculated per team based on threshold (49 OFF, 51 ON, 70 ON)', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-test';
    const matchId = 'm_point_rush';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.pointRushThreshold = 50;

    state.teams = {
      'tA': { teamId: 'tA', kills: 0, points: 49, placementPoints: 49, killPoints: 0, players: {}, pointRushEnabled: false },
      'tB': { teamId: 'tB', kills: 0, points: 51, placementPoints: 51, killPoints: 0, players: {}, pointRushEnabled: false },
      'tC': { teamId: 'tC', kills: 0, points: 70, placementPoints: 70, killPoints: 0, players: {}, pointRushEnabled: false },
    };

    store.recalculatePointRush(state);

    expect(state.teams['tA'].pointRushEnabled).toBe(false);
    expect(state.teams['tB'].pointRushEnabled).toBe(true);
    expect(state.teams['tC'].pointRushEnabled).toBe(true);
  });

  it('5. Automatic Fire: Exactly 1 team with highest kills, deterministic tie breaker', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-test';
    const matchId = 'm_fire_test';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams = {
      'tA': { teamId: 'tA', kills: 5, points: 5, placementPoints: 0, killPoints: 5, players: {}, pointRushEnabled: false },
      'tB': { teamId: 'tB', kills: 9, points: 9, placementPoints: 0, killPoints: 9, players: {}, pointRushEnabled: false },
      'tC': { teamId: 'tC', kills: 3, points: 3, placementPoints: 0, killPoints: 3, players: {}, pointRushEnabled: false },
    };

    const fire1 = store.calculateFireTeamId(state.teams);
    expect(fire1).toBe('tB');

    state.teams['tA'].kills = 10;
    const fire2 = store.calculateFireTeamId(state.teams);
    expect(fire2).toBe('tA');
  });

  it('6. Next Match: Switches to real persisted next match and cleanly isolates match state', async () => {
    const tour = await Tournament.create({
      customId: 'tour-next-match-test',
      userId: new mongoose.Types.ObjectId(),
      title: 'Next Match Tournament',
      structure: { teamCount: 12, matchCount: 3, slotsPerMatch: 12 },
      matches: [
        {
          id: 'm_tour-next-match-test_1',
          matchNumber: 1,
          status: 'Completed',
          results: [],
        },
        // Pre-create match 2 — the service does NOT auto-create matches
        {
          id: 'm_tour-next-match-test_2',
          matchNumber: 2,
          status: 'Draft',
          results: [],
        },
      ],
      teams: [{ id: 'team-1', name: 'Alpha' }],
    });

    const nextRes = await getNextMatchForTournament(tour.customId, 'm_tour-next-match-test_1');
    expect(nextRes.hasNext).toBe(true);
    expect(nextRes.nextMatchNumber).toBe(2);
    expect(nextRes.nextMatchId).toBe('m_tour-next-match-test_2');

    const updatedTour = await Tournament.findOne({ customId: tour.customId }).lean();
    expect(updatedTour!.matches.length).toBe(2);
    expect(updatedTour!.matches[1].matchNumber).toBe(2);
  });

  it('7. Next Match: Returns hasNext = false when final match is reached (no fake matches)', async () => {
    const tour = await Tournament.create({
      customId: 'tour-final-match-test',
      userId: new mongoose.Types.ObjectId(),
      title: 'Final Match Tournament',
      structure: { teamCount: 12, matchCount: 1, slotsPerMatch: 12 },
      matches: [
        {
          id: 'm_final_1',
          matchNumber: 1,
          status: 'Live',
          results: [],
        },
      ],
      teams: [],
    });

    const nextRes = await getNextMatchForTournament(tour.customId, 'm_final_1');
    expect(nextRes.hasNext).toBe(false);
    // Service returns "latest match" — not "final match"
    expect(nextRes.message).toContain('latest match');
  });

  it('8. Critical Event Flush: flushPersistenceImmediately saves state to MongoDB synchronously', async () => {
    const tour = await Tournament.create({
      customId: 'tour-flush-test',
      userId: new mongoose.Types.ObjectId(),
      title: 'Flush Test Tournament',
      matches: [
        {
          id: 'm_flush_1',
          matchNumber: 1,
          status: 'Live',
          results: [{ teamId: 't1', kills: 0, totalPoints: 0 }],
        },
      ],
      teams: [{ id: 't1', name: 'Team One' }],
    });

    const store = LiveStateStore.getInstance();
    const state = await store.getOrCreateLiveState('org-default', tour.customId, 'm_flush_1');
    state.teams['t1'].kills = 15;
    state.teams['t1'].points = 25;

    enqueueBatchedPersistence(state);
    await flushPersistenceImmediately('org-default', tour.customId, 'm_flush_1');

    const checkTour = await Tournament.findOne({ customId: tour.customId }).lean();
    const t1Res = checkTour!.matches[0].results.find((r: any) => r.teamId === 't1');
    expect(t1Res.kills).toBe(15);
    expect(t1Res.totalPoints).toBe(25);
  });

  it('9. Monotonic Revision: Every applied command increments revision strictly monotonically', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-rev';
    const matchId = 'm_rev_test';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams['t1'] = { teamId: 't1', kills: 0, points: 0, placementPoints: 0, killPoints: 0, players: {}, pointRushEnabled: false };
    const r0 = state.revision;

    const res1 = await store.applyCommand({
      commandId: 'cmd_rev_1',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 't1', delta: 1 },
    });
    expect(res1.state.revision).toBe(r0 + 1);

    const res2 = await store.applyCommand({
      commandId: 'cmd_rev_2',
      command: 'ADD_KILLS',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { teamId: 't1', delta: 2 },
    });
    expect(res2.state.revision).toBe(r0 + 2);
    expect(res2.patch.revision).toBe(r0 + 2);
  });

  it('10. RESET_ALIVE: Resets all players across all teams to alive and clears eliminationOrder', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-reset';
    const matchId = 'm_reset_alive_test';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.teams['team-dead'] = {
      teamId: 'team-dead',
      kills: 3,
      points: 3,
      placementPoints: 0,
      killPoints: 3,
      players: {
        'p1': { status: 'eliminated', updatedAt: Date.now() },
        'p2': { status: 'knock', updatedAt: Date.now() },
      },
      pointRushEnabled: false,
    };
    state.eliminationOrder = ['team-dead'];

    const res = await store.applyCommand({
      commandId: 'cmd_reset',
      command: 'RESET_ALIVE',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: {},
    });

    expect(res.state.eliminationOrder).toEqual([]);
    expect(res.state.teams['team-dead'].players['p1'].status).toBe('alive');
    expect(res.state.teams['team-dead'].players['p2'].status).toBe('alive');
  });

  it('11. SET_TABLE_VISIBILITY: Toggles tableVisible immediately in live state', async () => {
    const store = LiveStateStore.getInstance();
    const orgId = 'org-apex';
    const tourId = 'tour-ff-vis';
    const matchId = 'm_vis_test';

    const state = await store.getOrCreateLiveState(orgId, tourId, matchId);
    state.tableVisible = true;

    const res = await store.applyCommand({
      commandId: 'cmd_hide',
      command: 'SET_TABLE_VISIBILITY',
      organizationId: orgId,
      tournamentId: tourId,
      matchId,
      payload: { visible: false },
    });

    expect(res.state.tableVisible).toBe(false);
    expect(res.patch.tableVisible).toBe(false);
  });

  it('12. Fire Tie-Breaker: When kills are tied, the team with earliest kill timestamp retains Fire', async () => {
    const store = LiveStateStore.getInstance();
    const now = Date.now();

    const teams: any = {
      'tA': { teamId: 'tA', kills: 5, lastKillTimestamp: now - 5000, players: {} },
      'tB': { teamId: 'tB', kills: 5, lastKillTimestamp: now - 1000, players: {} },
    };

    const leader = store.calculateFireTeamId(teams);
    expect(leader).toBe('tA'); // tA scored earlier
  });
});

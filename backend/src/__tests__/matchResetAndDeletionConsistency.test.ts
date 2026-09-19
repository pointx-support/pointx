import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { Organization } from '../models/Organization';
import { LiveStateStore } from '../services/liveStateStore';
import { generateJwtToken } from '../services/authService';
import { publishMatchReport } from '../services/matchReportService';
import { deleteMatchFromTournament } from '../services/tournamentService';
import { calculateStandings } from '../services/scoringEngine';

let mongoServer: MongoMemoryServer;
let app: any;
let user: any;
let token: string;
let org: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-match-reset-jwt-secret';

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

  user = await User.create({
    name: 'Tournament Organizer',
    email: 'organizer@pointx.in',
    passwordHash: 'secretHash',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });

  org = await Organization.create({
    name: 'PointX Pro Arena',
    slug: 'pointx-pro-arena',
    ownerId: user._id,
  });

  token = generateJwtToken(user);
});

describe('Match Prior Points Reset, Recalculate & Deletion Consistency', () => {
  it('1. should allow resetting prior match points to 0 and recalculating them from official website matches', async () => {
    const liveStore = LiveStateStore.getInstance();
    const tourCustomId = 'tour-reset-points-test-1';

    // Create tournament with Match 1 completed
    await Tournament.create({
      customId: tourCustomId,
      title: 'Free Fire Championship 2026',
      game: 'Free Fire',
      userId: user._id,
      organizationId: org._id,
      status: 'Live',
      scoringPreset: {
        id: 'preset-ff-official-v1',
        killPoints: 1,
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 },
      },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
      ],
      matches: [
        {
          id: 'match-1',
          customId: 'match-1',
          matchNumber: 1,
          customLabel: 'Match 01',
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 1, kills: 0, placementPoints: 12, killPoints: 0, totalPoints: 12, isBooyah: true },
            { teamId: 'team-maharathi', placement: 2, kills: 3, placementPoints: 9, killPoints: 3, totalPoints: 12, isBooyah: false },
          ],
        },
      ],
    });

    // Operator opens Match 2
    const match2State = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-2');
    expect(match2State.teams['team-raven'].priorTotalPoints).toBe(12);
    expect(match2State.teams['team-raven'].points).toBe(12);

    // Operator triggers RESET_PRIOR_POINTS from remote
    const { state: resetState } = await liveStore.applyCommand({
      commandId: 'cmd-reset-1',
      command: 'RESET_PRIOR_POINTS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: {},
    });

    expect(resetState.teams['team-raven'].priorTotalPoints).toBe(0);
    expect(resetState.teams['team-raven'].points).toBe(0);
    expect(resetState.teams['team-maharathi'].priorTotalPoints).toBe(0);
    expect(resetState.teams['team-maharathi'].points).toBe(0);

    // Add 2 kills to Team Raven in Match 2
    await liveStore.applyCommand({
      commandId: 'cmd-add-kill-1',
      command: 'ADD_KILLS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: { teamId: 'team-raven', delta: 2 },
    });

    // Team Raven points should now be 0 (prior) + 2 (kills) = 2
    const currentM2State = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-2');
    expect(currentM2State.teams['team-raven'].points).toBe(2);

    // Operator triggers RECALCULATE_PRIOR_POINTS to pull back official points from website matches
    const { state: recalcState } = await liveStore.applyCommand({
      commandId: 'cmd-recalc-1',
      command: 'RECALCULATE_PRIOR_POINTS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: {},
    });

    // Team Raven prior points restored to 12 from Match 1, plus 2 kills in Match 2 = 14!
    expect(recalcState.teams['team-raven'].priorTotalPoints).toBe(12);
    expect(recalcState.teams['team-raven'].points).toBe(14);
    expect(recalcState.teams['team-maharathi'].priorTotalPoints).toBe(12);
  });

  it('2. should save strictly match-only points in match.results on publish so Match 3 does not inflate (13 pts, not 25 pts)', async () => {
    const liveStore = LiveStateStore.getInstance();
    const tourCustomId = 'tour-scoring-integrity-2';

    // Tournament with Match 1 completed: Raven has 12 pts (Booyah + 0 kills)
    await Tournament.create({
      customId: tourCustomId,
      title: 'Free Fire Grand Finals 2026',
      game: 'Free Fire',
      userId: user._id,
      organizationId: org._id,
      status: 'Live',
      scoringPreset: {
        id: 'preset-ff-official-v1',
        killPoints: 1,
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 },
      },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
      ],
      matches: [
        {
          id: 'match-1',
          customId: 'match-1',
          matchNumber: 1,
          customLabel: 'Match 01',
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 1, kills: 0, placementPoints: 12, killPoints: 0, totalPoints: 12, isBooyah: true },
            { teamId: 'team-maharathi', placement: 2, kills: 12, placementPoints: 9, killPoints: 12, totalPoints: 21, isBooyah: false },
          ],
        },
      ],
    });

    // Match 2 starts: Team Raven has 12 prior points
    const m2Initial = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-2');
    expect(m2Initial.teams['team-raven'].priorTotalPoints).toBe(12);

    // In Match 2, Team Raven gets 1 kill and 12th place (0 placement pts)
    await liveStore.applyCommand({
      commandId: 'cmd-raven-kill-m2',
      command: 'ADD_KILLS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: { teamId: 'team-raven', delta: 1 },
    });

    // Team Maharathi gets Booyah in Match 2 (12 place pts + 3 kills = 15 pts)
    await liveStore.applyCommand({
      commandId: 'cmd-maha-kill-m2',
      command: 'ADD_KILLS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: { teamId: 'team-maharathi', delta: 3 },
    });
    await liveStore.applyCommand({
      commandId: 'cmd-wipe-raven',
      command: 'WIPE_SQUAD',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: { teamId: 'team-raven' },
    });
    await liveStore.applyCommand({
      commandId: 'cmd-finalize-m2',
      command: 'FINALIZE_MATCH',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-2',
      payload: {},
    });

    // Now publish Match 2 report with customResults (as sent by MatchReportView)
    const customResults = [
      { teamId: 'team-maharathi', placement: 1, kills: 3, placementPoints: 12, killPoints: 3, totalPoints: 15, isBooyah: true },
      // Notice totalPoints passed might have been 13 (cumulative), but backend MUST save strictly Match 2 score (1 pt)
      { teamId: 'team-raven', placement: 2, kills: 1, placementPoints: 0, killPoints: 1, totalPoints: 13, isBooyah: false },
    ];

    const publishRes = await publishMatchReport(
      tourCustomId,
      'live-match-2',
      { _id: user._id, name: 'Organizer' },
      customResults,
      'Bermuda'
    );
    expect(publishRes.success).toBe(true);

    // Verify in MongoDB that Match 2 saved totalPoints = 1 for Team Raven (strictly Match 2 score!)
    const updatedTour = await Tournament.findOne({ customId: tourCustomId }).lean();
    const match2Doc = updatedTour?.matches.find((m: any) => m.matchNumber === 2);
    expect(match2Doc).toBeDefined();
    const ravenM2Res = match2Doc?.results.find((r: any) => r.teamId === 'team-raven');
    expect(ravenM2Res?.totalPoints).toBe(1);

    // Operator advances to Match 3
    const match3State = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-3');
    // Team Raven priorTotalPoints in Match 3 MUST BE: Match 1 (12) + Match 2 (1) = 13 points (NOT 25!)
    expect(match3State.teams['team-raven'].priorTotalPoints).toBe(13);
    expect(match3State.teams['team-raven'].points).toBe(13);

    // Team Maharathi priorTotalPoints in Match 3 MUST BE: Match 1 (21) + Match 2 (15) = 36 points!
    expect(match3State.teams['team-maharathi'].priorTotalPoints).toBe(36);
    expect(match3State.teams['team-maharathi'].points).toBe(36);
  });

  it('3. should remove deleted match points from remote and liveState when a match is deleted from website', async () => {
    const liveStore = LiveStateStore.getInstance();
    const tourCustomId = 'tour-delete-match-test-3';

    // Tournament with Match 1 and Match 2 completed
    await Tournament.create({
      customId: tourCustomId,
      title: 'Free Fire Delete Match Test',
      game: 'Free Fire',
      userId: user._id,
      organizationId: org._id,
      status: 'Live',
      scoringPreset: {
        id: 'preset-ff-official-v1',
        killPoints: 1,
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 },
      },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
      ],
      matches: [
        {
          id: 'match-1',
          customId: 'match-1',
          matchNumber: 1,
          customLabel: 'Match 01',
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 1, kills: 0, placementPoints: 12, killPoints: 0, totalPoints: 12, isBooyah: true },
          ],
        },
        {
          id: 'match-2',
          customId: 'match-2',
          matchNumber: 2,
          customLabel: 'Match 02',
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 2, kills: 1, placementPoints: 0, killPoints: 1, totalPoints: 1, isBooyah: false },
          ],
        },
      ],
    });

    // In Match 3, prior points is 12 + 1 = 13
    const match3State = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-3');
    expect(match3State.teams['team-raven'].priorTotalPoints).toBe(13);
    expect(match3State.teams['team-raven'].points).toBe(13);

    // User deletes Match 2 from the website
    const updatedTour = await deleteMatchFromTournament(
      tourCustomId,
      'match-2',
      user._id.toString(),
      user.role
    );
    expect(updatedTour).toBeDefined();
    expect(updatedTour?.matches.length).toBe(1);

    // When Match 3 is queried or re-synced, Match 2 points MUST BE REMOVED!
    // Prior total points should drop from 13 back to 12!
    const m3AfterDelete = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-3');
    expect(m3AfterDelete.teams['team-raven'].priorTotalPoints).toBe(12);
    expect(m3AfterDelete.teams['team-raven'].points).toBe(12);
  });

  it('4. should guarantee that website standings total points and OBS overlay live state total points match 100% after finalizing a match', async () => {
    const liveStore = LiveStateStore.getInstance();
    const tourCustomId = 'tour-standings-match-4';

    await Tournament.create({
      customId: tourCustomId,
      title: 'Free Fire Consistency Test',
      game: 'Free Fire',
      userId: user._id,
      organizationId: org._id,
      status: 'Live',
      scoringPreset: {
        id: 'preset-ff-official-v1',
        killPoints: 1,
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 },
      },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
      ],
      matches: [],
    });

    // Match 1: Raven gets Booyah (12 pts + 2 kills = 14 pts), Maharathi gets 2nd place (9 pts + 5 kills = 14 pts)
    await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-1');
    await liveStore.applyCommand({
      commandId: 'cmd-k1',
      command: 'ADD_KILLS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-1',
      payload: { teamId: 'team-raven', delta: 2 },
    });
    await liveStore.applyCommand({
      commandId: 'cmd-k2',
      command: 'ADD_KILLS',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-1',
      payload: { teamId: 'team-maharathi', delta: 5 },
    });
    await liveStore.applyCommand({
      commandId: 'cmd-wipe-m',
      command: 'WIPE_SQUAD',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-1',
      payload: { teamId: 'team-maharathi' },
    });
    await liveStore.applyCommand({
      commandId: 'cmd-fin-1',
      command: 'FINALIZE_MATCH',
      organizationId: org._id.toString(),
      tournamentId: tourCustomId,
      matchId: 'live-match-1',
      payload: {},
    });

    // Publish Match 1
    await publishMatchReport(
      tourCustomId,
      'live-match-1',
      { _id: user._id, name: 'Organizer' },
      undefined,
      'Bermuda'
    );

    // Fetch updated tournament from DB and calculate website standings
    const tourM1 = await Tournament.findOne({ customId: tourCustomId }).lean();
    const websiteStandingsM1 = calculateStandings(tourM1?.teams || [], tourM1?.matches || [], tourM1?.scoringPreset);

    // Get OBS overlay liveState for Match 1
    const obsStateM1 = await liveStore.getOrCreateLiveState(org._id.toString(), tourCustomId, 'live-match-1');

    // Both website standings and OBS overlay total points must match 100%
    const ravenWebsiteM1 = websiteStandingsM1.find((s) => s.teamId === 'team-raven');
    expect(obsStateM1.teams['team-raven'].points).toBe(ravenWebsiteM1?.totalPoints);
    expect(obsStateM1.teams['team-raven'].points).toBe(14);

    const mahaWebsiteM1 = websiteStandingsM1.find((s) => s.teamId === 'team-maharathi');
    expect(obsStateM1.teams['team-maharathi'].points).toBe(mahaWebsiteM1?.totalPoints);
    expect(obsStateM1.teams['team-maharathi'].points).toBe(14);
  });
});

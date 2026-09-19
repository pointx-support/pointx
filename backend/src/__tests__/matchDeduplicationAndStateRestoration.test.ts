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
import { calculateStandings } from '../services/scoringEngine';

let mongoServer: MongoMemoryServer;
let app: any;
let user: any;
let token: string;
let org: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-match-dedup-jwt-secret';

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
    name: 'Tournament Admin',
    email: 'admin@pointx.in',
    passwordHash: 'secretHash',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });

  org = await Organization.create({
    name: 'PointX Esports',
    slug: 'pointx-esports',
    ownerId: user._id,
  });

  token = generateJwtToken(user);
});

describe('Match Deduplication, State Restoration & Cumulative Scoring Integrity', () => {
  it('1. Publishing the same match twice replaces the existing match without adding duplicate', async () => {
    const tour = await Tournament.create({
      title: 'FF Pro League Series',
      organizer: 'PointX Esports',
      organizationId: org._id,
      userId: user._id,
      game: 'Free Fire',
      status: 'Live',
      customId: 'tour-dedup-test-1',
      structure: { teamCount: 12, matchCount: 6 },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
        { id: 'team-shadow', name: 'Shadow Squad', slotNumber: 3 },
      ],
      matches: [],
    });

    const liveStore = LiveStateStore.getInstance();
    const match2State = await liveStore.getOrCreateLiveState(String(org._id), tour.customId, 'live-match-2');
    match2State.teams['team-raven'].kills = 1;
    match2State.teams['team-raven'].placement = 1;
    match2State.teams['team-raven'].isBooyah = true;
    match2State.teams['team-raven'].placementPoints = 12;
    match2State.teams['team-raven'].killPoints = 1;
    match2State.teams['team-raven'].points = 13;

    match2State.teams['team-maharathi'].kills = 3;
    match2State.teams['team-maharathi'].placement = 2;
    match2State.teams['team-maharathi'].placementPoints = 9;
    match2State.teams['team-maharathi'].killPoints = 3;
    match2State.teams['team-maharathi'].points = 12;

    // First Publish
    const firstPublish = await publishMatchReport(tour.customId, 'live-match-2', user);
    expect(firstPublish.success).toBe(true);

    let dbTour: any = await Tournament.findOne({ customId: tour.customId });
    expect(dbTour.matches).toHaveLength(1);
    expect(dbTour.matches[0].matchNumber).toBe(2);
    expect(dbTour.matches[0].status).toBe('Completed');

    // Second Publish (e.g. operator pushed again unconsciously)
    const secondPublish = await publishMatchReport(tour.customId, 'live-match-2', user);
    expect(secondPublish.success).toBe(true);

    dbTour = await Tournament.findOne({ customId: tour.customId });
    // MUST still be exactly 1 match in tour.matches, NOT 2!
    expect(dbTour.matches).toHaveLength(1);
    expect(dbTour.matches[0].matchNumber).toBe(2);
  });

  it('2. Navigating back to a completed match restores data with Booyah team ALIVE and others ELIMINATED', async () => {
    const tour = await Tournament.create({
      title: 'FF Pro League Series',
      organizer: 'PointX Esports',
      organizationId: org._id,
      userId: user._id,
      game: 'Free Fire',
      status: 'Live',
      customId: 'tour-dedup-test-2',
      structure: { teamCount: 3, matchCount: 6 },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
        { id: 'team-shadow', name: 'Shadow Squad', slotNumber: 3 },
      ],
      matches: [
        {
          id: 'match-tour-2-abc',
          customId: 'match-tour-2-abc',
          tournamentId: 'tour-dedup-test-2',
          matchNumber: 2,
          status: 'Completed',
          results: [
            {
              teamId: 'team-raven',
              placement: 1,
              kills: 1,
              placementPoints: 12,
              killPoints: 1,
              totalPoints: 13,
              isBooyah: true,
            },
            {
              teamId: 'team-maharathi',
              placement: 2,
              kills: 3,
              placementPoints: 9,
              killPoints: 3,
              totalPoints: 12,
              isBooyah: false,
            },
            {
              teamId: 'team-shadow',
              placement: 3,
              kills: 0,
              placementPoints: 8,
              killPoints: 0,
              totalPoints: 8,
              isBooyah: false,
            },
          ],
        },
      ],
    });

    const liveStore = LiveStateStore.getInstance();
    const state = await liveStore.getOrCreateLiveState(String(org._id), tour.customId, 'live-match-2');

    expect(state).toBeDefined();
    expect(state.matchNumber).toBe(2);
    expect(state.isMatchFinished).toBe(true);

    // Booyah winning team must be ALIVE
    const ravenTeam = state.teams['team-raven'];
    expect(ravenTeam.isBooyah).toBe(true);
    expect(ravenTeam.placement).toBe(1);
    const ravenPlayers = Object.values(ravenTeam.players);
    expect(ravenPlayers.every((p: any) => p.status === 'alive')).toBe(true);

    // Other teams must be ELIMINATED / DEAD
    const maharathiTeam = state.teams['team-maharathi'];
    expect(maharathiTeam.isBooyah).toBe(false);
    expect(maharathiTeam.placement).toBe(2);
    const maharathiPlayers = Object.values(maharathiTeam.players);
    expect(maharathiPlayers.every((p: any) => p.status === 'eliminated')).toBe(true);

    const shadowTeam = state.teams['team-shadow'];
    const shadowPlayers = Object.values(shadowTeam.players);
    expect(shadowPlayers.every((p: any) => p.status === 'eliminated')).toBe(true);

    // Elimination order must place 3rd place before 2nd place
    expect(state.eliminationOrder).toEqual(['team-shadow', 'team-maharathi']);
  });

  it('3. Advancing to Match 3 correctly computes prior total points (13 pts, not 25 pts)', async () => {
    const tour = await Tournament.create({
      title: 'FF Championship Series',
      organizer: 'PointX Esports',
      organizationId: org._id,
      userId: user._id,
      game: 'Free Fire',
      status: 'Live',
      customId: 'tour-dedup-test-3',
      structure: { teamCount: 2, matchCount: 6 },
      teams: [
        { id: 'team-raven', name: 'Raven Esports', slotNumber: 1 },
        { id: 'team-maharathi', name: 'Team Maharathi', slotNumber: 2 },
      ],
      matches: [
        {
          id: 'match-1',
          matchNumber: 1,
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 2, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0 },
            { teamId: 'team-maharathi', placement: 1, kills: 2, placementPoints: 12, killPoints: 2, totalPoints: 14 },
          ],
        },
        {
          id: 'match-2',
          matchNumber: 2,
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 1, kills: 1, placementPoints: 12, killPoints: 1, totalPoints: 13, isBooyah: true },
            { teamId: 'team-maharathi', placement: 2, kills: 1, placementPoints: 9, killPoints: 1, totalPoints: 10 },
          ],
        },
        // Accidental duplicate Match 2 in DB
        {
          id: 'match-2-duplicate',
          matchNumber: 2,
          status: 'Completed',
          results: [
            { teamId: 'team-raven', placement: 1, kills: 1, placementPoints: 12, killPoints: 1, totalPoints: 13, isBooyah: true },
            { teamId: 'team-maharathi', placement: 2, kills: 1, placementPoints: 9, killPoints: 1, totalPoints: 10 },
          ],
        },
      ],
    });

    const liveStore = LiveStateStore.getInstance();
    const match3State = await liveStore.getOrCreateLiveState(String(org._id), tour.customId, 'live-match-3');

    // Raven prior points should be 0 (M1) + 13 (M2) = 13 total points, NOT 26 or 25!
    expect(match3State.teams['team-raven'].priorTotalPoints).toBe(13);
    expect(match3State.teams['team-raven'].points).toBe(13);

    // Maharathi prior points should be 14 (M1) + 10 (M2) = 24 total points
    expect(match3State.teams['team-maharathi'].priorTotalPoints).toBe(24);
    expect(match3State.teams['team-maharathi'].points).toBe(24);

    // Standings calculation must also deduplicate duplicate Match 2
    const standings = calculateStandings(tour.teams, tour.matches);
    const ravenStanding = standings.find((s) => s.teamId === 'team-raven');
    expect(ravenStanding?.totalPoints).toBe(13);
    expect(ravenStanding?.matchesPlayed).toBe(2);
  });
});

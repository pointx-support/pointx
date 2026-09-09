import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { GlobalTeam } from '../models/GlobalTeam';
import { CustomTemplate } from '../models/CustomTemplate';
import { BroadcastSession } from '../models/BroadcastSession';
import { generateJwtToken } from '../services/authService';
import { ensureUserOrganization, runTenantMigration } from '../services/tenantMigrationService';

let mongoServer: MongoMemoryServer;
let app: any;

let userA: any;
let tokenA: string;
let orgA: any;

let userB: any;
let tokenB: string;
let orgB: any;

let tourA: any;
let teamA: any;
let templateA: any;
let sessionA: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-security-jwt-secret-9988';

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

  // 1. Provision User A and Organization Alpha
  userA = await User.create({
    name: 'Organizer Alpha',
    email: 'alpha@org-alpha.gg',
    passwordHash: 'hashed_pw_alpha',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Alpha Esports Club',
  });
  orgA = await ensureUserOrganization(userA);
  tokenA = generateJwtToken(userA);

  // 2. Provision User B and Organization Beta (Adversary / Unrelated Tenant)
  userB = await User.create({
    name: 'Organizer Beta',
    email: 'beta@org-beta.gg',
    passwordHash: 'hashed_pw_beta',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Beta Gaming League',
  });
  orgB = await ensureUserOrganization(userB);
  tokenB = generateJwtToken(userB);

  // 3. User A creates Tournament A
  tourA = await Tournament.create({
    customId: 'tour-alpha-championship',
    userId: userA._id,
    organizationId: orgA._id,
    title: 'Alpha Championship 2026',
    organizer: 'Alpha Esports Club',
    game: 'Free Fire',
    status: 'Live',
    structure: { teamCount: 12, matchCount: 3, slotsPerMatch: 12 },
    scoringPreset: {
      id: 'preset-ff-v1',
      name: 'Free Fire Standard',
      game: 'Free Fire',
      killPoints: 1,
      placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
    },
    teams: [
      { id: 'team-a1', name: 'Alpha Kings', tag: 'AK', slotNumber: 1, players: [{ id: 'p-a1', name: 'AlphaAce', inGameId: 'AK_Ace' }] },
      { id: 'team-a2', name: 'Alpha Wolves', tag: 'AW', slotNumber: 2, players: [{ id: 'p-a2', name: 'Wolfie', inGameId: 'AW_Wolf' }] },
    ],
    matches: [
      {
        id: 'match-alpha-1',
        customId: 'match-alpha-1',
        tournamentId: 'tour-alpha-championship',
        matchNumber: 1,
        mapName: 'Bermuda',
        status: 'Ongoing',
        results: [
          { teamId: 'team-a1', kills: 4, placement: 1, placementPoints: 12, killPoints: 4, totalPoints: 16, isBooyah: true },
        ],
      },
    ],
  });

  // 4. User A creates Global Team A
  teamA = await GlobalTeam.create({
    customId: 'gt-alpha-titans',
    userId: userA._id,
    organizationId: orgA._id,
    name: 'Alpha Titans',
    tag: 'AT',
    status: 'Active',
    players: [{ id: 'p-at-1', name: 'TitanX', inGameId: 'AT_TitanX' }],
  });

  // 5. User A creates Custom Template A
  templateA = await CustomTemplate.create({
    customId: 'tmpl-alpha-custom-overlay',
    userId: userA._id,
    organizationId: orgA._id,
    name: 'Alpha Confidential Overlay',
    description: 'Proprietary broadcast layout',
    imageUrl: 'https://res.cloudinary.com/test/alpha.png',
    alignment: { x: 0, y: 0 },
    templateType: 'POINTS_TABLE',
    visibility: 'ORGANIZATION_RESTRICTED',
    allowedOrganizationIds: [orgA._id.toString(), 'Alpha Esports Club'],
    isBuiltIn: false,
    active: true,
  });

  // 6. User A creates Broadcast Session A
  sessionA = await BroadcastSession.create({
    sessionId: 'sess-alpha-live-001',
    tournamentId: tourA.customId,
    matchId: 'match-alpha-1',
    organizationId: orgA._id,
    teamStats: {
      'team-a1': { kills: 4 },
    },
    active: true,
  });
});

describe('PointX Multi-Tenant Authorization & IDOR Penetration Testing Matrix', () => {
  // VECTOR 1: Tournament Isolation
  describe('Vector 1: Tournament Isolation & IDOR Protection', () => {
    it('1.1 User B must NOT see User A tournaments in GET /api/tournaments', async () => {
      const res = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]); // Zero tournaments leaked!
    });

    it('1.2 User B must receive 404 when directly requesting User A tournament by customId', async () => {
      const res = await request(app)
        .get(`/api/tournaments/${tourA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Tournament not found.');
    });

    it('1.3 User B must receive 404 when directly requesting User A tournament by Mongo ObjectId', async () => {
      const res = await request(app)
        .get(`/api/tournaments/${tourA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('1.4 User B must receive 404 when attempting to mutate/update User A tournament', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tourA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked by User B' });

      expect(res.status).toBe(404);

      // Verify DB was NOT modified
      const original = await Tournament.findById(tourA._id);
      expect(original!.title).toBe('Alpha Championship 2026');
    });

    it('1.5 User B must receive 404 when attempting to delete User A tournament', async () => {
      const res = await request(app)
        .delete(`/api/tournaments/${tourA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);

      const stillExists = await Tournament.findById(tourA._id);
      expect(stillExists).not.toBeNull();
    });

    it('1.6 User B must receive 404 when attempting to mutate match score on User A tournament', async () => {
      const res = await request(app)
        .post(`/api/tournaments/${tourA.customId}/matches/match-alpha-1/score`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          teamId: 'team-a1',
          kills: 99,
          placement: 1,
        });

      expect(res.status).toBe(404);

      const fresh = await Tournament.findById(tourA._id);
      expect(fresh!.matches[0].results[0].kills).toBe(4);
    });

    it('1.7 User B must receive 404 when attempting to delete match from User A tournament', async () => {
      const res = await request(app)
        .delete(`/api/tournaments/${tourA.customId}/matches/match-alpha-1`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);

      const fresh = await Tournament.findById(tourA._id);
      expect(fresh!.matches.length).toBe(1);
    });
  });

  // VECTOR 2: Broadcast Session Isolation
  describe('Vector 2: Broadcast Session Isolation & Remote Command Protection', () => {
    it('2.1 User B must receive 403 Forbidden when sending operator commands to User A session', async () => {
      const res = await request(app)
        .post(`/api/broadcast/sessions/${sessionA.sessionId}/commands`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          commandType: 'ADD_KILL',
          targetTeamId: 'team-a1',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify state was NOT modified
      const freshSession = await BroadcastSession.findOne({ sessionId: sessionA.sessionId });
      expect(freshSession!.teamStats['team-a1']?.kills).toBe(4);
    });

    it('2.2 User B must receive 403 Forbidden when attempting to submit match report for User A session', async () => {
      const res = await request(app)
        .post(`/api/broadcast/sessions/${sessionA.sessionId}/submit-report`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // VECTOR 3: Realtime Sync & Cross-Tenant State Isolation
  describe('Vector 3: Realtime Sync & Cross-Tenant State Isolation', () => {
    it('3.1 User B must receive 404 when accessing User A authoritative live state via /api/sync/state', async () => {
      const res = await request(app)
        .get(`/api/sync/state?tournamentId=${tourA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('3.2 Querying "default" tournament must NEVER return another organization tournament', async () => {
      const res = await request(app)
        .get('/api/sync/state?tournamentId=default')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull(); // No cross-tenant bleed!
    });

    it('3.3 User B cannot mutate User A sync state via POST /api/sync/state', async () => {
      const res = await request(app)
        .post('/api/sync/state')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          tournamentId: tourA.customId,
          isVisible: false,
        });

      expect(res.status).toBe(403);
    });
  });

  // VECTOR 4: Global Squads & Team Isolation
  describe('Vector 4: Team and Squad Isolation', () => {
    it('4.1 User B must NOT see User A teams in GET /api/teams', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]); // Zero teams leaked!
    });

    it('4.2 User B must receive 404 when attempting to update User A team', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Team' });

      expect(res.status).toBe(404);
      const original = await GlobalTeam.findById(teamA._id);
      expect(original!.name).toBe('Alpha Titans');
    });

    it('4.3 User B must receive 404 when attempting to delete User A team', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      const stillExists = await GlobalTeam.findById(teamA._id);
      expect(stillExists).not.toBeNull();
    });

    it('4.4 User B must receive 404 when attempting to add player to User A team', async () => {
      const res = await request(app)
        .post(`/api/teams/${teamA.customId}/players`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: 'Intruder',
          inGameId: 'INTRUDER_01',
        });

      expect(res.status).toBe(404);
      const fresh = await GlobalTeam.findById(teamA._id);
      expect(fresh!.players.length).toBe(1);
    });
  });

  // VECTOR 5: Template Studio Isolation
  describe('Vector 5: Template Studio & Section Data Isolation', () => {
    it('5.1 User B cannot access User A private custom template directly', async () => {
      const res = await request(app)
        .get(`/api/templates/${templateA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });

    it('5.2 User B cannot fetch section data using User A tournament ID (IDOR prevention)', async () => {
      const res = await request(app)
        .get(`/api/templates/${templateA.customId}/data?tournamentId=${tourA.customId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);
    });
  });

  // VECTOR 6: Legitimate Tenant Operations
  describe('Vector 6: Legitimate Tenant Operation Verification', () => {
    it('6.1 User A can view and manage their own tournament and teams', async () => {
      const tourRes = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(tourRes.status).toBe(200);
      expect(tourRes.body.data.length).toBe(1);
      expect(tourRes.body.data[0].id).toBe(tourA.customId);

      const teamRes = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(teamRes.status).toBe(200);
      expect(teamRes.body.data.length).toBe(1);
      expect(teamRes.body.data[0].name).toBe('Alpha Titans');
    });

    it('6.2 User B can independently create and manage their own tournament without bleed', async () => {
      const createRes = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Beta Winter Scrims',
          game: 'Free Fire',
          status: 'Upcoming',
          structure: { teamCount: 12, matchCount: 2, slotsPerMatch: 12 },
        });

      expect(createRes.status).toBe(201);
      const tourBId = createRes.body.data.id;

      // User B sees only their tournament
      const listB = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(listB.body.data.length).toBe(1);
      expect(listB.body.data[0].id).toBe(tourBId);

      // User A still sees only their tournament
      const listA = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(listA.body.data.length).toBe(1);
      expect(listA.body.data[0].id).toBe(tourA.customId);
    });
  });

  // VECTOR 7: Safe Tenant Migration
  describe('Vector 7: Safe, Non-Destructive Data Migration', () => {
    it('7.1 should backfill legacy tournaments and teams without organizationId during runTenantMigration', async () => {
      // Create legacy unmigrated user, tournament, and team
      const legacyUser = await User.create({
        name: 'Legacy Organizer',
        email: 'legacy@pointx.gg',
        passwordHash: 'hashed_legacy',
        role: 'organizer',
        status: 'active',
        isEmailVerified: true,
        isOnboarded: true,
      });

      const legacyTour = await Tournament.create({
        customId: 'tour-legacy-pre-migration',
        userId: legacyUser._id,
        // Notice organizationId is omitted!
        title: 'Legacy Masters 2025',
        organizer: 'Old School Gaming',
        game: 'Free Fire',
        status: 'Completed',
        structure: { teamCount: 12, matchCount: 1, slotsPerMatch: 12 },
        matches: [],
      });

      const legacyTeam = await GlobalTeam.create({
        customId: 'gt-legacy-dragons',
        userId: legacyUser._id,
        // Notice organizationId is omitted!
        name: 'Legacy Dragons',
        tag: 'LD',
        status: 'Active',
      });

      // Run migration
      const stats = await runTenantMigration();
      expect(stats.usersMigrated).toBeGreaterThan(0);
      expect(stats.tournamentsMigrated).toBeGreaterThan(0);
      expect(stats.teamsMigrated).toBeGreaterThan(0);

      // Verify legacy records now have valid organizationId
      const migratedUser = await User.findById(legacyUser._id);
      expect(migratedUser!.primaryOrganizationId).toBeDefined();

      const migratedTour = await Tournament.findById(legacyTour._id);
      expect(migratedTour!.organizationId).toEqual(migratedUser!.primaryOrganizationId);

      const migratedTeam = await GlobalTeam.findById(legacyTeam._id);
      expect(migratedTeam!.organizationId).toEqual(migratedUser!.primaryOrganizationId);

      // Verify legacy user can access their migrated tournament
      const legacyToken = generateJwtToken(migratedUser!);
      const accessRes = await request(app)
        .get(`/api/tournaments/${legacyTour.customId}`)
        .set('Authorization', `Bearer ${legacyToken}`);
      expect(accessRes.status).toBe(200);
      expect(accessRes.body.data.id).toBe('tour-legacy-pre-migration');
    });
  });
});

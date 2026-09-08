import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { CustomTemplate } from '../models/CustomTemplate';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let adminUser: any;
let adminToken: string;
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

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@pointx.gg',
    passwordHash: 'hashed_admin_123',
    role: 'admin',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
  });
  adminToken = generateJwtToken(adminUser);

  testTournament = await Tournament.create({
    customId: 'tour-test-section-api',
    userId: adminUser._id,
    title: 'Free Fire World Cup 2026',
    organizer: 'PointX Arena Official',
    game: 'FREE_FIRE',
    status: 'Live',
    teams: Array.from({ length: 12 }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Team ${String.fromCharCode(65 + i)}`,
      tag: `T${i + 1}`,
      slotNumber: i + 1,
      players: [
        { id: `p-${i}-1`, name: `Player ${i + 1}A` },
        { id: `p-${i}-2`, name: `Player ${i + 1}B` }
      ]
    })),
    matches: [
      {
        id: 'm-1',
        matchNumber: 1,
        status: 'Finalized',
        results: [
          { teamId: 'team-1', teamName: 'Team A', placement: 1, kills: 12, totalPoints: 24, isBooyah: true },
          { teamId: 'team-2', teamName: 'Team B', placement: 2, kills: 8, totalPoints: 17 },
          { teamId: 'team-3', teamName: 'Team C', placement: 3, kills: 5, totalPoints: 13 },
        ],
        eliminations: [
          { killerId: 'p-0-1', killerPlayerId: 'p-0-1', victimId: 'p-1-1' },
          { killerId: 'p-0-1', killerPlayerId: 'p-0-1', victimId: 'p-1-2' },
          { killerId: 'p-1-1', killerPlayerId: 'p-1-1', victimId: 'p-2-1' },
        ]
      }
    ]
  });
});

describe('Graphics Studio Section Data API & Architectural Isolation', () => {
  it('TEST J: Victory Certificate API must return certificate data only, NEVER full Points Table data', async () => {
    const certTmpl = await CustomTemplate.create({
      customId: 'tmpl-cert-gold',
      userId: adminUser._id,
      name: 'Champion Diploma 2026',
      imageUrl: 'https://cloudinary.com/cert.png',
      aspectRatio: '16:9',
      alignment: { width: 1920, height: 1080 },
      templateType: 'VICTORY_CERTIFICATE',
      category: 'certificate',
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    const res = await request(app)
      .get(`/api/templates/${certTmpl.customId}/data?tournamentId=${testTournament.customId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateType).toBe('VICTORY_CERTIFICATE');
    expect(res.body.data.recipientName).toBe('Team A');
    expect(res.body.data.awardTitle).toBe('CHAMPION');
    expect(res.body.data.certificateId).toBeDefined();

    // CRITICAL REQUIREMENT: Must NOT return points table or 12 team rows
    expect(res.body.data.rows).toBeUndefined();
    expect(res.body.data.standings).toBeUndefined();
    expect(res.body.data.allTeamPoints).toBeUndefined();
    expect(res.body.data.allTeamKills).toBeUndefined();
    expect(res.body.data.teams).toBeUndefined();
  });

  it('Top Fraggers API must return ONLY top 3 players by total kills, NOT 12 teams', async () => {
    const fraggersTmpl = await CustomTemplate.create({
      customId: 'tmpl-fraggers-mvp',
      userId: adminUser._id,
      name: 'Top Fraggers MVP Showcase',
      imageUrl: 'https://cloudinary.com/mvp.png',
      aspectRatio: '4:5',
      alignment: { width: 1080, height: 1350 },
      templateType: 'TOP_FRAGGERS',
      category: 'fraggers',
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    const res = await request(app)
      .get(`/api/templates/${fraggersTmpl.customId}/data?tournamentId=${testTournament.customId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateType).toBe('TOP_FRAGGERS');
    expect(Array.isArray(res.body.data.players)).toBe(true);
    expect(res.body.data.players.length).toBeLessThanOrEqual(3);

    // CRITICAL REQUIREMENT: No 12 teams, no points table rows
    expect(res.body.data.rows).toBeUndefined();
    expect(res.body.data.standings).toBeUndefined();
    expect(res.body.data.teams).toBeUndefined();
  });

  it('Kill Leader API must return ONE highest-kill player, NOT 12 teams', async () => {
    const klTmpl = await CustomTemplate.create({
      customId: 'tmpl-kill-leader',
      userId: adminUser._id,
      name: 'Predator Kill Leader',
      imageUrl: 'https://cloudinary.com/kl.png',
      aspectRatio: '4:5',
      alignment: { width: 1080, height: 1350 },
      templateType: 'KILL_LEADER',
      category: 'warheads',
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    const res = await request(app)
      .get(`/api/templates/${klTmpl.customId}/data?tournamentId=${testTournament.customId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateType).toBe('KILL_LEADER');
    expect(res.body.data.player).toBeDefined();
    expect(res.body.data.player.name).toBe('Player 1A');

    // CRITICAL REQUIREMENT: No 12 teams, no points table rows
    expect(res.body.data.rows).toBeUndefined();
    expect(res.body.data.standings).toBeUndefined();
    expect(res.body.data.teams).toBeUndefined();
  });

  it('Slots List API must return slot numbers and team names WITHOUT points, kills, or standings', async () => {
    const slotsTmpl = await CustomTemplate.create({
      customId: 'tmpl-slots-matrix',
      userId: adminUser._id,
      name: 'Official 12-Slot Schedule',
      imageUrl: 'https://cloudinary.com/slots.png',
      aspectRatio: '4:5',
      alignment: { width: 1080, height: 1350 },
      templateType: 'SLOTS_LIST',
      category: 'slots-list',
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    const res = await request(app)
      .get(`/api/templates/${slotsTmpl.customId}/data?tournamentId=${testTournament.customId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateType).toBe('SLOTS_LIST');
    expect(Array.isArray(res.body.data.teams)).toBe(true);
    expect(res.body.data.teams.length).toBe(12);

    // CRITICAL REQUIREMENT: Contains slot and teamName, but STRICTLY NO points or kills
    for (const item of res.body.data.teams) {
      expect(item.slot).toBeDefined();
      expect(item.teamName).toBeDefined();
      expect(item.points).toBeUndefined();
      expect(item.totalPoints).toBeUndefined();
      expect(item.kills).toBeUndefined();
      expect(item.placement).toBeUndefined();
    }
  });

  it('Points Table API must return full standings with kills, placement, and points', async () => {
    const ptTmpl = await CustomTemplate.create({
      customId: 'tmpl-points-table',
      userId: adminUser._id,
      name: 'Championship Points Table',
      imageUrl: 'https://cloudinary.com/pt.png',
      aspectRatio: '16:9',
      alignment: { width: 1920, height: 1080 },
      templateType: 'POINTS_TABLE',
      category: 'standings',
      visibility: 'GLOBAL',
      isPublished: true,
      active: true,
    });

    const res = await request(app)
      .get(`/api/templates/${ptTmpl.customId}/data?tournamentId=${testTournament.customId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateType).toBe('POINTS_TABLE');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
    expect(res.body.data.rows[0].totalPoints).toBeDefined();
    expect(res.body.data.rows[0].killPoints).toBeDefined();
  });
});

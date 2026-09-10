import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Tournament } from '../models/Tournament';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';
import { RemotePairingSession } from '../models/RemotePairingSession';
import { generateJwtToken } from '../services/authService';

let mongoServer: MongoMemoryServer;
let app: any;
let orgA: any;
let orgB: any;
let userA: any;
let userB: any;
let tokenA: string;
let tokenB: string;
let tournamentA: any;

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

  // Setup Org A and User A
  userA = await User.create({
    name: 'Alpha Operator',
    email: 'alpha@org-alpha.com',
    passwordHash: 'hash',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Organization Alpha',
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

  // Setup Org B and User B (Attacker / Different Org)
  userB = await User.create({
    name: 'Beta Operator',
    email: 'beta@org-beta.com',
    passwordHash: 'hash',
    role: 'organizer',
    status: 'active',
    isEmailVerified: true,
    isOnboarded: true,
    organizationName: 'Organization Beta',
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

  // Tournament created by Org A
  tournamentA = await Tournament.create({
    title: 'Alpha Invitational',
    customId: 'tour-alpha-1',
    userId: userA._id,
    organizationId: orgA._id.toString(),
    game: 'freefire',
    format: 'squad',
    matches: [],
  });
});

describe('PART 2: Secure Remote Pairing & Organization Boundary Enforcement', () => {
  it('generates an ephemeral pairing token with 10-minute TTL and no raw credentials', async () => {
    const res = await request(app)
      .post('/api/broadcast/remote-pairing')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        tournamentId: tournamentA.customId,
        sessionId: `session-${tournamentA.customId}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pairingToken).toBeDefined();
    expect(res.body.data.ttlSeconds).toBe(600);
    expect(res.body.data.pairingUrl).toContain(`/remote/connect/${res.body.data.pairingToken}`);

    // Verify record in MongoDB
    const session = await RemotePairingSession.findOne({ pairingToken: res.body.data.pairingToken });
    expect(session).toBeDefined();
    expect(session!.organizationId).toBe(orgA._id.toString());
    expect(session!.isConsumed).toBe(false);
  });

  it('blocks unauthenticated claiming of pairing tokens with 401', async () => {
    const session = await RemotePairingSession.create({
      pairingToken: 'test-unauth-token-123',
      organizationId: orgA._id.toString(),
      tournamentId: tournamentA.customId,
      sessionId: `session-${tournamentA.customId}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      isConsumed: false,
    });

    const res = await request(app)
      .post('/api/broadcast/remote-pairing/claim')
      .send({ token: session.pairingToken });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects claiming by an operator from a DIFFERENT organization with 403 ACCESS DENIED', async () => {
    // 1. Org A generates pairing token
    const pairRes = await request(app)
      .post('/api/broadcast/remote-pairing')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        tournamentId: tournamentA.customId,
        sessionId: `session-${tournamentA.customId}`,
      });

    const pairingToken = pairRes.body.data.pairingToken;

    // 2. User B (from Org B) tries to claim Org A's token
    const claimRes = await request(app)
      .post('/api/broadcast/remote-pairing/claim')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ token: pairingToken });

    expect(claimRes.status).toBe(403);
    expect(claimRes.body.success).toBe(false);
    expect(claimRes.body.error).toContain('ACCESS DENIED');
    expect(claimRes.body.error).toContain('You do not belong to the organization hosting this tournament');

    // Verify token was NOT consumed
    const session = await RemotePairingSession.findOne({ pairingToken });
    expect(session!.isConsumed).toBe(false);
  });

  it('successfully authorizes claiming by an operator from the SAME organization and enforces single-use', async () => {
    // 1. Org A generates pairing token
    const pairRes = await request(app)
      .post('/api/broadcast/remote-pairing')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        tournamentId: tournamentA.customId,
        sessionId: `session-${tournamentA.customId}`,
      });

    const pairingToken = pairRes.body.data.pairingToken;

    // 2. User A (Org A) claims the token
    const claimRes = await request(app)
      .post('/api/broadcast/remote-pairing/claim')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: pairingToken });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.data.token).toBeDefined(); // Authorized remote operator grant
    expect(claimRes.body.data.redirectUrl).toContain('/remote?session=');

    // Verify token is now marked consumed in database
    const session = await RemotePairingSession.findOne({ pairingToken });
    expect(session!.isConsumed).toBe(true);
    expect(session!.consumedByUserId).toBe(userA._id.toString());

    // 3. Second attempt to claim same token fails immediately (single-use enforcement)
    const secondClaimRes = await request(app)
      .post('/api/broadcast/remote-pairing/claim')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: pairingToken });

    expect(secondClaimRes.status).toBe(400);
    expect(secondClaimRes.body.error).toContain('already been claimed');
  });

  it('rejects expired pairing tokens with 400', async () => {
    const expiredSession = await RemotePairingSession.create({
      pairingToken: 'expired-token-999',
      organizationId: orgA._id.toString(),
      tournamentId: tournamentA.customId,
      sessionId: `session-${tournamentA.customId}`,
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      isConsumed: false,
    });

    const res = await request(app)
      .post('/api/broadcast/remote-pairing/claim')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ token: expiredSession.pairingToken });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('expired');
  });
});

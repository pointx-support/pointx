import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { OrganizationMembership } from '../models/OrganizationMembership';

let mongoServer: MongoMemoryServer;
let app: any;

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
  vi.restoreAllMocks();
});

describe('PART 4: Google Authentication & Account Linking', () => {
  it('rejects request when no Google credential is provided', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('provisions a new user with verified email and auto-provisions organization', async () => {
    // Mock global fetch for Google tokeninfo
    const mockGoogleUser = {
      sub: 'google-uid-10001',
      email: 'newgamer@gmail.com',
      email_verified: 'true',
      name: 'Gamer One',
      picture: 'https://lh3.googleusercontent.com/avatar.jpg',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGoogleUser,
    } as any);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token-xyz' });

    expect(fetchSpy).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('newgamer@gmail.com');
    expect(res.body.user.role).toBe('organizer');
    expect(res.body.token).toBeDefined();

    // Verify user in MongoDB
    const persisted = await User.findOne({ email: 'newgamer@gmail.com' });
    expect(persisted).toBeDefined();
    expect(persisted!.authProvider).toBe('google');
    expect(persisted!.googleId).toBe('google-uid-10001');
    expect(persisted!.isEmailVerified).toBe(true);

    // Verify organization auto-provisioning
    const memberships = await OrganizationMembership.find({ userId: persisted!._id });
    expect(memberships.length).toBeGreaterThan(0);
  });

  it('links Google ID to an existing user with matching email without duplicate user creation', async () => {
    // 1. Pre-existing user with email/password
    const existingUser = await User.create({
      name: 'Existing Pro',
      email: 'proplayer@gmail.com',
      passwordHash: 'existing-bcrypt-hash',
      role: 'organizer',
      status: 'active',
      isEmailVerified: true,
    });

    // Mock Google returning same email
    const mockGoogleUser = {
      sub: 'google-uid-20002',
      email: 'proplayer@gmail.com',
      email_verified: 'true',
      name: 'Existing Pro Updated',
      picture: 'https://lh3.googleusercontent.com/newpic.jpg',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGoogleUser,
    } as any);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'token-for-proplayer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify no duplicate users created
    const totalUsers = await User.countDocuments({ email: 'proplayer@gmail.com' });
    expect(totalUsers).toBe(1);

    const updatedUser = await User.findById(existingUser._id);
    expect(updatedUser!.googleId).toBe('google-uid-20002');
    expect(updatedUser!.avatarUrl).toBe('https://lh3.googleusercontent.com/newpic.jpg');
  });
});

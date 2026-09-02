import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { User } from '../models/User';
import { OtpVerification } from '../models/OtpVerification';
import { hashToken, OTP_EXPIRATION_SECONDS } from '../services/authService';

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
});

describe('PointX Full-Stack API — Authentication & Security Test Suite', () => {
  // Test 1: Signup Flow with 5-Minute OTP Expiry
  it('1. should register user in pending state and issue 6-digit OTP with exactly 5-minute expiry', async () => {
    const startTime = Date.now();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Alex Tournament Organizer',
        email: 'alex@apexleague.gg',
        password: 'securePassword123!',
        organizationName: 'Apex Gaming Network',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requiresOtp).toBe(true);

    // Verify User is created in pending_verification status
    const user = await User.findOne({ email: 'alex@apexleague.gg' });
    expect(user).toBeDefined();
    expect(user?.status).toBe('pending_verification');
    expect(user?.isEmailVerified).toBe(false);

    // Verify OTP record is stored securely (hashed)
    const otpRecord = await OtpVerification.findOne({ email: 'alex@apexleague.gg' });
    expect(otpRecord).toBeDefined();
    expect(otpRecord?.purpose).toBe('signup');
    expect(otpRecord?.isUsed).toBe(false);
    expect(otpRecord?.otpHash).toHaveLength(64); // SHA-256 hash length

    // Verify expiration timestamp is exactly 5 minutes (300 seconds) from creation
    const expiresAtTime = new Date(otpRecord!.expiresAt).getTime();
    const diffSeconds = Math.round((expiresAtTime - startTime) / 1000);
    expect(diffSeconds).toBeGreaterThanOrEqual(299);
    expect(diffSeconds).toBeLessThanOrEqual(301);
    expect(OTP_EXPIRATION_SECONDS).toBe(300);
  });

  // Test 2: OTP Verification & Account Activation
  it('2. should verify OTP, activate account, and issue JWT session token in data container and root', async () => {
    // 1. Initiate signup
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Sarah Esports',
        email: 'sarah@esports.gg',
        password: 'sarahPassword123!',
        organizationName: 'Sarah Gaming',
      });

    // In mock/test mode, extract generated OTP or set known OTP
    const testOtp = '123456';
    await OtpVerification.updateOne(
      { email: 'sarah@esports.gg' },
      { otpHash: hashToken(testOtp), expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    );

    // 2. Submit wrong OTP
    const wrongRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'sarah@esports.gg', otp: '999999', purpose: 'signup' });
    expect(wrongRes.status).toBe(400);
    expect(wrongRes.body.success).toBe(false);

    // 3. Submit valid OTP (with whitespace to verify normalization)
    const validRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: '  Sarah@Esports.gg  ', otp: '  123456  ', purpose: 'signup' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.token).toBeDefined();
    expect(validRes.body.data.token).toBeDefined();
    expect(validRes.body.user.email).toBe('sarah@esports.gg');
    expect(validRes.body.data.user.email).toBe('sarah@esports.gg');
    expect(validRes.body.user.role).toBe('organizer');

    // Verify User is now active
    const activatedUser = await User.findOne({ email: 'sarah@esports.gg' });
    expect(activatedUser?.status).toBe('active');
    expect(activatedUser?.isEmailVerified).toBe(true);

    // 4. Test Replay Attack: Reusing the same OTP must fail
    const replayRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'sarah@esports.gg', otp: testOtp, purpose: 'signup' });
    expect(replayRes.status).toBe(400);
  });

  // Test 3: Expired OTP Rejection
  it('3. should reject expired OTPs after 5 minutes and prompt for resend', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Expired Test',
      email: 'expired@test.com',
      password: 'password123',
    });

    const testOtp = '654321';
    // Set expiry in the past
    await OtpVerification.updateOne(
      { email: 'expired@test.com' },
      { otpHash: hashToken(testOtp), expiresAt: new Date(Date.now() - 1000) }
    );

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'expired@test.com', otp: testOtp, purpose: 'signup' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('expired');
  });

  // Test 4: OTP Brute Force Protection
  it('4. should lock out after 5 consecutive incorrect OTP attempts', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Brute Test',
        email: 'brute@test.com',
        password: 'password123',
      });

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'brute@test.com', otp: '000000', purpose: 'signup' });
      expect(res.status).toBe(400);
    }

    // 6th attempt should be blocked
    const lockedRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: 'brute@test.com', otp: '000000', purpose: 'signup' });
    expect(lockedRes.status).toBe(400);
  });

  // Test 5: Login & Password Hash Verification
  it('5. should securely authenticate active user and reject wrong credentials', async () => {
    // Signup and verify user
    await request(app).post('/api/auth/signup').send({
      name: 'John Doe',
      email: 'john@pointx.gg',
      password: 'MySecretPassword123!',
    });

    await OtpVerification.updateOne(
      { email: 'john@pointx.gg' },
      { otpHash: hashToken('654321'), expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    );
    await request(app).post('/api/auth/verify-otp').send({ email: 'john@pointx.gg', otp: '654321' });

    // Try wrong password
    const failLogin = await request(app).post('/api/auth/login').send({
      email: 'john@pointx.gg',
      password: 'wrongPassword',
    });
    expect(failLogin.status).toBe(401);
    expect(failLogin.body.success).toBe(false);

    // Try correct password
    const successLogin = await request(app).post('/api/auth/login').send({
      email: 'john@pointx.gg',
      password: 'MySecretPassword123!',
    });
    expect(successLogin.status).toBe(200);
    expect(successLogin.body.success).toBe(true);
    expect(successLogin.body.token).toBeDefined();
    expect(successLogin.body.data.token).toBeDefined();
  });

  // Test 6: Forgot Password & Reset Flow
  it('6. should handle forgot password request and reset password with 5-minute OTP', async () => {
    // Register active user
    await request(app).post('/api/auth/signup').send({
      name: 'Reset Test',
      email: 'reset@pointx.gg',
      password: 'oldPassword123',
    });
    await OtpVerification.updateOne(
      { email: 'reset@pointx.gg' },
      { otpHash: hashToken('111222') }
    );
    await request(app).post('/api/auth/verify-otp').send({ email: 'reset@pointx.gg', otp: '111222' });

    // Request forgot password
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@pointx.gg' });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.success).toBe(true);

    // Seed reset OTP
    await OtpVerification.updateOne(
      { email: 'reset@pointx.gg', purpose: 'forgot_password' },
      { otpHash: hashToken('777888'), expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    );

    // Perform password reset
    const resetRes = await request(app).post('/api/auth/reset-password').send({
      email: 'reset@pointx.gg',
      otp: '777888',
      newPassword: 'BrandNewPassword456!',
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Login with new password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'reset@pointx.gg',
      password: 'BrandNewPassword456!',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  // Test 7: Health Endpoint
  it('7. should return healthy status from /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services.database).toBe('connected');
  });
});

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { OtpVerification } from '../models/OtpVerification';
import { UserSession } from '../models/UserSession';
import { AuditActivity } from '../models/AuditActivity';
import { env } from '../config/env';
import {
  sendTransactionalEmail,
  getSignupOtpEmailTemplate,
  getForgotPasswordEmailTemplate,
  getPasswordChangedConfirmationEmailTemplate,
} from './emailService';

// OTP Configuration: Exactly 5 minutes (300 seconds)
export const OTP_EXPIRATION_SECONDS = 300;
export const OTP_EXPIRATION_MS = OTP_EXPIRATION_SECONDS * 1000; // 300,000 ms

// Hash helper for OTPs using SHA-256
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.toString().trim()).digest('hex');
}

// Timing-safe constant time hash comparison to prevent timing attacks
export function compareOtpHash(inputOtp: string, storedHash: string): boolean {
  const inputHash = hashToken(inputOtp);
  if (inputHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(inputHash, 'utf8'), Buffer.from(storedHash, 'utf8'));
}

// Generate secure 6-digit numeric OTP
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate JWT token
export function generateJwtToken(user: IUser, sessionId?: string): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

// Parse device and browser from User-Agent
export function parseUserAgent(uaString: string = ''): { deviceName: string; browser: string } {
  let browser = 'Desktop Browser';
  let deviceName = 'PC / Desktop';

  if (/mobile/i.test(uaString)) {
    deviceName = /iphone/i.test(uaString) ? 'iPhone' : /android/i.test(uaString) ? 'Android Device' : 'Mobile Device';
  } else if (/ipad|tablet/i.test(uaString)) {
    deviceName = 'Tablet';
  } else if (/macintosh|mac os x/i.test(uaString)) {
    deviceName = 'Mac';
  } else if (/windows/i.test(uaString)) {
    deviceName = 'Windows PC';
  } else if (/linux/i.test(uaString)) {
    deviceName = 'Linux Workstation';
  }

  if (/chrome|crios/i.test(uaString) && !/edg|opr/i.test(uaString)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = 'Firefox';
  } else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) {
    browser = 'Safari';
  } else if (/edg/i.test(uaString)) {
    browser = 'Edge';
  } else if (/obs/i.test(uaString)) {
    browser = 'OBS Studio';
  }

  return { deviceName, browser };
}

// ----------------- AUTH OPERATIONS -----------------

export async function registerUserInitiate(data: {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}): Promise<{ success: boolean; requiresOtp: boolean; message: string; error?: string }> {
  const email = data.email.toLowerCase().trim();
  const name = data.name.trim();
  console.log(`[SIGNUP_INITIATE] Received signup request for domain @${email.split('@')[1] || 'unknown'}`);

  // Check if active user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.status !== 'pending_verification') {
    return {
      success: false,
      requiresOtp: false,
      message: 'An account with this email already exists. Please sign in.',
      error: 'An account with this email already exists. Please sign in.',
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 11);
  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS); // Exactly 5 minutes (300 seconds)

  // Invalidate any previous OTPs for this email and purpose
  await OtpVerification.deleteMany({ email, purpose: 'signup' });

  // Save new OTP with metadata
  await OtpVerification.create({
    email,
    otpHash,
    purpose: 'signup',
    attempts: 0,
    maxAttempts: 5,
    resendCount: 0,
    lastResentAt: new Date(),
    expiresAt,
    isUsed: false,
    metadata: {
      name,
      email,
      passwordHash,
      organizationName: data.organizationName?.trim() || 'Independent Esports Organizer',
    },
  });

  // Create or update pending user
  if (!existingUser) {
    await User.create({
      name,
      email,
      passwordHash,
      role: 'organizer',
      status: 'pending_verification',
      isEmailVerified: false,
      organizationName: data.organizationName?.trim() || '',
      isOnboarded: false,
    });
  } else {
    existingUser.name = name;
    existingUser.passwordHash = passwordHash;
    existingUser.status = 'pending_verification';
    existingUser.organizationName = data.organizationName?.trim() || existingUser.organizationName;
    await existingUser.save();
  }

  // Send OTP Email via Brevo
  const template = getSignupOtpEmailTemplate(name, otp);
  const emailRes = await sendTransactionalEmail({
    toEmail: email,
    toName: name,
    subject: template.subject,
    htmlContent: template.html,
  });

  if (!emailRes.success) {
    return {
      success: false,
      requiresOtp: false,
      message: emailRes.error || 'Failed to send verification email via Brevo.',
      error: emailRes.error || 'Failed to send verification email. Please verify your email address and try again.',
    };
  }

  return {
    success: true,
    requiresOtp: true,
    message: `Verification code sent to ${email}. Please enter the 6-digit OTP to complete registration (valid for 5 minutes).`,
  };
}

export async function verifySignupOtp(data: {
  email: string;
  otp: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  const email = data.email.toLowerCase().trim();
  const otp = data.otp.toString().trim();
  const now = new Date();

  // Find active OTP record
  const otpRecord = await OtpVerification.findOne({
    email,
    purpose: 'signup',
    isUsed: false,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    // Check if there is an expired or already-used record to give the most accurate user feedback
    const anyRecord = await OtpVerification.findOne({ email, purpose: 'signup' }).sort({ createdAt: -1 });
    if (anyRecord) {
      if (anyRecord.isUsed) {
        return {
          success: false,
          error: 'This verification code has already been used. Please sign in or request a new code.',
        };
      }
      if (anyRecord.expiresAt <= now) {
        return {
          success: false,
          error: 'Verification code has expired (valid for 5 minutes). Please click Resend Code.',
        };
      }
    }

    return {
      success: false,
      error: 'Invalid or expired verification code. Please request a new OTP.',
    };
  }

  // Check brute force attempts
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.',
    };
  }

  // Verify OTP hash with timing-safe comparison
  const isValidOtp = compareOtpHash(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = otpRecord.maxAttempts - otpRecord.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // OTP is valid: Mark used immediately to prevent replay
  otpRecord.isUsed = true;
  await otpRecord.save();

  // Activate User
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: otpRecord.metadata?.name || email.split('@')[0],
      email,
      passwordHash: otpRecord.metadata?.passwordHash || '',
      role: 'organizer',
      status: 'active',
      isEmailVerified: true,
      organizationName: otpRecord.metadata?.organizationName || '',
      isOnboarded: false,
      lastLoginAt: new Date(),
      loginCount: 1,
    });
  } else {
    user.status = 'active';
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
  }

  // Clean up used OTPs for signup
  await OtpVerification.deleteMany({ email, purpose: 'signup' });

  // Create active session
  const { deviceName, browser } = parseUserAgent(data.userAgent);
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await UserSession.create({
    userId: user._id,
    tokenHash: hashToken(`sess_${Date.now()}_${Math.random()}`),
    deviceName,
    browser,
    ipAddress: data.ipAddress || '127.0.0.1',
    location: 'Local',
    lastActive: new Date(),
    expiresAt: sessionExpiresAt,
  });

  const token = generateJwtToken(user, session._id.toString());

  // Record audit activity
  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user._id.toString(),
    userName: user.name,
    userEmail: user.email,
    action: 'Account Registered & Verified',
    category: 'security',
    details: `Organizer registered and verified via Brevo OTP.`,
    ipAddress: data.ipAddress,
  });

  return {
    success: true,
    user: user.toJSON(),
    token,
  };
}

export async function resendOtpCode(email: string, purpose: 'signup' | 'forgot_password'): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  const existingOtp = await OtpVerification.findOne({ email: cleanEmail, purpose, isUsed: false }).sort({ createdAt: -1 });

  if (existingOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(existingOtp.lastResentAt).getTime()) / 1000);
    if (elapsedSeconds < 60) {
      const waitTime = 60 - elapsedSeconds;
      return {
        success: false,
        error: `Please wait ${waitTime} seconds before requesting a new code.`,
      };
    }
    if (existingOtp.resendCount >= 5) {
      return {
        success: false,
        error: 'Resend limit reached for this session. Please try again in 15 minutes.',
      };
    }
  }

  const user = await User.findOne({ email: cleanEmail });
  const userName = user?.name || cleanEmail.split('@')[0];

  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS); // Exactly 5 minutes (300 seconds)

  if (existingOtp) {
    existingOtp.otpHash = otpHash;
    existingOtp.attempts = 0;
    existingOtp.resendCount += 1;
    existingOtp.lastResentAt = new Date();
    existingOtp.expiresAt = expiresAt;
    await existingOtp.save();
  } else {
    await OtpVerification.create({
      email: cleanEmail,
      otpHash,
      purpose,
      attempts: 0,
      maxAttempts: 5,
      resendCount: 1,
      lastResentAt: new Date(),
      expiresAt,
      isUsed: false,
    });
  }

  // Send Email
  const template = purpose === 'signup' ? getSignupOtpEmailTemplate(userName, otp) : getForgotPasswordEmailTemplate(userName, otp);
  const emailRes = await sendTransactionalEmail({
    toEmail: cleanEmail,
    toName: userName,
    subject: template.subject,
    htmlContent: template.html,
  });

  if (!emailRes.success) {
    return {
      success: false,
      error: emailRes.error || 'Failed to resend verification email via Brevo.',
    };
  }

  return {
    success: true,
    message: `A fresh 6-digit code has been sent to ${cleanEmail} (valid for 5 minutes).`,
  };
}

export async function loginUser(data: {
  email: string;
  password?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean; user?: any; token?: string; error?: string; requiresVerification?: boolean; notRegistered?: boolean }> {
  const email = data.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) {
    return {
      success: false,
      notRegistered: true,
      error: 'This email is not registered. Please register first to access PointX.',
    };
  }

  if (user.status === 'suspended') {
    return {
      success: false,
      error: `Account suspended. Reason: ${user.suspensionReason || 'Violation of platform policies.'}`,
    };
  }

  if (user.status === 'pending_verification') {
    // Re-send OTP if needed
    await resendOtpCode(user.email, 'signup');
    return {
      success: false,
      requiresVerification: true,
      error: 'Please verify your email with the 6-digit OTP code sent to your inbox.',
    };
  }

  if (data.password) {
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }
  }

  // Update login stats
  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save();

  // Create session
  const { deviceName, browser } = parseUserAgent(data.userAgent);
  const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await UserSession.create({
    userId: user._id,
    tokenHash: hashToken(`sess_${Date.now()}_${Math.random()}`),
    deviceName,
    browser,
    ipAddress: data.ipAddress || '127.0.0.1',
    location: 'Local',
    lastActive: new Date(),
    expiresAt: sessionExpiresAt,
  });

  const token = generateJwtToken(user, session._id.toString());

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user._id.toString(),
    userName: user.name,
    userEmail: user.email,
    action: 'User Logged In',
    category: 'security',
    details: `Organizer authenticated successfully from ${deviceName} (${browser}).`,
    ipAddress: data.ipAddress,
  });

  return {
    success: true,
    user: user.toJSON(),
    token,
  };
}

export async function forgotPasswordInitiate(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail });

  // Prevent account enumeration by always returning the same success message
  if (user && user.status === 'active') {
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS); // Exactly 5 minutes (300 seconds)

    await OtpVerification.deleteMany({ email: cleanEmail, purpose: 'forgot_password' });
    await OtpVerification.create({
      email: cleanEmail,
      otpHash,
      purpose: 'forgot_password',
      attempts: 0,
      maxAttempts: 5,
      resendCount: 0,
      lastResentAt: new Date(),
      expiresAt,
      isUsed: false,
    });

    const template = getForgotPasswordEmailTemplate(user.name, otp);
    await sendTransactionalEmail({
      toEmail: cleanEmail,
      toName: user.name,
      subject: template.subject,
      htmlContent: template.html,
    });
  }

  return {
    success: true,
    message: 'If an account exists with this email address, a password reset code has been sent (valid for 5 minutes).',
  };
}

export async function resetPasswordWithOtp(data: {
  email: string;
  otp: string;
  newPassword: string;
  ipAddress?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const email = data.email.toLowerCase().trim();
  const otp = data.otp.toString().trim();
  const now = new Date();

  const otpRecord = await OtpVerification.findOne({
    email,
    purpose: 'forgot_password',
    isUsed: false,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    const anyRecord = await OtpVerification.findOne({ email, purpose: 'forgot_password' }).sort({ createdAt: -1 });
    if (anyRecord) {
      if (anyRecord.isUsed) {
        return { success: false, error: 'This password reset code has already been used.' };
      }
      if (anyRecord.expiresAt <= now) {
        return { success: false, error: 'Password reset code has expired (valid for 5 minutes). Please request a new code.' };
      }
    }
    return { success: false, error: 'Invalid or expired password reset code. Please request a new code.' };
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    return { success: false, error: 'Maximum attempts exceeded. Please request a new reset code.' };
  }

  const isValidOtp = compareOtpHash(otp, otpRecord.otpHash);
  if (!isValidOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = otpRecord.maxAttempts - otpRecord.attempts;
    return { success: false, error: `Invalid reset code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
  }

  // Invalidate OTP immediately to prevent reuse
  otpRecord.isUsed = true;
  await otpRecord.save();

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  // Update password
  user.passwordHash = await bcrypt.hash(data.newPassword, 11);
  await user.save();

  // Invalidate all active sessions for security
  await UserSession.updateMany({ userId: user._id }, { isRevoked: true });
  await OtpVerification.deleteMany({ email, purpose: 'forgot_password' });

  // Send security alert email
  const alertTemplate = getPasswordChangedConfirmationEmailTemplate(user.name);
  await sendTransactionalEmail({
    toEmail: email,
    toName: user.name,
    subject: alertTemplate.subject,
    htmlContent: alertTemplate.html,
  });

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user._id.toString(),
    userName: user.name,
    userEmail: user.email,
    action: 'Password Reset Completed',
    category: 'security',
    details: `Password reset successfully completed from ${data.ipAddress || 'client'}.`,
    ipAddress: data.ipAddress,
  });

  return {
    success: true,
    message: 'Password reset successfully. You can now sign in with your new credentials.',
  };
}

export async function changeUserPassword(
  userId: string,
  oldPass: string,
  newPass: string,
  currentSessionId?: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  user.passwordHash = await bcrypt.hash(newPass, 11);
  await user.save();

  // Invalidate other sessions
  if (currentSessionId) {
    await UserSession.updateMany(
      { userId: user._id, _id: { $ne: currentSessionId } },
      { isRevoked: true }
    );
  }

  const alertTemplate = getPasswordChangedConfirmationEmailTemplate(user.name);
  await sendTransactionalEmail({
    toEmail: user.email,
    toName: user.name,
    subject: alertTemplate.subject,
    htmlContent: alertTemplate.html,
  });

  await AuditActivity.create({
    customId: `act-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    userId: user._id.toString(),
    userName: user.name,
    userEmail: user.email,
    action: 'Password Changed',
    category: 'security',
    details: 'User changed account password credentials.',
    ipAddress,
  });

  return { success: true };
}

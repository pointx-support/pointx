import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  organizationName: z.string().trim().max(150).optional().default(''),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain numbers only'),
  purpose: z.enum(['signup', 'forgot_password']).default('signup'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  purpose: z.enum(['signup', 'forgot_password']).default('signup'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain numbers only'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  organizationName: z.string().trim().max(150).optional(),
  organizationLogoUrl: z.string().optional(),
  defaultTournamentTitle: z.string().optional(),
  tournamentLogoUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(['male', 'female', 'prefer-not-to-say', '']).optional(),
  orgSize: z.string().optional(),
  heardFrom: z.string().optional(),
  isOnboarded: z.boolean().optional(),
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  organizationName: z.string().trim().min(2, 'Organisation name is required'),
  phoneNumber: z.string().trim().min(5, 'Phone number is required'),
  gender: z.enum(['male', 'female', 'prefer-not-to-say']),
  orgSize: z.string().min(1, 'Organisation size is required'),
  heardFrom: z.string().trim().min(1, 'Source selection is required'),
});

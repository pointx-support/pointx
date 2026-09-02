import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { updateProfileSchema, onboardingSchema } from '../validation/authSchemas';
import { AuditActivity } from '../models/AuditActivity';

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const validated = updateProfileSchema.parse(req.body);
    const user = req.user;

    if (validated.name !== undefined) user.name = validated.name.trim();
    if (validated.organizationName !== undefined) user.organizationName = validated.organizationName.trim();
    if (validated.organizationLogoUrl !== undefined) user.organizationLogoUrl = validated.organizationLogoUrl;
    if (validated.defaultTournamentTitle !== undefined) user.defaultTournamentTitle = validated.defaultTournamentTitle;
    if (validated.tournamentLogoUrl !== undefined) user.tournamentLogoUrl = validated.tournamentLogoUrl;
    if (validated.avatarUrl !== undefined) user.avatarUrl = validated.avatarUrl;
    if (validated.phoneNumber !== undefined) user.phoneNumber = validated.phoneNumber.trim();
    if (validated.gender !== undefined) user.gender = validated.gender;
    if (validated.orgSize !== undefined) user.orgSize = validated.orgSize;
    if (validated.heardFrom !== undefined) user.heardFrom = validated.heardFrom;
    if (validated.isOnboarded !== undefined) user.isOnboarded = validated.isOnboarded;

    await user.save();

    await AuditActivity.create({
      customId: `act-${Date.now().toString(36)}`,
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      action: 'Profile Updated',
      category: 'security',
      details: 'User updated personal profile and organization settings.',
    });

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function completeOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const validated = onboardingSchema.parse(req.body);
    const user = req.user;

    user.name = validated.name.trim();
    user.organizationName = validated.organizationName.trim();
    user.phoneNumber = validated.phoneNumber.trim();
    user.gender = validated.gender;
    user.orgSize = validated.orgSize;
    user.heardFrom = validated.heardFrom;
    user.isOnboarded = true;

    await user.save();

    await AuditActivity.create({
      customId: `act-${Date.now().toString(36)}`,
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      action: 'Onboarding Completed',
      category: 'security',
      details: `Completed onboarding profile for ${user.organizationName}.`,
    });

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const prefs = req.body;
    req.user.preferences = {
      ...req.user.preferences,
      ...prefs,
    };

    await req.user.save();

    return res.status(200).json({
      success: true,
      preferences: req.user.preferences,
    });
  } catch (error) {
    next(error);
  }
}

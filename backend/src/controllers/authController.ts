import { Request, Response, NextFunction } from 'express';
import {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validation/authSchemas';
import {
  registerUserInitiate,
  verifySignupOtp,
  resendOtpCode,
  loginUser,
  forgotPasswordInitiate,
  resetPasswordWithOtp,
  changeUserPassword,
} from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserSession } from '../models/UserSession';
import { env } from '../config/env';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = signupSchema.parse(req.body);
    const result = await registerUserInitiate(validated);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || result.message });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = verifyOtpSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const result = await verifySignupOtp({
      email: validated.email,
      otp: validated.otp,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Set secure cookie
    if (result.token) {
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = resendOtpSchema.parse(req.body);
    const result = await resendOtpCode(validated.email, validated.purpose);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = loginSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const result = await loginUser({
      email: validated.email,
      password: validated.password,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      const statusCode = result.requiresVerification ? 403 : result.notRegistered ? 404 : 401;
      return res.status(statusCode).json(result);
    }

    if (result.token) {
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.sessionRecord) {
      await UserSession.findByIdAndUpdate(req.sessionRecord._id, { isRevoked: true, lastActive: new Date() });
    }

    res.clearCookie('token');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const sessions = await UserSession.find({
      userId: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActive: -1 });

    const currentSessionId = req.sessionRecord?._id.toString();

    const formattedSessions = sessions.map((s) => ({
      id: s._id.toString(),
      deviceName: s.deviceName,
      browser: s.browser,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActive: s.lastActive.toISOString(),
      isCurrent: s._id.toString() === currentSessionId,
    }));

    return res.status(200).json({
      success: true,
      user: req.user.toJSON(),
      sessions: formattedSessions,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const result = await forgotPasswordInitiate(validated.email);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = await resetPasswordWithOtp({
      email: validated.email,
      otp: validated.otp,
      newPassword: validated.newPassword,
      ipAddress,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const validated = changePasswordSchema.parse(req.body);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = await changeUserPassword(
      req.user._id.toString(),
      validated.oldPassword,
      validated.newPassword,
      ipAddress
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function terminateOtherSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const currentSessionId = req.sessionRecord?._id;
    await UserSession.updateMany(
      { userId: req.user._id, _id: { $ne: currentSessionId } },
      { isRevoked: true }
    );

    return res.status(200).json({ success: true, message: 'Remote sessions terminated.' });
  } catch (error) {
    next(error);
  }
}

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { env } from '../config/env';
import { UserSession } from '../models/UserSession';
import {
  verifySuperAdminLogin,
  getPaginatedOrganizers,
  approveOrganizer,
  rejectOrganizer,
  suspendUser,
  restoreUser,
  updateOrganizerProfile,
  deleteUserPermanently,
  getOverviewMetrics,
  getMongoDbTelemetry,
  getCloudinaryTelemetry,
  getBrevoTelemetry,
  testBrevoConnection,
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformAuditLogs,
  changeSuperAdminPassword,
} from '../services/adminService';
import { User } from '../models/User';
import { AuditActivity } from '../models/AuditActivity';

/**
 * 1. Super Admin Sign In Endpoint
 */
export async function adminLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    const adminUser = await verifySuperAdminLogin(username, password);

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Super Admin credentials.',
      });
    }

    // Create session record
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const tempTokenHash = `admin-sess-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sessionRecord = await UserSession.create({
      userId: adminUser._id,
      tokenHash: tempTokenHash,
      deviceName: userAgent,
      browser: 'Chrome',
      ipAddress,
      expiresAt,
    });

    const token = jwt.sign(
      {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
        sessionId: sessionRecord._id.toString(),
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    sessionRecord.tokenHash = token;
    await sessionRecord.save();

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record login in audit log
    await AuditActivity.create({
      customId: `act-${Date.now().toString(36)}`,
      userId: adminUser._id.toString(),
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'SUPER_ADMIN_LOGIN',
      category: 'security',
      details: 'Super Admin successfully authenticated.',
      ipAddress,
    });

    // Check if using default bootstrap password
    const mustChangePassword = password === 'sudo-pointx';

    return res.status(200).json({
      success: true,
      message: 'Super Admin authentication successful.',
      token,
      mustChangePassword,
      user: adminUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleAdminChangePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.user?._id?.toString();

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const result = await changeSuperAdminPassword(adminId, oldPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Super Admin password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Get Current Super Admin Profile
 */
export async function getAdminMe(req: AuthenticatedRequest, res: Response) {
  return res.status(200).json({
    success: true,
    user: req.user?.toJSON(),
  });
}

/**
 * 3. High-Level Platform Overview Metrics
 */
export async function getOverviewStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const metrics = await getOverviewMetrics();
    return res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Paginated Organizers List
 */
export async function listOrganizers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '15', 10);
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const result = await getPaginatedOrganizers({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Get Organizer Details
 */
export async function getOrganizerDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Organizer not found.' });
    }

    const userJson = user.toJSON();
    return res.status(200).json({
      success: true,
      data: {
        ...userJson,
        organizerId: `ORG-${user._id.toString().slice(-6).toUpperCase()}`,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Organizer Lifecycle Actions (Approve, Reject, Suspend, Restore, Edit, Delete)
 */
export async function handleApproveOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await approveOrganizer(id, req.user);
    if (!user) return res.status(404).json({ success: false, error: 'Organizer not found.' });

    return res.status(200).json({
      success: true,
      message: `Organizer "${user.organizationName || user.name}" approved successfully.`,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRejectOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const user = await rejectOrganizer(id, reason, req.user);
    if (!user) return res.status(404).json({ success: false, error: 'Organizer not found.' });

    return res.status(200).json({
      success: true,
      message: `Organizer "${user.organizationName || user.name}" rejected.`,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleSuspendUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const user = await suspendUser(id, reason, req.user?._id?.toString());
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    return res.status(200).json({
      success: true,
      message: 'Organizer suspended successfully.',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRestoreUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await restoreUser(id, req.user?._id?.toString());
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    return res.status(200).json({
      success: true,
      message: 'Organizer restored to active standing.',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateOrganizer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await updateOrganizerProfile(id, req.body, req.user);
    if (!user) return res.status(404).json({ success: false, error: 'Organizer not found.' });

    return res.status(200).json({
      success: true,
      message: 'Organizer profile updated.',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const success = await deleteUserPermanently(id, req.user?._id?.toString());
    if (!success) return res.status(404).json({ success: false, error: 'User not found.' });

    return res.status(200).json({ success: true, message: 'Organizer account deleted permanently.' });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Real Service Monitoring Controllers (MongoDB, Cloudinary, Brevo)
 */
export async function getMongoDbStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const telemetry = await getMongoDbTelemetry();
    return res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    next(error);
  }
}

export async function getCloudinaryStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const telemetry = await getCloudinaryTelemetry();
    return res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    next(error);
  }
}

export async function getBrevoStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const telemetry = await getBrevoTelemetry();
    return res.status(200).json({ success: true, data: telemetry });
  } catch (error) {
    next(error);
  }
}

export async function handleTestBrevoConnection(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await testBrevoConnection();
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateBrevoConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { senderEmail, senderName } = req.body;
    if (senderEmail) env.BREVO_SENDER_EMAIL = senderEmail;
    if (senderName) env.BREVO_SENDER_NAME = senderName;

    await AuditActivity.create({
      customId: `act-${Date.now().toString(36)}`,
      userId: req.user?._id?.toString() || 'admin-root',
      action: 'UPDATE_BREVO_CONFIG',
      category: 'security',
      details: `Admin updated Brevo email config (Sender: ${env.BREVO_SENDER_NAME} <${env.BREVO_SENDER_EMAIL}>).`,
    });

    const telemetry = await getBrevoTelemetry();
    return res.status(200).json({ success: true, message: 'Brevo configuration updated.', data: telemetry });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. System Health & Settings
 */
export async function getSystemHealth(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const overview = await getOverviewMetrics();
    return res.status(200).json({
      success: true,
      data: {
        serverTimestamp: new Date().toISOString(),
        version: '2.4.0-Enterprise',
        uptimeSeconds: process.uptime(),
        services: overview.services,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function fetchPlatformSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const settings = await getPlatformSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function savePlatformSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const settings = await updatePlatformSettings(req.body, req.user?._id?.toString());
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function fetchAuditLogs(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const logs = await getPlatformAuditLogs();
    return res.status(200).json({ success: true, data: logs.map((l) => l.toJSON()) });
  } catch (error) {
    next(error);
  }
}

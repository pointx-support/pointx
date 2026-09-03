import { Router } from 'express';
import {
  adminLogin,
  getAdminMe,
  getOverviewStats,
  listOrganizers,
  getOrganizerDetails,
  getOrganizerTournaments,
  handleApproveOrganizer,
  handleRejectOrganizer,
  handleSuspendUser,
  handleRestoreUser,
  handleUpdateOrganizer,
  handleDeleteUser,
  getMongoDbStatus,
  getCloudinaryStatus,
  getBrevoStatus,
  handleTestBrevoConnection,
  handleUpdateBrevoConfig,
  getSystemHealth,
  fetchPlatformSettings,
  savePlatformSettings,
  fetchAuditLogs,
  handleAdminChangePassword,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// 1. Unauthenticated / Public Super Admin Login (Protected by rate limiting)
router.post('/login', authLimiter, adminLogin);

// 2. All subsequent Super Admin routes are strictly role-gated to authenticated Admins
router.use(authenticate, requireAdmin);

router.get('/me', getAdminMe);
router.post('/change-password', handleAdminChangePassword);
router.get('/overview', getOverviewStats);

// Organizer Management
router.get('/organizers', listOrganizers);
router.get('/users', listOrganizers); // Legacy endpoint compatibility
router.get('/organizers/:id', getOrganizerDetails);
router.get('/organizers/:id/tournaments', getOrganizerTournaments);
router.post('/organizers/:id/approve', handleApproveOrganizer);
router.post('/organizers/:id/reject', handleRejectOrganizer);
router.post('/organizers/:id/suspend', handleSuspendUser);
router.post('/users/:id/suspend', handleSuspendUser);
router.post('/organizers/:id/restore', handleRestoreUser);
router.post('/users/:id/restore', handleRestoreUser);
router.put('/organizers/:id', handleUpdateOrganizer);
router.delete('/organizers/:id', handleDeleteUser);
router.delete('/users/:id', handleDeleteUser);

// External Services Telemetry & Configuration
router.get('/mongodb/status', getMongoDbStatus);
router.get('/cloudinary/status', getCloudinaryStatus);
router.get('/brevo/status', getBrevoStatus);
router.post('/brevo/test', handleTestBrevoConnection);
router.put('/brevo/config', handleUpdateBrevoConfig);

// System Health & Settings
router.get('/health', getSystemHealth);
router.get('/settings', fetchPlatformSettings);
router.put('/settings', savePlatformSettings);

// Audit Logs
router.get('/audit-logs', fetchAuditLogs);

export default router;

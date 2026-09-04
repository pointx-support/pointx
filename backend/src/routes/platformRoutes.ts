import { Router, Request, Response } from 'express';
import { getMaintenanceStatus, refreshMaintenanceCache } from '../middleware/maintenance';

const router = Router();

// Public Platform Status & Maintenance Discovery Endpoint
router.get('/status', async (_req: Request, res: Response) => {
  try {
    await refreshMaintenanceCache();
  } catch {}
  const status = getMaintenanceStatus();
  return res.status(200).json({
    success: true,
    maintenanceMode: Boolean(status.maintenanceMode),
    maintenanceReason: status.maintenanceReason,
    customMessage: status.customMessage || '',
    estimatedReturnTime: status.estimatedReturnTime || null,
  });
});

export default router;

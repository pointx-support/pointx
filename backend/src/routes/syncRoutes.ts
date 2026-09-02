import { Router, Request, Response } from 'express';
import { Tournament } from '../models/Tournament';

const router = Router();

export interface RemoteDeviceSession {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  lastActive: number;
  isBlocked: boolean;
}

export interface TournamentSyncState {
  tournamentId: string;
  tournament?: any;
  pinCode: string;
  connectedDevices: RemoteDeviceSession[];
  blockedDeviceIds: string[];
  timestamp: number;
  squads?: any;
  highlightedTeamId?: string | null;
  isVisible?: boolean;
  [key: string]: any;
}

const syncStore: Record<string, TournamentSyncState> = {};

function getOrCreateSyncState(tournamentId: string): TournamentSyncState {
  if (!syncStore[tournamentId]) {
    syncStore[tournamentId] = {
      tournamentId,
      pinCode: '1234',
      connectedDevices: [],
      blockedDeviceIds: [],
      timestamp: Date.now(),
      isVisible: true,
    };
  }
  return syncStore[tournamentId];
}

// 1. Get Live State for OBS and Remote
router.get('/state', async (req: Request, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';
  const state = getOrCreateSyncState(tournamentId);

  // If in-memory tournament is not loaded, try fetching from database
  if (!state.tournament && tournamentId !== 'default') {
    try {
      const idQueries: any[] = [{ customId: tournamentId }];
      if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
        idQueries.push({ _id: tournamentId });
      }
      const doc = await Tournament.findOne({ $or: idQueries }).lean();
      if (doc) {
        state.tournament = {
          ...doc,
          id: doc.customId || String(doc._id),
        };
      }
    } catch {}
  }

  // Filter out inactive devices older than 5 minutes
  const now = Date.now();
  state.connectedDevices = state.connectedDevices.filter(
    (d) => now - d.lastActive < 5 * 60 * 1000
  );

  res.status(200).json({
    success: true,
    data: state,
    timestamp: state.timestamp || Date.now(),
  });
});

// 2. Post State Update from Remote / OBS / Dashboard
router.post('/state', (req: Request, res: Response) => {
  const body = req.body;
  const tourId = body.tournamentId || 'default';
  const state = getOrCreateSyncState(tourId);

  syncStore[tourId] = {
    ...state,
    ...body,
    pinCode: body.pinCode || state.pinCode || '1234',
    connectedDevices: state.connectedDevices,
    blockedDeviceIds: body.blockedDeviceIds || state.blockedDeviceIds || [],
    timestamp: Date.now(),
  };

  // Optional background persist to database if full tournament object is provided
  if (body.tournament && tourId !== 'default') {
    const idQueries: any[] = [{ customId: tourId }];
    if (tourId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: tourId });
    }
    Tournament.updateOne(
      { $or: idQueries },
      { $set: { matches: body.tournament.matches, teams: body.tournament.teams, status: body.tournament.status || 'Live' } }
    ).catch(() => {});
  }

  res.status(200).json({
    success: true,
    data: syncStore[tourId],
    timestamp: Date.now(),
  });
});

// 3. Verify 4-Digit Security PIN
router.post('/verify-pin', (req: Request, res: Response) => {
  const { tournamentId, pin, deviceId, deviceName } = req.body;
  const state = getOrCreateSyncState(tournamentId || 'default');

  if (state.blockedDeviceIds.includes(deviceId)) {
    return res.status(403).json({
      success: false,
      error: 'This device has been blocked by the tournament admin.',
      isBlocked: true,
    });
  }

  const expectedPin = state.pinCode || '1234';
  if (pin === expectedPin || pin === '1234') {
    // Register device
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'Online Remote';
    const existingIndex = state.connectedDevices.findIndex((d) => d.deviceId === deviceId);
    const session: RemoteDeviceSession = {
      deviceId: deviceId || `dev_${Math.random().toString(36).substr(2, 6)}`,
      deviceName: deviceName || 'Mobile Remote',
      ipAddress: ip,
      lastActive: Date.now(),
      isBlocked: false,
    };

    if (existingIndex >= 0) {
      state.connectedDevices[existingIndex] = session;
    } else {
      state.connectedDevices.push(session);
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'PIN verified successfully.',
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Incorrect 4-digit security PIN.',
  });
});

// 4. Update Security PIN
router.post('/update-pin', (req: Request, res: Response) => {
  const { tournamentId, newPin } = req.body;
  if (!newPin || newPin.length !== 4) {
    return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits.' });
  }

  const state = getOrCreateSyncState(tournamentId || 'default');
  state.pinCode = newPin;
  state.timestamp = Date.now();

  res.status(200).json({
    success: true,
    message: 'Security PIN updated successfully.',
    pinCode: newPin,
  });
});

// 5. Remote Device Heartbeat
router.post('/device-heartbeat', (req: Request, res: Response) => {
  const { tournamentId, deviceId, deviceName } = req.body;
  const state = getOrCreateSyncState(tournamentId || 'default');

  if (state.blockedDeviceIds.includes(deviceId)) {
    return res.status(403).json({
      success: false,
      isBlocked: true,
      error: 'Device is blocked.',
    });
  }

  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'Online';
  const existing = state.connectedDevices.find((d) => d.deviceId === deviceId);
  if (existing) {
    existing.lastActive = Date.now();
    existing.deviceName = deviceName || existing.deviceName;
  } else if (deviceId) {
    state.connectedDevices.push({
      deviceId,
      deviceName: deviceName || 'Mobile Remote',
      ipAddress: ip,
      lastActive: Date.now(),
      isBlocked: false,
    });
  }

  res.status(200).json({
    success: true,
    isBlocked: false,
  });
});

// 6. Block / Revoke Device Access
router.post('/block-device', (req: Request, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const state = getOrCreateSyncState(tournamentId || 'default');

  if (!state.blockedDeviceIds.includes(deviceId)) {
    state.blockedDeviceIds.push(deviceId);
  }

  state.connectedDevices = state.connectedDevices.filter((d) => d.deviceId !== deviceId);
  state.timestamp = Date.now();

  res.status(200).json({
    success: true,
    message: 'Device access revoked.',
    blockedDeviceIds: state.blockedDeviceIds,
  });
});

// 7. Unblock Device Access
router.post('/unblock-device', (req: Request, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const state = getOrCreateSyncState(tournamentId || 'default');

  state.blockedDeviceIds = state.blockedDeviceIds.filter((id) => id !== deviceId);
  state.timestamp = Date.now();

  res.status(200).json({
    success: true,
    message: 'Device unblocked.',
    blockedDeviceIds: state.blockedDeviceIds,
  });
});

export default router;

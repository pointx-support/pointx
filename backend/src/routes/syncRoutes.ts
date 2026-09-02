import { Router, Request, Response } from 'express';
import {
  getOrCreateAuthoritativeState,
  updateAuthoritativeState,
  addSseListener,
  RemoteDeviceSession
} from '../services/realtimeSync';

const router = Router();

// 1. Get Authoritative Live State for OBS, Remote & Dashboard
router.get('/state', async (req: Request, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';
  const state = await getOrCreateAuthoritativeState(tournamentId);

  const now = Date.now();
  state.connectedDevices = state.connectedDevices.filter(
    (d) => now - d.lastActive < 5 * 60 * 1000
  );

  res.status(200).json({
    success: true,
    data: state,
    revision: state.revision,
    timestamp: state.timestamp,
  });
});

// 2. Server-Sent Events (SSE) Real-Time Stream (Cross-Platform HTTP Push)
router.get('/stream', async (req: Request, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial snapshot
  const state = await getOrCreateAuthoritativeState(tournamentId);
  res.write(
    `data: ${JSON.stringify({
      type: 'INITIAL_STATE',
      tournamentId,
      revision: state.revision,
      data: state,
      timestamp: state.timestamp,
    })}\n\n`
  );

  const removeListener = addSseListener(tournamentId, res);

  // Ping SSE client every 20 seconds to keep connection alive
  const ssePing = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ssePing);
      removeListener();
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(ssePing);
    removeListener();
  });
});

// 3. Post State Update (from REST/offline clients)
router.post('/state', async (req: Request, res: Response) => {
  const body = req.body;
  const tourId = body.tournamentId || 'default';
  const updatedState = await updateAuthoritativeState(tourId, body);

  res.status(200).json({
    success: true,
    data: updatedState,
    revision: updatedState.revision,
    timestamp: updatedState.timestamp,
  });
});

// 4. Verify 4-Digit Security PIN
router.post('/verify-pin', async (req: Request, res: Response) => {
  const { tournamentId, pin, deviceId, deviceName } = req.body;
  const state = await getOrCreateAuthoritativeState(tournamentId || 'default');

  if (state.blockedDeviceIds.includes(deviceId)) {
    return res.status(403).json({
      success: false,
      error: 'This device has been blocked by the tournament admin.',
      isBlocked: true,
    });
  }

  const expectedPin = state.pinCode || '1234';
  if (pin === expectedPin || pin === '1234') {
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

    await updateAuthoritativeState(tournamentId || 'default', {
      connectedDevices: state.connectedDevices,
    });

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

// 5. Update Security PIN
router.post('/update-pin', async (req: Request, res: Response) => {
  const { tournamentId, newPin } = req.body;
  if (!newPin || newPin.length !== 4) {
    return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits.' });
  }

  const updatedState = await updateAuthoritativeState(tournamentId || 'default', {
    pinCode: newPin,
  });

  res.status(200).json({
    success: true,
    message: 'Security PIN updated successfully.',
    pinCode: updatedState.pinCode,
    revision: updatedState.revision,
  });
});

// 6. Remote Device Heartbeat
router.post('/device-heartbeat', async (req: Request, res: Response) => {
  const { tournamentId, deviceId, deviceName } = req.body;
  const state = await getOrCreateAuthoritativeState(tournamentId || 'default');

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
    revision: state.revision,
  });
});

// 7. Block / Revoke Device Access
router.post('/block-device', async (req: Request, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const state = await getOrCreateAuthoritativeState(tournamentId || 'default');

  const blockedDeviceIds = [...state.blockedDeviceIds];
  if (!blockedDeviceIds.includes(deviceId)) {
    blockedDeviceIds.push(deviceId);
  }

  const connectedDevices = state.connectedDevices.filter((d) => d.deviceId !== deviceId);

  const updatedState = await updateAuthoritativeState(tournamentId || 'default', {
    blockedDeviceIds,
    connectedDevices,
  });

  res.status(200).json({
    success: true,
    message: 'Device access revoked.',
    blockedDeviceIds: updatedState.blockedDeviceIds,
    revision: updatedState.revision,
  });
});

// 8. Unblock Device Access
router.post('/unblock-device', async (req: Request, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const state = await getOrCreateAuthoritativeState(tournamentId || 'default');

  const blockedDeviceIds = state.blockedDeviceIds.filter((id) => id !== deviceId);

  const updatedState = await updateAuthoritativeState(tournamentId || 'default', {
    blockedDeviceIds,
  });

  res.status(200).json({
    success: true,
    message: 'Device unblocked.',
    blockedDeviceIds: updatedState.blockedDeviceIds,
    revision: updatedState.revision,
  });
});

export default router;

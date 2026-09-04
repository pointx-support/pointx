import { Router, Response } from 'express';
import crypto from 'crypto';
import {
  getOrCreateAuthoritativeState,
  updateAuthoritativeState,
  addSseListener,
  sanitizeStateForBroadcast,
  RemoteDeviceSession
} from '../services/realtimeSync';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// 1. Get Authoritative Live State for OBS, Remote & Dashboard
router.get('/state', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';
  const state = await getOrCreateAuthoritativeState(tournamentId);

  const now = Date.now();
  state.connectedDevices = state.connectedDevices.filter(
    (d) => now - d.lastActive < 5 * 60 * 1000
  );

  const isOwnerOrAdmin = req.user && (
    req.user.role === 'admin' ||
    (state.tournament?.userId && String(state.tournament.userId) === String(req.user._id))
  );

  const dataToSend = isOwnerOrAdmin ? state : sanitizeStateForBroadcast(state);

  res.status(200).json({
    success: true,
    data: dataToSend,
    revision: state.revision,
    timestamp: state.timestamp,
  });
});

// 2. Server-Sent Events (SSE) Real-Time Stream (Cross-Platform HTTP Push)
router.get('/stream', async (req: AuthenticatedRequest, res: Response) => {
  const tournamentId = (req.query.tournamentId as string) || 'default';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial snapshot (sanitized for broadcast)
  const state = await getOrCreateAuthoritativeState(tournamentId);
  res.write(
    `data: ${JSON.stringify({
      type: 'INITIAL_STATE',
      tournamentId,
      revision: state.revision,
      data: sanitizeStateForBroadcast(state),
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
router.post('/state', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body || {};
  const tourId = body.tournamentId || (req.query.tournamentId as string) || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  // Authorization check:
  // 1. Authenticated user (tournament owner or admin)
  // 2. Or valid broadcast session token in header/body/query
  // 3. Or verified device in state.connectedDevices
  const tokenHeader = (req.headers['x-broadcast-token'] as string) || body.token || (req.query.token as string);
  const deviceId = (req.headers['x-device-id'] as string) || body.deviceId;

  const isOwnerOrAdmin = req.user && (
    req.user.role === 'admin' ||
    (state.tournament?.userId && String(state.tournament.userId) === String(req.user._id)) ||
    !state.tournament?.userId
  );
  const isValidSessionToken = tokenHeader && state.sessionToken && tokenHeader === state.sessionToken;
  const isVerifiedDevice = deviceId && state.connectedDevices.some(
    (d) => d.deviceId === deviceId && d.verified && !d.isBlocked && !state.blockedDeviceIds.includes(d.deviceId)
  );

  if (!isOwnerOrAdmin && !isValidSessionToken && !isVerifiedDevice) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized to update tournament state. Valid authentication or verified remote token required.',
    });
  }

  // Prevent overwriting internal security state
  const sanitized = { ...body };
  delete sanitized.pinCode;
  delete sanitized.sessionToken;
  delete sanitized.tokenExpiresAt;
  delete sanitized.blockedDeviceIds;

  const updatedState = await updateAuthoritativeState(tourId, sanitized);

  res.status(200).json({
    success: true,
    data: isOwnerOrAdmin ? updatedState : sanitizeStateForBroadcast(updatedState),
    revision: updatedState.revision,
    timestamp: updatedState.timestamp,
  });
});

// 4. Verify 4-Digit Security PIN
router.post('/verify-pin', async (req: AuthenticatedRequest, res: Response) => {
  const { tournamentId, pin, deviceId, deviceName } = req.body;
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  if (deviceId && state.blockedDeviceIds.includes(deviceId)) {
    return res.status(403).json({
      success: false,
      error: 'This device has been blocked by the tournament admin.',
      isBlocked: true,
    });
  }

  const expectedPin = state.pinCode || '1234';
  if (typeof pin === 'string' && safeCompare(pin, expectedPin)) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'Online Remote';
    const effectiveDeviceId = deviceId || `dev_${Math.random().toString(36).substr(2, 6)}`;
    const existingIndex = state.connectedDevices.findIndex((d) => d.deviceId === effectiveDeviceId);
    const session: RemoteDeviceSession = {
      deviceId: effectiveDeviceId,
      deviceName: deviceName || 'Mobile Remote',
      ipAddress: ip,
      lastActive: Date.now(),
      isBlocked: false,
      verified: true,
    };

    if (existingIndex >= 0) {
      state.connectedDevices[existingIndex] = session;
    } else {
      state.connectedDevices.push(session);
    }

    await updateAuthoritativeState(tourId, {
      connectedDevices: state.connectedDevices,
    });

    return res.status(200).json({
      success: true,
      verified: true,
      sessionToken: state.sessionToken,
      message: 'PIN verified successfully.',
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Incorrect 4-digit security PIN.',
  });
});

// 5. Update Security PIN
router.post('/update-pin', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { tournamentId, newPin } = req.body;
  if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits.' });
  }

  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  const isOwnerOrAdmin = req.user && (
    req.user.role === 'admin' ||
    (state.tournament?.userId && String(state.tournament.userId) === String(req.user._id)) ||
    !state.tournament?.userId
  );
  if (!isOwnerOrAdmin) {
    return res.status(403).json({ success: false, error: 'Only tournament organizer can update the PIN.' });
  }

  const updatedState = await updateAuthoritativeState(tourId, {
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
router.post('/device-heartbeat', async (req: AuthenticatedRequest, res: Response) => {
  const { tournamentId, deviceId, deviceName } = req.body;
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  if (deviceId && state.blockedDeviceIds.includes(deviceId)) {
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
      verified: false,
    });
  }

  res.status(200).json({
    success: true,
    isBlocked: false,
    revision: state.revision,
  });
});

// 7. Block / Revoke Device Access
router.post('/block-device', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  const isOwnerOrAdmin = req.user && (
    req.user.role === 'admin' ||
    (state.tournament?.userId && String(state.tournament.userId) === String(req.user._id)) ||
    !state.tournament?.userId
  );
  if (!isOwnerOrAdmin) {
    return res.status(403).json({ success: false, error: 'Only tournament organizer can block devices.' });
  }

  const blockedDeviceIds = [...state.blockedDeviceIds];
  if (deviceId && !blockedDeviceIds.includes(deviceId)) {
    blockedDeviceIds.push(deviceId);
  }

  const connectedDevices = state.connectedDevices.filter((d) => d.deviceId !== deviceId);

  const updatedState = await updateAuthoritativeState(tourId, {
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
router.post('/unblock-device', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { tournamentId, deviceId } = req.body;
  const tourId = tournamentId || 'default';
  const state = await getOrCreateAuthoritativeState(tourId);

  const isOwnerOrAdmin = req.user && (
    req.user.role === 'admin' ||
    (state.tournament?.userId && String(state.tournament.userId) === String(req.user._id)) ||
    !state.tournament?.userId
  );
  if (!isOwnerOrAdmin) {
    return res.status(403).json({ success: false, error: 'Only tournament organizer can unblock devices.' });
  }

  const blockedDeviceIds = state.blockedDeviceIds.filter((id) => id !== deviceId);

  const updatedState = await updateAuthoritativeState(tourId, {
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

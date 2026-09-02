import React, { useState, useEffect } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import { BroadcastFreeFireLiveOverlay } from './BroadcastFreeFireLiveOverlay';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import {
  Tv,
  Copy,
  ExternalLink,
  Sparkles,
  Smartphone,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Users,
  Ban,
  KeyRound
} from 'lucide-react';

interface RemoteDeviceSession {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  lastActive: number;
  isBlocked: boolean;
}

const TOKEN_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours

function getPersistentBroadcastToken(tournamentId: string): string {
  if (typeof window === 'undefined' || !window.localStorage) return 'px_live_token';
  const key = `pointx_broadcast_token_${tournamentId}`;
  const expiryKey = `pointx_broadcast_token_expiry_${tournamentId}`;

  const existing = window.localStorage.getItem(key);
  const expiry = Number(window.localStorage.getItem(expiryKey)) || 0;

  if (existing && expiry > Date.now()) {
    return existing;
  }

  const cleanId = (tournamentId || 'tour').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const newToken = `px_${cleanId}_${Math.random().toString(36).substring(2, 8)}`;
  window.localStorage.setItem(key, newToken);
  window.localStorage.setItem(expiryKey, String(Date.now() + TOKEN_TTL_MS));
  return newToken;
}

export const BroadcastControlView: React.FC = () => {
  const { currentTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [overlayType, setOverlayType] = useState<'live-squads' | 'standings' | 'match' | 'mvp' | 'lowerthird' | 'graphic'>('live-squads');
  const [token, setToken] = useState<string>(() => getPersistentBroadcastToken(currentTournament.id));

  // Security PIN and Devices State
  const [pinCode, setPinCode] = useState<string>('1234');
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [connectedDevices, setConnectedDevices] = useState<RemoteDeviceSession[]>([]);
  const [blockedDeviceIds, setBlockedDeviceIds] = useState<string[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const overlayUrl = `${origin}/?mode=broadcast&tournamentId=${currentTournament.id}&layout=${overlayType}&token=${token}`;
  const remoteUrl = `${origin}/?mode=remote&tournamentId=${currentTournament.id}&token=${token}`;

  const standings = calculateTournamentStandings(currentTournament);

  useEffect(() => {
    if (currentTournament.id) {
      setToken(getPersistentBroadcastToken(currentTournament.id));
    }
  }, [currentTournament.id]);

  // Poll live sync state for connected devices and active PIN across all networks
  useEffect(() => {
    let isMounted = true;

    const fetchSyncState = async () => {
      try {
        const res = await fetch(`/api/sync/state?tournamentId=${currentTournament.id}`);
        const data = await res.json();
        if (data.success && data.data && isMounted) {
          if (data.data.pinCode) setPinCode(data.data.pinCode);
          if (Array.isArray(data.data.connectedDevices)) setConnectedDevices(data.data.connectedDevices);
          if (Array.isArray(data.data.blockedDeviceIds)) setBlockedDeviceIds(data.data.blockedDeviceIds);
          if (data.data.sessionToken) {
            setToken(data.data.sessionToken);
            window.localStorage.setItem(`pointx_broadcast_token_${currentTournament.id}`, data.data.sessionToken);
            window.localStorage.setItem(
              `pointx_broadcast_token_expiry_${currentTournament.id}`,
              String(data.data.tokenExpiresAt || Date.now() + TOKEN_TTL_MS)
            );
          }
        }
      } catch {}
    };

    fetchSyncState();
    const interval = setInterval(fetchSyncState, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentTournament.id]);

  const handleCopyObsLink = () => {
    navigator.clipboard.writeText(overlayUrl);
    showToast({
      type: 'success',
      title: 'OBS Link Copied',
      message: 'Paste this link directly into OBS Studio as a Browser Source (1920x1080).'
    });
  };

  const handleCopyRemoteLink = () => {
    navigator.clipboard.writeText(remoteUrl);
    showToast({
      type: 'success',
      title: 'OBS Remote Link Copied',
      message: 'Open this link on any mobile phone, tablet, or separate network to control live stream scores.'
    });
  };

  const handleSavePin = async () => {
    if (!newPinInput || newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      showToast({
        type: 'error',
        title: 'Invalid PIN',
        message: 'Security PIN must be exactly 4 numerical digits (e.g. 1234).'
      });
      return;
    }

    try {
      const res = await fetch('/api/sync/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: currentTournament.id,
          newPin: newPinInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setPinCode(newPinInput);
        setIsEditingPin(false);
        setNewPinInput('');
        showToast({
          type: 'success',
          title: 'PIN Code Updated',
          message: `Security PIN set to ${newPinInput}. Remote controllers must verify this PIN to connect.`
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not update security PIN.'
      });
    }
  };

  const handleBlockDevice = async (deviceId: string) => {
    try {
      const res = await fetch('/api/sync/block-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: currentTournament.id,
          deviceId
        })
      });
      const data = await res.json();
      if (data.success) {
        setConnectedDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
        setBlockedDeviceIds((prev) => [...prev, deviceId]);
        showToast({
          type: 'info',
          title: 'Device Blocked',
          message: 'Remote controller disconnected and barred from further access.'
        });
      }
    } catch {}
  };

  const handleUnblockDevice = async (deviceId: string) => {
    try {
      const res = await fetch('/api/sync/unblock-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: currentTournament.id,
          deviceId
        })
      });
      const data = await res.json();
      if (data.success) {
        setBlockedDeviceIds((prev) => prev.filter((id) => id !== deviceId));
        showToast({
          type: 'success',
          title: 'Device Unblocked',
          message: 'Device access restored.'
        });
      }
    } catch {}
  };

  // QR Code URL for scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(remoteUrl)}&bgcolor=13100f&color=ffd000&margin=8`;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goBackTab}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1 font-mono text-xs text-[var(--status-live)] font-bold uppercase tracking-wider">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--status-live)] animate-pulse" />
              <span>OBS STUDIO LIVE MULTI-NETWORK ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Tv className="h-6 w-6 text-[var(--status-live)]" />
              Live Broadcast Control Room (OBS Studio)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Stream live 4K overlays and control matches with mobile remote control across any network.
            </p>
          </div>
        </div>

        {/* Security PIN status in header */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-4 py-2 rounded-xl shadow-xs">
          <ShieldCheck className="h-4 w-4 text-[var(--accent-primary)]" />
          <div className="text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Remote PIN: </span>
            <strong className="text-[var(--accent-primary)] tracking-wider">{pinCode}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditingPin(true);
              setNewPinInput(pinCode);
            }}
            className="text-[10px] uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline ml-1 cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      {/* Edit PIN Modal / Drawer */}
      {isEditingPin && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--accent-primary)] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-[var(--accent-primary)] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">Set 4-Digit Remote Security PIN</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Operators opening the remote URL must enter this PIN code once.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              maxLength={4}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-24 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center font-mono font-bold text-sm tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <Button size="sm" variant="primary" onClick={handleSavePin}>
              Save PIN
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditingPin(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* 2 PRIMARY ACTION HERO CARDS (ONLY 2 OPTIONS AS REQUESTED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* OPTION 1: OBS BROWSER SOURCE OVERLAY */}
        <div className="rounded-3xl border-2 border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-md flex flex-col justify-between space-y-5 hover:border-[var(--accent-primary)]/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                  <Tv className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="live" size="sm">
                    OPTION 1 • OBS BROWSER SOURCE
                  </Badge>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display mt-0.5">
                    OBS Studio Overlay Stream Link
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Copy this transparent live URL into <strong>OBS Studio / vMix Browser Source (1920×1080)</strong>. Updates sync automatically in 0ms.
            </p>

            {/* Scene Selector Pills */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-secondary)]">
                Select Active Overlay Scene:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'live-squads', name: 'Free Fire Live Pro' },
                  { id: 'standings', name: 'Standings Matrix' },
                  { id: 'graphic', name: '4K Graphics Poster' },
                  { id: 'match', name: 'Match Results' },
                  { id: 'mvp', name: 'Top Fraggers MVP' },
                  { id: 'lowerthird', name: 'Lower Third Pill' }
                ].map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setOverlayType(sc.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left truncate cursor-pointer border ${
                      overlayType === sc.id
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-sm'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCopyObsLink}
              leftIcon={<Copy className="h-5 w-5" />}
              className="w-full sm:flex-1 font-bold shadow-md hover:shadow-lg"
            >
              Copy OBS Link
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open(overlayUrl, '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
              className="w-full sm:w-auto font-bold"
              title="Open test overlay window in browser"
            >
              Open OBS Window ↗
            </Button>
          </div>
        </div>

        {/* OPTION 2: SMARTPHONE / TABLET LIVE REMOTE CONTROL */}
        <div className="rounded-3xl border-2 border-[var(--accent-primary)]/60 bg-[var(--bg-surface)] p-6 shadow-md flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
                    <span className="text-[11px] font-mono font-bold text-[#10b981] uppercase">
                      OPTION 2 • SMARTPHONE REMOTE DECK
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display mt-0.5">
                    Phone / Tablet Match Controller
                  </h2>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Open on your <strong>phone, tablet, or separate Wi-Fi/4G network</strong> to tap score adjustments, placement points, and ALIVE/KNOCK squad status in real time.
            </p>

            {/* QR Code Quick Scan Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center gap-4">
              <div className="relative p-1.5 rounded-xl bg-black border border-white/10 shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Scan Remote QR Code"
                  className="h-20 w-20 object-contain rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>Scan to Open on Phone</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal">
                  Point phone camera at QR code. Protected by 4-digit PIN: <strong className="text-[var(--accent-primary)] font-mono">{pinCode}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-[11px] text-[var(--accent-primary)] font-bold hover:underline cursor-pointer"
                >
                  View Large QR Code
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="booyah"
              size="lg"
              onClick={handleCopyRemoteLink}
              leftIcon={<Copy className="h-5 w-5" />}
              className="w-full sm:flex-1 font-bold shadow-md hover:shadow-lg"
            >
              Copy OBS Remote
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open(remoteUrl, '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
              className="w-full sm:w-auto font-bold"
              title="Open remote control deck in new tab"
            >
              Open Remote Window ↗
            </Button>
          </div>
        </div>
      </div>

      {/* CONNECTED REMOTE DEVICES & SECURITY ACCESS REGISTRY */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-[var(--accent-primary)]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] font-display">
                Connected Remote Controller Devices
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Real-time active operators connected over online network or mobile data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {connectedDevices.length} Active {connectedDevices.length === 1 ? 'Device' : 'Devices'}
            </span>
          </div>
        </div>

        {connectedDevices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectedDevices.map((dev) => (
              <div
                key={dev.deviceId}
                className="p-4 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 truncate">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                    <Smartphone className="h-3.5 w-3.5 text-[#10b981]" />
                    <span className="truncate">{dev.deviceName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                    IP: {dev.ipAddress} • {Math.round((Date.now() - dev.lastActive) / 1000)}s ago
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBlockDevice(dev.deviceId)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 font-bold text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  title="Block this device from controlling match"
                >
                  <Ban className="h-3 w-3" />
                  <span>Block</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-[var(--bg-surface-inset)] border border-dashed border-[var(--border-subtle)] space-y-1">
            <div className="text-xs font-bold text-[var(--text-secondary)]">No active remote devices connected</div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Scan the QR code above or open the remote link on a phone to start controlling scores.
            </p>
          </div>
        )}

        {/* Blocked Devices Section (if any) */}
        {blockedDeviceIds.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <div className="text-xs font-bold text-rose-500 flex items-center gap-1">
              <Ban className="h-3.5 w-3.5" />
              <span>Blocked Devices ({blockedDeviceIds.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedDeviceIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] font-mono text-rose-400"
                >
                  <span>{id}</span>
                  <button
                    type="button"
                    onClick={() => handleUnblockDevice(id)}
                    className="text-xs font-bold hover:underline cursor-pointer text-[var(--text-primary)]"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Large QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">Scan Remote QR</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-3 bg-black rounded-2xl border border-white/10 flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64 object-contain rounded-xl" />
            </div>
            <div className="text-xs font-mono text-[var(--text-secondary)]">
              Security PIN: <strong className="text-[var(--accent-primary)] text-sm">{pinCode}</strong>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowQrModal(false)} className="w-full">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Live Overlay Preview */}
      {overlayType === 'live-squads' && (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 font-display">
                <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
                Live Overlay Preview
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                Real-time 4-player ALIVE status bars and point calculations.
              </p>
            </div>
            <Badge variant="live" size="sm">
              Live Stream Engine
            </Badge>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d0a17] border border-[#2b164f] flex justify-center items-center overflow-x-auto">
            <BroadcastFreeFireLiveOverlay
              tournament={currentTournament}
              standings={standings}
              isTransparent={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
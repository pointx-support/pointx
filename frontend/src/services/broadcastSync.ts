import type { Tournament } from '../types/tournament';

const SYNC_CHANNEL_NAME = 'strikz_live_sync_channel';

// In-memory fallback map for non-browser/test environments
const memoryTokenMap = new Map<string, string>();
const memoryStoreMap = new Map<string, string>();

// Initialize Web BroadcastChannel if available in browser
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  console.warn('BroadcastChannel not available, falling back to storage sync');
}

export interface BroadcastTokenInfo {
  token: string;
  tournamentId: string;
  createdAt: number;
}

export function generateBroadcastToken(tournamentId: string): string {
  const token = `obs_${tournamentId.slice(0, 8)}_${Math.random().toString(36).substr(2, 8)}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(`strikz_token_${tournamentId}`, token);
  } else {
    memoryTokenMap.set(`strikz_token_${tournamentId}`, token);
  }
  return token;
}

export function getBroadcastToken(tournamentId: string): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(`strikz_token_${tournamentId}`);
    if (existing) return existing;
  } else {
    const mem = memoryTokenMap.get(`strikz_token_${tournamentId}`);
    if (mem) return mem;
  }
  return generateBroadcastToken(tournamentId);
}

// Background network poster to Vite sync API
async function postNetworkSync(payload: any): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Offline fallback is handled via localStorage & BroadcastChannel
    });
  } catch {
    // Ignore network errors in offline scenarios
  }
}

export function broadcastTournamentUpdate(tournament: Tournament): void {
  const payload = {
    type: 'TOURNAMENT_UPDATED',
    tournamentId: tournament.id,
    timestamp: Date.now(),
    data: tournament
  };

  // 1. Sub-millisecond tab-to-OBS IPC
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch {
      console.warn('Error posting to BroadcastChannel');
    }
  }

  // 2. LocalStorage sync for same-device cross-window
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`strikz_live_${tournament.id}`, JSON.stringify(tournament));
      window.localStorage.setItem('strikz_live_default', JSON.stringify(tournament));
      window.localStorage.setItem('strikz_live_ping', String(Date.now()));
    } catch {
      console.warn('Error writing to localStorage sync');
    }
  } else {
    memoryStoreMap.set(`strikz_live_${tournament.id}`, JSON.stringify(tournament));
  }

  // 3. Local Wi-Fi Network Sync (for Phone <-> PC)
  postNetworkSync({
    tournamentId: tournament.id,
    tournament,
    timestamp: Date.now()
  });
}

export function subscribeToTournamentLiveUpdates(
  tournamentId: string,
  onUpdate: (tournament: Tournament) => void,
  onHeartbeat?: () => void
): () => void {
  let lastTimestamp = 0;

  // Initial load from network API on mount
  if (typeof window !== 'undefined') {
    fetch(`/api/sync/state?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.tournament) {
          lastTimestamp = res.data.timestamp || Date.now();
          onUpdate(res.data.tournament);
          if (onHeartbeat) onHeartbeat();
        }
      })
      .catch(() => {
        const stored = window.localStorage.getItem(`strikz_live_${tournamentId}`) || window.localStorage.getItem('strikz_live_default');
        if (stored) {
          try {
            onUpdate(JSON.parse(stored));
          } catch {}
        }
      });
  }

  // BroadcastChannel listener
  const handleBroadcastMessage = (event: MessageEvent) => {
    if (
      event.data &&
      (event.data.type === 'TOURNAMENT_UPDATED') &&
      (!tournamentId || !event.data.tournamentId || event.data.tournamentId === tournamentId || event.data.tournamentId === 'all') &&
      event.data.data
    ) {
      lastTimestamp = event.data.timestamp || Date.now();
      onUpdate(event.data.data);
      if (onHeartbeat) onHeartbeat();
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Storage event listener
  const handleStorageEvent = (event: StorageEvent) => {
    if (
      event.key === `strikz_live_${tournamentId}` ||
      event.key === 'strikz_live_default' ||
      event.key === 'strikz_live_ping'
    ) {
      const stored = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(`strikz_live_${tournamentId}`) || window.localStorage.getItem('strikz_live_default')
        : memoryStoreMap.get(`strikz_live_${tournamentId}`);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          onUpdate(parsed);
          if (onHeartbeat) onHeartbeat();
        } catch {
          console.warn('Error parsing storage update');
        }
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // LAN Network Polling fallback every 500ms
  const pollInterval = setInterval(() => {
    if (typeof window === 'undefined') return;
    fetch(`/api/sync/state?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.tournament && res.data.timestamp > lastTimestamp) {
          lastTimestamp = res.data.timestamp;
          onUpdate(res.data.tournament);
          if (onHeartbeat) onHeartbeat();
        }
      })
      .catch(() => {});
  }, 500);

  return () => {
    clearInterval(pollInterval);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}

export type LivePlayerState = 'alive' | 'knock' | 'eliminated';

export interface LiveSquadSyncState {
  tournamentId: string;
  squads: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>;
  highlightedTeamId?: string | null;
  isVisible?: boolean;
  timestamp: number;
}

export function broadcastLiveSquadUpdate(data: LiveSquadSyncState): void {
  const payload = {
    type: 'LIVE_SQUADS_UPDATED',
    tournamentId: data.tournamentId,
    timestamp: Date.now(),
    data
  };

  // 1. BroadcastChannel IPC
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch {
      console.warn('Error posting to BroadcastChannel');
    }
  }

  // 2. LocalStorage sync & persistence
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`strikz_squads_${data.tournamentId}`, JSON.stringify(data));
      window.localStorage.setItem('strikz_squads_default', JSON.stringify(data));
      window.localStorage.setItem('strikz_squads_ping', String(Date.now()));
    } catch {
      console.warn('Error writing to localStorage sync');
    }
  } else {
    memoryStoreMap.set(`strikz_squads_${data.tournamentId}`, JSON.stringify(data));
  }

  // 3. Local Wi-Fi Network Sync (Phone -> PC)
  postNetworkSync({
    tournamentId: data.tournamentId,
    squads: data.squads,
    highlightedTeamId: data.highlightedTeamId,
    isVisible: data.isVisible !== undefined ? data.isVisible : true,
    timestamp: Date.now()
  });
}

export function subscribeToLiveSquadUpdates(
  tournamentId: string,
  onUpdate: (data: LiveSquadSyncState) => void
): () => void {
  let lastTimestamp = 0;

  // Initial load from network API on mount
  if (typeof window !== 'undefined') {
    fetch(`/api/sync/state?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data?.squads || res?.data?.isVisible !== undefined) {
          lastTimestamp = res.data.timestamp || Date.now();
          onUpdate({
            tournamentId,
            squads: res.data.squads,
            highlightedTeamId: res.data.highlightedTeamId,
            isVisible: res.data.isVisible !== undefined ? res.data.isVisible : true,
            timestamp: lastTimestamp
          });
        }
      })
      .catch(() => {
        const stored = window.localStorage.getItem(`strikz_squads_${tournamentId}`) || window.localStorage.getItem('strikz_squads_default');
        if (stored) {
          try {
            onUpdate(JSON.parse(stored));
          } catch {}
        }
      });
  }

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (
      event.data &&
      event.data.type === 'LIVE_SQUADS_UPDATED' &&
      (!tournamentId || !event.data.tournamentId || event.data.tournamentId === tournamentId || event.data.tournamentId === 'all') &&
      event.data.data
    ) {
      lastTimestamp = event.data.timestamp || Date.now();
      onUpdate(event.data.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (
      event.key === `strikz_squads_${tournamentId}` ||
      event.key === 'strikz_squads_default' ||
      event.key === 'strikz_squads_ping'
    ) {
      const stored = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(`strikz_squads_${tournamentId}`) || window.localStorage.getItem('strikz_squads_default')
        : memoryStoreMap.get(`strikz_squads_${tournamentId}`);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          onUpdate(parsed);
        } catch {
          console.warn('Error parsing storage squad update');
        }
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // LAN Network Polling fallback every 400ms
  const pollInterval = setInterval(() => {
    if (typeof window === 'undefined') return;
    fetch(`/api/sync/state?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.data && res.data.timestamp > lastTimestamp) {
          lastTimestamp = res.data.timestamp;
          onUpdate({
            tournamentId,
            squads: res.data.squads,
            highlightedTeamId: res.data.highlightedTeamId,
            isVisible: res.data.isVisible !== undefined ? res.data.isVisible : true,
            timestamp: lastTimestamp
          });
        }
      })
      .catch(() => {});
  }, 400);

  return () => {
    clearInterval(pollInterval);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
}
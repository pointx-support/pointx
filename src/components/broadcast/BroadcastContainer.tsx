import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import { subscribeToTournamentLiveUpdates } from '../../services/broadcastSync';
import { BroadcastStandings } from './BroadcastStandings';
import { BroadcastMatchResult } from './BroadcastMatchResult';
import { BroadcastTopFraggers } from './BroadcastTopFraggers';
import { BroadcastLowerThird } from './BroadcastLowerThird';
import { BroadcastFreeFireLiveOverlay } from './BroadcastFreeFireLiveOverlay';
import { Activity, Wifi } from 'lucide-react';

interface BroadcastContainerProps {
  layoutType?: 'standings' | 'match' | 'fraggers' | 'lower-third' | 'live-squads' | 'pro';
  isTransparent?: boolean;
}

export const BroadcastContainer: FC<BroadcastContainerProps> = ({
  layoutType,
  isTransparent
}) => {
  const store = useTournamentStore();

  // Extract query params from URL in OBS Browser Source
  const urlParams = useMemo(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  }, []);

  const requestedTourId = urlParams?.get('tournamentId') || urlParams?.get('tournament');

  const initialTournament = useMemo(() => {
    if (requestedTourId && requestedTourId !== store.currentTournament.id) {
      const match = store.tournaments.find((t) => t.id === requestedTourId);
      if (match) return match;
    }
    return store.currentTournament;
  }, [requestedTourId, store.currentTournament, store.tournaments]);

  const [tournament, setTournament] = useState(initialTournament);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => Date.now());
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const resolvedLayout = layoutType || urlParams?.get('layout') || 'standings';
  const resolvedTransparent = isTransparent !== undefined
    ? isTransparent
    : urlParams?.get('transparent') !== 'false';
  const isDebugMode = urlParams?.get('debug') === 'true';
  const targetMatchNumber = urlParams?.get('match') ? Number(urlParams.get('match')) : undefined;

  useEffect(() => {
    // Subscribe to cross-tab / cross-process real-time IPC updates
    const unsubscribe = subscribeToTournamentLiveUpdates(
      tournament.id,
      (updatedTournament) => {
        setTournament(updatedTournament);
        setLastSyncTime(Date.now());
        setIsConnected(true);
      },
      () => {
        setLastSyncTime(Date.now());
        setIsConnected(true);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [tournament.id]);

  const standings = calculateTournamentStandings(tournament);

  return (
    <div
      className={`w-full min-h-screen overflow-hidden font-sans ${
        resolvedTransparent ? 'bg-transparent' : 'bg-[#13100f]'
      }`}
      style={{
        margin: 0,
        padding: 0,
        width: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Optional Debug HUD for OBS operators */}
      {isDebugMode && (
        <div className="fixed top-2 right-2 z-50 rounded-xl bg-black/90 border border-[#2ea66e]/40 p-2.5 text-[10px] font-mono text-slate-300 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#2ea66e] font-bold">
            <Wifi className="h-3 w-3" />
            <span>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
          <span>•</span>
          <span>Tour: {tournament.id.slice(0, 14)}...</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Activity className="h-3 w-3 text-[#e0684b]" />
            Last Sync: {new Date(lastSyncTime).toLocaleTimeString()}
          </span>
        </div>
      )}

      {resolvedLayout === 'standings' && (
        <BroadcastStandings
          tournament={tournament}
          standings={standings}
          isTransparent={resolvedTransparent}
        />
      )}
      {resolvedLayout === 'match' && (
        <BroadcastMatchResult
          tournament={tournament}
          matchNumber={targetMatchNumber}
          isTransparent={resolvedTransparent}
        />
      )}
      {resolvedLayout === 'fraggers' && (
        <BroadcastTopFraggers
          tournament={tournament}
          isTransparent={resolvedTransparent}
        />
      )}
      {(resolvedLayout === 'live-squads' || resolvedLayout === 'pro' || resolvedLayout === 'live') && (
        <BroadcastFreeFireLiveOverlay
          tournament={tournament}
          standings={standings}
          isTransparent={resolvedTransparent}
        />
      )}
      {resolvedLayout === 'lower-third' && (
        <BroadcastLowerThird
          tournament={tournament}
          standings={standings}
          isTransparent={resolvedTransparent}
        />
      )}
    </div>
  );
};
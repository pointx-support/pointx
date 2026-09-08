import { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import type { Tournament } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import {
  subscribeToTournamentLiveUpdates,
  subscribeToLiveSquadUpdates,
  subscribeToBroadcastDisplayUpdates,
  subscribeToConnectionState,
  subscribeToScoreDelta,
  cacheAuthoritativeTournament,
  type ConnectionState
} from '../../services/broadcastSync';
import { BroadcastStandings } from './BroadcastStandings';
import { BroadcastMatchResult } from './BroadcastMatchResult';
import { BroadcastTopFraggers } from './BroadcastTopFraggers';
import { BroadcastLowerThird } from './BroadcastLowerThird';
import { BroadcastFreeFireLiveOverlay } from './BroadcastFreeFireLiveOverlay';
import { BroadcastGraphicPoster } from './BroadcastGraphicPoster';
import { Activity, Wifi } from 'lucide-react';

interface BroadcastContainerProps {
  layoutType?: 'standings' | 'match' | 'fraggers' | 'lower-third' | 'live-squads' | 'pro' | 'graphic' | 'graphic-poster' | 'poster';
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

  const requestedTourId = urlParams?.get('tournamentId') || urlParams?.get('tournament') || '';
  const effectiveTourId = requestedTourId || store.currentTournament.id || 'default';
  const [tournamentNotFound, setTournamentNotFound] = useState<boolean>(false);

  const initialTournament: Tournament = useMemo(() => {
    if (requestedTourId) {
      const match = store.tournaments.find((t) => t.id === requestedTourId);
      if (match) return match;
      return {
        ...store.currentTournament,
        id: requestedTourId,
        title: 'Tournament Live Stream',
        teams: [],
        matches: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return store.currentTournament;
  }, [requestedTourId, store.currentTournament, store.tournaments]);

  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [lastSyncTime, setLastSyncTime] = useState<number>(() => Date.now());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('CONNECTING');
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);

  // Dynamic Live Layout and Template Controls
  const initialLayout = layoutType || urlParams?.get('layout') || 'live-squads';
  const [currentLayout, setCurrentLayout] = useState<string>(initialLayout);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>(urlParams?.get('templateId') || urlParams?.get('template') || undefined);
  const [currentTemplate, setCurrentTemplate] = useState<any>(undefined);
  const [currentScope, setCurrentScope] = useState<string | number | undefined>(urlParams?.get('scope') || undefined);
  const [currentHue, setCurrentHue] = useState<number | undefined>(urlParams?.get('hue') ? Number(urlParams.get('hue')) : undefined);
  const [customEventTitle, setCustomEventTitle] = useState<string | undefined>(urlParams?.get('title') || undefined);
  const [customOrgName, setCustomOrgName] = useState<string | undefined>(urlParams?.get('org') || undefined);
  const [targetMatchNumber, setTargetMatchNumber] = useState<number | undefined>(urlParams?.get('match') ? Number(urlParams.get('match')) : undefined);

  const resolvedTransparent = isTransparent !== undefined
    ? isTransparent
    : urlParams?.get('transparent') !== 'false';
  const isDebugMode = urlParams?.get('debug') === 'true';

  useEffect(() => {
    // Initial fetch from backend sync & tournament API
    const loadInitialState = async () => {
      try {
        const res = await fetch(`/api/sync/state?tournamentId=${encodeURIComponent(effectiveTourId)}`);
        const data = await res.json();
        if (data?.success && data?.data) {
          if (data.data.tournament) {
            setTournament(data.data.tournament);
            cacheAuthoritativeTournament(effectiveTourId, data.data.tournament);
            setTournamentNotFound(false);
          }
          if (data.data.activeLayout && !layoutType) {
            setCurrentLayout(data.data.activeLayout);
          }
          if (data.data.activeTemplateId) setCurrentTemplateId(data.data.activeTemplateId);
          if (data.data.activeTemplate) setCurrentTemplate(data.data.activeTemplate);
          if (data.data.activeScope !== undefined) setCurrentScope(data.data.activeScope);
          if (data.data.activeMatchNumber !== undefined) setTargetMatchNumber(data.data.activeMatchNumber);
          if (data.data.themeHue !== undefined) setCurrentHue(data.data.themeHue);
          if (data.data.customEventTitle !== undefined) setCustomEventTitle(data.data.customEventTitle);
          if (data.data.customOrgName !== undefined) setCustomOrgName(data.data.customOrgName);
          if (data.data.isVisible !== undefined) setIsOverlayVisible(data.data.isVisible);
          setLastSyncTime(Date.now());
          setConnectionStatus('CONNECTED');
          return;
        }

        if (effectiveTourId && effectiveTourId !== 'default') {
          const tourRes = await fetch(`/api/tournaments/${encodeURIComponent(effectiveTourId)}`);
          const tourData = await tourRes.json();
          if (tourData?.success && tourData?.data) {
            setTournament(tourData.data);
            cacheAuthoritativeTournament(effectiveTourId, tourData.data);
            setTournamentNotFound(false);
            setLastSyncTime(Date.now());
            setConnectionStatus('CONNECTED');
            return;
          }
        }

        if (requestedTourId) {
          setTournamentNotFound(true);
        }
      } catch {
        if (requestedTourId) {
          setTournamentNotFound(true);
        }
      }
    };

    loadInitialState();

    // Subscribe to connection health
    const unsubConnection = subscribeToConnectionState((state) => {
      setConnectionStatus(state);
      if (state === 'CONNECTED') setLastSyncTime(Date.now());
    });

    // Subscribe to authoritative score deltas (for immediate OBS kill/point reactivity)
    const unsubScoreDelta = subscribeToScoreDelta((delta) => {
      if (!delta || (delta.tournamentId && delta.tournamentId !== effectiveTourId)) return;
      setTournament((prev) => {
        if (!prev) return prev;
        const matches = Array.isArray(prev.matches)
          ? prev.matches.map((m) => {
              if (m.id !== delta.matchId && (m as any).customId !== delta.matchId) {
                return m;
              }
              const results = Array.isArray(m.results)
                ? m.results.map((r: any) => ({ ...r }))
                : [];
              const resIndex = results.findIndex((r: any) => r.teamId === delta.teamId);
              if (resIndex >= 0) {
                results[resIndex] = {
                  ...results[resIndex],
                  kills: delta.kills,
                  placement: delta.placement,
                  placementPoints: delta.placementPoints,
                  killPoints: delta.killPoints,
                  totalPoints: delta.totalPoints,
                  isBooyah: delta.isBooyah,
                  bonusPoints: delta.bonusPoints !== undefined ? delta.bonusPoints : results[resIndex].bonusPoints,
                  penaltyPoints: delta.penaltyPoints !== undefined ? delta.penaltyPoints : results[resIndex].penaltyPoints,
                };
              } else {
                results.push({ ...delta });
              }
              return {
                ...m,
                results,
                updatedAt: new Date().toISOString(),
              };
            })
          : [];

        return {
          ...prev,
          matches,
          updatedAt: new Date().toISOString(),
        };
      });
      setLastSyncTime(Date.now());
      setConnectionStatus('CONNECTED');
    });

    // Subscribe to tournament data updates
    const unsubTournament = subscribeToTournamentLiveUpdates(
      effectiveTourId,
      (updatedTournament) => {
        setTournament(updatedTournament);
        setTournamentNotFound(false);
        setLastSyncTime(Date.now());
        setConnectionStatus('CONNECTED');
      },
      () => {
        setLastSyncTime(Date.now());
        setConnectionStatus('CONNECTED');
      }
    );

    // Subscribe to live squad state & visibility (Show Table / Hide Table)
    const unsubSquads = subscribeToLiveSquadUpdates(effectiveTourId, (data) => {
      if (data.isVisible !== undefined) {
        setIsOverlayVisible(data.isVisible);
      }
      setLastSyncTime(Date.now());
      setConnectionStatus('CONNECTED');
    });

    // Subscribe to real-time display, layout, and template changes
    const unsubDisplay = subscribeToBroadcastDisplayUpdates(effectiveTourId, (disp) => {
      if (disp.activeLayout && !layoutType) {
        setCurrentLayout(disp.activeLayout);
      }
      if (disp.activeTemplateId) setCurrentTemplateId(disp.activeTemplateId);
      if (disp.activeTemplate) setCurrentTemplate(disp.activeTemplate);
      if (disp.activeScope !== undefined) setCurrentScope(disp.activeScope);
      if (disp.activeMatchNumber !== undefined) setTargetMatchNumber(disp.activeMatchNumber);
      if (disp.themeHue !== undefined) setCurrentHue(disp.themeHue);
      if (disp.customEventTitle !== undefined) setCustomEventTitle(disp.customEventTitle);
      if (disp.customOrgName !== undefined) setCustomOrgName(disp.customOrgName);
      setLastSyncTime(Date.now());
      setConnectionStatus('CONNECTED');
    });

    return () => {
      unsubConnection();
      unsubScoreDelta();
      unsubTournament();
      unsubSquads();
      unsubDisplay();
    };
  }, [effectiveTourId, layoutType, requestedTourId]);

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
      {/* Tournament Not Found Error Display */}
      {tournamentNotFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 font-mono text-red-500 p-6">
          <div className="p-8 rounded-2xl bg-zinc-950 border border-red-500/40 text-center space-y-3 max-w-md shadow-2xl">
            <p className="text-xl font-bold tracking-wider text-red-400">TOURNAMENT NOT FOUND</p>
            <p className="text-xs text-zinc-400">ID: {requestedTourId}</p>
            <p className="text-[11px] text-zinc-500">The requested tournament could not be located on the authoritative server. Please check the tournament ID in your OBS Browser Source URL.</p>
          </div>
        </div>
      )}

      {/* Optional Debug HUD for OBS operators */}
      {isDebugMode && (
        <div className="fixed top-2 right-2 z-50 rounded-xl bg-black/90 border border-[#2ea66e]/40 p-2.5 text-[10px] font-mono text-slate-300 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#2ea66e] font-bold">
            <Wifi className="h-3 w-3" />
            <span>{connectionStatus === 'CONNECTED' ? 'LIVE SYNC' : connectionStatus}</span>
          </div>
          <span>•</span>
          <span>Layout: {currentLayout}</span>
          <span>•</span>
          <span>Tour: {tournament.id.slice(0, 14)}...</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Activity className="h-3 w-3 text-[#e0684b]" />
            Last Sync: {new Date(lastSyncTime).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Standings Table Layout with Show/Hide Support */}
      {currentLayout === 'standings' && (
        <div
          className={`w-full min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOverlayVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-12 pointer-events-none scale-95'
          }`}
        >
          <BroadcastStandings
            tournament={tournament}
            standings={standings}
            isTransparent={resolvedTransparent}
          />
        </div>
      )}

      {/* Match Result Layout */}
      {currentLayout === 'match' && (
        <div
          className={`w-full min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOverlayVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-12 pointer-events-none scale-95'
          }`}
        >
          <BroadcastMatchResult
            tournament={tournament}
            matchNumber={targetMatchNumber}
            isTransparent={resolvedTransparent}
          />
        </div>
      )}

      {/* Top Fraggers Layout */}
      {(currentLayout === 'fraggers' || currentLayout === 'mvp') && (
        <div
          className={`w-full min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOverlayVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-12 pointer-events-none scale-95'
          }`}
        >
          <BroadcastTopFraggers
            tournament={tournament}
            isTransparent={resolvedTransparent}
          />
        </div>
      )}

      {/* Flagship Free Fire Live Squads Overlay (Supports internal horizontal slide) */}
      {(currentLayout === 'live-squads' || currentLayout === 'pro' || currentLayout === 'live') && (
        <BroadcastFreeFireLiveOverlay
          subscriptionId={effectiveTourId}
          tournament={tournament}
          standings={standings}
          isTransparent={resolvedTransparent}
          isOverlayVisible={isOverlayVisible}
          activeMatchNumber={targetMatchNumber}
        />
      )}

      {/* Lower Third Layout */}
      {(currentLayout === 'lower-third' || currentLayout === 'lowerthird') && (
        <div
          className={`w-full min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOverlayVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12 pointer-events-none'
          }`}
        >
          <BroadcastLowerThird
            tournament={tournament}
            standings={standings}
            isTransparent={resolvedTransparent}
          />
        </div>
      )}

      {/* Graphic Poster Layout with Dynamic Live Template & Hue Updates */}
      {(currentLayout === 'graphic' || currentLayout === 'graphic-poster' || currentLayout === 'poster') && (
        <div
          className={`w-full min-h-screen transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOverlayVisible
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <BroadcastGraphicPoster
            tournament={tournament}
            isTransparent={resolvedTransparent}
            templateId={currentTemplateId}
            template={currentTemplate}
            hue={currentHue}
            scope={currentScope}
            customTitle={customEventTitle}
            customOrg={customOrgName}
          />
        </div>
      )}
    </div>
  );
};
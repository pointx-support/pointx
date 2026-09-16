import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Flame, Wifi, Activity } from 'lucide-react';
import type { PlayerState } from '../../types/broadcastSession';
import { CanonicalLiveStore, type CanonicalLiveMatchState } from '../../services/canonicalLiveStore';
import { RealtimeSyncClient, type ConnectionState } from '../../services/broadcastSync';
import { getStoredToken } from '../../services/api';

export interface ObsLiveOverlayProps {
  tournamentId?: string;
  matchId?: string;
  sessionId?: string;
  isTransparent?: boolean;
}

export const ObsLiveOverlay: React.FC<ObsLiveOverlayProps> = ({
  tournamentId: propTournamentId,
  matchId: propMatchId,
  sessionId: _propSessionId,
  isTransparent = true,
}) => {
  // Query param fallbacks from window.location
  const [urlParams] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  );

  const effectiveTournamentId = propTournamentId || urlParams?.get('tournamentId') || urlParams?.get('tournament') || '';
  const effectiveMatchId = propMatchId || urlParams?.get('matchId') || urlParams?.get('match') || undefined;
  const isDebugMode = urlParams?.get('debug') === 'true';

  const [canonicalState, setCanonicalState] = useState<CanonicalLiveMatchState | null>(null);
  const [syncStatus, setSyncStatus] = useState<'LIVE' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [hasNoMatches, setHasNoMatches] = useState<boolean>(false);
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    const liveStore = CanonicalLiveStore.getInstance();
    const syncClient = RealtimeSyncClient.getInstance();

    async function setupContextAndConnect() {
      if (!effectiveTournamentId) {
        setLoading(false);
        try {
          setIsLoadingTournaments(true);
          const res = await fetch('/api/tournaments');
          const data = await res.json();
          if (!isCancelled && data?.success && Array.isArray(data.data)) {
            setAvailableTournaments(data.data);
          }
        } catch {} finally {
          if (!isCancelled) setIsLoadingTournaments(false);
        }
        return;
      }

      try {
        const token = getStoredToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        let tourData: any = null;

        try {
          const tourRes = await fetch(`/api/tournaments/${encodeURIComponent(effectiveTournamentId)}`, { headers });
          if (tourRes.ok) {
            tourData = await tourRes.json();
          }
        } catch {}

        if (!tourData?.success || !tourData?.data) {
          try {
            const pubRes = await fetch(`/api/tournaments/public/${encodeURIComponent(effectiveTournamentId)}`);
            if (pubRes.ok) {
              tourData = await pubRes.json();
            }
          } catch {}
        }

        if (isCancelled) return;

        if (!tourData?.success || !tourData?.data) {
          setError(`Tournament "${effectiveTournamentId}" not found.`);
          setLoading(false);
          return;
        }

        const tour = tourData.data;
        const orgId = tour.organizationId ? String(tour.organizationId) : 'org-default';
        const matches = Array.isArray(tour.matches) ? tour.matches : [];

        if (matches.length === 0) {
          // Zero-match tournament state: connect to virtual 'live-match-1' session
          // so overlay works seamlessly in sync with Remote without polluting DB
          setHasNoMatches(false);
          liveStore.setMatchContext(orgId, effectiveTournamentId, 'live-match-1');
          return;
        }

        setHasNoMatches(false);
        const resolvedMatch = effectiveMatchId
          ? matches.find((m: any) => (m.id || m.customId) === effectiveMatchId) || matches[0]
          : matches[0];

        const targetMatchId = resolvedMatch.id || resolvedMatch.customId;
        liveStore.setMatchContext(orgId, effectiveTournamentId, targetMatchId);
      } catch {
        if (!isCancelled) {
          // Fallback if fetch failed
          liveStore.setMatchContext('org-default', effectiveTournamentId, effectiveMatchId || 'none');
          setLoading(false);
        }
      }
    }

    setupContextAndConnect();

    // Subscribe to Authoritative Live State Store
    const unsubLive = liveStore.subscribe((cState) => {
      if (!isCancelled && cState) {
        setCanonicalState(cState);
        setLoading(false);
        setError(null);
        setSyncStatus('LIVE');
        setLastSyncTime(Date.now());
      }
    });

    // Subscribe to Next Match transitions
    const unsubNext = liveStore.subscribeNextMatch((nextData) => {
      if (!isCancelled && nextData && nextData.nextMatchId) {
        const org = canonicalState?.organizationId || 'org-default';
        liveStore.setMatchContext(org, effectiveTournamentId, nextData.nextMatchId);
        setLastSyncTime(Date.now());
      }
    });

    // Track WebSocket health
    const unsubConn = syncClient.subscribeConnection((status: ConnectionState) => {
      if (!isCancelled) {
        setSyncStatus(status === 'CONNECTED' ? 'LIVE' : 'CONNECTING');
        if (status === 'CONNECTED') setLastSyncTime(Date.now());
      }
    });

    return () => {
      isCancelled = true;
      unsubLive();
      unsubNext();
      unsubConn();
    };
  }, [effectiveTournamentId, effectiveMatchId]);

  if (!effectiveTournamentId) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center p-6 select-none font-sans ${
          isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
        }`}
      >
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-purple-800/50 bg-[#160d29]/95 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-purple-900/40 pb-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white font-display uppercase tracking-wider">
                Select Tournament for Overlay
              </h2>
              <p className="text-xs text-slate-400">
                Please pick a tournament to display on this OBS Browser Source.
              </p>
            </div>
          </div>

          {isLoadingTournaments ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              <span>Loading available tournaments...</span>
            </div>
          ) : availableTournaments.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs space-y-2">
              <p>No tournaments found in your account.</p>
              <p className="text-[11px] text-slate-500">
                Create a tournament in the PointX dashboard first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableTournaments.map((tour: any) => {
                const tourId = tour.customId || tour.id || tour._id;
                return (
                  <button
                    key={tourId}
                    type="button"
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tournamentId', tourId);
                      window.location.href = url.toString();
                    }}
                    className="w-full p-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 hover:border-purple-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {tour.title || 'Untitled Tournament'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-purple-300">{tourId}</span>
                        <span>•</span>
                        <span>{tour.status || 'Active'}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded bg-purple-600 group-hover:bg-purple-500 text-white text-[10px] font-bold">
                      Select →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading && !canonicalState && !hasNoMatches) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center p-8 select-none font-sans ${
          isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
        }`}
      >
        <div className="flex items-center gap-3 bg-[#1b0d33]/90 border border-[#3b1d6e] text-slate-200 px-5 py-3 rounded-lg shadow-2xl backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-wide uppercase">
            Connecting Broadcast Overlay...
          </span>
        </div>
      </div>
    );
  }

  if (hasNoMatches) {
    return (
      <div
        className={`w-full min-h-screen flex items-start justify-end p-4 sm:p-8 select-none font-sans overflow-hidden ${
          isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
        }`}
      >
        <div className="w-[340px] sm:w-[360px] rounded-lg overflow-hidden shadow-2xl border border-[#3b1d6e] bg-[#1b0d33]/95 p-6 text-center text-slate-300">
          <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Waiting for Match
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            No matches currently created for this tournament.
          </p>
        </div>
      </div>
    );
  }

  if (error && !canonicalState) {
    return (
      <div
        className={`w-full min-h-screen flex items-center justify-center p-8 select-none font-sans ${
          isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
        }`}
      >
        <div className="flex items-center gap-3 bg-red-950/90 border border-red-700 text-red-200 px-5 py-3 rounded-lg shadow-2xl backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-xs font-mono font-bold tracking-wide">
            {error || 'Broadcast session not found.'}
          </span>
        </div>
      </div>
    );
  }

  const rawTeams = canonicalState?.teams
    ? Object.values(canonicalState.teams)
        .map((t) => {
          const squadPlayers: PlayerState[] = t.players
            ? Object.values(t.players).map((p) => p.status)
            : ['alive', 'alive', 'alive', 'alive'];
          while (squadPlayers.length < 4) squadPlayers.push('alive');
          const isWiped = squadPlayers.every((p) => p === 'eliminated');
          const isFire = t.isOnFire === true || (t.isOnFire !== false && t.teamId === canonicalState.fireTeamId);
          const isPointRush = Boolean(t.pointRushEnabled);
          const isFocused = t.teamId === canonicalState.selectedTeamId;

          return {
            teamId: t.teamId,
            name: t.name || `Team ${t.slotNumber || 1}`,
            tag: t.tag || `T${t.slotNumber || 1}`,
            slotNumber: t.slotNumber || 1,
            logoUrl: t.logoUrl || '',
            kills: t.kills,
            placement: t.placement || 1,
            placementPoints: t.placementPoints,
            killPoints: t.killPoints,
            totalPoints: t.points,
            isBooyah: !isWiped && Boolean(t.isBooyah),
            squadPlayers,
            alivePlayersCount: squadPlayers.filter((p) => p === 'alive' || p === 'knock').length,
            isWiped,
            isFireActive: isFire,
            isPointRushActive: isPointRush,
            isFocused,
          };
        })
    : [];

  // Enforce single Booyah guarantee across the entire overlay (at most ONE team can ever hold Booyah)
  let booyahAwarded = false;
  const processedTeams = rawTeams.map((t) => {
    if (t.isBooyah && !t.isWiped && !booyahAwarded) {
      booyahAwarded = true;
      return t;
    }
    return { ...t, isBooyah: false };
  });

  const teams = processedTeams.sort((a, b) => {
    if (a.isBooyah !== b.isBooyah) return a.isBooyah ? -1 : 1;
    if (a.isWiped !== b.isWiped) return a.isWiped ? 1 : -1;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return (a.slotNumber || 1) - (b.slotNumber || 1);
  });

  const tableVisible = canonicalState?.tableVisible ?? true;
  const revision = canonicalState?.revision ?? 1;

  return (
    <div
      className={`w-full min-h-screen flex items-start justify-end p-4 sm:p-8 select-none font-sans overflow-hidden ${
        isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Optional Debug HUD for OBS operators */}
      {isDebugMode && (
        <div className="fixed top-2 left-2 z-50 rounded-xl bg-black/95 border border-[#2ea66e]/40 p-2.5 text-[10px] font-mono text-slate-300 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#2ea66e] font-bold">
            <Wifi className="h-3 w-3" />
            <span>{syncStatus}</span>
          </div>
          <span>•</span>
          <span>Rev: {revision}</span>
          <span>•</span>
          <span>Match: {canonicalState?.matchId || 'None'}</span>
          <span>•</span>
          <span>Fire: {canonicalState?.fireTeamId || 'None'}</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Activity className="h-3 w-3 text-[#e0684b]" />
            {new Date(lastSyncTime).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Container matching standard 360px Free Fire broadcast vertical overlay */}
      <div
        className={`w-[340px] sm:w-[360px] rounded-lg overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.85)] border border-[#3b1d6e] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          tableVisible
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-[500px] pointer-events-none scale-95'
        }`}
        style={{
          fontFamily: "'Space Grotesk', 'Rajdhani', sans-serif",
        }}
      >
        {/* ================= 1. HEADER ROW ================= */}
        <div className="bg-[#1b0d33] text-white flex items-center h-10 px-2.5 text-xs font-black tracking-wider border-b border-[#3b1d6e] justify-between">
          <div className="flex items-center flex-1">
            <div className="w-8 text-center text-[13px] font-bold text-slate-200">#</div>
            <div className="flex-1 pl-2 text-[12px] uppercase font-bold text-slate-100">TEAMS</div>
            <div className="w-20 text-center text-[11px] uppercase font-bold text-slate-100">ALIVE</div>
            <div className="w-11 text-center text-[11px] uppercase font-bold text-slate-100">ELIMS</div>
            <div className="w-12 text-right pr-1 text-[11px] uppercase font-bold text-slate-100">T.PTS.</div>
          </div>

          <div
            className="pl-2 flex items-center gap-1 text-[9px] font-mono text-slate-400"
            title={`Rev ${revision} | ${syncStatus}`}
          >
            {syncStatus === 'LIVE' ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </div>
        </div>

        {/* ================= 2. ROWS 1 TO 12 ================= */}
        <div className="flex flex-col divide-y divide-[#cfb99f]">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400 bg-[#1b0d33]/90">
              WAITING FOR MATCH DATA
            </div>
          ) : (
            teams.map((team, index) => {
              const rank = index + 1;
              const {
                teamId,
                name,
                tag,
                logoUrl,
                kills,
                totalPoints,
                squadPlayers,
                isWiped,
                isFireActive,
                isPointRushActive,
                isFocused,
                isBooyah,
              } = team;

              const isFire = isFireActive;

              return (
                <div
                  key={teamId}
                  className={`flex items-center h-11 transition-all relative ${
                    isBooyah
                      ? 'border-y-2 border-amber-400 bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] text-black shadow-2xl font-bold'
                      : isFire && !isWiped
                      ? 'border-y-2 border-orange-500 bg-gradient-to-r from-[#991b1b] via-[#ea580c] to-[#f97316] text-white shadow-xl'
                      : isFire && isWiped
                      ? 'border-y-2 border-[#5c3a28] bg-gradient-to-r from-[#422215] via-[#522d1d] to-[#3a1d12] text-[#d4bca4]'
                      : isFocused
                      ? 'bg-[#281149] text-white ring-2 ring-amber-400'
                      : isWiped
                      ? 'bg-[#2b2520] border-l-4 border-l-red-600 text-[#8f847b] opacity-90'
                      : 'bg-gradient-to-b from-[#eedecf] to-[#e4ceb9] text-[#1c140d]'
                  }`}
                >
                  {/* # Rank Pill */}
                  <div
                    className={`w-8 h-full flex items-center justify-center font-bold text-base border-r ${
                      isBooyah
                        ? 'bg-amber-600 text-black border-amber-700 font-black'
                        : isFire && !isWiped
                        ? 'bg-[#8f2702] text-white border-[#5a1400] font-black'
                        : isFire && isWiped
                        ? 'bg-[#2b140a] text-[#c49b80] border-[#401f11]'
                        : isFocused
                        ? 'bg-[#1a0b32] text-white border-[#3d1a6d]'
                        : isWiped
                        ? 'bg-[#1a1410] text-[#786c63] border-[#302620]'
                        : 'bg-[#23123f] text-white border-[#341b5c]'
                    }`}
                    style={{ fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif" }}
                  >
                    {rank}
                  </div>

                  {/* Team Logo & Tag */}
                  <div className="flex-1 flex items-center gap-2 pl-2 min-w-0 pr-1">
                    <div
                      className={`h-7 w-7 rounded shrink-0 flex items-center justify-center font-black text-[11px] shadow-sm border overflow-hidden ${
                        isFire && !isWiped
                          ? 'bg-[#fff4e6] border-[#ffa94d] text-[#d9480f]'
                          : isFire && isWiped
                          ? 'bg-[#4a2818] border-[#6b3c25] text-[#e0bda6]'
                          : isFocused
                          ? 'bg-[#3b1968] border-[#5d27a4] text-white'
                          : isWiped
                          ? 'bg-[#3d3228] border-[#524438] text-[#9c8e82]'
                          : 'bg-[#361e56] border-[#4e2c7a] text-white'
                      }`}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        tag.slice(0, 3).toUpperCase()
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`font-black text-[13px] tracking-wide truncate ${
                            isBooyah
                              ? 'text-black font-extrabold'
                              : isFire || isFocused
                              ? 'text-white'
                              : isWiped
                              ? 'text-[#8f847b] line-through decoration-red-500/80 decoration-2'
                              : 'text-[#19110a]'
                          }`}
                        >
                          {name}
                        </span>

                        {isBooyah && (
                          <span className="flex items-center gap-1 bg-black text-amber-300 px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider border border-amber-400/80 shadow-sm shrink-0">
                            👑 BOOYAH
                          </span>
                        )}

                        {isFire && !isWiped && !isBooyah && (
                          <span className="flex items-center gap-0.5 bg-black/40 text-[#ffeedd] px-1 py-0.2 rounded text-[9px] font-black tracking-wider border border-amber-400/60 shadow-sm shrink-0">
                            <Flame className="h-2.5 w-2.5 text-amber-300 fill-amber-300 animate-pulse" />
                            FIRE
                          </span>
                        )}

                        {isPointRushActive && !isWiped && !isBooyah && (
                          <span className="flex items-center gap-0.5 bg-yellow-400 text-black px-1 py-0.2 rounded text-[9px] font-black tracking-wider shrink-0 shadow-sm">
                            RUSH
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alive Players 4-Pill Squad Indicator */}
                  <div className="w-20 flex items-center justify-center gap-1 px-1">
                    {squadPlayers.map((status, pIdx) => {
                      let colorClass = 'bg-emerald-500 border-emerald-400';
                      if (status === 'knock') {
                        colorClass = 'bg-amber-400 border-amber-300 animate-pulse';
                      } else if (status === 'eliminated' || isWiped) {
                        colorClass = 'bg-neutral-800/80 border-neutral-700';
                      }

                      return (
                        <div
                          key={pIdx}
                          className={`h-5 w-2.5 rounded-xs border transition-colors ${colorClass}`}
                          title={`Player ${pIdx + 1}: ${status}`}
                        />
                      );
                    })}
                  </div>

                  {/* Kills (ELIMS) */}
                  <div
                    className={`w-11 text-center font-bold text-sm tracking-wide ${
                      isBooyah
                        ? 'text-black font-black'
                        : isFire || isFocused
                        ? 'text-white'
                        : isWiped
                        ? 'text-[#8f847b]'
                        : 'text-[#8a2211]'
                    }`}
                    style={{ fontFamily: "'Space Grotesk', 'Rajdhani', sans-serif" }}
                  >
                    {kills}
                  </div>

                  {/* Total Points (T.PTS) */}
                  <div
                    className={`w-12 text-right pr-2 font-black text-sm tracking-tight ${
                      isBooyah
                        ? 'text-black font-black'
                        : isFire || isFocused
                        ? 'text-white'
                        : isWiped
                        ? 'text-[#8f847b]'
                        : 'text-[#19110a]'
                    }`}
                    style={{ fontFamily: "'Space Grotesk', 'Rajdhani', sans-serif" }}
                  >
                    {totalPoints}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

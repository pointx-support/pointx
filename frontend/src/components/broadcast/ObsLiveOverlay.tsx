import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Flame, Crosshair } from 'lucide-react';
import type {
  AuthoritativeBroadcastState,
  BroadcastSyncStatus,
  PlayerState,
} from '../../types/broadcastSession';
import {
  initializeBroadcastSession,
  fetchSessionState,
  connectBroadcastSession,
} from '../../services/broadcastClient';

export interface ObsLiveOverlayProps {
  tournamentId?: string;
  matchId?: string;
  sessionId?: string;
  isTransparent?: boolean;
}

export const ObsLiveOverlay: React.FC<ObsLiveOverlayProps> = ({
  tournamentId: propTournamentId,
  matchId: propMatchId,
  sessionId: propSessionId,
  isTransparent = true,
}) => {
  // Query param fallbacks from window.location
  const [urlParams] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  );

  const effectiveSessionId = propSessionId || urlParams?.get('sessionId') || urlParams?.get('session') || '';
  const effectiveTournamentId = propTournamentId || urlParams?.get('tournamentId') || urlParams?.get('tournament') || '';
  const effectiveMatchId = propMatchId || urlParams?.get('matchId') || urlParams?.get('match') || undefined;

  const [state, setState] = useState<AuthoritativeBroadcastState | null>(null);
  const [syncStatus, setSyncStatus] = useState<BroadcastSyncStatus>('CONNECTING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let connection: { disconnect: () => void } | null = null;
    let isCancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        let activeSessionId = effectiveSessionId;
        let initialData: AuthoritativeBroadcastState;

        if (activeSessionId) {
          initialData = await fetchSessionState(activeSessionId);
        } else if (effectiveTournamentId) {
          const initRes = await initializeBroadcastSession(effectiveTournamentId, effectiveMatchId);
          activeSessionId = initRes.sessionId;
          initialData = initRes.state;
        } else {
          setError('No tournament or session ID specified for OBS overlay.');
          setLoading(false);
          return;
        }

        if (isCancelled) return;

        setState(initialData);
        setLoading(false);
        setSyncStatus('LIVE');

        // Connect real-time WebSocket room with gap detection
        connection = connectBroadcastSession(activeSessionId, initialData, {
          onState: (newState) => {
            if (!isCancelled && newState && (newState.sessionId || newState.tournamentId)) {
              setState(newState);
              setError(null);
            }
          },
          onStatusChange: (status) => {
            if (!isCancelled) {
              setSyncStatus(status);
            }
          },
          onOverlayEvent: (evt) => {
            if (evt?.hardReload) {
              window.location.reload();
            } else {
              fetchSessionState(activeSessionId)
                .then((fresh) => {
                  if (!isCancelled && fresh) {
                    setState(fresh);
                  }
                })
                .catch(() => {
                  window.location.reload();
                });
            }
          },
          onError: (err) => {
            console.warn('[ObsLiveOverlay] Sync error:', err);
          },
        });
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to connect to broadcast session.');
          setLoading(false);
          setSyncStatus('DISCONNECTED');
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (connection) {
        connection.disconnect();
      }
    };
  }, [effectiveSessionId, effectiveTournamentId, effectiveMatchId]);

  if (loading) {
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

  if (error || !state) {
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

  const {
    teams,
    tableVisible,
    activeMode,
    revision,
  } = state;

  return (
    <div
      className={`w-full min-h-screen flex items-start justify-end p-4 sm:p-8 select-none font-sans overflow-hidden ${
        isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
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
            {/* # Rank Header */}
            <div className="w-8 text-center text-[13px] font-bold text-slate-200">#</div>

            {/* TEAMS Header */}
            <div className="flex-1 pl-2 text-[12px] uppercase font-bold text-slate-100">TEAMS</div>

            {/* ALIVE Header */}
            <div className="w-20 text-center text-[11px] uppercase font-bold text-slate-100">
              ALIVE
            </div>

            {/* ELIMS Header */}
            <div className="w-11 text-center text-[11px] uppercase font-bold text-slate-100">
              ELIMS
            </div>

            {/* T.PTS. Header */}
            <div className="w-12 text-right pr-1 text-[11px] uppercase font-bold text-slate-100">
              T.PTS.
            </div>
          </div>

          {/* Sync indicator pill */}
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
              } = team;

              const isFire = isFireActive || activeMode === 'FIRE';

              return (
                <div
                  key={teamId}
                  className={`flex items-center h-11 transition-all relative ${
                    isFire && !isWiped
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
                      isFire && !isWiped
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
                        tag.slice(0, 3)
                      )}
                    </div>

                    {/* Team Tag */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`font-black text-sm uppercase tracking-tight truncate ${
                          (isFire && !isWiped) || isFocused
                            ? 'text-white'
                            : isFire && isWiped
                            ? 'text-[#f0d8c2]'
                            : isWiped
                            ? 'text-[#9c8e82] line-through'
                            : 'text-[#1a110a]'
                        }`}
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        {tag}
                      </span>

                      {/* Point Rush Badge */}
                      {isPointRushActive && (
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/80 text-amber-300 font-mono text-[9px] font-black shrink-0 shadow-sm animate-pulse"
                          title="Point Rush Active"
                        >
                          <Crosshair className="h-3 w-3 text-amber-300 shrink-0" />
                          <span className="hidden sm:inline tracking-wider">RUSH</span>
                        </div>
                      )}

                      {/* Fire Mode Flame */}
                      {isFire && !isWiped && (
                        <Flame className="h-4 w-4 text-amber-200 fill-amber-300 animate-pulse shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* ALIVE 4-Player Status Indicator Bars OR Wipeout Status */}
                  <div className="w-20 flex items-center justify-center px-1">
                    {isWiped ? (
                      <div className="flex items-center justify-center bg-red-950/90 border border-red-600/70 rounded px-1.5 py-0.5 shadow-sm">
                        <span className="text-[10px] font-black tracking-wider text-red-400 uppercase font-mono leading-none">
                          ELIMINATED
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-[3.5px]">
                        {squadPlayers.map((status: PlayerState, pIdx: number) => (
                          <div
                            key={pIdx}
                            title={`Player ${pIdx + 1}: ${status.toUpperCase()}`}
                            className={`h-5 w-[11px] rounded-[2px] transition-all ${
                              status === 'alive'
                                ? isFire
                                  ? 'bg-[#fff4e6] shadow-sm'
                                  : 'bg-[#c3822d] shadow-sm'
                                : status === 'knock'
                                ? 'bg-[#b91c1c] animate-pulse shadow-sm'
                                : isFire
                                ? 'border-[1.5px] border-[#fff4e6]/80 bg-transparent'
                                : isFocused
                                ? 'border-[1.5px] border-[#c3822d]/60 bg-transparent'
                                : 'border-[1.5px] border-[#a0743a] bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ELIMS Count */}
                  <div
                    className={`w-11 text-center font-bold text-base flex items-center justify-center ${
                      isFire && !isWiped
                        ? 'text-white font-black'
                        : isFire && isWiped
                        ? 'text-[#f0d8c2]'
                        : isFocused
                        ? 'text-white'
                        : isWiped
                        ? 'text-red-400/80'
                        : 'text-[#1b120a]'
                    }`}
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {kills}
                  </div>

                  {/* T.PTS. Count */}
                  <div
                    className={`w-12 text-right pr-2 font-black text-base ${
                      isFire && !isWiped
                        ? 'text-white font-black'
                        : isFire && isWiped
                        ? 'text-[#f0d8c2]'
                        : isFocused
                        ? 'text-white'
                        : isWiped
                        ? 'text-[#9c8e82]'
                        : 'text-[#1b120a]'
                    }`}
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {totalPoints}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= 3. BOTTOM LEGEND BAR ================= */}
        <div className="bg-[#1b0d33] text-white flex items-center justify-center gap-4 py-2 px-3 text-[11px] font-bold tracking-wider border-t border-[#3b1d6e]">
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] bg-[#c3822d]" />
            <span className="text-slate-200">ALIVE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] bg-[#b91c1c]" />
            <span className="text-slate-200">KNOCK</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] border-[1.5px] border-[#c3822d]" />
            <span className="text-slate-200">ELIMINATED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

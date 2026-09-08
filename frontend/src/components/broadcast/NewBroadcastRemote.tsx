import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertTriangle,
  Flame,
  Crosshair,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RotateCcw,
  Skull,
  ShieldCheck,
  Radio,
  Tv,
} from 'lucide-react';
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
import type { BroadcastSessionConnection } from '../../services/broadcastClient';
import { useTournamentStore } from '../../store/tournamentStore';

export interface NewBroadcastRemoteProps {
  tournamentId?: string;
  matchId?: string;
  sessionId?: string;
}

export const NewBroadcastRemote: React.FC<NewBroadcastRemoteProps> = ({
  tournamentId: propTournamentId,
  matchId: propMatchId,
  sessionId: propSessionId,
}) => {
  const storeTournament = useTournamentStore((s) => s.currentTournament);

  // URL Query param fallbacks
  const [urlParams] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  );

  const effectiveSessionId = propSessionId || urlParams?.get('sessionId') || urlParams?.get('session') || '';
  const effectiveTournamentId =
    propTournamentId || urlParams?.get('tournamentId') || urlParams?.get('tournament') || storeTournament?.id || '';
  const effectiveMatchId = propMatchId || urlParams?.get('matchId') || urlParams?.get('match') || undefined;

  const [state, setState] = useState<AuthoritativeBroadcastState | null>(null);
  const [syncStatus, setSyncStatus] = useState<BroadcastSyncStatus>('CONNECTING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<BroadcastSessionConnection | null>(null);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  useEffect(() => {
    let conn: BroadcastSessionConnection | null = null;
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
          setError('No tournament or session ID specified for Remote Control.');
          setLoading(false);
          return;
        }

        if (isCancelled) return;

        setState(initialData);
        setLoading(false);
        setSyncStatus('LIVE');

        // Connect real-time WebSocket room
        conn = connectBroadcastSession(activeSessionId, initialData, {
          onState: (newState) => {
            if (!isCancelled) {
              setState(newState);
            }
          },
          onStatusChange: (status) => {
            if (!isCancelled) {
              setSyncStatus(status);
            }
          },
          onError: (err) => {
            console.warn('[NewBroadcastRemote] Sync error:', err);
          },
        });

        if (!isCancelled) {
          setConnection(conn);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to initialize broadcast remote session.');
          setLoading(false);
          setSyncStatus('DISCONNECTED');
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (conn) {
        conn.disconnect();
      }
    };
  }, [effectiveSessionId, effectiveTournamentId, effectiveMatchId]);

  // Command dispatcher
  const executeCommand = useCallback(
    async (commandType: string, targetTeamId?: string, payload?: any) => {
      if (!connection) return;
      const cmdKey = `${commandType}:${targetTeamId || 'global'}`;
      setPendingCommand(cmdKey);
      try {
        await connection.sendCommand(commandType, targetTeamId, payload);
      } catch (err: any) {
        console.error(`[RemoteCommand Error] ${commandType}:`, err);
      } finally {
        setPendingCommand(null);
      }
    },
    [connection]
  );

  const handlePlayerToggle = (teamId: string, playerIndex: number, currentStatus: PlayerState) => {
    const nextMap: Record<PlayerState, PlayerState> = {
      alive: 'knock',
      knock: 'eliminated',
      eliminated: 'alive',
    };
    const nextStatus = nextMap[currentStatus];
    executeCommand('SET_PLAYER_STATUS', teamId, { playerIndex, status: nextStatus });
  };

  const handleMatchChange = (newMatchId: string) => {
    executeCommand('CHANGE_MATCH', undefined, { matchId: newMatchId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex items-center gap-3 bg-[#1b0d33] border border-[#3b1d6e] text-slate-200 px-6 py-4 rounded-xl shadow-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <div>
            <div className="font-bold text-sm">Connecting Remote Deck...</div>
            <div className="text-xs text-slate-400 font-mono">Initializing Authoritative Broadcast Session</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex items-center gap-3 bg-red-950/90 border border-red-700 text-red-200 px-6 py-4 rounded-xl shadow-2xl max-w-md">
          <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
          <div>
            <div className="font-bold text-sm">Remote Connection Error</div>
            <div className="text-xs text-red-300/80 font-mono mt-0.5">{error || 'Session unavailable.'}</div>
          </div>
        </div>
      </div>
    );
  }

  const {
    tournament,
    match,
    availableMatches,
    teams,
    revision,
    tableVisible,
    pointRushEnabled,
    aliveSquadsCount,
  } = state;

  const obsUrl = `${window.location.origin}/obs?tournamentId=${encodeURIComponent(tournament.id)}&matchId=${encodeURIComponent(match.id)}`;

  return (
    <div className="min-h-screen bg-[#0a0711] text-slate-100 flex flex-col font-sans pb-16">
      {/* ================= HEADER BAR ================= */}
      <header className="sticky top-0 z-40 bg-[#120a22]/95 backdrop-blur-md border-b border-[#2d1752] px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Tournament & Match Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center font-black text-amber-300 shrink-0">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                {tournament.title}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 border border-purple-700 text-purple-200">
                  {tournament.game}
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Match:</span>
                <select
                  aria-label="Select Match"
                  value={match.id}
                  onChange={(e) => handleMatchChange(e.target.value)}
                  className="bg-[#1b0d33] border border-[#3b1d6e] text-slate-200 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                >
                  {availableMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      M{m.matchNumber} ({m.mapName || 'Map'}) {m.status ? `[${m.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sync Status & Squad Counter & OBS Link */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Squads in Battle */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1d1136] border border-[#3c1d6e] text-xs font-mono">
              <span className="text-slate-400">Squads Alive:</span>
              <span className="font-bold text-emerald-400">
                {aliveSquadsCount}/{teams.length}
              </span>
            </div>

            {/* Sync Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                syncStatus === 'LIVE'
                  ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300'
                  : syncStatus === 'RECONNECTING'
                  ? 'bg-amber-950/50 border-amber-600 text-amber-300'
                  : 'bg-red-950/50 border-red-600 text-red-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus === 'LIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncStatus === 'RECONNECTING'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-red-500'
                }`}
              />
              <span>
                {syncStatus === 'LIVE' ? `LIVE (Rev ${revision})` : syncStatus}
              </span>
            </div>

            {/* OBS Overlay Button */}
            <a
              href={obsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors"
            >
              <Tv className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">OBS View</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-[#231240] flex flex-wrap items-center gap-2">
          {/* Table Visibility Toggle */}
          <button
            type="button"
            onClick={() => executeCommand('SET_TABLE_VISIBILITY', undefined, { visible: !tableVisible })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              tableVisible
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
            }`}
          >
            {tableVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{tableVisible ? 'Hide Table on OBS' : 'Show Table on OBS'}</span>
          </button>

          {/* Point Rush Toggle */}
          <button
            type="button"
            onClick={() => executeCommand('SET_POINT_RUSH', undefined, { enabled: !pointRushEnabled })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              pointRushEnabled
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-[#22133e] hover:bg-[#2e1a54] text-amber-300 border border-amber-500/30'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{pointRushEnabled ? 'Point Rush: ON' : 'Point Rush: OFF'}</span>
          </button>

          {/* +1 Pt All Teams */}
          <button
            type="button"
            onClick={() => executeCommand('ADD_POINT_ALL_TEAMS')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#22133e] hover:bg-[#2f1b57] border border-purple-500/40 text-purple-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>+1 Pt All Teams</span>
          </button>

          {/* Reset 4 Alive */}
          <button
            type="button"
            onClick={() => executeCommand('RESET_ALIVE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
            <span>Reset 4 Alive</span>
          </button>
        </div>
      </header>

      {/* ================= TEAMS GRID ================= */}
      <main className="max-w-7xl mx-auto w-full px-4 mt-6">
        {teams.length === 0 ? (
          <div className="bg-[#120a22] border border-[#2d1752] rounded-xl p-12 text-center text-slate-400 font-mono text-sm">
            No teams configured in this tournament.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team, idx) => {
              const {
                teamId,
                name,
                tag,
                slotNumber,
                logoUrl,
                kills,
                totalPoints,
                squadPlayers,
                isWiped,
                isFireActive,
                isPointRushActive,
                isFocused,
              } = team;

              const isCommandPending = pendingCommand?.includes(teamId);

              return (
                <div
                  key={teamId}
                  className={`rounded-xl border transition-all p-3.5 flex flex-col justify-between ${
                    isFireActive
                      ? 'bg-gradient-to-br from-[#2a0e08] via-[#1b091f] to-[#120a22] border-orange-500 shadow-lg shadow-orange-950/30'
                      : isFocused
                      ? 'bg-[#1a0e33] border-amber-400 shadow-md ring-1 ring-amber-400'
                      : isWiped
                      ? 'bg-[#100c14] border-red-900/50 opacity-80'
                      : 'bg-[#130b24] border-[#2d1752] hover:border-[#45237c]'
                  }`}
                >
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#231240]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Slot Badge */}
                      <span className="h-7 w-7 rounded bg-[#231240] border border-[#3b1d6e] flex items-center justify-center font-mono font-bold text-xs text-amber-400 shrink-0">
                        #{slotNumber || idx + 1}
                      </span>

                      {/* Team Logo */}
                      <div className="h-8 w-8 rounded bg-[#201038] border border-[#3b1d6e] overflow-hidden flex items-center justify-center shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-bold text-[10px] text-slate-300">{tag.slice(0, 3)}</span>
                        )}
                      </div>

                      {/* Team Tag & Name */}
                      <div className="min-w-0">
                        <div className="font-black text-sm text-white truncate uppercase tracking-wide">
                          {tag}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{name}</div>
                      </div>
                    </div>

                    {/* Quick Points & Kills Indicator */}
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <div className="text-xs font-mono font-black text-amber-400">{totalPoints} PTS</div>
                        <div className="text-[11px] font-mono text-slate-400">{kills} KILLS</div>
                      </div>

                      {/* Kill Adjuster Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Remove kill from ${tag}`}
                          disabled={isCommandPending}
                          onClick={() => executeCommand('REMOVE_KILL', teamId)}
                          className="h-7 w-7 rounded bg-[#231240] hover:bg-red-900/60 border border-red-700/50 text-red-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Add kill to ${tag}`}
                          disabled={isCommandPending}
                          onClick={() => executeCommand('ADD_KILL', teamId)}
                          className="h-7 w-8 rounded bg-[#231240] hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Players Alive / Knock / Elim Toggles */}
                  <div className="py-3">
                    <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Squad Status (Tap to cycle):</span>
                      <span className="text-amber-400 font-bold">
                        {isWiped
                          ? 'ALL ELIMINATED'
                          : `${squadPlayers.filter((p) => p === 'alive' || p === 'knock').length}/4 Alive`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {squadPlayers.map((status: PlayerState, pIdx: number) => {
                        const statusColors: Record<PlayerState, string> = {
                          alive: 'bg-emerald-950/80 border-emerald-500 text-emerald-200 hover:bg-emerald-900',
                          knock: 'bg-red-950/90 border-red-500 text-red-200 animate-pulse hover:bg-red-900',
                          eliminated: 'bg-neutral-900/90 border-neutral-700 text-neutral-500 hover:bg-neutral-800',
                        };

                        return (
                          <button
                            key={pIdx}
                            type="button"
                            disabled={isCommandPending}
                            onClick={() => handlePlayerToggle(teamId, pIdx, status)}
                            className={`py-2 px-1 rounded-md border text-[11px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${statusColors[status]}`}
                          >
                            <span className="text-[9px] text-slate-400">P{pIdx + 1}</span>
                            <span className="uppercase text-[10px] font-black">{status.slice(0, 5)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode & Squad Actions */}
                  <div className="pt-2 border-t border-[#231240] flex items-center justify-between gap-1.5 flex-wrap">
                    {/* Fire Button */}
                    <button
                      type="button"
                      disabled={isCommandPending}
                      onClick={() => executeCommand('SET_MODE', teamId, { mode: isFireActive ? 'NORMAL' : 'FIRE' })}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isFireActive
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-[#201038] text-orange-400 border border-orange-500/30 hover:bg-orange-950/40'
                      }`}
                    >
                      <Flame className="h-3 w-3" />
                      <span>FIRE</span>
                    </button>

                    {/* Point Rush Team Toggle */}
                    <button
                      type="button"
                      disabled={isCommandPending}
                      onClick={() => executeCommand('SET_POINT_RUSH', teamId, { enabled: !isPointRushActive })}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isPointRushActive
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-[#201038] text-amber-300 border border-amber-500/30 hover:bg-amber-950/40'
                      }`}
                    >
                      <Crosshair className="h-3 w-3" />
                      <span>RUSH</span>
                    </button>

                    {/* Wipe / Revive */}
                    {isWiped ? (
                      <button
                        type="button"
                        disabled={isCommandPending}
                        onClick={() => executeCommand('REVIVE_SQUAD', teamId)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-950/70 border border-emerald-600 text-emerald-300 hover:bg-emerald-900/60 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>Revive</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isCommandPending}
                        onClick={() => executeCommand('WIPE_SQUAD', teamId)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-red-950/70 border border-red-700 text-red-300 hover:bg-red-900/60 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                      >
                        <Skull className="h-3 w-3" />
                        <span>Wipe</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

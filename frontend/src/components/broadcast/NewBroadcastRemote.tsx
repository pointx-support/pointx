import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshCw,
  Skull,
  ShieldCheck,
  Radio,
  Tv,
  CheckCircle2,
  Send,
  Trophy,
  Clock,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import type {
  AuthoritativeBroadcastState,
  BroadcastSyncStatus,
  PlayerState,
  BroadcastSquadTeam,
} from '../../types/broadcastSession';
import {
  initializeBroadcastSession,
  fetchSessionState,
  connectBroadcastSession,
} from '../../services/broadcastClient';
import type { BroadcastSessionConnection } from '../../services/broadcastClient';
import { useTournamentStore } from '../../store/tournamentStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';

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
  const { showToast } = useToast();

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

  // FIFO Command Queue for sequential background delivery without drops
  const commandQueueRef = useRef<Array<{ commandType: string; targetTeamId?: string; payload?: any }>>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const connectionRef = useRef<BroadcastSessionConnection | null>(null);

  // Rapid Action Coalescing for Kills: debounces rapid clicks into a single delta command
  const pendingKillDeltasRef = useRef<Map<string, { delta: number; timer: any }>>(new Map());

  // Match Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportOverrides, setReportOverrides] = useState<Record<string, { placement?: number; kills?: number }>>({});

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
          onError: (err) => {
            console.warn('[NewBroadcastRemote] Sync error:', err);
          },
        });

        if (!isCancelled) {
          connectionRef.current = conn;
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
      connectionRef.current = null;
      for (const pending of pendingKillDeltasRef.current.values()) {
        if (pending.timer) clearTimeout(pending.timer);
      }
    };
  }, [effectiveSessionId, effectiveTournamentId, effectiveMatchId]);

  // Synchronous optimistic state update (<16ms, zero tap delay)
  const applyOptimisticUpdate = useCallback((commandType: string, targetTeamId?: string, payload?: any) => {
    setState((prevState) => {
      if (!prevState) return prevState;
      const next: AuthoritativeBroadcastState = {
        ...prevState,
        teams: [...prevState.teams],
      };

      if (commandType === 'SET_TABLE_VISIBILITY' && payload?.visible !== undefined) {
        next.tableVisible = payload.visible;
      } else if (commandType === 'SET_POINT_RUSH' && !targetTeamId && payload?.enabled !== undefined) {
        next.pointRushEnabled = payload.enabled;
      } else if (commandType === 'FINISH_MATCH') {
        next.isMatchFinished = true;
      } else if (commandType === 'REOPEN_MATCH') {
        next.isMatchFinished = false;
        next.isSubmittedToWebsite = false;
      } else if (commandType === 'RESET_ALIVE') {
        next.teams = next.teams.map((t) => ({
          ...t,
          squadPlayers: ['alive', 'alive', 'alive', 'alive'] as [PlayerState, PlayerState, PlayerState, PlayerState],
          alivePlayersCount: 4,
          isWiped: false,
        }));
        next.aliveSquadsCount = next.teams.length;
      } else if (commandType === 'ADD_POINT_ALL_TEAMS') {
        next.teams = next.teams.map((t) => ({
          ...t,
          totalPoints: t.totalPoints + 1,
        }));
      } else if (targetTeamId) {
        next.teams = next.teams.map((t) => {
          if (t.teamId !== targetTeamId) return t;
          const teamCopy: BroadcastSquadTeam = { ...t };
          if (commandType === 'ADD_KILL') {
            const delta = Number(payload?.delta ?? 1);
            teamCopy.kills = (teamCopy.kills || 0) + delta;
            teamCopy.killPoints = (teamCopy.killPoints || 0) + delta;
            teamCopy.totalPoints = (teamCopy.totalPoints || 0) + delta;
          } else if (commandType === 'REMOVE_KILL') {
            const delta = Number(payload?.delta ?? 1);
            const actualDelta = Math.min(teamCopy.kills || 0, delta);
            teamCopy.kills = Math.max(0, (teamCopy.kills || 0) - delta);
            teamCopy.killPoints = Math.max(0, (teamCopy.killPoints || 0) - actualDelta);
            teamCopy.totalPoints = Math.max(0, (teamCopy.totalPoints || 0) - actualDelta);
          } else if (commandType === 'SET_PLAYER_STATUS') {
            const { playerIndex, status } = payload || {};
            if (playerIndex !== undefined && status) {
              const newPlayers = [...teamCopy.squadPlayers] as [PlayerState, PlayerState, PlayerState, PlayerState];
              newPlayers[playerIndex] = status;
              teamCopy.squadPlayers = newPlayers;
              const aliveCount = newPlayers.filter((p) => p === 'alive' || p === 'knock').length;
              teamCopy.alivePlayersCount = aliveCount;
              teamCopy.isWiped = aliveCount === 0;
            }
          } else if (commandType === 'WIPE_SQUAD') {
            teamCopy.squadPlayers = ['eliminated', 'eliminated', 'eliminated', 'eliminated'];
            teamCopy.alivePlayersCount = 0;
            teamCopy.isWiped = true;
          } else if (commandType === 'REVIVE_SQUAD') {
            teamCopy.squadPlayers = ['alive', 'alive', 'alive', 'alive'];
            teamCopy.alivePlayersCount = 4;
            teamCopy.isWiped = false;
          } else if (commandType === 'SET_MODE' || commandType === 'SET_FIRE' || commandType === 'TOGGLE_FIRE') {
            teamCopy.isFireActive = payload?.fire !== undefined ? !!payload.fire : (payload?.mode === 'FIRE');
          } else if (commandType === 'SET_POINT_RUSH') {
            teamCopy.isPointRushActive = payload?.rush !== undefined ? !!payload.rush : !!payload?.enabled;
          }
          return teamCopy;
        });
        next.aliveSquadsCount = next.teams.filter((t) => !t.isWiped).length;
      }
      return next;
    });
  }, []);

  // Batch queue processor: drains queue in batches to eliminate serial network roundtrip lag
  const processQueue = useCallback(async () => {
    const conn = connectionRef.current || connection;
    if (isProcessingQueueRef.current || !conn) return;
    if (commandQueueRef.current.length === 0) return;

    isProcessingQueueRef.current = true;
    while (commandQueueRef.current.length > 0) {
      const batch = commandQueueRef.current.splice(0, commandQueueRef.current.length);
      try {
        if (batch.length === 1) {
          await conn.sendCommand(batch[0].commandType, batch[0].targetTeamId, batch[0].payload);
        } else if (batch.length > 1) {
          await conn.sendBatchCommands(batch);
        }
      } catch (err: any) {
        console.error('[RemoteCommand Error]', batch, err);
      }
    }
    isProcessingQueueRef.current = false;
  }, [connection]);

  // Flush pending kill accumulation for a specific team
  const flushPendingKill = useCallback(
    (targetTeamId: string) => {
      const pending = pendingKillDeltasRef.current.get(targetTeamId);
      if (!pending) return;
      if (pending.timer) clearTimeout(pending.timer);
      pendingKillDeltasRef.current.delete(targetTeamId);

      if (pending.delta === 0) return;

      const cmdType = pending.delta > 0 ? 'ADD_KILL' : 'REMOVE_KILL';
      const absDelta = Math.abs(pending.delta);
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      commandQueueRef.current.push({
        commandType: cmdType,
        targetTeamId,
        payload: { delta: absDelta, commandId },
      });
      processQueue();
    },
    [processQueue]
  );

  // Flush all pending kills across all teams immediately
  const flushAllPendingKills = useCallback(() => {
    const teamIds = Array.from(pendingKillDeltasRef.current.keys());
    for (const tId of teamIds) {
      flushPendingKill(tId);
    }
  }, [flushPendingKill]);

  // Command dispatcher: instant local feedback + rapid action coalescing for kills
  const executeCommand = useCallback(
    (commandType: string, targetTeamId?: string, payload?: any) => {
      // 1. Instant local optimistic update for immediate tactile response
      applyOptimisticUpdate(commandType, targetTeamId, payload);

      // 2. Rapid Action Coalescing for rapid +1 / -1 kill clicks (120ms aggregation window)
      if ((commandType === 'ADD_KILL' || commandType === 'REMOVE_KILL') && targetTeamId) {
        const rawDelta = Number(payload?.delta ?? 1);
        const signedDelta = commandType === 'ADD_KILL' ? rawDelta : -rawDelta;
        const existing = pendingKillDeltasRef.current.get(targetTeamId);

        if (existing?.timer) {
          clearTimeout(existing.timer);
        }

        const newDelta = (existing ? existing.delta : 0) + signedDelta;
        const timer = setTimeout(() => {
          flushPendingKill(targetTeamId);
        }, 120);

        pendingKillDeltasRef.current.set(targetTeamId, { delta: newDelta, timer });
        return;
      }

      // 3. For any other command (WIPE_SQUAD, FINISH_MATCH, SET_PLAYER_STATUS, etc.):
      // Flush pending kill increments first so elimination/match end incorporates all clicks
      flushAllPendingKills();

      const commandId = payload?.commandId || `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      commandQueueRef.current.push({
        commandType,
        targetTeamId,
        payload: { ...(payload || {}), commandId },
      });

      processQueue();
    },
    [applyOptimisticUpdate, flushAllPendingKills, flushPendingKill, processQueue]
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

  const handleToggleFinishMatch = () => {
    if (!state) return;
    if (state.isMatchFinished) {
      executeCommand('REOPEN_MATCH');
      showToast({
        type: 'info',
        title: 'Match Reopened',
        message: 'Match set back to LIVE. Placement points reset.',
      });
    } else {
      executeCommand('FINISH_MATCH');
      showToast({
        type: 'success',
        title: 'Match Finished!',
        message: 'Placement points computed! Review Match Report before pushing to website.',
      });
    }
  };

  const [isRefreshingObs, setIsRefreshingObs] = useState<boolean>(false);

  const handleRefreshObs = async () => {
    setIsRefreshingObs(true);
    try {
      executeCommand('REFRESH_OVERLAY', undefined, { hardReload: false });
      showToast({
        type: 'success',
        title: 'OBS Overlay Refreshed',
        message: 'Sent instant refresh signal to OBS broadcast view.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Refresh Failed',
        message: err.message || 'Could not refresh OBS overlay.',
      });
    } finally {
      setTimeout(() => setIsRefreshingObs(false), 600);
    }
  };

  const handleSubmitMatchReport = async () => {
    if (!connection || !state) return;
    setIsSubmittingReport(true);
    try {
      const overridesList = Object.entries(reportOverrides).map(([teamId, ov]) => ({
        teamId,
        placement: ov.placement,
        kills: ov.kills,
      }));

      const res = await connection.submitMatchReport(overridesList.length > 0 ? overridesList : undefined);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Report Pushed to Website!',
          message: 'Official match results & standings have been updated on the website.',
        });
        setIsReportModalOpen(false);
        setReportOverrides({});
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Submit Report',
        message: err?.message || 'Could not push report to website.',
      });
    } finally {
      setIsSubmittingReport(false);
    }
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
    isMatchFinished = false,
    isSubmittedToWebsite = false,
  } = state;

  const obsUrl = `${window.location.origin}/obs?tournamentId=${encodeURIComponent(tournament.id)}&matchId=${encodeURIComponent(match.id)}`;

  // Sorted teams for the Match Report
  const sortedReportTeams = [...teams].sort((a, b) => {
    if (a.placement !== b.placement) return a.placement - b.placement;
    return b.totalPoints - a.totalPoints;
  });

  return (
    <div className="min-h-screen bg-[#0a0711] text-slate-100 flex flex-col font-sans pb-20 select-none">
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

          {/* Status Badges & Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Match State Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-black border ${
                isMatchFinished
                  ? 'bg-purple-950/70 border-purple-600 text-purple-300'
                  : 'bg-amber-950/60 border-amber-500 text-amber-300'
              }`}
            >
              {isMatchFinished ? (
                <>
                  <Trophy className="h-3.5 w-3.5 text-purple-400" />
                  <span>FINISHED (Pts Added)</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>LIVE (No Placement Pts)</span>
                </>
              )}
            </div>

            {/* Website Submission Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                isSubmittedToWebsite
                  ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-700 text-slate-400'
              }`}
            >
              {isSubmittedToWebsite ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Website: Published</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Website: Staged</span>
                </>
              )}
            </div>

            {/* Squads in Battle */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1d1136] border border-[#3c1d6e] text-xs font-mono">
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
              <span>{syncStatus === 'LIVE' ? `LIVE (r${revision})` : syncStatus}</span>
            </div>

            {/* OBS Overlay Link */}
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

            {/* MATCH REPORT BUTTON (Highlighted) */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              style={{ touchAction: 'manipulation' }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer ${
                isMatchFinished && !isSubmittedToWebsite
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black animate-pulse shadow-amber-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              <span>Match Report</span>
            </button>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-[#231240] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Table Visibility Toggle */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={() => executeCommand('SET_TABLE_VISIBILITY', undefined, { visible: !tableVisible })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all active:scale-95 cursor-pointer ${
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
              style={{ touchAction: 'manipulation' }}
              onClick={() => executeCommand('SET_POINT_RUSH', undefined, { enabled: !pointRushEnabled })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all active:scale-95 cursor-pointer ${
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
              style={{ touchAction: 'manipulation' }}
              onClick={() => executeCommand('ADD_POINT_ALL_TEAMS')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#22133e] hover:bg-[#2f1b57] border border-purple-500/40 text-purple-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              <span>+1 Pt All Teams</span>
            </button>

            {/* Reset 4 Alive */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={() => executeCommand('RESET_ALIVE')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
              <span>Reset 4 Alive</span>
            </button>

            {/* Refresh OBS Overlay */}
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={handleRefreshObs}
              disabled={isRefreshingObs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Instantly send refresh/re-sync signal to the OBS overlay"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${isRefreshingObs ? 'animate-spin' : ''}`} />
              <span>{isRefreshingObs ? 'Refreshing...' : 'Refresh OBS'}</span>
            </button>
          </div>

          {/* Finish / Reopen Match Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={handleToggleFinishMatch}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-black transition-all active:scale-95 cursor-pointer ${
                isMatchFinished
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/40'
                  : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg'
              }`}
            >
              {isMatchFinished ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Re-open Match</span>
                </>
              ) : (
                <>
                  <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Finish Match (Award Placements)</span>
                </>
              )}
            </button>
          </div>
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
                placement,
                placementPoints,
                totalPoints,
                squadPlayers,
                isWiped,
                isFireActive,
                isPointRushActive,
                isFocused,
              } = team;

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
                        <div className="text-xs font-mono font-black text-amber-400">
                          {totalPoints} PTS
                          {placementPoints > 0 && (
                            <span className="text-[10px] text-emerald-400 font-bold ml-1">
                              (+{placementPoints}pl)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {kills} KILLS {placement ? `• #${placement}` : ''}
                        </div>
                      </div>

                      {/* Kill Adjuster Buttons (Instant clicks, zero-lag) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Remove kill from ${tag}`}
                          style={{ touchAction: 'manipulation' }}
                          onClick={() => executeCommand('REMOVE_KILL', teamId)}
                          className="h-8 w-8 rounded bg-[#231240] hover:bg-red-900/60 active:scale-90 border border-red-700/50 text-red-300 flex items-center justify-center transition-transform cursor-pointer"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Add kill to ${tag}`}
                          style={{ touchAction: 'manipulation' }}
                          onClick={() => executeCommand('ADD_KILL', teamId)}
                          className="h-8 w-9 rounded bg-[#231240] hover:bg-emerald-900/60 active:scale-90 border border-emerald-600/50 text-emerald-300 font-black text-xs flex items-center justify-center transition-transform cursor-pointer"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 Players Alive / Knock / Elim Toggles (Instant clicks, zero-lag) */}
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
                            style={{ touchAction: 'manipulation' }}
                            onClick={() => handlePlayerToggle(teamId, pIdx, status)}
                            className={`py-2 px-1 rounded-md border text-[11px] font-mono font-bold flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90 cursor-pointer ${statusColors[status]}`}
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
                      style={{ touchAction: 'manipulation' }}
                      onClick={() => executeCommand('SET_MODE', teamId, { mode: isFireActive ? 'NORMAL' : 'FIRE', fire: !isFireActive })}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
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
                      style={{ touchAction: 'manipulation' }}
                      onClick={() => executeCommand('SET_POINT_RUSH', teamId, { enabled: !isPointRushActive })}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
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
                        style={{ touchAction: 'manipulation' }}
                        onClick={() => executeCommand('REVIVE_SQUAD', teamId)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-950/70 border border-emerald-600 text-emerald-300 hover:bg-emerald-900/60 flex items-center gap-1 transition-all active:scale-95 cursor-pointer ml-auto"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>Revive</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        style={{ touchAction: 'manipulation' }}
                        onClick={() => executeCommand('WIPE_SQUAD', teamId)}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-red-950/70 border border-red-700 text-red-300 hover:bg-red-900/60 flex items-center gap-1 transition-all active:scale-95 cursor-pointer ml-auto"
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

      {/* ================= MATCH REPORT MODAL ================= */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Verify Match Report & Push to Website"
        description={`Review final placements, kills, and points for Match ${match.matchNumber} (${match.mapName || 'Map'}) before publishing to the official tournament standings.`}
        maxWidth="2xl"
      >
        <div className="space-y-4 pt-2">
          {/* Status & Placement info banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#190d30] border border-[#3b1d6e] text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {isMatchFinished ? (
                  <strong className="text-emerald-400 font-bold">
                    Match is Finished. Placement points are calculated.
                  </strong>
                ) : (
                  <strong className="text-amber-400 font-bold">
                    Match is Live. Placement points are deferred until finished.
                  </strong>
                )}
              </span>
            </div>

            <button
              type="button"
              style={{ touchAction: 'manipulation' }}
              onClick={handleToggleFinishMatch}
              className={`px-3 py-1 rounded font-bold text-xs cursor-pointer active:scale-95 transition-all ${
                isMatchFinished
                  ? 'bg-neutral-800 text-slate-300 hover:bg-neutral-700'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isMatchFinished ? 'Re-open Match' : 'Mark Match Finished'}
            </button>
          </div>

          {/* Teams Placements & Points Table */}
          <div className="border border-[#2d1752] rounded-lg overflow-hidden bg-[#100a1c]">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b0e33] text-slate-300 font-mono text-[11px] sticky top-0 z-10 border-b border-[#3b1d6e]">
                  <tr>
                    <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Kills</th>
                    <th className="py-2.5 px-3 text-right">Pl. Pts</th>
                    <th className="py-2.5 px-3 text-right">Kill Pts</th>
                    <th className="py-2.5 px-3 text-right font-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23133d] font-mono">
                  {sortedReportTeams.map((t, idx) => {
                    const currentKills = reportOverrides[t.teamId]?.kills !== undefined
                      ? reportOverrides[t.teamId].kills!
                      : t.kills;

                    return (
                      <tr
                        key={t.teamId}
                        className={`hover:bg-[#1f113a]/50 transition-colors ${
                          idx === 0 ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-bold">
                          {idx === 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-black">
                              <Trophy className="h-3.5 w-3.5" /> #1
                            </span>
                          ) : (
                            <span className="text-slate-400">#{t.placement || idx + 1}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase">{t.tag}</span>
                            <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{t.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {idx === 0 && !t.isWiped ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              BOOYAH
                            </span>
                          ) : t.isWiped ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/40">
                              ELIM
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              ALIVE
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              style={{ touchAction: 'manipulation' }}
                              onClick={() => {
                                const newKills = Math.max(0, currentKills - 1);
                                setReportOverrides((prev) => ({
                                  ...prev,
                                  [t.teamId]: { ...prev[t.teamId], kills: newKills },
                                }));
                              }}
                              className="h-5 w-5 rounded bg-[#231240] hover:bg-red-900/60 text-red-300 flex items-center justify-center cursor-pointer active:scale-90"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-white">{currentKills}</span>
                            <button
                              type="button"
                              style={{ touchAction: 'manipulation' }}
                              onClick={() => {
                                const newKills = currentKills + 1;
                                setReportOverrides((prev) => ({
                                  ...prev,
                                  [t.teamId]: { ...prev[t.teamId], kills: newKills },
                                }));
                              }}
                              className="h-5 w-5 rounded bg-[#231240] hover:bg-emerald-900/60 text-emerald-300 flex items-center justify-center cursor-pointer active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-300">
                          {isMatchFinished ? t.placementPoints : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-300">
                          {currentKills}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-amber-400">
                          {isMatchFinished ? t.placementPoints + currentKills : currentKills}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#231240]">
            <div className="text-xs text-slate-400 font-mono">
              {isSubmittedToWebsite ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Report is currently LIVE on the website.
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Website standings are NOT updated until pushed below.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#1f1338] hover:bg-[#2c1b4f] text-slate-300 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                style={{ touchAction: 'manipulation' }}
                disabled={isSubmittingReport}
                onClick={handleSubmitMatchReport}
                className={`px-5 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isSubmittedToWebsite
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/25'
                }`}
              >
                {isSubmittingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubmittedToWebsite ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>
                  {isSubmittingReport
                    ? 'Publishing...'
                    : isSubmittedToWebsite
                    ? 'Re-Push Updated Report to Website'
                    : 'Push Report to Website & Standings'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

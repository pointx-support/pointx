import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  AlertTriangle,
  Flame,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RotateCcw,
  Skull,
  Radio,
  CheckCircle2,
  FileCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';
import type { PlayerState } from '../../types/broadcastSession';
import { CanonicalLiveStore, type CanonicalLiveMatchState } from '../../services/canonicalLiveStore';
import { RealtimeSyncClient, type ConnectionState } from '../../services/broadcastSync';
import { useTournamentStore } from '../../store/tournamentStore';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MatchReportView, type MatchReportData } from './MatchReportView';
import { getStoredToken } from '../../services/api';

export interface NewBroadcastRemoteProps {
  tournamentId?: string;
  matchId?: string;
  sessionId?: string;
}

export const NewBroadcastRemote: React.FC<NewBroadcastRemoteProps> = ({
  tournamentId: propTournamentId,
  matchId: propMatchId,
}) => {
  const storeTournament = useTournamentStore((s) => s.currentTournament);
  const { showToast } = useToast();

  const [urlParams] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  );

  const effectiveTournamentId =
    propTournamentId || urlParams?.get('tournamentId') || urlParams?.get('tournament') || storeTournament?.id || '';
  const effectiveMatchId = propMatchId || urlParams?.get('matchId') || urlParams?.get('match') || undefined;
  const isDebugUrl = urlParams?.get('debug') === 'true';

  const [canonicalState, setCanonicalState] = useState<CanonicalLiveMatchState | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string>(effectiveMatchId || 'none');
  const [pointRushThresholdInput, setPointRushThresholdInput] = useState<number>(50);
  const [isSwitchingMatch, setIsSwitchingMatch] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'LIVE' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<any>(null);

  // Match Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [finalizedReport, setFinalizedReport] = useState<MatchReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [isPublishingReport, setIsPublishingReport] = useState<boolean>(false);
  const [isReportPublished, setIsReportPublished] = useState<boolean>(false);
  const [confirmNextModalOpen, setConfirmNextModalOpen] = useState<boolean>(false);
  const [sortAliveFirst, setSortAliveFirst] = useState<boolean>(true);
  // Diagnostic panel toggle
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(isDebugUrl);
  const [lastSentCommand, setLastSentCommand] = useState<string>('None');
  const [lastCommandId, setLastCommandId] = useState<string>('None');

  const totalMatchCount = Math.max(
    tournamentInfo?.matchCount || 6,
    availableMatches.length,
    6
  );

  const matchOptions = useMemo(() => {
    const list: Array<{ id: string; label: string; number: number }> = [];
    for (let i = 1; i <= totalMatchCount; i++) {
      const existing = availableMatches.find(
        (m: any) => m.matchNumber === i || (m.id || m.customId) === `live-match-${i}`
      );
      if (existing) {
        list.push({
          id: existing.id || existing.customId,
          label: existing.customLabel || `Match ${i}`,
          number: i,
        });
      } else {
        list.push({
          id: `live-match-${i}`,
          label: `Match ${i}`,
          number: i,
        });
      }
    }
    return list;
  }, [availableMatches, totalMatchCount]);

  // Initialize and resolve actual matches (strictly zero-match valid)
  useEffect(() => {
    let isCancelled = false;
    const liveStore = CanonicalLiveStore.getInstance();
    const syncClient = RealtimeSyncClient.getInstance();

    async function loadTournamentContext() {
      if (!effectiveTournamentId) {
        setLoading(false);
        setError('No tournament ID specified for Remote Control.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch authoritative tournament data from backend with auth header and public fallback
        const token = getStoredToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        let json: any = null;

        try {
          const res = await fetch(`/api/tournaments/${encodeURIComponent(effectiveTournamentId)}`, { headers });
          if (res.ok) {
            json = await res.json();
          }
        } catch {}

        if (!json?.success || !json?.data) {
          try {
            const pubRes = await fetch(`/api/tournaments/public/${encodeURIComponent(effectiveTournamentId)}`);
            if (pubRes.ok) {
              json = await pubRes.json();
            }
          } catch {}
        }

        if (isCancelled) return;

        if (!json?.success || !json?.data) {
          setError(`Tournament "${effectiveTournamentId}" not found.`);
          setLoading(false);
          return;
        }

        const tour = json.data;
        setTournamentInfo(tour);
        const matches = Array.isArray(tour.matches) ? tour.matches : [];
        setAvailableMatches(matches);

        const orgId = tour.organizationId ? String(tour.organizationId) : 'org-default';

        if (matches.length === 0) {
          // Zero-match state: connect to virtual 'live-match-1' session so Remote deck works seamlessly
          setActiveMatchId('live-match-1');
          liveStore.setMatchContext(orgId, effectiveTournamentId, 'live-match-1');
          setLoading(false);
          return;
        }

        const currentTargetMatch = effectiveMatchId
          ? matches.find((m: any) => (m.id || m.customId) === effectiveMatchId) || matches[0]
          : matches[0];

        const targetId = currentTargetMatch.id || currentTargetMatch.customId;
        setActiveMatchId(targetId);
        liveStore.setMatchContext(orgId, effectiveTournamentId, targetId);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to connect to tournament.');
          setLoading(false);
        }
      }
    }

    loadTournamentContext();

    // Subscribe to Authoritative Live State updates
    const unsubLive = liveStore.subscribe((cState) => {
      if (!isCancelled && cState) {
        setCanonicalState(cState);
        setLoading(false);
        setError(null);
        setSyncStatus('LIVE');
        if (cState.pointRushThreshold) {
          setPointRushThresholdInput(cState.pointRushThreshold);
        }
      }
    });

    // Subscribe to Next Match transitions
    const unsubNext = liveStore.subscribeNextMatch((nextData) => {
      setIsSwitchingMatch(false);
      if (!isCancelled && nextData && nextData.nextMatchId) {
        setActiveMatchId(nextData.nextMatchId);
        const org = canonicalState?.organizationId || 'org-default';
        liveStore.setMatchContext(org, effectiveTournamentId, nextData.nextMatchId);
        showToast({
          type: 'success',
          title: 'Switched to Next Match',
          message: `Match ${nextData.nextMatchNumber} is now active.`,
        });
      }
    });

    // Subscribe to Match Finalization event
    const unsubFinalized = liveStore.subscribeFinalizedMatch((report) => {
      if (!isCancelled && report) {
        setFinalizedReport(report);
        setIsReportModalOpen(true);
        showToast({
          type: 'success',
          title: 'Match Finalized!',
          message: 'Authoritative match report generated and ready for review.',
        });
      }
    });

    // Track WebSocket connection health
    const unsubConn = syncClient.subscribeConnection((connState: ConnectionState) => {
      if (!isCancelled) {
        setSyncStatus(connState === 'CONNECTED' ? 'LIVE' : 'CONNECTING');
      }
    });

    return () => {
      isCancelled = true;
      unsubLive();
      unsubNext();
      unsubFinalized();
      unsubConn();
    };
  }, [effectiveTournamentId, effectiveMatchId, showToast]);

  // Command dispatcher: direct WebSocket execution
  const executeCommand = useCallback(
    (commandType: any, payload: any = {}) => {
      if (activeMatchId === 'none' && commandType !== 'SET_TABLE_VISIBILITY') {
        showToast({
          type: 'error',
          title: 'No Active Match',
          message: 'Cannot execute commands because there are no matches in this tournament.',
        });
        return;
      }

      const liveStore = CanonicalLiveStore.getInstance();
      const cmdId = liveStore.sendCommand(commandType, payload);
      setLastSentCommand(commandType);
      setLastCommandId(cmdId);
    },
    [activeMatchId, showToast]
  );

  const handleAddKill = (teamId: string, delta: number) => {
    executeCommand('ADD_KILLS', { teamId, delta });
  };

  const handlePlayerToggle = (teamId: string, playerId: string, currentStatus: PlayerState) => {
    const nextMap: Record<PlayerState, PlayerState> = {
      alive: 'knock',
      knock: 'eliminated',
      eliminated: 'alive',
    };
    const nextStatus = nextMap[currentStatus];
    executeCommand('SET_PLAYER_STATUS', { teamId, playerId, status: nextStatus });
  };

  const handleWipeSquad = (teamId: string) => {
    executeCommand('WIPE_SQUAD', { teamId });
  };

  const handleReviveSquad = (teamId: string) => {
    executeCommand('REVIVE_SQUAD', { teamId });
  };

  const handleToggleTeamFire = (teamId: string) => {
    executeCommand('TOGGLE_TEAM_FIRE', { teamId });
  };

  const handleToggleTeamRush = (teamId: string) => {
    executeCommand('TOGGLE_TEAM_RUSH', { teamId });
  };

  const handleResetAlive = () => {
    executeCommand('RESET_ALIVE', {});
    showToast({
      type: 'info',
      title: 'Squads Reset',
      message: 'All players reset to ALIVE.',
    });
  };

  const handleToggleTableVisibility = () => {
    const currentVis = canonicalState?.tableVisible ?? true;
    executeCommand('SET_TABLE_VISIBILITY', { visible: !currentVis });
  };

  const handleMatchSelect = (targetId: string) => {
    if (targetId === activeMatchId) return;
    setActiveMatchId(targetId);
    const org = canonicalState?.organizationId || tournamentInfo?.organizationId || 'org-default';
    CanonicalLiveStore.getInstance().setMatchContext(org, effectiveTournamentId, targetId);
  };

  const handleNextMatch = () => {
    setConfirmNextModalOpen(true);
  };

  const handleConfirmNextMatch = () => {
    setIsSwitchingMatch(true);
    setConfirmNextModalOpen(false);
    executeCommand('NEXT_MATCH', {});
    setTimeout(() => {
      setIsSwitchingMatch(false);
      showToast({
        type: 'success',
        title: 'Next Match Started',
        message: 'All squads revived, match kills reset, and previous standings retained.',
      });
    }, 500);
  };

  const handleSavePointRushThreshold = () => {
    executeCommand('SET_POINT_RUSH_THRESHOLD', { threshold: pointRushThresholdInput });
    showToast({
      type: 'success',
      title: 'Point Rush Updated',
      message: `Threshold set to ${pointRushThresholdInput} points.`,
    });
  };

  const handleOpenReportModal = async () => {
    if (!activeMatchId || activeMatchId === 'none') return;

    try {
      setIsLoadingReport(true);
      setIsReportPublished(false);
      const res = await fetch(`/api/reports/${encodeURIComponent(effectiveTournamentId)}/${encodeURIComponent(activeMatchId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFinalizedReport(data.data);
        setIsReportModalOpen(true);
      } else {
        showToast({
          type: 'info',
          title: 'Report Unavailable',
          message: 'Could not load report for current match.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not load match report.',
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handlePublishReport = async (editedResults?: any[]) => {
    if (!activeMatchId || activeMatchId === 'none') return;
    try {
      setIsPublishingReport(true);
      const token = getStoredToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/reports/${encodeURIComponent(effectiveTournamentId)}/${encodeURIComponent(activeMatchId)}/publish`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ results: editedResults })
      });
      const data = await res.json();
      if (data.success) {
        setIsReportPublished(true);
        const matchNum = data.data?.match?.matchNumber || data.data?.matchNumber || 1;

        // Immediately update frontend tournament store with the newly published match
        useTournamentStore.getState().refreshCurrentTournament(effectiveTournamentId);

        showToast({
          type: 'success',
          title: 'Report Published',
          message: `Match ${matchNum} report pushed to tournament on website! Transferring Remote to Match ${matchNum + 1}...`,
        });

        // Automatically transfer Remote to the second/next match
        setTimeout(() => {
          setIsReportModalOpen(false);
          setIsPublishingReport(false);
          executeCommand('NEXT_MATCH', {});
        }, 1200);
      } else {
        showToast({
          type: 'error',
          title: 'Publish Failed',
          message: data.message || 'Failed to publish match report.',
        });
        setIsPublishingReport(false);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Could not push report to website.',
      });
      setIsPublishingReport(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex items-center gap-3 bg-[#1b0d33] border border-[#3b1d6e] text-slate-200 px-6 py-4 rounded-xl shadow-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <div>
            <div className="font-bold text-sm">Connecting Remote Deck...</div>
            <div className="text-xs text-slate-400 font-mono">Initializing Authoritative Live Sync</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex items-center gap-3 bg-red-950/90 border border-red-700 text-red-200 px-6 py-4 rounded-xl shadow-2xl max-w-md">
          <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
          <div>
            <div className="font-bold text-sm">Remote Connection Error</div>
            <div className="text-xs text-red-300/80 font-mono mt-0.5">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Zero-Match Empty State (Zero-Match Valid Guarantee)
  if (activeMatchId === 'none' && availableMatches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d0914] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center gap-4 bg-[#1b0d33] border border-[#3b1d6e] text-slate-200 p-8 rounded-2xl shadow-2xl max-w-md text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Radio className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">No Matches Created Yet</h2>
            <p className="text-xs text-slate-400 mt-1">
              "{tournamentInfo?.title || 'This tournament'}" currently has 0 matches.
              Opening the Remote does not create matches automatically.
            </p>
          </div>
          <a
            href={`/workspace?tournamentId=${encodeURIComponent(effectiveTournamentId)}&tab=matches`}
            className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <span>Create Match 1 in Workspace</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const teamsList = canonicalState?.teams ? Object.values(canonicalState.teams) : [];

  const checkTeamWiped = useCallback((team: any): boolean => {
    if (team.isEliminated === true) return true;
    const rawPlayers = team.players ? Object.entries(team.players) : [];
    if (rawPlayers.length > 0) {
      return rawPlayers.every(([, p]: any) => p?.status === 'eliminated');
    }
    return false;
  }, []);

  const { aliveTeams, wipedTeams } = useMemo(() => {
    const alive: any[] = [];
    const wiped: any[] = [];
    for (const team of teamsList) {
      if (checkTeamWiped(team)) {
        wiped.push(team);
      } else {
        alive.push(team);
      }
    }
    alive.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
    wiped.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
    return { aliveTeams: alive, wipedTeams: wiped };
  }, [teamsList, checkTeamWiped]);

  const sortedTeams = useMemo(() => {
    if (!sortAliveFirst) {
      return [...teamsList].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
    }
    return [...aliveTeams, ...wipedTeams];
  }, [sortAliveFirst, teamsList, aliveTeams, wipedTeams]);

  const tableVisible = canonicalState?.tableVisible ?? true;
  const revision = canonicalState?.revision ?? 1;
  const fireTeamId = canonicalState?.fireTeamId;

  const currentMatchDoc = availableMatches.find((m: any) => (m.id || m.customId) === activeMatchId);
  const obsUrl = `${window.location.origin}/obs?tournamentId=${encodeURIComponent(effectiveTournamentId)}&matchId=${encodeURIComponent(activeMatchId)}`;

  const renderTeamCard = (team: any) => {
    const isFire = team.isOnFire === true || (team.isOnFire !== false && team.teamId === fireTeamId);
    const isRush = Boolean(team.pointRushEnabled);
    const rawPlayers = team.players
      ? (Object.entries(team.players) as [string, { status: PlayerState; updatedAt?: number }][])
      : [];
    const players: [string, { status: PlayerState; updatedAt?: number }][] = [...rawPlayers];
    while (players.length < 4) {
      const pSlot = players.length + 1;
      players.push([`${team.teamId}-p${pSlot}`, { status: 'alive', updatedAt: Date.now() }]);
    }
    const isWiped = players.length > 0 && players.every(([, p]) => p.status === 'eliminated');

    return (
      <div
        key={team.teamId}
        className={`rounded-xl border transition-all p-4 flex flex-col justify-between shadow-lg relative overflow-hidden ${
          isFire && !isWiped
            ? 'bg-gradient-to-b from-[#2d1209] to-[#1a0c06] border-orange-500/80 shadow-orange-950/40'
            : isWiped
            ? 'bg-[#140f1a] border-red-950/60 opacity-75'
            : 'bg-[#1b1031] border-[#371963] hover:border-[#522594]'
        }`}
      >
        {/* Team Card Header */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Slot Badge */}
              <span className="h-6 w-6 rounded bg-[#2c1550] border border-[#482382] text-slate-200 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                {team.slotNumber || 1}
              </span>
              <div className="min-w-0">
                <div className="font-black text-sm text-white tracking-wide truncate">
                  {team.name || `Team ${team.slotNumber}`}
                </div>
                {team.tag && (
                  <div className="text-[10px] font-mono text-purple-300 uppercase">
                    {team.tag}
                  </div>
                )}
              </div>
            </div>

            {/* Manual / Automatic Fire and Rush Toggle Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleTeamFire(team.teamId)}
                title={isFire ? "Turn OFF Fire for this team" : "Turn ON Fire for this team"}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider transition-all cursor-pointer active:scale-95 border ${
                  isFire
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400 shadow-md shadow-orange-950/50 animate-pulse'
                    : 'bg-neutral-900/80 hover:bg-orange-950/40 text-neutral-400 hover:text-orange-300 border-neutral-800'
                }`}
              >
                <Flame className={`h-3 w-3 ${isFire ? 'fill-white text-white' : 'text-neutral-400'}`} />
                <span>FIRE</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleTeamRush(team.teamId)}
                title={isRush ? "Turn OFF Rush for this team" : "Turn ON Rush for this team"}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider transition-all cursor-pointer active:scale-95 border ${
                  isRush
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-300 shadow-md shadow-yellow-950/50 font-black'
                    : 'bg-neutral-900/80 hover:bg-yellow-950/40 text-neutral-400 hover:text-yellow-300 border-neutral-800'
                }`}
              >
                <span className="text-[11px]">⚡</span>
                <span>RUSH</span>
              </button>
            </div>
          </div>

          {/* Eliminations & Points Row */}
          <div className="mt-3 flex items-center justify-between bg-black/25 rounded-lg p-2 border border-purple-950">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Elims</span>
                <span className="text-lg font-black text-rose-400 font-mono leading-none">
                  {team.kills}
                </span>
              </div>
              <div className="h-6 w-px bg-purple-900/40" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Pts</span>
                <span className="text-lg font-black text-amber-400 font-mono leading-none">
                  {team.points}
                </span>
              </div>
            </div>

            {/* Quick +1 / -1 Kill Stepper Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAddKill(team.teamId, -1)}
                className="h-8 w-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-200 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer active:scale-95 shadow"
                title="Decrement elimination"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleAddKill(team.teamId, 1)}
                className="h-8 w-11 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center font-black text-sm transition-colors cursor-pointer active:scale-95 shadow-md shadow-rose-950/50"
                title="Add elimination (+1)"
              >
                <Plus className="h-4 w-4 mr-0.5" />
                <span>1</span>
              </button>
            </div>
          </div>

          {/* Player Statuses (P1 to P4) */}
          <div className="mt-3">
            <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">
              Player States (Tap to toggle)
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {players.map(([pId, pData], idx) => {
                const status = pData.status;
                let statusColor = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
                let label = 'ALIVE';

                if (status === 'knock') {
                  statusColor = 'bg-amber-950/60 border-amber-500/60 text-amber-300 animate-pulse';
                  label = 'KNOCK';
                } else if (status === 'eliminated') {
                  statusColor = 'bg-neutral-900 border-neutral-700 text-neutral-500';
                  label = 'DEAD';
                }

                return (
                  <button
                    key={pId}
                    onClick={() => handlePlayerToggle(team.teamId, pId, status)}
                    className={`py-1.5 px-1 rounded border text-[10px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${statusColor}`}
                  >
                    <span>P{idx + 1}</span>
                    <span className="text-[8px] font-black">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Squad Quick Actions: Wipe / Revive */}
        <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between gap-2">
          <button
            onClick={() => handleWipeSquad(team.teamId)}
            className="flex-1 py-1 px-2 rounded bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-neutral-800 text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Skull className="h-3 w-3" />
            <span>Wipe</span>
          </button>
          <button
            onClick={() => handleReviveSquad(team.teamId)}
            className="flex-1 py-1 px-2 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Revive</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0914] text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Top Navigation Header */}
      <header className="bg-[#170e2b] border-b border-[#3b1d6e] px-4 py-3 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Tournament Identity */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-inner font-black text-sm">
              PX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
                  {tournamentInfo?.title || 'Live Match Remote'}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    syncStatus === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {syncStatus}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Rev #{revision}</span>
                <span>•</span>
                <span>Match: {currentMatchDoc?.customLabel || `Match ${canonicalState?.matchNumber || 1}`}</span>
              </div>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex items-center gap-2">
            {/* Table Hide / Show Toggle */}
            <Button
              size="sm"
              variant={tableVisible ? 'primary' : 'secondary'}
              onClick={handleToggleTableVisibility}
              className={`flex items-center gap-1.5 text-xs font-bold ${
                tableVisible
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300'
              }`}
            >
              {tableVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{tableVisible ? 'Table Visible' : 'Table Hidden'}</span>
            </Button>

            {/* Match Select Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#241544] border border-[#482488] rounded-lg px-2.5 py-1">
              <span className="text-slate-400 font-mono text-xs font-semibold">Match:</span>
              <select
                value={activeMatchId}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="bg-transparent text-white text-xs font-bold py-0.5 focus:outline-none cursor-pointer"
              >
                {matchOptions.map((opt: { id: string; label: string; number: number }) => (
                  <option key={opt.id} value={opt.id} className="bg-[#1b0d33] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Finalized Report Button */}
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenReportModal}
              disabled={isLoadingReport}
              className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Report</span>
            </Button>

            {/* Diagnostics Toggle */}
            <button
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className="p-1.5 rounded-lg bg-[#241544] hover:bg-[#341d63] text-slate-300 border border-[#482488] text-xs font-mono transition-colors"
              title="Toggle Diagnostic HUD"
            >
              <Activity className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Optional Diagnostic HUD Panel */}
      {showDiagnostics && (
        <div className="bg-black/90 border-b border-purple-800/40 px-4 py-2.5 text-[11px] font-mono text-slate-300 shadow-inner">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span>Connection: <strong className="text-emerald-400">{syncStatus}</strong></span>
              <span>Tour ID: <strong className="text-slate-100">{effectiveTournamentId}</strong></span>
              <span>Match ID: <strong className="text-slate-100">{activeMatchId}</strong></span>
              <span>Revision: <strong className="text-amber-400">#{revision}</strong></span>
              <span>Fire Team: <strong className="text-rose-400">{fireTeamId || 'None'}</strong></span>
              <span>Source: <strong className="text-cyan-400">AUTHORITATIVE SERVER</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span>Last Cmd: {lastSentCommand} ({lastCommandId.slice(0, 10)})</span>
              <a
                href={obsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
              >
                <span>OBS Browser URL</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sub-header Controls: Quick Actions & Scoring Rule Controls */}
      <div className="bg-[#120a22] border-b border-[#2d1554] px-4 py-2 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Point Rush Threshold Input */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Point Rush Threshold:</span>
            <input
              type="number"
              min={1}
              max={500}
              value={pointRushThresholdInput}
              onChange={(e) => setPointRushThresholdInput(Number(e.target.value))}
              className="w-16 bg-[#1f103a] border border-[#3e1b73] text-white text-xs font-mono font-bold rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSavePointRushThreshold}
              className="text-[11px] py-1 px-2.5 h-auto bg-purple-900/40 hover:bg-purple-800/60 text-purple-200"
            >
              Apply
            </Button>
          </div>

          {/* Quick Resets & Sorting Toggles */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSortAliveFirst((prev) => !prev)}
              className={`flex items-center gap-1.5 text-[11px] py-1 px-2.5 h-auto transition-colors ${
                sortAliveFirst
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-neutral-800 text-slate-400'
              }`}
              title="Toggle alive squads on top vs slot numerical order"
            >
              <Activity className="h-3 w-3" />
              <span>{sortAliveFirst ? 'Alive on Top' : 'By Slot'}</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleResetAlive}
              className="flex items-center gap-1 text-[11px] py-1 px-2.5 h-auto bg-neutral-800 hover:bg-neutral-700 text-slate-300"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All Alive</span>
            </Button>

            {availableMatches.length > 1 && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleNextMatch}
                disabled={isSwitchingMatch}
                className="flex items-center gap-1 text-[11px] py-1 px-3 h-auto bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                <span>Next Match →</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Team Grid (Alive Teams on Top, Wiped Teams on Bottom) */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        {sortAliveFirst && wipedTeams.length > 0 ? (
          <div className="space-y-8">
            {/* Section 1: ALIVE SQUADS */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                  <h2 className="text-xs font-black font-mono tracking-wider text-emerald-400 uppercase">
                    Alive Squads ({aliveTeams.length} Active)
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Easy Access Controls
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aliveTeams.map(renderTeamCard)}
              </div>
            </div>

            {/* Section 2: ELIMINATED / WIPED SQUADS (Moved Down) */}
            <div className="pt-4 border-t border-purple-900/40">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Skull className="h-3.5 w-3.5 text-neutral-500" />
                  <h2 className="text-xs font-black font-mono tracking-wider text-neutral-400 uppercase">
                    Wiped / Eliminated Squads ({wipedTeams.length} Down)
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  Moved down so active squads are at top
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wipedTeams.map(renderTeamCard)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTeams.map(renderTeamCard)}
          </div>
        )}
      </main>

      {/* Match Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="5xl"
      >
        {finalizedReport && (
          <MatchReportView
            report={finalizedReport}
            onClose={() => setIsReportModalOpen(false)}
            onPublish={handlePublishReport}
            isPublishing={isPublishingReport}
            isPublished={isReportPublished}
          />
        )}
      </Modal>

      {/* Confirm Next Match Modal */}
      <Modal
        isOpen={confirmNextModalOpen}
        onClose={() => setConfirmNextModalOpen(false)}
        maxWidth="md"
      >
        <div className="p-6 bg-[#160d29] text-white rounded-2xl border border-purple-800/40">
          <div className="flex items-center gap-3 text-amber-400 mb-4">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold font-display">Start Next Match?</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
            This will finalize the current round, revive all 12 squads to <strong className="text-emerald-400">ALIVE</strong>,
            reset match kills to <strong className="text-amber-300">0</strong>, and carry forward all cumulative points
            into the overall tournament standings.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmNextModalOpen(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmNextMatch}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Confirm & Start Next Match
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { Tournament, TeamMatchResult } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import {
  broadcastLiveSquadUpdate,
  broadcastTournamentUpdate,
  subscribeToLiveSquadUpdates,
  subscribeToTournamentLiveUpdates,
  type LivePlayerState
} from '../../services/broadcastSync';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import {
  Smartphone,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Flame,
  UserX,
  HeartHandshake,
  PlusCircle,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
  FileCheck2,
  Sun,
  Moon,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export interface BroadcastRemoteControlProps {
  tournamentId?: string;
}

// Official Free Fire Placement Point Matrix
const PLACEMENT_POINTS_MAP: Record<number, number> = {
  1: 12, // #1 Booyah 👑 -> 12 PTS
  2: 9,  // #2 -> 9 PTS
  3: 8,  // #3 -> 8 PTS
  4: 7,  // #4 -> 7 PTS
  5: 6,  // #5 -> 6 PTS
  6: 5,  // #6 -> 5 PTS
  7: 4,  // #7 -> 4 PTS
  8: 3,  // #8 -> 3 PTS
  9: 2,  // #9 -> 2 PTS
  10: 1, // #10 -> 1 PTS
  11: 0, // #11 -> 0 PTS
  12: 0  // #12 -> 0 PTS
};

export const BroadcastRemoteControl: React.FC<BroadcastRemoteControlProps> = () => {
  const { currentTournament, updateMatchResults, createMatch } = useTournamentStore();
  const { showToast } = useToast();

  const [tournament, setTournament] = useState<Tournament>(currentTournament);
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // 2-Step Confirmation States for "+1 Point to All Teams"
  const [isConfirmStep1Open, setIsConfirmStep1Open] = useState<boolean>(false);
  const [isConfirmStep2Open, setIsConfirmStep2Open] = useState<boolean>(false);

  // Editable Match Report State
  const [editedReportResults, setEditedReportResults] = useState<
    Record<string, { placement: number; kills: number; bonus: number; penalty: number }>
  >({});

  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Elimination sequence tracking (first eliminated -> #12, second -> #11 ... last alive -> #1)
  const [eliminationOrder, setEliminationOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_elim_order_${tournament.id}`) ||
          window.localStorage.getItem(`strikz_elim_order_${tournament.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // 12 squad player states (persists across refreshes)
  const [squadStates, setSquadStates] = useState<Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default') ||
          window.localStorage.getItem(`strikz_squads_${tournament.id}`) ||
          window.localStorage.getItem('strikz_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.squads) return parsed.squads;
        }
      } catch {}
    }

    const initial: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]> = {};
    tournament.teams.slice(0, 12).forEach((t) => {
      initial[t.id] = ['alive', 'alive', 'alive', 'alive'];
    });
    return initial;
  });

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default') ||
          window.localStorage.getItem(`strikz_squads_${tournament.id}`) ||
          window.localStorage.getItem('strikz_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.highlightedTeamId || null;
        }
      } catch {}
    }
    return null;
  });

  const activeMatch = tournament.matches[0] || { id: 'm1', matchNumber: 1, mapName: 'Bermuda', results: [] as any };
  const standings = calculateTournamentStandings(tournament);

  // Calculate highest kills across all teams (min 4 for pure fire burn streak activation)
  const maxKillsInTour = Math.max(...standings.map((s) => s.totalKills), 0);

  // Open & Initialize Editable Match Report
  const openMatchReportModal = () => {
    const initialData: Record<string, { placement: number; kills: number; bonus: number; penalty: number }> = {};
    tournament.teams.forEach((team, idx) => {
      const res = activeMatch?.results.find((r) => r.teamId === team.id);
      const elimIndex = eliminationOrder.indexOf(team.id);

      let placement = res?.placement || (12 - idx);
      if (eliminationOrder.includes(team.id)) {
        placement = Math.max(2, (tournament.teams.length || 12) - elimIndex);
      } else if (eliminationOrder.length >= (tournament.teams.length - 1)) {
        placement = 1;
      }

      initialData[team.id] = {
        placement,
        kills: res?.kills || 0,
        bonus: res?.bonusPoints || 0,
        penalty: res?.penaltyPoints || 0
      };
    });
    setEditedReportResults(initialData);
    setIsReportModalOpen(true);
  };

  // Sync to OBS whenever squad states, highlighted team, or visibility changes
  const syncToBroadcast = (
    newSquads: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>,
    newHighlighted: string | null = highlightedTeamId,
    visible: boolean = isOverlayVisible
  ) => {
    broadcastLiveSquadUpdate({
      tournamentId: tournament.id,
      squads: newSquads,
      highlightedTeamId: newHighlighted,
      isVisible: visible,
      timestamp: Date.now()
    });
  };

  const toggleOverlayVisibility = () => {
    const nextVisible = !isOverlayVisible;
    setIsOverlayVisible(nextVisible);
    syncToBroadcast(squadStates, highlightedTeamId, nextVisible);
    showToast({
      type: nextVisible ? 'success' : 'info',
      title: nextVisible ? 'Live Overlay Visible' : 'Live Overlay Hidden',
      message: nextVisible ? 'Overlay sliding IN from right on stream.' : 'Overlay sliding OUT to right on stream.'
    });
  };

  // Helper to re-calculate auto placement points and update active match
  const recalculateAutoPlacements = (
    currentSquads: Record<string, [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]>,
    currentElimOrder: string[]
  ) => {
    if (!activeMatch) return;

    const totalTeamsCount = tournament.teams.length || 12;
    const aliveSquads = tournament.teams.filter((t) => {
      const sq = currentSquads[t.id] || ['alive', 'alive', 'alive', 'alive'];
      return sq.some((p) => p === 'alive' || p === 'knock');
    });

    const isOnlyOneAlive = aliveSquads.length === 1 && totalTeamsCount > 1;
    const booyahTeamId = isOnlyOneAlive ? aliveSquads[0].id : null;

    const updatedResults = activeMatch.results.map((r) => {
      let placement = r.placement || 12;

      if (booyahTeamId && r.teamId === booyahTeamId) {
        placement = 1;
      } else if (currentElimOrder.includes(r.teamId)) {
        const elimIndex = currentElimOrder.indexOf(r.teamId);
        placement = Math.max(2, totalTeamsCount - elimIndex);
      }

      const isBooyah = placement === 1;
      const placementPoints = PLACEMENT_POINTS_MAP[placement] ?? 0;
      const killPoints = (r.kills || 0) * 1;
      const totalPoints = placementPoints + killPoints;

      return {
        ...r,
        placement,
        isBooyah,
        placementPoints,
        killPoints,
        totalPoints
      };
    });

    updateMatchResults(tournament.id, activeMatch.id, updatedResults as any);

    const updatedTour = {
      ...tournament,
      matches: tournament.matches.map((m) =>
        m.id === activeMatch.id ? { ...m, results: updatedResults as any } : m
      )
    };
    setTournament(updatedTour);
    broadcastTournamentUpdate(updatedTour);

    // Save elim order locally
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`pointx_elim_order_${tournament.id}`, JSON.stringify(currentElimOrder));
      } catch {}
    }

    // If match just concluded with 1 winner, open report prompt
    if (isOnlyOneAlive && !isReportModalOpen) {
      openMatchReportModal();
    }
  };

  const handleTogglePlayer = (teamId: string, playerIndex: number) => {
    setSquadStates((prev) => {
      const current = prev[teamId] || ['alive', 'alive', 'alive', 'alive'];
      const cycle: Record<LivePlayerState, LivePlayerState> = {
        alive: 'knock',
        knock: 'eliminated',
        eliminated: 'alive'
      };
      const updated = [...current] as [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState];
      updated[playerIndex] = cycle[updated[playerIndex]];
      const nextState = { ...prev, [teamId]: updated };

      const isDeadNow = updated.every((p) => p === 'eliminated');
      let nextElimOrder = [...eliminationOrder];

      if (isDeadNow && !nextElimOrder.includes(teamId)) {
        nextElimOrder.push(teamId);
        setEliminationOrder(nextElimOrder);
      } else if (!isDeadNow && nextElimOrder.includes(teamId)) {
        nextElimOrder = nextElimOrder.filter((id) => id !== teamId);
        setEliminationOrder(nextElimOrder);
      }

      syncToBroadcast(nextState);
      recalculateAutoPlacements(nextState, nextElimOrder);
      return nextState;
    });
  };

  const handleWipeSquad = (teamId: string) => {
    const nextState = {
      ...squadStates,
      [teamId]: ['eliminated', 'eliminated', 'eliminated', 'eliminated'] as [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]
    };

    let nextElimOrder = [...eliminationOrder];
    if (!nextElimOrder.includes(teamId)) {
      nextElimOrder.push(teamId);
      setEliminationOrder(nextElimOrder);
    }

    setSquadStates(nextState);

    const totalTeams = tournament.teams.length || 12;
    const assignedRank = Math.max(2, totalTeams - (nextElimOrder.length - 1));
    const pts = PLACEMENT_POINTS_MAP[assignedRank] ?? 0;

    syncToBroadcast(nextState);
    recalculateAutoPlacements(nextState, nextElimOrder);

    showToast({
      type: 'info',
      title: `Squad Eliminated (#${assignedRank})`,
      message: `Auto-assigned #${assignedRank} (+${pts} place pts). Squad moved to eliminated section.`
    });
  };

  const handleReviveSquad = (teamId: string) => {
    const nextState = {
      ...squadStates,
      [teamId]: ['alive', 'alive', 'alive', 'alive'] as [LivePlayerState, LivePlayerState, LivePlayerState, LivePlayerState]
    };

    const nextElimOrder = eliminationOrder.filter((id) => id !== teamId);
    setEliminationOrder(nextElimOrder);
    setSquadStates(nextState);

    syncToBroadcast(nextState);
    recalculateAutoPlacements(nextState, nextElimOrder);
  };

  const handleResetAllAlive = () => {
    const nextState = { ...squadStates };
    tournament.teams.forEach((t) => {
      nextState[t.id] = ['alive', 'alive', 'alive', 'alive'];
    });
    setSquadStates(nextState);
    setEliminationOrder([]);
    syncToBroadcast(nextState);
    recalculateAutoPlacements(nextState, []);

    showToast({
      type: 'success',
      title: 'Match Reset to 4-Alive',
      message: 'All 12 squads revived and placements reset to full active status.'
    });
  };

  const handleHighlightOnStream = (teamId: string) => {
    const nextHighlight = highlightedTeamId === teamId ? null : teamId;
    setHighlightedTeamId(nextHighlight);
    syncToBroadcast(squadStates, nextHighlight);
  };

  const handleAdjustKills = (teamId: string, delta: number) => {
    if (!activeMatch) return;

    const currentResult = activeMatch.results.find((r) => r.teamId === teamId);
    const newKills = Math.max(0, (currentResult?.kills || 0) + delta);

    const updatedResults = activeMatch.results.map((r) => {
      if (r.teamId === teamId) {
        const placePts = PLACEMENT_POINTS_MAP[r.placement || 12] ?? 0;
        return {
          ...r,
          kills: newKills,
          killPoints: newKills * 1,
          totalPoints: placePts + newKills
        };
      }
      return r;
    });

    updateMatchResults(tournament.id, activeMatch.id, updatedResults as any);
    
    const updatedTour = {
      ...tournament,
      matches: tournament.matches.map((m) =>
        m.id === activeMatch.id ? { ...m, results: updatedResults as any } : m
      )
    };
    setTournament(updatedTour);
    broadcastTournamentUpdate(updatedTour);
  };

  // 2-Step Confirmation Point Boost Action
  const executeAddPointToAllTeams = () => {
    if (!activeMatch) return;

    const updatedResults = activeMatch.results.map((r) => {
      const newKills = (r.kills || 0) + 1;
      const placePts = PLACEMENT_POINTS_MAP[r.placement || 12] ?? 0;
      return {
        ...r,
        kills: newKills,
        killPoints: newKills * 1,
        totalPoints: placePts + newKills
      };
    });

    updateMatchResults(tournament.id, activeMatch.id, updatedResults as any);

    const updatedTour = {
      ...tournament,
      matches: tournament.matches.map((m) =>
        m.id === activeMatch.id ? { ...m, results: updatedResults as any } : m
      )
    };
    setTournament(updatedTour);
    broadcastTournamentUpdate(updatedTour);

    setIsConfirmStep2Open(false);

    showToast({
      type: 'success',
      title: '🔥 +1 Point Added to All 12 Teams',
      message: 'Incremented points for all squads and updated broadcast stream.'
    });
  };

  // Modify Edited Match Report Rows
  const updateReportItem = (
    teamId: string,
    updates: Partial<{ placement: number; kills: number; bonus: number; penalty: number }>
  ) => {
    setEditedReportResults((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        ...updates
      }
    }));
  };

  // Feature: Verify and Save Customized Final Match Report to Tournament
  const handleFinalizeAndSaveReport = () => {
    const nextMatchNum = tournament.matches.length + 1;
    const completedMatchResults: TeamMatchResult[] = tournament.teams.map((team) => {
      const item = editedReportResults[team.id] || { placement: 12, kills: 0, bonus: 0, penalty: 0 };
      const placement = Number(item.placement) || 12;
      const kills = Number(item.kills) || 0;
      const bonusPoints = Number(item.bonus) || 0;
      const penaltyPoints = Number(item.penalty) || 0;
      const placementPoints = PLACEMENT_POINTS_MAP[placement] ?? 0;
      const killPoints = kills * 1;
      const totalPoints = placementPoints + killPoints + bonusPoints - penaltyPoints;

      return {
        teamId: team.id,
        placement,
        kills,
        isBooyah: placement === 1,
        bonusPoints,
        penaltyPoints,
        placementPoints,
        killPoints,
        totalPoints
      };
    });

    // Create completed new match record
    createMatch(tournament.id, activeMatch.mapName || 'Bermuda', `Match ${nextMatchNum}`);
    const newestTour = useTournamentStore.getState().currentTournament;
    const latestCreatedMatch = newestTour.matches[newestTour.matches.length - 1];

    if (latestCreatedMatch) {
      updateMatchResults(
        tournament.id,
        latestCreatedMatch.id,
        completedMatchResults as any,
        'Completed',
        `Match ${nextMatchNum}`
      );
    }

    setIsReportModalOpen(false);
    handleResetAllAlive();

    showToast({
      type: 'success',
      title: `Match #${nextMatchNum} Saved to Standings!`,
      message: 'Added verified & customized match results into tournament point table.'
    });
  };

  // Subscribe to live broadcast & squad updates across devices
  useEffect(() => {
    const unsubSquads = subscribeToLiveSquadUpdates(tournament.id, (data) => {
      if (data.squads) setSquadStates(data.squads);
      if (data.highlightedTeamId !== undefined) setHighlightedTeamId(data.highlightedTeamId);
      if (data.isVisible !== undefined) setIsOverlayVisible(data.isVisible);
    });

    const unsubTour = subscribeToTournamentLiveUpdates(tournament.id, (updatedTour) => {
      setTournament(updatedTour);
    });

    return () => {
      unsubSquads();
      unsubTour();
    };
  }, [tournament.id]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const liveObsUrl = `${origin}/?mode=broadcast&tournamentId=${tournament.id}&layout=live-squads`;

  // ALIVE TEAMS AT TOP, ELIMINATED TEAMS SINK TO BOTTOM:
  const sortedTeamsBySlot = [...tournament.teams].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));

  const activeAliveTeams = sortedTeamsBySlot.filter((team) => {
    const sq = squadStates[team.id] || ['alive', 'alive', 'alive', 'alive'];
    return sq.some((p) => p === 'alive' || p === 'knock');
  });

  const eliminatedTeams = sortedTeamsBySlot.filter((team) => {
    const sq = squadStates[team.id] || ['alive', 'alive', 'alive', 'alive'];
    return sq.every((p) => p === 'eliminated');
  }).sort((a, b) => {
    const idxA = eliminationOrder.indexOf(a.id);
    const idxB = eliminationOrder.indexOf(b.id);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  // Calculate Booyah team from editable report
  const reportBooyahTeam = tournament.teams.find((t) => editedReportResults[t.id]?.placement === 1) || tournament.teams[0];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-3 sm:p-6 font-sans select-none transition-colors">
      {/* Top Remote Control Header */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-raised)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2ea66e] animate-ping" />
                <span className="text-[11px] font-mono font-bold text-[#2ea66e] uppercase tracking-wider">
                  LIVE FREE FIRE AUTO-SCORING DECK
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display">
                {tournament.title}
              </h1>
            </div>
          </div>

          {/* Master Control Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
              title="Toggle Theme"
            >
              {isDarkTheme ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {/* Show / Hide Live Overlay on Stream */}
            <Button
              variant={isOverlayVisible ? 'outline' : 'primary'}
              size="sm"
              onClick={toggleOverlayVisibility}
              leftIcon={isOverlayVisible ? <EyeOff className="h-4 w-4 text-amber-500" /> : <Eye className="h-4 w-4 text-[#2ea66e]" />}
              className="font-bold shadow-sm"
            >
              {isOverlayVisible ? 'Hide Table (OBS)' : 'Show Table (OBS)'}
            </Button>

            {/* End Match & Report Modal */}
            <Button
              variant="outline"
              size="sm"
              onClick={openMatchReportModal}
              leftIcon={<FileCheck2 className="h-4 w-4 text-amber-500" />}
              className="font-bold border-amber-500/40 text-[var(--text-primary)] hover:bg-amber-500/10 shadow-sm"
            >
              Match Report
            </Button>

            {/* Feature: Add 1 Point to All Teams with 2-Step Confirmation */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmStep1Open(true)}
              leftIcon={<PlusCircle className="h-4 w-4 text-amber-900" />}
              className="bg-gradient-to-r from-amber-500 to-[#e0684b] hover:from-amber-400 hover:to-[#eb7c61] text-black font-bold shadow-md"
            >
              +1 Pt All Teams
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllAlive}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Reset 4-Alive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(liveObsUrl, '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
            >
              OBS View
            </Button>
          </div>
        </div>

        {/* ================= 1. ACTIVE SQUADS IN BATTLE (TOP) ================= */}
        {activeAliveTeams.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <span>⚡ ACTIVE IN BATTLE ({activeAliveTeams.length} SQUADS ALIVE)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeAliveTeams.map((team) => renderTeamCard(team))}
            </div>
          </div>
        )}

        {/* ================= 2. ELIMINATED SQUADS (SINK TO BOTTOM) ================= */}
        {eliminatedTeams.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <span>💀 ELIMINATED SQUADS ({eliminatedTeams.length} WIPED)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {eliminatedTeams.map((team) => renderTeamCard(team))}
            </div>
          </div>
        )}
      </div>

      {/* ================= 2-STEP CONFIRMATION MODAL 1 ================= */}
      <Modal
        isOpen={isConfirmStep1Open}
        onClose={() => setIsConfirmStep1Open(false)}
        title="⚠️ Confirm Point Boost (Step 1 of 2)"
        description="Are you sure you want to add 1 point to all 12 teams at the same time?"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2 font-sans">
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-primary)]">
              This action will increase the total score of every squad in the tournament by <strong>+1 Pt</strong>.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmStep1Open(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsConfirmStep1Open(false);
                setIsConfirmStep2Open(true);
              }}
              className="font-bold"
            >
              Continue to Step 2 →
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= 2-STEP CONFIRMATION MODAL 2 ================= */}
      <Modal
        isOpen={isConfirmStep2Open}
        onClose={() => setIsConfirmStep2Open(false)}
        title="🚨 Final Confirmation (Step 2 of 2)"
        description="Please confirm once more before applying to the live stream."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2 font-sans">
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-primary)] font-medium">
              <strong>Warning:</strong> Live OBS tables and broadcast graphics will immediately reflect the new scores across all devices.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmStep2Open(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={executeAddPointToAllTeams}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Yes, Add +1 Pt to All Teams
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= EDITABLE FINAL MATCH REPORT MODAL ================= */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="🏆 Match Completed — Final Match Results Report"
        description="Review, modify placements & frags, and verify before saving to tournament standings."
        maxWidth="2xl"
      >
        <div className="space-y-4 font-sans max-h-[75vh] overflow-y-auto">
          {/* Booyah Champion Header Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-sm">
                <Crown className="h-6 w-6 fill-black text-black" />
              </div>
              <div>
                <div className="text-xs font-mono text-amber-700 dark:text-yellow-400 font-bold uppercase tracking-wider">
                  MATCH BOOYAH CHAMPION (#1)
                </div>
                <div className="text-lg font-black text-[var(--text-primary)] font-display">
                  {reportBooyahTeam?.name || 'Selected Winner'}
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-yellow-300 font-mono text-xs font-bold border border-amber-500/40">
              12 Place Pts 👑
            </span>
          </div>

          {/* Editable Results Verification Table */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-20">RANK #</th>
                  <th className="py-2.5 px-3 font-sans">TEAM</th>
                  <th className="py-2.5 px-3 text-center w-28">KILLS</th>
                  <th className="py-2.5 px-3 text-center w-20">PLACE PTS</th>
                  <th className="py-2.5 px-3 text-center w-24">BONUS / PEN</th>
                  <th className="py-2.5 px-3 text-center font-black text-amber-600 dark:text-amber-400 w-24">TOTAL PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {tournament.teams.map((team) => {
                  const item = editedReportResults[team.id] || { placement: 12, kills: 0, bonus: 0, penalty: 0 };
                  const placePts = PLACEMENT_POINTS_MAP[item.placement] ?? 0;
                  const total = placePts + (item.kills * 1) + (item.bonus || 0) - (item.penalty || 0);

                  return (
                    <tr key={team.id} className={item.placement === 1 ? 'bg-amber-500/10 font-bold' : ''}>
                      {/* Placement Selector Dropdown */}
                      <td className="py-2 px-2 text-center">
                        <select
                          value={item.placement}
                          onChange={(e) => updateReportItem(team.id, { placement: Number(e.target.value) })}
                          className="h-8 px-2 rounded-lg bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold font-mono text-xs cursor-pointer focus:ring-1 focus:ring-amber-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((rank) => (
                            <option key={rank} value={rank}>
                              {rank === 1 ? '👑 #1' : `#${rank}`}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Team Name */}
                      <td className="py-2 px-3 font-sans font-bold text-[var(--text-primary)]">
                        {team.name} <span className="text-[var(--text-secondary)] font-mono text-[10px]">[{team.tag}]</span>
                      </td>

                      {/* Kills Modifier */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateReportItem(team.id, { kills: Math.max(0, item.kills - 1) })}
                            className="h-6 w-6 rounded bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] font-bold flex items-center justify-center cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.kills}
                            onChange={(e) => updateReportItem(team.id, { kills: Math.max(0, Number(e.target.value)) })}
                            className="h-6 w-10 text-center font-bold font-mono rounded bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => updateReportItem(team.id, { kills: item.kills + 1 })}
                            className="h-6 w-6 rounded bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold flex items-center justify-center cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Auto Placement Points */}
                      <td className="py-2 px-3 text-center text-[var(--text-secondary)] font-bold">
                        {placePts} PTS
                      </td>

                      {/* Bonus / Penalty Adjuster */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <input
                            type="number"
                            placeholder="+0"
                            value={item.bonus || ''}
                            onChange={(e) => updateReportItem(team.id, { bonus: Number(e.target.value) })}
                            className="h-6 w-9 text-center font-mono rounded bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-emerald-600 dark:text-emerald-400"
                            title="Bonus Points"
                          />
                          <input
                            type="number"
                            placeholder="-0"
                            value={item.penalty || ''}
                            onChange={(e) => updateReportItem(team.id, { penalty: Number(e.target.value) })}
                            className="h-6 w-9 text-center font-mono rounded bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-rose-600 dark:text-rose-400"
                            title="Penalty Points"
                          />
                        </div>
                      </td>

                      {/* Dynamic Total Points */}
                      <td className="py-2 px-3 text-center font-black text-amber-600 dark:text-amber-300 text-sm">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-secondary)]">
              💡 You can freely change any rank, kill count, or bonus/penalty before saving.
            </span>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
                Cancel
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleFinalizeAndSaveReport}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                className="font-bold"
              >
                Save as Match #{tournament.matches.length + 1} Result
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );

  // Helper render function for team cards
  function renderTeamCard(team: any) {
    const squad = squadStates[team.id] || ['alive', 'alive', 'alive', 'alive'];
    const isHighlighted = highlightedTeamId === team.id;
    const matchResult = activeMatch?.results.find((r) => r.teamId === team.id);
    const kills = matchResult?.kills || 0;

    const aliveCount = squad.filter((p) => p === 'alive').length;
    const knockCount = squad.filter((p) => p === 'knock').length;
    const isAllDead = aliveCount === 0 && knockCount === 0;

    const totalTeams = tournament.teams.length || 12;
    const isEliminated = eliminationOrder.includes(team.id) || isAllDead;
    const elimIndex = eliminationOrder.indexOf(team.id);
    
    const aliveSquadsCount = tournament.teams.filter((t) => {
      const sq = squadStates[t.id] || ['alive', 'alive', 'alive', 'alive'];
      return sq.some((p) => p === 'alive' || p === 'knock');
    }).length;

    const isBooyahWinner = !isAllDead && aliveSquadsCount === 1;

    let livePlacement = matchResult?.placement || 12;
    if (isBooyahWinner) {
      livePlacement = 1;
    } else if (isEliminated) {
      livePlacement = Math.max(2, totalTeams - (elimIndex >= 0 ? elimIndex : 0));
    }

    const placePts = PLACEMENT_POINTS_MAP[livePlacement] ?? 0;
    const liveTotalMatchPts = placePts + (kills * 1);

    // Pure Fire Burning Logic
    const isFireLeader = kills >= 4 && kills === maxKillsInTour && maxKillsInTour >= 4;
    const isFireHotAlive = isFireLeader && !isAllDead;
    const isFireHotEliminated = isFireLeader && isAllDead;

    return (
      <div
        key={team.id}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative overflow-hidden ${
          isBooyahWinner
            ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500'
            : isFireHotAlive
            ? 'border-2 border-orange-500 bg-gradient-to-br from-red-600/20 via-orange-500/15 to-amber-500/10 animate-fire-burn shadow-lg'
            : isFireHotEliminated
            ? 'border border-[#78350f]/50 bg-[#451a03]/15'
            : isHighlighted
            ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-md'
            : isAllDead
            ? 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)]'
            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-[var(--shadow-flat)]'
        }`}
      >
        {/* Booyah Champion Top Banner */}
        {isBooyahWinner && (
          <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-[10px] font-black font-mono uppercase tracking-widest px-3 py-0.5 flex items-center justify-between shadow-sm animate-pulse">
            <span className="flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 fill-black text-black" />
              BOOYAH CHAMPION #1
            </span>
            <span>+12 PLACE PTS 👑</span>
          </div>
        )}

        {/* Pure Fire Burning Animation Top Banner (Alive = Blazing Glow, Eliminated = Faded Ash) */}
        {!isBooyahWinner && isFireHotAlive && (
          <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-black text-[10px] font-black font-mono uppercase tracking-widest px-3 py-0.5 flex items-center justify-between shadow-md animate-flame-wave">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-red-800 text-red-900" />
              🔥 INFERNO STREAK • KILL LEADER 🔥
            </span>
            <span className="text-black font-black">{kills} FRAGS</span>
          </div>
        )}

        {!isBooyahWinner && isFireHotEliminated && (
          <div className="absolute top-0 right-0 left-0 bg-[#3b1708] text-amber-400 text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-0.5 flex items-center justify-between border-b border-amber-800/40">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-500" />
              EXTINGUISHED • TOP KILL LEADER
            </span>
            <span>{kills} FRAGS</span>
          </div>
        )}

        {/* Squad Header */}
        <div className={`flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] ${isBooyahWinner || isFireHotAlive || isFireHotEliminated ? 'pt-3.5' : ''}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Fixed Slot Badge */}
            <div className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center font-numbers ${
              isBooyahWinner
                ? 'bg-amber-500 text-black shadow-md font-black'
                : isFireHotAlive
                ? 'bg-orange-500 text-black shadow-md font-black'
                : 'bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--accent-primary)] font-bold'
            }`}>
              #{team.slotNumber || 1}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-[var(--text-primary)] truncate font-display flex items-center gap-1.5">
                <span>{team.name}</span>
                {isBooyahWinner && <Crown className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                {!isBooyahWinner && isFireHotAlive && (
                  <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse shrink-0" />
                )}
                {!isBooyahWinner && isFireHotEliminated && (
                  <Flame className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                )}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                [{team.tag}] • Slot #{team.slotNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleHighlightOnStream(team.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                isHighlighted || isBooyahWinner || isFireHotAlive
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-black'
                  : 'bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              {isHighlighted ? 'Focused' : 'Focus'}
            </button>

            {/* Auto Calculated Live Match Total Points */}
            <div className="text-right font-mono">
              <div className={`text-xs font-bold ${isBooyahWinner ? 'text-amber-500 font-black' : isFireHotAlive ? 'text-orange-500 font-black' : 'text-[var(--accent-primary)]'}`}>
                {liveTotalMatchPts} PTS
              </div>
              <div className="text-[9px] text-[var(--text-secondary)]">
                ({placePts} Pl + {kills} K)
              </div>
            </div>
          </div>
        </div>

        {/* 4-Player Status Pill Toggles */}
        <div className="py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] font-bold">
            <span>PLAYER STATUS (TAP TO TOGGLE)</span>
            <span className={aliveCount > 0 ? 'text-amber-600 font-bold' : 'text-[var(--text-muted)]'}>
              {aliveCount} ALIVE {knockCount > 0 ? `• ${knockCount} KNOCKED` : ''}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {squad.map((status, pIdx) => {
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleTogglePlayer(team.id, pIdx)}
                  className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm ${
                    status === 'alive'
                      ? isBooyahWinner
                        ? 'bg-amber-400 text-black border border-amber-300 font-black'
                        : 'bg-amber-500 text-black border border-amber-400'
                      : status === 'knock'
                      ? 'bg-rose-600 text-white border border-rose-500 animate-pulse'
                      : 'bg-[var(--bg-surface-inset)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[10px] opacity-75">P{pIdx + 1}</span>
                  <span className="text-[11px] font-black uppercase">
                    {status === 'alive' ? 'ALIVE' : status === 'knock' ? 'KNOCK' : 'DEAD'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fast Squad Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => handleWipeSquad(team.id)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <UserX className="h-3 w-3" />
              Wipe Squad
            </button>

            {/* Auto Placement Indicator Badge */}
            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              {isBooyahWinner ? (
                <span className="text-amber-600 dark:text-yellow-400 font-bold">👑 #1 Booyah (12 PTS)</span>
              ) : isEliminated ? (
                <span className="text-rose-600 dark:text-rose-400">#{livePlacement} (+{placePts} PTS)</span>
              ) : (
                <span className="text-[#059669] font-bold">In Battle</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleReviveSquad(team.id)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <HeartHandshake className="h-3 w-3" />
              Revive 4
            </button>
          </div>
        </div>

        {/* Real-time Frags (Kills) Modifier */}
        <div className="pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isFireHotAlive
              ? 'bg-orange-500/15 border-orange-500/50'
              : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)]'
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              <Flame className={`h-4 w-4 ${isFireHotAlive ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-rose-500'}`} />
              <span className={isFireHotAlive ? 'text-orange-700 dark:text-orange-300 font-black' : 'text-[var(--text-primary)]'}>
                {kills} Eliminations (Frags)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustKills(team.id, -1)}
                className="h-8 w-8 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold flex items-center justify-center cursor-pointer text-base active:scale-95 shadow-sm"
              >
                -
              </button>
              <button
                onClick={() => handleAdjustKills(team.id, 1)}
                className={`h-8 px-3.5 rounded-lg font-bold flex items-center justify-center cursor-pointer text-xs active:scale-95 shadow-sm ${
                  isFireHotAlive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black'
                    : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)]'
                }`}
              >
                +1 Kill
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

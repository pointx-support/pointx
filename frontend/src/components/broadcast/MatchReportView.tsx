import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Download,
  Printer,
  FileText,
  Flame,
  CheckCircle2,
  Crosshair,
  UploadCloud,
  Loader2,
  X,
  Plus,
  Minus,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface MatchReportData {
  reportId: string;
  tournamentId: string;
  matchId: string;
  matchNumber: number;
  matchTitle: string;
  mapName: string;
  game: string;
  finalizedAt: string | Date;
  finalizedBy: string;
  version: number;
  standings: Array<{
    rank: number;
    teamId: string;
    teamName: string;
    teamTag: string;
    slotNumber: number;
    logoUrl?: string;
    placement: number;
    kills: number;
    placementPoints: number;
    killPoints: number;
    bonusPoints: number;
    penaltyPoints: number;
    totalPoints: number;
    isBooyah: boolean;
  }>;
  summary: {
    totalEliminations: number;
    totalPoints: number;
    winningTeam: {
      teamId: string;
      name: string;
      kills: number;
      totalPoints: number;
    };
    killLeader: {
      teamId: string;
      teamName: string;
      kills: number;
    };
    totalTeams: number;
  };
}

export interface MatchReportViewProps {
  report: MatchReportData;
  onClose?: () => void;
  onPublish?: (editedResults?: any[]) => Promise<void> | void;
  isPublishing?: boolean;
  isPublished?: boolean;
}

export const MatchReportView: React.FC<MatchReportViewProps> = ({
  report,
  onClose,
  onPublish,
  isPublishing = false,
  isPublished = false,
}) => {
  const [standings, setStandings] = useState(report.standings);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, []);

  useEffect(() => {
    setStandings(report.standings);
  }, [report.standings]);

  const handleUpdateKills = (teamId: string, newKills: number) => {
    const safeKills = Math.max(0, isNaN(newKills) ? 0 : newKills);
    setStandings((prev) =>
      prev.map((t) => {
        if (t.teamId !== teamId) return t;
        const total = (t.placementPoints || 0) + safeKills + (t.bonusPoints || 0) - (t.penaltyPoints || 0);
        return { ...t, kills: safeKills, killPoints: safeKills, totalPoints: total };
      })
    );
  };

  const handleStepKills = (teamId: string, delta: number) => {
    setStandings((prev) =>
      prev.map((t) => {
        if (t.teamId !== teamId) return t;
        const currentKills = t.kills || 0;
        const safeKills = Math.max(0, currentKills + delta);
        const total = (t.placementPoints || 0) + safeKills + (t.bonusPoints || 0) - (t.penaltyPoints || 0);
        return { ...t, kills: safeKills, killPoints: safeKills, totalPoints: total };
      })
    );
  };

  const handleUpdatePlacementPoints = (teamId: string, newPts: number) => {
    const safePts = Math.max(0, isNaN(newPts) ? 0 : newPts);
    setStandings((prev) =>
      prev.map((t) => {
        if (t.teamId !== teamId) return t;
        const total = safePts + (t.kills || 0) + (t.bonusPoints || 0) - (t.penaltyPoints || 0);
        return { ...t, placementPoints: safePts, totalPoints: total };
      })
    );
  };

  const handleStepPlacementPoints = (teamId: string, delta: number) => {
    setStandings((prev) =>
      prev.map((t) => {
        if (t.teamId !== teamId) return t;
        const currentPts = t.placementPoints || 0;
        const safePts = Math.max(0, currentPts + delta);
        const total = safePts + (t.kills || 0) + (t.bonusPoints || 0) - (t.penaltyPoints || 0);
        return { ...t, placementPoints: safePts, totalPoints: total };
      })
    );
  };

  const handleToggleBooyah = (teamId: string) => {
    setStandings((prev) =>
      prev.map((t) => {
        const isCurrent = t.teamId === teamId;
        const willBeBooyah = isCurrent ? !t.isBooyah : false;
        return {
          ...t,
          isBooyah: willBeBooyah,
          placement: willBeBooyah ? 1 : (t.placement === 1 ? 2 : t.placement),
          placementPoints: willBeBooyah ? 12 : t.placementPoints,
          totalPoints: (willBeBooyah ? 12 : t.placementPoints) + (t.kills || 0),
        };
      })
    );
  };

  const dynamicSummary = useMemo(() => {
    const totalEliminations = standings.reduce((acc, t) => acc + (t.kills || 0), 0);
    const totalPoints = standings.reduce((acc, t) => acc + (t.totalPoints || 0), 0);
    const winningTeam = standings.find((t) => t.isBooyah || t.placement === 1) || standings[0] || report.summary.winningTeam;
    const sortedByKills = [...standings].sort((a, b) => (b.kills || 0) - (a.kills || 0));
    const killLeader = sortedByKills[0] || report.summary.killLeader;
    return {
      totalEliminations,
      totalPoints,
      winningTeam: {
        teamId: winningTeam.teamId,
        name: winningTeam.teamName || (winningTeam as any).name || 'Unknown',
        kills: winningTeam.kills || 0,
        totalPoints: winningTeam.totalPoints || 0,
      },
      killLeader: {
        teamId: killLeader.teamId,
        teamName: killLeader.teamName || 'Unknown',
        kills: killLeader.kills || 0,
      },
      totalTeams: standings.length,
    };
  }, [standings, report.summary]);

  const handlePublishClick = () => {
    if (onPublish) {
      onPublish(standings);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadCsv = () => {
    const exportUrl = `/api/reports/${encodeURIComponent(report.tournamentId)}/${encodeURIComponent(
      report.matchId
    )}/export?format=csv&version=${report.version}`;
    window.open(exportUrl, '_blank');
  };

  const handleDownloadJson = () => {
    const exportUrl = `/api/reports/${encodeURIComponent(report.tournamentId)}/${encodeURIComponent(
      report.matchId
    )}/export?format=json&version=${report.version}`;
    window.open(exportUrl, '_blank');
  };

  const formattedDate = new Date(report.finalizedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="w-full bg-[#130f26] text-slate-100 rounded-2xl border border-purple-800/40 shadow-2xl flex flex-col font-sans print:bg-white print:text-black print:border-none print:shadow-none">
      {/* Header Bar */}
      <div className="bg-[#1e1538] px-4 sm:px-6 py-3.5 border-b border-purple-800/50 flex flex-wrap items-center justify-between gap-3 shrink-0 print:bg-transparent print:border-b-2 print:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black tracking-wide text-white print:text-black">
                {report.matchTitle || `Match ${report.matchNumber}`}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                FINALIZED
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 print:text-neutral-600">
              Map: <span className="text-slate-200 font-semibold print:text-black">{report.mapName}</span> •{' '}
              <span className="hidden sm:inline">Finalized: {formattedDate}</span>
            </p>
          </div>
        </div>

        {/* View Mode & Utility Actions */}
        <div className="flex items-center gap-2 print:hidden ml-auto">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center bg-[#29174d] border border-purple-700/50 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-xs">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Spreadsheet table view"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="text-xs">Table</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1 text-xs bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 py-1 px-2.5 h-auto"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadJson}
              className="flex items-center gap-1 text-xs bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 py-1 px-2.5 h-auto"
            >
              <FileText className="h-3 w-3" />
              <span>JSON</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-1 px-2.5 h-auto"
            >
              <Printer className="h-3 w-3" />
              <span>Print</span>
            </Button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Winner Card */}
          <div className="bg-[#1b1233]/90 border border-amber-500/40 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold font-mono">
              <span>BOOYAH #1</span>
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5">
              <p className="text-sm sm:text-base font-black text-white truncate print:text-black">
                {dynamicSummary.winningTeam.name}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 print:text-neutral-600">
                {dynamicSummary.winningTeam.totalPoints} PTS ({dynamicSummary.winningTeam.kills} elims)
              </p>
            </div>
          </div>

          {/* Kill Leader Card */}
          <div className="bg-[#1b1233]/90 border border-rose-500/40 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-rose-400 text-xs font-bold font-mono">
              <span>KILL LEADER</span>
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5">
              <p className="text-sm sm:text-base font-black text-white truncate print:text-black">
                {dynamicSummary.killLeader.teamName}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 print:text-neutral-600">
                {dynamicSummary.killLeader.kills} Elims
              </p>
            </div>
          </div>

          {/* Total Elims Card */}
          <div className="bg-[#1b1233]/90 border border-purple-700/40 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold font-mono">
              <span>TOTAL ELIMS</span>
              <Crosshair className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5">
              <p className="text-lg sm:text-xl font-black text-white print:text-black">
                {dynamicSummary.totalEliminations}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 print:text-neutral-600">Across all squads</p>
            </div>
          </div>

          {/* Total Points Card */}
          <div className="bg-[#1b1233]/90 border border-purple-700/40 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold font-mono">
              <span>TOTAL POINTS</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1.5">
              <p className="text-lg sm:text-xl font-black text-white print:text-black">
                {dynamicSummary.totalPoints}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 print:text-neutral-600">
                {dynamicSummary.totalTeams} Teams
              </p>
            </div>
          </div>
        </div>

        {/* 1. MOBILE-OPTIMIZED TOUCH CARDS VIEW */}
        {viewMode === 'cards' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Touch to Adjust Kills & Place Points:
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-purple-300 font-bold">
                {standings.length} Teams
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {standings.map((team, index) => (
                <div
                  key={team.teamId}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition-all shadow-md ${
                    team.isBooyah
                      ? 'bg-gradient-to-b from-[#2e1d05] to-[#1a1103] border-amber-500/80 shadow-amber-950/40'
                      : index < 3
                      ? 'bg-[#1b1133] border-purple-600/50'
                      : 'bg-[#160e2b] border-purple-900/40'
                  }`}
                >
                  {/* Card Header: Slot, Name, Booyah Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-6 w-6 rounded bg-[#2c1550] border border-[#482382] text-slate-200 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {team.slotNumber || index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-white tracking-wide truncate">
                          {team.teamName}
                        </div>
                        {team.teamTag && (
                          <div className="text-[10px] font-mono text-purple-300 uppercase">
                            {team.teamTag}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBooyah(team.teamId)}
                        disabled={isPublished || isPublishing}
                        className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider transition-all cursor-pointer active:scale-95 border ${
                          team.isBooyah
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-md shadow-amber-950/50'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-purple-300 border-purple-800/60'
                        }`}
                      >
                        {team.isBooyah ? '👑 BOOYAH #1' : 'Set Booyah'}
                      </button>
                    </div>
                  </div>

                  {/* Stepper Controls Grid */}
                  <div className="mt-3 grid grid-cols-3 gap-2 items-center bg-black/30 rounded-lg p-2 border border-purple-950/60">
                    {/* Kills (Elims) Stepper */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono text-rose-400 uppercase tracking-wider mb-1 font-bold">
                        Kills (Elims)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStepKills(team.teamId, -1)}
                          disabled={isPublished || isPublishing}
                          className="h-7 w-7 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={team.kills}
                          onChange={(e) => handleUpdateKills(team.teamId, Number(e.target.value))}
                          disabled={isPublished || isPublishing}
                          className="w-9 bg-[#231544] border border-purple-700/50 text-center text-rose-300 font-mono font-black rounded py-0.5 text-xs focus:outline-none focus:border-rose-400 disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepKills(team.teamId, 1)}
                          disabled={isPublished || isPublishing}
                          className="h-7 w-7 rounded bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Placement Points Stepper */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider mb-1 font-bold">
                        Place Pts
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStepPlacementPoints(team.teamId, -1)}
                          disabled={isPublished || isPublishing}
                          className="h-7 w-7 rounded bg-neutral-800 hover:bg-neutral-700 text-slate-200 flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={team.placementPoints}
                          onChange={(e) => handleUpdatePlacementPoints(team.teamId, Number(e.target.value))}
                          disabled={isPublished || isPublishing}
                          className="w-9 bg-[#231544] border border-purple-700/50 text-center text-cyan-300 font-mono font-black rounded py-0.5 text-xs focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepPlacementPoints(team.teamId, 1)}
                          disabled={isPublished || isPublishing}
                          className="h-7 w-7 rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Total Points Display */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-1 font-bold">
                        Total Pts
                      </span>
                      <div className="h-7 px-2.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 font-mono font-black text-sm flex items-center justify-center">
                        {team.totalPoints}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. DESKTOP-OPTIMIZED SPREADSHEET TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="rounded-xl border border-purple-800/40 overflow-hidden bg-[#160e2b] shadow-lg print:border-neutral-300 print:bg-white">
            <div className="px-4 py-3 bg-[#1e143b] border-b border-purple-800/40 flex items-center justify-between print:bg-neutral-100 print:border-neutral-300">
              <div>
                <h3 className="text-xs font-black tracking-wider text-slate-200 uppercase print:text-black">
                  Official Match Standings (Audit & Edit)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 print:hidden">
                  Double check team kills and placement points inline before pushing to the website.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 print:text-neutral-600">
                Live Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-purple-800/30 text-slate-400 font-mono uppercase text-[10px] tracking-wider bg-black/20 print:bg-neutral-50 print:text-neutral-700 print:border-neutral-300">
                    <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                    <th className="py-2.5 px-3 w-14 text-center">Slot</th>
                    <th className="py-2.5 px-4 font-bold text-slate-200 print:text-black">Team Name</th>
                    <th className="py-2.5 px-3 text-center">Booyah</th>
                    <th className="py-2.5 px-3 text-center text-rose-400 font-bold print:text-black">Kills (Elims)</th>
                    <th className="py-2.5 px-3 text-center text-cyan-400 font-bold print:text-black">Place Pts</th>
                    <th className="py-2.5 px-3 text-center">Kill Pts</th>
                    <th className="py-2.5 px-3 text-right pr-4 font-black text-amber-400 print:text-black">Total Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 font-medium print:divide-neutral-200">
                  {standings.map((team, index) => {
                    const isTop3 = index < 3;
                    return (
                      <tr
                        key={team.teamId}
                        className={`hover:bg-purple-900/10 transition-colors ${
                          team.isBooyah
                            ? 'bg-amber-500/10 print:bg-neutral-50 font-semibold'
                            : isTop3
                            ? 'bg-white/[0.02]'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold">
                          {team.isBooyah ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-black text-[11px] font-black shadow">
                              1
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] font-mono ${
                                index === 1
                                  ? 'text-slate-300 font-bold'
                                  : index === 2
                                  ? 'text-amber-600 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              #{index + 1}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {team.slotNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white tracking-wide print:text-black">
                              {team.teamName}
                            </span>
                            {team.teamTag && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 print:bg-neutral-100 print:text-neutral-700">
                                {team.teamTag}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleBooyah(team.teamId)}
                            disabled={isPublished || isPublishing}
                            className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer ${
                              team.isBooyah
                                ? 'bg-amber-500 text-black shadow-sm ring-1 ring-amber-300'
                                : 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/60 border border-purple-800/50'
                            }`}
                          >
                            {team.isBooyah ? '👑 BOOYAH' : 'SET'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={team.kills}
                            onChange={(e) => handleUpdateKills(team.teamId, Number(e.target.value))}
                            disabled={isPublished || isPublishing}
                            className="w-14 bg-[#231544] border border-purple-700/50 text-center text-rose-300 font-mono font-bold rounded py-0.5 text-xs focus:outline-none focus:border-rose-400 disabled:opacity-60"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={team.placementPoints}
                            onChange={(e) => handleUpdatePlacementPoints(team.teamId, Number(e.target.value))}
                            disabled={isPublished || isPublishing}
                            className="w-14 bg-[#231544] border border-purple-700/50 text-center text-cyan-300 font-mono font-bold rounded py-0.5 text-xs focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300 print:text-black">
                          {team.killPoints}
                        </td>
                        <td className="py-2.5 px-3 text-right pr-4 font-mono text-xs font-black text-amber-400 print:text-black">
                          {team.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {onPublish && (
        <div className="p-3 sm:p-4 rounded-b-2xl border-t border-purple-800/40 bg-[#1a1133] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Match {report.matchNumber} Official Results
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {isPublished
                  ? 'Published to tournament on website.'
                  : 'Ready to publish. Push to update website standings.'}
              </p>
            </div>
          </div>

          <Button
            size="md"
            variant={isPublished ? 'outline' : 'booyah'}
            onClick={handlePublishClick}
            disabled={isPublishing || isPublished}
            className={`w-full sm:w-auto font-bold text-xs px-5 py-2 h-auto ${
              isPublished
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg hover:brightness-110 active:scale-95'
            }`}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Publishing to Website...</span>
              </>
            ) : isPublished ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mr-1.5" />
                <span>Published to Website</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4 mr-1.5" />
                <span>Push to Website as Match {report.matchNumber}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

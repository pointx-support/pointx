import React from 'react';
import {
  Trophy,
  Download,
  Printer,
  FileText,
  Flame,
  CheckCircle2,
  Crosshair,
  X,
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
}

export const MatchReportView: React.FC<MatchReportViewProps> = ({ report, onClose }) => {
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
    <div className="w-full max-w-4xl mx-auto bg-[#130f26] text-slate-100 rounded-2xl border border-purple-800/40 shadow-2xl overflow-hidden font-sans print:bg-white print:text-black print:border-none print:shadow-none">
      {/* Header Bar */}
      <div className="bg-[#1e1538] px-6 py-5 border-b border-purple-800/50 flex flex-wrap items-center justify-between gap-4 print:bg-transparent print:border-b-2 print:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-wide text-white print:text-black">
                {report.matchTitle || `Match ${report.matchNumber}`}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                FINALIZED (v{report.version})
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 print:text-neutral-600">
              Map: <span className="text-slate-200 font-semibold print:text-black">{report.mapName}</span> • Game:{' '}
              <span className="text-slate-200 font-semibold print:text-black">{report.game}</span> • Finalized: {formattedDate}
            </p>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="flex items-center gap-2 print:hidden">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 text-xs bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 text-xs bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>JSON</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>
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

      <div className="p-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Winner Card */}
          <div className="bg-[#1b1233]/90 border border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold font-mono">
              <span>BOOYAH #1</span>
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2">
              <p className="text-base font-black text-white truncate print:text-black">
                {report.summary.winningTeam.name}
              </p>
              <p className="text-[11px] text-slate-400 print:text-neutral-600">
                {report.summary.winningTeam.totalPoints} PTS ({report.summary.winningTeam.kills} elims)
              </p>
            </div>
          </div>

          {/* Kill Leader Card */}
          <div className="bg-[#1b1233]/90 border border-rose-500/40 rounded-xl p-3.5 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-rose-400 text-xs font-bold font-mono">
              <span>KILL LEADER</span>
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2">
              <p className="text-base font-black text-white truncate print:text-black">
                {report.summary.killLeader.teamName}
              </p>
              <p className="text-[11px] text-slate-400 print:text-neutral-600">
                {report.summary.killLeader.kills} Total Eliminations
              </p>
            </div>
          </div>

          {/* Total Elims Card */}
          <div className="bg-[#1b1233]/90 border border-purple-700/40 rounded-xl p-3.5 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold font-mono">
              <span>TOTAL ELIMS</span>
              <Crosshair className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2">
              <p className="text-xl font-black text-white print:text-black">
                {report.summary.totalEliminations}
              </p>
              <p className="text-[11px] text-slate-400 print:text-neutral-600">Across all squads</p>
            </div>
          </div>

          {/* Total Points Card */}
          <div className="bg-[#1b1233]/90 border border-purple-700/40 rounded-xl p-3.5 flex flex-col justify-between print:border-neutral-300 print:bg-neutral-50">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold font-mono">
              <span>TOTAL POINTS</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2">
              <p className="text-xl font-black text-white print:text-black">
                {report.summary.totalPoints}
              </p>
              <p className="text-[11px] text-slate-400 print:text-neutral-600">
                {report.summary.totalTeams} Teams Participating
              </p>
            </div>
          </div>
        </div>

        {/* Official Standings Table */}
        <div className="rounded-xl border border-purple-800/40 overflow-hidden bg-[#160e2b] shadow-lg print:border-neutral-300 print:bg-white">
          <div className="px-4 py-3 bg-[#1e143b] border-b border-purple-800/40 flex items-center justify-between print:bg-neutral-100 print:border-neutral-300">
            <h3 className="text-xs font-black tracking-wider text-slate-200 uppercase print:text-black">
              Official Match Standings
            </h3>
            <span className="text-[11px] font-mono text-slate-400 print:text-neutral-600">
              Sorted by Placement & Points
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-purple-800/30 text-slate-400 font-mono uppercase text-[10px] tracking-wider bg-black/20 print:bg-neutral-50 print:text-neutral-700 print:border-neutral-300">
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3 w-14 text-center">Slot</th>
                  <th className="py-2.5 px-4 font-bold text-slate-200 print:text-black">Team Name</th>
                  <th className="py-2.5 px-3 text-center">Placement</th>
                  <th className="py-2.5 px-3 text-center text-rose-400 font-bold print:text-black">Elims</th>
                  <th className="py-2.5 px-3 text-center">Place Pts</th>
                  <th className="py-2.5 px-3 text-center">Kill Pts</th>
                  <th className="py-2.5 px-3 text-right pr-4 font-black text-amber-400 print:text-black">Total Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 font-medium print:divide-neutral-200">
                {report.standings.map((team) => {
                  const isTop3 = team.rank <= 3;
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
                              team.rank === 2
                                ? 'text-slate-300 font-bold'
                                : team.rank === 3
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            #{team.rank}
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
                          {team.isBooyah && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black uppercase tracking-wider shadow-sm">
                              BOOYAH
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300 print:text-black">
                        {team.placement}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-rose-400 font-bold print:text-black">
                        {team.kills}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300 print:text-black">
                        {team.placementPoints}
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

        {/* Footer Audit Signature */}
        <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-[11px] font-mono text-slate-500 print:text-neutral-500">
          <span>PointX Esports Engine • Report ID: {report.reportId}</span>
          <span>Verified & Immutable</span>
        </div>
      </div>
    </div>
  );
};

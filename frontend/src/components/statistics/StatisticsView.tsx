import React from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  BarChart3,
  Trophy,
  Flame,
  Award,
  Target,
  ArrowLeft
} from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const { getStandings, getTournamentSummary, goBackTab } = useTournamentStore();

  const standings = getStandings();
  const summary = getTournamentSummary();

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goBackTab}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1 font-mono text-xs text-[var(--accent-primary)] font-bold uppercase tracking-wider">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--status-live)] animate-pulse"></span>
              <span>TOURNAMENT ANALYTICS & INSIGHTS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <BarChart3 className="h-6 w-6 text-[var(--accent-primary)]" />
              Tournament Statistical Insights
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
              Performance averages, single-match records, and squad consistency analytics.
            </p>
          </div>
        </div>

        <Badge variant="cyan" size="sm">
          {summary.completedMatches} / {summary.totalMatches} Matches Completed
        </Badge>
      </div>

      {/* Global Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 font-sans">
            <Flame className="h-4 w-4 text-[var(--status-danger)]" /> Total Frags
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1.5 font-numbers">
            {summary.totalKills}
          </div>
          <div className="text-xs text-[var(--status-danger)] font-bold mt-0.5">
            Avg {summary.avgMatchKills} / Match
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 font-sans">
            <Award className="h-4 w-4 text-[var(--accent-gold)]" /> Booyahs
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--accent-gold)] mt-1.5 font-numbers">
            {summary.totalBooyahs}
          </div>
          <div className="text-xs text-[var(--accent-gold)] font-bold mt-0.5">
            Official Victories
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 font-sans">
            <Trophy className="h-4 w-4 text-[var(--accent-gold)]" /> Best Match Score
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)] mt-1.5 font-numbers">
            {summary.highestSingleMatchScore?.points || 0} <span className="text-xs text-[var(--text-muted)] font-normal font-sans">PTS</span>
          </div>
          <div className="text-xs text-[var(--text-primary)] font-bold mt-0.5 truncate font-sans">
            {summary.highestSingleMatchScore?.teamName || 'N/A'} (M{summary.highestSingleMatchScore?.matchNumber})
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2 font-sans">
            <Target className="h-4 w-4 text-[var(--status-live)]" /> Best Match Frags
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--status-danger)] mt-1.5 font-numbers">
            {summary.highestSingleMatchKills?.kills || 0} <span className="text-xs text-[var(--text-muted)] font-normal font-sans">KILLS</span>
          </div>
          <div className="text-xs text-[var(--text-primary)] font-bold mt-0.5 truncate font-sans">
            {summary.highestSingleMatchKills?.teamName || 'N/A'} (M{summary.highestSingleMatchKills?.matchNumber})
          </div>
        </div>
      </div>

      {/* Team Consistency & Average Matrix */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-flat)]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-base sm:text-lg font-display">Team Performance & Consistency Matrix</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Match-by-match averages, best placements, and peak point yields for all participating squads.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--accent-primary)] font-bold">
            {standings.length} Squads
          </span>
        </div>

        {standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm tabular-nums font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-3.5 pl-5 pr-2 w-20">Rank</th>
                  <th className="py-3.5 px-4 font-sans">Team Name</th>
                  <th className="py-3.5 px-3 text-center">Avg Pts / Match</th>
                  <th className="py-3.5 px-3 text-center">Avg Kills / Match</th>
                  <th className="py-3.5 px-3 text-center">Best Placement</th>
                  <th className="py-3.5 px-3 text-center">Best Match Pts</th>
                  <th className="py-3.5 pl-3 pr-5 text-right text-[var(--accent-primary)]">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {standings.map((s) => (
                  <tr key={s.teamId} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-3.5 pl-5 pr-2 font-bold text-[var(--text-primary)] font-numbers">#{s.rank}</td>
                    <td className="py-3.5 px-4 font-sans font-bold text-[var(--text-primary)] text-sm sm:text-base">
                      <span className="text-[var(--accent-primary)] mr-2 font-mono">[{s.teamTag}]</span>
                      {s.teamName}
                    </td>
                    <td className="py-3.5 px-3 text-center text-[var(--text-primary)] font-numbers font-semibold">{s.avgPointsPerMatch}</td>
                    <td className="py-3.5 px-3 text-center text-[var(--status-danger)] font-bold font-numbers">{s.avgKillsPerMatch}</td>
                    <td className="py-3.5 px-3 text-center text-[var(--accent-gold)] font-bold font-numbers">#{s.bestPlacement || '—'}</td>
                    <td className="py-3.5 px-3 text-center text-[var(--text-primary)] font-numbers font-semibold">+{s.bestMatchPoints}</td>
                    <td className="py-3.5 pl-3 pr-5 text-right font-black text-base text-[var(--accent-primary)] font-numbers">
                      {s.totalPoints} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <BarChart3 className="h-8 w-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">No Match Records Available</h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              Finalize matches in the Calculate Points section to generate consistency metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
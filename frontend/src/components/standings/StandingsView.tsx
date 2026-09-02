import React, { useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { ResponsiveStandingsTable } from './ResponsiveStandingsTable';
import { TopFraggersView } from './TopFraggersView';
import { CalculationLoader } from '../ui/CalculationLoader';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  Trophy,
  Tv,
  Sparkles,
  Download,
  Flame,
  RotateCw,
  ArrowLeft
} from 'lucide-react';
import { exportStandingsToCSV, downloadBlobFile } from '../../engine/exportEngine';

export const StandingsView: React.FC = () => {
  const { currentTournament, getStandings, setActiveTab, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'overall' | 'mvp'>('overall');
  const [selectedGroup, setSelectedGroup] = useState<'All' | 'Group A' | 'Group B'>('All');
  const [isCalculating, setIsCalculating] = useState(false);

  const standings = getStandings();

  const handleRecalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      showToast({
        type: 'success',
        title: 'Point Table Re-Calculated',
        message: 'Updated rankings and tie-breakers across all matches.'
      });
    }, 600);
  };

  const handleExportCSV = () => {
    try {
      const csvStr = exportStandingsToCSV(standings, currentTournament.title);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const filename = `${currentTournament.title.replace(/\s+/g, '_')}_Standings.csv`;
      downloadBlobFile(blob, filename);

      showToast({
        type: 'success',
        title: 'CSV Export Complete',
        message: `Standings saved as "${filename}".`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Error',
        message: err?.message || 'Failed to export standings CSV.'
      });
    }
  };

  const totalPointsAwarded = standings.reduce((sum, s) => sum + s.totalPoints, 0);
  const totalBooyahsAwarded = standings.reduce((sum, s) => sum + s.booyahs, 0);
  const totalKillsAwarded = standings.reduce((sum, s) => sum + s.totalKills, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar with Back Button */}
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
              <span>LIVE COMPUTED LEADERBOARD</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2 font-display">
              <Trophy className="h-6 w-6 text-[var(--accent-gold)]" />
              Tournament Point Table & Standings
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Auto-calculated overall standings following the official Free Fire scoring matrix.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculate}
            leftIcon={<RotateCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />}
          >
            Recalculate Table
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('broadcast')}
            leftIcon={<Tv className="h-4 w-4 text-[var(--status-live)]" />}
          >
            OBS Overlay
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('graphics')}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Generate Graphics
          </Button>
        </div>
      </div>

      {/* Aggregate Highlights Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Active Leader</div>
          <div className="text-lg font-bold text-[var(--accent-gold)] mt-1 truncate font-display">
            {standings[0] ? standings[0].teamName : 'N/A'}
          </div>
          <div className="text-xs sm:text-sm text-[var(--text-primary)] font-bold mt-0.5 font-numbers">
            {standings[0] ? `${standings[0].totalPoints} PTS` : '0 PTS'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Total Points Pool</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1 font-numbers">
            {totalPointsAwarded} <span className="text-xs text-[var(--text-muted)] font-normal">PTS</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            Across {currentTournament.matches.length} Matches
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Total Eliminations</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--status-danger)] mt-1 font-numbers">
            {totalKillsAwarded}
          </div>
          <div className="text-xs text-[var(--status-danger)] mt-0.5 font-bold">
            +{currentTournament.scoringPreset.killPoints} Pts / Elimination
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Booyah Victories</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--accent-gold)] mt-1 font-numbers">
            {totalBooyahsAwarded}
          </div>
          <div className="text-xs text-[var(--accent-gold)] mt-0.5 font-bold">
            Official Champions
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] rounded-2xl w-fit shadow-[var(--shadow-inset)]">
          <button
            onClick={() => setActiveSubTab('overall')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'overall'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Overall Point Table</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--bg-surface)] font-mono text-[var(--text-secondary)] font-bold">
              {standings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('mvp')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'mvp'
                ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Flame className="h-4 w-4 text-[var(--status-danger)]" />
            <span>Top Fraggers MVP</span>
          </button>
        </div>

        {/* Group Filter for Round Robin */}
        {currentTournament.structure?.roundRobin && (
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface-inset)] p-1.5 rounded-xl border border-[var(--border-subtle)] text-xs shadow-[var(--shadow-inset)]">
            {(['All', 'Group A', 'Group B'] as const).map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedGroup === grp
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Leaderboard Body or Animated Calculation Loader */}
      {isCalculating ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-sm">
          <CalculationLoader
            title="Recalculating Point Table Matrix..."
            subtitle="Evaluating 12-slot placement ranks, eliminations, and official Free Fire standings"
          />
        </div>
      ) : activeSubTab === 'overall' ? (
        <ResponsiveStandingsTable standings={standings} />
      ) : (
        <TopFraggersView />
      )}
    </div>
  );
};
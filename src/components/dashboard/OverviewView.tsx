import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Swords,
  ArrowUpRight,
  Award,
  Sparkles,
  Users2,
  CheckCircle2,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { getMatchpointLabel } from '../../utils/format';

export interface OverviewViewProps {
  onBackToDashboard?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onBackToDashboard }) => {
  const { currentTournament, getStandings, setActiveTab, autofillKnownTeams, setCreateMatchModalOpen } = useTournamentStore();
  const { showToast } = useToast();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const standings = getStandings();

  const totalKills = standings.reduce((acc, curr) => acc + curr.totalKills, 0);
  const totalBooyahs = standings.reduce((acc, curr) => acc + curr.booyahs, 0);
  const leader = standings[0];

  const currentTeamsCount = currentTournament.teams.length;
  const hasCustomTeams = currentTournament.teams.some(
    (t) => t.name && !t.name.startsWith('Slot #') && !t.name.startsWith('Blank')
  );
  const hasMatches = currentTournament.matches.length > 0;
  const finalizedCount = currentTournament.matches.filter(
    (m) => m.status === 'Finalized' || m.status === 'Completed'
  ).length;

  const nextMatchNum = currentTournament.matches.length + 1;
  const matchpointButtonLabel = getMatchpointLabel(nextMatchNum);

  const handleQuickAutofill = () => {
    autofillKnownTeams();
    showToast({
      type: 'success',
      title: '12 Pro Squads Loaded',
      message: 'Successfully populated 12 verified Free Fire lineups.'
    });
  };

  const handleBackClick = () => {
    setShowExitConfirm(true);
  };

  return (
    <>
      <div className="space-y-6 font-sans">
        {/* 1. FIRST-TIME ORGANIZER ONBOARDING GUIDE & NEXT STEPS */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              {onBackToDashboard && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackClick}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              )}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                    Organizer Roadmap
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {hasCustomTeams && hasMatches ? 'Ready for Broadcast' : 'Setup in Progress'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display mt-0.5">
                  Tournament Next Steps: How to Run Your Event
                </h2>
              </div>
            </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users2 className="h-4 w-4" />}
              onClick={() => setActiveTab('teams')}
            >
              Step 1: Teams & Slots (12 Squads) →
            </Button>

            {!hasCustomTeams && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Zap className="h-4 w-4 text-[var(--accent-primary)]" />}
                onClick={handleQuickAutofill}
              >
                Autofill 12 Pro Teams
              </Button>
            )}
          </div>
        </div>

        {/* 3-Step Interactive Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* STEP 1: Teams & Slots */}
          <div
            onClick={() => setActiveTab('teams')}
            className={`p-4 rounded-xl border hover-lift cursor-pointer space-y-2 ${
              hasCustomTeams
                ? 'border-[var(--status-success)]/40 bg-[var(--status-success)]/5'
                : 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5 hover:border-[var(--accent-primary)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[var(--accent-primary)] flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5" /> Step 01
              </span>
              {hasCustomTeams ? (
                <span className="text-[11px] font-mono text-[var(--status-success)] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {currentTeamsCount} Ready
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--status-warning)] font-bold animate-pulse">
                  Setup Required
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              Assign 12 Squads & Slots
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Name teams, upload crest logos, and assign slots 1 to 12.
            </p>
          </div>

          {/* STEP 2: Calculate Match Points */}
          <div
            onClick={() => {
              setActiveTab('matches');
              setCreateMatchModalOpen(true);
            }}
            className={`p-4 rounded-xl border hover-lift cursor-pointer space-y-2 ${
              hasMatches
                ? 'border-[var(--status-success)]/40 bg-[var(--status-success)]/5'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-[var(--accent-primary)]" /> Step 02
              </span>
              {hasMatches ? (
                <span className="text-[11px] font-mono text-[var(--status-success)] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {finalizedCount} Finalized
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Pending Match 1
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              Calculate Match Points
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enter match placements (#1 to #12) and elimination frags. Live point matrix calculates instantly.
            </p>
          </div>

          {/* STEP 3: Point Table & 4K Graphics */}
          <div
            onClick={() => setActiveTab('graphics')}
            className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] hover-lift cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" /> Step 03
              </span>
              <span className="text-[11px] font-mono text-[var(--accent-primary)] font-bold">
                HD & 4K Export
              </span>
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] font-display">
              Point Table & Graphics Studio
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Generate 4K Instagram posters, match flyers, and connect OBS browser sources for livestreams.
            </p>
          </div>
        </div>
      </div>

      {/* 2. EVENT HEADER BANNER */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-surface-inset)] px-3 py-1 text-xs font-mono font-bold text-[var(--accent-primary)] border border-[var(--border-subtle)]">
              <Award className="h-4 w-4" />
              <span>OFFICIAL SCORING APPLIED</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight font-display">
              {currentTournament.title}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
              Organized by <span className="text-[var(--text-primary)] font-bold font-sans">{currentTournament.organizer}</span> • {currentTournament.scoringPreset.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Swords className="h-4 w-4" />}
              onClick={() => {
                setActiveTab('matches');
                setCreateMatchModalOpen(true);
              }}
            >
              {matchpointButtonLabel}
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Users2 className="h-4 w-4" />}
              onClick={() => setActiveTab('teams')}
            >
              Squads & Slots
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />}
              onClick={() => setActiveTab('graphics')}
            >
              Graphics Studio
            </Button>
          </div>
        </div>
      </div>

      {/* 3. METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Current Leader</span>
            <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate font-display">
              {leader ? leader.teamName : '--'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-[var(--accent-gold)] mt-0.5 font-numbers">
              {leader ? `${leader.totalPoints} PTS (${leader.booyahs} 👑)` : '0 PTS'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Matches Played</span>
            <Swords className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-numbers">
              {currentTournament.matches.length}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {currentTournament.teams.length} Squads Active
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Total Eliminations</span>
            <Flame className="h-5 w-5 text-[var(--status-danger)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-numbers">
              {totalKills}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-numbers">
              {(totalKills / (currentTournament.matches.length || 1)).toFixed(1)} Frags / Match
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Booyahs Count</span>
            <Award className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-numbers">
              {totalBooyahs}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              Across {currentTournament.matches.length} Matches
            </div>
          </div>
        </div>
      </div>

      {/* 4. PODIUM STANDINGS */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-[var(--text-primary)] text-base sm:text-lg tracking-tight font-display">
              Podium Standings
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('standings')}
            className="text-xs font-mono font-bold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Full Point Table</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono">
          {standings.slice(0, 3).map((team, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            return (
              <div
                key={team.teamId}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isFirst
                    ? 'border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10 shadow-sm'
                    : isSecond
                    ? 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] shadow-[var(--shadow-inset)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] shadow-[var(--shadow-inset)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shrink-0 ${
                        isFirst
                          ? 'bg-[var(--accent-gold)] text-black'
                          : isSecond
                          ? 'bg-[var(--text-secondary)] text-white'
                          : 'bg-[var(--accent-primary)] text-white'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate font-sans">
                        {team.teamName}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {team.booyahs} 👑 Booyahs
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-[var(--accent-primary)] font-numbers">
                      {team.totalPoints} PTS
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-numbers">
                      {team.totalKills} Kills
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Return to Dashboard Confirmation Modal */}
    <Modal
      isOpen={showExitConfirm}
      onClose={() => setShowExitConfirm(false)}
      title="Return to Main Dashboard?"
      maxWidth="md"
    >
      <div className="space-y-4 font-sans">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          You are currently working inside <strong className="text-[var(--text-primary)] font-bold">{currentTournament?.title || 'this tournament'}</strong>. Are you sure you want to return to the Main Dashboard?
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          All your match calculations and rosters remain saved.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowExitConfirm(false)}
          >
            No, Stay Here
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowExitConfirm(false);
              if (onBackToDashboard) {
                onBackToDashboard();
              }
            }}
          >
            Yes, Return to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
};
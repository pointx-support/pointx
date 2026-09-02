import React, { useState, useMemo } from 'react';
import type { Match, Tournament } from '../../types/tournament';
import type { RawMatchTeamResult } from '../../types/scoring';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTeamMatchScore } from '../../engine/scoringEngine';
import { MatchReviewModal } from './MatchReviewModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { CalculationLoader } from '../ui/CalculationLoader';
import { useToast } from '../ui/Toast';
import {
  ArrowLeft,
  Save,
  Trophy,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export interface MatchEditorProps {
  match: Match;
  tournament: Tournament;
  onBack: () => void;
}

export const MatchEditor: React.FC<MatchEditorProps> = ({
  match,
  tournament,
  onBack
}) => {
  const { updateMatchResults, finalizeMatch, unfinalizeMatch } = useTournamentStore();
  const { showToast } = useToast();

  const isFinalized = match.status === 'Finalized';

  // Initialize raw editable state for each tournament team
  const [rawResults, setRawResults] = useState<RawMatchTeamResult[]>(() => {
    return tournament.teams.map((t) => {
      const existing = match.results.find((r) => r.teamId === t.id);
      return {
        teamId: t.id,
        placement: existing ? existing.placement : 0,
        kills: existing ? existing.kills : 0,
        booyah: existing ? existing.isBooyah : false,
        bonusPoints: existing ? existing.bonusPoints : 0,
        penaltyPoints: existing ? existing.penaltyPoints : 0
      };
    });
  });

  const [customLabel, setCustomLabel] = useState<string>(
    match.customLabel || `Match ${match.matchNumber.toString().padStart(2, '0')}`
  );
  const [mapName, setMapName] = useState<string>(match.mapName || 'Bermuda');

  // Mobile focused team index
  const [mobileActiveIndex, setMobileActiveIndex] = useState<number>(0);
  const [entryViewMode, setEntryViewMode] = useState<'desktop-table' | 'mobile-stepper'>('desktop-table');

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Live Calculations across all teams using central scoring engine
  const calculatedRows = useMemo(() => {
    return rawResults.map((raw) => {
      const team = tournament.teams.find((t) => t.id === raw.teamId);
      const calc = calculateTeamMatchScore(raw, tournament.scoringPreset);

      return {
        raw,
        team,
        calcResult: calc.success && calc.data ? calc.data : null,
        error: calc.error
      };
    });
  }, [rawResults, tournament.teams, tournament.scoringPreset]);

  // Validation Warnings
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const usedPlacements = rawResults.filter((r) => r.placement > 0).map((r) => r.placement);
    const duplicates = usedPlacements.filter((item, index) => usedPlacements.indexOf(item) !== index);

    if (duplicates.length > 0) {
      warnings.push(`Duplicate placement rank #${duplicates[0]} assigned to multiple squads.`);
    }

    const unassigned = rawResults.filter((r) => r.placement <= 0);
    if (unassigned.length > 0) {
      const team = tournament.teams.find((t) => t.id === unassigned[0].teamId);
      warnings.push(`Missing placement for "${team?.name || 'team'}"`);
    }

    const booyahCount = rawResults.filter((r) => r.booyah || r.placement === 1).length;
    if (booyahCount > 1) {
      warnings.push('Multiple teams marked with 1st Place / Booyah.');
    }

    return warnings;
  }, [rawResults, tournament.teams]);

  const handleUpdateResult = (
    teamId: string,
    field: keyof RawMatchTeamResult,
    value: any
  ) => {
    if (isFinalized) return;

    setRawResults((prev) =>
      prev.map((r) => {
        if (r.teamId !== teamId) return r;
        const updated = { ...r, [field]: value };

        // Auto-toggle Booyah when placement becomes 1
        if (field === 'placement') {
          updated.placement = value;
          updated.booyah = value === 1;
        }

        return updated;
      })
    );
  };

  const handleSaveDraft = () => {
    updateMatchResults(tournament.id, match.id, rawResults, 'Draft', customLabel, mapName);
    showToast({
      type: 'info',
      title: 'Draft Saved',
      message: `Match #${match.matchNumber} progress saved.`
    });
  };

  const [isCalculating, setIsCalculating] = useState(false);

  const handleFinalizeConfirmed = () => {
    setIsCalculating(true);
    setIsReviewModalOpen(false);

    setTimeout(() => {
      updateMatchResults(tournament.id, match.id, rawResults, 'Completed', customLabel, mapName);
      const res = finalizeMatch(tournament.id, match.id);
      setIsCalculating(false);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Match Finalized',
          message: `Match #${match.matchNumber} official results locked into point table.`
        });
        onBack();
      } else {
        showToast({
          type: 'error',
          title: 'Finalization Failed',
          message: res.errors?.[0] || 'Validation error'
        });
      }
    }, 650);
  };

  const handleUnlockMatch = () => {
    unfinalizeMatch(tournament.id, match.id);
    setIsUnlockModalOpen(false);
    showToast({
      type: 'info',
      title: 'Match Unlocked',
      message: 'You can now edit results. Re-finalize when corrections are complete.'
    });
  };

  const activeMobileTeam = calculatedRows[mobileActiveIndex];

  if (isCalculating) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-sm">
        <CalculationLoader
          title={`Calculating ${customLabel} Standings...`}
          subtitle="Applying kill multipliers, position thresholds, and rank point algorithms"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Matches
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate font-display">
              {customLabel}
            </h2>
            <Badge variant={isFinalized ? 'amber' : 'live'} size="sm">
              {isFinalized ? 'FINALIZED' : match.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons Matrix */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isFinalized ? (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Unlock className="h-4 w-4 text-[var(--accent-gold)]" />}
              onClick={() => setIsUnlockModalOpen(true)}
            >
              Unlock to Edit
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Save className="h-4 w-4 text-[var(--text-secondary)]" />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>

              <Button
                variant="booyah"
                size="md"
                leftIcon={<Lock className="h-4 w-4" />}
                onClick={() => setIsReviewModalOpen(true)}
              >
                Lock Official Results
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Beginner Helper Tip Strip */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-3 px-4 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-inset)] font-mono">
        <div className="flex items-center gap-2 font-sans">
          <HelpCircle className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
          <span>
            <strong>Beginner Tip:</strong> Enter final rank (1 to {calculatedRows.length}) and kills for each squad. Points calculate automatically.
          </span>
        </div>
        <span className="text-[11px] text-[var(--accent-primary)] font-mono font-bold hidden sm:inline">Auto-Calculate ON</span>
      </div>

      {/* Finalized Banner Alert */}
      {isFinalized && (
        <div className="rounded-2xl border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 p-4 text-xs text-[var(--text-primary)] flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-[var(--accent-gold)] shrink-0" />
            <div>
              <strong className="text-[var(--text-primary)] text-sm font-display">This match is officially finalized.</strong>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
                Results are locked into the official point table. Click "Unlock to Edit" to make corrections.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsUnlockModalOpen(true)}
          >
            Unlock
          </Button>
        </div>
      )}

      {/* Match Meta Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-mono">
            Match Title / Round Label
          </label>
          <input
            type="text"
            disabled={isFinalized}
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-60 font-sans"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-mono">
            Battlefield Map
          </label>
          <select
            disabled={isFinalized}
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-1.5 text-xs text-[var(--text-primary)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-60 cursor-pointer font-sans"
          >
            <option value="Bermuda" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Bermuda</option>
            <option value="Purgatory" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Purgatory</option>
            <option value="Kalahari" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Kalahari</option>
            <option value="Alpine" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Alpine</option>
            <option value="NexTerra" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">NexTerra</option>
            <option value="Solara" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Solara</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
          <div className="text-right">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-mono">Active Scoring Preset</div>
            <div className="text-xs font-mono font-bold text-[var(--accent-primary)]">
              {tournament.scoringPreset.name}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Notice */}
      {validationWarnings.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-300 flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium text-[var(--text-primary)]">
              {validationWarnings[0]}
              {validationWarnings.length > 1 && ` (+${validationWarnings.length - 1} more issues)`}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Toggle */}
      <div className="flex sm:hidden items-center justify-between p-1 bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] rounded-xl text-xs font-medium shadow-inner">
        <button
          onClick={() => setEntryViewMode('desktop-table')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            entryViewMode === 'desktop-table' ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] font-bold shadow-sm' : 'text-[var(--text-secondary)]'
          }`}
        >
          Full Table
        </button>
        <button
          onClick={() => setEntryViewMode('mobile-stepper')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            entryViewMode === 'mobile-stepper' ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] font-bold shadow-sm' : 'text-[var(--text-secondary)]'
          }`}
        >
          Stepper ({mobileActiveIndex + 1}/{calculatedRows.length})
        </button>
      </div>

      {/* MOBILE STEPPER VIEW */}
      {entryViewMode === 'mobile-stepper' && activeMobileTeam && (
        <div className="sm:hidden space-y-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 shadow-[var(--shadow-flat)] font-mono">
            {/* Team Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--accent-primary)] font-numbers shadow-inner">
                  #{activeMobileTeam.team?.slotNumber}
                </div>
                <div className="min-w-0 font-sans">
                  <h3 className="font-bold text-[var(--text-primary)] text-sm truncate font-display">
                    {activeMobileTeam.team?.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                    [{activeMobileTeam.team?.tag}]
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[var(--text-secondary)] uppercase">Calculated Score</div>
                <div className="text-lg font-bold text-[var(--accent-primary)] font-numbers">
                  {activeMobileTeam.calcResult?.totalPoints || 0} PTS
                </div>
              </div>
            </div>

            {/* Placement & Kills Input Steppers */}
            <div className="space-y-3">
              {/* Placement */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1 font-sans">
                  Placement Rank (#1 to #{calculatedRows.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isFinalized || activeMobileTeam.raw.placement <= 1}
                    onClick={() =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'placement',
                        Math.max(1, activeMobileTeam.raw.placement - 1)
                      )
                    }
                    className="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] disabled:opacity-40 font-bold shadow-sm cursor-pointer"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={calculatedRows.length}
                    disabled={isFinalized}
                    value={activeMobileTeam.raw.placement || ''}
                    onChange={(e) =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'placement',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="Unset"
                    className="flex-1 h-11 text-center font-bold text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-primary)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />

                  <button
                    type="button"
                    disabled={
                      isFinalized || activeMobileTeam.raw.placement >= calculatedRows.length
                    }
                    onClick={() =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'placement',
                        (activeMobileTeam.raw.placement || 0) + 1
                      )
                    }
                    className="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] disabled:opacity-40 font-bold shadow-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Kills */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1 font-sans">
                  Elimination Frags (Kills)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isFinalized || activeMobileTeam.raw.kills <= 0}
                    onClick={() =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'kills',
                        Math.max(0, activeMobileTeam.raw.kills - 1)
                      )
                    }
                    className="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] disabled:opacity-40 font-bold shadow-sm cursor-pointer"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min={0}
                    disabled={isFinalized}
                    value={activeMobileTeam.raw.kills}
                    onChange={(e) =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'kills',
                        Math.max(0, parseInt(e.target.value, 10) || 0)
                      )
                    }
                    className="flex-1 h-11 text-center font-bold text-base rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-primary)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />

                  <button
                    type="button"
                    disabled={isFinalized}
                    onClick={() =>
                      handleUpdateResult(
                        activeMobileTeam.raw.teamId,
                        'kills',
                        activeMobileTeam.raw.kills + 1
                      )
                    }
                    className="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)] disabled:opacity-40 font-bold shadow-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Booyah Automatic Indicator */}
              {activeMobileTeam.raw.placement === 1 && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] text-xs font-bold font-display shadow-sm">
                  <Trophy className="h-4 w-4 text-[var(--accent-gold)]" />
                  <span>Booyah Champion (1st Place Winner)</span>
                </div>
              )}
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between gap-2.5 pt-2 font-sans">
              <Button
                variant="outline"
                size="sm"
                disabled={mobileActiveIndex === 0}
                onClick={() => setMobileActiveIndex((prev) => Math.max(0, prev - 1))}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                className="flex-1"
              >
                Previous
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={mobileActiveIndex >= calculatedRows.length - 1}
                onClick={() =>
                  setMobileActiveIndex((prev) =>
                    Math.min(calculatedRows.length - 1, prev + 1)
                  )
                }
                rightIcon={<ChevronRight className="h-4 w-4" />}
                className="flex-1"
              >
                Next Team
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP MATRIX TABLE */}
      {(entryViewMode === 'desktop-table' || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                  <th className="py-3 pl-4 pr-2 w-16">Slot</th>
                  <th className="py-3 px-3 font-sans">Team Name</th>
                  <th className="py-3 px-3 text-center w-28">Placement *</th>
                  <th className="py-3 px-3 text-center w-28">Kills *</th>
                  <th className="py-3 px-3 text-center w-24">Booyah</th>
                  <th className="py-3 px-3 text-right w-24">Place Pts</th>
                  <th className="py-3 px-3 text-right w-24">Kill Pts</th>
                  <th className="py-3 pl-3 pr-4 text-right w-28 font-bold text-[var(--accent-primary)]">Total Score</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border-subtle)] text-xs font-mono">
                {calculatedRows.map((row) => {
                  const { raw, team, calcResult } = row;
                  if (!team) return null;

                  const isWinner = raw.placement === 1 || raw.booyah;

                  return (
                    <tr
                      key={team.id}
                      className={`transition-colors hover:bg-[var(--bg-surface-hover)] ${
                        isWinner ? 'bg-[var(--accent-gold)]/[0.06]' : ''
                      }`}
                    >
                      {/* Slot */}
                      <td className="py-2.5 pl-4 pr-2 whitespace-nowrap text-[var(--text-secondary)] font-numbers">
                        #{team.slotNumber.toString().padStart(2, '0')}
                      </td>

                      {/* Team Identity */}
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-[var(--text-primary)] text-xs truncate flex items-center gap-1.5 font-display">
                          {team.name}
                          {isWinner && <Trophy className="h-3.5 w-3.5 text-[var(--accent-gold)]" />}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                          [{team.tag}]
                        </div>
                      </td>

                      {/* Placement */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={calculatedRows.length}
                          disabled={isFinalized}
                          value={raw.placement || ''}
                          onChange={(e) =>
                            handleUpdateResult(
                              team.id,
                              'placement',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="--"
                          className={`w-16 h-8 text-center font-bold rounded-lg border transition-all text-xs focus:outline-none ${
                            isWinner
                              ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-primary)] focus:border-[var(--accent-primary)]'
                          }`}
                        />
                      </td>

                      {/* Kills */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          disabled={isFinalized}
                          value={raw.kills}
                          onChange={(e) =>
                            handleUpdateResult(
                              team.id,
                              'kills',
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="w-16 h-8 text-center font-bold rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                      </td>

                      {/* Booyah automatic badge */}
                      <td className="py-2.5 px-3 text-center">
                        {raw.placement === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] font-bold text-[10px] font-mono shadow-sm">
                            <Trophy className="h-3 w-3" />
                            BOOYAH
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Placement Pts */}
                      <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] font-numbers">
                        +{calcResult?.placementPoints || 0}
                      </td>

                      {/* Kill Pts */}
                      <td className="py-2.5 px-3 text-right text-rose-500 font-bold font-numbers">
                        +{calcResult?.killPoints || 0}
                      </td>

                      {/* Total Score */}
                      <td className="py-2.5 pl-3 pr-4 text-right font-bold text-sm text-[var(--accent-primary)] font-numbers">
                        {calcResult?.totalPoints || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <MatchReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          match={{
            ...match,
            results: calculatedRows
              .filter((r) => r.calcResult)
              .map((r) => r.calcResult!)
          }}
          tournament={tournament}
          onConfirmFinalize={handleFinalizeConfirmed}
          warnings={validationWarnings}
        />
      )}

      {/* Unlock Confirmation Modal */}
      {isUnlockModalOpen && (
        <Modal
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
          title="Unlock Finalized Match?"
          description="Unlocking allows editing team placements and kills. Official standings will temporarily revert until re-finalized."
          maxWidth="sm"
        >
          <div className="space-y-4 font-sans">
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Re-finalizing this match later will recalculate overall leaderboard points and OBS live streams.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <Button variant="outline" size="sm" onClick={() => setIsUnlockModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUnlockMatch}
                leftIcon={<Unlock className="h-4 w-4" />}
              >
                Confirm Unlock
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
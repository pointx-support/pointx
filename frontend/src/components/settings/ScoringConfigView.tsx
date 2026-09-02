import React, { useState } from 'react';
import type { ScoringPreset, PlacementRule, RawMatchTeamResult } from '../../types/scoring';
import { useTournamentStore } from '../../store/tournamentStore';
import {
  calculateTeamMatchScore,
  normalizeScoringConfig,
  OFFICIAL_FF_PLACEMENT_TABLE,
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING
} from '../../engine/scoringEngine';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import {
  Sliders,
  Award,
  Calculator,
  Save,
  RotateCcw,
  ArrowLeft,
  Trophy
} from 'lucide-react';

const PRESET_LIST: ScoringPreset[] = [
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING
];

export const ScoringConfigView: React.FC = () => {
  const { currentTournament, tournaments, setCurrentTournamentId, updateTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [activePreset, setActivePreset] = useState<ScoringPreset>(() =>
    normalizeScoringConfig(currentTournament?.scoringPreset)
  );
  const [testPlacement, setTestPlacement] = useState<number>(1);
  const [testKills, setTestKills] = useState<number>(6);
  const [testBooyah, setTestBooyah] = useState<boolean>(true);

  // Sync when current tournament changes
  React.useEffect(() => {
    if (currentTournament?.scoringPreset) {
      setActivePreset(normalizeScoringConfig(currentTournament.scoringPreset));
    }
  }, [currentTournament?.id]);

  const placementRules: PlacementRule[] = Array.isArray(activePreset?.placementTable) && activePreset.placementTable.length > 0
    ? activePreset.placementTable
    : OFFICIAL_FF_PLACEMENT_TABLE;

  // Live test calculation sandbox
  const testRaw: RawMatchTeamResult = {
    teamId: 'sandbox-team',
    matchId: 'sandbox-match',
    placement: testPlacement,
    kills: testKills,
    booyah: testBooyah
  };

  const safePresetForCalc: ScoringPreset = {
    ...activePreset,
    placementTable: placementRules
  };

  const sandboxResult = calculateTeamMatchScore(testRaw, safePresetForCalc);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_LIST.find((p: ScoringPreset) => p.id === presetId);
    if (found) {
      setActivePreset(found);
    }
  };

  const handlePlacementPointsChange = (rank: number, points: number) => {
    setActivePreset((prev: ScoringPreset) => {
      const currentRules = Array.isArray(prev?.placementTable) && prev.placementTable.length > 0
        ? prev.placementTable
        : OFFICIAL_FF_PLACEMENT_TABLE;
      const updatedRules: PlacementRule[] = currentRules.map((r: PlacementRule) =>
        r.place === rank ? { ...r, points: Math.max(0, Math.floor(points)) } : r
      );
      return {
        ...prev,
        isOfficial: false,
        name: prev?.name?.includes('Custom') ? prev.name : `${prev?.name || 'Custom'} (Customized)`,
        placementTable: updatedRules
      };
    });
  };

  const handleKillPointsChange = (points: number) => {
    setActivePreset((prev: ScoringPreset) => ({
      ...prev,
      isOfficial: false,
      name: prev?.name?.includes('Custom') ? prev.name : `${prev?.name || 'Custom'} (Customized)`,
      killPoints: Math.max(0, points)
    }));
  };

  const handleSaveToTournament = () => {
    const updated: ScoringPreset = {
      ...activePreset,
      placementTable: placementRules,
      version: (activePreset.version || 1) + 1
    };

    if (currentTournament) {
      updateTournament(currentTournament.id, { scoringPreset: updated });
      showToast({
        type: 'success',
        title: 'Scoring Rules Applied',
        message: `New points matrix saved and active for "${currentTournament.title || (currentTournament as any).name || 'Tournament'}".`
      });
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('pointx_default_scoring_preset', JSON.stringify(updated));
      }
      showToast({
        type: 'success',
        title: 'Default Rules Saved',
        message: 'Saved as default scoring matrix for all upcoming tournaments.'
      });
    }
  };

  const handleResetDefaults = () => {
    setActivePreset(DEFAULT_FREE_FIRE_SCORING);
    showToast({
      type: 'info',
      title: 'Rules Reset',
      message: 'Restored standard Free Fire Official scoring matrix.'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Sliders className="h-6 w-6 text-[var(--accent-primary)]" />
              Scoring Rules Matrix & Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Configure placement points and elimination frag values for tournament standings calculations.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {currentTournament ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-mono font-bold">
                  <Trophy className="h-3 w-3" />
                  Tournament: {currentTournament.title || (currentTournament as any).name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  Organization Global Default Rules
                </span>
              )}
              {tournaments && tournaments.length > 0 && (
                <select
                  value={currentTournament?.id || ''}
                  onChange={(e) => {
                    const selected = tournaments.find((t) => t.id === e.target.value);
                    if (selected) setCurrentTournamentId(selected.id);
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="">-- Apply to specific tournament --</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title || (t as any).name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset Defaults
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveToTournament}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Rules Matrix
          </Button>
        </div>
      </div>

      {/* Preset Selector Strip */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)] space-y-3.5">
        <div className="text-xs font-bold text-[var(--text-secondary)] font-mono uppercase tracking-wider">
          Preset Rule Templates
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_LIST.map((p: ScoringPreset) => {
            const isSelected = activePreset.id === p.id && activePreset.isOfficial === p.isOfficial;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                    : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm font-display">{p.name}</div>
                  <span className="text-xs font-mono text-[var(--accent-gold)] font-bold">+{p.killPoints} / Kill</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 truncate font-mono">
                  {p.isOfficial ? 'Official Standard Rules' : 'Alternative Matrix'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Rules Editor & Live Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Placement Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-[var(--shadow-flat)] font-mono">
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)] font-sans">
            <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 font-display">
              <Award className="h-5 w-5 text-[var(--accent-gold)]" />
              Placement Points Table
            </h3>
            <Badge variant="official" size="sm">
              {placementRules.length} Placements
            </Badge>
          </div>

          <div className="space-y-4 font-sans">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase font-mono">
                Points Awarded per Elimination Kill
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={activePreset.killPoints ?? 1}
                  onChange={(e) => handleKillPointsChange(Number(e.target.value))}
                  className="w-28 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2 text-sm sm:text-base font-bold text-[var(--status-danger)] text-center shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)] font-numbers"
                />
                <span className="text-xs sm:text-sm text-[var(--text-secondary)]">PTS per player elimination</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {placementRules.map((rule: PlacementRule) => (
                <div
                  key={rule.place}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] font-mono"
                >
                  <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold">
                    #{rule.place} {rule.place === 1 ? '👑' : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={rule.points}
                      onChange={(e) => handlePlacementPointsChange(rule.place, Number(e.target.value))}
                      className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-xs sm:text-sm font-bold text-[var(--accent-primary)] text-center shadow-sm focus:outline-none focus:border-[var(--accent-primary)] font-numbers"
                    />
                    <span className="text-xs text-[var(--text-muted)]">PTS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Sandbox Simulator (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-[var(--shadow-flat)] font-mono">
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)] font-sans">
            <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 font-display">
              <Calculator className="h-5 w-5 text-[var(--accent-primary)]" />
              Real-Time Scoring Sandbox
            </h3>
            <span className="text-xs text-[var(--accent-primary)] font-mono font-bold">LIVE TEST</span>
          </div>

          <div className="space-y-4 font-sans">
            <Input
              label="Test Placement Rank (1 - 12)"
              type="number"
              min={1}
              max={12}
              value={testPlacement}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTestPlacement(val);
                if (val === 1) setTestBooyah(true);
              }}
            />

            <Input
              label="Test Elimination Kills"
              type="number"
              min={0}
              value={testKills}
              onChange={(e) => setTestKills(Math.max(0, Number(e.target.value)))}
            />

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] cursor-pointer font-sans">
              <input
                type="checkbox"
                checked={testBooyah}
                onChange={(e) => setTestBooyah(e.target.checked)}
                className="rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] h-5 w-5"
              />
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Award Booyah Champion</span>
            </label>
          </div>

          {/* Sandbox Calculation Result Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] space-y-2.5">
            <div className="text-xs uppercase font-bold text-[var(--text-secondary)] font-sans">
              Calculated Total Score
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--accent-primary)] font-numbers">
              {sandboxResult.success && sandboxResult.data ? sandboxResult.data.totalPoints : 0}{' '}
              <span className="text-sm font-normal text-[var(--text-muted)] font-sans">PTS</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs sm:text-sm">
              <div>
                <span className="text-xs text-[var(--text-secondary)] font-sans">Placement Pts:</span>
                <div className="font-bold text-[var(--text-primary)] mt-0.5 font-numbers">
                  +{sandboxResult.success && sandboxResult.data ? sandboxResult.data.placementPoints : 0}
                </div>
              </div>
              <div>
                <span className="text-xs text-[var(--text-secondary)] font-sans">Kill Pts:</span>
                <div className="font-bold text-[var(--status-danger)] mt-0.5 font-numbers">
                  +{sandboxResult.success && sandboxResult.data ? sandboxResult.data.killPoints : 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

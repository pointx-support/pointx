import React, { useState, useRef } from 'react';
import type { Tournament, TournamentType, TournamentStatus } from '../../types/tournament';
import type { ScoringPreset, PlacementRule } from '../../types/scoring';
import {
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING
} from '../../engine/scoringEngine';
import { SEED_TEAMS } from '../../store/tournamentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Trophy,
  Swords,
  Users2,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Calculator,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';

export interface TournamentWizardProps {
  onComplete: (tournament: Tournament) => void;
  onCancel: () => void;
}

export const TournamentWizard: React.FC<TournamentWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [tournamentLogoUrl, setTournamentLogoUrl] = useState('');
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType>('Battle Royale');
  const [status, setStatus] = useState<TournamentStatus>('Live');
  const [bannerUrl, setBannerUrl] = useState('');

  const tournamentLogoInputRef = useRef<HTMLInputElement | null>(null);
  const organizerLogoInputRef = useRef<HTMLInputElement | null>(null);

  const handleTournamentLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTournamentLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOrganizerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setOrganizerLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Structure State
  const [teamCount, setTeamCount] = useState<number>(12);
  const [matchCount, setMatchCount] = useState<number>(6);
  const [roundRobin, setRoundRobin] = useState<boolean>(false);
  const [groupsCount, setGroupsCount] = useState<number>(2);

  // Scoring Rules State (Changeable at tournament creation)
  const [scoringPreset, setScoringPreset] = useState<ScoringPreset>(DEFAULT_FREE_FIRE_SCORING);
  const [activePresetTemplateId, setActivePresetTemplateId] = useState<string>('official');

  // Teams Setup State
  const [teamSetupMode, setTeamSetupMode] = useState<'sample' | 'empty'>('sample');

  // Inline Validation Error
  const [titleError, setTitleError] = useState('');

  const handleNext = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        setTitleError('Tournament title is required');
        return;
      }
      if (title.trim().length < 3) {
        setTitleError('Title must be at least 3 characters long');
        return;
      }
      setTitleError('');
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    } else {
      onCancel();
    }
  };

  // Scoring Rule Handlers
  const handleSelectPresetTemplate = (templateKey: 'official' | 'aggressive' | 'survival') => {
    setActivePresetTemplateId(templateKey);
    if (templateKey === 'official') {
      setScoringPreset({ ...DEFAULT_FREE_FIRE_SCORING });
    } else if (templateKey === 'aggressive') {
      setScoringPreset({ ...FREE_FIRE_AGGRESSIVE_SCORING });
    } else if (templateKey === 'survival') {
      setScoringPreset({ ...FREE_FIRE_SURVIVAL_BOOST_SCORING });
    }
  };

  const handlePlacementPointsChange = (place: number, newPoints: number) => {
    setActivePresetTemplateId('custom');
    const safePoints = Math.max(0, isNaN(newPoints) ? 0 : newPoints);
    setScoringPreset((prev) => {
      const updatedTable: PlacementRule[] = prev.placementTable.map((rule) =>
        rule.place === place ? { ...rule, points: safePoints } : rule
      );
      return {
        ...prev,
        isOfficial: false,
        name: prev.name.includes('Custom') ? prev.name : 'Custom Free Fire Rules',
        placementTable: updatedTable
      };
    });
  };

  const handleKillPointsChange = (multiplier: number) => {
    setActivePresetTemplateId('custom');
    const safeKills = Math.max(0, isNaN(multiplier) ? 0 : multiplier);
    setScoringPreset((prev) => ({
      ...prev,
      isOfficial: false,
      name: prev.name.includes('Custom') ? prev.name : 'Custom Free Fire Rules',
      killPoints: safeKills
    }));
  };

  const handleBooyahBonusChange = (bonus: number) => {
    setActivePresetTemplateId('custom');
    const safeBonus = Math.max(0, isNaN(bonus) ? 0 : bonus);
    setScoringPreset((prev) => ({
      ...prev,
      isOfficial: false,
      name: prev.name.includes('Custom') ? prev.name : 'Custom Free Fire Rules',
      booyahBonusPoints: safeBonus
    }));
  };

  const handleResetToOfficialFF = () => {
    setActivePresetTemplateId('official');
    setScoringPreset({ ...DEFAULT_FREE_FIRE_SCORING });
  };

  const handleApplyLinearRules = () => {
    setActivePresetTemplateId('custom');
    setScoringPreset((prev) => ({
      ...prev,
      isOfficial: false,
      name: 'Linear Placement Rules (12 to 1)',
      placementTable: Array.from({ length: 12 }, (_, i) => ({
        place: i + 1,
        points: 12 - i
      }))
    }));
  };

  const handleApplyTopHeavyRules = () => {
    setActivePresetTemplateId('custom');
    setScoringPreset((prev) => ({
      ...prev,
      isOfficial: false,
      name: 'Top Heavy Rules (20-14-10-8-6-4-2-1-0-0-0-0)',
      placementTable: [
        { place: 1, points: 20 },
        { place: 2, points: 14 },
        { place: 3, points: 10 },
        { place: 4, points: 8 },
        { place: 5, points: 6 },
        { place: 6, points: 4 },
        { place: 7, points: 2 },
        { place: 8, points: 1 },
        { place: 9, points: 0 },
        { place: 10, points: 0 },
        { place: 11, points: 0 },
        { place: 12, points: 0 }
      ]
    }));
  };

  const handleCreate = () => {
    const newId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Build teams
    const initialTeams =
      teamSetupMode === 'sample'
        ? SEED_TEAMS.slice(0, teamCount).map((t, idx) => ({
            ...t,
            id: `team-${newId}-${idx + 1}`,
            slotNumber: idx + 1
          }))
        : Array.from({ length: teamCount }, (_, i) => ({
            id: `team-${newId}-${i + 1}`,
            name: `Slot #${i + 1} Team`,
            tag: `S${i + 1}`,
            slotNumber: i + 1,
            players: []
          }));

    const newTournament: Tournament = {
      id: newId,
      title: title.trim(),
      organizer: organizer.trim() || 'PointX Arena',
      logoUrl: tournamentLogoUrl.trim() || undefined,
      organizerLogoUrl: organizerLogoUrl.trim() || undefined,
      game: 'Free Fire',
      description: description.trim(),
      tournamentType,
      status,
      bannerUrl: bannerUrl.trim() || undefined,
      structure: {
        teamCount,
        matchCount,
        roundRobin,
        groupsCount: roundRobin ? groupsCount : undefined,
        slotsPerMatch: 12
      },
      scoringPreset: scoringPreset,
      teams: initialTeams,
      matches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onComplete(newTournament);
  };

  const STEPS = [
    { num: 1, label: 'Basic Info', icon: Trophy, desc: 'Title & Branding' },
    { num: 2, label: 'Structure', icon: Swords, desc: 'Teams & Matches' },
    { num: 3, label: 'Scoring', icon: Sliders, desc: 'Custom FF Rules' },
    { num: 4, label: 'Teams', icon: Users2, desc: 'Slots & Rosters' },
    { num: 5, label: 'Review', icon: CheckCircle2, desc: 'Final Confirmation' }
  ];

  // Live sandbox calculation for sample 1st place with 6 kills
  const sample1stPlacementPts = scoringPreset.placementTable.find((r) => r.place === 1)?.points || 0;
  const sampleKills = 6;
  const sampleKillPts = sampleKills * scoringPreset.killPoints;
  const sampleBonus = scoringPreset.booyahBonusPoints || 0;
  const sampleTotal = sample1stPlacementPts + sampleKillPts + sampleBonus;

  return (
    <div className="max-w-5xl 2xl:max-w-6xl mx-auto space-y-5 font-sans">
      {/* Wizard Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm active:shadow-inner transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight font-display">
              Create Tournament
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
              Step {currentStep} of 5: <span className="text-[var(--accent-primary)] font-bold">{STEPS[currentStep - 1].label}</span>
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Progressive Step Navigation Bar */}
      <div className="grid grid-cols-5 gap-2 p-2 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]">
        {STEPS.map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div
              key={step.num}
              className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-primary)] shadow-sm font-bold'
                  : isDone
                  ? 'text-[var(--status-live)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono font-black text-xs ${
                  isCurrent
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-sm'
                    : isDone
                    ? 'bg-[var(--status-live)]/20 text-[var(--status-live)] border border-[var(--status-live)]/30'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                }`}
              >
                {isDone ? '✓' : step.num}
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate font-sans">{step.label}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate font-mono">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Step Form Body */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 min-h-[380px] flex flex-col justify-between shadow-[var(--shadow-raised)]">
        <div>
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">
                  Step 01: Tournament Identity & Details
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
                  Set the tournament name, organizer branding, and competition mode.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <Input
                    label="Tournament Title *"
                    placeholder="Enter tournament title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) setTitleError('');
                    }}
                    error={titleError}
                    required
                  />

                  <Input
                    label="Organizer / Host Name"
                    placeholder="Enter host name"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                  />

                  <Input
                    label="Description / Notes"
                    placeholder="Enter description or notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  {/* TOURNAMENT LOGO & ORGANIZER LOGO UPLOADS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* 1. Tournament Logo */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2.5 shadow-[var(--shadow-inset)]">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                        Tournament Logo
                      </label>

                      <div className="flex items-center gap-3">
                        {tournamentLogoUrl ? (
                          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black/40 border border-[var(--border-subtle)] shrink-0 flex items-center justify-center">
                            <img
                              src={tournamentLogoUrl}
                              alt="Tournament Logo"
                              className="h-full w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setTournamentLogoUrl('')}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-white hover:text-[var(--status-danger)] transition-colors"
                              title="Remove logo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] shrink-0 flex items-center justify-center text-[var(--text-muted)]">
                            <Trophy className="h-5 w-5 opacity-40" />
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => tournamentLogoInputRef.current?.click()}
                            leftIcon={<Upload className="h-3 w-3" />}
                            className="w-full"
                          >
                            Upload File
                          </Button>
                          <input
                            ref={tournamentLogoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleTournamentLogoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste Logo URL"
                        value={tournamentLogoUrl}
                        onChange={(e) => setTournamentLogoUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                      />
                    </div>

                    {/* 2. Organizer Logo */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2.5 shadow-[var(--shadow-inset)]">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                        Organizer Logo
                      </label>

                      <div className="flex items-center gap-3">
                        {organizerLogoUrl ? (
                          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black/40 border border-[var(--border-subtle)] shrink-0 flex items-center justify-center">
                            <img
                              src={organizerLogoUrl}
                              alt="Organizer Logo"
                              className="h-full w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setOrganizerLogoUrl('')}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-white hover:text-[var(--status-danger)] transition-colors"
                              title="Remove logo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] shrink-0 flex items-center justify-center text-[var(--text-muted)]">
                            <ImageIcon className="h-5 w-5 opacity-40" />
                          </div>
                        )}

                        <div className="flex-1 space-y-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => organizerLogoInputRef.current?.click()}
                            leftIcon={<Upload className="h-3 w-3" />}
                            className="w-full"
                          >
                            Upload File
                          </Button>
                          <input
                            ref={organizerLogoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleOrganizerLogoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste Organiser Logo URL"
                        value={organizerLogoUrl}
                        onChange={(e) => setOrganizerLogoUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                      />
                    </div>
                  </div>

                  <Input
                    label="Banner / Cover URL (Optional)"
                    placeholder="Enter banner image URL"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-mono">
                      Tournament Format Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['Battle Royale', 'Scrim', 'League', 'Custom'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTournamentType(type)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            tournamentType === type
                              ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm font-bold'
                              : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-[var(--shadow-inset)]'
                          }`}
                        >
                          <div className="text-sm font-bold font-sans">{type}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                            {type === 'Battle Royale' ? 'Standard 12-Slot Lobby' : `${type} Mode`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-mono">
                      Initial Status
                    </label>
                    <div className="flex items-center gap-2">
                      {(['Live', 'Upcoming', 'Draft'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatus(st)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            status === st
                              ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-sm'
                              : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-[var(--shadow-inset)]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Structure */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">
                  Step 02: Tournament Structure & Schedule
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
                  Configure the number of participating teams, match counts, and round robin options.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4 font-mono">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-sans">
                      Number of Teams
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[12, 18, 24, 48].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setTeamCount(count)}
                          className={`py-3 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer font-numbers ${
                            teamCount === count
                              ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] font-black shadow-md'
                              : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-[var(--shadow-inset)]'
                          }`}
                        >
                          {count} Teams
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-sans">
                      Number of Matches
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[3, 4, 6, 8].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setMatchCount(count)}
                          className={`py-3 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer font-numbers ${
                            matchCount === count
                              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] border-[var(--accent-primary)] shadow-sm'
                              : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-[var(--shadow-inset)]'
                          }`}
                        >
                          {count} Matches
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-5 space-y-3.5 shadow-[var(--shadow-inset)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)] font-sans">Round Robin Group Format</div>
                        <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-sans">
                          Split teams into rotating groups for league fixtures.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roundRobin}
                          onChange={(e) => setRoundRobin(e.target.checked)}
                          className="rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] h-5 w-5"
                        />
                      </label>
                    </div>

                    {roundRobin && (
                      <div className="pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between font-mono">
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold">Number of Groups:</span>
                        <div className="flex items-center gap-2">
                          {[2, 3, 4].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGroupsCount(g)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                groupsCount === g
                                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-black'
                                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                              }`}
                            >
                              {g} Groups
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Scoring Rules Customizer */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[var(--accent-primary)]" />
                    Step 03: Free Fire Scoring Rules & Multipliers
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
                    Select a preset or customize placement points, kill multipliers, and Booyah bonuses.
                  </p>
                </div>

                <Badge variant={scoringPreset.isOfficial ? 'official' : 'custom'} size="sm">
                  {scoringPreset.isOfficial ? 'Official FF Rules' : 'Custom Rules Active'}
                </Badge>
              </div>

              {/* Preset Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectPresetTemplate('official')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    activePresetTemplateId === 'official'
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-sans">Official Esports</span>
                    <span className="text-xs font-mono text-[var(--status-live)] font-bold">12-9-8</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                    1 Pt/Kill • 0 Booyah Bonus
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPresetTemplate('aggressive')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    activePresetTemplateId === 'aggressive'
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-sans">Aggressive Scrims</span>
                    <span className="text-xs font-mono text-[var(--status-danger)] font-bold">2 Pts/Kill</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                    12-9-8 • Kill Heavy Focus
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPresetTemplate('survival')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    activePresetTemplateId === 'survival'
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-sans">Survival Champion</span>
                    <span className="text-xs font-mono text-[var(--accent-gold)] font-bold">+3 Booyah</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                    15-12-10 • Top Heavy Bonus
                  </div>
                </button>
              </div>

              {/* Kill Multiplier & Booyah Bonus Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] space-y-2.5 shadow-[var(--shadow-inset)]">
                  <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                    Kill Points Multiplier
                  </label>
                  <div className="flex items-center gap-2.5 font-mono">
                    {[1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleKillPointsChange(val)}
                        className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                          scoringPreset.killPoints === val
                            ? 'bg-[var(--status-danger)] text-white border-[var(--status-danger)] shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {val} Pt{val > 1 ? 's' : ''}/Kill
                      </button>
                    ))}
                    <div className="w-20">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={scoringPreset.killPoints}
                        onChange={(e) => handleKillPointsChange(parseInt(e.target.value) || 0)}
                        className="w-full text-center py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] space-y-2.5 shadow-[var(--shadow-inset)]">
                  <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                    Booyah (#1 Place) Bonus Points
                  </label>
                  <div className="flex items-center gap-2.5 font-mono">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleBooyahBonusChange(val)}
                        className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                          scoringPreset.booyahBonusPoints === val
                            ? 'bg-[var(--accent-gold)] text-black font-black border-[var(--accent-gold)] shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        +{val} Pts
                      </button>
                    ))}
                    <div className="w-20">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={scoringPreset.booyahBonusPoints || 0}
                        onChange={(e) => handleBooyahBonusChange(parseInt(e.target.value) || 0)}
                        className="w-full text-center py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Placement Points Table Matrix */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4 sm:p-5 space-y-3.5 shadow-[var(--shadow-inset)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)] font-display">
                      Placement Points Table (Ranks 1 to 12)
                    </span>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Click into any rank box to edit its placement points.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={handleResetToOfficialFF}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs font-bold"
                    >
                      Reset FF Official
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyTopHeavyRules}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs font-bold"
                    >
                      Top Heavy
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyLinearRules}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs font-bold"
                    >
                      Linear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 font-mono">
                  {scoringPreset.placementTable.map((rule) => {
                    const isBooyah = rule.place === 1;

                    return (
                      <div
                        key={rule.place}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                          isBooyah
                            ? 'bg-[var(--bg-surface)] border-[var(--accent-gold)] shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-xs text-[var(--text-secondary)] font-bold px-1">
                          <span>#{rule.place}</span>
                          {isBooyah && <span className="text-[var(--accent-gold)] text-xs">👑 1st</span>}
                        </div>
                        <div className="mt-1.5 flex items-center justify-center gap-1 w-full">
                          <span className="text-xs text-[var(--text-muted)] font-bold">+</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rule.points}
                            onChange={(e) =>
                              handlePlacementPointsChange(rule.place, parseInt(e.target.value) || 0)
                            }
                            className="w-14 text-center py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] font-bold text-sm text-[var(--accent-primary)] font-numbers focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                          <span className="text-xs text-[var(--text-muted)]">PTS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Sandbox Calculation Preview Strip */}
                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm font-mono">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Calculator className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span className="font-semibold">Live Sample (1st Place + 6 Kills):</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-primary)]">
                    <span>
                      {sample1stPlacementPts} Pts <span className="text-[var(--text-muted)]">(Place)</span> + {sampleKillPts} Pts{' '}
                      <span className="text-[var(--text-muted)]">({sampleKills} × {scoringPreset.killPoints} Kill)</span>
                      {sampleBonus > 0 ? ` + ${sampleBonus} Pts (Bonus)` : ''} =
                    </span>
                    <strong className="text-[var(--accent-primary)] font-numbers text-base font-black">
                      {sampleTotal} Total PTS
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Teams */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">
                  Step 04: Initial Team Slot Allocation
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
                  Choose how you want to populate the initial {teamCount} team slots.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTeamSetupMode('sample')}
                  className={`p-6 rounded-2xl border text-left transition-all cursor-pointer ${
                    teamSetupMode === 'sample'
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] shadow-md'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-[var(--shadow-inset)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-6 w-6 text-[var(--accent-primary)]" />
                    <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base font-display">Populate with Verified FF Pro Teams</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed font-sans">
                    Auto-populates slots with verified pro teams (Total Gaming, Team Elite, Orangutan, GodLike, Blind, etc.) with player rosters.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTeamSetupMode('empty')}
                  className={`p-6 rounded-2xl border text-left transition-all cursor-pointer ${
                    teamSetupMode === 'empty'
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] shadow-md'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-[var(--shadow-inset)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users2 className="h-6 w-6 text-[var(--accent-primary)]" />
                    <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base font-display">Generate Blank Slots (Slot 1 to {teamCount})</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed font-sans">
                    Creates empty placeholder slots so you can enter team names and player rosters manually later.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Initialize */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-display">
                  Step 05: Review & Initialize Tournament
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-mono">
                  Confirm the settings below to launch the tournament workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-6 sm:p-7 space-y-5 shadow-[var(--shadow-inset)]">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-4">
                    {tournamentLogoUrl ? (
                      <img src={tournamentLogoUrl} alt="Tournament Logo" className="h-14 w-14 object-contain rounded-2xl bg-black/30 border border-[var(--border-subtle)] p-1 shrink-0" />
                    ) : organizerLogoUrl ? (
                      <img src={organizerLogoUrl} alt="Organizer Logo" className="h-14 w-14 object-contain rounded-2xl bg-black/30 border border-[var(--border-subtle)] p-1 shrink-0" />
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="live" size="sm">
                          {status}
                        </Badge>
                        {organizerLogoUrl && tournamentLogoUrl && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-mono">
                            <span>Host:</span>
                            <img src={organizerLogoUrl} alt="Organizer Logo" className="h-4 w-4 object-contain" />
                          </div>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1.5 font-display">{title}</h2>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
                        Organized by <strong className="text-[var(--text-primary)] font-sans">{organizer || 'PointX Arena'}</strong> • {tournamentType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                    <div className="text-xs text-[var(--text-secondary)] uppercase font-bold font-sans">Teams</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)] mt-0.5 font-numbers">{teamCount}</div>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                    <div className="text-xs text-[var(--text-secondary)] uppercase font-bold font-sans">Matches</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)] mt-0.5 font-numbers">{matchCount}</div>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                    <div className="text-xs text-[var(--text-secondary)] uppercase font-bold font-sans">Scoring</div>
                    <div className="text-sm font-bold text-[var(--accent-primary)] mt-1 font-sans truncate px-1">
                      {scoringPreset.name}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                    <div className="text-xs text-[var(--text-secondary)] uppercase font-bold font-sans">Kill Multiplier</div>
                    <div className="text-sm font-bold text-[var(--status-danger)] mt-1 font-sans font-numbers">
                      {scoringPreset.killPoints} Pts/Kill
                      {scoringPreset.booyahBonusPoints ? ` (+${scoringPreset.booyahBonusPoints} Bonus)` : ''}
                    </div>
                  </div>
                </div>

                {/* Scoring Rules Preview in Review */}
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                    <span className="text-[var(--text-secondary)] font-bold">Configured Placement Points:</span>
                    <span className="text-[var(--accent-primary)] font-bold font-numbers">
                      #1: +{sample1stPlacementPts} Pts • #2: +{scoringPreset.placementTable.find((r) => r.place === 2)?.points || 0} Pts • #3: +{scoringPreset.placementTable.find((r) => r.place === 3)?.points || 0} Pts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-mono text-[var(--text-secondary)]">
                    {scoringPreset.placementTable.map((r) => (
                      <span key={r.place} className="bg-[var(--bg-surface-inset)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                        #{r.place}: <strong className="text-[var(--text-primary)]">+{r.points}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleBack}>
            {currentStep === 1 ? 'Cancel' : 'Previous Step'}
          </Button>

          {currentStep < 5 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              variant="booyah"
              size="md"
              onClick={handleCreate}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Initialize & Open Workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

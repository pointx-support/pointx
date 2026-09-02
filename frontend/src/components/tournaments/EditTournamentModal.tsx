import React, { useState } from 'react';
import type { Tournament, TournamentStatus, TournamentType } from '../../types/tournament';
import type { ScoringPreset, PlacementRule } from '../../types/scoring';
import {
  DEFAULT_FREE_FIRE_SCORING,
  FREE_FIRE_AGGRESSIVE_SCORING,
  FREE_FIRE_SURVIVAL_BOOST_SCORING
} from '../../engine/scoringEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import {
  Save,
  Trophy,
  Sliders,
  Swords,
  ImageIcon
} from 'lucide-react';

export interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onSave: (tournamentId: string, updatedFields: Partial<Tournament>) => void;
}

type TabKey = 'general' | 'structure' | 'scoring' | 'branding';

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // General & Identity
  const [title, setTitle] = useState(tournament.title);
  const [organizer, setOrganizer] = useState(tournament.organizer);
  const [description, setDescription] = useState(tournament.description || '');
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [tournamentType, setTournamentType] = useState<TournamentType>(tournament.tournamentType || 'Battle Royale');
  const [game] = useState(tournament.game || 'Free Fire');

  // Branding
  const [logoUrl, setLogoUrl] = useState<string | undefined>(tournament.logoUrl);
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState<string | undefined>(tournament.organizerLogoUrl);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(tournament.bannerUrl);

  // Structure
  const [teamCount, setTeamCount] = useState<number>(tournament.structure?.teamCount || tournament.teams.length || 12);
  const [matchCount, setMatchCount] = useState<number>(tournament.structure?.matchCount || 6);
  const [roundRobin, setRoundRobin] = useState<boolean>(tournament.structure?.roundRobin || false);
  const [groupsCount, setGroupsCount] = useState<number>(tournament.structure?.groupsCount || 2);

  // Scoring Rules
  const [scoringPreset, setScoringPreset] = useState<ScoringPreset>(
    tournament.scoringPreset || DEFAULT_FREE_FIRE_SCORING
  );
  const [activePresetTemplateId, setActivePresetTemplateId] = useState<string>('current');

  const handleSelectPreset = (templateKey: 'official' | 'aggressive' | 'survival' | 'linear' | 'topheavy') => {
    setActivePresetTemplateId(templateKey);
    if (templateKey === 'official') {
      setScoringPreset({ ...DEFAULT_FREE_FIRE_SCORING });
    } else if (templateKey === 'aggressive') {
      setScoringPreset({ ...FREE_FIRE_AGGRESSIVE_SCORING });
    } else if (templateKey === 'survival') {
      setScoringPreset({ ...FREE_FIRE_SURVIVAL_BOOST_SCORING });
    } else if (templateKey === 'linear') {
      setScoringPreset({
        ...DEFAULT_FREE_FIRE_SCORING,
        name: 'Linear Placement Rules (12 to 1)',
        placementTable: Array.from({ length: 12 }, (_, i) => ({
          place: i + 1,
          points: 12 - i
        }))
      });
    } else if (templateKey === 'topheavy') {
      setScoringPreset({
        ...DEFAULT_FREE_FIRE_SCORING,
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
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(tournament.id, {
      title: title.trim(),
      organizer: organizer.trim() || 'PointX Arena',
      description: description.trim(),
      status,
      tournamentType,
      game,
      logoUrl: logoUrl?.trim() || undefined,
      organizerLogoUrl: organizerLogoUrl?.trim() || undefined,
      bannerUrl: bannerUrl?.trim() || undefined,
      structure: {
        teamCount,
        matchCount,
        roundRobin,
        groupsCount: roundRobin ? groupsCount : undefined,
        slotsPerMatch: 12
      },
      scoringPreset,
      updatedAt: new Date().toISOString()
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Tournament Configuration"
      description="Modify tournament details, branding, structure, and official scoring rules."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
          {[
            { id: 'general', label: 'Basic Info', icon: Trophy },
            { id: 'branding', label: 'Logos & Artwork', icon: ImageIcon },
            { id: 'structure', label: 'Matches & Slots', icon: Swords },
            { id: 'scoring', label: 'Scoring Rules', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-black shadow-sm font-display'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'general' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <Input
                label="Tournament Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Fire Champions Cup 2026"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Organizer / Host Name"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="e.g. PointX Arena"
                />

                <Input
                  label="Description / Subtitle"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Official Grand Finals"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-mono">
                    Status
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['Live', 'Upcoming', 'Draft', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          status === st
                            ? 'bg-[var(--accent-primary)] text-black font-black border-[var(--accent-primary)] shadow-sm'
                            : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-mono">
                    Tournament Type
                  </label>
                  <select
                    value={tournamentType}
                    onChange={(e) => setTournamentType(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                  >
                    <option value="Battle Royale">Battle Royale (12 Teams)</option>
                    <option value="Scrim">Daily Scrims</option>
                    <option value="League">Multi-Day League</option>
                    <option value="Custom">Custom Tournament</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING & LOGOS */}
          {activeTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  label="Tournament / League Logo"
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val)}
                  helperText="Event crest displayed on live standings, stream overlays, and 4K posters."
                />

                <ImageUpload
                  label="Organizer / Host Logo"
                  value={organizerLogoUrl}
                  onChange={(val) => setOrganizerLogoUrl(val)}
                  helperText="Host organisation badge displayed across tournament assets."
                />
              </div>

              <ImageUpload
                label="Banner / Cover Artwork"
                value={bannerUrl}
                onChange={(val) => setBannerUrl(val)}
                helperText="Wide tournament header banner (16:9 or 21:9)."
              />
            </div>
          )}

          {/* TAB 3: STRUCTURE & MATCHES */}
          {activeTab === 'structure' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Total Number of Matches"
                  type="number"
                  min={1}
                  max={50}
                  value={matchCount}
                  onChange={(e) => setMatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                  helperText="Total games scheduled in this tournament stage."
                />

                <Input
                  label="Total Teams / Slots"
                  type="number"
                  min={2}
                  max={48}
                  value={teamCount}
                  onChange={(e) => setTeamCount(Math.max(2, parseInt(e.target.value) || 12))}
                  helperText="Default standard Free Fire match accommodates 12 team slots."
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">Group Stage / Multi-Group Scrims</div>
                    <div className="text-[11px] text-[var(--text-muted)]">Split teams into multiple groups with round robin rotation.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={roundRobin}
                    onChange={(e) => setRoundRobin(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-400 cursor-pointer"
                  />
                </div>

                {roundRobin && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <Input
                      label="Number of Groups"
                      type="number"
                      min={2}
                      max={8}
                      value={groupsCount}
                      onChange={(e) => setGroupsCount(Math.max(2, parseInt(e.target.value) || 2))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SCORING RULES */}
          {activeTab === 'scoring' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Presets Quick Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-mono">
                  Preset Rules Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('official')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activePresetTemplateId === 'official'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-bold text-[var(--accent-primary)] font-mono">Official FFWS 2026</div>
                    <div className="text-[10px] text-[var(--text-muted)]">12-9-8-7-6-5-4-3-2-1-0-0</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('aggressive')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activePresetTemplateId === 'aggressive'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-bold text-rose-400 font-mono">Kill Heavy (2 pts/kill)</div>
                    <div className="text-[10px] text-[var(--text-muted)]">High Action Aggressive</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('survival')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activePresetTemplateId === 'survival'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-bold text-emerald-400 font-mono">Survival Boost</div>
                    <div className="text-[10px] text-[var(--text-muted)]">15-12-10-8 Placement</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('linear')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activePresetTemplateId === 'linear'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-bold text-cyan-400 font-mono">Linear (12 to 1)</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Even placement curve</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset('topheavy')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      activePresetTemplateId === 'topheavy'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-bold text-purple-400 font-mono">Top Heavy (20 Booyah)</div>
                    <div className="text-[10px] text-[var(--text-muted)]">20-14-10-8-6-4-2-1</div>
                  </button>

                  <div className="p-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-xs flex items-center justify-center text-[var(--text-muted)] font-mono text-[11px]">
                    {activePresetTemplateId === 'custom' ? 'Custom Rules Active' : 'Select a preset or edit below'}
                  </div>
                </div>
              </div>

              {/* Kill Multiplier & Booyah Bonus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                <Input
                  label="Points Per Kill / Elimination"
                  type="number"
                  min={0}
                  max={20}
                  value={scoringPreset.killPoints}
                  onChange={(e) => handleKillPointsChange(parseFloat(e.target.value) || 0)}
                  helperText="Default Free Fire standard is 1 pt per kill."
                />

                <Input
                  label="Booyah Bonus Points"
                  type="number"
                  min={0}
                  max={20}
                  value={scoringPreset.booyahBonusPoints || 0}
                  onChange={(e) => handleBooyahBonusChange(parseFloat(e.target.value) || 0)}
                  helperText="Extra bonus awarded to #1 winner (in addition to 1st place points)."
                />
              </div>

              {/* Placement Points Grid (1st to 12th) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-mono">
                  Placement Points Matrix (Places 1 to 12)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((place) => {
                    const currentPts = scoringPreset.placementTable.find((r) => r.place === place)?.points || 0;
                    return (
                      <div key={place} className="p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-center">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] font-bold">
                          #{place} {place === 1 ? '👑' : ''}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={currentPts}
                          onChange={(e) => handlePlacementPointsChange(place, parseInt(e.target.value) || 0)}
                          className="w-full text-center bg-transparent border-b border-[var(--border-subtle)] focus:border-[var(--accent-primary)] font-bold text-xs text-[var(--text-primary)] font-mono outline-none py-1 mt-0.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save All Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

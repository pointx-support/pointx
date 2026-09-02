import React, { useState } from 'react';
import type { Tournament } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { MapPin, Swords, Users2 } from 'lucide-react';

export interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onMatchCreated?: (matchId: string) => void;
}

const MAP_OPTIONS = ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NexTerra', 'Solara'] as const;

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onMatchCreated
}) => {
  const { createMatch } = useTournamentStore();

  const nextMatchNum = tournament.matches.length + 1;
  const [customLabel, setCustomLabel] = useState<string>(`Match ${nextMatchNum.toString().padStart(2, '0')}`);
  const [mapName, setMapName] = useState<string>('Bermuda');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newMatch = createMatch(tournament.id, mapName, customLabel.trim() || undefined);
    onClose();
    if (onMatchCreated) {
      onMatchCreated(newMatch.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Match"
      description={`Add Match #${nextMatchNum} to "${tournament.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleCreate} className="flex flex-col font-sans space-y-4">
        {/* Match Label */}
        <div>
          <Input
            label="Match Display Label"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Enter match label"
            required
          />
        </div>

        {/* Map Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Battlefield Map
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MAP_OPTIONS.map((map) => {
              const isSelected = mapName === map;
              return (
                <button
                  key={map}
                  type="button"
                  onClick={() => setMapName(map)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-sm'
                      : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-xs truncate">
                    <MapPin className={`h-3 w-3 shrink-0 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                    <span className="truncate">{map}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Participating Teams Preview Banner */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-3 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 font-display">
              <Users2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Participating Teams ({tournament.teams.length})
            </span>
            <Badge variant="coral" size="sm">
              Auto-Loaded
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar pt-0.5 font-mono">
            {tournament.teams.map((t) => (
              <span
                key={t.id}
                className="text-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md text-[var(--text-secondary)] truncate max-w-[110px]"
              >
                #{t.slotNumber} {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Responsive Actions Footer */}
        <div className="pt-2 sm:pt-3 border-t border-[var(--border-subtle)] flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-2.5 shrink-0">
          <Button variant="outline" size="sm" type="button" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            leftIcon={<Swords className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Create & Enter Results
          </Button>
        </div>
      </form>
    </Modal>
  );
};
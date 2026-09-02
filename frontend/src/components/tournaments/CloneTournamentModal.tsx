import React, { useState } from 'react';
import type { Tournament, CloneTournamentOptions } from '../../types/tournament';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Copy } from 'lucide-react';

export interface CloneTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onClone: (sourceTournamentId: string, options: CloneTournamentOptions) => void;
}

export const CloneTournamentModal: React.FC<CloneTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onClone
}) => {
  const [newTitle, setNewTitle] = useState(`${tournament.title} (Clone)`);
  const [copyTeams, setCopyTeams] = useState(true);
  const [copyPlayers, setCopyPlayers] = useState(true);
  const [copyMatches, setCopyMatches] = useState(false);
  const [copyScoring, setCopyScoring] = useState(true);
  const [copySettings, setCopySettings] = useState(true);
  const [copyBranding, setCopyBranding] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onClone(tournament.id, {
      newTitle: newTitle.trim(),
      copyTeams,
      copyPlayers,
      copyMatches,
      copyScoring,
      copySettings,
      copyBranding
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Tournament"
      description={`Create a new tournament based on "${tournament.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <Input
          label="New Tournament Title *"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />

        {/* Options */}
        <div className="space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4 shadow-[var(--shadow-inset)]">
          <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-mono">
            Clone Configuration Options
          </span>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy Participating Teams ({tournament.teams.length} Squads)</span>
            <input
              type="checkbox"
              checked={copyTeams}
              onChange={(e) => setCopyTeams(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy Player Roster Lineups</span>
            <input
              type="checkbox"
              checked={copyPlayers}
              disabled={!copyTeams}
              onChange={(e) => setCopyPlayers(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] disabled:opacity-40"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy Scoring Matrix Rules</span>
            <input
              type="checkbox"
              checked={copyScoring}
              onChange={(e) => setCopyScoring(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy Match Structure ({tournament.matches.length} Matches)</span>
            <input
              type="checkbox"
              checked={copyMatches}
              onChange={(e) => setCopyMatches(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy General Settings & Format</span>
            <input
              type="checkbox"
              checked={copySettings}
              onChange={(e) => setCopySettings(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer py-1">
            <span className="text-[var(--text-primary)] font-semibold">Copy Branding & Logo URL</span>
            <input
              type="checkbox"
              checked={copyBranding}
              onChange={(e) => setCopyBranding(e.target.checked)}
              className="h-4 w-4 rounded bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Duplicate Tournament
          </Button>
        </div>
      </form>
    </Modal>
  );
};

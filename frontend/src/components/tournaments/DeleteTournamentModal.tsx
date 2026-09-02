import React from 'react';
import type { Tournament } from '../../types/tournament';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';

export interface DeleteTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onArchive: (tournamentId: string) => void;
  onPermanentDelete: (tournamentId: string) => void;
}

export const DeleteTournamentModal: React.FC<DeleteTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onArchive,
  onPermanentDelete
}) => {
  const isArchived = tournament.status === 'Archived';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isArchived ? 'Permanently Delete Tournament?' : 'Archive or Delete Tournament'}
      description={`Choose how you want to handle "${tournament.title}".`}
      maxWidth="md"
    >
      <div className="space-y-4 font-sans">
        <div className="p-4 rounded-2xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 text-xs text-[var(--status-danger)] flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[var(--status-danger)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[var(--text-primary)] font-display">Permanent Data Notice</strong>
            <p className="text-[var(--text-secondary)]">
              Deleting will permanently erase all team standings, score breakdowns, player match histories, and OBS broadcast tokens.
            </p>
          </div>
        </div>

        {/* Details snippet */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-3.5 text-xs font-mono space-y-1">
          <div className="font-bold text-[var(--text-primary)] font-sans">{tournament.title}</div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>{tournament.organizer}</span>
            <span className="text-[var(--accent-primary)] font-numbers font-bold">{tournament.teams.length} Teams • {tournament.matches.length} Matches</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>

          {!isArchived && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                onArchive(tournament.id);
                onClose();
              }}
              leftIcon={<Archive className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Archive Event
            </Button>
          )}

          <Button
            variant="danger"
            size="md"
            onClick={() => {
              onPermanentDelete(tournament.id);
              onClose();
            }}
            leftIcon={<Trash2 className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Permanently Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

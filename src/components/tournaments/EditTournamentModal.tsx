import React, { useState } from 'react';
import type { Tournament, TournamentStatus, TournamentType } from '../../types/tournament';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { Save } from 'lucide-react';

export interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onSave: (tournamentId: string, updatedFields: Partial<Tournament>) => void;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSave
}) => {
  const [title, setTitle] = useState(tournament.title);
  const [organizer, setOrganizer] = useState(tournament.organizer);
  const [description, setDescription] = useState(tournament.description || '');
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [tournamentType, setTournamentType] = useState<TournamentType>(tournament.tournamentType || 'Battle Royale');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(tournament.logoUrl);
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState<string | undefined>(tournament.organizerLogoUrl);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(tournament.bannerUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(tournament.id, {
      title: title.trim(),
      organizer: organizer.trim() || 'Strikz Arena',
      description: description.trim(),
      status,
      tournamentType,
      logoUrl: logoUrl?.trim() || undefined,
      organizerLogoUrl: organizerLogoUrl?.trim() || undefined,
      bannerUrl: bannerUrl?.trim() || undefined,
      updatedAt: new Date().toISOString()
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Tournament Settings"
      description="Update tournament identity, organizer name, logos, and active status."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Tournament Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Organizer / Host"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
          />

          <Input
            label="Description / Subtitle"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 font-mono">
              Status
            </label>
            <div className="flex items-center gap-1.5">
              {(['Live', 'Upcoming', 'Draft', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    status === st
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold shadow-sm border-[var(--accent-primary)]'
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
              <option value="Battle Royale">Battle Royale</option>
              <option value="Scrim">Scrims</option>
              <option value="League">League</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
          <ImageUpload
            label="Tournament / League Logo"
            value={logoUrl}
            onChange={(val) => setLogoUrl(val)}
            helperText="Event emblem displayed on posters and stream overlays."
          />

          <ImageUpload
            label="Organizer / Host Logo"
            value={organizerLogoUrl}
            onChange={(val) => setOrganizerLogoUrl(val)}
            helperText="Host organisation crest displayed on graphics."
          />
        </div>

        <ImageUpload
          label="Banner / Cover Artwork"
          value={bannerUrl}
          onChange={(val) => setBannerUrl(val)}
          helperText="Wide tournament header banner."
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

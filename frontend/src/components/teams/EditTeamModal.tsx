import React, { useState } from 'react';
import type { Team, Player } from '../../types/tournament';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { Plus, Trash2, Shield, Users } from 'lucide-react';

export interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onSave: (teamId: string, updatedFields: Partial<Team>) => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  onSave
}) => {
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(team.logoUrl);
  const [players, setPlayers] = useState<Player[]>(team.players || []);

  const handleAddPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}-${prev.length + 1}`,
        name: `Player ${prev.length + 1}`,
        inGameId: '',
        role: 'Rusher'
      }
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePlayerChange = (id: string, field: keyof Player, value: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;

    onSave(team.id, {
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      logoUrl: logoUrl?.trim() || undefined,
      players
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Slot #${team.slotNumber} Squad`}
      description="Update squad name, abbreviation tag, and active roster lineup."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Team Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Tag *"
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>

        <ImageUpload
          label="Team / Squad Logo"
          value={logoUrl}
          onChange={(val) => setLogoUrl(val)}
          helperText="Upload official team logo for standings graphics and live overlays."
        />

        {/* Players Section */}
        <div className="space-y-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5 font-display">
              <Users className="h-4 w-4 text-[var(--accent-primary)]" />
              Active Squad Lineup ({players.length} Players)
            </span>
            <Button
              variant="outline"
              size="xs"
              type="button"
              onClick={handleAddPlayer}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Add Player
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[10px] font-bold text-[var(--accent-primary)] font-numbers border border-[var(--border-subtle)]">
                  {idx + 1}
                </div>

                <input
                  type="text"
                  placeholder="Player Name"
                  value={p.name}
                  onChange={(e) => handlePlayerChange(p.id, 'name', e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />

                <input
                  type="text"
                  placeholder="IGN"
                  value={p.inGameId || ''}
                  onChange={(e) => handlePlayerChange(p.id, 'inGameId', e.target.value)}
                  className="w-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                />

                <select
                  value={p.role || 'Rusher'}
                  onChange={(e) => handlePlayerChange(p.id, 'role', e.target.value as any)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer font-sans"
                >
                  <option value="Rusher">Rusher</option>
                  <option value="Sniper">Sniper</option>
                  <option value="IGL">IGL</option>
                  <option value="Support">Support</option>
                  <option value="Sub">Sub</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemovePlayer(p.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-colors cursor-pointer"
                  title="Remove Player"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
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
            leftIcon={<Shield className="h-4 w-4" />}
          >
            Save Squad
          </Button>
        </div>
      </form>
    </Modal>
  );
};

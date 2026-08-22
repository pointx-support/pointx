import React, { useState } from 'react';
import type { GlobalTeam, GlobalPlayer } from '../../types/team';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { Plus, Trash2, Shield, Users } from 'lucide-react';

export interface CreateGlobalTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (team: Omit<GlobalTeam, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface PlayerInput {
  name: string;
  inGameId: string;
  role: 'Rusher' | 'Sniper' | 'IGL' | 'Support' | 'All-Rounder';
}

export const CreateGlobalTeamModal: React.FC<CreateGlobalTeamModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [players, setPlayers] = useState<PlayerInput[]>([
    { name: '', inGameId: '', role: 'Rusher' },
    { name: '', inGameId: '', role: 'Sniper' },
    { name: '', inGameId: '', role: 'IGL' },
    { name: '', inGameId: '', role: 'Support' }
  ]);

  const handleAddPlayer = () => {
    setPlayers((prev) => [...prev, { name: '', inGameId: '', role: 'Rusher' }]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (
    index: number,
    field: keyof PlayerInput,
    value: string
  ) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;

    const now = new Date().toISOString();
    const validPlayers: GlobalPlayer[] = players
      .filter((p) => p.name.trim().length > 0)
      .map((p, idx) => ({
        ...p,
        id: `gp-${Date.now()}-${idx + 1}`,
        createdAt: now,
        updatedAt: now
      }));

    onSave({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      status: 'Active',
      logoUrl: logoUrl?.trim() || undefined,
      players: validPlayers
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Pro Squad to Database"
      description="Create a global team template that can be quickly autofilled into any tournament."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Squad Name *"
              placeholder="Enter squad name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Team Tag *"
            placeholder="Enter tag"
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>

        <ImageUpload
          label="Team Logo"
          value={logoUrl}
          onChange={(val) => setLogoUrl(val)}
          helperText="Upload official team logo for global team database."
        />

        {/* Players Lineup */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5 font-display">
              <Users className="h-4 w-4 text-[var(--accent-primary)]" />
              Squad Lineup Line ({players.length} Players)
            </span>
            <Button
              variant="outline"
              size="xs"
              type="button"
              onClick={handleAddPlayer}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Add Member
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-raised)] text-[10px] font-bold text-[var(--accent-primary)] font-numbers">
                  {idx + 1}
                </div>

                <input
                  type="text"
                  placeholder="Player Name"
                  value={p.name}
                  onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />

                <input
                  type="text"
                  placeholder="In-Game UID / IGN"
                  value={p.inGameId}
                  onChange={(e) => handlePlayerChange(idx, 'inGameId', e.target.value)}
                  className="w-28 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                />

                <select
                  value={p.role}
                  onChange={(e) => handlePlayerChange(idx, 'role', e.target.value as any)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                >
                  <option value="Rusher">Rusher</option>
                  <option value="Sniper">Sniper</option>
                  <option value="IGL">IGL</option>
                  <option value="Support">Support</option>
                  <option value="All-Rounder">All-Rounder</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemovePlayer(idx)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-colors cursor-pointer"
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
            Save Squad to Registry
          </Button>
        </div>
      </form>
    </Modal>
  );
};

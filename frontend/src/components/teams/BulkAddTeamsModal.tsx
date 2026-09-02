import React, { useState } from 'react';
import { useTeamStore } from '../../store/teamStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, CheckSquare, Square, Users2 } from 'lucide-react';
import type { Team } from '../../types/tournament';

export interface BulkAddTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeamCount: number;
  maxSlots: number;
  onAddTeams: (teamsToAdd: Omit<Team, 'id' | 'slotNumber'>[]) => void;
}

export const BulkAddTeamsModal: React.FC<BulkAddTeamsModalProps> = ({
  isOpen,
  onClose,
  currentTeamCount,
  maxSlots,
  onAddTeams
}) => {
  const { globalTeams } = useTeamStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const remainingSlots = Math.max(0, maxSlots - currentTeamCount);

  const filtered = globalTeams.filter(
    (gt) =>
      gt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gt.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedIds.length >= remainingSlots) return;
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    const idsToAdd = filtered.slice(0, remainingSlots).map((gt) => gt.id);
    setSelectedIds(idsToAdd);
  };

  const handleConfirm = () => {
    const teamsData = selectedIds
      .map((id) => globalTeams.find((gt) => gt.id === id))
      .filter(Boolean)
      .map((gt) => ({
        name: gt!.name,
        tag: gt!.tag,
        logoUrl: gt!.logoUrl,
        players: gt!.players.map((p) => ({
          id: p.id,
          name: p.name,
          inGameId: p.inGameId,
          role: p.role,
          avatarUrl: p.avatarUrl
        }))
      }));

    onAddTeams(teamsData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Add Teams from Database"
      description={`Select squads to fill available lobby slots (${selectedIds.length} / ${remainingSlots} selected).`}
      maxWidth="lg"
    >
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-xs font-bold text-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer shrink-0"
          >
            Select First {remainingSlots}
          </button>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
          {filtered.map((gt) => {
            const isSelected = selectedIds.includes(gt.id);
            const isDisabled = !isSelected && selectedIds.length >= remainingSlots;

            return (
              <div
                key={gt.id}
                onClick={() => !isDisabled && toggleSelect(gt.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-[var(--bg-surface-inset)] border-[var(--border-subtle)]'
                    : isSelected
                    ? 'bg-[var(--bg-surface-hover)] border-[var(--accent-primary)] cursor-pointer shadow-[var(--shadow-flat)]'
                    : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] font-black text-xs text-[var(--accent-primary)] border border-[var(--border-subtle)] font-mono">
                    {gt.tag}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)] font-display">{gt.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {gt.players.length} Players • {gt.status || 'Active'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="amber" size="sm">
                    Verified
                  </Badge>
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-[var(--accent-primary)] shrink-0 ml-2" />
                  ) : (
                    <Square className="h-5 w-5 text-[var(--text-muted)] shrink-0 ml-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Selected: <strong className="text-[var(--accent-primary)]">{selectedIds.length}</strong> / {remainingSlots}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              leftIcon={<Users2 className="h-4 w-4" />}
            >
              Add {selectedIds.length} Teams
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

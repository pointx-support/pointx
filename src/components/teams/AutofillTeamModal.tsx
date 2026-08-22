import React, { useState } from 'react';
import type { Team } from '../../types/tournament';
import { useTeamStore } from '../../store/teamStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, Sparkles, CheckCircle2 } from 'lucide-react';

export interface AutofillTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onApply: (sourceTeamId: string) => void;
}

export const AutofillTeamModal: React.FC<AutofillTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  onApply
}) => {
  const { globalTeams } = useTeamStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalId, setSelectedGlobalId] = useState<string | null>(null);

  const filteredGlobalTeams = globalTeams.filter(
    (gt) =>
      gt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gt.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (!selectedGlobalId) return;
    onApply(selectedGlobalId);
    onClose();
  };

  const selectedTeamData = globalTeams.find((gt) => gt.id === selectedGlobalId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Autofill Slot #${team.slotNumber}`}
      description="Choose a verified Free Fire esports team to auto-populate team name, tag, logo, and active player roster."
      maxWidth="lg"
    >
      <div className="space-y-4 font-sans">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search team database by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
          />
        </div>

        {/* Squad Selection List */}
        <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2 pr-1">
          {filteredGlobalTeams.length > 0 ? (
            filteredGlobalTeams.map((gt) => {
              const isSelected = selectedGlobalId === gt.id;

              return (
                <div
                  key={gt.id}
                  onClick={() => setSelectedGlobalId(gt.id)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-surface-hover)] border-[var(--accent-primary)] shadow-[var(--shadow-flat)]'
                      : 'bg-[var(--bg-surface-raised)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] font-black text-sm text-[var(--accent-primary)] border border-[var(--border-subtle)] font-mono">
                      {gt.tag}
                    </div>

                    <div className="min-w-0 font-sans">
                      <div className="font-bold text-[var(--text-primary)] text-sm truncate flex items-center gap-1.5 font-display">
                        {gt.name}
                        <span className="font-mono text-xs text-[var(--accent-primary)]">[{gt.tag}]</span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {gt.players.length} Players • {gt.status || 'Active'}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)] shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] font-mono">
              No matching teams found in registry.
            </div>
          )}
        </div>

        {/* Selected Squad Preview */}
        {selectedTeamData && (
          <div className="p-4 rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--bg-surface-inset)] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-bold text-xs text-[var(--text-primary)] font-display">
                  Autofill Roster Lineup Preview
                </span>
              </div>
              <Badge variant="amber" size="sm">
                {selectedTeamData.players.length} Players
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedTeamData.players.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-center"
                >
                  <div className="font-bold text-xs text-[var(--text-primary)] truncate">{p.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{p.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={!selectedGlobalId}
            onClick={handleConfirm}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Apply to Slot #{team.slotNumber}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

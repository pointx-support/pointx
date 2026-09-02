import React from 'react';
import type { Team } from '../../types/tournament';
import { Edit2, Trash2, Users, Sparkles, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onAutofill?: (team: Team) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  onAutofill
}) => {
  const playerCount = team.players?.length || 0;
  const isComplete = playerCount >= 4;
  const isIncomplete = playerCount > 0 && playerCount < 4;
  const isEmpty = playerCount === 0;

  return (
    <div
      className={`group rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-3.5 font-sans ${
        isEmpty
          ? 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] shadow-[var(--shadow-inset)]'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]/70 shadow-[var(--shadow-flat)] hover:shadow-[var(--shadow-raised)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      {/* Header with Slot & Status Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-black text-sm text-[var(--accent-primary)] font-mono shadow-[var(--shadow-inset)]">
            {team.tag || `#${team.slotNumber}`}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
                SLOT #{team.slotNumber}
              </span>
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight truncate group-hover:text-[var(--accent-primary)] transition-colors font-display">
              {team.name}
            </h3>
          </div>
        </div>

        {/* Visual Slot State Badge (Complete / Incomplete / Empty) */}
        <div className="shrink-0">
          {isComplete ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--status-live)]/10 text-[var(--status-live)] text-xs font-mono font-bold border border-[var(--status-live)]/20">
              <CheckCircle2 className="h-3 w-3" /> Complete
            </span>
          ) : isIncomplete ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--status-warning)]/10 text-[var(--status-warning)] text-xs font-mono font-bold border border-[var(--status-warning)]/20">
              <AlertCircle className="h-3 w-3" /> Incomplete ({playerCount}/4)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] text-[var(--text-muted)] text-xs font-mono font-semibold border border-[var(--border-subtle)]">
              <Circle className="h-3 w-3" /> Empty Slot
            </span>
          )}
        </div>
      </div>

      {/* Roster Strip */}
      <div className="rounded-xl bg-[var(--bg-surface-inset)] p-3 border border-[var(--border-subtle)] space-y-2 shadow-[var(--shadow-inset)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono font-bold">
          <span className="flex items-center gap-1.5 font-sans">
            <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            Squad Roster ({playerCount} Players)
          </span>
          <span className="text-[var(--text-muted)] font-normal">
            {isComplete ? '4 Main Lineup' : isEmpty ? '0 / 4 Registered' : `${playerCount} / 4 Lineup`}
          </span>
        </div>

        {playerCount > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {team.players.map((p) => (
              <span
                key={p.id}
                className="text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg text-[var(--text-primary)] font-mono font-semibold truncate max-w-[120px]"
              >
                {p.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] italic py-1 font-sans">
            No roster players added yet. Click Edit or Autofill to populate.
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
        {onAutofill && (
          <Button
            variant="booyah"
            size="xs"
            onClick={() => onAutofill(team)}
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
          >
            Autofill
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => onEdit(team)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs sm:text-sm font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
          >
            <Edit2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(team.id)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-colors cursor-pointer"
            title="Reset/Delete Slot"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import type { GlobalTeam } from '../../types/team';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trophy, Flame, Shield } from 'lucide-react';

export interface TeamProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: GlobalTeam;
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({
  isOpen,
  onClose,
  team
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${team.name} Profile`}
      description={`Official squad overview for [${team.tag}].`}
      maxWidth="lg"
    >
      <div className="space-y-5 font-sans">
        {/* Header Hero */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-primary)] font-black text-2xl text-[var(--accent-primary)] font-mono shadow-md">
            {team.tag}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-[var(--text-primary)] truncate font-display">{team.name}</h3>
              <Badge variant="cyan" size="sm">
                [{team.tag}]
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
              <span className="text-[var(--status-live)] font-bold">{team.status || 'Active'}</span>
              <span>•</span>
              <span className="text-[var(--text-primary)] font-medium font-sans">{team.players.length} Active Lineup</span>
            </div>
          </div>
        </div>

        {/* Roster Lineup Cards */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono flex items-center justify-between">
            <span>Active Lineup Roster</span>
            <span>{team.players.length} Players Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {team.players.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--accent-primary)] font-numbers border border-[var(--border-subtle)]">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">{player.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                      IGN: {player.inGameId || 'N/A'}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono font-semibold">
                  {player.role || 'Player'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Statistics Highlights */}
        <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-sans font-bold flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3 text-[var(--accent-gold)]" /> Avg Rank
            </div>
            <div className="text-base font-black text-[var(--accent-gold)] font-numbers mt-0.5">#2.0</div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-sans font-bold flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-[var(--status-danger)]" /> Total Frags
            </div>
            <div className="text-base font-black text-[var(--status-danger)] font-numbers mt-0.5">38 Kills</div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-sans font-bold flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-[var(--status-live)]" /> Booyahs
            </div>
            <div className="text-base font-black text-[var(--status-live)] font-numbers mt-0.5">3 Wins</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
};

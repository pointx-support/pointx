import React from 'react';
import type { Match, Tournament } from '../../types/tournament';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trophy, AlertTriangle, Lock } from 'lucide-react';

export interface MatchReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  tournament: Tournament;
  onConfirmFinalize: () => void;
  warnings?: string[];
}

export const MatchReviewModal: React.FC<MatchReviewModalProps> = ({
  isOpen,
  onClose,
  match,
  tournament,
  onConfirmFinalize,
  warnings = []
}) => {
  const winner = match.results.find((r) => r.placement === 1 || r.isBooyah);
  const winnerTeam = winner ? tournament.teams.find((t) => t.id === winner.teamId) : null;
  const totalKills = match.results.reduce((sum, r) => sum + (r.kills || 0), 0);

  const sortedResults = [...match.results].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit & Lock Official Match Results"
      description={`Verify results for ${match.customLabel || `Match #${match.matchNumber}`} before locking.`}
      maxWidth="xl"
    >
      <div className="space-y-4 font-sans">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-300 space-y-1">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 font-display">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Data Validation Warnings
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--text-secondary)]">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlights Row */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-inner">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-sans font-semibold">Booyah Champion</div>
            <div className="text-sm font-bold text-[var(--accent-gold)] mt-0.5 truncate flex items-center gap-1 font-display">
              <Trophy className="h-3.5 w-3.5" />
              {winnerTeam ? winnerTeam.name : 'Not Assigned'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-inner">
            <div className="text-[10px] uppercase text-[var(--text-secondary)] font-sans font-semibold">Total Match Frags</div>
            <div className="text-sm font-bold text-rose-500 mt-0.5 font-numbers">
              {totalKills} Kills Recorded
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="max-h-60 overflow-y-auto no-scrollbar rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="py-2.5 pl-3 pr-2">Rank</th>
                <th className="py-2.5 px-2 font-sans">Team</th>
                <th className="py-2.5 px-2 text-center">Place Pts</th>
                <th className="py-2.5 px-2 text-center">Kill Pts</th>
                <th className="py-2.5 pl-2 pr-3 text-right text-[var(--accent-primary)]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sortedResults.map((r, idx) => {
                const team = tournament.teams.find((t) => t.id === r.teamId);
                return (
                  <tr key={r.teamId} className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="py-2 pl-3 pr-2 font-bold text-[var(--text-primary)] font-numbers">#{idx + 1}</td>
                    <td className="py-2 px-2 font-semibold text-[var(--text-primary)] font-sans truncate max-w-[140px]">
                      {team?.name}
                    </td>
                    <td className="py-2 px-2 text-center text-[var(--text-secondary)] font-numbers">+{r.placementPoints}</td>
                    <td className="py-2 px-2 text-center text-rose-500 font-bold font-numbers">+{r.killPoints}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-bold text-[var(--accent-primary)] font-numbers">
                      {r.totalPoints} PTS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <Badge variant="live" size="sm">
            Auto-Sync to OBS & Standings
          </Badge>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="booyah"
              size="md"
              leftIcon={<Lock className="h-4 w-4" />}
              onClick={onConfirmFinalize}
            >
              Lock Official Standings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
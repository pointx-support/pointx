import React, { useState } from 'react';
import type { Match, Tournament } from '../../types/tournament';
import { Badge } from '../ui/Badge';
import { Trophy, Flame, ChevronDown, ChevronUp } from 'lucide-react';

export interface MatchResultTableProps {
  match: Match;
  tournament: Tournament;
  onEditMatch?: (match: Match) => void;
}

export const MatchResultTable: React.FC<MatchResultTableProps> = ({
  match,
  tournament
}) => {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const sortedResults = [...match.results].sort((a, b) => {
    if (a.placement > 0 && b.placement > 0) return a.placement - b.placement;
    return (b.totalPoints || 0) - (a.totalPoints || 0);
  });

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  return (
    <div className="space-y-3.5 font-sans">
      {/* Desktop Dense Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)]">
        <table className="w-full text-left border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              <th className="py-3 pl-4 pr-2 w-20"># Place</th>
              <th className="py-3 px-3">Team & Roster</th>
              <th className="py-3 px-3 text-center w-20">Slot</th>
              <th className="py-3 px-3 text-center w-24">Kills</th>
              <th className="py-3 px-3 text-center w-28">Booyah</th>
              <th className="py-3 px-3 text-right w-24">Place Pts</th>
              <th className="py-3 px-3 text-right w-24">Kill Pts</th>
              <th className="py-3 pl-3 pr-4 text-right w-28 font-bold text-[var(--accent-primary)]">Total Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-mono">
            {sortedResults.map((res) => {
              const team = tournament.teams.find((t) => t.id === res.teamId);
              if (!team) return null;

              const isWinner = res.placement === 1 || res.isBooyah;

              return (
                <tr
                  key={res.teamId}
                  className={`transition-colors hover:bg-[var(--bg-surface-hover)] ${
                    isWinner ? 'bg-[var(--accent-gold)]/[0.06]' : ''
                  }`}
                >
                  {/* Placement */}
                  <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs font-numbers ${
                        res.placement === 1
                          ? 'bg-[var(--accent-gold)] text-black'
                          : res.placement === 2
                          ? 'bg-[#94A3B8] text-black font-bold'
                          : res.placement === 3
                          ? 'bg-[#CD7F32] text-white font-bold'
                          : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {res.placement ? res.placement.toString().padStart(2, '0') : '--'}
                    </span>
                  </td>

                  {/* Team Info */}
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--accent-primary)] font-mono">
                        {team.tag}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--text-primary)] text-sm truncate flex items-center gap-1.5 font-display">
                          {team.name}
                          {isWinner && <Trophy className="h-3.5 w-3.5 text-[var(--accent-gold)]" />}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Slot */}
                  <td className="py-3 px-3 text-center text-[var(--text-secondary)] text-sm font-numbers font-semibold">
                    #{team.slotNumber.toString().padStart(2, '0')}
                  </td>

                  {/* Kills */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--status-danger)] text-sm font-numbers">
                      <Flame className="h-3.5 w-3.5" />
                      {res.kills}
                    </span>
                  </td>

                  {/* Booyah */}
                  <td className="py-3 px-3 text-center">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 text-xs font-bold font-sans">
                        👑 BOOYAH
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>

                  {/* Placement Points */}
                  <td className="py-3 px-3 text-right text-[var(--text-secondary)] text-sm font-numbers font-semibold">
                    +{res.placementPoints || 0}
                  </td>

                  {/* Kill Points */}
                  <td className="py-3 px-3 text-right text-[var(--status-danger)] font-bold text-sm font-numbers">
                    +{res.killPoints || 0}
                  </td>

                  {/* Total Points */}
                  <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                    <span className="font-black text-base text-[var(--accent-primary)] font-numbers">
                      {res.totalPoints || 0}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {sortedResults.map((res) => {
          const team = tournament.teams.find((t) => t.id === res.teamId);
          if (!team) return null;

          const isWinner = res.placement === 1 || res.isBooyah;
          const isExpanded = expandedTeamId === res.teamId;

          return (
            <div
              key={res.teamId}
              onClick={() => toggleExpand(res.teamId)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                isWinner
                  ? 'bg-[var(--accent-gold)]/[0.06] border-[var(--accent-gold)]/40'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 font-mono">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs font-numbers ${
                      res.placement === 1
                        ? 'bg-[var(--accent-gold)] text-black'
                        : res.placement === 2
                        ? 'bg-[#94A3B8] text-black font-bold'
                        : res.placement === 3
                        ? 'bg-[#CD7F32] text-white font-bold'
                        : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {res.placement || '?'}
                  </span>
                  <div className="min-w-0 font-sans">
                    <div className="font-bold text-[var(--text-primary)] text-sm truncate flex items-center gap-1.5 font-display">
                      {team.name}
                      {isWinner && <Trophy className="h-3.5 w-3.5 text-[var(--accent-gold)]" />}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono font-semibold">
                      Slot #{team.slotNumber} • [{team.tag}]
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <Badge variant={isWinner ? 'gold' : 'neutral'} size="sm">
                    {res.totalPoints || 0} PTS
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </div>
              </div>

              {/* Expandable Point Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-center text-xs animate-fadeIn font-mono">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                    <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Kills</div>
                    <div className="font-bold text-[var(--status-danger)] mt-0.5 font-numbers text-sm">{res.kills}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                    <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Place Pts</div>
                    <div className="font-bold text-[var(--text-primary)] mt-0.5 font-numbers text-sm">+{res.placementPoints || 0}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                    <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Kill Pts</div>
                    <div className="font-bold text-[var(--accent-primary)] mt-0.5 font-numbers text-sm">+{res.killPoints || 0}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import type { CalculatedStanding, Tournament } from '../../types/tournament';
import { Trophy, ChevronDown, ChevronUp, Users } from 'lucide-react';

export interface ResponsiveStandingsTableProps {
  standings: CalculatedStanding[];
  tournament?: Tournament;
}

export const ResponsiveStandingsTable: React.FC<ResponsiveStandingsTableProps> = ({
  standings
}) => {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  if (!standings || standings.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-sans">
        <Users className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[var(--text-primary)] font-display">No Standings Data</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Finalize matches to populate tournament leaderboard scores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-sans">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                <th className="py-3.5 pl-5 pr-2 w-20">Rank</th>
                <th className="py-3.5 px-4 font-sans">Team Name</th>
                <th className="py-3.5 px-3 text-center w-24">Played</th>
                <th className="py-3.5 px-3 text-center w-28">Booyahs</th>
                <th className="py-3.5 px-3 text-right w-28">Place Pts</th>
                <th className="py-3.5 px-3 text-right w-28">Kill Pts</th>
                <th className="py-3.5 pl-3 pr-5 text-right w-32 font-bold text-[var(--accent-primary)]">Total Pts</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-mono">
              {standings.map((s) => {
                const isExpanded = expandedTeamId === s.teamId;
                const isChampion = s.rank === 1;
                const isPodium = s.rank <= 3;

                return (
                  <React.Fragment key={s.teamId}>
                    <tr
                      onClick={() => toggleExpand(s.teamId)}
                      className={`group transition-colors hover:bg-[var(--bg-surface-hover)] cursor-pointer ${
                        isChampion
                          ? 'bg-[var(--accent-gold)]/[0.06]'
                          : isPodium
                          ? 'bg-[var(--bg-surface)]'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 pl-5 pr-2 whitespace-nowrap">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm font-numbers shadow-sm ${
                            s.rank === 1
                              ? 'bg-[var(--accent-gold)] text-black'
                              : s.rank === 2
                              ? 'bg-[#94A3B8] text-black font-bold'
                              : s.rank === 3
                              ? 'bg-[#CD7F32] text-white font-bold'
                              : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                          }`}
                        >
                          #{s.rank}
                        </div>
                      </td>

                      {/* Team Name */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base group-hover:text-[var(--accent-primary)] transition-colors font-display">
                            {s.teamName}
                          </span>
                          <span className="rounded-md bg-[var(--bg-surface-inset)] px-2 py-0.5 text-xs font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] font-bold">
                            [{s.teamTag}]
                          </span>
                          {isChampion && (
                            <Trophy className="h-4 w-4 text-[var(--accent-gold)] shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Matches Played */}
                      <td className="py-3.5 px-3 text-center text-[var(--text-secondary)] font-numbers font-semibold">
                        {s.matchesPlayed}
                      </td>

                      {/* Booyahs */}
                      <td className="py-3.5 px-3 text-center font-numbers">
                        {s.booyahs > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[var(--accent-gold)]">
                            <Trophy className="h-3.5 w-3.5" />
                            {s.booyahs}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] font-medium">0</span>
                        )}
                      </td>

                      {/* Place Pts */}
                      <td className="py-3.5 px-3 text-right text-[var(--text-secondary)] font-numbers font-semibold">
                        +{s.placementPoints}
                      </td>

                      {/* Kill Pts */}
                      <td className="py-3.5 px-3 text-right font-bold text-[var(--status-danger)] font-numbers">
                        +{s.killPoints}
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-black text-lg text-[var(--accent-primary)] font-numbers">
                            {s.totalPoints}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-sans">PTS</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Match-by-Match Strip */}
                    {isExpanded && s.matchHistory && (
                      <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--border-subtle)]">
                        <td colSpan={7} className="p-4 pl-8">
                          <div className="space-y-2">
                            <div className="text-xs uppercase font-bold text-[var(--text-secondary)] font-mono">
                              Match Breakdown ({s.matchHistory.length} Matches)
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {s.matchHistory.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs sm:text-sm font-mono flex items-center gap-2.5 shadow-sm"
                                >
                                  <span className="text-[var(--text-secondary)] font-bold">M{m.matchNumber}</span>
                                  <span className="text-[var(--accent-gold)] font-bold">#{m.placement}</span>
                                  <span className="text-[var(--status-danger)]">({m.kills} kills)</span>
                                  <span className="text-[var(--accent-primary)] font-bold font-numbers">+{m.totalPoints} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="sm:hidden space-y-3">
        {standings.map((s) => {
          const isChampion = s.rank === 1;

          return (
            <div
              key={s.teamId}
              onClick={() => toggleExpand(s.teamId)}
              className={`p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] space-y-2.5 ${
                isChampion ? 'border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/[0.04]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm font-numbers ${
                      s.rank === 1
                        ? 'bg-[var(--accent-gold)] text-black'
                        : s.rank === 2
                        ? 'bg-[#94A3B8] text-black font-bold'
                        : s.rank === 3
                        ? 'bg-[#CD7F32] text-white font-bold'
                        : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    #{s.rank}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] font-display flex items-center gap-1.5">
                      {s.teamName}
                      {isChampion && <Trophy className="h-4 w-4 text-[var(--accent-gold)]" />}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-mono font-semibold">[{s.teamTag}]</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-xl text-[var(--accent-primary)] font-numbers">
                    {s.totalPoints} <span className="text-xs font-bold text-[var(--text-muted)] font-sans">PTS</span>
                  </div>
                </div>
              </div>

              {/* Sub Metrics */}
              <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-[var(--border-subtle)] text-center font-mono text-xs">
                <div>
                  <span className="text-xs text-[var(--text-muted)] block font-sans font-semibold">Booyahs</span>
                  <span className="font-bold text-[var(--accent-gold)] font-numbers text-sm">{s.booyahs}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block font-sans font-semibold">Place Pts</span>
                  <span className="text-[var(--text-secondary)] font-numbers text-sm font-semibold">+{s.placementPoints}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block font-sans font-semibold">Kill Pts</span>
                  <span className="font-bold text-[var(--status-danger)] font-numbers text-sm">+{s.killPoints}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
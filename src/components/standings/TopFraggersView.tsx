import React, { useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { Badge } from '../ui/Badge';
import { Flame, Trophy, Search } from 'lucide-react';

export const TopFraggersView: React.FC = () => {
  const { getTopFraggers } = useTournamentStore();
  const [searchQuery, setSearchQuery] = useState('');

  const fraggers = getTopFraggers();

  const filteredFraggers = fraggers.filter(
    (f) =>
      f.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.teamTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top1 = fraggers[0];

  return (
    <div className="space-y-4 font-sans">
      {/* Top 1 MVP Hero Card */}
      {top1 && (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--accent-primary)]/35 bg-gradient-to-br from-[var(--bg-surface-raised)] via-[var(--bg-surface)] to-[var(--bg-surface-inset)] p-5 sm:p-6 shadow-[var(--shadow-raised)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] font-black text-2xl shadow-lg shadow-[var(--accent-primary)]/20 font-display">
                #1
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="amber" size="sm">
                    TOURNAMENT MVP
                  </Badge>
                  <span className="text-xs text-[var(--accent-primary)] font-mono font-bold">
                    [{top1.teamTag}] {top1.teamName}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1 tracking-tight font-display">
                  {top1.playerName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                  UID: {top1.inGameId || 'Verified Pro'} • Best Match: {top1.bestMatchKills} Kills
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
              <div className="text-left sm:text-right font-mono">
                <div className="text-3xl font-black text-[var(--status-danger)] flex items-center gap-1 sm:justify-end font-numbers">
                  <Flame className="h-6 w-6 text-[var(--status-danger)]" />
                  {top1.totalKills}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold font-sans">
                  Total Elimination Kills
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#756b60]" />
          <input
            type="text"
            placeholder="Search players or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <span className="text-xs text-[var(--text-secondary)] font-mono">
          {filteredFraggers.length} Fraggers Ranked
        </span>
      </div>

      {/* Fraggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFraggers.map((player) => {
          return (
            <div
              key={player.playerId}
              className={`p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] shadow-[var(--shadow-flat)] flex items-center justify-between transition-all ${
                player.rank === 1 ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.04]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs font-numbers ${
                    player.rank === 1
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-black shadow-md'
                      : player.rank === 2
                      ? 'bg-[#94A3B8] text-black font-bold'
                      : player.rank === 3
                      ? 'bg-[#CD7F32] text-white font-bold'
                      : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  #{player.rank}
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate flex items-center gap-1 font-display">
                    {player.playerName}
                    {player.rank === 1 && <Trophy className="h-3.5 w-3.5 text-[var(--accent-primary)]" />}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono truncate">
                    [{player.teamTag}] {player.teamName}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-sm text-[var(--accent-primary)] font-numbers">
                  {player.totalKills} Kills
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  {player.matchesPlayed} Matches • Avg {player.avgKills}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
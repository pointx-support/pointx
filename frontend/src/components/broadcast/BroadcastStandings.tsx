import type { FC } from 'react';
import type { Tournament, CalculatedStanding } from '../../types/tournament';
import { Trophy, Flame } from 'lucide-react';

interface BroadcastStandingsProps {
  tournament: Tournament;
  standings: CalculatedStanding[];
  isTransparent?: boolean;
}

export const BroadcastStandings: FC<BroadcastStandingsProps> = ({
  tournament,
  standings,
  isTransparent = true
}) => {
  return (
    <div
      className={`w-full h-full min-h-screen flex flex-col justify-center p-8 md:p-12 font-sans select-none ${
        isTransparent ? 'bg-transparent' : 'bg-[#13100f]'
      }`}
      style={{
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Overlay Header */}
      <div className="flex items-center justify-between border-b-2 border-[#e0684b]/40 pb-4 bg-[#1c1816]/95 px-6 py-3.5 rounded-t-2xl backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0684b] to-[#d4af37] p-[2px] shadow-lg shadow-[#e0684b]/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#161311]">
              <Trophy className="h-6 w-6 text-[#d4af37]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2ea66e] animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#e0684b] font-mono">
                LIVE OVERALL STANDINGS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#f7f4ef] font-display">
              {tournament.title}
            </h1>
          </div>
        </div>

        {/* Tournament Meta Info */}
        <div className="text-right font-mono">
          <div className="text-xs text-[#a89f91] font-semibold">
            ORGANIZED BY: <span className="text-[#f7f4ef] font-sans">{tournament.organizer}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-[#a89f91] mt-0.5">
            <span className="text-[#d4af37] font-bold">
              {tournament.matches.length} / {tournament.structure?.matchCount || 6} ROUNDS
            </span>
            <span>•</span>
            <span className="text-[#e0684b] font-bold">
              {tournament.scoringPreset.name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Standings Grid */}
      <div className="flex-1 bg-[#1c1816]/95 backdrop-blur-md rounded-b-2xl border-x-2 border-b-2 border-[#2e2723] overflow-hidden shadow-2xl mt-0">
        <table className="w-full text-left border-collapse tabular-nums">
          <thead>
            <tr className="border-b border-[#2e2723] bg-[#161311] text-xs font-bold uppercase tracking-wider text-[#a89f91] font-mono">
              <th className="py-3 px-4 w-20 text-center"># RANK</th>
              <th className="py-3 px-6 font-sans">TEAM NAME</th>
              <th className="py-3 px-4 text-center w-24">PLAYED</th>
              <th className="py-3 px-4 text-center w-28">BOOYAH</th>
              <th className="py-3 px-4 text-center w-28">PLACE PTS</th>
              <th className="py-3 px-4 text-center w-28">KILL PTS</th>
              <th className="py-3 px-4 text-center w-36 text-[#e0684b] font-black text-lg">
                TOTAL PTS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2723]/60 text-sm font-semibold">
            {standings.slice(0, 12).map((team) => {
              const isFirst = team.rank === 1;
              const isSecond = team.rank === 2;
              const isThird = team.rank === 3;

              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors ${
                    isFirst
                      ? 'bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/10 to-transparent text-white font-black'
                      : isSecond
                      ? 'bg-gradient-to-r from-slate-400/15 via-slate-400/5 to-transparent text-white'
                      : isThird
                      ? 'bg-gradient-to-r from-amber-700/15 via-amber-700/5 to-transparent text-white'
                      : 'hover:bg-[#241e1b]/50 text-[#f7f4ef]'
                  }`}
                >
                  {/* Rank Column */}
                  <td className="py-2.5 px-4 text-center font-mono font-bold">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm font-numbers ${
                        isFirst
                          ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/30'
                          : isSecond
                          ? 'bg-[#d8cfc2] text-black'
                          : isThird
                          ? 'bg-[#a3704c] text-white'
                          : 'bg-[#161311] text-[#a89f91] border border-[#2e2723]'
                      }`}
                    >
                      #{team.rank}
                    </span>
                  </td>

                  {/* Team Tag & Name */}
                  <td className="py-2.5 px-6 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#161311] text-[#e0684b] font-bold text-xs font-mono border border-[#2e2723]">
                        {team.teamTag}
                      </div>
                      <span className="font-bold text-base tracking-tight text-[#f7f4ef] font-display">
                        {team.teamName}
                      </span>
                      {isFirst && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#d4af37]/20 px-2 py-0.5 text-xs font-bold text-[#d4af37] border border-[#d4af37]/40 font-mono">
                          👑 LEADER
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Matches Played */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-sm font-numbers">
                    {team.matchesPlayed}
                  </td>

                  {/* Booyah Victories */}
                  <td className="py-2.5 px-4 text-center font-mono text-amber-400 font-bold text-sm font-numbers">
                    {team.booyahs > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        {team.booyahs}
                      </span>
                    ) : (
                      <span className="text-[#756b60]">0</span>
                    )}
                  </td>

                  {/* Placement Points */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-300 text-sm font-numbers">
                    +{team.placementPoints}
                  </td>

                  {/* Kill Points */}
                  <td className="py-2.5 px-4 text-center font-mono text-red-400 font-bold text-sm font-numbers">
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      +{team.killPoints}
                    </span>
                  </td>

                  {/* Total Points */}
                  <td className="py-2.5 px-4 text-center font-mono text-2xl font-black text-[#e0684b] font-numbers">
                    {team.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Broadcast Watermark Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f91] px-4 py-2 mt-1">
        <span>POINTX ARENA BROADCAST ENGINE</span>
        <span className="text-[#e0684b]">1920 × 1080 60FPS OBS OVERLAY</span>
      </div>
    </div>
  );
};
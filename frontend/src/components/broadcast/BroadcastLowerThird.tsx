import type { FC } from 'react';
import type { Tournament, CalculatedStanding } from '../../types/tournament';
import { Trophy, Flame } from 'lucide-react';

interface BroadcastLowerThirdProps {
  tournament: Tournament;
  standings: CalculatedStanding[];
  isTransparent?: boolean;
}

export const BroadcastLowerThird: FC<BroadcastLowerThirdProps> = ({
  tournament,
  standings,
  isTransparent = true
}) => {
  const topTeams = standings.slice(0, 4);

  return (
    <div
      className={`w-full h-full min-h-screen flex flex-col justify-end p-8 md:p-12 font-sans select-none ${
        isTransparent ? 'bg-transparent' : 'bg-[#13100f]'
      }`}
      style={{
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Lower Third Ticker Bar */}
      <div className="w-full rounded-2xl overflow-hidden border-2 border-[#e0684b]/50 bg-[#13100f]/95 backdrop-blur-xl shadow-2xl">
        {/* Top Mini Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#e0684b] via-[#d4af37] to-[#e0684b] px-6 py-1.5 text-black font-black text-xs uppercase tracking-widest font-display">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>{tournament.title} • TOP 4 STANDINGS</span>
          </div>
          <span className="font-mono">{tournament.matches.length} MATCHES RECORDED</span>
        </div>

        {/* Top 4 Horizontal Teams */}
        <div className="grid grid-cols-4 divide-x divide-[#2e2723] bg-[#1c1816]/95 p-4">
          {topTeams.map((team) => {
            const isFirst = team.rank === 1;

            return (
              <div
                key={team.teamId}
                className={`px-4 flex items-center justify-between font-mono ${
                  isFirst ? 'bg-[#d4af37]/10 rounded-xl' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-sm font-numbers ${
                      isFirst
                        ? 'bg-[#d4af37] text-black'
                        : team.rank === 2
                        ? 'bg-[#d8cfc2] text-black'
                        : team.rank === 3
                        ? 'bg-[#a3704c] text-white'
                        : 'bg-[#161311] text-[#a89f91] border border-[#2e2723]'
                    }`}
                  >
                    #{team.rank}
                  </div>
                  <div className="min-w-0 font-sans">
                    <div className="font-bold text-sm truncate text-[#f7f4ef] font-display">
                      {team.teamName}
                    </div>
                    <div className="text-[10px] text-[#a89f91] font-mono flex items-center gap-2">
                      <span>[{team.teamTag}]</span>
                      <span className="text-[#c83e35] flex items-center gap-0.5">
                        <Flame className="h-3 w-3" />
                        {team.totalKills} kills
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-[#e0684b] font-numbers">
                    {team.totalPoints}
                  </div>
                  <div className="text-[9px] text-[#756b60] font-sans">PTS</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import type { FC } from 'react';
import type { Tournament, PlayerLeaderboardStats } from '../../types/tournament';
import { calculateTopFraggers } from '../../engine/standingsEngine';
import { Flame } from 'lucide-react';

interface BroadcastTopFraggersProps {
  tournament: Tournament;
  isTransparent?: boolean;
}

export const BroadcastTopFraggers: FC<BroadcastTopFraggersProps> = ({
  tournament,
  isTransparent = true
}) => {
  const topFraggers: PlayerLeaderboardStats[] = calculateTopFraggers(tournament);

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
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b-2 border-[#c83e35]/60 pb-4 bg-[#1c1816]/95 px-6 py-4 rounded-t-2xl backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c83e35] to-[#d4af37] p-[2px] shadow-lg shadow-[#c83e35]/30">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#161311]">
              <Flame className="h-6 w-6 text-[#c83e35]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#c83e35] animate-ping"></span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#c83e35]">
                KILL LEADERBOARD
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#f7f4ef] font-display">
              TOP ELIMINATION FRAGGERS
            </h1>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-xs text-[#a89f91] font-semibold font-sans">{tournament.title}</div>
          <div className="text-lg font-black text-[#e0684b] font-numbers">
            {tournament.matches.length} MATCHES RECORDED
          </div>
        </div>
      </div>

      {/* Fraggers Grid */}
      <div className="flex-1 bg-[#1c1816]/95 backdrop-blur-md rounded-b-2xl border-x-2 border-b-2 border-[#2e2723] p-8 shadow-2xl mt-0 flex flex-col justify-center gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topFraggers.slice(0, 6).map((fragger: PlayerLeaderboardStats, idx: number) => {
            const isMVP = idx === 0;

            return (
              <div
                key={fragger.playerId || idx}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isMVP
                    ? 'bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/10 to-transparent border-[#d4af37] text-white shadow-xl scale-[1.02]'
                    : 'bg-[#161311] border-[#2e2723]'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black text-xl font-numbers ${
                      isMVP
                        ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/40'
                        : idx === 1
                        ? 'bg-[#d8cfc2] text-black font-bold'
                        : idx === 2
                        ? 'bg-[#a3704c] text-white font-bold'
                        : 'bg-[#161311] text-[#a89f91] border border-[#2e2723]'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="min-w-0 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg truncate text-[#f7f4ef] font-display">
                        {fragger.playerName}
                      </span>
                      {isMVP && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#d4af37]/20 px-2 py-0.5 text-xs font-bold text-[#d4af37] border border-[#d4af37]/40 font-mono">
                          👑 MVP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#a89f91] flex items-center gap-2 mt-0.5 font-mono">
                      <span className="rounded bg-[#1c1816] px-2.5 py-0.5 text-xs font-mono font-bold text-[#e0684b]">
                        [{fragger.teamTag}] {fragger.teamName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="flex items-center gap-1 justify-end font-black text-3xl text-[#c83e35] font-numbers">
                    <Flame className="h-6 w-6 text-[#c83e35]" />
                    {fragger.totalKills}
                  </div>
                  <div className="text-[10px] text-[#a89f91] uppercase tracking-wider font-semibold font-sans">
                    TOTAL KILLS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
import type { FC } from 'react';
import type { Tournament } from '../../types/tournament';
import { Trophy, Flame, MapPin } from 'lucide-react';

interface BroadcastMatchResultProps {
  tournament: Tournament;
  matchNumber?: number;
  isTransparent?: boolean;
}

export const BroadcastMatchResult: FC<BroadcastMatchResultProps> = ({
  tournament,
  matchNumber,
  isTransparent = true
}) => {
  const targetMatch = matchNumber
    ? tournament.matches.find((m) => m.matchNumber === matchNumber)
    : tournament.matches[tournament.matches.length - 1];

  if (!targetMatch) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white font-mono text-xl">
        NO MATCH DATA AVAILABLE FOR BROADCAST
      </div>
    );
  }

  const resultsWithTeams = targetMatch.results
    .map((res) => {
      const team = tournament.teams.find((t) => t.id === res.teamId);
      return {
        ...res,
        team: team || { name: 'Unknown', tag: 'UNK', slotNumber: 0 }
      };
    })
    .sort((a, b) => {
      if (a.placement > 0 && b.placement > 0) return a.placement - b.placement;
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

  const booyahWinner = resultsWithTeams.find((r) => r.placement === 1 || r.isBooyah);

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
      <div className="flex items-center justify-between border-b-2 border-[#d4af37]/50 pb-4 bg-[#1c1816]/90 px-6 py-4 rounded-t-2xl backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-ping"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#d4af37]">
              OFFICIAL MATCH RESULTS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-[#f7f4ef] font-display">
            {targetMatch.customLabel || `Match #${targetMatch.matchNumber}`}
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-[#a89f91] mt-1">
            <MapPin className="h-3.5 w-3.5 text-[#2ea66e]" />
            <span>Map: {targetMatch.mapName}</span>
            <span>•</span>
            <span>{tournament.title}</span>
          </div>
        </div>

        {/* Booyah Champion Display */}
        {booyahWinner && (
          <div className="flex items-center gap-3 bg-[#d4af37]/15 border border-[#d4af37]/40 px-5 py-2.5 rounded-xl shadow-lg font-mono">
            <Trophy className="h-8 w-8 text-[#d4af37]" />
            <div>
              <div className="text-[10px] font-bold uppercase text-[#d4af37]">BOOYAH CHAMPION</div>
              <div className="text-xl font-black text-[#f7f4ef] font-display">
                {booyahWinner.team.name} <span className="text-[#e0684b]">({booyahWinner.kills} KILLS)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Results */}
      <div className="flex-1 bg-[#1c1816]/90 backdrop-blur-md rounded-b-2xl border-x-2 border-b-2 border-[#2e2723] p-6 shadow-2xl mt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono">
          {resultsWithTeams.slice(0, 12).map((res) => {
            const isFirst = res.placement === 1 || res.isBooyah;

            return (
              <div
                key={res.teamId}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isFirst
                    ? 'bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 border-[#d4af37] text-white shadow-lg'
                    : 'bg-[#161311] border-[#2e2723] text-[#f7f4ef]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs font-numbers ${
                      isFirst
                        ? 'bg-[#d4af37] text-black font-black'
                        : 'bg-[#1c1816] text-[#a89f91] border border-[#2e2723]'
                    }`}
                  >
                    #{res.placement || '?'}
                  </span>
                  <div className="min-w-0 font-sans">
                    <div className="font-bold text-sm truncate font-display">{res.team.name}</div>
                    <div className="text-[11px] text-[#a89f91] font-mono flex items-center gap-1.5">
                      <Flame className="h-3 w-3 text-[#c83e35]" />
                      <span>{res.kills} kills</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-black text-xl text-[#e0684b] font-numbers">
                    +{res.totalPoints || 0}
                  </div>
                  <div className="text-[9px] text-[#756b60]">PTS</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#a89f91] px-4 py-2 mt-1">
        <span>STRIKZ ARENA BROADCAST SYSTEM</span>
        <span className="text-[#e0684b]">MATCH {targetMatch.matchNumber} OFFICIAL REPORT</span>
      </div>
    </div>
  );
};

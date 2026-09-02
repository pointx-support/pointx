import React, { useState } from 'react';
import type { Tournament, CalculatedStanding } from '../../types/tournament';
import { subscribeToLiveSquadUpdates } from '../../services/broadcastSync';
import { Flame } from 'lucide-react';

export interface BroadcastFreeFireLiveOverlayProps {
  tournament: Tournament;
  standings: CalculatedStanding[];
  isTransparent?: boolean;
}

export type PlayerState = 'alive' | 'knock' | 'eliminated';

export interface SquadLiveStatus {
  teamId: string;
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  highlighted?: boolean;
}

// Preset squad logos and seed data matching competitive Free Fire standards
const SEED_TEAM_DATA: Record<string, { tag: string; logoUrl?: string; color?: string }> = {
  t1: { tag: 'TG' },
  t2: { tag: 'TE' },
  t3: { tag: 'OG' },
  t4: { tag: 'GODL' },
  t5: { tag: 'BLND' },
  t6: { tag: 'RNTX' },
  t7: { tag: 'CTZ' },
  t8: { tag: 'KING' },
  t9: { tag: 'RE' },
  t10: { tag: 'RTP' },
  t11: { tag: 'PVS' },
  t12: { tag: 'MVP' }
};

export const BroadcastFreeFireLiveOverlay: React.FC<BroadcastFreeFireLiveOverlayProps> = ({
  tournament,
  standings,
  isTransparent = true
}) => {
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(`strikz_squads_${tournament.id}`) || window.localStorage.getItem('strikz_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isVisible !== undefined) return parsed.isVisible;
        }
      } catch {}
    }
    return true;
  });

  // Live player state simulator/manager for 12 squads
  const [liveSquads, setLiveSquads] = useState<Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]>>(() => {
    const initial: Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]> = {};
    standings.slice(0, 12).forEach((s, idx) => {
      if (idx === 1 || idx === 4) {
        initial[s.teamId] = ['eliminated', 'eliminated', 'eliminated', 'eliminated'];
      } else if (idx === 2) {
        initial[s.teamId] = ['alive', 'eliminated', 'alive', 'alive'];
      } else if (idx === 9) {
        initial[s.teamId] = ['eliminated', 'eliminated', 'eliminated', 'alive'];
      } else if (idx === 11) {
        initial[s.teamId] = ['alive', 'knock', 'alive', 'alive'];
      } else {
        initial[s.teamId] = ['alive', 'alive', 'alive', 'alive'];
      }
    });
    return initial;
  });

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(() => {
    return standings[10] ? standings[10].teamId : null;
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToLiveSquadUpdates(tournament.id, (data) => {
      if (data.squads) {
        setLiveSquads(data.squads as any);
      }
      if (data.highlightedTeamId !== undefined) {
        setHighlightedTeamId(data.highlightedTeamId);
      }
      if (data.isVisible !== undefined) {
        setIsOverlayVisible(data.isVisible);
      }
    });
    return () => unsubscribe();
  }, [tournament.id]);

  const togglePlayerState = (teamId: string, playerIndex: number) => {
    setLiveSquads((prev) => {
      const current = prev[teamId] || ['alive', 'alive', 'alive', 'alive'];
      const nextStates: Record<PlayerState, PlayerState> = {
        alive: 'knock',
        knock: 'eliminated',
        eliminated: 'alive'
      };
      const updated = [...current] as [PlayerState, PlayerState, PlayerState, PlayerState];
      updated[playerIndex] = nextStates[updated[playerIndex]];
      return { ...prev, [teamId]: updated };
    });
  };

  const displayTeams = standings.slice(0, 12);
  const maxKillsInTour = Math.max(...displayTeams.map((s) => s.totalKills), 0);

  return (
    <div
      className={`w-full min-h-screen flex items-start justify-end p-4 sm:p-8 select-none font-sans overflow-hidden ${
        isTransparent ? 'bg-transparent' : 'bg-[#0f0c1b]'
      }`}
      style={{
        boxSizing: 'border-box'
      }}
    >
      {/* Container matching the exact Free Fire broadcast vertical overlay with Right-to-Left Slide In/Out Animation */}
      <div
        className={`w-[340px] sm:w-[360px] rounded-lg overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.85)] border border-[#3b1d6e] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          isOverlayVisible
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-[500px] pointer-events-none scale-95'
        }`}
        style={{
          fontFamily: "'Space Grotesk', 'Rajdhani', sans-serif"
        }}
      >
        {/* ================= 1. HEADER ROW ================= */}
        <div className="bg-[#1b0d33] text-white flex items-center h-10 px-2.5 text-xs font-black tracking-wider border-b border-[#3b1d6e]">
          {/* # Rank Header */}
          <div className="w-8 text-center text-[13px] font-bold text-slate-200">
            #
          </div>

          {/* TEAMS Header */}
          <div className="flex-1 pl-2 text-[12px] uppercase font-bold text-slate-100">
            TEAMS
          </div>

          {/* ALIVE Header */}
          <div className="w-20 text-center text-[11px] uppercase font-bold text-slate-100">
            ALIVE
          </div>

          {/* ELIMS Header */}
          <div className="w-11 text-center text-[11px] uppercase font-bold text-slate-100">
            ELIMS
          </div>

          {/* T.PTS. Header */}
          <div className="w-12 text-right pr-1 text-[11px] uppercase font-bold text-slate-100">
            T.PTS.
          </div>
        </div>

        {/* ================= 2. ROWS 1 TO 12 ================= */}
        <div className="flex flex-col divide-y divide-[#cfb99f]">
          {displayTeams.map((teamStanding, index) => {
            const team = tournament.teams.find((t) => t.id === teamStanding.teamId);
            const rank = index + 1;
            const squadPlayers = liveSquads[teamStanding.teamId] || ['alive', 'alive', 'alive', 'alive'];
            const allDead = squadPlayers.every((p) => p === 'eliminated');
            const isHighlighted = highlightedTeamId === teamStanding.teamId;

            // Pure Fire Burning Logic:
            // 1. Alive Leader: Burning vibrant glowing fire
            // 2. Eliminated Leader: OPAQUE FADED ASH FIRE (Solid matte desaturated burnt color, 100% NOT transparent)
            const isFireLeader = teamStanding.totalKills >= 4 && teamStanding.totalKills === maxKillsInTour && maxKillsInTour >= 4;
            const isFireHotAlive = isFireLeader && !allDead;
            const isFireHotEliminated = isFireLeader && allDead;

            const tag = team?.tag || SEED_TEAM_DATA[team?.id || '']?.tag || team?.name.slice(0, 4).toUpperCase() || `T${rank}`;

            return (
              <div
                key={teamStanding.teamId}
                onClick={() => setHighlightedTeamId(isHighlighted ? null : teamStanding.teamId)}
                className={`flex items-center h-11 transition-all cursor-pointer relative ${
                  isFireHotAlive
                    ? 'border-y-2 border-orange-500 bg-gradient-to-r from-[#991b1b] via-[#ea580c] to-[#f97316] text-white shadow-xl animate-fire-burn'
                    : isFireHotEliminated
                    ? 'border-y-2 border-[#5c3a28] bg-gradient-to-r from-[#422215] via-[#522d1d] to-[#3a1d12] text-[#d4bca4] shadow-md'
                    : isHighlighted
                    ? 'bg-[#281149] text-white'
                    : allDead
                    ? 'bg-[#b6aa9c] text-[#4d443b]'
                    : 'bg-gradient-to-b from-[#eedecf] to-[#e4ceb9] text-[#1c140d]'
                }`}
              >
                {/* # Rank Pill */}
                <div
                  className={`w-8 h-full flex items-center justify-center font-bold text-base border-r ${
                    isFireHotAlive
                      ? 'bg-[#8f2702] text-white border-[#5a1400] font-black'
                      : isFireHotEliminated
                      ? 'bg-[#2b140a] text-[#c49b80] border-[#401f11] font-bold'
                      : isHighlighted
                      ? 'bg-[#1a0b32] text-white border-[#3d1a6d]'
                      : 'bg-[#23123f] text-white border-[#341b5c]'
                  }`}
                  style={{
                    fontFamily: "'Rajdhani', 'Bebas Neue', sans-serif"
                  }}
                >
                  {rank}
                </div>

                {/* Team Logo & Tag */}
                <div className="flex-1 flex items-center gap-2 pl-2 min-w-0 pr-1">
                  {/* Team Logo Icon / Avatar */}
                  <div
                    className={`h-7 w-7 rounded shrink-0 flex items-center justify-center font-black text-[11px] shadow-sm border ${
                      isFireHotAlive
                        ? 'bg-[#fff4e6] border-[#ffa94d] text-[#d9480f] font-black'
                        : isFireHotEliminated
                        ? 'bg-[#4a2818] border-[#6b3c25] text-[#e0bda6]'
                        : isHighlighted
                        ? 'bg-[#3b1968] border-[#5d27a4] text-white'
                        : allDead
                        ? 'bg-[#918579] border-[#7d7165] text-[#2c2621]'
                        : 'bg-[#361e56] border-[#4e2c7a] text-white'
                    }`}
                  >
                    {tag.slice(0, 3)}
                  </div>

                  {/* Team Tag Text with Fire Effect */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={`font-black text-sm uppercase tracking-tight truncate ${
                        isFireHotAlive || isHighlighted
                          ? 'text-white'
                          : isFireHotEliminated
                          ? 'text-[#f0d8c2]'
                          : allDead
                          ? 'text-[#3e362f]'
                          : 'text-[#1a110a]'
                      }`}
                      style={{
                        fontFamily: "'Rajdhani', sans-serif"
                      }}
                    >
                      {tag}
                    </span>

                    {isFireHotAlive && (
                      <Flame className="h-4 w-4 text-amber-200 fill-amber-300 animate-flame-wave shrink-0" />
                    )}
                    {isFireHotEliminated && (
                      <Flame className="h-3.5 w-3.5 text-[#b87333] fill-[#8b4513] shrink-0" />
                    )}
                  </div>
                </div>

                {/* ALIVE 4-Player Status Indicator Bars */}
                <div className="w-20 flex items-center justify-center gap-[3.5px] px-1">
                  {squadPlayers.map((status, pIdx) => {
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayerState(teamStanding.teamId, pIdx);
                        }}
                        title={`Player ${pIdx + 1}: ${status.toUpperCase()} (Click to toggle)`}
                        className={`h-5 w-[11px] rounded-[2px] transition-all cursor-pointer ${
                          status === 'alive'
                            ? isFireHotAlive
                              ? 'bg-[#fff4e6] shadow-sm'
                              : 'bg-[#c3822d] shadow-sm'
                            : status === 'knock'
                            ? 'bg-[#b91c1c] animate-pulse shadow-sm'
                            : isFireHotAlive
                            ? 'border-[1.5px] border-[#fff4e6]/80 bg-transparent'
                            : isFireHotEliminated
                            ? 'border-[1.5px] border-[#6b3c25] bg-transparent'
                            : isHighlighted
                            ? 'border-[1.5px] border-[#c3822d]/60 bg-transparent'
                            : allDead
                            ? 'border-[1.5px] border-[#6b6055] bg-transparent'
                            : 'border-[1.5px] border-[#a0743a] bg-transparent'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* ELIMS Count */}
                <div
                  className={`w-11 text-center font-bold text-base flex items-center justify-center gap-0.5 ${
                    isFireHotAlive
                      ? 'text-white font-black'
                      : isFireHotEliminated
                      ? 'text-[#f0d8c2] font-bold'
                      : isHighlighted
                      ? 'text-white'
                      : allDead
                      ? 'text-[#3b342e]'
                      : 'text-[#1b120a]'
                  }`}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif"
                  }}
                >
                  {teamStanding.totalKills}
                </div>

                {/* T.PTS. Count */}
                <div
                  className={`w-12 text-right pr-2 font-black text-base ${
                    isFireHotAlive
                      ? 'text-white font-black'
                      : isFireHotEliminated
                      ? 'text-[#f0d8c2] font-bold'
                      : isHighlighted
                      ? 'text-white'
                      : allDead
                      ? 'text-[#3b342e]'
                      : 'text-[#1b120a]'
                  }`}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif"
                  }}
                >
                  {teamStanding.totalPoints}
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= 3. BOTTOM LEGEND BAR ================= */}
        <div className="bg-[#1b0d33] text-white flex items-center justify-center gap-4 py-2 px-3 text-[11px] font-bold tracking-wider border-t border-[#3b1d6e]">
          {/* ALIVE Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] bg-[#c3822d]" />
            <span className="text-slate-200">ALIVE</span>
          </div>

          {/* KNOCK Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] bg-[#b91c1c]" />
            <span className="text-slate-200">KNOCK</span>
          </div>

          {/* ELIMINATED Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-2.5 rounded-[1px] border-[1.5px] border-[#c3822d]" />
            <span className="text-slate-200">ELIMINATED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

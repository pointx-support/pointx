import React, { useState } from 'react';
import type { Tournament, CalculatedStanding } from '../../types/tournament';
import { subscribeToLiveSquadUpdates } from '../../services/broadcastSync';
import { Flame, Crosshair } from 'lucide-react';

export interface BroadcastFreeFireLiveOverlayProps {
  tournament: Tournament;
  standings: CalculatedStanding[];
  isTransparent?: boolean;
  isOverlayVisible?: boolean;
}

export type PlayerState = 'alive' | 'knock' | 'eliminated';

export interface SquadLiveStatus {
  teamId: string;
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  highlighted?: boolean;
}

export const BroadcastFreeFireLiveOverlay: React.FC<BroadcastFreeFireLiveOverlayProps> = ({
  tournament,
  standings,
  isTransparent = true,
  isOverlayVisible: propIsOverlayVisible
}) => {
  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(() => {
    if (propIsOverlayVisible !== undefined) return propIsOverlayVisible;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isVisible !== undefined) return parsed.isVisible;
        }
      } catch {}
    }
    return true;
  });

  // Live player state initialized to real tournament squad states (all alive by default)
  const [liveSquads, setLiveSquads] = useState<Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.squads) return parsed.squads;
        }
      } catch {}
    }

    const initial: Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]> = {};
    standings.slice(0, 12).forEach((s) => {
      initial[s.teamId] = ['alive', 'alive', 'alive', 'alive'];
    });
    return initial;
  });

  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.highlightedTeamId || null;
        }
      } catch {}
    }
    return null;
  });

  // Manual Remote Control Fire Animation IDs (Never activates automatically based on kills)
  const [fireTeamIds, setFireTeamIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.fireTeamIds)) return parsed.fireTeamIds;
        }
      } catch {}
    }
    return [];
  });

  // Tactical Point Rush Scope Indicator IDs
  const [pointRushTeamIds, setPointRushTeamIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed?.pointRushTeamIds)) return parsed.pointRushTeamIds;
        }
      } catch {}
    }
    return [];
  });

  const [isPointRushActive, setIsPointRushActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored =
          window.localStorage.getItem(`pointx_squads_${tournament.id}`) ||
          window.localStorage.getItem('pointx_squads_default');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.isPointRushActive !== undefined) return Boolean(parsed.isPointRushActive);
        }
      } catch {}
    }
    return false;
  });

  React.useEffect(() => {
    if (propIsOverlayVisible !== undefined) {
      setIsOverlayVisible(propIsOverlayVisible);
    }
  }, [propIsOverlayVisible]);

  React.useEffect(() => {
    const unsubscribe = subscribeToLiveSquadUpdates(tournament.id, (data) => {
      if (data.squads) {
        setLiveSquads(data.squads as any);
      }
      if (data.highlightedTeamId !== undefined) {
        setHighlightedTeamId(data.highlightedTeamId);
      }
      if (data.fireTeamIds !== undefined) {
        setFireTeamIds(data.fireTeamIds);
      }
      if (data.pointRushTeamIds !== undefined) {
        setPointRushTeamIds(data.pointRushTeamIds);
      }
      if (data.isPointRushActive !== undefined) {
        setIsPointRushActive(data.isPointRushActive);
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
  const activeMatch = tournament.matches && tournament.matches.length > 0 ? tournament.matches[0] : null;

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
            const team = tournament.teams.find(
              (t) => t.id === teamStanding.teamId || (t as any)._id === teamStanding.teamId
            );
            const rank = index + 1;
            const squadPlayers =
              liveSquads[teamStanding.teamId] ||
              (team && liveSquads[team.id]) ||
              ['alive', 'alive', 'alive', 'alive'];
            const allDead = squadPlayers.every((p) => p === 'eliminated');
            const isHighlighted = highlightedTeamId === teamStanding.teamId;

            // Live Match / Standings Kills & Points
            const matchResult = activeMatch?.results?.find((r) => r.teamId === teamStanding.teamId);
            const currentKills =
              matchResult?.kills !== undefined && matchResult.kills > 0
                ? matchResult.kills
                : (teamStanding.totalKills || 0);
            const currentTotalPoints =
              matchResult?.totalPoints !== undefined && matchResult.totalPoints > 0
                ? matchResult.totalPoints
                : (teamStanding.totalPoints || 0);

            // Pure Fire Burning Logic: Strictly controlled manually via OBS Remote Controller (no automatic activation)
            const isFireManual = fireTeamIds.includes(teamStanding.teamId);
            const isFireHotAlive = isFireManual && !allDead;
            const isFireHotEliminated = isFireManual && allDead;

            // Tactical Point Rush Scope Indicator (Controlled via OBS Remote)
            const isPointRush = isPointRushActive || pointRushTeamIds.includes(teamStanding.teamId);

            const tag = team?.tag || (team?.name ? team.name.slice(0, 4).toUpperCase() : `T${rank}`);

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
                    ? 'bg-[#281149] text-white ring-2 ring-amber-400'
                    : allDead
                    ? 'bg-[#2b2520] border-l-4 border-l-red-600 text-[#8f847b] opacity-90'
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
                      : allDead
                      ? 'bg-[#1a1410] text-[#786c63] border-[#302620]'
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
                    className={`h-7 w-7 rounded shrink-0 flex items-center justify-center font-black text-[11px] shadow-sm border overflow-hidden ${
                      isFireHotAlive
                        ? 'bg-[#fff4e6] border-[#ffa94d] text-[#d9480f] font-black'
                        : isFireHotEliminated
                        ? 'bg-[#4a2818] border-[#6b3c25] text-[#e0bda6]'
                        : isHighlighted
                        ? 'bg-[#3b1968] border-[#5d27a4] text-white'
                        : allDead
                        ? 'bg-[#3d3228] border-[#524438] text-[#9c8e82]'
                        : 'bg-[#361e56] border-[#4e2c7a] text-white'
                    }`}
                  >
                    {team?.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
                    ) : (
                      tag.slice(0, 3)
                    )}
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
                          ? 'text-[#9c8e82] line-through'
                          : 'text-[#1a110a]'
                      }`}
                      style={{
                        fontFamily: "'Rajdhani', sans-serif"
                      }}
                    >
                      {tag}
                    </span>

                    {/* Tactical Scope Symbol for Point Rush */}
                    {isPointRush && (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/80 text-amber-300 font-mono text-[9px] font-black shrink-0 shadow-sm animate-pulse"
                        title="Point Rush Active"
                      >
                        <Crosshair className="h-3 w-3 text-amber-300 shrink-0" />
                        <span className="hidden sm:inline tracking-wider">RUSH</span>
                      </div>
                    )}

                    {isFireHotAlive && (
                      <Flame className="h-4 w-4 text-amber-200 fill-amber-300 animate-flame-wave shrink-0" />
                    )}
                    {isFireHotEliminated && (
                      <Flame className="h-3.5 w-3.5 text-[#b87333] fill-[#8b4513] shrink-0" />
                    )}
                  </div>
                </div>

                {/* ALIVE 4-Player Status Indicator Bars OR Wipeout Status */}
                <div className="w-20 flex items-center justify-center px-1">
                  {allDead ? (
                    <div className="flex items-center justify-center bg-red-950/90 border border-red-600/70 rounded px-1.5 py-0.5 shadow-sm">
                      <span className="text-[10px] font-black tracking-wider text-red-400 uppercase font-mono leading-none">
                        ELIMINATED
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-[3.5px]">
                      {squadPlayers.map((status, pIdx) => (
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
                              : 'border-[1.5px] border-[#a0743a] bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  )}
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
                      ? 'text-red-400/80 font-bold'
                      : 'text-[#1b120a]'
                  }`}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif"
                  }}
                >
                  {currentKills}
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
                      ? 'text-[#9c8e82]'
                      : 'text-[#1b120a]'
                  }`}
                  style={{
                    fontFamily: "'Rajdhani', sans-serif"
                  }}
                >
                  {currentTotalPoints}
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

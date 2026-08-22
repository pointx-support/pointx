import React from 'react';
import {
  Activity,
  Tv,
  Swords,
  Trophy,
  Users2,
  Radio,
  Zap,
  Target
} from 'lucide-react';

export interface HolographicDataCardsProps {
  className?: string;
}

export const HolographicDataCards: React.FC<HolographicDataCardsProps> = ({ className = '' }) => {
  return (
    <div className={`w-full h-full pointer-events-none ${className}`}>
      {/* CARD 1: TOP-LEFT — MATCH STATUS */}
      <div className="absolute left-2 sm:left-4 md:left-8 top-16 sm:top-20 z-20 pointer-events-auto transform -translate-y-2 animate-float-slow">
        <div className="group relative rounded-2xl border border-[var(--border-subtle)] hover:border-[#ffd000]/50 bg-[#0e121a]/85 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,208,0,0.18)] transition-all duration-300 w-[190px] sm:w-[220px]">
          {/* Subtle top amber highlight line */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#ffd000]/60 to-transparent" />
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#ffd000]">
              <Radio className="h-3 w-3 animate-pulse text-[#ffd000]" />
              Match Status
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] text-[9px] font-mono font-bold border border-[#10b981]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-ping" />
              LIVE NOW
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-white font-display flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-[#ffd000]" />
            <span>Battle Royale</span>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <Users2 className="h-3 w-3 text-gray-400" />
              48 / 48
            </span>
            <span className="text-[#ffd000] font-bold">Bermuda</span>
          </div>
        </div>
      </div>

      {/* CARD 2: TOP-RIGHT — MATCH PROGRESS */}
      <div className="absolute right-2 sm:right-4 md:right-8 top-16 sm:top-20 z-20 pointer-events-auto transform translate-y-2 animate-float-delayed">
        <div className="group relative rounded-2xl border border-[var(--border-subtle)] hover:border-[#ffd000]/50 bg-[#0e121a]/85 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,208,0,0.18)] transition-all duration-300 w-[190px] sm:w-[220px]">
          {/* Subtle top amber highlight line */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#ffd000]/60 to-transparent" />

          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-gray-400">
              <Activity className="h-3 w-3 text-[#ffd000]" />
              Match Progress
            </span>
            <span className="text-[10px] font-mono font-bold text-[#ffd000]">
              66%
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-white font-display flex items-center justify-between">
            <span>Round 04 / 06</span>
            <span className="text-[11px] font-mono text-gray-400">Map 4</span>
          </div>

          {/* Micro Progress Bar */}
          <div className="mt-2.5 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#ffd000] to-[#ff9900] h-full rounded-full transition-all duration-500"
              style={{ width: '66.6%' }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Matrix: Online</span>
            <span className="text-[#10b981] font-bold">Auto-Calc</span>
          </div>
        </div>
      </div>

      {/* CARD 3: BOTTOM-LEFT — SCORING ENGINE */}
      <div className="hidden lg:block absolute left-2 sm:left-6 md:left-12 bottom-20 sm:bottom-24 z-20 pointer-events-auto animate-float-subtle">
        <div className="group relative rounded-2xl border border-[var(--border-subtle)] hover:border-[#ffd000]/50 bg-[#0e121a]/85 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,208,0,0.18)] transition-all duration-300 w-[200px] sm:w-[230px]">
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#ffd000]/60 to-transparent" />

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#ffd000]">
              <Trophy className="h-3 w-3 text-[#ffd000]" />
              Scoring Matrix
            </span>
            <span className="text-[10px] font-mono font-bold text-gray-400">12 Squads</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-base sm:text-lg font-bold text-white font-numbers">
              124 <span className="text-xs text-gray-400 font-sans font-normal">PTS LEADER</span>
            </div>
            <div className="text-[10px] font-mono text-[#ffd000] font-bold">
              12-9-8-7...
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-red-400" />
              1 PT / Frag
            </span>
            <span className="text-[#10b981] font-bold">Official Rules</span>
          </div>
        </div>
      </div>

      {/* CARD 4: BOTTOM-RIGHT — BROADCAST FEED */}
      <div className="hidden lg:block absolute right-2 sm:right-6 md:right-12 bottom-20 sm:bottom-24 z-20 pointer-events-auto animate-float-delayed">
        <div className="group relative rounded-2xl border border-[var(--border-subtle)] hover:border-[#ffd000]/50 bg-[#0e121a]/85 backdrop-blur-xl p-3.5 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_40px_rgba(255,208,0,0.18)] transition-all duration-300 w-[200px] sm:w-[230px]">
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#ffd000]/60 to-transparent" />

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#38bdf8]">
              <Tv className="h-3 w-3 text-[#38bdf8]" />
              OBS Broadcast
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] text-[9px] font-mono font-bold border border-[#38bdf8]/30">
              1080P 60FPS
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-white font-display flex items-center justify-between">
            <span>Overlay Engine</span>
            <span className="text-[11px] font-mono text-[#10b981]">0ms Delay</span>
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-[#ffd000]" />
              Standings + Lower 3rd
            </span>
            <span className="text-white font-bold">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

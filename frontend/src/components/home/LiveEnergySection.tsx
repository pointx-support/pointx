import React from 'react';
import {
  Flame,
  Radio,
  BarChart3,
  Award,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { PulseIndicator } from '../animation/MicroInteractions';
import { Badge } from '../ui/Badge';

export const LiveEnergySection: React.FC = () => {
  return (
    <section id="live-matrix" className="py-24 md:py-32 relative overflow-hidden bg-[var(--bg-surface)]/30 border-y border-white/[0.06] transition-colors duration-300">
      
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(245,158,11,0.12),rgba(125,64,71,0.06),transparent_80%)]" />

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3.5">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-live)]/10 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <PulseIndicator status="active" size="sm" />
              <span>Real-Time Esports Telemetry Architecture</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.1]">
              Engineered For High-Stakes Tournaments
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Ditch slow spreadsheet formulas and manual graphic editors. PointX automates the entire tournament lifecycle in real-time with sub-second precision.
            </p>
          </SlideIn>
        </div>

        {/* Live Match Ticker Bar (Full-Width Cinematic Card) */}
        <FadeIn delay={0.15}>
          <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-white/[0.08] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 backdrop-blur-2xl transition-colors duration-200 hover:border-[var(--accent-primary)]/30">
            
            {/* Left Match Info */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3.5 rounded-2xl bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/30 shrink-0 flex items-center justify-center shadow-md">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base sm:text-lg font-black uppercase text-[var(--text-primary)] font-display tracking-tight">
                    FFWS Pro Invitational • Grand Finals Match 4
                  </span>
                  <Badge variant="live" size="sm" pulse>
                    LIVE ON AIR
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono flex items-center gap-2 flex-wrap">
                  <span>Map: Purgatory (FF-04)</span>
                  <span>•</span>
                  <span>12/12 Teams Active</span>
                  <span>•</span>
                  <span>48 Players Deployed</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">12-9-8-7 Matrix</span>
                </p>
              </div>
            </div>

            {/* Right Leader & Fragger Telemetry Stats */}
            <div className="flex items-center gap-6 sm:gap-8 w-full lg:w-auto justify-between lg:justify-end text-xs font-mono border-t lg:border-t-0 pt-4 lg:pt-0 border-white/[0.08]">
              <div className="text-left lg:text-right space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tournament Leader</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] font-display">Total Gaming</span>
                  <span className="text-xs sm:text-sm font-black text-[var(--accent-primary)] font-mono px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                    68 PTS (2 Booyahs)
                  </span>
                </div>
              </div>

              <div className="h-10 w-px bg-white/[0.1] hidden sm:block" />

              <div className="text-left lg:text-right space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">MVP Top Fragger</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] font-display">TG_Mafia</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    14 KILLS
                  </span>
                </div>
              </div>
            </div>

          </div>
        </FadeIn>

        {/* 4 Feature Energy Pillar Cards (Widescreen Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Pillar 1: Scoring Matrix */}
          <div className="p-7 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-[var(--accent-primary)]/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all shadow-md">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                Instant Auto-Matrix
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                Enter match placements and kills; PointX automatically resolves tie-breakers, applies tier multipliers, and computes overall standings in &lt;0.4s.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Zero spreadsheet errors</span>
            </div>
          </div>

          {/* Pillar 2: OBS Stream Sync */}
          <div className="p-7 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-md">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                OBS Stream Overlays
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                Real-time transparent browser source scoreboards and lower-thirds that auto-update on your live broadcast stream with zero latency.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>1080p & 4K alpha transparency</span>
            </div>
          </div>

          {/* Pillar 3: 4K Graphics Studio */}
          <div className="p-7 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-md">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                4K Posters & Banners
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                Export crisp 3840×2160 overall standings banners, match winner cards, and top fragger posters with single-click PNG & ZIP exports for Instagram and Discord.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-amber-500 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Custom logo & font embeds</span>
            </div>
          </div>

          {/* Pillar 4: Roster & MVP Leaderboard */}
          <div className="p-7 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-[var(--status-live)]/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--status-live)]/15 text-[var(--status-live)] border border-[var(--status-live)]/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--status-live)] group-hover:text-black transition-all shadow-md">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                Player MVPs & Stats
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                Maintain in-game roster handles, kill-per-match ratios, damage contributions, and historical championship performance leaderboards.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[var(--status-live)] font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Granular player telemetry</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default LiveEnergySection;

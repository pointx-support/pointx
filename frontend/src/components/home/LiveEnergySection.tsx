import React from 'react';
import {
  Zap,
  Flame,
  Radio,
  BarChart3,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { PulseIndicator } from '../animation/MicroInteractions';
import { TiltCard } from '../animation/HoverCards';
import { Badge } from '../ui/Badge';

export const LiveEnergySection: React.FC = () => {
  return (
    <section id="live-matrix" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-200">
      
      {/* Background Decorative Ambient Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-live)]/10 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <PulseIndicator status="active" size="sm" />
              <span>Real-Time Esports Telemetry</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
              Engineered For High-Stakes Tournaments
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Ditch slow spreadsheet formulas and manual graphic editors. PointX automates the entire tournament lifecycle in real-time with sub-second precision.
            </p>
          </SlideIn>
        </div>

        {/* Live Match Ticker Bar */}
        <FadeIn delay={0.15}>
          <div className="mb-12 p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 transition-colors">
            
            {/* Left Match Info */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="p-3.5 rounded-2xl bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0 flex items-center justify-center shadow-xs">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm sm:text-base font-black uppercase text-[var(--text-primary)] font-display tracking-tight">
                    FFWS Pro Invitational • Finals Match 4
                  </span>
                  <Badge variant="live" size="sm" pulse>
                    LIVE ON AIR
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono flex items-center gap-2">
                  <span>Map: Purgatory</span>
                  <span>•</span>
                  <span>12/12 Teams Deployed</span>
                  <span>•</span>
                  <span>48 Players Active</span>
                </p>
              </div>
            </div>

            {/* Right Leader & Fragger Telemetry Stats */}
            <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end text-xs font-mono border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--border-subtle)]">
              <div className="text-left lg:text-right space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tournament Leader</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">Total Gaming</span>
                  <span className="text-xs font-black text-[var(--accent-primary)] font-display">(68 Pts)</span>
                </div>
              </div>

              <div className="h-9 w-px bg-[var(--border-subtle)]" />

              <div className="text-left lg:text-right space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">MVP Top Fragger</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--status-info)]" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">TG_Mafia</span>
                  <span className="text-xs font-black text-[var(--status-info)] font-display">(14 Kills)</span>
                </div>
              </div>
            </div>

          </div>
        </FadeIn>

        {/* 4 Feature Energy Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          
          {/* Pillar 1: Scoring Matrix */}
          <TiltCard>
            <div className="h-full p-7 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-[var(--accent-primary)]/5">
              <div>
                <div className="h-13 w-13 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  Instant Auto-Matrix
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                  Enter placements and kill points; PointX instantly resolves tie-breakers, applies multipliers, and calculates overall standings in under 0.4s.
                </p>
              </div>
              <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Zero spreadsheet errors</span>
              </div>
            </div>
          </TiltCard>

          {/* Pillar 2: OBS Stream Sync */}
          <TiltCard>
            <div className="h-full p-7 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--status-info)]/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-[var(--status-info)]/5">
              <div>
                <div className="h-13 w-13 rounded-2xl bg-[var(--status-info)]/15 text-[var(--status-info)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Radio className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  OBS Stream Overlays
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                  Real-time transparent browser source scoreboards and lower-thirds that auto-update on your broadcast without ever touching OBS.
                </p>
              </div>
              <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--status-info)] font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>1080p & 4K alpha channels</span>
              </div>
            </div>
          </TiltCard>

          {/* Pillar 3: 4K Graphics Studio */}
          <TiltCard>
            <div className="h-full p-7 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-amber-400/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-amber-400/5">
              <div>
                <div className="h-13 w-13 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  4K Posters & Banners
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                  Export ultra-crisp overall standings banners, match winner graphics, and top fragger cards with single-click PNG/ZIP export for socials.
                </p>
              </div>
              <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-amber-500 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Custom font & logo embeds</span>
              </div>
            </div>
          </TiltCard>

          {/* Pillar 4: Roster & MVP Leaderboard */}
          <TiltCard>
            <div className="h-full p-7 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--status-live)]/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-[var(--status-live)]/5">
              <div>
                <div className="h-13 w-13 rounded-2xl bg-[var(--status-live)]/15 text-[var(--status-live)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  Player MVPs & Stats
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                  Track player in-game IDs, kill ratios, damage contributions, and match-by-match momentum charts automatically.
                </p>
              </div>
              <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--status-live)] font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Granular player statistics</span>
              </div>
            </div>
          </TiltCard>

        </div>

      </div>
    </section>
  );
};

export default LiveEnergySection;

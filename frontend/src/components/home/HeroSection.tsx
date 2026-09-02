import React, { useState, useEffect } from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Zap,
  Radio,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  LogIn,
  BarChart3,
  Cpu,
  Monitor,
  ChevronRight
} from 'lucide-react';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup?: () => void;
}

const CAPABILITY_CHIPS = [
  { icon: Zap, text: '< 50ms Point Matrix', desc: 'Real-time kill & rank calculations' },
  { icon: Trophy, text: '12-9-8-7 Official Scoring', desc: 'Free Fire World Series rule standard' },
  { icon: Radio, text: 'Live OBS Browser Source', desc: 'Ultra low latency broadcast graphics' },
  { icon: Sparkles, text: '4K Graphics Studio', desc: 'Instant social media tournament posters' },
  { icon: ShieldCheck, text: 'Multi-Admin Governance', desc: 'Role management & audit logging' }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
}) => {
  // Capability Rotator Index
  const [activeChipIndex, setActiveChipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChipIndex((prev) => (prev + 1) % CAPABILITY_CHIPS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const currentChip = CAPABILITY_CHIPS[activeChipIndex];
  const CurrentIcon = currentChip.icon;

  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 sm:px-6 lg:px-12 pt-28 pb-16 transition-colors duration-300">
      
      {/* 1. Cinematic Ambient Lighting & Esports Grid Architecture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-35 dark:opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 208, 0, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 208, 0, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 35%, black 30%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 35%, black 30%, transparent 95%)'
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-1/5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] md:w-[900px] h-[350px] md:h-[450px] bg-[var(--accent-primary)]/12 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-10 w-[380px] h-[380px] bg-[#7D4047]/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Soft Bottom Floor Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-1 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />

      {/* 2. Full-Width Grid Centerpiece */}
      <div className="relative z-10 w-full max-w-[1480px] mx-auto flex flex-col items-center">
        
        {/* Top Status Capsule Badge */}
        <FadeIn delay={0.05}>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] backdrop-blur-2xl text-[var(--text-secondary)] shadow-sm hover:border-[var(--accent-primary)]/40 transition-all cursor-default group mb-4">
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)] animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[var(--text-primary)]">
              OFFICIAL FREE FIRE ESPORTS AUTOMATION ENGINE
            </span>
          </div>
        </FadeIn>

        {/* Flagship Brand Showcase */}
        <FadeIn delay={0.1}>
          <div className="relative flex items-center justify-center my-2 group">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-full blur-3xl group-hover:bg-[var(--accent-primary)]/35 transition-all duration-700" />
            <PointXLogo
              className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain drop-shadow-[0_16px_48px_rgba(0,0,0,0.95)] select-none hover:scale-105 transition-transform duration-500 relative z-10"
              alt="PointX Official Esports Platform"
              withShine={true}
            />
          </div>
        </FadeIn>

        {/* Main Editorial Headline */}
        <SlideIn direction="up" delay={0.15}>
          <div className="max-w-4xl mx-auto space-y-3 px-4 text-center mt-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[var(--text-primary)] font-display uppercase leading-[1.2]">
              AUTOMATE FREE FIRE SCORES & BROADCAST LIVE 4K OVERLAYS
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
              The real-time tournament engine engineered for Free Fire & battle royale esports. Ingest match stats, calculate 12-team matrices in &lt;50ms, and stream seamless overlays to OBS Studio.
            </p>
          </div>
        </SlideIn>

        {/* Sleek High-Tech Telemetry Capability HUD Strip */}
        <SlideIn direction="up" delay={0.2}>
          <div className="mt-6 mb-8 w-full max-w-xl mx-auto px-4">
            <div
              onClick={() => setActiveChipIndex((prev) => (prev + 1) % CAPABILITY_CHIPS.length)}
              className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 p-4 sm:p-5 shadow-lg backdrop-blur-2xl transition-all duration-300 cursor-pointer group"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-primary)]/15 transition-all" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 group-hover:scale-105 group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all duration-300 shadow-sm">
                    <CurrentIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeChipIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-0.5"
                      >
                        <div className="text-xs sm:text-sm font-black text-[var(--text-primary)] font-display uppercase tracking-wider truncate">
                          {currentChip.text}
                        </div>
                        <div className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-mono truncate">
                          {currentChip.desc}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-[var(--accent-primary)] px-2 py-1 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 font-numbers">
                    0{activeChipIndex + 1} // 0{CAPABILITY_CHIPS.length}
                  </span>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-surface-inset)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Segmented Linear Progress Bars */}
              <div className="grid grid-cols-5 gap-1.5 mt-3.5 pt-3 border-t border-[var(--border-subtle)]">
                {CAPABILITY_CHIPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChipIndex(i);
                    }}
                    className="h-1 rounded-full overflow-hidden bg-[var(--border-subtle)] transition-all cursor-pointer relative"
                    aria-label={`Switch to capability ${i + 1}`}
                  >
                    {i === activeChipIndex && (
                      <motion.div
                        layoutId="active-chip-bar"
                        className="h-full w-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SlideIn>

        {/* Primary Action Buttons */}
        <SlideIn direction="up" delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            {/* Enter The Arena Primary CTA */}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_4px_30px_rgba(255,208,0,0.4)] hover:shadow-[0_0_40px_rgba(255,208,0,0.75)] hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 cursor-pointer font-display border border-amber-300/70 group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Zap className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wider">ENTER THE ARENA</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5] text-black group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>

            {/* Organizer Sign In Secondary CTA */}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 hover:bg-[var(--accent-primary)]/10 border border-[var(--border-strong)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-lg hover:shadow-[0_0_28px_rgba(255,208,0,0.3)] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.97] backdrop-blur-xl transition-all duration-300 cursor-pointer font-sans group"
            >
              <LogIn className="h-4 w-4 text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-transform duration-300" />
              <span>Organizer Sign In</span>
            </button>
          </div>
        </SlideIn>

        {/* 3. Widescreen Live Telemetry Showcase Grid */}
        <FadeIn delay={0.3}>
          <div className="mt-14 w-full grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 text-left">
            
            {/* Card 1: Sub-Second Calculation Matrix */}
            <div className="p-5 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3 hover:border-[var(--accent-primary)]/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  0.38ms LATENCY
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Sub-50ms Calculation Engine
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Automated official 12-9-8-7 points matrix with instant tie-breakers, placement multipliers, and kill points.
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Rule standard: FFWS 2026</span>
                <span className="text-[var(--accent-primary)] font-bold">Auto-Ranked</span>
              </div>
            </div>

            {/* Card 2: Live OBS Browser Source Overlay */}
            <div className="p-5 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3 hover:border-cyan-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  <Monitor className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                  OBS STUDIO READY
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Live Stream Overlay Deck
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Zero-latency transparent browser source URL for OBS Studio, vMix, and Twitch live broadcasts.
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Output: 1080p60 / 4K</span>
                <span className="text-cyan-400 font-bold">WebSocket Sync</span>
              </div>
            </div>

            {/* Card 3: 4K Production Banner Studio */}
            <div className="p-5 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  1-CLICK EXPORT
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  4K Social Poster Generator
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Export high-resolution overall standings, match winners, and MVP top-fragger posters in under 1 second.
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Format: 3840×2160 PNG</span>
                <span className="text-emerald-400 font-bold">Embedded Fonts</span>
              </div>
            </div>

          </div>
        </FadeIn>

        {/* 4. Bottom Verified Telemetry Metrics Strip */}
        <FadeIn delay={0.35}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-14 pt-8 border-t border-white/[0.08] text-center w-full">
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-display">&lt; 0.4s</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Calculation Latency</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[var(--accent-primary)] font-display">100%</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Automated Accuracy</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-display">4K UHD</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Broadcast Graphics</p>
            </div>
            <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-display">0 Spreadsheets</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Zero Manual Errors</p>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default HeroSection;

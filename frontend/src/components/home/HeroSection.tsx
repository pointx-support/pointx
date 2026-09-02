import React, { useState, useEffect } from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import {
  Trophy,
  Zap,
  Radio,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Flame,
  LogIn,
  BarChart3,
  Cpu,
  Monitor
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
    }, 2800);
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
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)]/90 border border-white/[0.08] dark:border-white/[0.1] backdrop-blur-2xl text-[var(--text-secondary)] shadow-lg hover:border-[var(--accent-primary)]/40 transition-all cursor-default group mb-4">
            <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono font-bold tracking-[0.18em] uppercase text-[var(--text-primary)]">
              PointX 2.5 • Next-Gen Esports Operating System
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold">
              LIVE ARENA
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

        {/* One-by-One Cycling Capability Pill */}
        <SlideIn direction="up" delay={0.2}>
          <div className="mt-6 mb-8 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveChipIndex((prev) => (prev + 1) % CAPABILITY_CHIPS.length)}
              className="group relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] text-left shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Click to switch capability"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 group-hover:scale-110 group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all">
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-[var(--text-primary)] font-display uppercase tracking-wide flex items-center gap-1.5">
                  <span>{currentChip.text}</span>
                  <span className="text-[9px] font-mono text-[var(--accent-primary)] font-bold px-1.5 py-0.2 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                    {activeChipIndex + 1}/{CAPABILITY_CHIPS.length}
                  </span>
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-mono">
                  {currentChip.desc}
                </span>
              </div>
            </button>

            {/* Micro Navigation Dots */}
            <div className="flex items-center gap-1.5">
              {CAPABILITY_CHIPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveChipIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeChipIndex
                      ? 'w-6 bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)]'
                      : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                  }`}
                  aria-label={`View capability ${i + 1}`}
                />
              ))}
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

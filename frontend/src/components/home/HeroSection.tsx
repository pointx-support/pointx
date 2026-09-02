import React from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import {
  Zap,
  ArrowRight,
  LogIn,
  BarChart3,
  Cpu,
  Monitor
} from 'lucide-react';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-base)] transition-colors duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO VIEWPORT WITH FADED BACKGROUND VIDEO (100% Viewport Isolated)     */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-12 pt-24 pb-16">
        
        {/* Cinematic Background Video with Ultra-Clear Visibility */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <video
            key="hero-bgvideo-v260"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-90 dark:opacity-95 filter saturate-110 contrast-105 brightness-105 transition-opacity duration-700"
          >
            <source src="/bgvideo_v260.mp4?v=2.6.0" type="video/mp4" />
            <source src="/bgvideo.mp4?v=2.6.0" type="video/mp4" />
          </video>

          {/* Subtle Balanced Contrast Scrim for Absolute Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 pointer-events-none" />

          {/* Minimal Bottom Edge Blend (No cloudy white fog over characters) */}
          <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-14 bg-gradient-to-t from-[var(--bg-base)] to-transparent opacity-70 dark:opacity-100 pointer-events-none" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[850px] h-[320px] md:h-[420px] bg-[var(--accent-primary)]/15 rounded-full blur-[140px] pointer-events-none z-0" />

        {/* Hero Centerpiece */}
        <div className="relative z-10 w-full max-w-[1480px] mx-auto flex flex-col items-center text-center">
          
          {/* Top Status Capsule Badge */}
          <FadeIn delay={0.05}>
            <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-black/50 border border-white/25 backdrop-blur-2xl text-zinc-100 shadow-xl hover:border-[#ffd000]/60 transition-all cursor-default group mb-4">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#ffd000] shadow-[0_0_12px_rgba(255,208,0,0.9)] animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.18em] uppercase text-white">
                NEXT-GEN ESPORTS AUTOMATION ENGINE
              </span>
            </div>
          </FadeIn>

          {/* Flagship Brand Logo (Crisp in both Light & Dark themes) */}
          <FadeIn delay={0.1}>
            <div className="relative flex items-center justify-center my-4 sm:my-6 group">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-full blur-3xl group-hover:bg-[var(--accent-primary)]/35 transition-all duration-700 pointer-events-none" />
              <PointXLogo
                className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain select-none hover:scale-105 transition-transform duration-500 relative z-10 drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)]"
                alt="PointX Esports Platform"
                withShine={true}
              />
            </div>
          </FadeIn>

          {/* Main Editorial Headline - Always Radiant & Ultra-Legible White */}
          <SlideIn direction="up" delay={0.15}>
            <div className="max-w-4xl mx-auto space-y-4 px-4 text-center mt-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight font-display uppercase leading-[1.15] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                AUTOMATE ESPORTS SCORES &amp; BROADCAST LIVE 4K OVERLAYS
              </h1>
              <p className="font-display font-bold text-xs sm:text-sm md:text-base text-zinc-100 max-w-2xl mx-auto leading-relaxed tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                The real-time tournament engine engineered for competitive Battle Royale &amp; Esports titles. Ingest match stats, calculate multi-team score matrices in &lt;50ms, and stream seamless overlays to OBS Studio.
              </p>
            </div>
          </SlideIn>

          {/* Primary Action Buttons (Matching Navbar Capsule Theme) */}
          <SlideIn direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto mt-8">
              {/* Enter The Arena Primary CTA */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_8px_32px_rgba(255,208,0,0.4)] hover:shadow-[0_0_40px_rgba(255,208,0,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-display uppercase tracking-wider group overflow-hidden border border-amber-300/80"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Zap className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                <span>ENTER THE ARENA</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
              </button>

              {/* Organizer Sign In Secondary Glass Capsule CTA */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-bold bg-black/50 hover:bg-black/70 border border-white/30 hover:border-[#ffd000]/60 text-white backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-sans group"
              >
                <LogIn className="h-4 w-4 text-[#ffd000] group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                <span>Organizer Sign In</span>
              </button>
            </div>
          </SlideIn>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DEDICATED TELEMETRY CARDS SECTION (Placed Below Video)                 */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-12 py-12 border-t border-[var(--border-subtle)]/60">
        <FadeIn delay={0.1}>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 text-left">
            
            {/* Card 1: Sub-Second Calculation Matrix */}
            <div className="p-6 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-md space-y-3 hover:border-[var(--accent-primary)]/50 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  0.38ms LATENCY
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Sub-50ms Calculation Engine
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Automated competitive points matrix with instant tie-breakers, placement multipliers, and kill points.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Rule standard: Official &amp; Custom Presets</span>
                <span className="text-[var(--accent-primary)] font-bold">Auto-Ranked</span>
              </div>
            </div>

            {/* Card 2: Live OBS Browser Source Overlay */}
            <div className="p-6 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-md space-y-3 hover:border-cyan-500/50 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/25">
                  <Monitor className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30 font-bold">
                  OBS STUDIO READY
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Live Stream Overlay Deck
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Zero-latency transparent browser source URL for OBS Studio, vMix, and Twitch live broadcasts.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Output: 1080p60 / 4K</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">WebSocket Sync</span>
              </div>
            </div>

            {/* Card 3: 4K Production Banner Studio */}
            <div className="p-6 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-md space-y-3 hover:border-emerald-500/50 hover:shadow-lg transition-all group">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  1-CLICK EXPORT
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  4K Social Poster Generator
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Export high-resolution overall standings, match winners, and MVP top-fragger posters in under 1 second.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Format: 3840×2160 PNG</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">Embedded Fonts</span>
              </div>
            </div>

          </div>
        </FadeIn>

        {/* Bottom Verified Telemetry Metrics Strip */}
        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-14 pt-8 border-t border-[var(--border-subtle)] text-center w-full">
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-display">&lt; 0.4s</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Calculation Latency</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-[var(--accent-primary)] font-display">100%</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Automated Accuracy</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-cyan-500 dark:text-cyan-400 font-display">4K UHD</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Broadcast Graphics</p>
            </div>
            <div className="h-8 w-px bg-[var(--border-subtle)] hidden sm:block" />
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-black text-emerald-500 dark:text-emerald-400 font-display">0 Spreadsheets</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Zero Manual Errors</p>
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  );
};

export default HeroSection;

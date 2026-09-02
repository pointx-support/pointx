import React from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { useAuthStore } from '../../store/authStore';
import {
  Zap,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  BarChart3,
  Cpu,
  Monitor
} from 'lucide-react';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup?: () => void;
  onNavigateDashboard?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
  onNavigateDashboard,
}) => {
  const { isAuthenticated, user } = useAuthStore();
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

        {/* ========================================================================= */}
        {/* RECONSTRUCTED HERO MISSION-CONTROL CENTERPIECE                           */}
        {/* ========================================================================= */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          
          {/* Futuristic HUD Framing Container with controlled glass & corner brackets */}
          <div className="relative w-full rounded-3xl md:rounded-[40px] bg-gradient-to-b from-black/50 via-black/35 to-black/60 backdrop-blur-[16px] md:backdrop-blur-[20px] border border-white/[0.14] shadow-[0_32px_80px_rgba(0,0,0,0.75)] px-5 sm:px-10 md:px-14 pt-8 md:pt-10 pb-8 sm:pb-10 transition-all duration-500 overflow-hidden">
            
            {/* Top Micro-Edge Golden Light Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 sm:w-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffd000]/80 to-transparent pointer-events-none" />

            {/* Tactical HUD Corner Crosshairs */}
            <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-[#ffd000]/70 pointer-events-none" />
            <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-[#ffd000]/70 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-[#ffd000]/70 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-[#ffd000]/70 pointer-events-none" />

            {/* Internal Atmospheric Radial Glow for Flagship Logo */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[200px] sm:h-[280px] bg-[#ffd000]/15 rounded-full blur-[100px] pointer-events-none" />

            {/* 1. TOP TELEMETRY STATUS CAPSULE */}
            <FadeIn delay={0.05}>
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-xl shadow-lg mb-4 sm:mb-6">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-black tracking-wider text-emerald-400 uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>LIVE SYSTEM</span>
                </span>
                <span className="text-zinc-600 select-none hidden sm:inline">•</span>
                <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 font-semibold tracking-wider uppercase">
                  0.38MS LATENCY
                </span>
                <span className="text-zinc-600 select-none hidden md:inline">•</span>
                <span className="text-[10px] sm:text-[11px] font-mono text-amber-300 font-semibold tracking-wider uppercase hidden md:inline">
                  OBS 4K BROADCAST
                </span>
              </div>
            </FadeIn>

            {/* 2. FLAGSHIP POINTX BRAND LOGO - MAINTAINING EXACT SAME SCALE & PROMINENCE */}
            <FadeIn delay={0.1}>
              <div className="relative flex items-center justify-center my-2 sm:my-4 group">
                <PointXLogo
                  className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain select-none hover:scale-[1.03] transition-transform duration-500 relative z-10 drop-shadow-[0_20px_48px_rgba(0,0,0,0.85)]"
                  alt="PointX Esports Platform"
                  withShine={true}
                />
              </div>
            </FadeIn>

            {/* 3. REDESIGNED HIGH-IMPACT HEADLINE */}
            <SlideIn direction="up" delay={0.15}>
              <div className="max-w-3xl mx-auto space-y-3 px-2 text-center mt-2 sm:mt-3">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-display uppercase leading-[1.08] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
                  THE REAL-TIME ENGINE <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                    FOR COMPETITIVE ESPORTS
                  </span>
                </h1>

                {/* Subtle Decorative Technical Divider */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-[#ffd000]/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffd000] shadow-[0_0_8px_#ffd000]" />
                  <span className="h-[1px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-[#ffd000]/60" />
                </div>

                {/* 4. CONCISE SUPPORTING DESCRIPTION */}
                <p className="font-sans font-medium text-xs sm:text-sm md:text-base text-zinc-200 max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Automate point tables in &lt;50ms, manage multi-team tournaments with zero manual errors, and stream broadcast-grade 4K overlays directly to OBS Studio.
                </p>
              </div>
            </SlideIn>

            {/* 5. REDESIGNED PRIMARY & SECONDARY ACTION CTAS */}
            <SlideIn direction="up" delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto mt-6 sm:mt-8">
                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={isAuthenticated ? (onNavigateDashboard || onNavigateLogin) : onNavigateLogin}
                  className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-8 sm:px-9 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_10px_35px_rgba(255,208,0,0.45)] hover:shadow-[0_0_45px_rgba(255,208,0,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-display uppercase tracking-wider group overflow-hidden border border-amber-200/90"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  {isAuthenticated ? (
                    <>
                      <LayoutDashboard className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                      <span>ENTER CONSOLE</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                      <span>ENTER THE ARENA</span>
                    </>
                  )}
                  <ArrowRight className="h-4 w-4 stroke-[3] text-black group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
                </button>

                {/* Secondary CTA */}
                <button
                  type="button"
                  onClick={isAuthenticated ? (onNavigateDashboard || onNavigateLogin) : onNavigateLogin}
                  className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold bg-black/60 hover:bg-black/80 border border-white/25 hover:border-[#ffd000]/70 text-white backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-sans group"
                >
                  {isAuthenticated ? (
                    <>
                      <LayoutDashboard className="h-4 w-4 text-[#ffd000] group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                      <span className="truncate max-w-[140px]">{user?.email || 'Dashboard'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 text-[#ffd000] group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                      <span>Organizer Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </SlideIn>

            {/* 6. BOTTOM SYSTEM CAPABILITY TICKER / HUD RIBBON */}
            <FadeIn delay={0.25}>
              <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffd000]" />
                  <span className="font-semibold tracking-wider uppercase">SUB-50MS ENGINE</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="font-semibold tracking-wider uppercase">4K OBS OVERLAYS</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold tracking-wider uppercase">MOBILE REMOTE SYNC</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="font-semibold tracking-wider uppercase">100% ACCURACY</span>
                </div>
              </div>
            </FadeIn>

          </div>

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

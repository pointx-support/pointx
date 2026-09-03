import React, { useState, useEffect, useRef } from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { useAuthStore } from '../../store/authStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  Zap,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Cpu,
  Monitor,
  Trophy,
  Radio,
  Flame
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
  const { isAuthenticated, user, theme } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();

  // Special PointX Logo Theme Transition States
  const [effectiveLogoTheme, setEffectiveLogoTheme] = useState<'light' | 'dark'>(() => theme || 'dark');
  const [logoPhase, setLogoPhase] = useState<'idle' | 'fading_out' | 'fading_in'>('idle');
  const isInitialMount = useRef(true);

  // Requirement 12: Smooth PointX Logo Theme Transition
  // Theme toggle -> Logo smoothly fades/blurs out (0-240ms) -> Theme swaps at 250ms -> Logo smoothly reappears (250-650ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (prefersReducedMotion) {
      setEffectiveLogoTheme(theme);
      setLogoPhase('idle');
      return;
    }

    // Step 1: Smoothly fade and scale down the logo
    setLogoPhase('fading_out');

    // Step 2: Swap the logo asset when completely transparent
    const swapTimer = setTimeout(() => {
      setEffectiveLogoTheme(theme);
      setLogoPhase('fading_in');
    }, 240);

    // Step 3: Complete transition to full radiant state
    const completeTimer = setTimeout(() => {
      setLogoPhase('idle');
    }, 650);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(completeTimer);
    };
  }, [theme, prefersReducedMotion]);

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-500">
      
      {/* ========================================================================= */}
      {/* 1. SOPHISTICATED MINIMALIST BACKGROUND (DUAL-THEME LIGHT & DARK CANVAS)     */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[92vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-12 pt-28 pb-16 overflow-hidden">
        
        {/* Silky-Smooth Organic Ambient Lighting Background (Zero Grids, Zero Dots) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Dark Mode Organic Ambient Aura */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Center Radiant Gold Atmosphere */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] lg:w-[1200px] h-[450px] lg:h-[600px] bg-gradient-to-b from-amber-500/[0.09] via-amber-500/[0.02] to-transparent rounded-full blur-[150px] pointer-events-none" />
            {/* Soft Cyan Broadcast Haze on Upper Right */}
            <div className="absolute top-[15%] right-[0%] w-[500px] lg:w-[750px] h-[400px] lg:h-[550px] bg-gradient-to-b from-sky-500/[0.04] to-transparent rounded-full blur-[140px] pointer-events-none" />
            {/* Deep Horizon Grounding Vignette */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
          </div>

          {/* Light Mode Pure Luminous Canvas */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              !isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Warm Sunrise Ambient Bloom */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] lg:w-[1200px] h-[450px] lg:h-[600px] bg-gradient-to-b from-amber-400/[0.07] via-amber-300/[0.02] to-transparent rounded-full blur-[140px] pointer-events-none" />
            {/* Soft Mist Grounding */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PANORAMIC ASYMMETRICAL MISSION-CONTROL HERO ARCHITECTURE               */}
        {/* ========================================================================= */}
        <div className="relative z-10 w-full max-w-[1480px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* LEFT COLUMN (Col 7): BRAND IDENTITY, NARRATIVE & PRIMARY CTAS       */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
              
              {/* Top Eyebrow Status Capsule */}
              <FadeIn delay={0.05}>
                <div
                  className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-mono backdrop-blur-xl shadow-sm transition-colors duration-300 ${
                    isDark
                      ? 'bg-black/60 border-white/15 text-zinc-300'
                      : 'bg-white/90 border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                    LIVE SYSTEM
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600 select-none">•</span>
                  <span className="font-semibold tracking-wide uppercase">
                    ESPORTS ENGINE V2.6
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600 select-none hidden sm:inline">•</span>
                  <span className="font-semibold tracking-wide uppercase text-amber-600 dark:text-amber-400 hidden sm:inline">
                    OBS 4K READY
                  </span>
                </div>
              </FadeIn>

              {/* Flagship PointX Logo - Maintained at EXACT Large Scale with Smooth Theme Transition */}
              <div className="relative my-2 sm:my-3">
                {/* Logo Backlight Glow */}
                <div
                  className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
                    isDark ? 'bg-amber-400/20' : 'bg-amber-300/25'
                  }`}
                />

                {/* Animated Logo Container with Requirement 12 Transition Behavior */}
                <div
                  className={`relative z-10 transition-all duration-300 ease-out select-none ${
                    logoPhase === 'fading_out'
                      ? 'opacity-0 scale-95 translate-y-2 blur-[8px]'
                      : logoPhase === 'fading_in'
                      ? 'opacity-100 scale-100 translate-y-0 blur-0'
                      : 'opacity-100 scale-100 translate-y-0 blur-0'
                  }`}
                  style={{ willChange: 'opacity, transform, filter' }}
                >
                  <PointXLogo
                    className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain hover:scale-[1.02] transition-transform duration-300 drop-shadow-[0_16px_36px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_20px_48px_rgba(0,0,0,0.85)]"
                    alt="PointX Esports Infrastructure Platform"
                    forceTheme={effectiveLogoTheme}
                    withShine={true}
                  />
                </div>
              </div>

              {/* Bold Editorial Headline */}
              <SlideIn direction="up" delay={0.15}>
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight font-display uppercase leading-[1.08] drop-shadow-sm">
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>
                      THE REAL-TIME ENGINE
                    </span>{' '}
                    <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 dark:from-amber-300 dark:via-yellow-200 dark:to-amber-400">
                      FOR ESPORTS TOURNAMENTS
                    </span>
                  </h1>

                  {/* Redesigned Description with Plus Jakarta Sans Font */}
                  <p
                    className={`font-normal text-sm sm:text-base md:text-lg max-w-xl leading-relaxed tracking-[-0.012em] ${
                      isDark ? 'text-zinc-300/90' : 'text-slate-700'
                    }`}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}
                  >
                    Automate points tables in &lt;50ms, manage multi-team championship brackets with zero manual errors, and stream broadcast-grade 4K overlays directly to OBS Studio.
                  </p>
                </div>
              </SlideIn>

              {/* Primary & Secondary Action Buttons */}
              <SlideIn direction="up" delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 w-full sm:w-auto pt-2">
                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={isAuthenticated ? (onNavigateDashboard || onNavigateLogin) : onNavigateLogin}
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_8px_30px_rgba(255,208,0,0.4)] hover:shadow-[0_0_40px_rgba(255,208,0,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-display uppercase tracking-wider group overflow-hidden border border-amber-300/80"
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
                    className={`relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 rounded-2xl text-xs sm:text-sm font-bold border backdrop-blur-xl shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer font-sans group ${
                      isDark
                        ? 'bg-black/60 hover:bg-black/80 border-white/20 hover:border-amber-400/60 text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-300 hover:border-amber-500 text-slate-900 shadow-sm'
                    }`}
                  >
                    {isAuthenticated ? (
                      <>
                        <LayoutDashboard className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                        <span className="truncate max-w-[140px]">{user?.email || 'Dashboard'}</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                        <span>Organizer Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </SlideIn>

              {/* Platform Game Coverage Rail */}
              <FadeIn delay={0.25}>
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span className="uppercase text-[10px] tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                    Official Protocols:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold">
                      Free Fire
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold">
                      BGMI
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold">
                      PUBG Mobile
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold">
                      Valorant
                    </span>
                  </div>
                </div>
              </FadeIn>

            </div>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* RIGHT COLUMN (Col 5): PRO ESPORTS BROADCAST OVERLAY MONITOR         */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 w-full">
              <FadeIn delay={0.2}>
                {/* Clean Floating OBS Broadcast Window Frame */}
                <div
                  className={`relative w-full rounded-2xl border backdrop-blur-2xl transition-all duration-300 overflow-hidden shadow-2xl ${
                    isDark
                      ? 'bg-[#0e121b]/95 border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.7)]'
                      : 'bg-white/95 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
                  }`}
                >
                  {/* Top Window Bar: Minimalist Studio Chrome */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-black/[0.03] dark:bg-black/30">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] ml-1">
                        OBS Studio • Live Overlay
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold border border-rose-500/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        LIVE ON AIR
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] hidden sm:inline">
                        4K 60FPS
                      </span>
                    </div>
                  </div>

                  {/* Tournament Title Header */}
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">
                        FREE FIRE CHAMPIONSHIP 2026
                      </div>
                      <h2 className="text-sm sm:text-base font-black text-[var(--text-primary)] font-display tracking-tight mt-0.5">
                        Match #3 Standings • Bermuda
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                      ⚡ 0.38ms Engine
                    </span>
                  </div>

                  {/* Pro Standings Leaderboard Table */}
                  <div className="px-4 py-2 space-y-2">
                    {/* #1 Winner Row (Total Gaming) */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-400/40 shadow-sm'
                        : 'bg-gradient-to-r from-amber-100/60 via-amber-50/30 to-transparent border-amber-400/50 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-black text-sm flex items-center justify-center font-numbers shadow-sm">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
                              Total Gaming Esports
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                              TG
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                            <span className="text-rose-500 font-bold inline-flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              10 Kills
                            </span>
                            <span>•</span>
                            <span>Rank 1 (+12)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-lg font-black font-numbers text-amber-500">
                          22 <span className="text-[10px] font-sans text-[var(--text-secondary)]">PTS</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          👑 BOOYAH!
                        </span>
                      </div>
                    </div>

                    {/* #2 Row (GodLike) */}
                    <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50/70 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-zinc-200/50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center font-numbers">
                          2
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            GodLike Esports <span className="text-[10px] text-zinc-400 font-mono">[GL]</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">5 Kills</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-numbers text-[var(--text-primary)]">14 PTS</span>
                      </div>
                    </div>

                    {/* #3 Row (Team SouL) */}
                    <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50/70 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-zinc-200/50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center font-numbers">
                          3
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            Team SouL <span className="text-[10px] text-zinc-400 font-mono">[SOUL]</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">3 Kills</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-numbers text-[var(--text-primary)]">11 PTS</span>
                      </div>
                    </div>

                    {/* #4 Row (Blind eSports) */}
                    <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50/70 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-zinc-200/50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center font-numbers">
                          4
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            Blind eSports <span className="text-[10px] text-zinc-400 font-mono">[BLIND]</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">2 Kills</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-numbers text-[var(--text-primary)]">9 PTS</span>
                      </div>
                    </div>
                  </div>

                  {/* Sleek Stream Link Bar Footer */}
                  <div className="p-3 mx-4 my-3 rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2 truncate text-[var(--text-secondary)]">
                      <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">pointx.in/obs/live?id=ffws-2026</span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                      Copy OBS Link
                    </span>
                  </div>

                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DEDICATED TELEMETRY CARDS SECTION (Placed Below Video Viewport)        */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-12 py-12 border-t border-[var(--border-subtle)]/60">
        <FadeIn delay={0.1}>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 text-left">
            
            {/* Card 1: Sub-Second Calculation Matrix */}
            <div className={`relative p-6 rounded-3xl border backdrop-blur-xl transition-all duration-300 space-y-3 group overflow-hidden ${
              isDark
                ? 'bg-[#0d111a]/85 border-white/[0.12] hover:border-amber-400/50 shadow-[0_16px_40px_rgba(0,0,0,0.4)]'
                : 'bg-white/95 border-slate-200/90 hover:border-amber-400/60 shadow-[0_12px_32px_rgba(15,23,42,0.06)]'
            }`}>
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  0.38MS LATENCY
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Sub-50ms Calculation Engine
                </h3>
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Automated competitive points matrix with instant tie-breakers, placement multipliers, and kill points.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Rule standard: Official &amp; Custom Presets</span>
                <span className="text-[var(--accent-primary)] font-bold">Auto-Ranked</span>
              </div>
            </div>

            {/* Card 2: Live OBS Browser Source Overlay */}
            <div className={`relative p-6 rounded-3xl border backdrop-blur-xl transition-all duration-300 space-y-3 group overflow-hidden ${
              isDark
                ? 'bg-[#0d111a]/85 border-white/[0.12] hover:border-cyan-400/50 shadow-[0_16px_40px_rgba(0,0,0,0.4)]'
                : 'bg-white/95 border-slate-200/90 hover:border-cyan-400/60 shadow-[0_12px_32px_rgba(15,23,42,0.06)]'
            }`}>
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Zero-latency transparent browser source URL for OBS Studio, vMix, and YouTube/Twitch live broadcasts.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Output: 1080p60 / 4K</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">WebSocket Sync</span>
              </div>
            </div>

            {/* Card 3: 4K Production Banner Studio */}
            <div className={`relative p-6 rounded-3xl border backdrop-blur-xl transition-all duration-300 space-y-3 group overflow-hidden ${
              isDark
                ? 'bg-[#0d111a]/85 border-white/[0.12] hover:border-emerald-400/50 shadow-[0_16px_40px_rgba(0,0,0,0.4)]'
                : 'bg-white/95 border-slate-200/90 hover:border-emerald-400/60 shadow-[0_12px_32px_rgba(15,23,42,0.06)]'
            }`}>
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                  <Trophy className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  1-CLICK EXPORT
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  4K Social Poster Generator
                </h3>
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
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
              <p className="text-2xl sm:text-3xl font-black text-amber-500 font-display">100%</p>
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
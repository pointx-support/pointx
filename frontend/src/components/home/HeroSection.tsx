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
  Activity,
  Trophy,
  Flame,
  Radio,
  ShieldCheck
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
        
        {/* Simple, Ultra-Clean Vector Tech Grid & Ambient Aura Canvas (Zero Video Lag) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Dark Mode Ambient Canvas */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Precision 48px Esports Linear Grid with Smooth Radial Vignette Mask */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse 75% 65% at 50% 30%, black 20%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 30%, black 20%, transparent 85%)'
              }}
            />
            {/* Primary Golden Atmospheric Core Bloom */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[700px] lg:w-[1000px] h-[400px] lg:h-[550px] bg-gradient-to-b from-amber-500/12 via-amber-500/4 to-transparent rounded-full blur-[140px] pointer-events-none" />
            {/* Secondary Cyan Broadcast Energy Bloom */}
            <div className="absolute top-[25%] right-[5%] w-[450px] lg:w-[600px] h-[350px] bg-gradient-to-b from-cyan-500/6 to-transparent rounded-full blur-[120px] pointer-events-none" />
          </div>

          {/* Light Mode Radiant Canvas */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              !isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Crisp 32px Slate Dot Matrix with Smooth Radial Fade */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.08) 1.2px, transparent 1.2px)',
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(ellipse 75% 65% at 50% 30%, black 25%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 30%, black 25%, transparent 85%)'
              }}
            />
            {/* Soft Warm Sun-Aura Core Bloom */}
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[700px] lg:w-[1000px] h-[380px] lg:h-[500px] bg-gradient-to-b from-amber-400/10 via-amber-300/3 to-transparent rounded-full blur-[120px] pointer-events-none" />
            {/* Subtle Horizon Mist */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
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
            {/* RIGHT COLUMN (Col 5): COMPLETELY REDESIGNED BROADCAST STREAM DECK   */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 w-full">
              <FadeIn delay={0.2}>
                {/* Master Hardware-Grade Telemetry Console Frame */}
                <div
                  className={`relative w-full rounded-3xl p-5 sm:p-6 border backdrop-blur-2xl transition-all duration-300 space-y-4 overflow-hidden group ${
                    isDark
                      ? 'bg-[#0c1017]/95 border-white/[0.12] shadow-[0_25px_65px_rgba(0,0,0,0.75)] hover:border-amber-400/40'
                      : 'bg-white/95 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:border-amber-400/60'
                  }`}
                >
                  {/* Subtle Laser Rim Highlight Line across Top Edge */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none" />

                  {/* Corner Accent Screws / Hardware Crosshairs */}
                  <div className="absolute top-3 left-4 text-[9px] font-mono text-zinc-400/40 select-none pointer-events-none">+</div>
                  <div className="absolute top-3 right-4 text-[9px] font-mono text-zinc-400/40 select-none pointer-events-none">+</div>

                  {/* 1. Console Header: Stream Controller & Live Signal */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-sm">
                        <Activity className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-primary)]">
                            BROADCAST STREAM DECK
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-[10px] font-mono font-bold text-amber-500 border border-amber-500/20">
                            v2.6
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono block">
                          PointX Real-Time WebSocket Engine
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-mono font-bold">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        0MS LATENCY
                      </span>
                    </div>
                  </div>

                  {/* 2. Interactive Broadcast Tournament Scoreboard HUD (Redesigned) */}
                  <div
                    className={`relative rounded-2xl p-4 border transition-all overflow-hidden ${
                      isDark
                        ? 'bg-gradient-to-br from-[#121722] via-[#0e121b] to-[#121722] border-amber-400/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
                        : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30 border-amber-400/40 shadow-sm'
                    }`}
                  >
                    {/* Atmospheric Gold Beacon in Background */}
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* HUD Header Bar */}
                    <div className="flex items-center justify-between text-xs font-mono mb-3">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-bold text-[var(--text-primary)] tracking-wide">
                          GRAND FINALS • MATCH #3
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        AUTO-CALCULATED
                      </span>
                    </div>

                    {/* Champion Rank #1 Showcase Row */}
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-white/10 dark:border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Metallic Gold Rank Badge */}
                        <div className="relative shrink-0">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-black font-black text-base flex flex-col items-center justify-center font-numbers shadow-[0_4px_14px_rgba(245,158,11,0.4)] border border-amber-200">
                            <span className="text-[9px] leading-none text-black/70">#</span>
                            <span className="leading-none text-sm font-black">1</span>
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black tracking-tight text-[var(--text-primary)] font-display truncate">
                              Total Gaming Esports
                            </span>
                            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                              TG
                            </span>
                          </div>

                          {/* Stat Chips */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono flex-wrap">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                              <Flame className="h-3 w-3" />
                              10 Kills (+10)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                              Rank 1 (+12)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Points Callout */}
                      <div className="text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-black font-numbers tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 drop-shadow-sm">
                          22 <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">PTS</span>
                        </div>
                        <span className="inline-block text-[10px] font-mono font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                          BOOYAH!
                        </span>
                      </div>
                    </div>

                    {/* Secondary Multi-Team Lobby Preview (Showing Live Point Distribution) */}
                    <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)]/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-400 font-bold">#2</span>
                          <span className="font-semibold text-[var(--text-primary)]">GodLike Esports</span>
                          <span className="text-zinc-500">[GL]</span>
                        </span>
                        <span className="font-numbers font-bold text-zinc-700 dark:text-zinc-300">
                          14 PTS <span className="text-zinc-400">(5K + 9P)</span>
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-[64%]" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Three High-Tech Telemetry Performance Modules */}
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#121620] border-white/10 hover:border-amber-400/40 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-400/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
                          <Cpu className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-sm font-black font-numbers text-[var(--text-primary)]">&lt; 0.38ms</div>
                      <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                        Math Engine
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#121620] border-white/10 hover:border-cyan-400/40 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-cyan-400/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1 rounded-lg bg-cyan-500/15 text-cyan-500">
                          <Monitor className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-sm font-black font-numbers text-[var(--text-primary)]">4K 60FPS</div>
                      <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                        OBS Source
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#121620] border-white/10 hover:border-emerald-400/40 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-400/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-500">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-sm font-black font-numbers text-[var(--text-primary)]">100.0%</div>
                      <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                        Zero Errors
                      </div>
                    </div>
                  </div>

                  {/* 4. Stream Source URL & Live Stream Indicator Rail */}
                  <div className="pt-2.5 flex items-center justify-between text-[11px] font-mono border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate text-[var(--text-secondary)]">
                        pointx.in/obs/live?key=arena-ffws
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold text-[10px]">
                      Ready to Stream
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
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PointXLogo } from '../ui/PointXLogo';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { useAuthStore } from '../../store/authStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../lib/haptics';
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

  // Rotating Championship Value Propositions (Stable min-height = 0 Layout Shift, No Clipping)
  const ROTATING_HEADLINES = [
    {
      line1: 'THE REAL-TIME ENGINE',
      line2: 'FOR ESPORTS TOURNAMENTS',
    },
    {
      line1: 'INSTANT LEADERBOARDS',
      line2: '& AUTOMATED SCORING',
    },
    {
      line1: 'BROADCAST 4K OVERLAYS',
      line2: 'DIRECT TO OBS STUDIO',
    },
    {
      line1: 'ZERO MANUAL ERRORS',
      line2: 'FOR TOURNAMENT BRACKETS',
    },
  ];

  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setHeadlineIdx((prev) => (prev + 1) % ROTATING_HEADLINES.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-500">
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC ESPORTS ARENA VOLUMETRIC STAGE LIGHTING (PRO BROADCAST AURA)  */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[92vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-12 pt-32 sm:pt-36 pb-16 overflow-hidden">
        
        {/* Dynamic Volumetric Arena Lighting Rig (Zero Childish Particles, 100% Pro Arena Drama) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Dark Mode: Grand Finals Arena Stage Lighting */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Left Stage Volumetric Spotlight Beam (Sweeping Angled Beam) */}
            <div className="absolute -top-24 -left-16 w-[550px] lg:w-[750px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-amber-400/[0.24] via-amber-500/[0.07] to-transparent rounded-full blur-[70px] animate-spotlight-left pointer-events-none" />

            {/* Right Stage Volumetric Spotlight Beam (Sweeping Electric Cyan Beam) */}
            <div className="absolute -top-24 -right-16 w-[500px] lg:w-[700px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-cyan-400/[0.2] via-sky-500/[0.05] to-transparent rounded-full blur-[70px] animate-spotlight-right pointer-events-none" />

            {/* Center Arena Championship Horizon Pulse Core */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] lg:w-[1150px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-b from-amber-500/[0.22] via-amber-400/[0.06] to-transparent rounded-full blur-[110px] animate-horizon-glow pointer-events-none" />

            {/* Dynamic Stage Floor Moving Beam Sweep */}
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[850px] lg:w-[1350px] h-[300px] lg:h-[400px] bg-gradient-to-r from-transparent via-amber-400/[0.14] to-transparent rounded-full blur-[90px] animate-beam-sweep pointer-events-none" />

            {/* Deep Stage Floor Grounding Scrim */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
          </div>

          {/* Light Mode: Luxury Architectural Sunbeam & Stage Illumination */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              !isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Left Warm Sunbeam Sweep */}
            <div className="absolute -top-24 -left-16 w-[550px] lg:w-[750px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-amber-400/[0.18] via-amber-300/[0.05] to-transparent rounded-full blur-[65px] animate-spotlight-left pointer-events-none" />

            {/* Right Ambient Cerulean Beam */}
            <div className="absolute -top-24 -right-16 w-[500px] lg:w-[700px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-sky-400/[0.12] to-transparent rounded-full blur-[65px] animate-spotlight-right pointer-events-none" />

            {/* Center Radiant Core */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] lg:w-[1150px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-b from-amber-400/[0.18] via-amber-300/[0.05] to-transparent rounded-full blur-[100px] animate-horizon-glow pointer-events-none" />

            {/* Deep Horizon Mist Grounding */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
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
                  className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs backdrop-blur-xl shadow-sm transition-colors duration-300 ${
                    isDark
                      ? 'bg-black/60 border-white/15 text-zinc-300'
                      : 'bg-white/90 border-slate-300 text-slate-800 shadow-sm'
                  }`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-extrabold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                    LIVE SYSTEM
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600 select-none">•</span>
                  <span className="font-bold tracking-wider uppercase">
                    ESPORTS ENGINE V2.6
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600 select-none hidden sm:inline">•</span>
                  <span className="font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 hidden sm:inline">
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

                {/* Telemetry Radar Pulse Waves (Active Transmission Field) */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border pointer-events-none animate-radar-slow ${isDark ? 'border-amber-400/25' : 'border-amber-500/15'}`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] sm:w-[320px] h-[220px] sm:h-[320px] rounded-full border pointer-events-none animate-radar-fast ${isDark ? 'border-amber-400/35' : 'border-amber-500/20'}`} />

                {/* Animated Logo Container with Zero Black Shade in Light Theme */}
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
                    className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain hover:scale-[1.02] transition-transform duration-300 drop-shadow-none dark:drop-shadow-[0_20px_48px_rgba(0,0,0,0.85)]"
                    alt="PointX Esports Infrastructure Platform"
                    forceTheme={effectiveLogoTheme}
                    withShine={true}
                  />
                </div>
              </div>

              {/* Bold Editorial Headline with Smooth Rotating Sentences & Zero Layout Shift */}
              <SlideIn direction="up" delay={0.15}>
                <div className="space-y-3">
                  {/* Fixed-Height Display Container: Zero Shift & Zero Disturbance of Elements */}
                  <div className="h-[105px] sm:h-[88px] md:h-[102px] lg:h-[118px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={headlineIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[48px] font-black uppercase tracking-[-0.03em] leading-[1.12] drop-shadow-sm"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>
                          {ROTATING_HEADLINES[headlineIdx].line1}
                        </span>{' '}
                        <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 dark:from-amber-300 dark:via-yellow-200 dark:to-amber-400">
                          {ROTATING_HEADLINES[headlineIdx].line2}
                        </span>
                      </motion.h1>
                    </AnimatePresence>
                  </div>

                  {/* Refined Supporting Narrative with Luxury Outfit Typography */}
                  <p
                    className={`font-normal text-sm sm:text-base md:text-lg max-w-xl leading-relaxed tracking-[-0.015em] ${
                      isDark ? 'text-zinc-300/90' : 'text-slate-700'
                    }`}
                    style={{
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    Automate points tables in &lt;50ms, manage multi-team championship brackets with zero manual errors, and stream broadcast-grade 4K overlays directly to OBS Studio.
                  </p>
                </div>
              </SlideIn>

              {/* Primary & Secondary Action Buttons with Bold Clean Outfit Typography */}
              <SlideIn direction="up" delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 w-full sm:w-auto pt-2">
                  {/* Primary CTA: Enter the Arena / Enter Console */}
                  <button
                    type="button"
                    onClick={() => {
                      haptics.medium();
                      if (isAuthenticated) {
                        (onNavigateDashboard || onNavigateLogin)();
                      } else {
                        onNavigateLogin();
                      }
                    }}
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_8px_30px_rgba(255,208,0,0.4)] hover:shadow-[0_0_40px_rgba(255,208,0,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer uppercase tracking-wider group overflow-hidden border border-amber-300/80"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    {isAuthenticated ? (
                      <>
                        <LayoutDashboard className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                        <span className="font-black">ENTER CONSOLE</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-black text-black group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                        <span className="font-black">ENTER THE ARENA</span>
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 stroke-[3] text-black group-hover:translate-x-1 transition-transform duration-300 shrink-0" />
                  </button>

                  {/* Secondary CTA: Organizer Sign In / Dashboard */}
                  <button
                    type="button"
                    onClick={() => {
                      haptics.medium();
                      if (isAuthenticated) {
                        (onNavigateDashboard || onNavigateLogin)();
                      } else {
                        onNavigateLogin();
                      }
                    }}
                    className={`relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 rounded-2xl text-xs sm:text-sm font-bold border backdrop-blur-xl shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group ${
                      isDark
                        ? 'bg-black/60 hover:bg-black/80 border-white/20 hover:border-amber-400/60 text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-300 hover:border-amber-500 text-slate-900 shadow-sm'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {isAuthenticated ? (
                      <>
                        <LayoutDashboard className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                        <span className="truncate max-w-[140px] uppercase font-bold">{user?.email || 'Dashboard'}</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                        <span className="uppercase font-bold tracking-wide">Organizer Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </SlideIn>

              {/* Platform Game Coverage Rail */}
              <FadeIn delay={0.25}>
                <div
                  className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-500 dark:text-zinc-400"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <span className="uppercase text-xs tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                    Official Protocols:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="px-3 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold tracking-wide">
                      Free Fire
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold tracking-wide">
                      BGMI
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold tracking-wide">
                      PUBG Mobile
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-zinc-200/60 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-300 font-bold tracking-wide">
                      Valorant
                    </span>
                  </div>
                </div>
              </FadeIn>

            </div>

            {/* ─────────────────────────────────────────────────────────────────── */}
            {/* RIGHT COLUMN (Col 5): REDESIGNED LIVE TOURNAMENT COMMAND HUB        */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 w-full">
              <FadeIn delay={0.2}>
                {/* Master Holographic Arena Command Card */}
                <div
                  className={`relative w-full rounded-3xl border backdrop-blur-2xl transition-all duration-300 overflow-hidden shadow-2xl ${
                    isDark
                      ? 'bg-[#0a0d14]/95 border-white/[0.14] shadow-[0_30px_70px_rgba(0,0,0,0.8)] hover:border-amber-400/40'
                      : 'bg-white/95 border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.1)] hover:border-amber-400/60'
                  }`}
                >
                  {/* Top Golden Laser Accent Bar */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none" />

                  {/* 1. Deck Header: Match Telemetry & Status */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] bg-black/[0.02] dark:bg-black/40">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span
                        className="text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        LIVE BROADCAST FEED
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)]"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 uppercase tracking-wide">
                        BERMUDA • MATCH 3/6
                      </span>
                      <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 uppercase tracking-wide">
                        4K 60FPS
                      </span>
                    </div>
                  </div>

                  {/* 2. Grand Champion Showcase Pod */}
                  <div className="p-5 space-y-4">
                    <div
                      className={`relative p-4 sm:p-5 rounded-2xl border transition-all overflow-hidden ${
                        isDark
                          ? 'bg-gradient-to-br from-[#141a27] via-[#0d111a] to-[#121622] border-amber-400/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]'
                          : 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-400/40 shadow-sm'
                      }`}
                    >
                      {/* Ambient Golden Radial Beacon */}
                      <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10">
                        {/* Match Title & Auto-Calculated Indicator */}
                        <div
                          className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-secondary)]"
                          style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                          <span className="text-amber-500 font-extrabold flex items-center gap-1.5">
                            <Trophy className="h-4 w-4" />
                            FREE FIRE WORLD SERIES
                          </span>
                          <span className="text-emerald-500 font-black">
                            AUTO-RANKED #1
                          </span>
                        </div>

                        {/* Champion Team & Score Row */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Gold Crown Trophy Rank Badge */}
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-black flex flex-col items-center justify-center font-black shadow-[0_4px_16px_rgba(245,158,11,0.45)] border border-amber-200 shrink-0">
                              <span className="text-xs leading-none">👑</span>
                              <span
                                className="text-lg leading-none font-black mt-0.5"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                              >
                                #1
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3
                                  className="text-base sm:text-lg font-black tracking-wide uppercase text-[var(--text-primary)] truncate"
                                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                >
                                  Total Gaming
                                </h3>
                                <span
                                  className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-bold border border-amber-500/25"
                                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                >
                                  TG
                                </span>
                              </div>

                              {/* Combat Frag Stat Chips */}
                              <div
                                className="flex items-center gap-2 mt-1.5 text-xs font-bold flex-wrap"
                                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                              >
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 tracking-wide">
                                  <Flame className="h-3 w-3" />
                                  10 KILLS (+10)
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 tracking-wide">
                                  RANK 1 (+12)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Big Glowing Booyah Points Readout */}
                          <div className="text-right shrink-0">
                            <div
                              className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 leading-none"
                              style={{ fontFamily: "'Rajdhani', sans-serif" }}
                            >
                              22 <span className="text-sm text-[var(--text-secondary)]">PTS</span>
                            </div>
                            <span
                              className="inline-block text-xs font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mt-1"
                              style={{ fontFamily: "'Rajdhani', sans-serif" }}
                            >
                              BOOYAH!
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* 3. Live Lobby Rollup: Dynamic Standings Bar */}
                    <div
                      className="p-3 rounded-xl border bg-black/[0.02] dark:bg-black/30 border-[var(--border-subtle)] space-y-2"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <span className="text-zinc-400 font-black">#2</span>
                          <span className="uppercase tracking-wide">GodLike Esports</span>
                          <span className="text-zinc-500 text-[11px]">[GL]</span>
                        </div>
                        <div className="text-right text-[var(--text-secondary)]">
                          <span className="font-black text-sm text-[var(--text-primary)]">14 PTS</span>{' '}
                          <span className="text-[11px] text-zinc-400">(5 Kills)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[var(--border-subtle)]/50">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <span className="text-zinc-400 font-black">#3</span>
                          <span className="uppercase tracking-wide">Team SouL</span>
                          <span className="text-zinc-500 text-[11px]">[SOUL]</span>
                        </div>
                        <div className="text-right text-[var(--text-secondary)]">
                          <span className="font-black text-sm text-[var(--text-primary)]">11 PTS</span>{' '}
                          <span className="text-[11px] text-zinc-400">(3 Kills)</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Stream Source URL & Telemetry Dock */}
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2 min-w-0 text-[var(--text-secondary)] font-mono">
                        <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse shrink-0" />
                        <span className="truncate text-[11px]">
                          pointx.in/obs/live?key=ffws-2026
                        </span>
                      </div>
                      <span
                        className="shrink-0 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px] border border-amber-500/25"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        ⚡ 0.38MS CALC ENGINE
                      </span>
                    </div>

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
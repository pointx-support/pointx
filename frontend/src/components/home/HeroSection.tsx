import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PointXLogo } from '../ui/PointXLogo';
import { Silk } from '../ui/Silk';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { useAuthStore } from '../../store/authStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../lib/haptics';
import {
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Monitor,
  Trophy,
  Smartphone,
  Palette,
} from 'lucide-react';
import { LandingFeaturesShowcase } from './LandingFeaturesShowcase';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup?: () => void;
  onNavigateDashboard?: () => void;
}

const HeroSectionComponent: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
  onNavigateDashboard,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userEmail = useAuthStore((s) => s.user?.email);
  const prefersReducedMotion = useReducedMotion();

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
    <div className="relative w-full overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC ESPORTS ARENA VOLUMETRIC STAGE LIGHTING (PRO BROADCAST AURA)  */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[92vh] lg:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-12 pt-32 sm:pt-36 pb-16 overflow-hidden">
        
        {/* Dynamic Volumetric Arena Lighting Rig with Silk Wave Shader Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Animated Silk Waves Shader with smooth WebGL uniform transition */}
          <div className="absolute inset-0 transition-opacity duration-200 ease-out opacity-40 dark:opacity-20">
            <Silk
              speed={5}
              scale={1}
              color="#ffdede"
              noiseIntensity={1.5}
              rotation={0}
              className="w-full h-full"
            />
          </div>

          {/* Left Stage Volumetric Spotlight Beam (Sweeping Angled Beam) */}
          <div className="absolute -top-24 -left-16 w-[550px] lg:w-[750px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-amber-400/[0.22] via-amber-500/[0.06] to-transparent rounded-full blur-[65px] animate-spotlight-left pointer-events-none" />

          {/* Right Stage Volumetric Spotlight Beam (Sweeping Electric Cyan Beam) */}
          <div className="absolute -top-24 -right-16 w-[500px] lg:w-[700px] h-[950px] lg:h-[1300px] bg-gradient-to-b from-cyan-400/[0.18] via-sky-500/[0.05] to-transparent rounded-full blur-[65px] animate-spotlight-right pointer-events-none" />

          {/* Center Arena Championship Horizon Pulse Core */}
          <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] lg:w-[1150px] h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-b from-amber-500/[0.2] via-amber-400/[0.05] to-transparent rounded-full blur-[85px] animate-horizon-glow pointer-events-none" />

          {/* Dynamic Stage Floor Moving Beam Sweep */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[850px] lg:w-[1350px] h-[300px] lg:h-[400px] bg-gradient-to-r from-transparent via-amber-400/[0.13] to-transparent rounded-full blur-[75px] animate-beam-sweep pointer-events-none" />

          {/* Deep Stage Floor Grounding Scrim */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none" />
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
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs backdrop-blur-xl shadow-sm bg-white/90 dark:bg-black/60 border-slate-300 dark:border-white/15 text-slate-800 dark:text-zinc-300"
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
                  className="absolute inset-0 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 bg-amber-300/25 dark:bg-amber-400/20"
                />

                {/* Telemetry Radar Pulse Waves (Active Transmission Field) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border pointer-events-none animate-radar-slow border-amber-500/15 dark:border-amber-400/25" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] sm:w-[320px] h-[220px] sm:h-[320px] rounded-full border pointer-events-none animate-radar-fast border-amber-500/20 dark:border-amber-400/35" />

                {/* Animated Logo Container with Zero Black Shade in Light Theme */}
                <div className="relative z-10 select-none">
                  <PointXLogo
                    className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] object-contain hover:scale-[1.02] transition-transform duration-300 drop-shadow-none dark:drop-shadow-[0_20px_48px_rgba(0,0,0,0.85)]"
                    alt="PointX Esports Infrastructure Platform"
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
                        <span className="text-slate-900 dark:text-white">
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
                    className="font-normal text-sm sm:text-base md:text-lg max-w-xl leading-relaxed tracking-[-0.015em] text-slate-700 dark:text-zinc-300/90"
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
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_8px_30px_rgba(255,208,0,0.4)] hover:shadow-[0_0_40px_rgba(255,208,0,0.65)] hover:scale-105 active:scale-95 transition-[transform,box-shadow] duration-200 cursor-pointer uppercase tracking-wider group overflow-hidden border border-amber-300/80"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    <span className="relative z-10 flex items-center gap-2">
                      {isAuthenticated ? (
                        <>
                          <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 fill-black shrink-0" />
                          <span>ENTER CONSOLE</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 fill-black shrink-0" />
                          <span>START TOURNAMENT</span>
                        </>
                      )}
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform shrink-0" />
                    </span>
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
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 rounded-2xl text-xs sm:text-sm font-bold border backdrop-blur-xl shadow-md hover:scale-105 active:scale-95 transition-[transform,box-shadow,border-color,background-color] duration-200 cursor-pointer group bg-white dark:bg-black/60 hover:bg-slate-100 dark:hover:bg-black/80 border-slate-300 dark:border-white/20 hover:border-amber-500 dark:hover:border-amber-400/60 text-slate-900 dark:text-white shadow-sm"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {isAuthenticated ? (
                      <>
                        <LayoutDashboard className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-300 shrink-0" />
                        <span className="truncate max-w-[140px] uppercase font-bold">{userEmail || 'Dashboard'}</span>
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
            {/* RIGHT COLUMN (Col 5): INTERACTIVE FEATURES SHOWCASE (OBS, REMOTE, STUDIO) */}
            {/* ─────────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-5 w-full">
              <FadeIn delay={0.2}>
                <LandingFeaturesShowcase />
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
            
            {/* Card 1: Mobile Match Remote Controller */}
            <div className="relative p-6 rounded-3xl border backdrop-blur-xl space-y-3 group overflow-hidden bg-white/95 dark:bg-[#0d111a]/85 border-slate-200/90 dark:border-white/[0.12] hover:border-amber-400/60 dark:hover:border-amber-400/50 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  <Smartphone className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  0MS WEBSOCKET
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Mobile Match Remote
                </h3>
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Turn any smartphone into an official tournament control deck. Increment kills, knock players, and wipe squads with single taps.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Pairing: Ephemeral PIN &amp; QR</span>
                <span className="text-amber-500 font-bold">Instant Sync</span>
              </div>
            </div>

            {/* Card 2: Live OBS Browser Source Overlay */}
            <div className="relative p-6 rounded-3xl border backdrop-blur-xl space-y-3 group overflow-hidden bg-white/95 dark:bg-[#0d111a]/85 border-slate-200/90 dark:border-white/[0.12] hover:border-cyan-400/60 dark:hover:border-cyan-400/50 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
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
                  Live OBS Stream Overlay
                </h3>
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Zero-latency transparent browser source for OBS Studio, vMix, and YouTube live streams with dynamic 4-player health bars.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Output: 1080p60 / 4K UHD</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">WebSocket Delta</span>
              </div>
            </div>

            {/* Card 3: Graphics Studio & PSD Templates */}
            <div className="relative p-6 rounded-3xl border backdrop-blur-xl space-y-3 group overflow-hidden bg-white/95 dark:bg-[#0d111a]/85 border-slate-200/90 dark:border-white/[0.12] hover:border-emerald-400/60 dark:hover:border-emerald-400/50 shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25">
                  <Palette className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  PSD AUTO-ALIGN
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                  Graphics Studio &amp; Templates
                </h3>
                <p
                  className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-normal"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Drop Photopea or Photoshop .PSD files to auto-align team names, rank slots, and stats with sub-pixel precision in 1-click.
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Direct .PSD Layer Import</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">4K Poster Export</span>
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

export const HeroSection = React.memo(HeroSectionComponent);
export default HeroSection;
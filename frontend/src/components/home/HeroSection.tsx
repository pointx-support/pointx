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
  CheckCircle2,
  LogIn,
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
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentChip = CAPABILITY_CHIPS[activeChipIndex];
  const CurrentIcon = currentChip.icon;

  return (
    <section className="relative w-full min-h-[82vh] sm:min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-14 sm:pb-18 transition-colors duration-200">
      
      {/* 1. Futuristic Cyber Grid Background with Radial Ambient Glows */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 208, 0, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 208, 0, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)'
        }}
        aria-hidden="true"
      />

      {/* 2. Layered Ambient Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[540px] h-[180px] sm:h-[280px] bg-[var(--accent-primary)]/15 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 w-[240px] h-[240px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[240px] h-[240px] bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none z-0" />

      {/* 3. Soft Gradient Floor Blend */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-1 bg-gradient-to-t from-[var(--bg-base)] to-transparent transition-colors duration-200" />

      {/* 4. Hero Content Composition */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6">
        
        {/* Authority Pill Badge */}
        <FadeIn delay={0.05}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 backdrop-blur-xl text-[var(--accent-primary-text)] dark:text-[var(--accent-primary)] shadow-sm hover:border-[var(--accent-primary)]/60 transition-all cursor-default group">
            <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.18em] uppercase">
              PointX Esports • Tournament Operating System
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
          </div>
        </FadeIn>

        {/* Flagship Brand Logo */}
        <FadeIn delay={0.1}>
          <div className="relative flex items-center justify-center group my-1">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-3xl blur-2xl group-hover:bg-[var(--accent-primary)]/35 transition-all duration-500" />
            <PointXLogo
              className="h-16 sm:h-24 md:h-28 lg:h-32 w-auto max-w-[240px] sm:max-w-[340px] md:max-w-[420px] object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none hover:scale-105 transition-transform duration-300 relative z-10"
              alt="PointX Tournament Operating System"
              withShine={true}
            />
          </div>
        </FadeIn>

        {/* Sleeker, Balanced Hero Headline (Decreased size) */}
        <SlideIn direction="up" delay={0.15}>
          <div className="max-w-2xl mx-auto space-y-2.5 px-2">
            <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-[var(--text-primary)] font-display uppercase leading-tight sm:leading-snug">
              Automate Free Fire Scores & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#ffd000] via-[#ffaa00] to-[#ff7700] bg-clip-text text-transparent drop-shadow-sm">
                Broadcast Live 4K Overlays
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] font-medium max-w-xl mx-auto leading-relaxed">
              Official scoring engine, real-time OBS Studio scoreboard browser sources, and instant 4K social media standings graphics generator in one unified platform.
            </p>
          </div>
        </SlideIn>

        {/* One-by-One Cycling Feature Chip Display */}
        <FadeIn delay={0.2}>
          <div className="w-full flex flex-col items-center justify-center pt-2">
            <div
              key={activeChipIndex}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--bg-surface-raised)]/90 border border-[var(--accent-primary)]/40 text-[var(--text-primary)] shadow-lg shadow-amber-500/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 transition-all cursor-pointer hover:border-[var(--accent-primary)]"
              onClick={() => setActiveChipIndex((prev) => (prev + 1) % CAPABILITY_CHIPS.length)}
              title="Click to view next capability"
            >
              <div className="h-7 w-7 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center shrink-0">
                <CurrentIcon className="h-4 w-4 text-[var(--accent-primary)] animate-pulse" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{currentChip.text}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono -mt-0.5">
                  {currentChip.desc}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--accent-primary)] opacity-70 ml-1 shrink-0" />
            </div>

            {/* Micro Indicator Dots */}
            <div className="flex items-center gap-1.5 mt-2.5">
              {CAPABILITY_CHIPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveChipIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeChipIndex
                      ? 'w-6 bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(255,208,0,0.8)]'
                      : 'w-1.5 bg-neutral-600/40 hover:bg-neutral-500'
                  }`}
                  aria-label={`Jump to feature ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Action CTAs: High-Impact Hover Animations & Rich Depth */}
        <div className="w-full pt-3 sm:pt-4">
          <SlideIn direction="up" delay={0.25}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto">
              
              {/* Primary CTA: ENTER THE ARENA (Always navigates to signin) */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_4px_20px_rgba(255,208,0,0.35)] hover:shadow-[0_0_35px_rgba(255,208,0,0.7)] hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 cursor-pointer font-display border border-amber-300/70 group overflow-hidden"
              >
                {/* Ambient Shimmer Sweep */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Trophy className="h-5 w-5 fill-black/80 stroke-black text-black group-hover:rotate-12 transition-transform duration-300" />
                <span className="tracking-wider">ENTER THE ARENA</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5] text-black group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>

              {/* Secondary CTA: Organizer Sign In (Rich 3D depth, not flat) */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold bg-[var(--bg-surface-raised)]/80 hover:bg-[var(--accent-primary)]/10 border border-[var(--border-strong)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-md hover:shadow-[0_0_25px_rgba(255,208,0,0.25)] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.97] backdrop-blur-xl transition-all duration-300 cursor-pointer font-sans group"
              >
                <LogIn className="h-4 w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform duration-300" />
                <span>Organizer Sign In</span>
              </button>

            </div>
          </SlideIn>
        </div>

        {/* Live Status Ticker Bar */}
        <FadeIn delay={0.3}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] sm:text-[11px] font-mono">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Multi-Tier Tournament Engine Active</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--accent-primary)] font-bold">100% Free Fire Standards</span>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default HeroSection;

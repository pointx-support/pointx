import React from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { MagneticButton } from '../animation/MagneticButton';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import {
  Trophy,
  Zap,
  Radio,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
  onNavigateSignup,
}) => {
  return (
    <section className="relative w-full min-h-[85vh] sm:min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20 transition-colors duration-200">
      
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[620px] h-[220px] sm:h-[340px] bg-[var(--accent-primary)]/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 w-[280px] h-[280px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[280px] h-[280px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* 3. Soft Gradient Floor Blend */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-1 bg-gradient-to-t from-[var(--bg-base)] to-transparent transition-colors duration-200" />

      {/* 4. Hero Content Composition */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
        
        {/* Authority Pill Badge */}
        <FadeIn delay={0.05}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 backdrop-blur-xl text-[var(--accent-primary-text)] dark:text-[var(--accent-primary)] shadow-sm hover:border-[var(--accent-primary)]/60 transition-all cursor-default group">
            <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase">
              PointX Esports • Tournament Operating System
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
          </div>
        </FadeIn>

        {/* Flagship Brand Logo */}
        <FadeIn delay={0.1}>
          <div className="relative flex items-center justify-center group my-2">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-3xl blur-2xl group-hover:bg-[var(--accent-primary)]/35 transition-all duration-500" />
            <PointXLogo
              className="h-20 sm:h-28 md:h-36 lg:h-40 w-auto max-w-[300px] sm:max-w-[440px] md:max-w-[540px] object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)] select-none hover:scale-105 transition-transform duration-300 relative z-10"
              alt="PointX Tournament Operating System"
              withShine={true}
            />
          </div>
        </FadeIn>

        {/* Hero Title & Subtitle */}
        <SlideIn direction="up" delay={0.15}>
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 px-2">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] font-display uppercase leading-[1.15]">
              Automate Free Fire Scores & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#ffd000] via-[#ffaa00] to-[#ff7700] bg-clip-text text-transparent drop-shadow-sm">
                Broadcast Live 4K Overlays
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
              Official scoring engine, real-time OBS Studio scoreboard browser sources, and instant 4K social media standings graphics generator in one unified platform.
            </p>
          </div>
        </SlideIn>

        {/* Live Feature Chips */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto pt-1">
            {[
              { icon: Zap, text: '< 50ms Point Matrix' },
              { icon: Trophy, text: '12-9-8-7 Official Scoring' },
              { icon: Radio, text: 'Live OBS Browser Source' },
              { icon: Sparkles, text: '4K Graphics Studio' },
              { icon: ShieldCheck, text: 'Multi-Admin Governance' }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 transition-all text-xs font-mono font-medium shadow-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Action CTAs */}
        <div className="w-full pt-4 sm:pt-6">
          <SlideIn direction="up" delay={0.25}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto">
              
              {/* Primary CTA: ENTER THE ARENA */}
              <MagneticButton strength={0.25}>
                <button
                  type="button"
                  onClick={onNavigateSignup}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:brightness-110 shadow-[0_8px_25px_rgba(255,208,0,0.45)] hover:shadow-[0_12px_32px_rgba(255,208,0,0.65)] transition-all cursor-pointer font-display active:scale-[0.98] border border-amber-300/60 group"
                >
                  <Trophy className="h-5 w-5 fill-black/80 stroke-black text-black group-hover:scale-110 transition-transform" />
                  <span className="tracking-wider">ENTER THE ARENA</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
                </button>
              </MagneticButton>

              {/* Secondary CTA: Organizer Sign In */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 sm:px-9 py-4 rounded-2xl text-sm sm:text-base font-bold bg-[var(--bg-surface-raised)]/90 hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent-primary)]/50 backdrop-blur-xl border border-[var(--border-medium)] text-[var(--text-primary)] shadow-lg transition-all cursor-pointer font-sans"
              >
                <span>Organizer Sign In</span>
              </button>

            </div>
          </SlideIn>
        </div>

        {/* Live Status Ticker Bar */}
        <FadeIn delay={0.3}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] sm:text-xs font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Multi-Tier Tournament Engine Active</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--accent-primary)] font-bold">100% Free Fire Official Standards</span>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default HeroSection;

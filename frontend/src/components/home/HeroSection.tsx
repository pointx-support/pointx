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
  CheckCircle2,
  Swords
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
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pb-16 transition-colors duration-200">
      
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[680px] h-[220px] sm:h-[360px] bg-[var(--accent-primary)]/15 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 w-[280px] h-[280px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[280px] h-[280px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* 3. Soft Gradient Floor Blend */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-1 bg-gradient-to-t from-[var(--bg-base)] to-transparent transition-colors duration-200" />

      {/* 4. Hero Content Composition */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6">
        
        {/* Authority Pill Badge */}
        <FadeIn delay={0.05}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 backdrop-blur-xl text-[var(--accent-primary-text)] dark:text-[var(--accent-primary)] shadow-sm hover:border-[var(--accent-primary)]/60 transition-all cursor-default group">
            <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] uppercase">
              POINTX ESPORTS • TOURNAMENT OPERATING SYSTEM
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
          </div>
        </FadeIn>

        {/* Flagship Brand Logo */}
        <FadeIn delay={0.08}>
          <div className="relative flex items-center justify-center group">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-2xl blur-xl group-hover:bg-[var(--accent-primary)]/35 transition-all duration-300" />
            <PointXLogo
              className="h-10 sm:h-14 md:h-16 w-auto max-w-[180px] sm:max-w-[240px] object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)] select-none hover:scale-105 transition-transform duration-300 relative z-10"
              alt="PointX Tournament Operating System"
              withShine={true}
            />
          </div>
        </FadeIn>

        {/* Hero Flagship Title */}
        <SlideIn direction="up" delay={0.1}>
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 px-2">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] font-display uppercase leading-[1.08] sm:leading-[1.05]">
              <span className="block text-[var(--text-primary)]">
                AUTOMATE FREE FIRE SCORES
              </span>
              <span className="block bg-gradient-to-r from-[#ffd000] via-[#ffb700] to-[#ff6600] bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(255,183,0,0.35)]">
                & BROADCAST LIVE 4K OVERLAYS
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
              Official scoring engine, real-time OBS Studio scoreboard browser sources, and instant 4K social media standings graphics generator in one unified platform.
            </p>
          </div>
        </SlideIn>

        {/* Live Feature Chips */}
        <FadeIn delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto pt-1">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-raised)]/80 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 transition-all text-xs font-mono font-bold shadow-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Action CTAs */}
        <div className="w-full pt-2 sm:pt-4">
          <SlideIn direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto">
              
              {/* Primary CTA: ENTER THE ARENA */}
              <MagneticButton strength={0.25}>
                <button
                  type="button"
                  onClick={onNavigateSignup}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:brightness-110 shadow-[0_8px_25px_rgba(255,208,0,0.45)] hover:shadow-[0_12px_32px_rgba(255,208,0,0.65)] transition-all cursor-pointer font-display active:scale-[0.98] border border-amber-300/60 group"
                >
                  <Swords className="h-5 w-5 fill-black text-black group-hover:scale-110 transition-transform" />
                  <span className="tracking-wider">ENTER THE ARENA</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5] text-black group-hover:translate-x-1 transition-transform" />
                </button>
              </MagneticButton>

              {/* Secondary CTA: Organizer Sign In */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 sm:px-9 py-4 rounded-2xl text-sm sm:text-base font-bold bg-[var(--bg-surface-raised)]/90 hover:bg-[var(--bg-surface-hover)] hover:border-[var(--accent-primary)]/50 backdrop-blur-xl border border-[var(--border-medium)] text-[var(--text-primary)] shadow-lg transition-all cursor-pointer font-sans active:scale-95"
              >
                <span>Organizer Sign In</span>
              </button>

            </div>
          </SlideIn>
        </div>

        {/* Live Status Ticker Bar */}
        <FadeIn delay={0.25}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-surface-raised)]/60 border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] sm:text-xs font-mono backdrop-blur-md">
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

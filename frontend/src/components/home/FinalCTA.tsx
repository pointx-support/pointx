import React from 'react';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { MagneticButton } from '../animation/MagneticButton';

export interface FinalCTAProps {
  onNavigateSignup: () => void;
  onNavigateLogin: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onNavigateSignup,
  onNavigateLogin,
}) => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden transition-colors duration-200">
      {/* GPU Radial Golden Halo */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-35 transform-gpu"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.06) 50%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
            <Trophy className="h-4 w-4" />
            <span>Start Operating Tournaments In Seconds</span>
          </div>
        </FadeIn>

        <SlideIn direction="up">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.05]">
            Ready To Enter The Arena?
          </h2>
        </SlideIn>

        <SlideIn direction="up" delay={0.1}>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Create tournaments, manage 12 or 24-team matrices, broadcast live scoreboards to OBS Studio, and generate 4K posters without spreadsheets.
          </p>
        </SlideIn>

        {/* Dual Action CTAs */}
        <SlideIn direction="up" delay={0.15}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <MagneticButton strength={0.25}>
              <button
                type="button"
                onClick={onNavigateSignup}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4.5 rounded-2xl text-sm font-black bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:brightness-110 shadow-xl shadow-[var(--accent-primary)]/25 transition-all cursor-pointer font-display active:scale-[0.98]"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>CREATE FREE ACCOUNT</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </MagneticButton>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 rounded-2xl text-sm font-bold bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer font-sans shadow-md"
            >
              <span>Sign In To Console</span>
            </button>
          </div>
        </SlideIn>

        {/* Feature guarantee text */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[var(--text-muted)] pt-5">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-[var(--status-live)]" />
              <span>Instant Cloud Activation</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>Free Community League Tier</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-[var(--status-info)]" />
              <span>Zero Software Installation Required</span>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default FinalCTA;

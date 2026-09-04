import React from 'react';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Trophy,
  LogIn
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';

export interface FinalCTAProps {
  onNavigateSignup?: () => void;
  onNavigateLogin: () => void;
}

const FinalCTAComponent: React.FC<FinalCTAProps> = ({
  onNavigateLogin,
}) => {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden">
      
      {/* GPU Radial Stadium Halo */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full opacity-30 transform-gpu"
        style={{
          background: 'radial-gradient(circle, rgba(255,208,0,0.22) 0%, rgba(125,64,71,0.12) 45%, transparent 75%)',
        }}
      />

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
        
        <div className="max-w-4xl mx-auto space-y-8 p-10 sm:p-16 rounded-3xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/70 border border-white/[0.08] shadow-2xl backdrop-blur-2xl">
          
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Trophy className="h-4 w-4" />
              <span>Start Operating Tournaments In Seconds</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.05]">
              Ready To Enter The Arena?
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Create tournaments, manage 12 or 24-team matrices, broadcast live scoreboards to OBS Studio, and generate 4K posters without spreadsheets.
            </p>
          </SlideIn>

          {/* Dual Action CTAs */}
          <SlideIn direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl text-sm sm:text-base font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_4px_25px_rgba(255,208,0,0.35)] hover:shadow-[0_0_35px_rgba(255,208,0,0.7)] hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.97] transition-[transform,box-shadow] duration-200 cursor-pointer font-display border border-amber-300/70 group overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Zap className="h-4 w-4 fill-black/80 stroke-black text-black group-hover:rotate-12 transition-transform duration-300" />
                <span className="tracking-wider">ENTER THE ARENA</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5] text-black group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="relative w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-white/[0.04] hover:bg-[var(--accent-primary)]/10 border border-white/[0.1] hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-md hover:shadow-[0_0_25px_rgba(255,208,0,0.25)] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.97] backdrop-blur-xl transition-[transform,box-shadow,border-color,background-color] duration-200 cursor-pointer font-sans"
              >
                <LogIn className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>Sign In To Console</span>
              </button>
            </div>
          </SlideIn>

          {/* Feature guarantee text */}
          <FadeIn delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[var(--text-muted)] pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Instant Cloud Activation</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>Free Community League Tier</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>Zero Software Installation Required</span>
              </div>
            </div>
          </FadeIn>

        </div>

      </div>
    </section>
  );
};

export const FinalCTA = React.memo(FinalCTAComponent);
export default FinalCTA;

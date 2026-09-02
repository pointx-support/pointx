import React, { useRef, useEffect } from 'react';
import { PointXLogo } from '../ui/PointXLogo';
import { MagneticButton } from '../animation/MagneticButton';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface HeroSectionProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateLogin,
  onNavigateSignup,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Control video playback and respect prefers-reduced-motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay policy handled gracefully without uncaught exceptions
      });
    }
  }, [prefersReducedMotion]);

  return (
    <section className="relative w-full min-h-[90vh] sm:min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20 transition-colors duration-200">
      
      {/* 1. Full-Screen Cinematic Video Background (100% Original Visibility & Colors) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        aria-hidden="true"
      >
        <source src="/bgvideo.mp4" type="video/mp4" />
      </video>

      {/* 2. Soft Edge Transition at the Very Bottom Perimeter Only (Theme Aware) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-1 bg-gradient-to-t from-[var(--bg-base)] to-transparent transition-colors duration-200" />

      {/* 3. Hero Content Container: Logo -> Balanced Gap -> Action CTAs */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        
        {/* Upper Portion: Prominent PointX Logo (Adapts dynamically to Light & Dark) */}
        <FadeIn delay={0.05}>
          <div className="flex items-center justify-center">
            <PointXLogo
              className="h-20 sm:h-28 md:h-36 lg:h-40 w-auto max-w-[320px] sm:max-w-[460px] md:max-w-[560px] object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)] select-none hover:scale-105 transition-transform duration-300"
              alt="PointX Tournament Operating System"
            />
          </div>
        </FadeIn>

        {/* Action CTAs with Balanced Vertical Gap & Dynamic Theme Awareness */}
        <div className="w-full pt-8 sm:pt-10 md:pt-12 lg:pt-14">
          <SlideIn direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full">
              
              {/* Primary CTA: ENTER THE ARENA (with Custom Vector Gaming Emblem SVG) */}
              <MagneticButton strength={0.25}>
                <button
                  type="button"
                  onClick={onNavigateSignup}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl text-sm sm:text-base font-black bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:brightness-110 shadow-2xl shadow-black/80 transition-all cursor-pointer font-display active:scale-[0.98] border border-amber-300/40 group"
                >
                  {/* Custom Vector Gaming Emblem SVG */}
                  <svg
                    className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.25 19.5 7 12 10.5zM2 17l10 5 10-5-2.25-1.12L12 19.75l-7.75-3.87L2 17zm0-5l10 5 10-5-2.25-1.12L12 14.75l-7.75-3.87L2 12z" />
                  </svg>
                  <span className="tracking-wider">ENTER THE ARENA</span>
                  <svg
                    className="w-4 h-4 stroke-current stroke-2 fill-none shrink-0 group-hover:translate-x-1 transition-transform"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </MagneticButton>

              {/* Secondary CTA: Organizer Sign In (Theme Aware Surface) */}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 sm:px-9 py-4 sm:py-4.5 rounded-2xl text-sm sm:text-base font-bold bg-[var(--bg-surface-raised)]/90 hover:bg-[var(--bg-surface-hover)] backdrop-blur-md border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-xl shadow-black/40 transition-colors cursor-pointer font-sans"
              >
                <span>Organizer Sign In</span>
              </button>

            </div>
          </SlideIn>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

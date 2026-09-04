import React from 'react';
import {
  Sliders,
  PlaySquare,
  Radio,
  Share2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';

export interface OrganizerExperienceProps {
  onNavigateSignup?: () => void;
  onNavigateLogin?: () => void;
}

export const OrganizerExperience: React.FC<OrganizerExperienceProps> = ({
  onNavigateLogin,
  onNavigateSignup,
}) => {
  const navigateToAuth = onNavigateLogin || onNavigateSignup || (() => {});

  const steps = [
    {
      step: '01',
      icon: Sliders,
      title: 'Configure Matrix & Slots',
      description:
        'Select 12 or 24-team slots, choose the official FFWS scoring rule preset or set custom multipliers, and upload team logos.',
      badge: 'Step 1: Setup',
      color: '#ffd000',
    },
    {
      step: '02',
      icon: PlaySquare,
      title: 'Rapid Match Scoring',
      description:
        'Input match placements and frags in under 10 seconds. The mathematical engine calculates tie-breakers and updates totals instantly.',
      badge: 'Step 2: In-Game',
      color: '#38bdf8',
    },
    {
      step: '03',
      icon: Radio,
      title: 'Live OBS Stream Sync',
      description:
        'Paste your unique browser source URL into OBS Studio or vMix. Transparent broadcast scoreboards auto-update on stream with zero lag.',
      badge: 'Step 3: Broadcast',
      color: '#10b981',
    },
    {
      step: '04',
      icon: Share2,
      title: '1-Click 4K Social Export',
      description:
        'Generate high-resolution overall standings posters, match winner graphics, and MVP cards ready to post on Instagram and Discord.',
      badge: 'Step 4: Publish',
      color: '#c084fc',
    },
  ];

  return (
    <section id="organizer-workflow" className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3.5">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Organizer Operating Workflow</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.1]">
              Run Professional Tournaments in 4 Simple Steps
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              From match setup to live stream broadcast overlays and final 4K graphics, PointX powers the complete tournament production pipeline.
            </p>
          </SlideIn>
        </div>

        {/* 4 Step Horizontal Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                className="p-8 sm:p-9 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-white/[0.2] transition-[transform,border-color,background-color] duration-200 flex flex-col justify-between group relative overflow-hidden shadow-2xl backdrop-blur-xl hover:-translate-y-1"
              >
                {/* Step Number Background Ghost Watermark */}
                <div className="absolute top-4 right-5 font-mono font-black text-5xl text-white/[0.04] select-none pointer-events-none">
                  {item.step}
                </div>

                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="p-3.5 rounded-2xl flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-md border border-white/[0.08]"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white/[0.04] text-[var(--text-muted)] border border-white/[0.08]">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase group-hover:text-[var(--accent-primary)] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Status Check */}
                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[var(--text-primary)] font-bold">Production Ready</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Organizer Callout Action Banner */}
        <FadeIn delay={0.2}>
          <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-white/[0.08] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-2xl">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Latency Cloud Tournament OS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                Ready to Organize Your Next Championship?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl">
                Get started for free. No credit card required. Launch your first tournament in under 2 minutes.
              </p>
            </div>

            <button
              type="button"
              onClick={navigateToAuth}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:shadow-[0_0_30px_rgba(255,208,0,0.6)] whitespace-nowrap transition-all duration-300 cursor-pointer font-display active:scale-[0.98] shadow-xl border border-amber-300/50 shrink-0"
            >
              <span>ACCESS THE ARENA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default OrganizerExperience;

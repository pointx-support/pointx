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
  onNavigateSignup: () => void;
  onNavigateLogin: () => void;
}

export const OrganizerExperience: React.FC<OrganizerExperienceProps> = ({
  onNavigateSignup,
}) => {
  const steps = [
    {
      step: '01',
      icon: Sliders,
      title: 'Configure Matrix & Slots',
      description:
        'Select 12 or 24-team slots, choose the official FFWS scoring rule preset or set custom multipliers, and upload team logos.',
      badge: 'Step 1: Setup',
      color: '#f59e0b',
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
      color: '#ec4899',
    },
  ];

  return (
    <section id="organizer-workflow" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Organizer Operating Workflow</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
              Run Professional Tournaments in 4 Simple Steps
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              From match setup to live stream broadcast overlays and final 4K graphics, PointX powers the complete tournament production pipeline.
            </p>
          </SlideIn>
        </div>

        {/* 4 Step Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          {steps.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                className="p-7 sm:p-8 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group relative overflow-hidden shadow-md"
              >
                {/* Step Number Background Ghost Watermark */}
                <div className="absolute top-3 right-4 font-mono font-black text-4xl sm:text-5xl text-[var(--text-primary)]/5 select-none pointer-events-none">
                  {item.step}
                </div>

                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="p-3.5 rounded-2xl flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Status Check */}
                <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--status-live)] shrink-0" />
                  <span className="text-[var(--text-primary)] font-bold">Production Ready</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Organizer Callout Action Banner */}
        <FadeIn delay={0.2}>
          <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[var(--bg-surface-raised)] via-[var(--bg-surface)] to-[var(--bg-surface-raised)] border border-[var(--border-subtle)] flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl transition-colors">
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
              onClick={onNavigateSignup}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-xs font-black bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:brightness-110 shadow-lg shadow-[var(--accent-primary)]/20 whitespace-nowrap transition-all cursor-pointer font-display active:scale-[0.98]"
            >
              <span>CREATE ORGANIZER ACCOUNT</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default OrganizerExperience;

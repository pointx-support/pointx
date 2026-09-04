import React from 'react';
import {
  Layers,
  Users,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  XCircle,
  Cpu,
  Radio,
  Image,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';

export const PlatformFeatures: React.FC = () => {
  const features = [
    {
      icon: Cpu,
      title: 'Automated Scoring Engine',
      description:
        'Eliminate manual calculation delays. PointX computes placement multipliers and kill points in under 0.4s with automatic tie-breaker resolution.',
      highlight: '0.38ms calculation speed',
      color: '#ffd000',
    },
    {
      icon: Radio,
      title: 'OBS Studio Live Overlays',
      description:
        'Deliver broadcast-grade esports streams. Connect transparent browser sources to OBS Studio or vMix with automated real-time scoreboard updates.',
      highlight: 'Zero latency stream sync',
      color: '#38bdf8',
    },
    {
      icon: Image,
      title: '4K Graphics & Banner Studio',
      description:
        'Generate publication-ready 4K overall standings, match winner graphics, and MVP posters with custom embedded esports fonts in 1-click.',
      highlight: 'Single-click 4K PNG export',
      color: '#10b981',
    },
    {
      icon: Layers,
      title: 'Multi-Stage Tournament Workspace',
      description:
        'Organize complex events from qualifiers and group stages to grand finals with customizable map rotations (Bermuda, Purgatory, Kalahari).',
      highlight: 'Full multi-bracket support',
      color: '#c084fc',
    },
    {
      icon: Users,
      title: 'Team & Roster Management',
      description:
        'Maintain team slot rosters, upload custom team crests, and track player in-game handles across multiple championship seasons.',
      highlight: '12 & 24 team slot configurations',
      color: '#f472b6',
    },
    {
      icon: Smartphone,
      title: 'Mobile 2nd-Screen Operator Deck',
      description:
        'Control match scoring and broadcast states from your smartphone or tablet while running your main game stream on PC.',
      highlight: 'Touch-optimized control room',
      color: '#fb923c',
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 relative bg-[var(--bg-surface)]/30 border-y border-white/[0.06] transition-colors duration-300">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3.5">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Architected For Champions & Production Crews</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.1]">
              Why Esports Organizers Choose PointX
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Built by esports tournament administrators for tournament administrators. Every tool is crafted for speed, broadcast clarity, and absolute reliability.
            </p>
          </SlideIn>
        </div>

        {/* 6 Feature Grid (Widescreen 3-Column Bento) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;

            return (
              <div
                key={feat.title}
                className="p-8 sm:p-9 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-white/[0.2] transition-[transform,border-color,background-color] duration-200 flex flex-col justify-between group shadow-xl backdrop-blur-xl hover:-translate-y-1"
              >
                <div>
                  {/* Icon Container */}
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md border border-white/[0.08]"
                    style={{ backgroundColor: `${feat.color}20`, color: feat.color }}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase group-hover:text-[var(--accent-primary)] transition-colors">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Micro Highlight Footer */}
                <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[var(--text-primary)] font-bold">{feat.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Telemetry Card */}
        <FadeIn delay={0.2}>
          <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-white/[0.08] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-2xl backdrop-blur-2xl transition-colors duration-200">
            
            {/* Old Method */}
            <div className="space-y-3 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-400 tracking-wider">
                <XCircle className="h-4 w-4" />
                <span>Old Manual Methods</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase">
                Manual Excel Spreadsheets & Photoshop
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Takes 15–20 minutes after every single match, prone to math errors, requires manual copy-pasting into OBS, and causes frustrating tournament stream delays.
              </p>
            </div>

            {/* PointX OS Method */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[var(--accent-primary)] tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>The PointX OS Way</span>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                  98% Faster Operations
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase">
                Instant Matrix & Real-Time Broadcast Overlays
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Enter match kills in 10 seconds. Standings auto-calculate, OBS updates live on stream instantly, and 4K posters are ready to share immediately.
              </p>
            </div>

          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default PlatformFeatures;

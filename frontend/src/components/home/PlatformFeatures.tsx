import React from 'react';
import {
  Zap,
  Radio,
  BarChart3,
  Layers,
  Users,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { GlowHover } from '../animation/HoverCards';

export const PlatformFeatures: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Automated Scoring Engine',
      description:
        'Eliminate manual calculation delays. PointX computes placement multipliers and kill points in under 0.4s with automatic tie-breaker resolution.',
      highlight: '0.4s calculation speed',
      color: '#f59e0b',
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
      icon: BarChart3,
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
      color: '#8b5cf6',
    },
    {
      icon: Users,
      title: 'Team & Roster Management',
      description:
        'Maintain team slot rosters, upload custom team crests, and track player in-game handles across multiple championship seasons.',
      highlight: '12 & 24 team slot configurations',
      color: '#ec4899',
    },
    {
      icon: Smartphone,
      title: 'Mobile 2nd-Screen Operator Deck',
      description:
        'Control match scoring and broadcast states from your smartphone or tablet while running your main game stream on PC.',
      highlight: 'Touch-optimized control room',
      color: '#f97316',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative bg-[var(--bg-surface)]/40 border-y border-[var(--border-subtle)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Architected For Champions</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
              Why Esports Organizers Choose PointX
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Built by esports tournament administrators for tournament administrators. Every tool is crafted for speed, broadcast clarity, and absolute reliability.
            </p>
          </SlideIn>
        </div>

        {/* 6 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;

            return (
              <GlowHover key={feat.title} glowColor="rgba(245, 158, 11, 0.12)">
                <div className="h-full p-7 sm:p-8 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl">
                  <div>
                    {/* Icon Container */}
                    <div
                      className="h-13 w-13 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: `${feat.color}20`, color: feat.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase">
                      {feat.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {/* Micro Highlight Footer */}
                  <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--status-live)] shrink-0" />
                    <span className="text-[var(--text-primary)] font-bold">{feat.highlight}</span>
                  </div>
                </div>
              </GlowHover>
            );
          })}
        </div>

        {/* Comparison Telemetry Card */}
        <FadeIn delay={0.2}>
          <div className="mt-16 p-7 sm:p-10 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-xl transition-colors">
            
            {/* Old Method */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[var(--status-danger)] tracking-wider">
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
            <div className="p-6 sm:p-7 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--status-live)]/40 space-y-3 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[var(--status-live)] tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>The PointX OS Way</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--status-live)]/15 text-[var(--status-live)]">
                  98% Faster
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

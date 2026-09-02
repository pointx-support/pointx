import React from 'react';
import {
  Gamepad2,
  Flame,
  Target,
  Layers,
  ArrowRight,
  Crosshair,
  Check,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { TiltCard } from '../animation/HoverCards';
import { Badge } from '../ui/Badge';

export interface FeaturedGamesProps {
  onNavigateSignup: () => void;
}

export const FeaturedGames: React.FC<FeaturedGamesProps> = ({ onNavigateSignup }) => {
  const games = [
    {
      id: 'ff-max',
      title: 'Free Fire MAX',
      subtitle: 'Official Flagship Esports Scoring Matrix',
      tag: 'FLAGSHIP TITLE',
      tagVariant: 'gold' as const,
      color: '#f59e0b',
      icon: Flame,
      maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nextra'],
      features: [
        '12 Teams Official FFWS Matrix Presets',
        'Automatic 1st–12th Placement Multipliers',
        'Kill Points (1 Pt/Kill or Custom Rules)',
        '4K Standings & Top Fragger Posters',
      ],
      badge: 'Tier-1 Support',
    },
    {
      id: 'bgmi-pubg',
      title: 'Battle Royale Esports',
      subtitle: '24-Squad Tactical Point Matrices',
      tag: 'MULTI-SQUAD',
      tagVariant: 'cyan' as const,
      color: '#38bdf8',
      icon: Target,
      maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi'],
      features: [
        '16 & 24 Squad Bracket Automation',
        'Placement Tier Matrix Presets',
        'WWCD & Kill Breakdown Points',
        'Live Broadcast Scoreboard Overlay',
      ],
      badge: 'Full Roster Engine',
    },
    {
      id: 'tactical-fps',
      title: 'Tactical 5v5 FPS',
      subtitle: 'Round-Based Competitive Tournaments',
      tag: 'TACTICAL',
      tagVariant: 'purple' as const,
      color: '#8b5cf6',
      icon: Crosshair,
      maps: ['Ascent', 'Haven', 'Bind', 'Split'],
      features: [
        'Round-by-Round Score Tracking',
        'Combat Score & MVP Damage Leaderboard',
        'Overtime & Map Pick/Ban Phase Support',
        'Direct Broadcast Overlay Graphic',
      ],
      badge: 'Instant Sync',
    },
    {
      id: 'custom-leagues',
      title: 'Custom Esports Leagues',
      subtitle: 'Universal Point Rule Customizer',
      tag: 'CUSTOMIZABLE',
      tagVariant: 'neutral' as const,
      color: '#10b981',
      icon: Layers,
      maps: ['Any Map', 'Custom Preset', 'Community'],
      features: [
        'Adjustable Kill & Placement Multipliers',
        'Custom Penalty & Bonus Deductions',
        'Custom Organization Watermarks & Logos',
        'JSON / CSV Roster & Score Import',
      ],
      badge: 'Universal Mode',
    },
  ];

  return (
    <section id="games" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-info)]/10 border border-[var(--status-info)]/30 text-[var(--status-info)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>Multi-Title Ecosystem</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
              Supported Competitive Games
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              From fast-paced Free Fire battlegrounds to tactical 5v5 tournaments, PointX adapts to your tournament's unique scoring rules and broadcast requirements.
            </p>
          </SlideIn>
        </div>

        {/* 4 Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {games.map((game) => {
            const Icon = game.icon;

            return (
              <TiltCard key={game.id}>
                <div className="h-full p-7 sm:p-9 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group relative overflow-hidden shadow-md">
                  
                  {/* Subtle top ambient accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: game.color }}
                  />

                  <div>
                    {/* Header: Game Icon & Badges */}
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div
                        className="p-3.5 rounded-2xl flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-xs"
                        style={{ backgroundColor: `${game.color}20`, color: game.color }}
                      >
                        <Icon className="h-7 w-7" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={game.tagVariant} size="sm">
                          {game.tag}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-[var(--text-muted)] px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)]">
                          {game.badge}
                        </span>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase">
                      {game.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-mono">
                      {game.subtitle}
                    </p>

                    {/* Feature Bullets */}
                    <ul className="mt-7 space-y-3">
                      {game.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                          <span
                            className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: `${game.color}20`, color: game.color }}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                          <span className="font-medium">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Map Rotation Pill Bar */}
                    <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] mr-1">Maps:</span>
                      {game.maps.map((m, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
                      Ready to host or calculate
                    </span>
                    <button
                      type="button"
                      onClick={onNavigateSignup}
                      className="inline-flex items-center gap-2 text-xs font-black font-display uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer group/btn"
                    >
                      <span>Create {game.title} Tournament</span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGames;

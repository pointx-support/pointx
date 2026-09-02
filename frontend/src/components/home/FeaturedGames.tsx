import React from 'react';
import {
  Gamepad2,
  Flame,
  Target,
  Layers,
  ArrowRight,
  Crosshair,
  Check,
  Zap
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { Badge } from '../ui/Badge';

export interface FeaturedGamesProps {
  onNavigateSignup?: () => void;
  onNavigateLogin?: () => void;
}

export const FeaturedGames: React.FC<FeaturedGamesProps> = ({ onNavigateLogin, onNavigateSignup }) => {
  const navigateToAuth = onNavigateLogin || onNavigateSignup || (() => {});

  const games = [
    {
      id: 'ff-max',
      title: 'Free Fire MAX',
      subtitle: 'Official Flagship Esports Scoring Matrix & OBS Deck',
      tag: 'FLAGSHIP TITLE',
      tagVariant: 'gold' as const,
      color: '#ffd000',
      icon: Flame,
      maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nextra'],
      features: [
        '12 Teams Official FFWS Matrix Presets',
        'Automatic 1st–12th Placement Multipliers',
        'Kill Points (1 Pt/Kill or Custom Rules)',
        '4K Standings & Top Fragger Posters',
      ],
      badge: 'Tier-1 Native Engine',
    },
    {
      id: 'bgmi-pubg',
      title: 'Battle Royale Esports',
      subtitle: '24-Squad Tactical Point Matrices & WWCD Sync',
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
      subtitle: 'Round-Based Competitive Tournaments & MVP Matrix',
      tag: 'TACTICAL',
      tagVariant: 'purple' as const,
      color: '#c084fc',
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
      subtitle: 'Universal Point Rule Customizer & Multi-Stage Brackets',
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
    <section id="games" className="py-24 md:py-32 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3.5">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-info)]/10 border border-[var(--status-info)]/30 text-[var(--status-info)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>Multi-Title Esports Ecosystem</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.1]">
              Supported Competitive Games
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              From fast-paced Free Fire battlegrounds to tactical 5v5 tournaments, PointX adapts to your tournament's unique scoring rules and broadcast requirements.
            </p>
          </SlideIn>
        </div>

        {/* 4 Games Grid (Large Widescreen Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {games.map((game) => {
            const Icon = game.icon;

            return (
              <div
                key={game.id}
                className="p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border border-white/[0.08] hover:border-white/[0.2] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-2xl backdrop-blur-xl hover:-translate-y-1"
              >
                {/* Subtle top ambient accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
                  style={{ backgroundColor: game.color }}
                />

                <div>
                  {/* Header: Game Icon & Badges */}
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div
                      className="p-3.5 rounded-2xl flex items-center justify-center font-bold group-hover:scale-110 transition-transform shadow-md border border-white/[0.08]"
                      style={{ backgroundColor: `${game.color}20`, color: game.color }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={game.tagVariant} size="sm">
                        {game.tag}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-[var(--text-muted)] px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        {game.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase group-hover:text-[var(--accent-primary)] transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-mono">
                    {game.subtitle}
                  </p>

                  {/* Feature Bullets */}
                  <ul className="mt-8 space-y-3">
                    {game.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                        <span
                          className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: `${game.color}20`, color: game.color }}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Map Rotation Pill Bar */}
                  <div className="mt-8 pt-5 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)] mr-1">Maps:</span>
                    {game.maps.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.06]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    <span>Instant Preset Ready</span>
                  </span>
                  <button
                    type="button"
                    onClick={navigateToAuth}
                    className="inline-flex items-center gap-2 text-xs font-black font-display uppercase tracking-wider text-[var(--accent-primary)] hover:brightness-110 transition-all cursor-pointer group/btn"
                  >
                    <span>Launch {game.title} Arena</span>
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGames;

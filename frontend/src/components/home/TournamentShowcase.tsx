import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface TournamentShowcaseProps {
  onNavigateSignup?: () => void;
  onNavigateLogin?: () => void;
}

export const TournamentShowcase: React.FC<TournamentShowcaseProps> = ({
  onNavigateLogin,
  onNavigateSignup,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'live' | 'upcoming' | 'championship'>('all');
  const navigateToAuth = onNavigateLogin || onNavigateSignup || (() => {});

  const showcaseTournaments = [
    {
      id: 'tour-1',
      title: 'Free Fire World Series (FFWS) Pro Clash',
      game: 'Free Fire MAX',
      status: 'Live' as const,
      prizePool: '₹250,000',
      teamsCount: 12,
      matchesCount: 6,
      date: 'Tonight • 8:00 PM IST',
      mapRotation: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
      featured: true,
      organizer: 'PointX Esports Official',
      badge: 'OFFICIAL INVITATIONAL',
    },
    {
      id: 'tour-2',
      title: 'PointX All-Star Battle Royale Invitational',
      game: 'Free Fire MAX',
      status: 'Upcoming' as const,
      prizePool: '₹100,000',
      teamsCount: 12,
      matchesCount: 8,
      date: 'Starts This Saturday',
      mapRotation: ['Bermuda', 'Purgatory', 'Bermuda'],
      featured: false,
      organizer: 'PointX Arena Club',
      badge: 'TIER-1 LEAGUE',
    },
    {
      id: 'tour-3',
      title: 'National Champions League • Season 4',
      game: 'Battle Royale Esports',
      status: 'Upcoming' as const,
      prizePool: '₹500,000',
      teamsCount: 24,
      matchesCount: 12,
      date: 'Registration Open',
      mapRotation: ['Bermuda', 'Kalahari', 'Alpine', 'Purgatory'],
      featured: true,
      organizer: 'National Gaming Federation',
      badge: 'CHAMPIONSHIP SERIES',
    },
    {
      id: 'tour-4',
      title: 'Elite Squad Masters Cup Season 2',
      game: 'Free Fire MAX',
      status: 'Completed' as const,
      prizePool: '₹75,000',
      teamsCount: 12,
      matchesCount: 5,
      date: 'Finalized Yesterday',
      mapRotation: ['Bermuda', 'Purgatory'],
      featured: false,
      organizer: 'PointX Esports Hub',
      badge: 'COMMUNITY CUP',
    },
  ];

  const filteredTournaments = showcaseTournaments.filter((t) => {
    if (activeCategory === 'live') return t.status === 'Live';
    if (activeCategory === 'upcoming') return t.status === 'Upcoming';
    if (activeCategory === 'championship') return t.featured;
    return true;
  });

  return (
    <section id="tournaments" className="py-24 md:py-32 relative">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div className="space-y-3.5">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                <Trophy className="h-3.5 w-3.5" />
                <span>Championship Arena & Tournament Discovery</span>
              </div>
            </FadeIn>

            <SlideIn direction="up">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.1]">
                Featured Tournaments
              </h2>
            </SlideIn>

            <SlideIn direction="up" delay={0.1}>
              <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] max-w-xl leading-relaxed">
                Explore active community leagues, official invitational tournaments, and championship prize battles operated with PointX.
              </p>
            </SlideIn>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-white/[0.08] overflow-x-auto self-start lg:self-auto font-sans shadow-lg backdrop-blur-xl">
            {(['all', 'live', 'upcoming', 'championship'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all select-none whitespace-nowrap cursor-pointer',
                  activeCategory === cat
                    ? 'bg-[var(--accent-primary)] text-black shadow-md font-black'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]'
                )}
              >
                {cat === 'all' ? 'All Tournaments' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Cards Grid (Large Widescreen Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredTournaments.map((tour) => {
            const isLive = tour.status === 'Live';

            return (
              <div
                key={tour.id}
                className={cn(
                  'p-8 sm:p-10 rounded-3xl bg-[var(--bg-surface-raised)]/80 dark:bg-black/50 border transition-[transform,border-color,background-color] duration-200 flex flex-col justify-between relative overflow-hidden group shadow-2xl backdrop-blur-xl hover:-translate-y-1',
                  tour.featured
                    ? 'border-[var(--accent-primary)]/40 shadow-[0_0_30px_rgba(255,208,0,0.06)]'
                    : 'border-white/[0.08] hover:border-white/[0.2]'
                )}
              >
                {/* Top Bar: Game Title, Badge & Status Badge */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-xs">
                        {tour.game}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] hidden sm:inline">
                        {tour.badge}
                      </span>
                    </div>

                    <Badge
                      variant={isLive ? 'live' : tour.status === 'Completed' ? 'completed' : 'gold'}
                      size="sm"
                      pulse={isLive}
                    >
                      {tour.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Tournament Title */}
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-display tracking-tight leading-snug group-hover:text-[var(--accent-primary)] transition-colors">
                    {tour.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>Organized by {tour.organizer}</span>
                  </p>

                  {/* Prize Pool & Specs Row */}
                  <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface-inset)]/60 border border-white/[0.06] grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Prize Pool</p>
                      <p className="text-lg sm:text-2xl font-black text-[var(--accent-primary)] font-display mt-0.5">
                        {tour.prizePool}
                      </p>
                    </div>

                    <div className="border-x border-white/[0.08]">
                      <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Teams</p>
                      <p className="text-lg sm:text-2xl font-black text-[var(--text-primary)] font-display mt-0.5">
                        {tour.teamsCount} Slots
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Matches</p>
                      <p className="text-lg sm:text-2xl font-black text-[var(--text-primary)] font-display mt-0.5">
                        {tour.matchesCount} Maps
                      </p>
                    </div>
                  </div>

                  {/* Map Rotation Tags */}
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)] mr-1">Map Rotation:</span>
                    {tour.mapRotation.map((mapName, i) => (
                      <span
                        key={`${mapName}-${i}`}
                        className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] border border-white/[0.06]"
                      >
                        {mapName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Bottom CTA Bar */}
                <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-2 font-semibold">
                    <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>{tour.date}</span>
                  </span>

                  <button
                    type="button"
                    onClick={navigateToAuth}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-black text-xs font-black font-display uppercase tracking-wider transition-all duration-200 cursor-pointer group/btn"
                  >
                    <span>Join Tournament</span>
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner for Organizers */}
        <FadeIn delay={0.25}>
          <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface-raised)]/90 dark:bg-black/60 border border-white/[0.08] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-6 text-center lg:text-left">
              <div className="p-5 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shrink-0 hidden sm:flex shadow-md">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  Hosting Your Own Esports Tournament?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                  Create custom point rules, upload team logos, generate 4K poster graphics, and connect your OBS stream in under 2 minutes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={navigateToAuth}
              className="px-8 py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:shadow-[0_0_30px_rgba(255,208,0,0.6)] whitespace-nowrap transition-all duration-300 cursor-pointer font-display active:scale-[0.98] shadow-xl border border-amber-300/50 shrink-0"
            >
              HOST A TOURNAMENT
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default TournamentShowcase;

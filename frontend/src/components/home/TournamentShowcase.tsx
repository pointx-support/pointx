import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { Badge } from '../ui/Badge';
import { TiltCard } from '../animation/HoverCards';
import { cn } from '../../lib/utils';

export interface TournamentShowcaseProps {
  onNavigateSignup: () => void;
  onNavigateLogin?: () => void;
}

export const TournamentShowcase: React.FC<TournamentShowcaseProps> = ({
  onNavigateSignup,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'live' | 'upcoming' | 'championship'>('all');

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
      organizer: 'Strikz Esports Official',
    },
    {
      id: 'tour-2',
      title: 'Strikz All-Star Battle Royale Invitational',
      game: 'Free Fire MAX',
      status: 'Upcoming' as const,
      prizePool: '₹100,000',
      teamsCount: 12,
      matchesCount: 8,
      date: 'Starts This Saturday',
      mapRotation: ['Bermuda', 'Purgatory', 'Bermuda'],
      featured: false,
      organizer: 'PointX Arena Club',
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
      organizer: 'Strikz Esports Hub',
    },
  ];

  const filteredTournaments = showcaseTournaments.filter((t) => {
    if (activeCategory === 'live') return t.status === 'Live';
    if (activeCategory === 'upcoming') return t.status === 'Upcoming';
    if (activeCategory === 'championship') return t.featured;
    return true;
  });

  return (
    <section id="tournaments" className="py-20 md:py-28 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-4">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
                <Trophy className="h-3.5 w-3.5" />
                <span>Championship Arena</span>
              </div>
            </FadeIn>

            <SlideIn direction="up">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
                Featured Tournaments
              </h2>
            </SlideIn>

            <SlideIn direction="up" delay={0.1}>
              <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
                Explore active community leagues, official invitational tournaments, and championship prize battles operated with PointX.
              </p>
            </SlideIn>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] overflow-x-auto self-start md:self-auto font-sans shadow-inner">
            {(['all', 'live', 'upcoming', 'championship'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all select-none whitespace-nowrap cursor-pointer',
                  activeCategory === cat
                    ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {cat === 'all' ? 'All Tournaments' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {filteredTournaments.map((tour) => {
            const isLive = tour.status === 'Live';

            return (
              <TiltCard key={tour.id}>
                <div
                  className={cn(
                    'h-full p-7 sm:p-8 rounded-3xl bg-[var(--bg-surface-raised)] border transition-all flex flex-col justify-between relative overflow-hidden group shadow-md',
                    tour.featured
                      ? 'border-[var(--accent-primary)]/40 shadow-xl shadow-[var(--accent-primary)]/5'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  )}
                >
                  {/* Top Bar: Game Title & Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--status-info)] px-3 py-1 rounded-xl bg-[var(--status-info)]/10 border border-[var(--status-info)]/20 shadow-xs">
                        {tour.game}
                      </span>

                      <Badge
                        variant={isLive ? 'live' : tour.status === 'Completed' ? 'completed' : 'gold'}
                        size="sm"
                        pulse={isLive}
                      >
                        {tour.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Tournament Title */}
                    <h3 className="text-2xl font-black text-[var(--text-primary)] font-display tracking-tight leading-snug group-hover:text-[var(--accent-primary)] transition-colors">
                      {tour.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-1.5 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      <span>Organized by {tour.organizer}</span>
                    </p>

                    {/* Prize Pool & Specs Row */}
                    <div className="mt-7 p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Prize Pool</p>
                        <p className="text-lg sm:text-xl font-black text-[var(--accent-primary)] font-display mt-0.5">
                          {tour.prizePool}
                        </p>
                      </div>

                      <div className="border-x border-[var(--border-subtle)]">
                        <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Teams</p>
                        <p className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display mt-0.5">
                          {tour.teamsCount} Slots
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Matches</p>
                        <p className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-display mt-0.5">
                          {tour.matchesCount} Maps
                        </p>
                      </div>
                    </div>

                    {/* Map Rotation Tags */}
                    <div className="mt-5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] mr-1">Maps:</span>
                      {tour.mapRotation.map((mapName, i) => (
                        <span
                          key={`${mapName}-${i}`}
                          className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                        >
                          {mapName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom CTA Bar */}
                  <div className="mt-7 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
                      <span>{tour.date}</span>
                    </span>

                    <button
                      type="button"
                      onClick={onNavigateSignup}
                      className="inline-flex items-center gap-2 text-xs font-black text-[var(--accent-primary)] hover:brightness-110 font-display uppercase tracking-wider transition-all cursor-pointer group/btn"
                    >
                      <span>Join Tournament</span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* Bottom Banner for Organizers */}
        <FadeIn delay={0.25}>
          <div className="mt-14 p-7 sm:p-9 rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl transition-colors">
            <div className="flex items-center gap-5 text-center sm:text-left">
              <div className="p-4 rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shrink-0 hidden sm:flex shadow-xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-display uppercase tracking-tight">
                  Hosting Your Own Esports Tournament?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                  Create custom point rules, upload team logos, generate 4K poster graphics, and connect your OBS stream in under 2 minutes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateSignup}
              className="px-8 py-4 rounded-2xl text-xs font-black bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:brightness-110 shadow-lg shadow-[var(--accent-primary)]/20 whitespace-nowrap transition-all cursor-pointer font-display active:scale-[0.98]"
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

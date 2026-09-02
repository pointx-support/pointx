import React, { useState } from 'react';
import {
  Trophy,
  Radio,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { FadeIn, SlideIn } from '../animation/RevealAnimations';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface PreviewTeam {
  rank: number;
  name: string;
  tag: string;
  booyahs: number;
  placementPts: number;
  killPts: number;
  totalPts: number;
}

const INITIAL_TEAMS: PreviewTeam[] = [
  { rank: 1, name: 'Total Gaming Esports', tag: 'TG', booyahs: 2, placementPts: 36, killPts: 32, totalPts: 68 },
  { rank: 2, name: 'Team Elite Champions', tag: 'TE', booyahs: 1, placementPts: 28, killPts: 24, totalPts: 52 },
  { rank: 3, name: 'TSM FTX India', tag: 'TSM', booyahs: 1, placementPts: 24, killPts: 22, totalPts: 46 },
  { rank: 4, name: 'Orangutan Esports', tag: 'OG', booyahs: 0, placementPts: 20, killPts: 21, totalPts: 41 },
  { rank: 5, name: 'GodLike Esports', tag: 'GODL', booyahs: 0, placementPts: 18, killPts: 19, totalPts: 37 },
  { rank: 6, name: 'Blind Esports', tag: 'BLIND', booyahs: 0, placementPts: 16, killPts: 17, totalPts: 33 },
];

export const LiveStandingsPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'obs' | 'poster'>('matrix');
  const [teams, setTeams] = useState<PreviewTeam[]>(INITIAL_TEAMS);
  const [lastCalculatedTime, setLastCalculatedTime] = useState<string>('0.38ms');

  // Interactive Live Calculation Simulator
  const handleAddKills = (index: number) => {
    const updated = [...teams];
    updated[index] = {
      ...updated[index],
      killPts: updated[index].killPts + 2,
      totalPts: updated[index].totalPts + 2,
    };
    // Re-sort by total points desc, then placement points desc, then kill points desc
    updated.sort((a, b) => b.totalPts - a.totalPts || b.placementPts - a.placementPts || b.killPts - a.killPts);
    // Re-assign ranks
    const ranked = updated.map((t, i) => ({ ...t, rank: i + 1 }));
    setTeams(ranked);
    setLastCalculatedTime(`${(Math.random() * 0.2 + 0.25).toFixed(2)}ms`);
  };

  const handleAddBooyah = (index: number) => {
    const updated = [...teams];
    updated[index] = {
      ...updated[index],
      booyahs: updated[index].booyahs + 1,
      placementPts: updated[index].placementPts + 12,
      totalPts: updated[index].totalPts + 12,
    };
    updated.sort((a, b) => b.totalPts - a.totalPts || b.placementPts - a.placementPts || b.killPts - a.killPts);
    const ranked = updated.map((t, i) => ({ ...t, rank: i + 1 }));
    setTeams(ranked);
    setLastCalculatedTime(`${(Math.random() * 0.2 + 0.25).toFixed(2)}ms`);
  };

  const handleResetSimulation = () => {
    setTeams(INITIAL_TEAMS);
    setLastCalculatedTime('0.38ms');
  };

  return (
    <section id="broadcast" className="py-20 md:py-28 relative overflow-hidden transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-mono font-bold uppercase tracking-wider shadow-xs">
              <Radio className="h-3.5 w-3.5" />
              <span>Interactive Telemetry Engine</span>
            </div>
          </FadeIn>

          <SlideIn direction="up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight uppercase leading-[1.08]">
              See PointX In Action
            </h2>
          </SlideIn>

          <SlideIn direction="up" delay={0.1}>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Test drive the real-time scoring matrix, the live OBS broadcast overlay scoreboard, and the 4K poster generator right here.
            </p>
          </SlideIn>
        </div>

        {/* 3-Way Mode Switcher Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-sans shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={cn(
                'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
                activeTab === 'matrix'
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Trophy className="h-4 w-4" />
              <span>Admin Scoring Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('obs')}
              className={cn(
                'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
                activeTab === 'obs'
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--status-info)] border border-[var(--border-subtle)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Radio className="h-4 w-4" />
              <span>OBS Studio Overlay</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('poster')}
              className={cn(
                'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none',
                activeTab === 'poster'
                  ? 'bg-[var(--bg-surface-raised)] text-amber-500 border border-[var(--border-subtle)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <ImageIcon className="h-4 w-4" />
              <span>4K Social Poster</span>
            </button>
          </div>
        </div>

        {/* Interactive Preview Canvas */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-2xl p-5 sm:p-7 lg:p-9 overflow-hidden relative transition-colors">
          
          {/* TAB 1: Live Interactive Admin Scoring Matrix Table */}
          {activeTab === 'matrix' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header with Live Engine Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--border-subtle)] gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-black text-lg sm:text-xl text-[var(--text-primary)] font-display uppercase tracking-tight">
                      Overall Championship Standings Matrix
                    </h3>
                    <Badge variant="live" size="sm" pulse>LIVE CALCULATION</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Official Free Fire Scoring Rule (FFWS Preset: 12 Pts Booyah, 1 Pt/Kill)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--status-live)]/10 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-mono font-bold">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Engine: {lastCalculatedTime}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    className="p-2 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Reset Simulation"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[580px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <th className="pb-3 px-3 w-16">Rank</th>
                      <th className="pb-3 px-3">Team Name</th>
                      <th className="pb-3 px-3 text-center">Booyahs</th>
                      <th className="pb-3 px-3 text-right">Place Pts</th>
                      <th className="pb-3 px-3 text-right">Kill Pts</th>
                      <th className="pb-3 px-3 text-right">Total Pts</th>
                      <th className="pb-3 px-3 text-right">Simulate Live</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-xs sm:text-sm font-sans">
                    {teams.map((team, idx) => (
                      <tr
                        key={team.name}
                        className={cn(
                          'hover:bg-[var(--bg-surface-hover)] transition-colors',
                          team.rank === 1 ? 'bg-[var(--accent-primary)]/5 font-semibold' : ''
                        )}
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center h-7 w-7 rounded-lg font-mono text-xs font-black shadow-xs',
                              team.rank === 1
                                ? 'bg-[var(--accent-primary)] text-black'
                                : team.rank === 2
                                ? 'bg-zinc-400 text-black'
                                : team.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)]'
                            )}
                          >
                            #{team.rank}
                          </span>
                        </td>

                        {/* Team Name */}
                        <td className="py-3.5 px-3 font-bold text-[var(--text-primary)]">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                            <span>{team.name}</span>
                          </div>
                        </td>

                        {/* Booyah Counter */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-[var(--accent-primary)]">
                          {team.booyahs > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 fill-current" />
                              <span>{team.booyahs}</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">-</span>
                          )}
                        </td>

                        {/* Placement Pts */}
                        <td className="py-3.5 px-3 text-right font-mono text-[var(--text-secondary)] font-semibold">
                          {team.placementPts}
                        </td>

                        {/* Kill Pts */}
                        <td className="py-3.5 px-3 text-right font-mono text-[var(--status-danger)] font-bold">
                          {team.killPts}
                        </td>

                        {/* Total Pts */}
                        <td className="py-3.5 px-3 text-right font-mono text-base font-black text-[var(--accent-primary)]">
                          {team.totalPts}
                        </td>

                        {/* Interactive Action Trigger */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddKills(idx)}
                              className="px-2 py-1 rounded-md bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-black border border-[var(--border-subtle)] text-[11px] font-mono font-bold transition-colors cursor-pointer"
                              title="Add 2 Kills"
                            >
                              +2 Kills
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddBooyah(idx)}
                              className="px-2 py-1 rounded-md bg-[var(--bg-surface-inset)] hover:bg-amber-400 hover:text-black border border-[var(--border-subtle)] text-[11px] font-mono font-bold transition-colors cursor-pointer"
                              title="Add Booyah (+12 pts)"
                            >
                              +Booyah
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simulation Instructions */}
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  <span>Click "+2 Kills" or "+Booyah" to witness live sorting in &lt;0.4s</span>
                </span>
                <span className="hidden sm:inline">PointX High-Velocity Math Core</span>
              </div>
            </div>
          )}

          {/* TAB 2: OBS Studio Live Broadcast Overlay */}
          {activeTab === 'obs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-mono font-bold uppercase text-[var(--status-info)]">
                    OBS Studio Browser Source Feed (1920×1080 Alpha Channel)
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Zero-delay WebSocket broadcast sync directly on stream</p>
                </div>
                <Badge variant="live" size="sm" pulse>BROADCAST READY</Badge>
              </div>

              {/* Simulated Broadcast Lower-Third & Standings Board */}
              <div className="p-7 rounded-2xl bg-gradient-to-br from-black/95 via-zinc-950/95 to-black/95 border border-[var(--status-info)]/30 backdrop-blur-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)] text-black text-xs font-black font-display tracking-wider">
                      POINTX LIVE
                    </span>
                    <span className="text-sm font-bold text-white uppercase font-display tracking-wide">
                      FFWS FINALS • MATCH 4 STANDINGS
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>12 TEAMS ALIVE</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  {teams.slice(0, 4).map((t) => (
                    <div key={t.rank} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--accent-primary)]/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-[var(--accent-primary)] text-sm">#{t.rank}</span>
                        <span className="text-white font-bold truncate max-w-[150px]">{t.name}</span>
                      </div>
                      <span className="text-amber-400 font-black text-sm">{t.totalPts} PTS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 4K Social Poster Generator */}
          {activeTab === 'poster' && (
            <div className="space-y-6 animate-in fade-in duration-300 text-center">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-2 text-left">
                <div className="space-y-0.5">
                  <p className="text-sm font-mono font-bold uppercase text-amber-500">
                    4K Ultra High-Resolution Export Preview
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Direct export in 3840×2160 PNG for Instagram, Twitter/X, and Discord</p>
                </div>
                <Badge variant="gold" size="sm">4K PNG READY</Badge>
              </div>

              <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#181c24] via-[#101319] to-[#0d1015] border border-amber-500/30 text-center space-y-5 shadow-2xl">
                <div className="inline-block p-3 rounded-2xl bg-amber-500/10 text-amber-400 shadow-xs">
                  <Trophy className="h-10 w-10" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
                    FFWS PRO INVITATIONAL • OVERALL CHAMPIONS
                  </h4>
                  <p className="text-sm font-mono text-amber-400 font-bold">
                    WINNER: {teams[0].name.toUpperCase()} ({teams[0].totalPts} PTS • {teams[0].booyahs} BOOYAHS)
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-xs font-mono text-zinc-300 border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Publication-Ready High-DPI Graphic</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default LiveStandingsPreview;

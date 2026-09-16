import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Smartphone,
  Palette,
  Flame,
  Zap,
  Minus,
  Skull,
  CheckCircle2,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { haptics } from '../../lib/haptics';

export type FeatureTab = 'obs' | 'remote' | 'studio';

interface SquadState {
  id: string;
  name: string;
  tag: string;
  rank: number;
  elims: number;
  totalPts: number;
  isFire?: boolean;
  isRush?: boolean;
  players: ('alive' | 'knock' | 'eliminated')[];
}

const INITIAL_SQUADS: SquadState[] = [
  {
    id: '1',
    name: 'Total Gaming Esports',
    tag: 'TG',
    rank: 1,
    elims: 3,
    totalPts: 12,
    isFire: true,
    isRush: true,
    players: ['alive', 'alive', 'alive', 'alive'],
  },
  {
    id: '2',
    name: 'Team Elite',
    tag: 'TE',
    rank: 2,
    elims: 4,
    totalPts: 12,
    isFire: true,
    isRush: true,
    players: ['alive', 'alive', 'alive', 'alive'],
  },
  {
    id: '3',
    name: 'Orangutan Elite',
    tag: 'OG',
    rank: 3,
    elims: 0,
    totalPts: 7,
    isFire: false,
    isRush: true,
    players: ['alive', 'alive', 'alive', 'alive'],
  },
  {
    id: '4',
    name: 'GodLike Esports',
    tag: 'GODL',
    rank: 4,
    elims: 0,
    totalPts: 6,
    isFire: false,
    isRush: true,
    players: ['alive', 'alive', 'alive', 'alive'],
  },
];

const OBS_TEAMS = [
  { rank: 1, name: 'Chemical Esports', tag: 'CHM', isFire: true, alive: 4, elims: 40, totalPts: 43 },
  { rank: 2, name: 'Nigma Galaxy', tag: 'NGX', isFire: false, alive: 4, elims: 10, totalPts: 22 },
  { rank: 3, name: 'Team Elite', tag: 'TE', isFire: false, alive: 4, elims: 4, totalPts: 12 },
  { rank: 4, name: 'Total Gaming', tag: 'TG', isFire: false, alive: 4, elims: 3, totalPts: 12 },
  { rank: 5, name: 'Orangutan Elite', tag: 'OG', isFire: false, alive: 4, elims: 0, totalPts: 7 },
  { rank: 6, name: 'GodLike Esports', tag: 'GODL', isFire: false, alive: 4, elims: 0, totalPts: 6 },
  { rank: 7, name: 'Blind Esports', tag: 'BLI', isFire: false, alive: 4, elims: 0, totalPts: 5 },
  { rank: 8, name: 'Revenant Esports', tag: 'RNT', isFire: false, alive: 4, elims: 0, totalPts: 4 },
  { rank: 9, name: 'Enigma Gaming', tag: 'EG', isFire: false, alive: 4, elims: 3, totalPts: 3 },
  { rank: 10, name: 'TSM FTX India', tag: 'TSM', isFire: false, alive: 4, elims: 0, totalPts: 2 },
  { rank: 11, name: 'Desi Gamers', tag: 'DG', isFire: false, alive: 4, elims: 0, totalPts: 1 },
  { rank: 12, name: 'Head Hunters', tag: 'HH', isFire: false, alive: 4, elims: 0, totalPts: 0 },
];

export const LandingFeaturesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('obs');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [squads, setSquads] = useState<SquadState[]>(INITIAL_SQUADS);
  const [copiedObsUrl, setCopiedObsUrl] = useState<boolean>(false);
  const [lastSyncSignal, setLastSyncSignal] = useState<string>('0.38ms');
  const [syncPulse, setSyncPulse] = useState<boolean>(false);

  // Graphics Studio interactive state
  const [studioLayout, setStudioLayout] = useState<'single' | 'dual'>('dual');
  const [studioTheme, setStudioTheme] = useState<'gold' | 'neon' | 'obsidian'>('gold');

  // Auto-cycle tabs every 6.5s unless user paused it
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'obs') return 'remote';
        if (prev === 'remote') return 'studio';
        return 'obs';
      });
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleTabSelect = (tab: FeatureTab) => {
    haptics.light();
    setIsAutoPlaying(false);
    setActiveTab(tab);
  };

  const triggerSyncPulse = () => {
    setSyncPulse(true);
    setLastSyncSignal(`${(Math.random() * 0.12 + 0.25).toFixed(2)}ms`);
    setTimeout(() => setSyncPulse(false), 800);
  };

  // Remote Controller Interactive Handlers
  const handleAddElim = (teamId: string) => {
    haptics.medium();
    setIsAutoPlaying(false);
    triggerSyncPulse();
    setSquads((prev) =>
      prev.map((s) =>
        s.id === teamId
          ? { ...s, elims: s.elims + 1, totalPts: s.totalPts + 1 }
          : s
      )
    );
  };

  const handleSubtractElim = (teamId: string) => {
    haptics.light();
    setIsAutoPlaying(false);
    triggerSyncPulse();
    setSquads((prev) =>
      prev.map((s) =>
        s.id === teamId && s.elims > 0
          ? { ...s, elims: s.elims - 1, totalPts: Math.max(0, s.totalPts - 1) }
          : s
      )
    );
  };

  const handleTogglePlayer = (teamId: string, playerIdx: number) => {
    haptics.light();
    setIsAutoPlaying(false);
    triggerSyncPulse();
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id !== teamId) return s;
        const newPlayers = [...s.players];
        const cur = newPlayers[playerIdx];
        if (cur === 'alive') newPlayers[playerIdx] = 'knock';
        else if (cur === 'knock') newPlayers[playerIdx] = 'eliminated';
        else newPlayers[playerIdx] = 'alive';
        return { ...s, players: newPlayers };
      })
    );
  };

  const handleWipeSquad = (teamId: string) => {
    haptics.warning();
    setIsAutoPlaying(false);
    triggerSyncPulse();
    setSquads((prev) =>
      prev.map((s) =>
        s.id === teamId
          ? { ...s, players: ['eliminated', 'eliminated', 'eliminated', 'eliminated'] }
          : s
      )
    );
  };

  const handleReviveSquad = (teamId: string) => {
    haptics.medium();
    setIsAutoPlaying(false);
    triggerSyncPulse();
    setSquads((prev) =>
      prev.map((s) =>
        s.id === teamId
          ? { ...s, players: ['alive', 'alive', 'alive', 'alive'] }
          : s
      )
    );
  };

  const handleCopyObsUrl = () => {
    navigator.clipboard.writeText('https://pointx.in/obs/live?key=ffws-demo');
    setCopiedObsUrl(true);
    setTimeout(() => setCopiedObsUrl(false), 2000);
  };

  return (
    <div
      className="relative w-full rounded-3xl border backdrop-blur-2xl overflow-hidden shadow-2xl bg-white/95 dark:bg-[#0a0d14]/95 border-slate-200 dark:border-white/[0.14] shadow-[0_24px_60px_rgba(15,23,42,0.1)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.8)]"
      onMouseEnter={() => setIsAutoPlaying(false)}
    >
      {/* Top Laser Glow Accent */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none" />

      {/* 1. FEATURE NAVIGATION TABS */}
      <div className="p-2 sm:p-2.5 bg-black/[0.04] dark:bg-black/60 border-b border-[var(--border-subtle)] flex items-center justify-between gap-1.5 overflow-x-auto">
        {/* Tab 1: OBS Overlay */}
        <button
          type="button"
          onClick={() => handleTabSelect('obs')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'obs'
              ? 'bg-amber-400 dark:bg-amber-400 text-black shadow-md font-black shadow-amber-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <Monitor className="h-3.5 w-3.5 shrink-0" />
          <span className="tracking-wider uppercase">OBS Overlay</span>
        </button>

        {/* Tab 2: Mobile Remote */}
        <button
          type="button"
          onClick={() => handleTabSelect('remote')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'remote'
              ? 'bg-amber-400 dark:bg-amber-400 text-black shadow-md font-black shadow-amber-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          <span className="tracking-wider uppercase">Match Remote</span>
        </button>

        {/* Tab 3: Graphics Studio */}
        <button
          type="button"
          onClick={() => handleTabSelect('studio')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'studio'
              ? 'bg-amber-400 dark:bg-amber-400 text-black shadow-md font-black shadow-amber-500/20'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <Palette className="h-3.5 w-3.5 shrink-0" />
          <span className="tracking-wider uppercase">Graphics Studio</span>
        </button>
      </div>

      {/* 2. DYNAMIC FEATURE DISPLAY CANVAS */}
      <div className="p-3 sm:p-4 min-h-[440px] max-h-[480px] overflow-y-auto flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* FEATURE 1: OBS OVERLAY LEADERBOARD (MATCHING IMAGE 3) */}
          {activeTab === 'obs' && (
            <motion.div
              key="obs"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 flex-1 flex flex-col justify-between"
            >
              {/* Overlay Meta Header */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span
                    className="font-black text-emerald-500 tracking-wider uppercase text-[11px]"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    OBS LIVE IN-GAME OVERLAY
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  TRANSPARENT 4K BROWSER SOURCE
                </span>
              </div>

              {/* OBS Overlay Frame (Faithful to Image 3) */}
              <div className="rounded-xl overflow-hidden border border-[#3b2359] bg-[#14092b] shadow-xl text-left select-none">
                {/* Table Column Headers */}
                <div
                  className="bg-[#14092b] text-white flex items-center px-2 py-1.5 text-[11px] font-bold border-b border-[#2b1442]"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <div className="w-6 text-center text-slate-300">#</div>
                  <div className="flex-1 pl-2 uppercase tracking-wide text-slate-100">TEAMS</div>
                  <div className="w-16 text-center uppercase tracking-wide text-slate-100">ALIVE</div>
                  <div className="w-12 text-center uppercase tracking-wide text-slate-100">ELIMS</div>
                  <div className="w-12 text-right pr-1 uppercase tracking-wide text-slate-100">T.PTS.</div>
                  <div className="pl-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  </div>
                </div>

                {/* Team Rows */}
                <div className="divide-y divide-[#cfb99f]/30">
                  {OBS_TEAMS.slice(0, 7).map((team) => {
                    const isFirst = team.rank === 1;

                    return (
                      <div
                        key={team.rank}
                        className={`flex items-center h-8 sm:h-9 transition-colors text-xs ${
                          isFirst
                            ? 'bg-gradient-to-r from-[#991b1b] via-[#ea580c] to-[#f97316] text-white font-black'
                            : 'bg-gradient-to-b from-[#eedecf] to-[#e4ceb9] text-[#1c140d]'
                        }`}
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        {/* Rank Badge */}
                        <div
                          className={`w-6 h-full flex items-center justify-center font-black text-xs border-r ${
                            isFirst
                              ? 'bg-[#8f2702] text-white border-[#5a1400]'
                              : 'bg-[#23123f] text-white border-[#341b5c]'
                          }`}
                        >
                          {team.rank}
                        </div>

                        {/* Tag & Name */}
                        <div className="flex-1 flex items-center gap-1.5 pl-2 min-w-0 pr-1">
                          <div
                            className={`h-5 w-5 rounded shrink-0 flex items-center justify-center font-black text-[9px] border shadow-xs ${
                              isFirst
                                ? 'bg-[#fff4e6] border-[#ffa94d] text-[#d9480f]'
                                : 'bg-[#361e56] border-[#4e2c7a] text-white'
                            }`}
                          >
                            {team.tag}
                          </div>
                          <span className={`font-black text-xs truncate ${isFirst ? 'text-white' : 'text-[#19110a]'}`}>
                            {team.name}
                          </span>
                          {team.isFire && (
                            <span className="flex items-center gap-0.5 bg-black/40 text-[#ffeedd] px-1 py-0.2 rounded text-[8px] font-black tracking-wider border border-amber-400/60 shrink-0">
                              <Flame className="h-2 w-2 text-amber-300 fill-amber-300 animate-pulse" />
                              FIRE
                            </span>
                          )}
                        </div>

                        {/* Alive 4 Bars */}
                        <div className="w-16 flex items-center justify-center gap-0.5 px-1">
                          {[1, 2, 3, 4].map((bar) => (
                            <span
                              key={bar}
                              className="h-3.5 w-1.5 rounded-xs bg-[#10b981] shadow-xs"
                            />
                          ))}
                        </div>

                        {/* Elims */}
                        <div className={`w-12 text-center font-black text-xs ${isFirst ? 'text-white' : 'text-[#8f2702]'}`}>
                          {team.elims}
                        </div>

                        {/* Total Points */}
                        <div className={`w-12 text-right pr-2 font-black text-xs ${isFirst ? 'text-white' : 'text-[#19110a]'}`}>
                          {team.totalPts}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stream URL & Live Indicator Dock */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--border-subtle)] font-mono">
                <div className="flex items-center gap-2 min-w-0 text-[var(--text-secondary)]">
                  <Radio className="h-3 w-3 text-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate text-[10px]">pointx.in/obs/live?key=ffws-2026</span>
                  <button
                    type="button"
                    onClick={handleCopyObsUrl}
                    className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-amber-400 hover:text-black transition-colors text-[9px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
                    title="Copy OBS Link"
                  >
                    {copiedObsUrl ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                    <span>{copiedObsUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span
                  className="shrink-0 px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase text-[9px] border border-amber-500/25"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  ⚡ 0.38MS CALC ENGINE
                </span>
              </div>
            </motion.div>
          )}

          {/* FEATURE 2: MOBILE MATCH REMOTE (MATCHING IMAGE 2) */}
          {activeTab === 'remote' && (
            <motion.div
              key="remote"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 flex-1 flex flex-col justify-between"
            >
              {/* Meta Status Header with Sync Pulse */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span
                    className="font-black text-amber-500 tracking-wider uppercase text-[11px]"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    TACTILE MOBILE MATCH REMOTE
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      syncPulse
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105'
                        : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    ⚡ {lastSyncSignal} DIFF
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold hidden sm:inline">
                    PAIR PIN: 8492
                  </span>
                </div>
              </div>

              {/* Interactive Remote Squad Cards (Faithful to Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[300px] pr-0.5">
                {squads.slice(0, 2).map((squad) => {
                  return (
                    <div
                      key={squad.id}
                      className="p-3 rounded-2xl bg-[#0f0a1d] border border-purple-900/40 text-white shadow-md text-left relative overflow-hidden"
                    >
                      {/* Top Team Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-5 w-5 rounded bg-purple-950/80 border border-purple-800 text-[10px] font-mono font-bold flex items-center justify-center text-purple-300 shrink-0">
                            {squad.rank}
                          </span>
                          <span className="font-black text-xs text-slate-100 truncate font-sans">
                            {squad.name}
                          </span>
                          <span className="text-[10px] text-purple-400 font-mono">[{squad.tag}]</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {squad.isFire && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] font-bold uppercase flex items-center gap-0.5">
                              <Flame className="h-2 w-2" /> FIRE
                            </span>
                          )}
                          {squad.isRush && (
                            <span className="px-1 py-0.2 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[8px] font-bold uppercase flex items-center gap-0.5">
                              <Zap className="h-2 w-2" /> RUSH
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Elims & Total Points with Stepper Buttons */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/20 border border-purple-900/30">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[8px] font-mono text-slate-400 uppercase block leading-none">
                              ELIMS
                            </span>
                            <span
                              className="text-base font-black text-rose-400 leading-tight"
                              style={{ fontFamily: "'Rajdhani', sans-serif" }}
                            >
                              {squad.elims}
                            </span>
                          </div>
                          <div className="h-6 w-px bg-purple-900/40" />
                          <div>
                            <span className="text-[8px] font-mono text-slate-400 uppercase block leading-none">
                              TOTAL PTS
                            </span>
                            <span
                              className="text-base font-black text-amber-400 leading-tight"
                              style={{ fontFamily: "'Rajdhani', sans-serif" }}
                            >
                              {squad.totalPts}
                            </span>
                          </div>
                        </div>

                        {/* - and +1 stepper buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSubtractElim(squad.id)}
                            className="h-7 w-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer active:scale-95"
                            title="Subtract 1 elim"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddElim(squad.id)}
                            className="h-7 w-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center font-black text-xs transition-colors cursor-pointer active:scale-95 shadow-md shadow-rose-950/60"
                            title="Add 1 elim"
                          >
                            +1
                          </button>
                        </div>
                      </div>

                      {/* Player States P1 - P4 Tap to Toggle */}
                      <div className="mt-2.5">
                        <span className="text-[8px] font-mono text-slate-400 block mb-1 uppercase tracking-wider">
                          Player States (Tap to toggle)
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {squad.players.map((status, idx) => {
                            let statusClasses = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
                            let label = 'ALIVE';

                            if (status === 'knock') {
                              statusClasses = 'bg-amber-950/70 border-amber-500/70 text-amber-300 animate-pulse';
                              label = 'KNOCK';
                            } else if (status === 'eliminated') {
                              statusClasses = 'bg-neutral-900 border-neutral-700 text-neutral-500';
                              label = 'DEAD';
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleTogglePlayer(squad.id, idx)}
                                className={`py-1 px-0.5 rounded border text-[9px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${statusClasses}`}
                              >
                                <span>P{idx + 1}</span>
                                <span className="text-[7px] font-black">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Squad Quick Actions: Wipe / Revive */}
                      <div className="mt-2.5 pt-2 border-t border-purple-900/30 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleWipeSquad(squad.id)}
                          className="flex-1 py-1 px-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-neutral-800 text-[9px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Skull className="h-2.5 w-2.5" />
                          <span>Wipe</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviveSquad(squad.id)}
                          className="flex-1 py-1 px-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 text-[9px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Revive</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Instructions / Latency note */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-[var(--border-subtle)] font-mono text-[var(--text-secondary)]">
                <span className="text-[10px]">Tap players to cycle: ALIVE → KNOCK → DEAD</span>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">
                  Zero Delays • WebSocket
                </span>
              </div>
            </motion.div>
          )}

          {/* FEATURE 3: GRAPHICS STUDIO & TEMPLATES */}
          {activeTab === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 flex-1 flex flex-col justify-between"
            >
              {/* Studio Meta Header */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span
                    className="font-black text-cyan-500 tracking-wider uppercase text-[11px]"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    GRAPHICS STUDIO • PSD AUTO-ALIGN
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 text-[10px] font-bold border border-cyan-500/20 uppercase">
                    1080P & 4K EXPORT
                  </span>
                </div>
              </div>

              {/* Interactive Template Canvas Mockup */}
              <div
                className={`relative p-3 rounded-2xl border transition-all text-white overflow-hidden shadow-xl ${
                  studioTheme === 'gold'
                    ? 'bg-gradient-to-br from-[#1c1409] via-[#0d0905] to-[#171007] border-amber-500/40 shadow-amber-500/10'
                    : studioTheme === 'neon'
                    ? 'bg-gradient-to-br from-[#0c1424] via-[#060a14] to-[#0a1220] border-cyan-500/40 shadow-cyan-500/10'
                    : 'bg-gradient-to-br from-[#1a0a0f] via-[#0f0508] to-[#14080c] border-rose-500/40 shadow-rose-500/10'
                }`}
              >
                {/* Template Canvas Header Bar */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                      CHAMPIONSHIP STANDINGS TEMPLATE
                    </span>
                    <h4
                      className="text-sm font-black text-white uppercase tracking-wider"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      FREE FIRE BATTLEGROUNDS 2026
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold uppercase">
                    MATCH 4 OF 6
                  </span>
                </div>

                {/* PSD Auto-Detection Tag Pills */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto text-[9px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0 font-bold">
                    <Check className="h-2.5 w-2.5" /> 12 Photopea Layers Snapped
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                    Coords: Sub-Pixel Locked
                  </span>
                </div>

                {/* Mock Template Grid (Single vs Dual Column) */}
                <div
                  className={`grid gap-1 text-left ${
                    studioLayout === 'dual' ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {OBS_TEAMS.slice(0, studioLayout === 'dual' ? 6 : 4).map((team) => (
                    <div
                      key={team.rank}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px]"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-4 w-4 rounded bg-amber-400 text-black font-black text-[10px] flex items-center justify-center shrink-0">
                          {team.rank}
                        </span>
                        <span className="font-bold truncate text-white text-[11px]">{team.name}</span>
                      </div>
                      <span className="font-black text-amber-400 text-xs shrink-0">{team.totalPts} PTS</span>
                    </div>
                  ))}
                </div>

                {/* Floating PSD Watermark */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Photopea / Photoshop .PSD Supported</span>
                  <span className="text-amber-400 font-bold">Zero Alignment Code</span>
                </div>
              </div>

              {/* Template Controls Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Layout Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[10px] font-mono">
                  <span className="text-zinc-500 pl-1 text-[9px]">Layout:</span>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setStudioLayout('dual');
                    }}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      studioLayout === 'dual'
                        ? 'bg-amber-400 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Dual (6x6)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setStudioLayout('single');
                    }}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      studioLayout === 'single'
                        ? 'bg-amber-400 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Single (12)
                  </button>
                </div>

                {/* Theme Palette Switcher */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setStudioTheme('gold');
                    }}
                    className={`h-5 w-5 rounded-full bg-amber-400 transition-transform cursor-pointer ${
                      studioTheme === 'gold' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                    title="Championship Gold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setStudioTheme('neon');
                    }}
                    className={`h-5 w-5 rounded-full bg-cyan-400 transition-transform cursor-pointer ${
                      studioTheme === 'neon' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                    title="Cyber Neon"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setStudioTheme('obsidian');
                    }}
                    className={`h-5 w-5 rounded-full bg-rose-500 transition-transform cursor-pointer ${
                      studioTheme === 'obsidian' ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                    title="Crimson Obsidian"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. CARD FOOTER */}
      <div className="px-4 py-2.5 bg-black/[0.03] dark:bg-black/40 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sync Protocol: WebSocket 200B Delta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold">100% Realtime</span>
        </div>
      </div>
    </div>
  );
};

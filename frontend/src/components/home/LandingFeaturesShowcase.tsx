import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../lib/haptics';
import {
  Layers,
  Monitor,
  Smartphone,
  Palette,
  CheckCircle2,
  ExternalLink,
  Radio,
  Zap,
} from 'lucide-react';

type FeatureTab = 'all' | 'overlay' | 'remote' | 'graphics';

interface FeatureMetadata {
  id: FeatureTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  tag: string;
  badge: string;
  title: string;
  description: string;
  specs: string[];
  image: string;
  alt: string;
}

const FEATURES: FeatureMetadata[] = [
  {
    id: 'overlay',
    label: 'Live OBS Overlay',
    shortLabel: 'OBS Overlay',
    icon: Monitor,
    tag: 'BROADCAST HUD',
    badge: '1080p60 / 4K',
    title: 'Real-Time In-Game Stream HUD',
    description: 'Zero-latency transparent browser source for OBS Studio. Updates alive players, team kills, and standings dynamically.',
    specs: ['OBS & vMix Ready', '4-Player HP Telemetry', '< 50ms WebSocket Delta'],
    image: '/features/obs-overlay.png',
    alt: 'PointX 12-Team Live Broadcast OBS Overlay',
  },
  {
    id: 'remote',
    label: 'Match Remote Deck',
    shortLabel: 'Admin Remote',
    icon: Smartphone,
    tag: 'MOBILE CONTROL',
    badge: '0ms WebSocket',
    title: 'Tactile Tournament Admin Deck',
    description: 'Transform any smartphone or tablet into a master control console. Increment kills, knock players, and wipe squads with single taps.',
    specs: ['Multi-Admin Lockstep', 'QR / PIN Pairing', 'Monotonic Revision State'],
    image: '/features/obs-remote.png',
    alt: 'PointX Mobile Remote Controller Console',
  },
  {
    id: 'graphics',
    label: '4K Graphics Studio',
    shortLabel: '4K Standings',
    icon: Palette,
    tag: 'GRAPHICS ENGINE',
    badge: 'PSD Layer Import',
    title: 'Overall Standings & Social Posters',
    description: 'Auto-align tournament standings directly onto high-resolution PSD templates for Instagram, Twitter, and broadcast screens.',
    specs: ['Direct .PSD Sync', 'Tie-Breaker Logic', '4K Poster Export'],
    image: '/features/graphics-template.jpg',
    alt: 'PointX Leaderboard Standings Template',
  },
];

export const LandingFeaturesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('all');
  const [hoveredCard, setHoveredCard] = useState<FeatureTab | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleTabChange = (tab: FeatureTab) => {
    haptics.selection();
    setActiveTab(tab);
  };

  return (
    <div className="relative w-full max-w-[620px] mx-auto flex flex-col items-center select-none">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. PROFESSIONAL SEGMENTED BROADCAST SWITCHER PILL                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Features Showcase Navigation"
        className="w-full flex items-center justify-between p-1.5 mb-4 rounded-2xl bg-black/60 dark:bg-[#0c0f17]/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-40"
      >
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'all'
              ? 'text-amber-400 bg-amber-500/15 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">All Views</span>
        </button>

        {FEATURES.map((feat) => {
          const Icon = feat.icon;
          const isActive = activeTab === feat.id;
          return (
            <button
              key={feat.id}
              type="button"
              onClick={() => handleTabChange(feat.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-amber-400 bg-amber-500/15 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate hidden sm:inline">{feat.shortLabel}</span>
              <span className="truncate sm:hidden">{feat.shortLabel.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. STAGE VIEWPORT CONTAINER                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[430px] sm:h-[480px] md:h-[510px] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0e0a1a]/95 via-[#080512]/98 to-[#05030a] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-3 sm:p-4 flex items-center justify-center">
        {/* Ambient Stage Background Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeTab === 'all' ? (
            /* ─────────────────────────────────────────────────────────────── */
            /* MODE A: THE PRO BROADCAST DECK (HARMONIOUS 3-CARD COMPOSITION)   */
            /* ─────────────────────────────────────────────────────────────── */
            <motion.div
              key="all-deck"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full h-full"
            >
              {/* Telemetry Header Pill */}
              <div className="absolute top-1 left-2 z-35 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-bold text-emerald-400 uppercase tracking-wider">PointX Studio Live</span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400 font-bold">3 Ecosystem Screens</span>
              </div>

              {/* Quick Prompt on Top-Right */}
              <div className="absolute top-1.5 right-2 z-35 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
                <span>Click any card to inspect</span>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* LAYER 1 (Top-Right): 4K GRAPHICS STANDINGS STUDIO (16:9)       */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div
                onClick={() => handleTabChange('graphics')}
                onMouseEnter={() => setHoveredCard('graphics')}
                onMouseLeave={() => setHoveredCard(null)}
                className={`absolute top-9 right-1 sm:right-2 w-[68%] sm:w-[66%] cursor-pointer transition-all duration-300 ${
                  hoveredCard === 'graphics'
                    ? 'z-30 scale-[1.03] -translate-y-1'
                    : 'z-10 hover:z-30'
                }`}
              >
                <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-amber-500/30 bg-[#120b22] shadow-[0_18px_40px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 group">
                  {/* macOS / Broadcast Window Titlebar */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#19102b] border-b border-white/10 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                      <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 font-bold tracking-wider text-amber-300 uppercase">4K Poster Studio</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[9px] bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      PSD SYNC
                    </span>
                  </div>
                  {/* High-Res Template Screenshot */}
                  <div className="relative overflow-hidden aspect-[16/9] bg-black">
                    <img
                      src="/features/graphics-template.jpg"
                      alt="PointX Leaderboard Standings Template"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
                        Expand 4K Graphics <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* LAYER 2 (Left): LIVE OBS STREAM OVERLAY (Portrait HUD)        */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div
                onClick={() => handleTabChange('overlay')}
                onMouseEnter={() => setHoveredCard('overlay')}
                onMouseLeave={() => setHoveredCard(null)}
                className={`absolute top-8 left-1 sm:left-2 w-[44%] sm:w-[42%] cursor-pointer transition-all duration-300 ${
                  hoveredCard === 'overlay'
                    ? 'z-30 scale-[1.03] -translate-y-1'
                    : 'z-20 hover:z-30'
                }`}
              >
                <div className="rounded-xl sm:rounded-2xl overflow-hidden border-2 border-cyan-400/50 bg-[#090717] shadow-[0_22px_55px_rgba(0,0,0,0.95)] ring-1 ring-cyan-400/30 group">
                  {/* Broadcast Window Header */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#120d2b] border-b border-cyan-400/30 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                      </span>
                      <span className="font-bold tracking-wider text-cyan-300 uppercase truncate">OBS Overlay</span>
                    </div>
                    <span className="text-cyan-300 font-bold text-[9px] bg-cyan-500/20 px-1.5 py-0.2 rounded border border-cyan-400/40">
                      LIVE HUD
                    </span>
                  </div>
                  {/* Overlay Image */}
                  <div className="relative overflow-hidden bg-black aspect-[366/576]">
                    <img
                      src="/features/obs-overlay.png"
                      alt="PointX 12-Team Live Broadcast OBS Overlay"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-md">
                        Expand OBS HUD <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* LAYER 3 (Bottom-Right): MATCH REMOTE CONTROLLER (Landscape)   */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div
                onClick={() => handleTabChange('remote')}
                onMouseEnter={() => setHoveredCard('remote')}
                onMouseLeave={() => setHoveredCard(null)}
                className={`absolute bottom-2 right-1 sm:right-3 w-[62%] sm:w-[60%] cursor-pointer transition-all duration-300 ${
                  hoveredCard === 'remote'
                    ? 'z-30 scale-[1.03] -translate-y-1'
                    : 'z-25 hover:z-30'
                }`}
              >
                <div className="rounded-xl sm:rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-[#0e0920] shadow-[0_24px_50px_rgba(0,0,0,0.92)] ring-1 ring-purple-400/30 group">
                  {/* Console Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#170e30] border-b border-purple-500/30 text-[10px] font-mono text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="font-bold tracking-wider text-purple-200 uppercase">Match Remote Deck</span>
                    </div>
                    <span className="text-amber-400 font-bold text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                      0ms SYNC
                    </span>
                  </div>
                  {/* Remote Image */}
                  <div className="relative overflow-hidden aspect-[1024/521] bg-black">
                    <img
                      src="/features/obs-remote.png"
                      alt="PointX Mobile Remote Controller"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-md">
                        Expand Remote Console <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ─────────────────────────────────────────────────────────────── */
            /* MODE B: FOCUSED FULL-SCREEN FEATURE INSPECTOR                   */
            /* ─────────────────────────────────────────────────────────────── */
            (() => {
              const current = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];
              const Icon = current.icon;
              return (
                <motion.div
                  key={current.id}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="relative w-full h-full flex flex-col justify-between"
                >
                  {/* Top Bar with Badge & Back to All */}
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {current.title}
                        </h4>
                        <p className="text-[10px] font-mono text-amber-400 font-semibold tracking-wider uppercase">
                          {current.tag} • {current.badge}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTabChange('all')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-zinc-200 transition-colors cursor-pointer"
                    >
                      ← Back to Deck
                    </button>
                  </div>

                  {/* High-Definition Feature Frame */}
                  <div className="relative flex-1 w-full max-h-[310px] sm:max-h-[350px] rounded-2xl overflow-hidden border border-white/20 bg-black/90 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex items-center justify-center">
                    <img
                      src={current.image}
                      alt={current.alt}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>

                  {/* Feature Specs Footer Strip */}
                  <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 text-zinc-300">
                    <div className="flex items-center gap-2 flex-wrap text-[10px] sm:text-xs">
                      {current.specs.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{spec}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. CAPTION & SUB-STATUS FOOTER                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="w-full mt-3 flex items-center justify-between px-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-zinc-300 font-medium">Synced over WebSocket Delta Protocol</span>
        </div>
        <div className="text-amber-400/90 font-bold">
          0 Spreadsheets • Zero Lag
        </div>
      </div>
    </div>
  );
};

export default LandingFeaturesShowcase;


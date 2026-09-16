import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Smartphone,
  Palette,
  Sparkles,
  Radio,
} from 'lucide-react';
import { haptics } from '../../lib/haptics';

export type FeatureTab = 'obs' | 'remote' | 'template';

interface FeatureMeta {
  id: FeatureTab;
  tabLabel: string;
  icon: typeof Monitor;
  title: string;
  badge: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
  aspectMode: 'portrait' | 'landscape';
}

const FEATURES: FeatureMeta[] = [
  {
    id: 'obs',
    tabLabel: 'OBS Overlay',
    icon: Monitor,
    title: 'Live In-Game Broadcast Overlay',
    badge: '4K 60FPS • OBS BROWSER SOURCE',
    imageSrc: '/features/obs-overlay.png',
    imageAlt: 'PointX Official Live OBS Stream Overlay',
    description: '12-Team live squad standings with real-time health bars, eliminations, and fire streak badge.',
    aspectMode: 'portrait',
  },
  {
    id: 'remote',
    tabLabel: 'OBS Remote',
    icon: Smartphone,
    title: 'Mobile Match Control Room',
    badge: '0MS WEBSOCKET • PHONE CONTROLLER',
    imageSrc: '/features/obs-remote.png',
    imageAlt: 'PointX Official Mobile Remote Match Controller',
    description: 'Control match eliminations, player knocks, and squad wipes from any mobile browser.',
    aspectMode: 'landscape',
  },
  {
    id: 'template',
    tabLabel: 'Graphics Template',
    icon: Palette,
    title: 'Leaderboard Graphics Template',
    badge: 'PSD & PHOTOPEA AUTO-ALIGN',
    imageSrc: '/features/graphics-template.jpg',
    imageAlt: 'PointX Official Esports Standings Template',
    description: 'Auto-align team names, slot ranks, and logos with sub-pixel precision from Photoshop and Photopea files.',
    aspectMode: 'landscape',
  },
];

export const LandingFeaturesShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('obs');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-cycle tabs every 6 seconds unless paused by user interaction
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'obs') return 'remote';
        if (prev === 'remote') return 'template';
        return 'obs';
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleTabSelect = (tab: FeatureTab) => {
    haptics.light();
    setIsAutoPlaying(false);
    setActiveTab(tab);
  };

  const currentFeature = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];

  return (
    <div
      className="relative w-full rounded-3xl border backdrop-blur-2xl overflow-hidden shadow-2xl bg-white/95 dark:bg-[#0a0d14]/95 border-slate-200 dark:border-white/[0.14] shadow-[0_24px_60px_rgba(15,23,42,0.1)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.8)]"
      onMouseEnter={() => setIsAutoPlaying(false)}
    >
      {/* Top Laser Accent Bar */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. FEATURE SELECTION TABS                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-2 sm:p-2.5 bg-black/[0.04] dark:bg-black/60 border-b border-[var(--border-subtle)] flex items-center justify-between gap-1.5 overflow-x-auto">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const isActive = activeTab === feature.id;

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleTabSelect(feature.id)}
              className={`flex-1 min-w-[100px] py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-amber-400 dark:bg-amber-400 text-black shadow-md font-black shadow-amber-500/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="tracking-wider uppercase">{feature.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. FEATURE PHOTO PRESENTATION                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[440px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center justify-between flex-1 gap-3.5"
          >
            {/* Feature Sub-Header */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)] text-left">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <h3
                    className="text-sm sm:text-base font-black text-[var(--text-primary)] uppercase tracking-wide"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {currentFeature.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {currentFeature.description}
                </p>
              </div>

              <span
                className="self-start sm:self-auto px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px] border border-amber-500/25 shrink-0 font-mono"
              >
                {currentFeature.badge}
              </span>
            </div>

            {/* Pure High-Resolution Feature Photo Frame */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2 rounded-2xl bg-[#09070f] border border-white/10 shadow-inner overflow-hidden min-h-[290px]">
              {/* Ambient Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />

              <img
                src={currentFeature.imageSrc}
                alt={currentFeature.imageAlt}
                className={`max-h-[310px] sm:max-h-[330px] w-auto object-contain rounded-xl shadow-2xl transition-all duration-300 ${
                  currentFeature.aspectMode === 'landscape' ? 'w-full' : ''
                }`}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. FOOTER TELEMETRY STRIP                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-black/[0.03] dark:bg-black/40 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>PointX Live Esports Production Infrastructure</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500 font-bold">
          <Sparkles className="h-3 w-3" />
          <span>Official Pro Suite</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  Monitor,
  Smartphone,
  Palette,
  ExternalLink,
} from 'lucide-react';

export const LandingFeaturesShowcase: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[580px] lg:max-w-[640px] mx-auto h-[460px] sm:h-[520px] md:h-[550px] flex items-center justify-center select-none overflow-visible">
      {/* Dynamic Ambient Backlight Glows */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/15 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/15 blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-purple-900/15 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -inset-6 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. LAYER 1 (Top-Right): 4K GRAPHICS STANDINGS STUDIO (16:9)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.025, y: -4, zIndex: 30 }}
        className="absolute top-3 sm:top-5 right-0 sm:right-2 w-[72%] sm:w-[70%] z-10 cursor-pointer group"
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20 bg-[#120b22]/95 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/30 transition-all duration-300 group-hover:border-amber-400/60 group-hover:shadow-[0_30px_70px_rgba(245,158,11,0.2)]">
          {/* Hardware Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#18112b]/95 backdrop-blur-md border-b border-white/10 text-[10px] sm:text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500/80" />
              <span className="h-2 w-2 rounded-full bg-amber-500/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-400" />
                4K Standings Studio
              </span>
            </div>
            <span className="text-amber-300 font-bold text-[9px] sm:text-[10px] bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-400/30">
              PSD AUTO-SYNC
            </span>
          </div>

          {/* 16:9 Template Screenshot */}
          <div className="relative aspect-[16/9] bg-black overflow-hidden">
            <img
              src="/features/graphics-template.jpg"
              alt="PointX Leaderboard Standings Template"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="eager"
            />
            {/* Hover Spotlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20">
                <span>Overall Standings Template</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-semibold">4K UHD EXPORT</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. LAYER 2 (Left): LIVE OBS STREAM OVERLAY (Portrait HUD)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -4, zIndex: 30 }}
        className="absolute top-1 sm:top-2 left-0 sm:left-2 w-[46%] sm:w-[44%] z-20 cursor-pointer group"
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-cyan-400/50 bg-[#090717]/95 shadow-[0_30px_75px_rgba(0,0,0,0.95)] ring-1 ring-cyan-400/30 transition-all duration-300 group-hover:border-cyan-300 group-hover:shadow-[0_30px_80px_rgba(6,182,212,0.25)]">
          {/* Broadcast Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0e122b]/95 backdrop-blur-md border-b border-cyan-400/30 text-[10px] sm:text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="font-bold tracking-wider text-cyan-300 uppercase flex items-center gap-1 truncate">
                <Monitor className="w-3 h-3 text-cyan-400" />
                OBS Overlay
              </span>
            </div>
            <span className="text-cyan-300 font-bold text-[9px] sm:text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/40 shrink-0">
              LIVE HUD
            </span>
          </div>

          {/* Portrait Overlay Stream */}
          <div className="relative aspect-[366/576] bg-black overflow-hidden">
            <img
              src="/features/obs-overlay.png"
              alt="PointX 12-Team Live Broadcast OBS Overlay"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="eager"
            />
            {/* Hover Spotlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20">
                <span>12-Team HUD</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">60 FPS</span>
            </div>
          </div>
        </div>

        {/* Attached Floating Telemetry Badge */}
        <div className="absolute -bottom-3 left-3 sm:left-4 z-30 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/90 backdrop-blur-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.35)] text-cyan-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>✓ 0MS SYNC • 1080p</span>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. LAYER 3 (Bottom-Right): MATCH REMOTE CONTROLLER (Landscape)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.025, y: -4, zIndex: 30 }}
        className="absolute bottom-2 sm:bottom-3 right-0 sm:right-2 w-[64%] sm:w-[62%] z-25 cursor-pointer group"
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-purple-500/50 bg-[#0e0920]/95 shadow-[0_28px_65px_rgba(0,0,0,0.92)] ring-1 ring-purple-400/30 transition-all duration-300 group-hover:border-purple-400 group-hover:shadow-[0_30px_75px_rgba(168,85,247,0.25)]">
          {/* Console Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#170e30]/95 backdrop-blur-md border-b border-purple-500/30 text-[10px] sm:text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold tracking-wider text-purple-200 uppercase truncate">
                Match Remote Deck
              </span>
            </div>
            <span className="text-amber-400 font-bold text-[9px] sm:text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 shrink-0">
              0ms WEBSOCKET
            </span>
          </div>

          {/* Remote Console Image */}
          <div className="relative aspect-[1024/521] bg-black overflow-hidden">
            <img
              src="/features/obs-remote.png"
              alt="PointX Mobile Remote Controller"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="eager"
            />
            {/* Hover Spotlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/20">
                <span>Mobile Admin Console</span>
                <ExternalLink className="w-3 h-3 text-purple-400" />
              </span>
              <span className="text-[10px] font-mono text-purple-300 font-semibold">TACTILE CONTROLS</span>
            </div>
          </div>
        </div>

        {/* Attached Floating Telemetry Badge */}
        <div className="absolute -bottom-3 right-3 sm:right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/90 backdrop-blur-xl border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] text-purple-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>TACTILE MULTI-ADMIN</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingFeaturesShowcase;


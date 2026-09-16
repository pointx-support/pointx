import React from 'react';

export const LandingFeaturesShowcase: React.FC = () => {
  return (
    <div className="relative w-full max-w-[560px] lg:max-w-[620px] mx-auto h-[460px] sm:h-[540px] md:h-[580px] flex items-center justify-center select-none overflow-visible">
      {/* Background Ambient Glow & Grid Matrix */}
      <div className="absolute inset-0 rounded-3xl bg-radial from-purple-900/25 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -inset-4 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP-LEFT FLOATING NEON BADGE PILL                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-2 sm:top-4 left-1 sm:left-4 z-30 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#090514]/90 backdrop-blur-xl border border-fuchsia-500/60 shadow-[0_0_24px_rgba(217,70,239,0.45)] text-fuchsia-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
        <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
        <span>● OBS OVERLAY LIVE_</span>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. TOP-RIGHT CARD: GRAPHICS STUDIO TEMPLATE (Tilted Clockwise)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 sm:top-6 right-2 sm:right-6 w-[56%] sm:w-[54%] z-10 transform rotate-6 hover:rotate-2 hover:scale-105 hover:z-30 transition-all duration-300 cursor-pointer group">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20 bg-[#120b22] shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
          <img
            src="/features/graphics-template.jpg"
            alt="PointX Leaderboard Standings Template"
            className="w-full h-auto object-cover group-hover:brightness-105 transition-[filter] duration-300"
            loading="eager"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. BOTTOM-RIGHT CARD: OBS REMOTE CONTROLLER (Layered Behind)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 sm:bottom-6 right-1 sm:right-4 w-[60%] sm:w-[58%] z-15 transform rotate-1 hover:-rotate-1 hover:scale-105 hover:z-30 transition-all duration-300 cursor-pointer group">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-purple-500/40 bg-[#0f0a1c] shadow-[0_25px_55px_rgba(0,0,0,0.92)] ring-1 ring-purple-500/25">
          <img
            src="/features/obs-remote.png"
            alt="PointX Mobile Remote Controller"
            className="w-full h-auto object-cover group-hover:brightness-105 transition-[filter] duration-300"
            loading="eager"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MAIN FOCAL CARD (LEFT): OBS OVERLAY (Tilted Counter-Clockwise)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute left-2 sm:left-4 top-8 sm:top-8 w-[48%] sm:w-[46%] z-20 transform -rotate-6 hover:-rotate-2 hover:scale-105 hover:z-30 transition-all duration-300 cursor-pointer group">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/30 bg-[#14092b] shadow-[0_30px_70px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/40">
          <img
            src="/features/obs-overlay.png"
            alt="PointX 12-Team Live Broadcast OBS Overlay"
            className="w-full h-auto object-cover group-hover:brightness-105 transition-[filter] duration-300"
            loading="eager"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. BOTTOM-LEFT FLOATING NEON BADGE PILL                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-2 sm:bottom-5 left-1 sm:left-4 z-30 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#090514]/90 backdrop-blur-xl border border-fuchsia-500/60 shadow-[0_0_24px_rgba(217,70,239,0.45)] text-fuchsia-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
        <span>✓ 0MS SYNC • 0:03</span>
      </div>
    </div>
  );
};

export default LandingFeaturesShowcase;

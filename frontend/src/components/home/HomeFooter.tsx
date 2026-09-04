import React from 'react';
import { ArrowUp } from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { PulseIndicator } from '../animation/MicroInteractions';

const HomeFooterComponent: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[var(--bg-surface)]/80 backdrop-blur-2xl pt-16 pb-12 font-sans">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 space-y-14">
        
        {/* Top Row: Brand & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Brand Info (Col 1-5) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <PointXLogo className="h-9 sm:h-10 w-auto max-w-[130px] object-contain select-none" />
              <div className="flex flex-col border-l border-white/[0.1] pl-3.5">
                <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
                  PointX Esports
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                  Tournament Operating System
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
              The premier tournament matrix calculation platform, live OBS Studio browser source scoreboards, and 4K overall standings generator for competitive Free Fire and esports events.
            </p>

            {/* Operational Telemetry Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--bg-surface-raised)]/90 border border-white/[0.08] shadow-md">
              <PulseIndicator status="active" size="sm" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                All Core Systems Operational • 99.99% Cloud Uptime
              </span>
            </div>
          </div>

          {/* Quick Navigation Links (Col 6-12) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-sans">
            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 text-xs">
                Championship
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li><a href="#tournaments" className="hover:text-[var(--accent-primary)] transition-colors">Tournaments Arena</a></li>
                <li><a href="#live-matrix" className="hover:text-[var(--accent-primary)] transition-colors">Scoring Matrix Engine</a></li>
                <li><a href="#games" className="hover:text-[var(--accent-primary)] transition-colors">Supported Esports Titles</a></li>
                <li><a href="#broadcast" className="hover:text-[var(--accent-primary)] transition-colors">OBS Broadcast Overlays</a></li>
              </ul>
            </div>

            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 text-xs">
                Features & Tools
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)]">
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">Sub-50ms Auto-Calculator</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">4K Social Poster Generator</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">Team Roster Vault</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">MVP Top-Fragger Leaderboard</a></li>
              </ul>
            </div>

            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 text-xs">
                Platform Architecture
              </p>
              <ul className="space-y-3 text-[var(--text-secondary)] font-mono">
                <li><span className="text-[var(--text-muted)]">Version 2.5.0 (Stable)</span></li>
                <li><span className="text-[var(--text-muted)]">FFWS Official 12-Tier Rule</span></li>
                <li><span className="text-[var(--text-muted)]">OBS Studio / vMix Ready</span></li>
                <li><span className="text-[var(--text-muted)]">PointX Esports Hub</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright & Back To Top */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <p>
            © {new Date().getFullYear()} PointX Tournament Operating System. Engineered for competitive esports champions.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors duration-200 cursor-pointer shadow-md font-sans font-bold"
          >
            <span>Back to Top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};

export const HomeFooter = React.memo(HomeFooterComponent);
export default HomeFooter;

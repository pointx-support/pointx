import React from 'react';
import { ArrowUp } from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { PulseIndicator } from '../animation/MicroInteractions';

export const HomeFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-md pt-14 pb-10 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Row: Brand & Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Brand Info (Col 1-5) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <PointXLogo className="h-8 sm:h-9 w-auto max-w-[120px] object-contain select-none" />
              <div className="flex flex-col border-l border-[var(--border-subtle)] pl-3">
                <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
                  By Strikz Esports
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                  Tournament Operating System
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
              The premier tournament matrix calculation platform, live OBS Studio browser source scoreboards, and 4K overall standings generator for competitive Free Fire and esports events.
            </p>

            {/* Operational Telemetry Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-xs">
              <PulseIndicator status="active" size="sm" />
              <span className="text-xs font-mono font-bold text-[var(--status-live)]">
                All Systems Operational (99.99% Uptime)
              </span>
            </div>
          </div>

          {/* Quick Navigation Links (Col 6-12) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-sans">
            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Championship
              </p>
              <ul className="space-y-2.5 text-[var(--text-secondary)]">
                <li><a href="#tournaments" className="hover:text-[var(--accent-primary)] transition-colors">Tournaments</a></li>
                <li><a href="#live-matrix" className="hover:text-[var(--accent-primary)] transition-colors">Scoring Matrix</a></li>
                <li><a href="#games" className="hover:text-[var(--accent-primary)] transition-colors">Supported Games</a></li>
                <li><a href="#broadcast" className="hover:text-[var(--accent-primary)] transition-colors">OBS Overlays</a></li>
              </ul>
            </div>

            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Features
              </p>
              <ul className="space-y-2.5 text-[var(--text-secondary)]">
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">Auto-Calculator</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">4K Posters</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">Slot Management</a></li>
                <li><a href="#features" className="hover:text-[var(--accent-primary)] transition-colors">MVP Leaderboard</a></li>
              </ul>
            </div>

            <div>
              <p className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                Platform
              </p>
              <ul className="space-y-2.5 text-[var(--text-secondary)]">
                <li><span className="text-[var(--text-muted)] font-mono">Version 2.4.0 (Stable)</span></li>
                <li><span className="text-[var(--text-muted)] font-mono">FFWS Official Rules</span></li>
                <li><span className="text-[var(--text-muted)] font-mono">OBS Studio Ready</span></li>
                <li><span className="text-[var(--text-muted)] font-mono">Strikz Esports Hub</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright & Back To Top */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <p>
            © {new Date().getFullYear()} PointX Tournament Operating System. Built for competitive esports.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <span>Back to Top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};

export default HomeFooter;

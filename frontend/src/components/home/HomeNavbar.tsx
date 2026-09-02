import React, { useState, useEffect } from 'react';
import {
  Trophy,
  TableProperties,
  Gamepad2,
  Sparkles,
  Radio,
  Sun,
  Moon,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export interface HomeNavbarProps {
  onNavigateLogin: () => void;
  onNavigateSignup?: () => void;
  onNavigateDashboard: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  onNavigateLogin,
  onNavigateDashboard,
}) => {
  const { isAuthenticated, theme, toggleTheme } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('tournaments');

  const isDark = theme === 'dark';

  const navLinks = [
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments', icon: Trophy },
    { id: 'live-matrix', label: 'Live Matrix', href: '#live-matrix', icon: TableProperties },
    { id: 'games', label: 'Games', href: '#games', icon: Gamepad2 },
    { id: 'features', label: 'Features', href: '#features', icon: Sparkles },
    { id: 'broadcast', label: 'Broadcast', href: '#broadcast', icon: Radio },
  ];

  // Viewport scroll listener for navbar background & active section tracking
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);

      const sectionIds = ['tournaments', 'live-matrix', 'games', 'features', 'broadcast'];
      const scrollPosition = window.scrollY + 240;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 w-full transition-all duration-300 font-sans',
        isScrolled
          ? 'bg-[#0B0C0E]/90 dark:bg-[#0B0C0E]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.8)]'
          : 'bg-black/30 dark:bg-black/40 backdrop-blur-xl border-b border-white/[0.04]'
      )}
    >
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-12 h-18 sm:h-20 flex items-center justify-between">
        
        {/* Left: Brand Identity & Telemetry Status */}
        <div className="flex items-center gap-4 lg:gap-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group select-none cursor-pointer"
          >
            <PointXLogo className="h-7 sm:h-8 w-auto max-w-[110px] object-contain group-hover:scale-105 transition-transform" />
          </a>

          {/* High-tech divider & OS status */}
          <div className="hidden sm:flex items-center gap-3 border-l border-white/[0.12] pl-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-white/60 uppercase">
              ARENA OS <span className="text-[9px] text-white/30 ml-1">// v2.5</span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Clean Navigation Links with Elegant Underline Glow */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10 xl:gap-12">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isCurrentActive = activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className={cn(
                  'relative flex items-center gap-2 py-2 text-xs lg:text-sm font-mono uppercase tracking-wider font-semibold transition-all duration-200 group select-none cursor-pointer',
                  isCurrentActive
                    ? 'text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isCurrentActive
                      ? 'text-[var(--accent-primary)] scale-110 drop-shadow-[0_0_8px_rgba(255,208,0,0.6)]'
                      : 'text-[var(--text-muted)] group-hover:text-white group-hover:scale-110'
                  )}
                />
                <span>{link.label}</span>

                {/* Elegant Underline Indicator (No bulky capsule) */}
                {isCurrentActive && (
                  <span className="absolute -bottom-3 sm:-bottom-4 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent shadow-[0_0_12px_rgba(255,208,0,0.9)] rounded-full animate-in fade-in duration-300" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Theme Controls & High-Performance CTAs */}
        <div className="flex items-center gap-3">
          {/* Theme Quick Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-[var(--text-secondary)] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[var(--accent-primary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
            )}
          </button>

          {isAuthenticated ? (
            /* Authenticated User Console CTA */
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/40 hover:border-amber-400 text-white hover:text-amber-400 shadow-[0_0_20px_rgba(255,208,0,0.15)] hover:shadow-[0_0_25px_rgba(255,208,0,0.35)] transition-all duration-200 cursor-pointer font-display uppercase tracking-wider group active:scale-[0.98]"
            >
              <LayoutDashboard className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Console</span>
              <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            /* Public Visitor Auth CTA: Direct Sign In */
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-md shadow-amber-500/20 hover:shadow-[0_0_25px_rgba(255,208,0,0.6)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer font-display uppercase tracking-wider border border-amber-300/60 group"
            >
              <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Organizer Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 sm:h-10 sm:w-10 md:hidden flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[var(--text-secondary)] hover:text-white cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Full-Width Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0B0C0E]/95 backdrop-blur-2xl px-6 py-6 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isCurrentActive = activeSection === link.id;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-colors',
                    isCurrentActive
                      ? 'bg-white/[0.08] text-white font-bold border border-white/[0.12]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isCurrentActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    )}
                  />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (isAuthenticated) {
                  onNavigateDashboard();
                } else {
                  onNavigateLogin();
                }
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-md font-display uppercase tracking-wider"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Enter Organizer Console</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to PointX Arena</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;

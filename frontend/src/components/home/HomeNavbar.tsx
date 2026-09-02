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
import { motion } from 'motion/react';
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
  const [activeSection, setActiveSection] = useState<string>('');

  const isDark = theme === 'dark';

  const navLinks = [
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments', icon: Trophy },
    { id: 'live-matrix', label: 'Live Matrix', href: '#live-matrix', icon: TableProperties },
    { id: 'broadcast', label: 'Broadcast', href: '#broadcast', icon: Radio },
    { id: 'features', label: 'Features', href: '#features', icon: Sparkles },
    { id: 'games', label: 'Games', href: '#games', icon: Gamepad2 },
  ];

  // Viewport scroll listener for navbar background & accurate section tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // When near top (Hero section), no navbar links should be highlighted
      if (scrollY < 280) {
        setActiveSection('');
        return;
      }

      const sectionIds = ['tournaments', 'live-matrix', 'broadcast', 'features', 'games'];
      let current = '';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260 && rect.bottom >= 180) {
            current = id;
            break;
          }
        }
      }

      setActiveSection(current);
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
          ? 'bg-[var(--bg-header)]/95 backdrop-blur-2xl border-b border-[var(--border-subtle)] shadow-[var(--shadow-raised)]'
          : 'bg-[var(--bg-header)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]/50'
      )}
    >
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-12 h-18 sm:h-20 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group select-none cursor-pointer"
            title="PointX Home"
          >
            <PointXLogo className="h-7 sm:h-8 w-auto max-w-[110px] sm:max-w-[125px] object-contain group-hover:scale-105 transition-transform" />
          </a>
        </div>

        {/* Center: Desktop Navigation with Moving Capsule Animation */}
        <nav className="hidden md:flex items-center p-1.5 rounded-2xl bg-[var(--bg-surface-inset)]/60 border border-[var(--border-subtle)] gap-1 shadow-inner backdrop-blur-xl relative">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isCurrentActive = activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className={cn(
                  'relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors duration-200 select-none cursor-pointer',
                  isCurrentActive
                    ? 'text-[var(--accent-primary)] font-black'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold'
                )}
              >
                {/* Moving Sliding Capsule Background exclusively for active link */}
                {isCurrentActive && (
                  <motion.div
                    layoutId="navbar-active-capsule"
                    className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-primary)]/40 shadow-sm -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <Icon
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    isCurrentActive
                      ? 'text-[var(--accent-primary)] scale-110'
                      : 'text-[var(--text-muted)]'
                  )}
                />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Theme Controls & Action CTAs */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-[var(--accent-primary)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
            )}
          </button>

          {isAuthenticated ? (
            /* Authenticated Console CTA */
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full sm:rounded-xl text-[11px] sm:text-sm font-bold bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] border border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-sm transition-all duration-200 cursor-pointer font-display uppercase tracking-wider group active:scale-[0.98]"
            >
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--accent-primary)] group-hover:scale-110 transition-transform shrink-0" />
              <span>Console</span>
              <ArrowRight className="hidden sm:inline h-3.5 w-3.5 text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            /* Public Sign In CTA - Capsule shape on mobile */
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full sm:rounded-xl text-[11px] sm:text-sm font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-sm hover:shadow-[0_0_20px_rgba(255,208,0,0.4)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 cursor-pointer font-display uppercase tracking-wider border border-amber-300/60 group"
            >
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline">Organizer Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 sm:h-10 sm:w-10 md:hidden flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/98 backdrop-blur-2xl px-6 py-6 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isCurrentActive = activeSection === link.id;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-colors',
                    isCurrentActive
                      ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
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

          <div className="pt-3 border-t border-[var(--border-subtle)]">
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

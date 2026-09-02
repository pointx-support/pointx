import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export interface HomeNavbarProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
  onNavigateDashboard: () => void;
}

export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  onNavigateLogin,
  onNavigateSignup,
  onNavigateDashboard,
}) => {
  const { isAuthenticated, theme, toggleTheme } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          if (scrolled !== isScrolledRef.current) {
            isScrolledRef.current = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = theme === 'dark';

  const navLinks = [
    { label: 'Tournaments', href: '#tournaments', icon: Trophy },
    { label: 'Live Matrix', href: '#live-matrix', icon: TableProperties },
    { label: 'Games', href: '#games', icon: Gamepad2 },
    { label: 'Features', href: '#features', icon: Sparkles },
    { label: 'Broadcast', href: '#broadcast', icon: Radio },
  ];

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
        'sticky top-0 z-50 w-full transition-all duration-200 font-sans transform-gpu',
        isScrolled
          ? 'bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-md shadow-black/20 py-2.5'
          : 'bg-transparent border-b border-transparent py-4'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Identity Logo */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group select-none cursor-pointer"
          >
            <PointXLogo className="h-8 sm:h-9 w-auto max-w-[115px] object-contain group-hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col border-l border-[var(--border-subtle)] pl-3">
              <span className="font-bold text-[11px] font-mono text-[var(--accent-primary)] uppercase tracking-wider">
                By Strikz Esports
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                Tournament OS
              </span>
            </div>
          </a>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[var(--bg-surface-raised)]/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border-subtle)]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--accent-primary)] opacity-80" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Auth CTAs & Theme Switcher */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)]/80 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {isDark ? <Sun className="h-4 w-4 text-[var(--accent-primary)]" /> : <Moon className="h-4 w-4 text-[var(--accent-primary)]" />}
          </button>

          {isAuthenticated ? (
            /* Authenticated User Quick Access */
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-black hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20 transition-all cursor-pointer font-display"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Organizer Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            /* Public Visitor Auth CTAs */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onNavigateSignup}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer font-display"
              >
                <span>Join Arena</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-[var(--accent-primary)]" /> : <Moon className="h-4 w-4 text-[var(--accent-primary)]" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)]"
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateDashboard();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-black flex items-center justify-center gap-2 font-display"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Organizer Console</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateLogin();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateSignup();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-[var(--accent-primary)] text-black flex items-center justify-center gap-2 font-display shadow-md shadow-[var(--accent-primary)]/20"
                >
                  <span>Join Arena Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
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
    <header className="fixed top-3 sm:top-4 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none font-sans">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-5xl rounded-full transition-all duration-300 flex items-center justify-between px-3.5 sm:px-5 py-2',
          isScrolled
            ? 'bg-[var(--bg-base)]/90 backdrop-blur-2xl border border-[var(--border-strong)] shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
            : 'bg-[var(--bg-surface-raised)]/75 backdrop-blur-xl border border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
        )}
      >
        {/* Left: Brand Identity Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group select-none cursor-pointer shrink-0 pl-1"
        >
          <PointXLogo className="h-6 sm:h-7 w-auto max-w-[95px] object-contain group-hover:scale-105 transition-transform" />
          <div className="hidden sm:flex items-center gap-1.5 border-l border-[var(--border-subtle)] pl-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase">
              Arena OS
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--bg-surface-inset)]/60 px-3 py-1 rounded-full border border-[var(--border-subtle)]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              >
                <Icon className="h-3 w-3 text-[var(--accent-primary)] opacity-80" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Auth CTAs & Theme Switcher */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            )}
          </button>

          {isAuthenticated ? (
            /* Authenticated User Quick Access */
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-[var(--accent-primary)] text-black hover:brightness-110 shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-display"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Console</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            /* Public Visitor Auth CTA: Direct Sign In */
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-md shadow-amber-500/20 hover:shadow-[0_0_20px_rgba(255,208,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-display border border-amber-300/50 group"
            >
              <LogIn className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div className="pointer-events-auto absolute top-16 inset-x-4 max-w-md mx-auto rounded-3xl bg-[var(--bg-surface)]/95 backdrop-blur-2xl border border-[var(--border-strong)] p-4 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[var(--border-subtle)]">
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black bg-[var(--accent-primary)] text-black shadow-md font-display"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Organizer Console</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to PointX</span>
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

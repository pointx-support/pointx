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
  Zap,
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
  const { isAuthenticated, user, theme, toggleTheme } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
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
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments', icon: Trophy },
    { id: 'live-matrix', label: 'Live Matrix', href: '#live-matrix', icon: TableProperties },
    { id: 'games', label: 'Games', href: '#games', icon: Gamepad2 },
    { id: 'features', label: 'Features', href: '#features', icon: Sparkles },
    { id: 'broadcast', label: 'Broadcast', href: '#broadcast', icon: Radio },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 font-sans transform-gpu px-3 sm:px-6 lg:px-8 py-3',
        isScrolled
          ? 'bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-2xl shadow-black/25 py-2.5'
          : 'bg-transparent border-b border-transparent py-4'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Flagship Brand Identity Logo & Status Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group select-none cursor-pointer"
            title="PointX Esports Tournament OS"
          >
            <div className="relative flex items-center">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/20 rounded-xl blur-lg group-hover:bg-[var(--accent-primary)]/40 transition-all duration-300" />
              <PointXLogo className="h-8 sm:h-9 w-auto max-w-[110px] sm:max-w-[125px] object-contain group-hover:scale-105 transition-transform relative z-10" />
            </div>

            <div className="hidden sm:flex flex-col border-l border-[var(--border-subtle)] pl-3">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[11px] font-mono tracking-wider text-[var(--accent-primary)] uppercase">
                  POINTX ESPORTS
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
                TOURNAMENT OS v2.5
              </span>
            </div>
          </a>
        </div>

        {/* Center: Sleek Floating Glass Nav Pill */}
        <nav className="hidden lg:flex items-center gap-1 bg-[var(--bg-surface-raised)]/80 backdrop-blur-xl px-2 py-1.5 rounded-full border border-[var(--border-subtle)] shadow-lg shadow-black/10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href, link.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none',
                  isActive
                    ? 'bg-[var(--accent-primary)] text-black shadow-sm font-black'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-black' : 'text-[var(--accent-primary)]')} />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Auth CTAs, Theme Toggle & Direct Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)]/90 hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs active:scale-95"
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
            /* Authenticated Organizer / Admin Quick Console Access */
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:brightness-110 shadow-md shadow-amber-500/25 transition-all cursor-pointer font-display active:scale-95"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{user?.role === 'admin' ? 'Admin Portal' : 'Command Center'}</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          ) : (
            /* Public Visitor Auth CTAs */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={onNavigateSignup}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all cursor-pointer font-display active:scale-95 border border-amber-300/60 group"
              >
                <Zap className="h-3.5 w-3.5 fill-black text-black group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Join Arena</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5] text-black group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 sm:hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)]/95 backdrop-blur-2xl p-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href, link.id)}
                  className="flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
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
                className="w-full py-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffd000] to-[#ff9900] text-black flex items-center justify-center gap-2 font-display shadow-md"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Command Center</span>
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
                  className="w-full py-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#ffd000] to-[#ff9900] text-black flex items-center justify-center gap-2 font-display shadow-lg shadow-amber-500/25"
                >
                  <Zap className="h-4 w-4 fill-black text-black" />
                  <span>Join Arena Now</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;

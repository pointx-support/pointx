import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
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
  const { isAuthenticated, user, theme, toggleTheme } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const isDark = theme === 'dark';

  const navLinks = [
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments' },
    { id: 'live-matrix', label: 'Live Matrix', href: '#live-matrix' },
    { id: 'broadcast', label: 'Broadcast', href: '#broadcast' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'games', label: 'Games', href: '#games' },
  ];

  // Viewport scroll listener for navbar background & buttery-smooth section tracking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(scrollY > 20);

          // Near top (Hero section), no navbar links should be highlighted
          if (scrollY < 240) {
            setActiveSection('');
            ticking = false;
            return;
          }

          const sectionIds = ['tournaments', 'live-matrix', 'broadcast', 'features', 'games'];
          let matched = '';

          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 240 && rect.bottom >= 140) {
                matched = id;
                break;
              }
            }
          }

          if (matched) {
            setActiveSection(matched);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      const topOffset = 80;
      const elementPosition = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - topOffset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex flex-col items-center justify-center px-3 sm:px-6 pointer-events-none font-sans">
      
      {/* Unified Floating Pill Container */}
      <div
        className={cn(
          'pointer-events-auto w-full max-w-[880px] lg:max-w-[940px] h-13 sm:h-16 rounded-full px-2 sm:px-3 flex items-center justify-between transition-all duration-300 backdrop-blur-2xl',
          isDark
            ? 'bg-[#111215]/95 border border-white/15 text-white shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 border border-black/10 text-[#111215] shadow-[0_16px_40px_rgba(0,0,0,0.1)]',
          isScrolled && (isDark ? 'border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'border-black/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)]')
        )}
      >
        
        {/* Left: Circular Brand Identity Emblem */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 sm:gap-2.5 group select-none cursor-pointer pl-0.5 sm:pl-1 shrink-0"
          title="PointX Home"
        >
          <div
            className={cn(
              'h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center font-black transition-transform duration-300 group-hover:scale-105 shadow-md shrink-0',
              isDark
                ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)]'
                : 'bg-[#111215] text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
            )}
          >
            <span className="font-display font-black text-sm sm:text-base tracking-tighter select-none leading-none">
              P<span className="text-[#ffd000]">X</span>
            </span>
          </div>
          <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase">
            Point<span className="text-[#ffd000]">X</span>
          </span>
        </a>

        {/* Center: Clean Nav Links with silky sliding active pill */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 px-1 relative">
          {navLinks.map((link) => {
            const isCurrentActive = activeSection === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href, link.id)}
                className={cn(
                  'relative px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200 select-none cursor-pointer',
                  isDark
                    ? (isCurrentActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-white')
                    : (isCurrentActive ? 'text-black font-bold' : 'text-zinc-600 hover:text-black')
                )}
              >
                {/* Moving Sliding Pill Indicator with Buttery Smooth Spring Motion */}
                {isCurrentActive && (
                  <motion.div
                    layoutId="navbar-pill-active"
                    className={cn(
                      'absolute inset-0 rounded-full -z-10 shadow-sm',
                      isDark
                        ? 'bg-white/12 border border-white/20 shadow-[0_2px_10px_rgba(255,255,255,0.05)]'
                        : 'bg-black/8 border border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                    )}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.6
                    }}
                  />
                )}
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Theme Toggle & High-Contrast Signature Action Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Subtle Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer',
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-black hover:bg-black/5'
            )}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme Mode"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-800" />
            )}
          </button>

          {/* High-Contrast Capsule CTA Button */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className={cn(
                'inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer shadow-md hover:scale-105 active:scale-95 group font-display',
                isDark
                  ? 'bg-white text-black hover:bg-zinc-100 shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
                  : 'bg-[#111215] text-white hover:bg-black shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate max-w-[100px] sm:max-w-[160px]">{user?.email || 'Console'}</span>
              <ArrowRight className="hidden sm:inline h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateLogin}
              className={cn(
                'inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer shadow-md hover:scale-105 active:scale-95 group font-sans',
                isDark
                  ? 'bg-white text-black hover:bg-zinc-100 shadow-[0_4px_20px_rgba(255,255,255,0.25)]'
                  : 'bg-[#111215] text-white hover:bg-black shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
              )}
            >
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline">Organizer Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              'h-8 w-8 sm:h-9 sm:w-9 md:hidden flex items-center justify-center rounded-full transition-colors cursor-pointer',
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-black hover:bg-black/5'
            )}
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            'pointer-events-auto w-full max-w-[920px] mt-2 rounded-3xl p-4 space-y-2 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 md:hidden',
            isDark
              ? 'bg-[#111215]/98 border border-white/15 text-white'
              : 'bg-white/98 border border-black/10 text-black'
          )}
        >
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isCurrentActive = activeSection === link.id;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href, link.id)}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all',
                    isDark
                      ? (isCurrentActive ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white')
                      : (isCurrentActive ? 'bg-black/10 text-black' : 'text-zinc-600 hover:bg-black/5 hover:text-black')
                  )}
                >
                  <span>{link.label}</span>
                  {isCurrentActive && <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />}
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

import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { AnimatedHamburger, AnimatedThemeToggle } from '../animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { mobileDrawerVariants, mobileDrawerItemVariants, MOTION_EASINGS } from '../animation/motionTokens';

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
  const [activeSection, setActiveSection] = useState<string>('live-matrix');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const isDark = theme === 'dark';

  const isClickScrollingRef = React.useRef(false);
  const clickScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const navLinks = [
    { id: 'live-matrix', label: 'Live Matrix', href: '#live-matrix' },
    { id: 'tournaments', label: 'Tournaments', href: '#tournaments' },
    { id: 'broadcast', label: 'Broadcast', href: '#broadcast' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'games', label: 'Games', href: '#games' },
  ];

  // Viewport scroll listener for navbar background & section tracking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(scrollY > 20);

          // If scrolling was initiated by a click, don't interrupt the capsule target
          if (isClickScrollingRef.current) {
            ticking = false;
            return;
          }

          // Near top (Hero section), default to Live Matrix selected
          if (scrollY < 240) {
            setActiveSection('live-matrix');
            ticking = false;
            return;
          }

          const sectionIds = ['live-matrix', 'tournaments', 'broadcast', 'features', 'games'];
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
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickScrollTimeoutRef.current) clearTimeout(clickScrollTimeoutRef.current);
    };
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setIsMobileMenuOpen(false);

    // Suppress scroll listener updates during programmatic smooth scroll
    isClickScrollingRef.current = true;
    if (clickScrollTimeoutRef.current) clearTimeout(clickScrollTimeoutRef.current);
    clickScrollTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

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

  // Entrance motion variants
  const containerEntranceVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -14,
      scale: prefersReducedMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        ease: MOTION_EASINGS.outExpo,
        staggerChildren: prefersReducedMotion ? 0 : 0.04,
        delayChildren: prefersReducedMotion ? 0 : 0.06,
      },
    },
  };

  const itemEntranceVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -6,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.38,
        ease: MOTION_EASINGS.outExpo,
      },
    },
  };

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex flex-col items-center justify-center px-3 sm:px-6 pointer-events-none font-nav">
      
      {/* Unified Floating Pill Container */}
      <motion.div
        variants={containerEntranceVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'pointer-events-auto w-full max-w-[900px] lg:max-w-[980px] h-15 sm:h-16 lg:h-[68px] rounded-full px-3 sm:px-4 flex items-center justify-between transition-all duration-300 backdrop-blur-2xl',
          isDark
            ? isScrolled
              ? 'bg-[#101319]/95 border border-white/[0.14] text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
              : 'bg-[#101319]/90 border border-white/[0.12] text-white shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
            : isScrolled
            ? 'bg-white/95 border border-black/[0.09] text-[#0B0D14] shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]'
            : 'bg-white/90 border border-black/[0.08] text-[#0B0D14] shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]'
        )}
      >
        
        {/* Left: Circular Brand Identity Emblem & Wordmark */}
        <motion.a
          variants={itemEntranceVariants}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('live-matrix');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 sm:gap-3 group select-none cursor-pointer pl-0.5 sm:pl-1 shrink-0"
          title="PointX Esports"
        >
          {/* PX Circular Emblem */}
          <motion.div
            whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className={cn(
              'h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center font-black select-none shrink-0 transition-all duration-300',
              isDark
                ? 'bg-[#121622] text-white border border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:border-[#ffd000]/40 group-hover:shadow-[0_0_16px_rgba(255,208,0,0.2)]'
                : 'bg-[#0B0D14] text-white border border-black/10 shadow-[0_2px_10px_rgba(0,0,0,0.18)] group-hover:shadow-[0_0_16px_rgba(255,208,0,0.3)]'
            )}
          >
            <span className="font-nav font-black text-xs sm:text-[14px] tracking-tight select-none leading-none">
              P<span className="text-[#ffd000] drop-shadow-[0_0_8px_rgba(255,208,0,0.4)]">X</span>
            </span>
          </motion.div>

          {/* POINTX Brand Wordmark (Unified Typography & Optical Spacing) */}
          <div className="flex items-baseline tracking-[-0.035em] select-none font-nav font-black text-[15px] sm:text-[17px] leading-none">
            <span className={cn(
              'transition-colors duration-300',
              isDark ? 'text-white' : 'text-neutral-950'
            )}>
              POINT
            </span>
            <span className="text-[#ffd000] ml-[0.5px] transition-colors duration-300 drop-shadow-[0_0_10px_rgba(255,208,0,0.3)]">
              X
            </span>
          </div>
        </motion.a>

        {/* Center: Precision Navigation with Silky Active & Hover Gliders */}
        <nav
          onMouseLeave={() => setHoveredNav(null)}
          className="hidden md:flex items-center gap-1 sm:gap-1.5 px-1 relative whitespace-nowrap shrink-0"
        >
          {navLinks.map((link) => {
            const isCurrentActive = activeSection === link.id;
            const isHovered = hoveredNav === link.id;

            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href, link.id)}
                onMouseEnter={() => setHoveredNav(link.id)}
                className={cn(
                  'relative z-10 h-10 sm:h-11 px-4 sm:px-5 rounded-full text-[13px] sm:text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors duration-200 select-none cursor-pointer font-nav flex items-center justify-center gap-2 leading-none',
                  isCurrentActive
                    ? (isDark ? 'text-white font-semibold' : 'text-neutral-950 font-semibold')
                    : (isDark ? 'text-neutral-400 hover:text-white font-medium' : 'text-neutral-600 hover:text-neutral-950 font-medium')
                )}
              >
                {/* Active Sliding Pill Indicator with Single Smooth Spring Motion */}
                {isCurrentActive && (
                  <motion.div
                    layoutId="navbar-active-capsule"
                    className={cn(
                      'absolute inset-0 rounded-full -z-10 shadow-xs pointer-events-none',
                      isDark
                        ? 'bg-white/[0.16] border border-white/[0.22] shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]'
                        : 'bg-neutral-900/[0.08] border border-neutral-900/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]'
                    )}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.75
                    }}
                  />
                )}

                {/* Hover Gliding Pill (Fade on inactive hover without competing layoutId) */}
                {!isCurrentActive && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute inset-0 rounded-full -z-10 pointer-events-none',
                      isDark
                        ? 'bg-white/[0.06]'
                        : 'bg-neutral-900/[0.035]'
                    )}
                  />
                )}

                {/* Subtle Live Status Pulse Dot for Live Matrix (Strictly Single Line) */}
                {link.id === 'live-matrix' && (
                  <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                    <span className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                      isCurrentActive ? 'bg-emerald-400' : 'bg-neutral-400 dark:bg-neutral-500'
                    )} />
                    <span className={cn(
                      'relative inline-flex rounded-full h-1.5 w-1.5',
                      isCurrentActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-neutral-400 dark:bg-neutral-500'
                    )} />
                  </span>
                )}

                <span className="whitespace-nowrap select-none font-semibold tracking-[-0.01em]">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Theme Toggle & Signature Capsule Action Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Smooth Animated Theme Toggle Button */}
          <motion.div variants={itemEntranceVariants}>
            <AnimatedThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
            />
          </motion.div>

          {/* High-Contrast Capsule Account Button */}
          {isAuthenticated ? (
            <motion.button
              variants={itemEntranceVariants}
              type="button"
              onClick={onNavigateDashboard}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={cn(
                'h-10 sm:h-11 inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 cursor-pointer shadow-sm group select-none font-nav',
                isDark
                  ? 'bg-[#181B24] border border-white/15 text-white hover:border-white/30 hover:bg-[#202532] shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
                  : 'bg-[#0B0D14] text-white hover:bg-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.18)]'
              )}
            >
              <LayoutGrid className="h-4 w-4 text-neutral-300 shrink-0 transition-transform duration-200 group-hover:rotate-6" />
              <span className="truncate max-w-[110px] sm:max-w-[150px] md:max-w-[180px] font-semibold text-white tracking-[-0.01em]">
                {user?.email || 'admin@pointx.gg'}
              </span>
              <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200 ease-out shrink-0" />
            </motion.button>
          ) : (
            <motion.button
              variants={itemEntranceVariants}
              type="button"
              onClick={onNavigateLogin}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={cn(
                'h-10 sm:h-11 inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 cursor-pointer shadow-sm group select-none font-nav',
                isDark
                  ? 'bg-[#181B24] border border-white/15 text-white hover:border-white/30 hover:bg-[#202532] shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
                  : 'bg-[#0B0D14] text-white hover:bg-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.18)]'
              )}
            >
              <LogIn className="h-4 w-4 text-[#ffd000] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline font-semibold tracking-[-0.01em]">Organizer Sign In</span>
              <span className="sm:hidden font-semibold">Sign In</span>
            </motion.button>
          )}

          {/* Morphing Mobile Menu Hamburger Button (☰ ↔ ✕) */}
          <div className="md:hidden">
            <AnimatedHamburger
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                'h-8 w-8 sm:h-9 sm:w-9',
                isDark
                  ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-black/5'
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* Smooth Mobile Slide-Down Drawer with Staggered Entrance & Exit */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileDrawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'pointer-events-auto w-full max-w-[920px] mt-2 rounded-3xl p-4 space-y-2 backdrop-blur-2xl shadow-2xl md:hidden overflow-hidden font-nav',
              isDark
                ? 'bg-[#101319]/98 border border-white/15 text-white'
                : 'bg-white/98 border border-black/10 text-neutral-950 shadow-[0_16px_40px_rgba(0,0,0,0.12)]'
            )}
          >
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const isCurrentActive = activeSection === link.id;

                return (
                  <motion.a
                    key={link.id}
                    variants={mobileDrawerItemVariants}
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href, link.id)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all cursor-pointer select-none',
                      isDark
                        ? (isCurrentActive ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:bg-white/5 hover:text-white')
                        : (isCurrentActive ? 'bg-black/[0.07] text-neutral-950 font-bold' : 'text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950')
                    )}
                  >
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      {link.id === 'live-matrix' && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                      <span className="whitespace-nowrap">{link.label}</span>
                    </div>
                    {isCurrentActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#ffd000] shadow-[0_0_8px_rgba(255,208,0,0.8)] shrink-0" />
                    )}
                  </motion.a>
                );
              })}
            </nav>

            <motion.div
              variants={mobileDrawerItemVariants}
              className="pt-3 border-t border-[var(--border-subtle)]"
            >
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
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-xs font-black bg-[#0B0D14] dark:bg-[#181B24] text-white shadow-md font-nav uppercase tracking-wider cursor-pointer active:scale-[0.98] transition-transform"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutGrid className="h-4 w-4 text-[#ffd000]" />
                    <span>Enter Organizer Console</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 text-[#ffd000]" />
                    <span>Sign In to PointX Arena</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default HomeNavbar;

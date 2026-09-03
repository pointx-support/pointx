import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MOTION_EASINGS } from './motionTokens';
import { haptics } from '../../lib/haptics';

export interface AnimatedThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedThemeToggle: React.FC<AnimatedThemeToggleProps> = ({
  isDark,
  onToggle,
  className = '',
  size = 'md'
}) => {
  const prefersReducedMotion = useReducedMotion();
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';

  return (
    <motion.button
      type="button"
      onClick={() => {
        haptics.medium();
        onToggle();
      }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.08 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 450, damping: 26 }}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd000]',
        isDark
          ? 'text-neutral-300 hover:text-white hover:bg-white/10 active:bg-white/15'
          : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.05] active:bg-neutral-900/[0.08]',
        buttonSize,
        className
      )}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Color Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={prefersReducedMotion ? { opacity: 0 } : { rotate: -100, scale: 0.5, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { rotate: 100, scale: 0.5, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.38,
              ease: MOTION_EASINGS.outExpo
            }}
            className="flex items-center justify-center"
          >
            <Sun className={cn(iconSize, 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]')} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={prefersReducedMotion ? { opacity: 0 } : { rotate: 100, scale: 0.5, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { rotate: -100, scale: 0.5, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.38,
              ease: MOTION_EASINGS.outExpo
            }}
            className="flex items-center justify-center"
          >
            <Moon className={cn(iconSize, 'text-neutral-800')} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

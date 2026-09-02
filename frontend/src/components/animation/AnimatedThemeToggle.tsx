import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { MOTION_SPRINGS } from './motionTokens';

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
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-colors cursor-pointer select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
        isDark
          ? 'text-zinc-300 hover:text-white hover:bg-white/10'
          : 'text-zinc-600 hover:text-black hover:bg-black/5',
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
            initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
            transition={MOTION_SPRINGS.snappy}
            className="flex items-center justify-center"
          >
            <Sun className={cn(iconSize, 'text-amber-400')} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
            transition={MOTION_SPRINGS.snappy}
            className="flex items-center justify-center"
          >
            <Moon className={cn(iconSize, 'text-zinc-800')} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

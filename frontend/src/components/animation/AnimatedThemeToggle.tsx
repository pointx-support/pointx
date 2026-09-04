import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';
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

  // Premium Switch UI dimensions & proportions matching reference
  const dimensions = {
    sm: {
      track: 'w-[54px] h-[28px] p-[2px]',
      blob: 'w-[24px] h-[24px]',
      travel: 26,
      icon: 'h-3 w-3',
      iconBox: 'w-[24px] h-[24px]'
    },
    md: {
      track: 'w-[64px] h-[32px] p-[3px]',
      blob: 'w-[26px] h-[26px]',
      travel: 32,
      icon: 'h-3.5 w-3.5',
      iconBox: 'w-[26px] h-[26px]'
    },
    lg: {
      track: 'w-[76px] h-[38px] p-[3.5px]',
      blob: 'w-[31px] h-[31px]',
      travel: 38,
      icon: 'h-4 w-4',
      iconBox: 'w-[31px] h-[31px]'
    }
  }[size];

  const handleToggle = () => {
    haptics.medium();
    onToggle();
  };

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      onClick={handleToggle}
      whileTap={prefersReducedMotion ? {} : { scale: 0.94 }}
      className={cn(
        'relative rounded-full inline-flex items-center cursor-pointer select-none transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd000]',
        dimensions.track,
        isDark
          ? 'border border-white/10'
          : 'border border-black/[0.08]',
        className
      )}
      style={{
        background: isDark
          ? 'linear-gradient(145deg, #0e1117, #181d26)'
          : 'linear-gradient(145deg, #e6e9ee, #f5f7fa)',
        boxShadow: isDark
          ? 'inset 2px 2px 5px rgba(0, 0, 0, 0.75), inset -1px -1px 3px rgba(255, 255, 255, 0.08)'
          : 'inset 2px 2px 5px rgba(0, 0, 0, 0.15), inset -2px -2px 5px rgba(255, 255, 255, 0.95)'
      }}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {/* Stationary Inset Track Icons (Sun on Left, Moon on Right) */}
      <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
        {/* Left: Inactive Sun Outline (visible when in dark mode) */}
        <div className={cn('flex items-center justify-center', dimensions.iconBox)}>
          <Sun
            className={cn(
              dimensions.icon,
              'transition-opacity duration-200',
              isDark ? 'opacity-40 text-neutral-400' : 'opacity-0'
            )}
            strokeWidth={2.4}
          />
        </div>

        {/* Right: Inactive Moon Outline (visible when in light mode) */}
        <div className={cn('flex items-center justify-center', dimensions.iconBox)}>
          <Moon
            className={cn(
              dimensions.icon,
              'transition-opacity duration-200',
              !isDark ? 'opacity-40 text-neutral-500' : 'opacity-0'
            )}
            strokeWidth={2.4}
          />
        </div>
      </div>

      {/* Animated 3D Sliding Knob ("Blob") */}
      <motion.div
        animate={{
          x: isDark ? dimensions.travel : 0
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0.12 }
            : { type: 'spring', stiffness: 500, damping: 28 }
        }
        className={cn(
          'relative rounded-full flex items-center justify-center shrink-0 z-10',
          dimensions.blob
        )}
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #38bdf8, #1d4ed8)'
            : 'linear-gradient(145deg, #ffc85a, #ed8b00)',
          boxShadow: isDark
            ? '2px 4px 10px rgba(29, 78, 216, 0.55), 0 1px 2px rgba(0, 0, 0, 0.35)'
            : '2px 4px 10px rgba(237, 139, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Active Icon Inside 3D Knob */}
        {isDark ? (
          <motion.div
            key="active-moon"
            initial={{ scale: 0.7, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Moon className={cn(dimensions.icon, 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]')} strokeWidth={2.5} />
          </motion.div>
        ) : (
          <motion.div
            key="active-sun"
            initial={{ scale: 0.7, rotate: 25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Sun className={cn(dimensions.icon, 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]')} strokeWidth={2.5} />
          </motion.div>
        )}
      </motion.div>
    </motion.button>
  );
};

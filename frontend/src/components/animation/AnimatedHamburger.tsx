import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { MOTION_SPRINGS } from './motionTokens';

export interface AnimatedHamburgerProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
  lineClassName?: string;
  size?: number;
  'aria-label'?: string;
}

export const AnimatedHamburger: React.FC<AnimatedHamburgerProps> = ({
  isOpen,
  onClick,
  className = '',
  lineClassName = 'bg-current',
  'aria-label': ariaLabel = 'Toggle Menu'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col justify-center items-center w-8 h-8 rounded-full transition-colors cursor-pointer select-none focus:outline-none',
        className
      )}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
    >
      <div className="relative w-5 h-4 flex flex-col justify-between items-center pointer-events-none">
        {/* Top Line */}
        <motion.span
          className={cn('w-5 h-[2px] rounded-full origin-center', lineClassName)}
          animate={
            isOpen
              ? { rotate: 45, y: 7 }
              : { rotate: 0, y: 0 }
          }
          transition={MOTION_SPRINGS.snappy}
        />

        {/* Middle Line */}
        <motion.span
          className={cn('w-5 h-[2px] rounded-full origin-center', lineClassName)}
          animate={
            isOpen
              ? { opacity: 0, scaleX: 0 }
              : { opacity: 1, scaleX: 1 }
          }
          transition={{ duration: 0.15 }}
        />

        {/* Bottom Line */}
        <motion.span
          className={cn('w-5 h-[2px] rounded-full origin-center', lineClassName)}
          animate={
            isOpen
              ? { rotate: -45, y: -7 }
              : { rotate: 0, y: 0 }
          }
          transition={MOTION_SPRINGS.snappy}
        />
      </div>
    </button>
  );
};

import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export interface MagneticButtonProps {
  strength?: number;
  radius?: number;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * High-performance Magnetic Button:
 * Uses direct GPU transforms via requestAnimationFrame.
 * ZERO React state updates on mouse move.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  strength = 0.25,
  radius = 100,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (distance < radius) {
      const targetX = distanceX * strength;
      const targetY = distanceY * strength;
      rafRef.current = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translate3d(${targetX.toFixed(2)}px, ${targetY.toFixed(2)}px, 0)`;
        }
      });
    } else {
      rafRef.current = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    }
  };

  const handleMouseEnter = () => {
    if (ref.current) {
      ref.current.style.transition = 'transform 100ms cubic-bezier(0.2, 0, 0.2, 1)';
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (ref.current) {
      ref.current.style.transition = 'transform 250ms cubic-bezier(0.2, 0, 0.2, 1)';
      ref.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  if (prefersReducedMotion) {
    return (
      <div onClick={onClick} className={cn('inline-block', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform' }}
      className={cn('inline-block cursor-pointer transform-gpu', className)}
    >
      {children}
    </div>
  );
};

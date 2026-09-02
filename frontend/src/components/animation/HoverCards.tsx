import React, { useRef, useEffect } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export interface TiltCardProps {
  maxRotation?: number;
  perspective?: number;
  scaleOnHover?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * High-performance 3D Tilt Card:
 * Operates purely via direct GPU transform manipulation in requestAnimationFrame.
 * ZERO React state updates on mouse move = ZERO re-renders during interaction.
 */
export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  maxRotation = 8,
  perspective = 1000,
  scaleOnHover = 1.02,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current || !innerRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxRotation;
    const rotateY = ((x - centerX) / centerX) * maxRotation;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, 1)`;
      }
    });
  };

  const handleMouseEnter = () => {
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 120ms cubic-bezier(0.2, 0, 0.2, 1)';
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)';
      innerRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  if (prefersReducedMotion) {
    return <div className={cn('rounded-2xl', className)}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: `${perspective}px` }}
      className="w-full transform-gpu"
    >
      <div
        ref={innerRef}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        className={cn('w-full transition-transform duration-150 ease-out', className)}
      >
        {children}
      </div>
    </div>
  );
};

export interface GlowHoverProps {
  glowColor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * High-performance Glow Hover:
 * Updates radial gradient coordinates via direct CSS custom properties.
 * ZERO React state updates on mouse move.
 */
export const GlowHover: React.FC<GlowHoverProps> = ({
  children,
  className,
  glowColor = 'rgba(245, 158, 11, 0.12)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty('--glow-x', `${x}px`);
    containerRef.current.style.setProperty('--glow-y', `${y}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn('relative overflow-hidden rounded-2xl group/glow', className)}
      style={
        {
          '--glow-color': glowColor,
          '--glow-x': '-1000px',
          '--glow-y': '-1000px',
        } as React.CSSProperties
      }
    >
      {!prefersReducedMotion && (
        <div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover/glow:opacity-100 transition-opacity duration-300 transform-gpu"
          style={{
            background: `radial-gradient(350px circle at var(--glow-x) var(--glow-y), var(--glow-color), transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

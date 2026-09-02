import React, { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className,
  prefix = '',
  suffix = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  const [displayValue, setDisplayValue] = useState<string>(() => value.toLocaleString());

  useEffect(() => {
    if (prefersReducedMotion) return;
    spring.set(value);
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [value, prefersReducedMotion, spring, display]);

  const outputValue = prefersReducedMotion ? value.toLocaleString() : displayValue;

  return (
    <span className={cn('font-mono font-bold tracking-tight', className)}>
      {prefix}
      {outputValue}
      {suffix}
    </span>
  );
};

export interface PulseIndicatorProps {
  status?: 'active' | 'warning' | 'danger' | 'info';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  status = 'active',
  className,
  size = 'md',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const colorMap = {
    active: 'bg-[var(--status-live)]',
    warning: 'bg-[var(--status-warning)]',
    danger: 'bg-[var(--status-danger)]',
    info: 'bg-[var(--status-info)]',
  }[status];

  const sizeMap = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3.5 w-3.5',
  }[size];

  return (
    <span className={cn('relative inline-flex', sizeMap, className)}>
      {!prefersReducedMotion && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            colorMap
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-full w-full', colorMap)} />
    </span>
  );
};

export interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!prefersReducedMotion) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center font-bold transition-all select-none cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/25 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            width: 150,
            height: 150,
          }}
        />
      ))}
    </button>
  );
};

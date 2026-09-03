import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and efficiently merges conflicting Tailwind CSS utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Triggers a subtle tactile haptic vibration on mobile devices
 */
export function triggerHaptic(duration = 12): void {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate?.(duration);
    } catch {
      // Haptics not allowed or unsupported
    }
  }
}

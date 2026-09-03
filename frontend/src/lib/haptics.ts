/**
 * PointX Smart Centralized Haptics Feedback System
 * 
 * Provides tactile, premium micro-vibrations across mobile & touch devices.
 * Features:
 * - Differentiated patterns: light (nav/tabs), medium (toggles/buttons), selection (steppers), success (saves/completes), error (invalid actions)
 * - Cooldown deduplication (prevents double-vibrations from multi-bubbling handlers)
 * - prefers-reduced-motion accessibility respect
 * - Graceful no-op on desktop or unsupported browsers (100% crash-proof)
 */

export type HapticType = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

// Standardized subtle vibration patterns (in milliseconds)
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  selection: 6,                     // Micro tick for steppers, tabs, alive switches
  light: 9,                         // Soft tap for navigation, mobile menu, button presses
  medium: 16,                       // Firm crisp tap for primary CTAs, theme switches, toggles
  success: [10, 45, 16],            // Double-pulse for successful submission, match saved, booyah
  warning: [18, 50, 18],            // Double warning pulse
  error: [28, 60, 28, 60, 36],      // Tri-pulse for invalid actions or form errors
};

// Global cooldown tracker to eliminate duplicate vibrations from rapid bubbling
let lastVibrationTimestamp = 0;
const GLOBAL_COOLDOWN_MS = 45;

/**
 * Checks if haptics are supported and permitted in the current environment
 */
export function isHapticsSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  // Must support navigator.vibrate
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  // Respect user preference for reduced motion/sensory stimulation
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
  } catch {
    // Ignore matchMedia evaluation errors
  }

  // Check optional local storage override
  try {
    const disabled = window.localStorage.getItem('pointx_haptics_enabled');
    if (disabled === 'false') {
      return false;
    }
  } catch {
    // Ignore storage access errors
  }

  return true;
}

/**
 * Triggers an intelligent haptic vibration pattern with debounce protection
 */
export function triggerHaptic(type: HapticType | number = 'light'): void {
  if (!isHapticsSupported()) return;

  const now = performance.now();
  if (now - lastVibrationTimestamp < GLOBAL_COOLDOWN_MS) {
    return; // Suppress duplicate vibration within cooldown window
  }
  lastVibrationTimestamp = now;

  try {
    const pattern = typeof type === 'number' ? type : HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;
    navigator.vibrate(pattern);
  } catch {
    // Graceful no-op on platforms blocking vibration
  }
}

/**
 * High-level ergonomic haptics API
 */
export const haptics = {
  /** 6ms micro-tick for numeric steppers, alive toggles, table tabs */
  selection: () => triggerHaptic('selection'),
  /** 9ms soft tap for general buttons, navigation items, mobile drawer */
  light: () => triggerHaptic('light'),
  /** 16ms firm crisp tap for primary CTAs, theme toggles, modal confirms */
  medium: () => triggerHaptic('medium'),
  /** [10, 45, 16] double pulse for form success, match completion, tournament created */
  success: () => triggerHaptic('success'),
  /** [18, 50, 18] double pulse for warnings */
  warning: () => triggerHaptic('warning'),
  /** [28, 60, 28, 60, 36] triple pulse for validation errors or invalid actions */
  error: () => triggerHaptic('error'),
  /** Custom duration or pattern */
  custom: (pattern: number | number[]) => {
    if (!isHapticsSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // No-op
    }
  },
  /** Global check */
  isSupported: isHapticsSupported,
};

/**
 * Higher-order helper for onClick handlers to cleanly trigger haptics
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler?: T,
  type: HapticType = 'light'
): (...args: Parameters<T>) => ReturnType<T> | void {
  return (...args: Parameters<T>) => {
    triggerHaptic(type);
    if (handler) {
      return handler(...args);
    }
  };
}

export default haptics;
